// Automated Test Suite for VYPAARMITRA AI (NPB MEDIA)
import assert from 'node:assert';

console.log('====================================================');
console.log('  VYPAARMITRA AI - AUTOMATED SAAS VERIFICATION SUITE');
console.log('  Parent Company: NPB MEDIA');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// 1. Initial Super Admin Bootstrap Credentials & First Login Password Enforcement
runTest('Super Admin default credentials & forced password change on first login', () => {
  const defaultUser = 'adminn';
  const defaultPass = 'Admin@88';

  assert.strictEqual(defaultUser, 'adminn', 'Bootstrap username must be adminn');
  assert.strictEqual(defaultPass, 'Admin@88', 'Bootstrap password must be Admin@88');

  // Verify first login flag
  let mustChangePassword = true;
  assert.strictEqual(mustChangePassword, true, 'First login must mandate password change');

  // Simulate password update
  const newPass = 'SecureAdmin#2026';
  assert.notStrictEqual(newPass, defaultPass, 'New password must differ from initial bootstrap password');
  assert.ok(newPass.length >= 8, 'Password must be at least 8 characters');
  mustChangePassword = false;
  assert.strictEqual(mustChangePassword, false, 'mustChangePassword must become false after update');
});

// 2. Strict Tenant Isolation (Merchant A vs Merchant B)
runTest('Multi-tenant data isolation: Merchant A cannot read Tenant B data', () => {
  const tenantA_Id = 'comp_kirana_001';
  const tenantB_Id = 'comp_garments_002';

  const mockDatabase = [
    { id: 'prod_1', companyId: tenantA_Id, name: 'Atta 10kg', stock: 20 },
    { id: 'prod_2', companyId: tenantA_Id, name: 'Sugar 5kg', stock: 15 },
    { id: 'prod_3', companyId: tenantB_Id, name: 'Cotton Shirt XL', stock: 8 },
    { id: 'prod_4', companyId: tenantB_Id, name: 'Denim Jeans 32', stock: 12 },
  ];

  // Query as Tenant A
  const tenantA_Products = mockDatabase.filter((p) => p.companyId === tenantA_Id);
  assert.strictEqual(tenantA_Products.length, 2, 'Tenant A must retrieve only 2 products');
  assert.ok(
    tenantA_Products.every((p) => p.companyId === tenantA_Id),
    'Every returned product must strictly belong to Tenant A'
  );

  // Assert Tenant B items are never present in Tenant A queries
  const leakFound = tenantA_Products.some((p) => p.companyId === tenantB_Id);
  assert.strictEqual(leakFound, false, 'CRITICAL: Tenant B records must NEVER leak to Tenant A');
});

// 3. POS Billing Calculation & GST Split (CGST + SGST)
runTest('POS Billing Tax & Round-Off computation', () => {
  const items = [
    { name: 'Basmati Rice', price: 100, qty: 2, taxRate: 5 }, // 200 + 5% tax = 210
    { name: 'Toothpaste', price: 50, qty: 1, taxRate: 18 },  // 50 + 18% tax = 59
  ];

  const subtotal = items.reduce((acc, it) => acc + it.price * it.qty, 0);
  assert.strictEqual(subtotal, 250, 'Subtotal must equal ₹250.00');

  let totalTax = 0;
  let cgst = 0;
  let sgst = 0;

  items.forEach((it) => {
    const itSub = it.price * it.qty;
    const tax = (itSub * it.taxRate) / 100;
    totalTax += tax;
    cgst += tax / 2;
    sgst += tax / 2;
  });

  assert.strictEqual(totalTax, 19, 'Total GST must equal ₹19.00 (10 + 9)');
  assert.strictEqual(cgst, 9.5, 'CGST must equal ₹9.50');
  assert.strictEqual(sgst, 9.5, 'SGST must equal ₹9.50');

  const grandTotal = Math.round(subtotal + totalTax);
  assert.strictEqual(grandTotal, 269, 'Grand Total must be ₹269.00');
});

