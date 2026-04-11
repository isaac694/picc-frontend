import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

type TestimonyPayload = {
  churchEmail: string;
  fullName: string;
  phone?: string;
  area?: string;
  situation: string;
  testimony: string;
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

    const payload = (await request.json()) as TestimonyPayload;
    if (!payload?.churchEmail || !payload?.fullName || !payload?.situation || !payload?.testimony) {
      return NextResponse.json({ error: 'Invalid testimony payload' }, { status: 400 });
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

    const subject = `New Testimony - ${payload.fullName}`;
    const lines = [
      `Full Name: ${payload.fullName}`,
      `Phone Number: ${formatValue(payload.phone)}`,
      `Area of Testimony: ${formatValue(payload.area)}`,
      '',
      'How the situation was like:',
      payload.situation,
      '',
      'What God has done:',
      payload.testimony,
    ];

    const textBody = lines.join('\n');
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New Testimony Submission</h2>
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
        error: error instanceof Error ? error.message : 'Failed to send testimony email',
      },
      { status: 500 }
    );
  }
}
