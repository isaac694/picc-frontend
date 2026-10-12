
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getPICCContext } from '@/lib/picc-assistant';

export const runtime = 'nodejs';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

const MODEL =
  process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

// Meta calls GET to verify your webhook.
export async function GET(request: Request) {
  const url = new URL(request.url);

  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (
    mode === 'subscribe' &&
    token &&
    VERIFY_TOKEN &&
    token === VERIFY_TOKEN &&
    challenge
  ) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Webhook verification failed', {
    status: 403,
  });
}

function validSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!APP_SECRET || !signature) return false;

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
    throw new Error('WhatsApp API environment variables are missing.');
  }

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
}

async function generatePICCAnswer(question: string) {
  let websiteContext = '';

  try {
    websiteContext = await getPICCContext(question);
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

You may answer general questions, but do not present general
knowledge as confirmed PICC information.

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

// Meta sends incoming messages to this endpoint.
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    if (!validSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature.' },
        { status: 401 },
      );
    }

    const payload = JSON.parse(rawBody);

    // Ignore delivery/read status updates and unrelated events.
    const changes = payload.entry?.flatMap(
      (entry: any) => entry.changes ?? [],
    ) ?? [];

    for (const change of changes) {
      const value = change.value;
      const messages = value?.messages ?? [];

      for (const message of messages) {
        if (message.type !== 'text' || !message.text?.body) {
          continue;
        }

        const sender = message.from;
        const question = message.text.body.trim();

        if (!sender || !question) continue;

        try {
          const answer = await generatePICCAnswer(question);
          await sendWhatsAppMessage(sender, answer);
        } catch (error) {
          console.error('PICC WhatsApp reply error:', error);

          // Avoid repeatedly messaging a visitor if a service fails.
          // The error is logged for the developer to investigate.
        }
      }
    }

    // Acknowledge the webhook so Meta does not keep retrying it.
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);

    return NextResponse.json(
      { error: 'Webhook processing failed.' },
      { status: 500 },
    );
  }
}
