import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '10');

    const events = await prisma.event.findMany({
      where: { isPublished: true },
      orderBy: { date: 'asc' },
      skip,
      take,
    });

    const total = await prisma.event.count({ where: { isPublished: true } });

    return NextResponse.json(
      { events, total, skip, take },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, date, startTime, endTime, location, imageUrl } = body;

    // Validation
    if (!title || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        startTime: startTime || null,
        endTime: endTime || null,
        location: location || null,
        imageUrl: imageUrl || null,
        isPublished: true,
      },
    });

    return NextResponse.json(
      { message: 'Event created successfully', id: event.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
