'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { Product, Customer, Sale, SaleItem, PaymentMethodRecord } from '@/types';
import { numberToIndianWords, DraftBill } from '@/lib/billingUtils';
import { A4InvoicePrint, InvoicePrintData } from '@/components/merchant/A4InvoicePrint';
import { ThermalReceiptPrint } from '@/components/merchant/ThermalReceiptPrint';
import {
  FileText,
  Save,
  Printer,
  Plus,
  Trash2,
  RefreshCw,
  Moon,
  Search,
  CheckCircle,
  AlertCircle,
  QrCode,
  Share2,
  X,
  User,
  ArrowRight,
  Package,
  Lock,
  Phone,
} from 'lucide-react';

interface BillRow {
  id: string;
  productId?: string;
  name: string;
  unit: string;
  mrp: number | '';
  discountPercent: number | '';
  rate: number | '';
  quantity: number | '';
  gstPercent: number | '';
  amount: number;
}

const LOCAL_DRAFT_KEY = 'vypaarmitra_current_bill_draft_v1';

export default function MerchantBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'bill';

  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  // Plan Expiration Check
  const isPlanExpired = useMemo(() => {
    if (!company) return false;
    if (company.subscriptionStatus === 'EXPIRED') return true;
    if (company.subscriptionExpiresAt && new Date(company.subscriptionExpiresAt).getTime() < Date.now()) {
      return true;
    }
    return false;
  }, [company]);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  // Data collections
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<DraftBill[]>([]);

  // Header timestamp & refresh
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const [minutesAgo, setMinutesAgo] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Customer state
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const [showCustomerNameDropdown, setShowCustomerNameDropdown] = useState(false);

  // Bill metadata
  const [billDate, setBillDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [billNo, setBillNo] = useState('INV-0001');
  const [printSize, setPrintSize] = useState<'A4' | '58MM' | '80MM'>('A4');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK' | 'CREDIT'>('CASH');

  // Credit / Partial Payment
  const [paidAmountInput, setPaidAmountInput] = useState<number | ''>('');

  // Items table
  const [rows, setRows] = useState<BillRow[]>([
    {
      id: 'row_init_1',
      productId: '',
      name: '',
      unit: 'PCS',
      mrp: '',
      discountPercent: '',
      rate: '',
      quantity: 1,
      gstPercent: 0,
      amount: 0,
    },
  ]);

  // Active item autocomplete dropdown state
  const [activeRowDropdown, setActiveRowDropdown] = useState<number | null>(null);
  const [activeItemSearch, setActiveItemSearch] = useState<string>('');

  // Notes
  const [notes, setNotes] = useState('');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Print modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printModalFormat, setPrintModalFormat] = useState<'A4' | '58MM' | '80MM'>('A4');
  const [printModalData, setPrintModalData] = useState<InvoicePrintData | null>(null);

  // Load localStore data
  const loadData = () => {
    if (!companyId) return;
    const prods = localStore.getProducts(companyId);
    const custs = localStore.getCustomers(companyId);
    const drafts = localStore.getDraftBills(companyId);
    setProducts(prods);
    setCustomers(custs);
    setSavedDrafts(drafts);

    // Compute next bill number
    const nextInvoice = localStore.getNextInvoiceNumber(companyId, company?.invoicePrefix || 'INV');
    setBillNo((prev) => (prev === 'INV-0001' || !prev ? nextInvoice : prev));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    return () => unsub();
  }, [companyId]);

  // Live timer for "Last updated ... ago"
  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTimes();

    const interval = setInterval(() => {
      setMinutesAgo((prev) => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Restore auto-saved typing from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customerMobile !== undefined) setCustomerMobile(parsed.customerMobile);
        if (parsed.customerName !== undefined) setCustomerName(parsed.customerName);
        if (parsed.customerAddress !== undefined) setCustomerAddress(parsed.customerAddress);
        if (parsed.billDate) setBillDate(parsed.billDate);
        if (parsed.billNo) setBillNo(parsed.billNo);
        if (parsed.printSize) setPrintSize(parsed.printSize);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.notes !== undefined) setNotes(parsed.notes);
        if (Array.isArray(parsed.rows) && parsed.rows.length > 0) setRows(parsed.rows);
      }
    } catch (e) {
      console.warn('Could not restore cached draft bill', e);
    }
  }, []);

  // Auto-save current bill typing to localStorage so "nothing is lost on refresh"
  useEffect(() => {
    try {
      const draftObj = {
        customerMobile,
        customerName,
        customerAddress,
        billDate,
        billNo,
        printSize,
        paymentMethod,
        notes,
        rows,
      };
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draftObj));
    } catch (e) {
      // ignore
    }
  }, [customerMobile, customerName, customerAddress, billDate, billNo, printSize, paymentMethod, notes, rows]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
    const now = new Date();
    setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setMinutesAgo(0);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Billing data synchronized with database', 'info');
    }, 300);
  };

  // Customer Auto-fetch matches
  const filteredCustomersByMobile = useMemo(() => {
    if (!customerMobile.trim()) return customers;
    return customers.filter((c) => c.mobile && c.mobile.includes(customerMobile.trim()));
  }, [customers, customerMobile]);

  const filteredCustomersByName = useMemo(() => {
    if (!customerName.trim() || customerName === 'Walk-in Customer') return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(customerName.toLowerCase()));
  }, [customers, customerName]);

  const selectCustomer = (cust: Customer) => {
    setCustomerMobile(cust.mobile);
    setCustomerName(cust.name);
    setCustomerAddress(cust.address || `${cust.city || ''} ${cust.state || ''}`.trim());
    setSelectedCustomerId(cust.id);
    setShowMobileDropdown(false);
    setShowCustomerNameDropdown(false);
    showToast(`Fetched customer details: ${cust.name}`, 'info');
  };

  // Rows & Item Management
  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: '',
        name: '',
        unit: 'PCS',
        mrp: '',
        discountPercent: '',
        rate: '',
        quantity: 1,
        gstPercent: 0,
        amount: 0,
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
      // Reset the single row
      setRows([
        {
          id: `row_${Date.now()}`,
          productId: '',
          name: '',
          unit: 'PCS',
          mrp: '',
          discountPercent: '',
          rate: '',
          quantity: 1,
          gstPercent: 0,
          amount: 0,
        },
      ]);
    } else {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  // Recalculate row amount
  const calculateRowAmount = (
    rateVal: number | '',
    qtyVal: number | '',
    gstVal: number | ''
  ): number => {
    const rate = Number(rateVal) || 0;
    const qty = Number(qtyVal) || 0;
    const gst = Number(gstVal) || 0;
    const taxable = rate * qty;
    const tax = (taxable * gst) / 100;
    return Number((taxable + tax).toFixed(2));
  };

  // Update specific field in a row
  const updateRowField = (index: number, field: keyof BillRow, value: any) => {
    setRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };

      if (field === 'mrp') {
        const mrp = Number(value) || 0;
        const disc = Number(row.discountPercent) || 0;
        if (mrp > 0) {
          row.rate = disc > 0 ? Number((mrp * (1 - disc / 100)).toFixed(2)) : mrp;
        }
      } else if (field === 'discountPercent') {
        const disc = Number(value) || 0;
        const mrp = Number(row.mrp) || Number(row.rate) || 0;
        if (mrp > 0) {
          row.rate = disc > 0 ? Number((mrp * (1 - disc / 100)).toFixed(2)) : mrp;
        }
      } else if (field === 'rate') {
        const rate = Number(value) || 0;
        const mrp = Number(row.mrp) || 0;
        if (mrp > 0 && rate > 0 && mrp > rate) {
          row.discountPercent = Number((((mrp - rate) / mrp) * 100).toFixed(1));
        }
      }

      // Recompute row amount
      row.amount = calculateRowAmount(row.rate, row.quantity, row.gstPercent);
      updated[index] = row;
      return updated;
    });
  };

  // When user selects an item from auto-fetch dropdown
  const selectProductForRow = (index: number, product: Product) => {
    setRows((prev) => {
      const updated = [...prev];
      const mrp = product.mrp || product.sellingPrice;
      const rate = product.sellingPrice || mrp;
      const disc = mrp > rate ? Number((((mrp - rate) / mrp) * 100).toFixed(1)) : '';
      const qty = Number(updated[index].quantity) || 1;
      const gst = product.taxRate || 0;

      const amt = calculateRowAmount(rate, qty, gst);

      updated[index] = {
        ...updated[index],
        productId: product.id,
        name: product.name,
        unit: product.unit || 'PCS',
        mrp: mrp,
        discountPercent: disc,
        rate: rate,
        quantity: qty,
        gstPercent: gst,
        amount: amt,
      };
      return updated;
    });

    setActiveRowDropdown(null);
    setActiveItemSearch('');
    showToast(`Loaded ${product.name} with auto-filled rates and unit`, 'info');
  };

  // Filter products for dropdown
  const filteredProducts = useMemo(() => {
    if (!activeItemSearch.trim()) return products;
    const query = activeItemSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.barcode.includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [products, activeItemSearch]);

  // Overall Financial Calculations
  const { taxableValue, totalTax, cgstTotal, sgstTotal, grandTotal, roundOff } = useMemo(() => {
    let taxable = 0;
    let tax = 0;

    rows.forEach((r) => {
      const rate = Number(r.rate) || Number(r.mrp) || 0;
      const qty = Number(r.quantity) || 0;
      const gstRate = Number(r.gstPercent) || 0;
      const lineTaxable = rate * qty;
      const lineTax = (lineTaxable * gstRate) / 100;
      taxable += lineTaxable;
      tax += lineTax;
    });

    const rawTotal = taxable + tax;
    const roundedTotal = Math.round(rawTotal);
    const rOff = Number((roundedTotal - rawTotal).toFixed(2));

    return {
      taxableValue: Number(taxable.toFixed(2)),
      totalTax: Number(tax.toFixed(2)),
      cgstTotal: Number((tax / 2).toFixed(2)),
      sgstTotal: Number((tax / 2).toFixed(2)),
      grandTotal: roundedTotal,
      roundOff: rOff,
    };
  }, [rows]);

  // Paid & Due Amount Calculations
  const calculatedPaidAmount = useMemo(() => {
    if (paymentMethod === 'CREDIT') {
      return paidAmountInput === '' ? 0 : Number(paidAmountInput);
    }
    return grandTotal;
  }, [paymentMethod, paidAmountInput, grandTotal]);

  const calculatedDueAmount = useMemo(() => {
    return Math.max(0, grandTotal - calculatedPaidAmount);
  }, [grandTotal, calculatedPaidAmount]);

  // In words representation
  const inWords = useMemo(() => numberToIndianWords(grandTotal), [grandTotal]);

  // Prepare Invoice Data Object for Printing / Saving
  const prepareInvoiceData = (): InvoicePrintData => {
    return {
      invoiceNumber: billNo,
      billDate,
      paymentMethod,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerMobile: customerMobile.trim(),
      customerAddress: customerAddress.trim(),
      customerGstin: customers.find((c) => c.id === selectedCustomerId)?.gstin,
      items: rows.map((r) => ({
        id: r.id,
        name: r.name || 'Stock Item',
        unit: r.unit || 'PCS',
        mrp: Number(r.mrp || r.rate || 0),
        discountPercent: Number(r.discountPercent || 0),
        rate: Number(r.rate || r.mrp || 0),
        quantity: Number(r.quantity || 1),
        gstPercent: Number(r.gstPercent || 0),
        amount: Number(r.amount || 0),
      })),
      subtotal: taxableValue,
      taxableValue,
      totalTax,
      cgstTotal,
      sgstTotal,
      roundOff,
      grandTotal,
      paidAmount: calculatedPaidAmount,
      dueAmount: calculatedDueAmount,
      notes,
    };
  };

  // Save Sale into LocalStore & Firebase
  const handleSaveBill = (andPrint?: 'A4' | '58MM' | '80MM'): Sale | null => {
    if (isPlanExpired) {
      showToast('Subscription plan has expired. Please renew your account to issue invoices.', 'error');
      setShowRenewalModal(true);
      return null;
    }

    const validItems = rows.filter((r) => r.name.trim() !== '' && Number(r.quantity) > 0);
    if (validItems.length === 0) {
      showToast('Please add at least one valid item with name and quantity', 'error');
      return null;
    }

    // Auto register or update customer if mobile is provided and customer not found
    let custId = selectedCustomerId;
    if (customerMobile.trim() && !custId) {
      const existing = customers.find((c) => c.mobile === customerMobile.trim());
      if (existing) {
        custId = existing.id;
      } else {
        const newCust: Customer = {
          id: `cust_${Date.now()}`,
          companyId,
          name: customerName.trim() || 'Walk-in Customer',
          mobile: customerMobile.trim(),
          address: customerAddress.trim(),
          creditLimit: 10000,
          openingBalance: 0,
          totalPurchased: 0,
          totalPaid: 0,
          totalDue: 0,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStore.saveCustomer(newCust);
        custId = newCust.id;
      }
    }

    const payments: PaymentMethodRecord[] = [
      {
        method: paymentMethod === 'CREDIT' ? 'CREDIT' : paymentMethod,
        amount: calculatedPaidAmount,
      },
    ];

    const saleItems: SaleItem[] = validItems.map((item) => {
      const rate = Number(item.rate || item.mrp || 0);
      const qty = Number(item.quantity || 1);
      const sub = rate * qty;
      const tax = (sub * Number(item.gstPercent || 0)) / 100;
      return {
        productId: item.productId || `prod_custom_${Date.now()}`,
        productName: item.name,
        sku: item.name.slice(0, 4).toUpperCase(),
        barcode: '',
        quantity: qty,
        unit: item.unit || 'PCS',
        unitPrice: rate,
        mrp: Number(item.mrp || rate),
        discountAmount: Number(item.discountPercent || 0),
        taxRate: Number(item.gstPercent || 0),
        taxAmount: tax,
        cgstAmount: tax / 2,
        sgstAmount: tax / 2,
        igstAmount: 0,
        subtotal: sub,
        total: item.amount,
      };
    });

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      invoiceNumber: billNo,
      companyId,
      customerId: custId || undefined,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerMobile: customerMobile.trim(),
      items: saleItems,
      subtotal: taxableValue,
      totalDiscount: 0,
      totalTax,
      cgstTotal,
      sgstTotal,
      igstTotal: 0,
      roundOff,
      grandTotal,
      paidAmount: calculatedPaidAmount,
      dueAmount: calculatedDueAmount,
      payments,
      status: 'COMPLETED',
      notes,
      cashierId: user?.id || 'cashier',
      cashierName: user?.name || 'Counter Staff',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.createSale(newSale, user?.name || 'Cashier');
    showToast(`Bill #${billNo} saved successfully! Inventory and khata updated.`, 'success');

    // Clean up current draft
    localStorage.removeItem(LOCAL_DRAFT_KEY);

    const invoiceData = prepareInvoiceData();

    // If print requested, trigger print modal
    if (andPrint) {
      setPrintModalData(invoiceData);
      setPrintModalFormat(andPrint);
      setShowPrintModal(true);
    }

    // Reset bill for next transaction
    const nextInvoice = localStore.getNextInvoiceNumber(companyId, company?.invoicePrefix || 'INV');
    setBillNo(nextInvoice);
    setCustomerMobile('');
    setCustomerName('Walk-in Customer');
    setCustomerAddress('');
    setSelectedCustomerId('');
    setNotes('');
    setPaidAmountInput('');
    setRows([
      {
        id: `row_${Date.now()}`,
        productId: '',
        name: '',
        unit: 'PCS',
        mrp: '',
        discountPercent: '',
        rate: '',
        quantity: 1,
        gstPercent: 0,
        amount: 0,
      },
    ]);

    return newSale;
  };

  // Save as Draft
  const handleSaveAsDraft = () => {
    if (isPlanExpired) {
      showToast('Subscription plan has expired. Please renew your account.', 'error');
      setShowRenewalModal(true);
      return;
    }

    const draft: DraftBill = {
      id: `draft_${Date.now()}`,
      companyId,
      invoiceNumber: billNo,
      customerMobile,
      customerName,
      customerAddress,
      billDate,
      printSize,
      paymentMethod,
      paidAmount: calculatedPaidAmount,
      dueAmount: calculatedDueAmount,
      items: rows.map((r) => ({
        id: r.id,
        productId: r.productId,
        name: r.name,
        unit: r.unit,
        mrp: Number(r.mrp) || 0,
        discountPercent: Number(r.discountPercent) || 0,
        rate: Number(r.rate) || 0,
        quantity: Number(r.quantity) || 1,
        gstPercent: Number(r.gstPercent) || 0,
        amount: r.amount,
      })),
      notes,
      updatedAt: new Date().toISOString(),
    };

    localStore.saveDraftBill(draft);
    showToast(`Bill saved to Draft Bills (${draft.invoiceNumber})`, 'info');
  };

  // Resume Draft
  const handleResumeDraft = (draft: DraftBill) => {
    setCustomerMobile(draft.customerMobile || '');
    setCustomerName(draft.customerName || 'Walk-in Customer');
    setCustomerAddress(draft.customerAddress || '');
    setBillDate(draft.billDate || new Date().toISOString().split('T')[0]);
    setBillNo(draft.invoiceNumber || billNo);
    setPrintSize(draft.printSize || 'A4');
    setPaymentMethod(draft.paymentMethod || 'CASH');
    setNotes(draft.notes || '');

    if (draft.items && draft.items.length > 0) {
      setRows(
        draft.items.map((it) => ({
          id: it.id || `row_${Date.now()}_${Math.random()}`,
          productId: it.productId || '',
          name: it.name,
          unit: it.unit || 'PCS',
          mrp: it.mrp || '',
          discountPercent: it.discountPercent || '',
          rate: it.rate || '',
          quantity: it.quantity || 1,
          gstPercent: it.gstPercent || 0,
          amount: it.amount || 0,
        }))
      );
    }

    router.push('/merchant/pos');
    showToast(`Resumed draft #${draft.invoiceNumber}`, 'info');
  };

  const handleDeleteDraft = (draftId: string) => {
    localStore.deleteDraftBill(draftId);
    showToast('Draft bill deleted', 'info');
  };

  // Direct Print Modal Trigger (without immediately saving)
  const openDirectPrint = (format: 'A4' | '58MM' | '80MM') => {
    const data = prepareInvoiceData();
    setPrintModalData(data);
    setPrintModalFormat(format);
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700'
              : toastMessage.type === 'error'
              ? 'bg-rose-900/95 text-rose-100 border-rose-700'
              : 'bg-slate-900/95 text-white border-slate-700'
          }`}
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Status & Controls Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-900">
            {activeTab === 'drafts' ? 'Draft Bills' : 'New Bill'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400">
            Last updated {lastUpdatedTime} {minutesAgo > 0 ? `• ${minutesAgo}m ago` : '• just now'}
          </span>
          <button
            onClick={handleRefresh}
            title="Refresh database records"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
          <button
            title="Toggle theme"
            className="p-1.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DRAFTS TAB VIEW */}
      {activeTab === 'drafts' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Saved Draft Bills</h2>
              <p className="text-xs text-slate-500">
                Incomplete counter bills preserved safely. Click resume to finalize payment or print.
              </p>
            </div>
            <button
              onClick={() => router.push('/merchant/pos')}
              className="px-4 py-2 bg-[#5844e3] hover:bg-[#4b37d4] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create New Bill</span>
            </button>
          </div>

          {savedDrafts.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-800">No Draft Bills Found</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Any bill you pause using &quot;Save as draft&quot; will show up here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {savedDrafts.map((d) => {
                const total = d.items.reduce((s, it) => s + (it.amount || 0), 0);
                return (
                  <div key={d.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">#{d.invoiceNumber}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                          {d.items.length} items
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        <span>Customer: <strong>{d.customerName}</strong></span>
                        {d.customerMobile && <span> • Ph: {d.customerMobile}</span>}
                        <span> • Date: {d.billDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-sm text-slate-900">
                        ₹{total.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleResumeDraft(d)}
                        className="px-3 py-1.5 bg-[#5844e3] hover:bg-[#4b37d4] text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
                      >
                        <span>Resume</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(d.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete Draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* CREATE NEW BILL VIEW */
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create new bill</h1>
              <p className="text-xs text-slate-500">
                Next bill no. <span className="font-mono font-bold text-slate-700">{billNo}</span> • your typing is saved automatically, nothing is lost on refresh.
              </p>
            </div>

            {/* Action Buttons Matching Target UI */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAsDraft}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Save as draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveBill()}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>Save bill</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveBill('58MM')}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Save &amp; print 58mm</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveBill('A4')}
                className="px-4 py-2 bg-[#5844e3] hover:bg-[#4b37d4] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save &amp; print A4</span>
              </button>
            </div>
          </div>

          {/* 2-COLUMN MAIN WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* LEFT COLUMN: Customer + Items + Notes (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Customer Section Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Customer</h3>
                  <p className="text-[11px] text-slate-500">
                    Type a mobile number or name — saved customers are fetched automatically and new ones are added to your master list.
                  </p>
                </div>

                {/* Grid Row 1: Mobile, Name, Address */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* MOBILE NO. */}
                  <div className="md:col-span-4 relative">
                    <div className="flex items-center justify-between pb-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        MOBILE NO.
                      </label>
                      <span className="text-[9px] text-slate-400">auto-fetch</span>
                    </div>
                    <input
                      type="text"
                      value={customerMobile}
                      onChange={(e) => {
                        setCustomerMobile(e.target.value);
                        setShowMobileDropdown(true);
                      }}
                      onFocus={() => setShowMobileDropdown(true)}
                      placeholder="9876543210"
                      className="w-full text-xs font-mono px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all text-slate-800 placeholder-slate-400"
                    />

                    {/* Auto-fetch customer dropdown */}
                    {showMobileDropdown && filteredCustomersByMobile.length > 0 && customerMobile.trim().length >= 2 && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {filteredCustomersByMobile.slice(0, 6).map((c) => (
                          <div
                            key={c.id}
                            onClick={() => selectCustomer(c)}
                            className="p-2 hover:bg-purple-50/70 cursor-pointer text-xs flex justify-between items-center transition-colors"
                          >
                            <div>
                              <div className="font-bold text-slate-800">{c.name}</div>
                              <div className="text-[10px] font-mono text-slate-500">{c.mobile}</div>
                            </div>
                            {c.totalDue > 0 && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                Due: ₹{c.totalDue}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CUSTOMER NAME */}
                  <div className="md:col-span-4 relative">
                    <div className="flex items-center justify-between pb-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        CUSTOMER NAME
                      </label>
                    </div>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setShowCustomerNameDropdown(true);
                      }}
                      onFocus={() => setShowCustomerNameDropdown(true)}
                      placeholder="Walk-in Customer"
                      className="w-full text-xs px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all text-slate-800 placeholder-slate-400"
                    />

                    {/* Auto-suggest customer by name */}
                    {showCustomerNameDropdown && filteredCustomersByName.length > 0 && customerName.trim().length >= 2 && customerName !== 'Walk-in Customer' && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {filteredCustomersByName.slice(0, 6).map((c) => (
                          <div
                            key={c.id}
                            onClick={() => selectCustomer(c)}
                            className="p-2 hover:bg-purple-50/70 cursor-pointer text-xs flex justify-between items-center transition-colors"
                          >
                            <div>
                              <div className="font-bold text-slate-800">{c.name}</div>
                              <div className="text-[10px] font-mono text-slate-500">{c.mobile}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ADDRESS */}
                  <div className="md:col-span-4">
                    <div className="flex items-center justify-between pb-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        ADDRESS
                      </label>
                      <span className="text-[9px] text-slate-400">printed on the bill</span>
                    </div>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Shop 12, Main Market, Patna"
                      className="w-full text-xs px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Grid Row 2: Bill Date, Bill No, Print Size, Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 pt-1 border-t border-slate-100">
                  {/* BILL DATE */}
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider pb-1">
                      BILL DATE
                    </label>
                    <input
                      type="date"
                      value={billDate}
                      onChange={(e) => setBillDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all text-slate-800"
                    />
                  </div>

                  {/* BILL NO. */}
                  <div className="md:col-span-3">
                    <div className="flex items-center justify-between pb-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        BILL NO.
                      </label>
                      <span className="text-[9px] text-slate-400">auto if blank</span>
                    </div>
                    <input
                      type="text"
                      value={billNo}
                      onChange={(e) => setBillNo(e.target.value)}
                      placeholder="INV-0001"
                      className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all text-slate-800"
                    />
                  </div>

                  {/* PRINT SIZE */}
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider pb-1">
                      PRINT SIZE
                    </label>
                    <select
                      value={printSize}
                      onChange={(e) => setPrintSize(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all text-slate-800 cursor-pointer"
                    >
                      <option value="A4">A4 smart invoice</option>
                      <option value="58MM">58mm thermal bill</option>
                      <option value="80MM">80mm thermal bill</option>
                    </select>
                  </div>

                  {/* PAYMENT METHOD */}
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider pb-1">
                      PAYMENT METHOD
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full text-xs font-bold px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all text-slate-800 cursor-pointer"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI / QR</option>
                      <option value="CARD">Card</option>
                      <option value="BANK">Net Banking</option>
                      <option value="CREDIT">Pending / Credit</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Section Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Items</h3>
                    <p className="text-[11px] text-slate-500">
                      Pick a stock item and every column fills in by itself. Leave Discount % blank and the MRP is charged as the rate. Unit accepts your own custom units from the stock register.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addRow}
                    className="self-start sm:self-auto px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-600" />
                    <span>Add row</span>
                  </button>
                </div>

                {/* Items Table Container */}
                <div className="overflow-x-auto border border-slate-200/70 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
                        <th className="py-2.5 px-3 min-w-[200px]">ITEM</th>
                        <th className="py-2.5 px-2 w-20">UNIT</th>
                        <th className="py-2.5 px-2 w-24">MRP</th>
                        <th className="py-2.5 px-2 w-20">DISC %</th>
                        <th className="py-2.5 px-2 w-24">RATE</th>
                        <th className="py-2.5 px-2 w-16">QTY</th>
                        <th className="py-2.5 px-2 w-20">GST %</th>
                        <th className="py-2.5 px-3 w-28 text-right">AMOUNT</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, index) => (
                        <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                          {/* ITEM with Auto-fetch dropdown */}
                          <td className="p-2 relative min-w-[200px]">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => {
                                updateRowField(index, 'name', e.target.value);
                                setActiveItemSearch(e.target.value);
                                setActiveRowDropdown(index);
                              }}
                              onFocus={() => {
                                setActiveRowDropdown(index);
                                setActiveItemSearch(row.name);
                              }}
                              placeholder="Click to see all items or type"
                              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:border-purple-600 transition-all text-slate-800 placeholder-slate-400 font-medium"
                            />

                            {/* Autocomplete Dropdown */}
                            {activeRowDropdown === index && (
                              <div className="absolute top-full left-2 right-2 mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                                <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                                  <span>Inventory Items ({filteredProducts.length})</span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveRowDropdown(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {filteredProducts.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-slate-400">
                                    No items match &quot;{activeItemSearch}&quot;. You can keep typing custom name.
                                  </div>
                                ) : (
                                  filteredProducts.map((prod) => (
                                    <div
                                      key={prod.id}
                                      onClick={() => selectProductForRow(index, prod)}
                                      className="p-2.5 hover:bg-purple-50 cursor-pointer flex justify-between items-center transition-colors"
                                    >
                                      <div>
                                        <div className="font-bold text-slate-800 text-xs">{prod.name}</div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                                          <span>{prod.category}</span>
                                          <span>•</span>
                                          <span className="font-mono">Stock: {prod.currentStock} {prod.unit}</span>
                                          {prod.taxRate > 0 && (
                                            <>
                                              <span>•</span>
                                              <span>GST {prod.taxRate}%</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right font-mono">
                                        <div className="font-black text-slate-900 text-xs">
                                          ₹{Number(prod.sellingPrice).toFixed(2)}
                                        </div>
                                        {prod.mrp > prod.sellingPrice && (
                                          <div className="text-[10px] text-slate-400 line-through">
                                            ₹{prod.mrp}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </td>

                          {/* UNIT */}
                          <td className="p-2 w-20">
                            <input
                              type="text"
                              value={row.unit}
                              onChange={(e) => updateRowField(index, 'unit', e.target.value.toUpperCase())}
                              placeholder="DOZ"
                              className="w-full text-xs font-mono uppercase text-center px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-slate-800"
                            />
                          </td>

                          {/* MRP */}
                          <td className="p-2 w-24">
                            <input
                              type="number"
                              value={row.mrp}
                              onChange={(e) => updateRowField(index, 'mrp', e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="0.00"
                              className="w-full text-xs font-mono text-right px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-slate-800"
                            />
                          </td>

                          {/* DISC % */}
                          <td className="p-2 w-20">
                            <input
                              type="number"
                              value={row.discountPercent}
                              onChange={(e) => updateRowField(index, 'discountPercent', e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="0"
                              className="w-full text-xs font-mono text-right px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-slate-800"
                            />
                          </td>

                          {/* RATE */}
                          <td className="p-2 w-24">
                            <input
                              type="number"
                              value={row.rate}
                              onChange={(e) => updateRowField(index, 'rate', e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="0.00"
                              className="w-full text-xs font-mono font-semibold text-right px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-slate-800"
                            />
                          </td>

                          {/* QTY */}
                          <td className="p-2 w-16">
                            <input
                              type="number"
                              value={row.quantity}
                              onChange={(e) => updateRowField(index, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                              min="1"
                              placeholder="1"
                              className="w-full text-xs font-mono font-bold text-center px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-slate-800"
                            />
                          </td>

                          {/* GST % */}
                          <td className="p-2 w-20">
                            <select
                              value={row.gstPercent}
                              onChange={(e) => updateRowField(index, 'gstPercent', Number(e.target.value))}
                              className="w-full text-xs font-mono text-center px-1 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-slate-800"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </td>

                          {/* AMOUNT */}
                          <td className="p-2 w-28 text-right font-mono font-black text-slate-900">
                            {row.amount.toFixed(2)}
                          </td>

                          {/* REMOVE ACTION */}
                          <td className="p-2 w-10 text-center">
                            <button
                              type="button"
                              onClick={() => removeRow(index)}
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                              title="Delete Row"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Optional Notes on the Bill */}
                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-1.5">
                    NOTES ON THE BILL (OPTIONAL)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Delivery instructions, warranty note, etc."
                    className="w-full text-xs px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all text-slate-800 placeholder-slate-400 resize-y"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Bill Summary & Print Controls (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Bill summary Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Bill summary</h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable value</span>
                    <span className="font-mono font-semibold text-slate-900">₹{taxableValue.toFixed(2)}</span>
                  </div>

                  {totalTax > 0 && (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>GST (CGST + SGST)</span>
                      <span className="font-mono">₹{totalTax.toFixed(2)}</span>
                    </div>
                  )}

                  {roundOff !== 0 && (
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Round Off</span>
                      <span className="font-mono">{roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900">Grand total</span>
                    <span className="text-xl font-black text-slate-900 font-mono">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Dynamic Callout Box */}
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed space-y-2">
                  {paymentMethod === 'CASH' && (
                    <p>
                      Full payment of ₹{grandTotal.toFixed(2)} received by Cash. Choose &quot;Pending / Credit&quot; to enter a part payment and send the balance to khatabook.
                    </p>
                  )}
                  {paymentMethod === 'UPI' && (
                    <p>
                      Full payment of ₹{grandTotal.toFixed(2)} received via UPI / QR. Instant digital payment.
                    </p>
                  )}
                  {paymentMethod === 'CARD' && (
                    <p>
                      Full payment of ₹{grandTotal.toFixed(2)} received via Card swipe.
                    </p>
                  )}
                  {paymentMethod === 'BANK' && (
                    <p>
                      Full payment of ₹{grandTotal.toFixed(2)} received via Net Banking / NEFT transfer.
                    </p>
                  )}
                  {paymentMethod === 'CREDIT' && (
                    <div className="space-y-2">
                      <div className="font-bold text-amber-800">
                        Khata Credit &amp; Part Payment:
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold">
                          Paid Now:
                        </label>
                        <input
                          type="number"
                          value={paidAmountInput}
                          onChange={(e) => setPaidAmountInput(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="0.00"
                          className="w-24 text-xs font-mono px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-bold"
                        />
                      </div>
                      <div className="flex justify-between font-bold text-amber-700 text-xs pt-1 border-t border-slate-200">
                        <span>Balance to Khatabook:</span>
                        <span className="font-mono">₹{calculatedDueAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* In Words */}
                <div className="text-[11px] text-slate-500 italic">
                  <strong>In words:</strong> {inWords}
                </div>
              </div>

              {/* Print Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Print</h3>
                  <p className="text-[11px] text-slate-400">Printed copies</p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => openDirectPrint('A4')}
                    className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>A4 smart invoice (watermarked)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openDirectPrint('58MM')}
                    className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>58mm thermal bill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openDirectPrint('80MM')}
                    className="w-full py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>80mm thermal bill</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal pt-1">
                  The A4 invoice carries your business name as a watermark on every page and a UPI QR pre-filled with the amount due.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT MODAL & PREVIEW DIALOG */}
      {showPrintModal && printModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Print Invoice #{printModalData.invoiceNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select preview layout and print directly to connected printer
                  </p>
                </div>
              </div>

              {/* Format Switcher Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPrintModalFormat('A4')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    printModalFormat === 'A4'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A4 Smart
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalFormat('58MM')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    printModalFormat === '58MM'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  58mm Thermal
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalFormat('80MM')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    printModalFormat === '80MM'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  80mm Thermal
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable Document Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center">
              <div id="print-section" className="w-full flex justify-center">
                {printModalFormat === 'A4' ? (
                  <A4InvoicePrint data={printModalData} company={company} />
                ) : (
                  <ThermalReceiptPrint
                    data={printModalData}
                    company={company}
                    width={printModalFormat}
                  />
                )}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Format: <strong className="text-slate-800">{printModalFormat}</strong> • Total: <strong className="text-purple-700 font-mono">₹{printModalData.grandTotal.toFixed(2)}</strong>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://api.whatsapp.com/send?phone=${printModalData.customerMobile || ''}&text=${encodeURIComponent(
                    `Namaste ${printModalData.customerName}! Thank you for shopping with ${company?.name || 'VypaarMitra'}. Your bill #${printModalData.invoiceNumber} for ₹${printModalData.grandTotal.toFixed(2)} is confirmed.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-[#5844e3] hover:bg-[#4b37d4] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Renewal Modal */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-rose-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Subscription Plan Expired</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your shop subscription validity has ended. Invoicing, stock deductions, and billing are locked until renewal.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-600">
                <span>Shop:</span>
                <span className="font-bold text-slate-900">{company?.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Plan:</span>
                <span className="font-bold text-indigo-700">{company?.planId}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Validity Expired:</span>
                <span className="font-bold text-rose-600">
                  {company?.subscriptionExpiresAt ? new Date(company.subscriptionExpiresAt).toLocaleDateString('en-IN') : 'Expired'}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600">
              Please contact NPB Media support or Super Admin to renew your subscription plan.
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-lg font-bold">
                <Phone className="w-3.5 h-3.5" />
                <span>+91 8877300114</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowRenewalModal(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
