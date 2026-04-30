import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication (you'll need to implement this)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sermonTitle, sermonUrl } = await request.json();

    if (!sermonTitle || !sermonUrl) {
      return NextResponse.json(
        { message: 'Sermon title and URL are required' },
        { status: 400 }
      );
    }

    // Here you would:
    // 1. Get all subscriber emails from database
    // 2. Send emails using your email service (SendGrid, Mailgun, etc.)
    // 3. Handle email delivery status

    // TODO: Implement:
    // - Database query to get subscribers
    // - Email service integration
    // - Email template for sermon notifications

    console.log('Sending sermon notification:', { sermonTitle, sermonUrl });

    return NextResponse.json(
      { message: 'Sermon notification sent to subscribers' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}