import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getPICCContext } from '@/lib/picc-assistant';

import { searchWithGemini } from '@/lib/google-search';

export const runtime = 'nodejs';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

// Meta uses this GET request when verifying the webhook URL.
export async function GET(request: Request) {
  const url = new URL(request.url);

  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  console.log('WhatsApp webhook verification request received', {
    mode,
    hasToken: Boolean(token),
    hasChallenge: Boolean(challenge),
    verifyTokenConfigured: Boolean(VERIFY_TOKEN),
  });

  if (
    mode === 'subscribe' &&
    token &&
    VERIFY_TOKEN &&
    token === VERIFY_TOKEN &&
    challenge
  ) {
    console.log('WhatsApp webhook verification successful');
    return new Response(challenge, { status: 200 });
  }

  console.error('WhatsApp webhook verification failed');
  return new Response('Webhook verification failed', { status: 403 });
}

function validSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!APP_SECRET || !signature) {
    return false;
  }

  const expected =
    'sha256=' +
    createHmac('sha256', APP_SECRET)
      .update(rawBody)
      .digest('hex');

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

async function sendWhatsAppMessage(
  recipient: string,
  message: string,
) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error(
      'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing.',
    );
  }

  console.log('Sending WhatsApp reply to:', recipient);

  const response = await fetch(
    `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: {
          preview_url: false,
          body: message.slice(0, 4000),
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp send failed: ${errorText}`);
  }

  console.log('WhatsApp reply sent successfully');
}

async function generatePICCAnswer(question: string) {
  let websiteContext = '';

  try {
    console.log('Retrieving PICC website information...');
    websiteContext = await getPICCContext(question);
    console.log('Website information retrieved:', Boolean(websiteContext));
  } catch (error) {
    console.error('PICC knowledge retrieval failed:', error);
  }

  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: `
You are the official PICC Assistant for Pentecost International
Christian Centre.

Answer visitors politely, clearly, and helpfully.

Use the supplied PICC website and database information as your
primary source. Do not invent church schedules, event dates,
locations, pastors, contact details, or policies.

If the supplied information does not answer a PICC-specific
question, explain that you do not have that information yet
and direct the visitor to contact PICC.

Keep WhatsApp replies concise and easy to read.
        `.trim(),
      },
      {
        role: 'user',
        content: `
VISITOR QUESTION:
${question}

PICC WEBSITE AND DATABASE INFORMATION:
${websiteContext || 'No PICC information could be retrieved.'}
        `.trim(),
      },
    ],
  });

  return (
    completion.choices[0]?.message?.content?.trim() ||
    'Sorry, I could not prepare an answer. Please try again.'
  );
}

// Meta sends WhatsApp messages to this POST endpoint.
export async function POST(request: Request) {
  console.log('WhatsApp webhook POST received');

  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    console.log('Webhook checks:', {
      signatureReceived: Boolean(signature),
      appSecretConfigured: Boolean(APP_SECRET),
      accessTokenConfigured: Boolean(ACCESS_TOKEN),
      phoneNumberIdConfigured: Boolean(PHONE_NUMBER_ID),
      groqApiKeyConfigured: Boolean(process.env.GROQ_API_KEY),
    });

    if (!validSignature(rawBody, signature)) {
      console.error(
        'Invalid webhook signature. Check WHATSAPP_APP_SECRET in .env.local.',
      );

      return NextResponse.json(
        { error: 'Invalid webhook signature.' },
        { status: 401 },
      );
    }

    const payload = JSON.parse(rawBody);

    const changes =
      payload.entry?.flatMap((entry: any) => entry.changes ?? []) ?? [];

    console.log('Webhook changes found:', changes.length);

    for (const change of changes) {
      const value = change.value;
      const messages = value?.messages ?? [];

      console.log('Incoming messages found:', messages.length);

      for (const message of messages) {
        console.log('Incoming message type:', message.type);

        // Ignore message-status updates, images, audio, etc.
        if (message.type !== 'text' || !message.text?.body) {
          continue;
        }

        const sender = message.from;
        const question = message.text.body.trim();

        if (!sender || !question) {
          console.log('Skipped message: sender or text was empty.');
          continue;
        }

        console.log('Incoming WhatsApp text message:', {
          sender,
          question,
        });

        try {
          const answer = await generatePICCAnswer(question);

          console.log('Generated assistant answer:', answer);

          await sendWhatsAppMessage(sender, answer);
        } catch (error) {
          console.error('PICC WhatsApp reply error:', error);
        }
      }
    }

    // Tell Meta the webhook was received.
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);

    return NextResponse.json(
      { error: 'Webhook processing failed.' },
      { status: 500 },
    );
  }
}