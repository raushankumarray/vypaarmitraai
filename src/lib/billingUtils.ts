import QRCode from 'qrcode';

export interface DraftBillItem {
  id: string;
  productId?: string;
  name: string;
  unit: string;
  mrp: number;
  discountPercent: number;
  rate: number;
  quantity: number;
  gstPercent: number;
  amount: number;
}

export interface DraftBill {
  id: string;
  companyId: string;
  invoiceNumber: string;
  customerMobile: string;
  customerName: string;
  customerAddress: string;
  billDate: string;
  printSize: 'A4' | '58MM' | '80MM';
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK' | 'CREDIT';
  paidAmount?: number;
  dueAmount?: number;
  items: DraftBillItem[];
  notes?: string;
  updatedAt: string;
}

/**
 * Converts a number into Indian Currency Words (e.g. "Twelve Thousand Four Hundred Fifty Rupees and Fifty Paise Only")
 */
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num === 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return singleDigits[n];
    if (n < 20) return teens[n - 10];
    const unit = n % 10;
    const ten = Math.floor(n / 10);
    return tens[ten] + (unit > 0 ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += singleDigits[hundred] + ' Hundred';
    }
    if (rest > 0) {
      if (res.length > 0) res += ' ';
      res += convertTwoDigits(rest);
    }
    return res;
  }

  const rounded = Math.round(Math.abs(num) * 100) / 100;
  const rupeePart = Math.floor(rounded);
  const paisePart = Math.round((rounded - rupeePart) * 100);

  let result = '';

  if (rupeePart === 0) {
    result = 'Zero Rupees';
  } else {
    // Indian numbering: Crore (1,00,00,000), Lakh (1,00,000), Thousand (1,000), Hundreds (100)
    const crore = Math.floor(rupeePart / 10000000);
    let rem = rupeePart % 10000000;

    const lakh = Math.floor(rem / 100000);
    rem = rem % 100000;

    const thousand = Math.floor(rem / 1000);
    rem = rem % 1000;

    const hundredAndBelow = rem;

    let parts: string[] = [];

    if (crore > 0) {
      parts.push(convertThreeDigits(crore) + ' Crore');
    }
    if (lakh > 0) {
      parts.push(convertTwoDigits(lakh) + ' Lakh');
    }
    if (thousand > 0) {
      parts.push(convertTwoDigits(thousand) + ' Thousand');
    }
    if (hundredAndBelow > 0) {
      parts.push(convertThreeDigits(hundredAndBelow));
    }

    result = parts.join(' ') + ' Rupees';
  }

  if (paisePart > 0) {
    result += ' and ' + convertTwoDigits(paisePart) + ' Paise';
  }

  return result.trim() + ' Only';
}

/**
 * Generates an SVG or Base64 QR code Data URL for UPI payments.
 */
export async function generateUpiQr(
  vpa: string,
  payeeName: string,
  amount: number,
  note: string = 'VypaarMitra Bill Payment'
): Promise<string> {
  const cleanVpa = vpa || 'merchant@upi';
  const cleanName = encodeURIComponent(payeeName || 'VypaarMitra Merchant');
  const cleanNote = encodeURIComponent(note);
  const formattedAmount = amount > 0 ? amount.toFixed(2) : '1.00';

  const upiUrl = `upi://pay?pa=${cleanVpa}&pn=${cleanName}&am=${formattedAmount}&cu=INR&tn=${cleanNote}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(upiUrl, {
      margin: 1,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (err) {
    console.error('QR code generation error:', err);
    return '';
  }
}
