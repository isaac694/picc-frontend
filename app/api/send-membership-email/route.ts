import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

type MembershipPayload = {
  churchEmail: string;
  fullName: string;
  gender: string;
  email: string;
  phone: string;
  city: string;
  country: string;
};

const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'] as const;

function missingSmtpEnv() {
  return requiredEnv.filter((name) => !process.env[name]);
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

    const payload = (await request.json()) as MembershipPayload;
    if (
      !payload?.churchEmail ||
      !payload?.fullName ||
      !payload?.gender ||
      !payload?.email ||
      !payload?.phone ||
      !payload?.city ||
      !payload?.country
    ) {
      return NextResponse.json({ error: 'Invalid membership payload' }, { status: 400 });
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

    const subject = `New Membership Submission - ${payload.fullName}`;
    const lines = [
      `Full Name: ${payload.fullName}`,
      `Gender: ${payload.gender}`,
      `Email: ${payload.email}`,
      `Phone Number: ${payload.phone}`,
      `City/District: ${payload.city}`,
      `Country: ${payload.country}`,
    ];

    const textBody = lines.join('\n');
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New Membership Submission</h2>
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
        error: error instanceof Error ? error.message : 'Failed to send membership email',
      },
      { status: 500 }
    );
  }
}
