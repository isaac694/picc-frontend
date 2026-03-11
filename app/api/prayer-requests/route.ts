import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get public prayer requests only
    const prayerRequests = await prisma.prayerRequest.findMany({
      where: { isPrivate: false, isAnswered: false },
      select: {
        id: true,
        name: true,
        request: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json(prayerRequests, { status: 200 });
  } catch (error) {
    console.error('Error fetching prayer requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, request: prayerRequest, isPrivate } = body;

    // Validation
    if (!name || !email || !prayerRequest) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create prayer request in database
    const newRequest = await prisma.prayerRequest.create({
      data: {
        name,
        email,
        phone: phone || null,
        request: prayerRequest,
        isPrivate: isPrivate !== false, // Default to true
      },
    });

    return NextResponse.json(
      { message: 'Prayer request submitted successfully', id: newRequest.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating prayer request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