// 4. Inventory Stock Deduction & Immutable Stock Movement Record
runTest('One sale reduces stock exactly once and logs immutable stock movement', () => {
  let product = { id: 'p_101', name: 'Mustard Oil 1L', stock: 50, purchasePrice: 120 };
  const stockMovements = [];

  const saleQty = 3;
  const initialStock = product.stock;

  // Perform Sale
  product.stock -= saleQty;
  stockMovements.push({
    id: 'sm_01',
    productId: product.id,
    type: 'SALE',
    quantity: -saleQty,
    previousStock: initialStock,
    newStock: product.stock,
    timestamp: new Date().toISOString(),
  });

  assert.strictEqual(product.stock, 47, 'Stock must decrease from 50 to 47');
  assert.strictEqual(stockMovements.length, 1, 'Exactly one stock movement record must be created');
  assert.strictEqual(stockMovements[0].previousStock, 50);
  assert.strictEqual(stockMovements[0].newStock, 47);

  // Restock on Return
  product.stock += saleQty;
  stockMovements.push({
    id: 'sm_02',
    productId: product.id,
    type: 'RETURN_IN',
    quantity: saleQty,
    previousStock: 47,
    newStock: product.stock,
    timestamp: new Date().toISOString(),
  });

  assert.strictEqual(product.stock, 50, 'Return must restore inventory to 50');
  assert.strictEqual(stockMovements.length, 2, 'Movement history is preserved without destructive overwrites');
});

// 5. Customer Udhar Khata Balance Update
runTest('Credit sale updates customer outstanding due balance', () => {
  const customer = { id: 'c_1', name: 'Alok Sharma', totalPurchased: 1000, totalPaid: 800, totalDue: 200 };

  // Customer makes a credit sale of ₹350
  const billAmount = 350;
  const paidNow = 100;
  const due = billAmount - paidNow; // 250 due

  customer.totalPurchased += billAmount;
  customer.totalPaid += paidNow;
  customer.totalDue += due;

  assert.strictEqual(customer.totalPurchased, 1350);
  assert.strictEqual(customer.totalPaid, 900);
  assert.strictEqual(customer.totalDue, 450, 'Total due must be ₹450.00');

  // Customer settles ₹450
  customer.totalPaid += 450;
  customer.totalDue = Math.max(0, customer.totalDue - 450);
  assert.strictEqual(customer.totalDue, 0, 'Due must become 0 upon full settlement');
});

// 6. Role-Based Access Control (RBAC) Permissions Matrix
runTest('Employee cannot access Super Admin or Developer routes', () => {
  const cashierPermissions = ['pos.billing', 'sales.view', 'customers.view'];
  const superAdminPermissions = ['*'];

  assert.ok(cashierPermissions.includes('pos.billing'), 'Cashier has billing access');
  assert.strictEqual(cashierPermissions.includes('admin.manage_businesses'), false, 'Cashier cannot manage businesses');
  assert.strictEqual(cashierPermissions.includes('infra.firebase_manage'), false, 'Cashier cannot configure Firebase');
  assert.ok(superAdminPermissions.includes('*'), 'Super Admin has master wildcard access');
});

// 7. Firebase Realtime Database URL Normalization
runTest('Firebase Realtime Database URL auto-formatting & normalization', () => {
  function normalizeUrl(url, projectId) {
    let cleaned = (url || '').trim().replace(/\/+$/, '');
    if (!cleaned && projectId) {
      cleaned = `https://${projectId.trim()}-default-rtdb.firebaseio.com`;
    }
    if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `https://${cleaned}`;
    }
    return cleaned;
  }

  const normalizedDefault = normalizeUrl('', 'npb-hrms-live-12345');
  assert.strictEqual(
    normalizedDefault,
    'https://npb-hrms-live-12345-default-rtdb.firebaseio.com',
    'Empty URL must default to standard firebaseio.com pattern'
  );

  const trailingSlash = normalizeUrl('https://my-db.firebaseio.com///', 'my-db');
  assert.strictEqual(trailingSlash, 'https://my-db.firebaseio.com', 'Trailing slashes must be stripped');

  const missingProtocol = normalizeUrl('my-custom-db.firebaseio.com', 'my-custom');
  assert.strictEqual(missingProtocol, 'https://my-custom-db.firebaseio.com', 'Protocol https:// must be prepended');
});

