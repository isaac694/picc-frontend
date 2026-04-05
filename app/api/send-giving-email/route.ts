import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_FROM = process.env.SMTP_FROM || 'info@piccworldwide.org';

const transporter = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

export async function POST(request: Request) {
  if (!transporter) {
    return NextResponse.json(
      { error: 'Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.' },
      { status: 500 }
    );
  }

  const body = await request.json();
  const {
    userEmail,
    churchEmail,
    fullName,
    amount,
    currency,
    phone,
    phoneCountry,
    paymentMethod,
    reason,
    givingType,
    specialRecipient,
    givingDate,
    bookletNumber,
  } = body as {
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

  if (!churchEmail || !fullName || !amount || !currency || !phone || !paymentMethod || !reason) {
    return NextResponse.json({ error: 'Missing required giving details.' }, { status: 400 });
  }

  const recipients = [churchEmail];
  if (userEmail) recipients.push(userEmail);

  const plainBodyLines = [
    `Full Name: ${fullName}`,
    `Email: ${userEmail ?? 'N/A'}`,
    `Amount: ${amount} ${currency}`,
    `Phone: ${phoneCountry}${phone}`,
    `Payment Method: ${paymentMethod}`,
    `Reason: ${reason}`,
    givingType ? `Giving Type: ${givingType}` : null,
    specialRecipient ? `Special Recipient: ${specialRecipient}` : null,
    givingDate ? `Giving Date: ${givingDate}` : null,
    bookletNumber ? `Booklet Number: ${bookletNumber}` : null,
    '',
    'Thank you for your gift to PICC. Please keep this email for your records.',
  ].filter(Boolean);

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
      <h2>Giving Payment Details</h2>
      <p>Thank you for your contribution to PICC. Below are the details of your giving request.</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        ${[ 
          ['Full Name', fullName],
          ['Email', userEmail || 'N/A'],
          ['Amount', `${amount} ${currency}`],
          ['Phone', `${phoneCountry}${phone}`],
          ['Payment Method', paymentMethod],
          ['Reason', reason],
          ['Giving Type', givingType || 'N/A'],
          ['Special Recipient', specialRecipient || 'N/A'],
          ['Giving Date', givingDate || 'N/A'],
          ['Booklet Number', bookletNumber || 'N/A'],
        ]
          .map(
            ([label, value]) => `
            <tr>
              <td style="padding: 8px 10px; border: 1px solid #ddd; font-weight: 600; width: 35%;">${label}</td>
              <td style="padding: 8px 10px; border: 1px solid #ddd;">${value}</td>
            </tr>
          `
          )
          .join('')}
      </table>
      <p style="margin-top: 20px;">If you have questions, please reply to this email or contact info@piccworldwide.org.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: recipients,
      subject: 'PICC Giving Submission Details',
      text: plainBodyLines.join('\n'),
      html: htmlBody,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
