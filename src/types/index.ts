export type UserRole = 'SUPER_ADMIN' | 'MERCHANT' | 'EMPLOYEE' | 'SUPPORT' | 'DEVELOPER';

export type EmployeeSubRole = 'CASHIER' | 'SALES' | 'INVENTORY' | 'MANAGER' | 'ACCOUNTANT' | 'CUSTOM';

export type SupportLevel = 'L1' | 'L2' | 'L3' | 'L4';

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'PENDING_SETUP';

export type PlanId = 'FREE' | 'STARTER' | 'BUSINESS' | 'PROFESSIONAL' | 'ENTERPRISE' | (string & {});

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';

export type ModuleKey =
  | 'billing'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'expenses'
  | 'employees'
  | 'attendance'
  | 'reports'
  | 'gst'
  | 'barcode'
  | 'returns'
  | 'branches'
  | 'ai'
  | 'whatsapp'
  | 'notifications'
  | 'api'
  | 'advancedReports';

export interface User {
  id: string;
  username: string;
  email: string;
  mobile: string;
  name: string;
  role: UserRole;
  subRole?: EmployeeSubRole;
  supportLevel?: SupportLevel;
  companyId?: string; // Tenant ID (mandatory for merchant & employee)
  branchId?: string;
  status: AccountStatus;
  permissions: string[];
  mustChangePassword?: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Company {
  id: string;
  name: string;
  businessTypeId: string;
  customCategory?: string;
  tagline?: string;
  logoUrl?: string;
  headerDisplayMode?: 'BOTH' | 'LOGO_ONLY' | 'NAME_ONLY';
  gstin?: string;
  pan?: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  invoicePrefix: string;
  invoiceTerms?: string;
  currency: string;
  taxMode: 'INCLUSIVE' | 'EXCLUSIVE';
  bankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  planId: PlanId;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: string;
  enabledModules: ModuleKey[];
  enabledFeatureIds?: string[];
  sundryKhatabookEnabled?: boolean;
  ownerName?: string;
  customBusinessTypeName?: string;
  branchesCount: number;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  key: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'boolean' | 'currency' | 'barcode';
  required?: boolean;
  options?: string[]; // for dropdown
  placeholder?: string;
  defaultValue?: any;
}

export interface BusinessType {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'RETAIL' | 'FOOD_BEVERAGE' | 'SERVICES' | 'HEALTHCARE' | 'WHOLESALE' | 'AGRICULTURE' | 'OTHER';
  defaultModules: ModuleKey[];
  defaultCategories: string[];
  defaultUnits: string[];
  defaultTaxRate: number;
  customFields: CustomFieldDefinition[];
  isSystem?: boolean;
}

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  price?: number;
  validityDays?: number;
  planType?: 'paid' | 'free' | 'trial' | 'custom';
  description: string;
  features: string[];
  includedFeatureIds?: string[];
  autoEnabledModules?: ModuleKey[];
  limits: {
    maxProducts: number;
    isUnlimitedProducts?: boolean;
    maxEmployees: number;
    maxCustomers: number;
    isUnlimitedCustomers?: boolean;
    maxSuppliers: number;
    maxInvoicesPerMonth: number;
    maxBranches: number;
    aiAssistant: boolean;
    whatsappAlerts: boolean;
    advancedReports: boolean;
    storageMb: number;
  };
}

export interface Product {
  id: string;
  companyId: string;
  branchId?: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  subcategory?: string;
  brand?: string;
  description?: string;
  businessTypeId: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  wholesalePrice?: number;
  taxRate: number; // e.g. 0, 5, 12, 18, 28
  hsn: string;
  openingStock: number;
  currentStock: number;
  minStockAlert: number;
  reorderLevel: number;
  supplierId?: string;
  imageUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  trackInventory: boolean;
  trackBatch: boolean;
  trackExpiry: boolean;
  trackSerialNumber: boolean;
  batchNumber?: string;
  mfgDate?: string;
  expiryDate?: string;
  serialNumber?: string;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN_IN'
  | 'RETURN_OUT'
  | 'DAMAGE'
  | 'ADJUSTMENT'
  | 'TRANSFER';

export interface StockMovement {
  id: string;
  companyId: string;
  branchId?: string;
  productId: string;
  productName: string;
  sku: string;
  type: StockMovementType;
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  unitPrice: number;
  referenceType?: 'SALE' | 'PURCHASE' | 'RETURN' | 'MANUAL';
  referenceId?: string;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  mrp: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  subtotal: number;
  total: number;
  batchNumber?: string;
  expiryDate?: string;
  serialNumber?: string;
}

export interface PaymentMethodRecord {
  method: 'CASH' | 'UPI' | 'CARD' | 'BANK' | 'CREDIT';
  amount: number;
  reference?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  companyId: string;
  branchId?: string;
  customerId?: string;
  customerName: string;
  customerMobile?: string;
  customerGstin?: string;
  items: SaleItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  payments: PaymentMethodRecord[];
  status: 'COMPLETED' | 'HOLD' | 'CANCELLED' | 'RETURNED' | 'PARTIAL_RETURN';
  notes?: string;
  cashierId: string;
  cashierName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  creditLimit: number;
  openingBalance: number;
  totalPurchased: number;
  totalPaid: number;
  totalDue: number;
  lastPurchaseDate?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  companyName: string;
  mobile: string;
  email?: string;
  address?: string;
  gstin?: string;
  openingBalance: number;
  payableBalance: number;
  totalPurchases: number;
  totalPaid: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface Purchase {
  id: string;
  purchaseInvoiceNumber: string;
  companyId: string;
  branchId?: string;
  supplierId: string;
  supplierName: string;
  supplierGstin?: string;
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'DUE';
  status: 'RECEIVED' | 'DRAFT' | 'CANCELLED' | 'RETURNED';
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  companyId: string;
  branchId?: string;
  category: string;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK';
  description: string;
  attachmentUrl?: string;
  date: string;
  createdBy: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  companyId: string;
  branchId?: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string;
  checkOutTime?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY' | 'WEEKLY_OFF';
  notes?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  companyId: string;
  companyName: string;
  merchantName: string;
  merchantMobile: string;
  subject: string;
  category: 'BILLING' | 'LOGIN' | 'TECHNICAL' | 'SUBSCRIPTION' | 'DATA_SYNC' | 'FEATURE_REQUEST';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  supportLevelRequired: SupportLevel;
  assignedToId?: string;
  assignedToName?: string;
  messages: {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: UserRole;
    text: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  companyId?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  details: string;
  oldData?: any;
  newData?: any;
  ip?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  companyId?: string;
  userId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface FirebaseCloudConfig {
  projectId: string;
  databaseURL: string;
  serviceAccountKeyJson?: string;
  connected: boolean;
  lastSyncAt?: string;
  syncStatus: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';
  syncMode?: 'REALTIME_DB' | 'FIRESTORE' | 'DUAL_SYNC';
  stats?: {
    totalSynced?: number;
    collectionsCount?: number;
    lastAction?: string;
    rtdbStatus?: string;
    firestoreStatus?: string;
  };
}
