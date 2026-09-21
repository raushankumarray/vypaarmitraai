import { ModuleKey } from '@/types';

export interface ModuleDefinition {
  key: ModuleKey;
  name: string;
  nameHi: string;
  description: string;
  icon: string;
  category: 'CORE' | 'OPERATIONS' | 'FINANCE' | 'GROWTH';
}

export const SYSTEM_MODULES: ModuleDefinition[] = [
  { key: 'billing', name: 'POS & Billing', nameHi: 'बिलिंग / पीओएस', description: 'Fast counter sales, barcode scanning, split payments', icon: 'Receipt', category: 'CORE' },
  { key: 'inventory', name: 'Inventory & Stock', nameHi: 'इन्वेंटरी और स्टॉक', description: 'Realtime stock ledger, batch/expiry alerts, valuation', icon: 'Boxes', category: 'CORE' },
  { key: 'customers', name: 'Customers & Khata', nameHi: 'ग्राहक खाता व उधारी', description: 'Customer credit limits, ledger history, dues', icon: 'Users', category: 'CORE' },
  { key: 'suppliers', name: 'Suppliers & Purchases', nameHi: 'सप्लायर और खरीद', description: 'Supplier ledgers, purchases, outward payments', icon: 'Truck', category: 'CORE' },
  { key: 'expenses', name: 'Expense Tracking', nameHi: 'खर्च का हिसाब', description: 'Operating costs, rent, electricity, salaries', icon: 'DollarSign', category: 'FINANCE' },
  { key: 'reports', name: 'Reports & Analytics', nameHi: 'रिपोर्ट्स और आंकड़े', description: 'P&L, sales, purchase, stock valuation reports', icon: 'BarChart3', category: 'CORE' },
  { key: 'gst', name: 'GST & Tax Invoices', nameHi: 'जीएसटी और टैक्स बिल', description: 'CGST, SGST, IGST, HSN codes, GSTR-1 summaries', icon: 'FileText', category: 'FINANCE' },
  { key: 'barcode', name: 'Barcode Printing', nameHi: 'बारकोड जनरेशन', description: 'Print custom barcode stickers and thermal labels', icon: 'QrCode', category: 'OPERATIONS' },
  { key: 'returns', name: 'Sales & Purchase Returns', nameHi: 'वापसी और रिफंड', description: 'Stock restitution and customer credit refunds', icon: 'RotateCcw', category: 'OPERATIONS' },
  { key: 'employees', name: 'Staff Management', nameHi: 'कर्मचारी प्रबंधन', description: 'Employee accounts, roles and granular permissions', icon: 'UserCheck', category: 'OPERATIONS' },
  { key: 'attendance', name: 'Staff Attendance', nameHi: 'उपस्थिति / हाजिरी', description: 'Daily employee check-in, check-out and leaves', icon: 'Clock', category: 'OPERATIONS' },
  { key: 'branches', name: 'Multi-Branch Management', nameHi: 'मल्टी-ब्रांच', description: 'Centralized stock transfers between stores', icon: 'Building2', category: 'GROWTH' },
  { key: 'ai', name: 'VyapaarMitra AI Assistant', nameHi: 'व्यापारमित्र एआई सहायक', description: 'Ask questions in Hindi or English about business health', icon: 'Sparkles', category: 'GROWTH' },
  { key: 'whatsapp', name: 'WhatsApp & SMS Alerts', nameHi: 'व्हाट्सएप अलर्ट', description: 'Send automated invoice links and payment reminders', icon: 'Send', category: 'GROWTH' },
  { key: 'notifications', name: 'Push Notifications', nameHi: 'पुश नोटिफिकेशन', description: 'FCM push notifications for stock and payment events', icon: 'Bell', category: 'OPERATIONS' },
  { key: 'api', name: 'Developer API Integration', nameHi: 'एपीआई एक्सेस', description: 'Secure webhooks and REST endpoints', icon: 'Code', category: 'GROWTH' },
  { key: 'advancedReports', name: 'Advanced BI & Forecasts', nameHi: 'एडवांस्ड बिजनेस एनालिटिक्स', description: 'Predictive inventory replenishment and peak hour trends', icon: 'TrendingUp', category: 'GROWTH' },
];
