import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '10');

    const sermons = await prisma.sermon.findMany({
      where: { isPublished: true },
      include: { media: true },
      orderBy: { date: 'desc' },
      skip,
      take,
    });

    const total = await prisma.sermon.count({ where: { isPublished: true } });

    return NextResponse.json(
      { sermons, total, skip, take },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching sermons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, pastor, date, duration } = body;

    // Validation
    if (!title || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sermon = await prisma.sermon.create({
      data: {
        title,
        description: description || null,
        pastor: pastor || null,
        date: new Date(date),
        duration: duration || null,
        isPublished: true,
      },
    });

    return NextResponse.json(
      { message: 'Sermon created successfully', id: sermon.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating sermon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