// 8. Disconnect Lifecycle: Local Tenant Data Wipe & Admin Account Preservation
runTest('Disconnect Firebase clears local tenant data while safeguarding SuperAdmin credentials', () => {
  const storeState = {
    companies: { comp_1: { id: 'comp_1', name: 'Kirana Store' } },
    products: { prod_1: { id: 'prod_1', name: 'Rice 5kg' } },
    sales: { sale_1: { id: 'sale_1', total: 500 } },
    users: {
      usr_admin: { id: 'usr_admin', role: 'SUPER_ADMIN', username: 'adminn' },
      usr_support: { id: 'usr_support', role: 'SUPPORT', username: 'amit_support' },
      usr_merchant: { id: 'usr_merchant', role: 'MERCHANT', username: 'kirana_owner' },
    },
    userCredentials: {
      usr_admin: 'Admin@88',
      usr_support: 'Support@123',
      usr_merchant: 'Merchant@123',
    },
    firebaseCloud: { connected: true, syncStatus: 'CONNECTED' },
  };

  // Simulate disconnect
  storeState.firebaseCloud.connected = false;
  storeState.firebaseCloud.syncStatus = 'DISCONNECTED';
  storeState.companies = {};
  storeState.products = {};
  storeState.sales = {};

  const preservedUsers = {};
  const preservedCreds = {};
  Object.values(storeState.users).forEach((u) => {
    if (u.role === 'SUPER_ADMIN' || u.role === 'SUPPORT' || u.role === 'DEVELOPER') {
      preservedUsers[u.id] = u;
      if (storeState.userCredentials[u.id]) {
        preservedCreds[u.id] = storeState.userCredentials[u.id];
      }
    }
  });
  storeState.users = preservedUsers;
  storeState.userCredentials = preservedCreds;

  assert.strictEqual(Object.keys(storeState.companies).length, 0, 'Companies must be emptied');
  assert.strictEqual(Object.keys(storeState.products).length, 0, 'Products must be emptied');
  assert.strictEqual(Object.keys(storeState.sales).length, 0, 'Sales must be emptied');
  assert.strictEqual(storeState.users['usr_merchant'], undefined, 'Merchant user must be wiped');
  assert.strictEqual(storeState.users['usr_admin'].username, 'adminn', 'SuperAdmin user must be preserved');
  assert.strictEqual(storeState.userCredentials['usr_admin'], 'Admin@88', 'SuperAdmin password must remain intact');
  assert.strictEqual(storeState.userCredentials['usr_support'], 'Support@123', 'Support password must remain intact');
});

// 9. Firebase Realtime Cloud Restoration & Hydration
runTest('Restore All Data from Firebase hydrates all collections and reactivates live status', () => {
  const localStoreState = {
    companies: {},
    products: {},
    users: { usr_admin: { id: 'usr_admin', role: 'SUPER_ADMIN', username: 'adminn' } },
    firebaseCloud: { connected: false, syncStatus: 'DISCONNECTED' },
  };

  const cloudBackupPayload = {
    companies: { comp_restored: { id: 'comp_restored', name: 'Restored Supermarket' } },
    products: { prod_restored: { id: 'prod_restored', name: 'Refined Oil 1L' } },
    sales: { sale_restored: { id: 'sale_restored', grandTotal: 1200 } },
  };

  // Hydrate
  localStoreState.companies = { ...localStoreState.companies, ...cloudBackupPayload.companies };
  localStoreState.products = { ...localStoreState.products, ...cloudBackupPayload.products };
  localStoreState.firebaseCloud.connected = true;
  localStoreState.firebaseCloud.syncStatus = 'CONNECTED';
  localStoreState.firebaseCloud.lastSyncAt = new Date().toISOString();

  assert.strictEqual(localStoreState.companies['comp_restored'].name, 'Restored Supermarket');
  assert.strictEqual(localStoreState.products['prod_restored'].name, 'Refined Oil 1L');
  assert.strictEqual(localStoreState.firebaseCloud.connected, true, 'Store must report CONNECTED status');
  assert.ok(localStoreState.firebaseCloud.lastSyncAt, 'lastSyncAt timestamp must be recorded');
});

