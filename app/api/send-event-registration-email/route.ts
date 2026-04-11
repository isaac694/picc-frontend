import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

type EventRegistrationPayload = {
  churchEmail: string;
  eventTitle: string;
  eventDate?: string;
  fullName: string;
  residence: string;
  phone: string;
  email: string;
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

    const payload = (await request.json()) as EventRegistrationPayload;
    if (
      !payload?.churchEmail ||
      !payload?.eventTitle ||
      !payload?.fullName ||
      !payload?.residence ||
      !payload?.phone ||
      !payload?.email
    ) {
      return NextResponse.json({ error: 'Invalid event registration payload' }, { status: 400 });
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

    const subject = `Event Registration - ${payload.eventTitle}`;
    const lines = [
      `Event: ${payload.eventTitle}`,
      `Date: ${formatValue(payload.eventDate)}`,
      '',
      `Full name: ${payload.fullName}`,
      `Area of residence: ${payload.residence}`,
      `Phone number: ${payload.phone}`,
      `Email address: ${payload.email}`,
    ];

    const textBody = lines.join('\n');
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New Event Registration</h2>
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
        error: error instanceof Error ? error.message : 'Failed to send event registration email',
      },
      { status: 500 }
    );
  }
}
