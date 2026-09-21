import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

const CONFIG_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'system_cloud_config.json');

function ensureDataDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
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
    console.warn('Could not read system_cloud_config.json:', err);
  }
  return null;
}

export async function GET() {
  try {
    // 1. Check saved file first
    const saved = loadSavedConfig();
    if (saved && saved.projectId) {
      return NextResponse.json({
        success: true,
        configured: Boolean(saved.connected),
        config: saved,
        source: 'SERVER_PERSISTENT_FILE',
      });
    }

    // 2. Check environment variables
    const envConfig = getEnvCloudConfig();
    if (envConfig) {
      return NextResponse.json({
        success: true,
        configured: true,
        config: envConfig,
        source: 'ENVIRONMENT_VARIABLES',
      });
    }

    return NextResponse.json({
      success: true,
      configured: false,
      config: null,
      message: 'No server-wide Firebase configuration initialized yet.',
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
    const { action, config } = body;

    ensureDataDir();

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
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(disconnectedState, null, 2), 'utf-8');
      return NextResponse.json({
        success: true,
        message: 'Server cloud configuration disconnected & cleared for all devices.',
        config: disconnectedState,
      });
    }

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

      fs.writeFileSync(CONFIG_FILE, JSON.stringify(cleanConfig, null, 2), 'utf-8');

      return NextResponse.json({
        success: true,
        message: 'Server cloud configuration saved. All devices will automatically connect to this Firebase database.',
        config: cleanConfig,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid config payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error updating server cloud config' },
      { status: 500 }
    );
  }
}