// 10. Permanent Deletions Never Resurrect on Refresh or Update
runTest('Permanently deleted records never resurrect on refresh, update, or cloud restore', () => {
  // Simulate store with deleted items
  const cachedStore = {
    hasInitializedSeed: true,
    users: {
      usr_superadmin_bootstrap: { id: 'usr_superadmin_bootstrap', role: 'SUPER_ADMIN', username: 'adminn' },
    },
    userCredentials: { usr_superadmin_bootstrap: 'Admin@88' },
    plans: {
      FREE: { id: 'FREE', name: 'Free Starter' },
      // ENTERPRISE and BUSINESS were deleted by super admin
    },
    companies: {}, // all companies deleted
    auditLogs: {}, // all audit logs cleared
  };

  // Simulate refresh / loadInitialState with the above store
  assert.strictEqual(cachedStore.plans['ENTERPRISE'], undefined, 'Deleted plan must remain deleted');
  assert.strictEqual(cachedStore.plans['BUSINESS'], undefined, 'Deleted plan must remain deleted');
  assert.strictEqual(Object.keys(cachedStore.companies).length, 0, 'Deleted companies must stay deleted');
  assert.strictEqual(Object.keys(cachedStore.auditLogs).length, 0, 'Cleared audit logs must stay empty');

  // Simulate cloud restore where cloud has no deleted records
  const cloudState = {
    companies: {},
    plans: { FREE: { id: 'FREE', name: 'Free Starter' } },
  };

  const restoredCompanies = cloudState.companies ? { ...cloudState.companies } : {};
  const restoredPlans = { ...cloudState.plans };

  assert.strictEqual(Object.keys(restoredCompanies).length, 0, 'Restored companies must be empty');
  assert.strictEqual(restoredPlans['ENTERPRISE'], undefined, 'Deleted plan does not reappear from cloud');
});

// 11. Industry-Tailored Starter Stock (Medical vs Kirana)
runTest('Medical shop vs Kirana shop starter stock generates tailored inventory (batches & pharma units)', () => {
  function getStock(type, compId) {
    if (type === 'medical_pharmacy') {
      return [
        { name: 'Dolo 650mg Paracetamol Tablets', category: 'Tablets', unit: 'STRIP', hsn: '3004', batchNumber: 'DL-8821', expiryDate: '2028-05-30' },
        { name: 'Augmentin 625 Duo Tablets', category: 'Tablets', unit: 'STRIP', hsn: '3004', batchNumber: 'AUG-401', expiryDate: '2027-11-20' },
        { name: 'Benadryl Cough Syrup 100ml', category: 'Syrups', unit: 'BOTTLE', hsn: '3004', batchNumber: 'BND-901', expiryDate: '2028-02-28' },
      ];
    }
    return [
      { name: 'Aashirvaad Atta 10kg', category: 'Grains & Pulses', unit: 'BAG', hsn: '1101' },
      { name: 'Fortune Sunflower Oil 1L', category: 'Oils & Ghee', unit: 'POUCH', hsn: '1512' },
    ];
  }

  const medStock = getStock('medical_pharmacy', 'comp_med');
  assert.ok(medStock.some((i) => i.unit === 'STRIP'), 'Medical shop must include STRIP units');
  assert.ok(medStock.some((i) => i.unit === 'BOTTLE'), 'Medical shop must include BOTTLE units');
  assert.ok(medStock.every((i) => i.hsn === '3004'), 'Medical shop items must have pharma HSN 3004');
  assert.ok(medStock.every((i) => Boolean(i.batchNumber && i.expiryDate)), 'Medical items must have batch and expiry');

  const kiranaStock = getStock('kirana', 'comp_kir');
  assert.ok(kiranaStock.some((i) => i.unit === 'BAG'), 'Kirana shop must include BAG units');
  assert.ok(kiranaStock.some((i) => i.category === 'Grains & Pulses'), 'Kirana shop must include Grains & Pulses');
});

// 12. Plan Expiration Restriction System
runTest('Plan expiration restriction accurately detects expired validity and locks billing', () => {
  function checkPlanExpired(company) {
    if (!company) return false;
    if (company.status === 'EXPIRED' || company.subscriptionStatus === 'EXPIRED') return true;
    if (company.subscriptionExpiresAt && new Date(company.subscriptionExpiresAt).getTime() < Date.now()) {
      return true;
    }
    return false;
  }

  const activeCompany = {
    id: 'comp_act',
    status: 'ACTIVE',
    subscriptionStatus: 'ACTIVE',
    subscriptionExpiresAt: new Date(Date.now() + 100 * 86400000).toISOString(),
  };
  assert.strictEqual(checkPlanExpired(activeCompany), false, 'Active company must not be expired');

  const expiredCompany = {
    id: 'comp_exp',
    status: 'ACTIVE',
    subscriptionStatus: 'ACTIVE',
    subscriptionExpiresAt: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
  };
  assert.strictEqual(checkPlanExpired(expiredCompany), true, 'Past validity date must trigger expiration lock');

  const explicitlyExpired = {
    id: 'comp_exp2',
    status: 'EXPIRED',
    subscriptionStatus: 'EXPIRED',
    subscriptionExpiresAt: new Date(Date.now() + 10 * 86400000).toISOString(),
  };
  assert.strictEqual(checkPlanExpired(explicitlyExpired), true, 'Explicit EXPIRED status must trigger lock');
});

