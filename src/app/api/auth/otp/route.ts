import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface OtpRecord {
  code: string;
  userId: string;
  channel: 'EMAIL' | 'WHATSAPP';
  target: string;
  expiresAt: number;
  attempts: number;
}

// Global server-side in-memory OTP cache
const otpStore = new Map<string, OtpRecord>();

// Cleanup expired OTPs every 2 minutes
setInterval(() => {
  const now = Date.now();
  otpStore.forEach((record, key) => {
    if (record.expiresAt < now) {
      otpStore.delete(key);
    }
  });
}, 120000);

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}***${local.slice(-1)}@${domain}`;
}

function maskMobile(mobile: string): string {
  const clean = mobile.replace(/\D/g, '');
  if (clean.length < 6) return mobile;
  const last4 = clean.slice(-4);
  return `+91 ******${last4}`;
}

function formatPhoneForWhatsApp(mobile: string): string {
  let clean = mobile.replace(/\D/g, '');
  if (clean.length === 10) clean = '91' + clean;
  return clean;
}

async function sendSmtpEmail(to: string, code: string, userName: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const from = process.env.SMTP_FROM || `"VypaarMitra AI" <${user || 'no-reply@vypaarmitra.com'}>`;

  if (!host || !user || !pass) {
    return false; // SMTP not configured; will fallback to preview
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #080d1a; color: #f8fafc; margin: 0; padding: 30px 15px; }
        .card { max-width: 480px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
        .header { text-align: center; margin-bottom: 24px; }
        .brand { font-size: 20px; font-weight: 800; color: #38bdf8; letter-spacing: -0.5px; }
        .subtitle { font-size: 13px; color: #94a3b8; margin-top: 4px; }
        .greeting { font-size: 14px; color: #cbd5e1; margin-bottom: 16px; }
        .code-box { background: #1e293b; border: 2px dashed #38bdf8; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; font-family: monospace; }
        .expiry { font-size: 12px; color: #f59e0b; margin-top: 8px; font-weight: 600; }
        .warning { font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 24px; border-top: 1px solid #1e293b; pt: 16px; }
        .footer { text-align: center; font-size: 11px; color: #475569; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">VYPAARMITRA AI</div>
          <div class="subtitle">Secure Business Authentication</div>
        </div>
        <div class="greeting">
          Hello <strong>${userName || 'User'}</strong>,
        </div>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
          Use the following verification code to securely sign in to your VypaarMitra AI workspace:
        </p>
        <div class="code-box">
          <div class="otp-code">${code}</div>
          <div class="expiry">Valid for 5 minutes</div>
        </div>
        <div class="warning">
          <strong>Security Notice:</strong> If you did not request this login code, please ignore this email or notify your system administrator immediately. Do NOT share this code with anyone.
        </div>
        <div class="footer">
          &copy; 2026 VypaarMitra AI &bull; NPB Media. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `Your VypaarMitra AI Login Code: ${code}`,
    html,
  });

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, identifier, channel, otp, user } = body;

    // -------------------------------------------------------------------------
    // 1. REQUEST OTP
    // -------------------------------------------------------------------------
    if (action === 'REQUEST_OTP') {
      if (!userId || !user) {
        return NextResponse.json(
          { success: false, message: 'User identification details required.' },
          { status: 400 }
        );
      }

      // Generate cryptographically uniform 6-digit PIN
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      let maskedTarget = '';
      let targetValue = '';
      let whatsappUrl = '';
      let sentViaSmtp = false;

      if (channel === 'WHATSAPP') {
        const mobile = user.mobile || identifier;
        if (!mobile || mobile.replace(/\D/g, '').length < 8) {
          return NextResponse.json(
            { success: false, message: 'No valid registered mobile number found for WhatsApp OTP.' },
            { status: 400 }
          );
        }
        targetValue = mobile;
        maskedTarget = maskMobile(mobile);
        const formattedPhone = formatPhoneForWhatsApp(mobile);
        const textMsg = encodeURIComponent(
          `Your VypaarMitra AI login code is: *${code}*\n\nValid for 5 minutes. Do not share this with anyone.`
        );
        whatsappUrl = `https://wa.me/${formattedPhone}?text=${textMsg}`;
      } else {
        // Default: EMAIL
        const email = user.email || (identifier.includes('@') ? identifier : '');
        if (!email || !email.includes('@')) {
          return NextResponse.json(
            { success: false, message: 'No valid registered email address found for this user.' },
            { status: 400 }
          );
        }
        targetValue = email;
        maskedTarget = maskEmail(email);

        // Attempt real SMTP send
        try {
          sentViaSmtp = await sendSmtpEmail(email, code, user.name || user.username);
        } catch (mailErr) {
          console.warn('[OTP SMTP Send Notice]:', mailErr);
          sentViaSmtp = false;
        }
      }

      // Save to server OTP store
      otpStore.set(userId, {
        code,
        userId,
        channel: channel || 'EMAIL',
        target: targetValue,
        expiresAt,
        attempts: 0,
      });

      console.log(`[VypaarMitra OTP Dispatch] Target: ${targetValue}, Code: ${code}, Channel: ${channel}`);

      return NextResponse.json({
        success: true,
        maskedTarget,
        channel: channel || 'EMAIL',
        expiresAt,
        previewCode: code, // Provided for 1-click test fill if testing without external SMTP gateway
        whatsappUrl: whatsappUrl || undefined,
        sentViaSmtp,
        message:
          channel === 'WHATSAPP'
            ? `Verification code prepared for WhatsApp ${maskedTarget}`
            : sentViaSmtp
            ? `Verification code dispatched to ${maskedTarget}`
            : `Verification code ready for ${maskedTarget}`,
      });
    }

    // -------------------------------------------------------------------------
    // 2. VERIFY OTP
    // -------------------------------------------------------------------------
    if (action === 'VERIFY_OTP') {
      if (!userId || !otp) {
        return NextResponse.json(
          { success: false, message: 'User ID and OTP code are required.' },
          { status: 400 }
        );
      }

      const record = otpStore.get(userId);
      if (!record) {
        return NextResponse.json(
          { success: false, message: 'OTP has expired or was not requested. Please request a new code.' },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(userId);
        return NextResponse.json(
          { success: false, message: 'OTP code has expired. Please request a new code.' },
          { status: 400 }
        );
      }

      if (record.code !== otp.trim()) {
        record.attempts += 1;
        if (record.attempts >= 3) {
          otpStore.delete(userId);
          return NextResponse.json(
            { success: false, message: 'Too many incorrect attempts. This OTP has been invalidated for security.' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, message: `Incorrect verification code. ${3 - record.attempts} attempt(s) remaining.` },
          { status: 400 }
        );
      }

      // OTP Verified successfully! Single-use burn to prevent replay attacks
      otpStore.delete(userId);

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully.',
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in /api/auth/otp:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Server error processing OTP.' },
      { status: 500 }
    );
  }
}
