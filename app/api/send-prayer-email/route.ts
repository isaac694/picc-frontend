import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

type PrayerPayload = {
  churchEmail: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  bornAgain?: string;
  areaOfNeed?: string;
  request: string;
};

const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'] as const;

function missingSmtpEnv() {
  return requiredEnv.filter((name) => !process.env[name]);
}

function formatValue(value?: string) {
  if (!value) return 'N/A';
  return value;
}

export async function POST(request: Request) {
  try {
    const missing = missingSmtpEnv();
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Missing SMTP configuration: ${missing.join(', ')}`,
        },
        { status: 500 }
      );
    }

    const payload = (await request.json()) as PrayerPayload;
    if (!payload?.churchEmail || !payload?.fullName || !payload?.request) {
      return NextResponse.json({ error: 'Invalid prayer payload' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const subject = `New Prayer Request - ${payload.fullName}`;
    const lines = [
      `Full Name: ${payload.fullName}`,
      `Email: ${formatValue(payload.email)}`,
      `Phone: ${formatValue(payload.phone)}`,
      `Address: ${formatValue(payload.address)}`,
      `City: ${formatValue(payload.city)}`,
      `State: ${formatValue(payload.state)}`,
      `Country: ${formatValue(payload.country)}`,
      `Born Again: ${formatValue(payload.bornAgain)}`,
      `Area of Need: ${formatValue(payload.areaOfNeed)}`,
      '',
      'Prayer Request:',
      payload.request,
    ];

    const textBody = lines.join('\n');
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New Prayer Request</h2>
        <p>${lines.map((line) => line.replace(/\n/g, '<br/>')).join('<br/>')}</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: payload.churchEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send prayer email',
      },
      { status: 500 }
    );
  }
}