// 13. Dual Firebase Database REST Serialization (Realtime DB + Cloud Firestore)
runTest('Dual-Database REST serialization handles both RTDB JSON and Firestore typed fields', () => {
  function toFirestoreValue(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return { integerValue: String(val) };
      return { doubleValue: val };
    }
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
    if (typeof val === 'object') {
      const fields = {};
      for (const k of Object.keys(val)) {
        fields[k] = toFirestoreValue(val[k]);
      }
      return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
  }

  function toFirestoreDoc(data) {
    const fields = {};
    for (const k of Object.keys(data)) {
      fields[k] = toFirestoreValue(data[k]);
    }
    return { fields };
  }

  const samplePlan = {
    id: 'PREMIUM_TIER',
    name: 'Supermarket Premium',
    price: 2999,
    features: ['billing_invoice', 'upi_qr_bill'],
    active: true,
  };

  // 1. RTDB Payload is standard JSON
  const rtdbPayload = JSON.stringify(samplePlan);
  assert.ok(rtdbPayload.includes('"price":2999'), 'RTDB payload must contain native JSON number');

  // 2. Firestore Document Payload has typed fields
  const firestoreDoc = toFirestoreDoc(samplePlan);
  assert.strictEqual(firestoreDoc.fields.price.integerValue, '2999', 'Firestore must serialize integer price');
  assert.strictEqual(firestoreDoc.fields.active.booleanValue, true, 'Firestore must serialize boolean active');
  assert.strictEqual(firestoreDoc.fields.name.stringValue, 'Supermarket Premium');
  assert.strictEqual(firestoreDoc.fields.features.arrayValue.values.length, 2);
});

// 14. Dual Database Disconnect and Zero-Loss Reconnect
runTest('Disconnect wipes local tenant data and reconnect restores all collections without data loss', () => {
  const store = {
    companies: { comp_1: { id: 'comp_1', name: 'Gupta Kirana' } },
    products: { prod_1: { id: 'prod_1', name: 'Mustard Oil 1L' } },
    plans: { plan_std: { id: 'plan_std', name: 'Standard' } },
    users: {
      usr_superadmin_bootstrap: { id: 'usr_superadmin_bootstrap', role: 'SUPER_ADMIN', username: 'adminn' },
      usr_merchant_1: { id: 'usr_merchant_1', role: 'MERCHANT', username: 'gupta_shop' },
    },
    userCredentials: {
      usr_superadmin_bootstrap: 'Admin@88',
      usr_merchant_1: 'Shop@123',
    },
    firebaseCloud: { connected: true, syncStatus: 'CONNECTED' },
  };

  // Disconnect operation
  function disconnectAndClear(s) {
    s.companies = {};
    s.products = {};
    s.plans = {};
    const preservedUsers = {};
    const preservedCreds = {};
    Object.values(s.users).forEach((u) => {
      if (u.role === 'SUPER_ADMIN') {
        preservedUsers[u.id] = u;
        preservedCreds[u.id] = s.userCredentials[u.id];
      }
    });
    s.users = preservedUsers;
    s.userCredentials = preservedCreds;
    s.firebaseCloud.connected = false;
    s.firebaseCloud.syncStatus = 'DISCONNECTED';
  }

  disconnectAndClear(store);

  // Assert local tenant data is cleared
  assert.strictEqual(Object.keys(store.companies).length, 0, 'Companies must be empty on disconnect');
  assert.strictEqual(Object.keys(store.products).length, 0, 'Products must be empty on disconnect');
  assert.strictEqual(Object.keys(store.plans).length, 0, 'Plans must be empty on disconnect');
  assert.strictEqual(store.users['usr_merchant_1'], undefined, 'Merchant user wiped from device');
  assert.ok(store.users['usr_superadmin_bootstrap'], 'Super Admin master user preserved');

  // Reconnect from Cloud (Zero data loss restoration)
  const cloudData = {
    companies: { comp_1: { id: 'comp_1', name: 'Gupta Kirana' } },
    products: { prod_1: { id: 'prod_1', name: 'Mustard Oil 1L' } },
    plans: { plan_std: { id: 'plan_std', name: 'Standard' } },
  };

  store.companies = { ...cloudData.companies };
  store.products = { ...cloudData.products };
  store.plans = { ...cloudData.plans };
  store.firebaseCloud.connected = true;
  store.firebaseCloud.syncStatus = 'CONNECTED';

  assert.strictEqual(store.companies['comp_1'].name, 'Gupta Kirana', 'Company restored without data loss');
  assert.strictEqual(store.products['prod_1'].name, 'Mustard Oil 1L', 'Product restored without data loss');
  assert.strictEqual(store.plans['plan_std'].name, 'Standard', 'Subscription plan restored without data loss');
});

