import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const requiredEnv = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
] as const;

function missingSmtpEnv() {
  return requiredEnv.filter((name) => !process.env[name]);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
  try {
    // Check SMTP configuration
    const missing = missingSmtpEnv();

    if (missing.length > 0) {
      console.error(
        'PICC CONTACT EMAIL ERROR: Missing SMTP configuration:',
        missing
      );

      return NextResponse.json(
        {
          error: `Missing SMTP configuration: ${missing.join(', ')}`,
        },
        { status: 500 }
      );
    }

    // Read request body
    const payload = (await request.json()) as ContactPayload;

    // Validate fields
    if (
      !payload?.name?.trim() ||
      !payload?.email?.trim() ||
      !payload?.subject?.trim() ||
      !payload?.message?.trim()
    ) {
      return NextResponse.json(
        {
          error: 'Please complete all required fields before sending.',
        },
        { status: 400 }
      );
    }

    // Create SMTP transporter using the SAME configuration
    // as the working membership form.
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const name = payload.name.trim();
    const visitorEmail = payload.email.trim();
    const subject = payload.subject.trim();
    const message = payload.message.trim();

    const emailSubject = `PICC Website Contact: ${subject}`;

    const textBody = [
      'New message from the PICC website contact form',
      '',
      `Name: ${name}`,
      `Email: ${visitorEmail}`,
      `Subject: ${subject}`,
      '',
      'Message:',
      message,
    ].join('\n');

    const htmlBody = `
      <div
        style="
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #222;
          max-width: 700px;
          margin: 0 auto;
        "
      >
        <h2 style="margin-bottom: 20px;">
          New PICC Website Contact Message
        </h2>

        <p>
          <strong>Name:</strong>
          ${escapeHtml(name)}
        </p>

        <p>
          <strong>Email:</strong>
          ${escapeHtml(visitorEmail)}
        </p>

        <p>
          <strong>Subject:</strong>
          ${escapeHtml(subject)}
        </p>

        <hr style="margin: 20px 0;" />

        <p>
          <strong>Message:</strong>
        </p>

        <p>
          ${escapeHtml(message).replace(/\n/g, '<br />')}
        </p>

        <hr style="margin: 20px 0;" />

        <p style="font-size: 12px; color: #666;">
          This message was submitted through the PICC website contact form.
        </p>
      </div>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'info@piccworldwide.org',

      // Clicking Reply in Outlook will reply directly to the visitor.
      replyTo: visitorEmail,

      subject: emailSubject,
      text: textBody,
      html: htmlBody,
    });

    console.log(
      `PICC contact message sent successfully from ${visitorEmail}`
    );

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully.',
    });
  } catch (error) {
    console.error('PICC CONTACT EMAIL ERROR:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send contact message',
      },
      { status: 500 }
    );
  }
}