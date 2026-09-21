import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';

interface ServerCloudConfig {
  projectId: string;
  databaseURL: string;
  serviceAccountKeyJson?: string;
  connected: boolean;
  syncStatus: string;
  syncMode?: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface AdminCredentials {
  username: string;
  password?: string;
  mustChangePassword: boolean;
  updatedAt?: string;
}

const CONFIG_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'system_cloud_config.json');
const CREDS_FILE = path.join(CONFIG_DIR, 'admin_credentials.json');

function ensureDataDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    try {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    } catch (e) {
      // Ephemeral environments like Netlify may restrict root filesystem
    }
  }
}

function getSafeBlobStore() {
  try {
    if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT) {
      return getStore({ name: 'vypaarmitra-system', consistency: 'strong' });
    }
  } catch (err) {
    // Non-Netlify environment fallback
  }
  return null;
}

function getEnvCloudConfig(): ServerCloudConfig | null {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

  if (projectId) {
    return {
      projectId: projectId.trim(),
      databaseURL: (databaseURL || `https://${projectId.trim()}-default-rtdb.firebaseio.com`).trim(),
      serviceAccountKeyJson: serviceAccount?.trim() || '',
      connected: true,
      syncStatus: 'CONNECTED',
      syncMode: 'DUAL_SYNC',
      updatedAt: new Date().toISOString(),
      updatedBy: 'ENVIRONMENT_VARIABLES',
    };
  }
  return null;
}

function loadSavedConfig(): ServerCloudConfig | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    // silent
  }
  return null;
}

function loadSavedAdminCredentials(): AdminCredentials | null {
  try {
    if (fs.existsSync(CREDS_FILE)) {
      const raw = fs.readFileSync(CREDS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    // silent
  }
  return null;
}

export async function GET() {
  try {
    const blobStore = getSafeBlobStore();
    let cloudConfig: ServerCloudConfig | null = null;
    let adminCredentials: AdminCredentials | null = null;

    // 1. Try Netlify Blobs if in Netlify environment
    if (blobStore) {
      try {
        const remoteConfig = await blobStore.get('cloud_config', { type: 'json' });
        if (remoteConfig && typeof remoteConfig === 'object') {
          cloudConfig = remoteConfig as ServerCloudConfig;
        }
        const remoteCreds = await blobStore.get('admin_creds', { type: 'json' });
        if (remoteCreds && typeof remoteCreds === 'object') {
          adminCredentials = remoteCreds as AdminCredentials;
        }
      } catch (blobErr) {
        console.warn('Netlify Blobs read notice:', blobErr);
      }
    }

    // 2. Fallback to server local file
    if (!cloudConfig) {
      cloudConfig = loadSavedConfig();
    }
    if (!adminCredentials) {
      adminCredentials = loadSavedAdminCredentials();
    }

    // 3. Fallback to environment variables for cloud config
    if (!cloudConfig) {
      cloudConfig = getEnvCloudConfig();
    }

    return NextResponse.json({
      success: true,
      configured: Boolean(cloudConfig && cloudConfig.connected && cloudConfig.projectId),
      config: cloudConfig || null,
      adminCredentials: adminCredentials || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error fetching server cloud config' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, config, credentials } = body;
    const blobStore = getSafeBlobStore();

    ensureDataDir();

    // -------------------------------------------------------------------------
    // A. UPDATE ADMIN CREDENTIALS (Ensures Device 2 doesn't ask for password change)
    // -------------------------------------------------------------------------
    if (action === 'UPDATE_ADMIN_CREDENTIALS' && credentials) {
      const updatedCreds: AdminCredentials = {
        username: credentials.username || 'adminn',
        password: credentials.password,
        mustChangePassword: Boolean(credentials.mustChangePassword),
        updatedAt: new Date().toISOString(),
      };

      // Save to Netlify Blobs
      if (blobStore) {
        try {
          await blobStore.setJSON('admin_creds', updatedCreds);
        } catch (e) {
          console.warn('Blobs admin creds write notice:', e);
        }
      }

      // Save to server file
      try {
        fs.writeFileSync(CREDS_FILE, JSON.stringify(updatedCreds, null, 2), 'utf-8');
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: 'Admin credentials synchronized across all devices.',
        adminCredentials: {
          username: updatedCreds.username,
          mustChangePassword: updatedCreds.mustChangePassword,
        },
      });
    }

    // -------------------------------------------------------------------------
    // B. DISCONNECT FIREBASE
    // -------------------------------------------------------------------------
    if (action === 'DISCONNECT') {
      const disconnectedState: ServerCloudConfig = {
        projectId: '',
        databaseURL: '',
        serviceAccountKeyJson: '',
        connected: false,
        syncStatus: 'DISCONNECTED',
        syncMode: 'DUAL_SYNC',
        updatedAt: new Date().toISOString(),
        updatedBy: 'SUPER_ADMIN_MANUAL_DISCONNECT',
      };

      if (blobStore) {
        try {
          await blobStore.setJSON('cloud_config', disconnectedState);
        } catch (e) {}
      }

      try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(disconnectedState, null, 2), 'utf-8');
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: 'Server cloud configuration disconnected for all devices.',
        config: disconnectedState,
      });
    }

    // -------------------------------------------------------------------------
    // C. SAVE FIREBASE CONFIGURATION
    // -------------------------------------------------------------------------
    if (config && config.projectId) {
      const cleanConfig: ServerCloudConfig = {
        projectId: config.projectId.trim(),
        databaseURL: (config.databaseURL || `https://${config.projectId.trim()}-default-rtdb.firebaseio.com`).trim(),
        serviceAccountKeyJson: config.serviceAccountKeyJson?.trim() || '',
        connected: config.connected !== false,
        syncStatus: config.connected !== false ? 'CONNECTED' : 'DISCONNECTED',
        syncMode: config.syncMode || 'DUAL_SYNC',
        updatedAt: new Date().toISOString(),
        updatedBy: config.updatedBy || 'SUPER_ADMIN',
      };

      if (blobStore) {
        try {
          await blobStore.setJSON('cloud_config', cleanConfig);
        } catch (e) {
          console.warn('Blobs cloud config write notice:', e);
        }
      }

      try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(cleanConfig, null, 2), 'utf-8');
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: 'Server cloud configuration saved. All devices will automatically connect to this Firebase database.',
        config: cleanConfig,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error updating server cloud config' },
      { status: 500 }
    );
  }
}