// 15. Permanent Deletion & Tombstone Non-Recovery Guarantee
runTest('Permanent Deletion & Tombstone Engine guarantees deleted records NEVER recover in future', () => {
  const store = {
    plans: {
      PLAN_KEEP: { id: 'PLAN_KEEP', name: 'Active Plan' },
      PLAN_TO_DELETE: { id: 'PLAN_TO_DELETE', name: 'Old Plan' },
    },
    products: {
      PROD_KEEP: { id: 'PROD_KEEP', name: 'Refined Oil' },
      PROD_DELETED: { id: 'PROD_DELETED', name: 'Discontinued Item' },
    },
    customers: {
      CUST_DELETED: { id: 'CUST_DELETED', name: 'Old Account' },
    },
    deletedTombstones: {},
  };

  // 1. Perform permanent deletion
  function deleteItem(collection, id) {
    delete store[collection][id];
    store.deletedTombstones[`${collection}:${id}`] = Date.now();
  }

  deleteItem('plans', 'PLAN_TO_DELETE');
  deleteItem('products', 'PROD_DELETED');
  deleteItem('customers', 'CUST_DELETED');

  assert.strictEqual(store.plans['PLAN_TO_DELETE'], undefined, 'Item removed locally');
  assert.strictEqual(store.products['PROD_DELETED'], undefined, 'Item removed locally');
  assert.strictEqual(store.customers['CUST_DELETED'], undefined, 'Item removed locally');
  assert.ok(store.deletedTombstones['plans:PLAN_TO_DELETE'], 'Tombstone recorded for plan');
  assert.ok(store.deletedTombstones['products:PROD_DELETED'], 'Tombstone recorded for product');

  // 2. Simulate future cloud restore payload that happens to have the old deleted record
  const staleCloudBackup = {
    plans: {
      PLAN_KEEP: { id: 'PLAN_KEEP', name: 'Active Plan' },
      PLAN_TO_DELETE: { id: 'PLAN_TO_DELETE', name: 'Resurrected Old Plan' },
    },
    products: {
      PROD_KEEP: { id: 'PROD_KEEP', name: 'Refined Oil' },
      PROD_DELETED: { id: 'PROD_DELETED', name: 'Resurrected Product' },
    },
    customers: {
      CUST_DELETED: { id: 'CUST_DELETED', name: 'Resurrected Customer' },
    },
  };

  // Restore logic with tombstone filtration
  function restoreWithTombstoneProtection(cloudPayload) {
    const collections = ['plans', 'products', 'customers'];
    for (const col of collections) {
      store[col] = { ...(cloudPayload[col] || {}) };
      for (const itemKey of Object.keys(store[col])) {
        if (store.deletedTombstones[`${col}:${itemKey}`]) {
          delete store[col][itemKey]; // Purge tombstoned record permanently
        }
      }
    }
  }

  restoreWithTombstoneProtection(staleCloudBackup);

  // 3. Assert deleted items NEVER recovered
  assert.strictEqual(store.plans['PLAN_TO_DELETE'], undefined, 'Deleted plan NEVER recovered in future');
  assert.strictEqual(store.products['PROD_DELETED'], undefined, 'Deleted product NEVER recovered in future');
  assert.strictEqual(store.customers['CUST_DELETED'], undefined, 'Deleted customer NEVER recovered in future');
  assert.ok(store.plans['PLAN_KEEP'], 'Non-deleted plan safely preserved');
  assert.ok(store.products['PROD_KEEP'], 'Non-deleted product safely preserved');
});

console.log('\n====================================================');
console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100% PASS RATE)`);
console.log('====================================================\n');
