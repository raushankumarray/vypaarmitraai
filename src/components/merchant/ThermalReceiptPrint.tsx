'use client';

import React, { useEffect, useState } from 'react';
import { Company } from '@/types';
import { generateUpiQr } from '@/lib/billingUtils';
import { InvoicePrintData } from './A4InvoicePrint';

interface ThermalReceiptPrintProps {
  data: InvoicePrintData;
  company?: Company | null;
  width?: '58MM' | '80MM';
  autoPrint?: boolean;
}

export function ThermalReceiptPrint({
  data,
  company,
  width = '58MM',
  autoPrint = false,
}: ThermalReceiptPrintProps) {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    async function loadQr() {
      const vpa = company?.bankDetails?.upiId || `${company?.mobile || '8877300114'}@upi`;
      const qr = await generateUpiQr(vpa, company?.name || 'VypaarMitra', data.grandTotal, `Bill #${data.invoiceNumber}`);
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

  const is58mm = width === '58MM';
  const totalQty = data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <div
      className={`bg-white text-slate-900 mx-auto p-4 font-mono leading-tight shadow-md print:shadow-none print:p-0 print:m-0 print:border-none border border-slate-200 text-[11px] ${
        is58mm ? 'max-w-[58mm] w-full text-[10px]' : 'max-w-[80mm] w-full text-xs'
      }`}
    >
      {/* Header Store Details */}
      <div className="text-center space-y-1">
        <div className="w-12 h-12 mx-auto flex items-center justify-center">
          <img src={company?.logoUrl || '/logo.png'} alt="Logo" className="w-full h-full object-contain filter grayscale" />
        </div>
        <div className="font-black text-xs uppercase tracking-tight">
          {company?.name || 'VypaarMitra Store'}
        </div>
        <div className="text-[9px] text-slate-600">
          {company?.address || 'Main Market'}, {company?.city || 'Patna'}
        </div>
        <div className="text-[9px] text-slate-600">
          Ph: {company?.mobile || '+91 8877300114'}
        </div>
        {company?.gstin && (
          <div className="text-[9px] text-slate-600 font-bold">
            GSTIN: {company.gstin}
          </div>
        )}
      </div>

      <div className="border-b border-dashed border-slate-400 my-2" />

      {/* Invoice Meta */}
      <div className="space-y-0.5 text-[9px]">
        <div className="flex justify-between">
          <span>Bill No: #{data.invoiceNumber}</span>
          <span>{data.billDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="truncate pr-1">Cust: {data.customerName || 'Walk-in'}</span>
          {data.customerMobile && <span>Ph: {data.customerMobile}</span>}
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Pay: {data.paymentMethod}</span>
          <span>Cashier: POS</span>
        </div>
      </div>

      <div className="border-b border-dashed border-slate-400 my-2" />

      {/* Itemized Table */}
      <div className="space-y-1.5">
        <div className="flex justify-between font-bold text-[9px] uppercase border-b border-slate-200 pb-0.5">
          <span>Item</span>
          <span>Qty x Rate</span>
          <span className="text-right">Amt (₹)</span>
        </div>

        {data.items.length === 0 ? (
          <div className="text-center py-2 text-slate-400">No items</div>
        ) : (
          data.items.map((it, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="font-bold truncate text-slate-900">{it.name}</div>
              <div className="flex justify-between text-[9px] text-slate-600">
                <span>
                  {it.quantity} {it.unit || 'PCS'} x ₹{Number(it.rate || it.mrp).toFixed(2)}
                  {it.discountPercent > 0 && ` (-${it.discountPercent}%)`}
                </span>
                <span className="font-bold text-slate-900 font-mono">₹{Number(it.amount).toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-b border-dashed border-slate-400 my-2" />

      {/* Totals Summary */}
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>Total Items / Qty:</span>
          <span className="font-bold">{data.items.length} / {totalQty}</span>
        </div>
        <div className="flex justify-between">
          <span>Taxable Value:</span>
          <span>₹{data.taxableValue.toFixed(2)}</span>
        </div>
        {data.totalTax > 0 && (
          <div className="flex justify-between">
            <span>GST Amount:</span>
            <span>₹{data.totalTax.toFixed(2)}</span>
          </div>
        )}
        {data.roundOff !== 0 && (
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>Round Off:</span>
            <span>{data.roundOff > 0 ? `+₹${data.roundOff.toFixed(2)}` : `-₹${Math.abs(data.roundOff).toFixed(2)}`}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-800">
          <span>NET AMOUNT:</span>
          <span className="text-sm font-bold">₹{data.grandTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[9px] pt-0.5">
          <span>Paid ({data.paymentMethod}):</span>
          <span>₹{data.paidAmount.toFixed(2)}</span>
        </div>
        {data.dueAmount > 0 && (
          <div className="flex justify-between text-[9px] font-bold text-amber-700">
            <span>Due (Khatabook):</span>
            <span>₹{data.dueAmount.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="border-b border-dashed border-slate-400 my-2" />

      {/* QR Code */}
      {qrUrl && (
        <div className="text-center my-2">
          <img src={qrUrl} alt="UPI QR Code" className="w-24 h-24 mx-auto border border-slate-300 p-0.5" />
          <div className="text-[8px] font-bold mt-0.5 uppercase tracking-wider">Scan &amp; Pay Instant UPI</div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center space-y-0.5 text-[8px] text-slate-500 pt-1">
        <div>Thank you for shopping with us!</div>
        <div>Please visit again!</div>
        <div className="text-[7px] text-slate-400 pt-1">Powered by VypaarMitra AI</div>
      </div>
    </div>
  );
}
