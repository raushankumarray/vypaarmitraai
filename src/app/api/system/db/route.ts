import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';

// Path for persistent filesystem storage (Render, VPS, Docker, Local Dev)
const DATA_DIR = path.join(process.cwd(), 'data');
const MASTER_DB_FILE = path.join(DATA_DIR, 'vypaarmitra_master_db.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      // Serverless environments may restrict root filesystem writes
    }
  }
}

function getSafeBlobStore() {
  try {
    if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT) {
      return getStore({ name: 'vypaarmitra-database', consistency: 'strong' });
    }
  } catch (err) {
    // Non-Netlify environment fallback
  }
  return null;
}

// Global in-memory cache
let inMemoryMasterDb: any = null;

const INITIAL_MASTER_ADMIN = {
  id: 'usr_superadmin_bootstrap',
  username: 'adminn',
  email: 'admin@npbmedia.com',
  mobile: '9876543210',
  name: 'NPB Master Administrator',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  permissions: ['*'],
  mustChangePassword: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const CREDS_FILE = path.join(DATA_DIR, 'admin_credentials.json');

function getSavedAdminCreds(): { password: string; mustChangePassword: boolean } | null {
  try {
    if (fs.existsSync(CREDS_FILE)) {
      const raw = fs.readFileSync(CREDS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.password) {
        return {
          password: parsed.password,
          mustChangePassword: Boolean(parsed.mustChangePassword),
        };
      }
    }
  } catch (e) {}
  return null;
}

function createInitialSeedDb(): any {
  const savedCreds = getSavedAdminCreds();
  const masterAdmin = {
    ...INITIAL_MASTER_ADMIN,
    mustChangePassword: savedCreds ? savedCreds.mustChangePassword : true,
  };
  const masterPass = savedCreds ? savedCreds.password : 'Admin@88';

  return {
    users: {
      [INITIAL_MASTER_ADMIN.id]: masterAdmin,
    },
    userCredentials: {
      [INITIAL_MASTER_ADMIN.id]: masterPass,
    },
    companies: {},
    plans: {},
    products: {},
    stockMovements: {},
    sales: {},
    purchases: {},
    customers: {},
    suppliers: {},
    expenses: {},
    attendance: {},
    supportTickets: {},
    businessTypes: {},
    auditLogs: {},
    systemSettings: {
      appName: 'VYPAARMITRA AI',
      parentCompany: 'NPB MEDIA',
      tagline: 'Smart Business Management for Every Business',
      logoUrl: '/logo.png',
      firebaseCloud: {
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'vypaarmitra-prod',
        databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://vypaarmitra-prod-default-rtdb.firebaseio.com',
        serviceAccountKeyJson: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '',
        connected: Boolean(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
        syncStatus: Boolean(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ? 'CONNECTED' : 'DISCONNECTED',
        syncMode: 'DUAL_SYNC',
      },
    },
    lastUpdated: new Date().toISOString(),
  };
}

// Load database from Blobs -> Filesystem -> In-Memory -> Initial Seed
async function loadMasterDatabase(): Promise<any> {
  const blobStore = getSafeBlobStore();

  // 1. Try Netlify Blobs (for Netlify serverless deployment)
  if (blobStore) {
    try {
      const remoteData = await blobStore.get('master_db', { type: 'json' });
      if (remoteData && typeof remoteData === 'object' && Object.keys(remoteData).length > 0) {
        inMemoryMasterDb = remoteData;
        return inMemoryMasterDb;
      }
    } catch (blobErr) {
      console.warn('[DB] Netlify Blobs read notice:', blobErr);
    }
  }

  // 2. Try Local Filesystem (for Render, VPS, Docker, Local Dev)
  try {
    if (fs.existsSync(MASTER_DB_FILE)) {
      const raw = fs.readFileSync(MASTER_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        inMemoryMasterDb = parsed;
        return inMemoryMasterDb;
      }
    }
  } catch (fsErr) {
    console.warn('[DB] Filesystem read notice:', fsErr);
  }

  // 3. Fallback to memory or create seed
  if (!inMemoryMasterDb) {
    inMemoryMasterDb = createInitialSeedDb();
    await saveMasterDatabase(inMemoryMasterDb);
  }

  return inMemoryMasterDb;
}

// Save database to Blobs, Filesystem, and In-Memory
async function saveMasterDatabase(data: any): Promise<void> {
  if (!data || typeof data !== 'object') return;
  data.lastUpdated = new Date().toISOString();
  inMemoryMasterDb = data;

  const blobStore = getSafeBlobStore();

  // 1. Save to Netlify Blobs
  if (blobStore) {
    try {
      await blobStore.setJSON('master_db', data);
    } catch (blobErr) {
      console.warn('[DB] Netlify Blobs write notice:', blobErr);
    }
  }

  // 2. Save to Filesystem (for Render, VPS, Docker)
  try {
    ensureDataDir();
    fs.writeFileSync(MASTER_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (fsErr) {
    // Ephemeral serverless read-only disk
  }
}

// ---------------------------------------------------------------------------
// GET: Returns Authoritative Master Database State
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const db = await loadMasterDatabase();
    return NextResponse.json({
      success: true,
      data: db,
      timestamp: db.lastUpdated || new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error loading master database' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST: Actions (AUTH, SYNC_ALL, SYNC_RECORD, DELETE_RECORD, UPDATE_PASSWORD)
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, identifier, password, userId, mustChangePassword, collection, id, ids, data, state } = body;
    const db = await loadMasterDatabase();

    // =========================================================================
    // 1. AUTHENTICATE USER (Central server authentication across all devices)
    // =========================================================================
    if (action === 'AUTH') {
      const cleanId = (identifier || '').trim().toLowerCase();
      const cleanDigits = (identifier || '').replace(/\D/g, '');

      const userList = Object.values(db.users || {}) as any[];
      const foundUser = userList.find((u: any) => {
        if (!u) return false;
        if (u.username && u.username.toLowerCase() === cleanId) return true;
        if (u.email && u.email.toLowerCase() === cleanId) return true;
        if (u.id && u.id.toLowerCase() === cleanId) return true;
        if (cleanDigits && u.mobile) {
          const uDigits = u.mobile.replace(/\D/g, '');
          if (uDigits === cleanDigits || uDigits.endsWith(cleanDigits) || cleanDigits.endsWith(uDigits)) {
            return true;
          }
        }
        return false;
      });

      if (!foundUser) {
        return NextResponse.json({
          success: false,
          error: 'No account found with this username, email, or mobile number.',
        });
      }

      const storedPass = db.userCredentials?.[foundUser.id];
      if (storedPass !== password) {
        return NextResponse.json({
          success: false,
          error: 'Incorrect password. Please verify and try again.',
        });
      }

      if (foundUser.status !== 'ACTIVE' && foundUser.status !== 'PENDING_SETUP') {
        return NextResponse.json({
          success: false,
          error: 'This account has been suspended or blocked. Please contact administrator.',
        });
      }

      const company = foundUser.companyId ? db.companies?.[foundUser.companyId] : null;

      return NextResponse.json({
        success: true,
        user: foundUser,
        company: company || null,
        mustChangePassword: Boolean(foundUser.mustChangePassword),
        masterState: db, // Provide latest database state to immediately hydrate Device 2
      });
    }

    // =========================================================================
    // 2. UPDATE PASSWORD (Persists across all devices; disables force-password-change)
    // =========================================================================
    if (action === 'UPDATE_PASSWORD') {
      if (!userId || !password) {
        return NextResponse.json({ success: false, message: 'Missing userId or password' }, { status: 400 });
      }

      if (!db.userCredentials) db.userCredentials = {};
      db.userCredentials[userId] = password;

      if (db.users?.[userId]) {
        db.users[userId].mustChangePassword = Boolean(mustChangePassword);
        db.users[userId].updatedAt = new Date().toISOString();
      }

      // Persist to admin_credentials.json if super admin
      if (userId === INITIAL_MASTER_ADMIN.id || db.users?.[userId]?.role === 'SUPER_ADMIN') {
        try {
          ensureDataDir();
          fs.writeFileSync(
            CREDS_FILE,
            JSON.stringify(
              {
                username: db.users?.[userId]?.username || 'adminn',
                password,
                mustChangePassword: Boolean(mustChangePassword),
                updatedAt: new Date().toISOString(),
              },
              null,
              2
            ),
            'utf-8'
          );
        } catch (e) {}
      }

      await saveMasterDatabase(db);

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully across all devices.',
        mustChangePassword: Boolean(mustChangePassword),
      });
    }

    // =========================================================================
    // 3. SYNC RECORD (Single record update across all devices)
    // =========================================================================
    if (action === 'SYNC_RECORD') {
      if (!collection || !id) {
        return NextResponse.json({ success: false, message: 'Missing collection or id' }, { status: 400 });
      }

      if (!db[collection]) db[collection] = {};
      db[collection][id] = data;

      await saveMasterDatabase(db);

      return NextResponse.json({
        success: true,
        message: `Synced ${collection}/${id} to central database.`,
      });
    }

    // =========================================================================
    // 4. DELETE RECORD (Permanent deletion across all devices)
    // =========================================================================
    if (action === 'DELETE_RECORD') {
      if (!collection || !id) {
        return NextResponse.json({ success: false, message: 'Missing collection or id' }, { status: 400 });
      }

      if (db[collection] && db[collection][id]) {
        delete db[collection][id];
        await saveMasterDatabase(db);
      }

      return NextResponse.json({
        success: true,
        message: `Permanently deleted ${collection}/${id} from central database.`,
      });
    }

    // =========================================================================
    // 5. DELETE RECORDS (Batch permanent delete)
    // =========================================================================
    if (action === 'DELETE_RECORDS') {
      if (!collection || !Array.isArray(ids)) {
        return NextResponse.json({ success: false, message: 'Missing collection or ids' }, { status: 400 });
      }

      if (db[collection]) {
        ids.forEach((recId: string) => {
          delete db[collection][recId];
        });
        await saveMasterDatabase(db);
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${ids.length} records from ${collection}.`,
      });
    }

    // =========================================================================
    // 6. SYNC ALL (Full dataset backup / restore)
    // =========================================================================
    if (action === 'SYNC_ALL') {
      if (!state || typeof state !== 'object') {
        return NextResponse.json({ success: false, message: 'Missing state payload' }, { status: 400 });
      }

      // Safeguard: Never allow uninitialized / stale clients to reset changed admin credentials or mustChangePassword
      const existingBootstrapUser = db.users?.[INITIAL_MASTER_ADMIN.id];
      const existingBootstrapCred = db.userCredentials?.[INITIAL_MASTER_ADMIN.id];

      const mergedUsers = { ...db.users, ...(state.users || {}) };
      const mergedCreds = { ...db.userCredentials, ...(state.userCredentials || {}) };

      if (existingBootstrapUser && existingBootstrapUser.mustChangePassword === false) {
        if (mergedUsers[INITIAL_MASTER_ADMIN.id]) {
          mergedUsers[INITIAL_MASTER_ADMIN.id] = {
            ...mergedUsers[INITIAL_MASTER_ADMIN.id],
            mustChangePassword: false,
          };
        }
      }
      if (existingBootstrapCred && existingBootstrapCred !== 'Admin@88') {
        mergedCreds[INITIAL_MASTER_ADMIN.id] = existingBootstrapCred;
      }

      const merged = {
        ...db,
        ...state,
        users: mergedUsers,
        userCredentials: mergedCreds,
        companies: { ...db.companies, ...(state.companies || {}) },
        plans: { ...db.plans, ...(state.plans || {}) },
        products: { ...db.products, ...(state.products || {}) },
        sales: { ...db.sales, ...(state.sales || {}) },
        purchases: { ...db.purchases, ...(state.purchases || {}) },
        customers: { ...db.customers, ...(state.customers || {}) },
        suppliers: { ...db.suppliers, ...(state.suppliers || {}) },
        expenses: { ...db.expenses, ...(state.expenses || {}) },
        attendance: { ...db.attendance, ...(state.attendance || {}) },
        supportTickets: { ...db.supportTickets, ...(state.supportTickets || {}) },
        businessTypes: { ...db.businessTypes, ...(state.businessTypes || {}) },
        systemSettings: { ...db.systemSettings, ...(state.systemSettings || {}) },
      };

      await saveMasterDatabase(merged);

      return NextResponse.json({
        success: true,
        message: 'All collections synchronized with central master database.',
      });
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('[DB API Error]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Server error processing database request' },
      { status: 500 }
    );
  }
}
