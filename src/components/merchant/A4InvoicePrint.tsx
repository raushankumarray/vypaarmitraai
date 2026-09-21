'use client';

import React, { useEffect, useState } from 'react';
import { Company } from '@/types';
import { generateUpiQr, numberToIndianWords } from '@/lib/billingUtils';

export interface InvoicePrintItem {
  id?: string;
  name: string;
  unit: string;
  mrp: number;
  discountPercent: number;
  rate: number;
  quantity: number;
  gstPercent: number;
  amount: number;
}

export interface InvoicePrintData {
  invoiceNumber: string;
  billDate: string;
  paymentMethod: string;
  customerName: string;
  customerMobile?: string;
  customerAddress?: string;
  customerGstin?: string;
  items: InvoicePrintItem[];
  subtotal: number;
  taxableValue: number;
  totalTax: number;
  cgstTotal: number;
  sgstTotal: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  notes?: string;
}

interface A4InvoicePrintProps {
  data: InvoicePrintData;
  company?: Company | null;
  onClose?: () => void;
  autoPrint?: boolean;
}

export function A4InvoicePrint({ data, company, onClose, autoPrint = false }: A4InvoicePrintProps) {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    async function loadQr() {
      const vpa = company?.bankDetails?.upiId || `${company?.mobile || '8877300114'}@upi`;
      const qr = await generateUpiQr(vpa, company?.name || 'VypaarMitra Merchant', data.grandTotal, `Invoice #${data.invoiceNumber}`);
      setQrUrl(qr);
    }
    loadQr();
  }, [company, data.grandTotal, data.invoiceNumber]);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const words = numberToIndianWords(data.grandTotal);

  return (
    <div className="relative bg-white text-slate-900 w-full max-w-[210mm] mx-auto p-8 shadow-md print:shadow-none print:p-0 print:m-0 print:max-w-none text-xs leading-normal font-sans border border-slate-200 print:border-none min-h-[297mm] flex flex-col justify-between overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
        <span className="text-slate-100 font-black text-7xl md:text-8xl rotate-[-30deg] tracking-widest uppercase opacity-70">
          {company?.name || 'VYPAARMITRA AI'}
        </span>
      </div>

      {/* Main Document Content */}
      <div className="relative z-10 space-y-4">
        {/* Header Strip */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
              <img
                src={company?.logoUrl || '/logo.png'}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {company?.name || 'VypaarMitra Retail & Wholesale'}
              </h1>
              <p className="text-[11px] text-slate-600 font-medium">
                {company?.address || 'Main Road, Commercial Center'}, {company?.city || 'Patna'}, {company?.state || 'Bihar'}
              </p>
              <div className="flex flex-wrap gap-x-4 text-[11px] text-slate-700 pt-0.5">
                <span><strong>Phone:</strong> {company?.mobile || '+91 8877300114'}</span>
                {company?.email && <span><strong>Email:</strong> {company.email}</span>}
                <span><strong>GSTIN:</strong> {company?.gstin || '04AAACP1234M1Z5'}</span>
                <span><strong>State:</strong> {company?.state || 'Bihar'} (10)</span>
              </div>
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded">
              TAX INVOICE
            </span>
            <div className="text-xs pt-1">
              <span className="text-slate-500 font-medium">ORIGINAL FOR RECIPIENT</span>
            </div>
          </div>
        </div>

        {/* Invoice Meta & Customer Grid */}
        <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded p-3 bg-slate-50/50">
          {/* Bill To */}
          <div className="space-y-1 pr-2 border-r border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BILLED TO (CUSTOMER)</div>
            <div className="text-sm font-black text-slate-900">{data.customerName || 'Walk-in Customer'}</div>
            {data.customerMobile && (
              <div className="text-slate-700"><strong>Mobile:</strong> +91 {data.customerMobile}</div>
            )}
            {data.customerAddress && (
              <div className="text-slate-700"><strong>Address:</strong> {data.customerAddress}</div>
            )}
            {data.customerGstin && (
              <div className="text-slate-700"><strong>GSTIN:</strong> {data.customerGstin}</div>
            )}
          </div>

          {/* Invoice Particulars */}
          <div className="space-y-1 pl-2 text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">INVOICE PARTICULARS</div>
            <div><strong className="text-slate-600">Invoice No:</strong> <span className="font-mono font-bold text-slate-900 text-sm">{data.invoiceNumber}</span></div>
            <div><strong className="text-slate-600">Invoice Date:</strong> <span className="font-bold text-slate-900">{data.billDate}</span></div>
            <div><strong className="text-slate-600">Payment Mode:</strong> <span className="font-bold text-emerald-700 uppercase">{data.paymentMethod}</span></div>
            <div><strong className="text-slate-600">Place of Supply:</strong> <span className="font-bold text-slate-900">{company?.state || 'Bihar'}</span></div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-slate-300 rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-[10px] uppercase font-bold border-b border-slate-300 tracking-wider">
                <th className="py-2 px-2 text-center w-8">#</th>
                <th className="py-2 px-2">Item Description</th>
                <th className="py-2 px-2 text-center w-12">Unit</th>
                <th className="py-2 px-2 text-right w-16">MRP</th>
                <th className="py-2 px-2 text-right w-16">Rate</th>
                <th className="py-2 px-2 text-center w-12">Qty</th>
                <th className="py-2 px-2 text-right w-12">Disc%</th>
                <th className="py-2 px-2 text-right w-16">Taxable</th>
                <th className="py-2 px-2 text-right w-14">GST</th>
                <th className="py-2 px-2 text-right w-20">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-400 italic">No bill items</td>
                </tr>
              ) : (
                data.items.map((item, idx) => {
                  const lineTaxable = (item.rate || item.mrp) * (item.quantity || 1);
                  const lineTax = lineTaxable * ((item.gstPercent || 0) / 100);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2 font-bold text-slate-900">{item.name || 'Unnamed Item'}</td>
                      <td className="py-2 px-2 text-center text-slate-600 uppercase font-mono">{item.unit || 'PCS'}</td>
                      <td className="py-2 px-2 text-right text-slate-500 font-mono">₹{Number(item.mrp || item.rate).toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-mono">₹{Number(item.rate).toFixed(2)}</td>
                      <td className="py-2 px-2 text-center font-bold font-mono">{item.quantity}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-500">{item.discountPercent || 0}%</td>
                      <td className="py-2 px-2 text-right font-mono">₹{lineTaxable.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-600">{item.gstPercent || 0}%</td>
                      <td className="py-2 px-2 text-right font-black text-slate-900 font-mono">₹{Number(item.amount).toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary & Notes */}
        <div className="grid grid-cols-12 gap-4 items-start pt-2">
          {/* Notes & Words */}
          <div className="col-span-7 space-y-3">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AMOUNT IN WORDS</div>
              <div className="text-xs font-bold text-slate-900 pt-0.5">{words}</div>
            </div>

            {data.notes && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px]">
                <strong className="text-slate-700">Remarks / Instructions:</strong> {data.notes}
              </div>
            )}

            {/* Bank Details & QR */}
            <div className="flex items-center gap-4 border border-slate-200 rounded p-2.5 bg-white">
              {qrUrl && (
                <div className="flex-shrink-0 text-center">
                  <img src={qrUrl} alt="UPI QR Code" className="w-20 h-20 border border-slate-200 rounded p-0.5" />
                  <div className="text-[9px] font-bold text-slate-600 mt-0.5">Scan &amp; Pay UPI</div>
                </div>
              )}
              <div className="text-[10px] text-slate-700 space-y-0.5">
                <div className="font-bold text-slate-900 uppercase">Bank Payment Details</div>
                <div><strong>Bank:</strong> {company?.bankDetails?.bankName || 'State Bank of India'}</div>
                <div><strong>A/C Holder:</strong> {company?.bankDetails?.accountName || company?.name || 'VypaarMitra'}</div>
                <div><strong>A/C No:</strong> {company?.bankDetails?.accountNumber || '398201948201'}</div>
                <div><strong>IFSC Code:</strong> {company?.bankDetails?.ifscCode || 'SBIN0001234'}</div>
                <div><strong>UPI ID:</strong> {company?.bankDetails?.upiId || `${company?.mobile || '8877300114'}@upi`}</div>
              </div>
            </div>
          </div>

          {/* Totals Table */}
          <div className="col-span-5 border border-slate-300 rounded overflow-hidden">
            <div className="bg-slate-50 p-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Value:</span>
                <span className="font-mono font-bold text-slate-900">₹{data.taxableValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST:</span>
                <span className="font-mono text-slate-900">₹{data.cgstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST:</span>
                <span className="font-mono text-slate-900">₹{data.sgstTotal.toFixed(2)}</span>
              </div>
              {data.roundOff !== 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Round Off:</span>
                  <span className="font-mono text-slate-900">{data.roundOff > 0 ? `+₹${data.roundOff.toFixed(2)}` : `-₹${Math.abs(data.roundOff).toFixed(2)}`}</span>
                </div>
              )}
              <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between items-center text-sm font-black text-slate-900">
                <span>GRAND TOTAL:</span>
                <span className="text-base text-purple-700 font-mono">₹{data.grandTotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-1 flex justify-between text-[11px] text-emerald-800 font-bold">
                <span>Paid ({data.paymentMethod}):</span>
                <span className="font-mono">₹{data.paidAmount.toFixed(2)}</span>
              </div>
              {data.dueAmount > 0 && (
                <div className="flex justify-between text-[11px] text-amber-700 font-bold">
                  <span>Balance Due (Khatabook):</span>
                  <span className="font-mono">₹{data.dueAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Signature Section */}
      <div className="relative z-10 mt-6 pt-4 border-t border-slate-300">
        <div className="grid grid-cols-2 gap-4 items-end">
          <div className="text-[9px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-700 uppercase">Terms &amp; Conditions</div>
            <div>1. Goods once sold will only be returned within 7 days with original invoice.</div>
            <div>2. All disputes are subject to local jurisdiction.</div>
            <div className="italic pt-1 font-mono">Software Powered by VypaarMitra AI (NPB MEDIA)</div>
          </div>

          <div className="text-right space-y-12">
            <div className="text-[10px] font-bold text-slate-800 uppercase">
              For {company?.name || 'VypaarMitra Retail & Wholesale'}
            </div>
            <div className="text-[10px] font-bold text-slate-600 border-t border-slate-400 inline-block pt-1 px-4">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
