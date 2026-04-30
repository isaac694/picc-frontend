import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

type GivingNotificationPayload = {
  userEmail?: string;
  churchEmail: string;
  fullName: string;
  amount: number | string;
  currency: string;
  phone: string;
  phoneCountry: string;
  paymentMethod: string;
  reason: string;
  givingType?: string;
  specialRecipient?: string;
  givingDate?: string;
  bookletNumber?: string;
};

const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'] as const;

function missingSmtpEnv() {
  return requiredEnv.filter((name) => !process.env[name]);
}

function formatValue(value?: string | number) {
  if (value === undefined || value === null || value === '') return 'N/A';
  return String(value);
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

    const payload = (await request.json()) as GivingNotificationPayload;
    if (!payload?.churchEmail || !payload?.fullName || !payload?.amount || !payload?.currency) {
      return NextResponse.json({ error: 'Invalid giving payload' }, { status: 400 });
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

    const subject = `New Giving Submission - ${payload.fullName}`;
    const lines = [
      `Full Name: ${formatValue(payload.fullName)}`,
      `Amount: ${formatValue(payload.amount)} ${formatValue(payload.currency)}`,
      `Phone: ${formatValue(payload.phoneCountry)} ${formatValue(payload.phone)}`,
      `Payment Method: ${formatValue(payload.paymentMethod)}`,
      `Reason: ${formatValue(payload.reason)}`,
      `Giving Type: ${formatValue(payload.givingType)}`,
      `Special Recipient: ${formatValue(payload.specialRecipient)}`,
      `Giving Date: ${formatValue(payload.givingDate)}`,
      `Booklet Number: ${formatValue(payload.bookletNumber)}`,
    ];

    const textBody = lines.join('\n');
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New Giving Submission Through PayChangu</h2>
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

    if (payload.userEmail) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: payload.userEmail,
        subject: 'Your giving request was received',
        text: [
          `Hello ${payload.fullName},`,
          '',
          'Thank you for your giving request. We have received your submission.',
          `Amount: ${formatValue(payload.amount)} ${formatValue(payload.currency)}`,
          `Payment Method: ${formatValue(payload.paymentMethod)}`,
          '',
          'Please follow the payment prompt to complete your giving.',
          '',
          'Pentecost International Christian Centre (PICC)',
        ].join('\n'),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send giving notification email',
      },
      { status: 500 }
    );
  }
}
