import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const testimonies = await prisma.testimony.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(testimonies, { status: 200 });
  } catch (error) {
    console.error('Error fetching testimonies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, title, content, imageUrl, isPublished } = body;

    // Validation
    if (!name || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const testimony = await prisma.testimony.create({
      data: {
        name,
        title: title || null,
        content,
        imageUrl: imageUrl || null,
        isPublished: isPublished !== false,
      },
    });

    return NextResponse.json(
      { message: 'Testimony created successfully', id: testimony.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating testimony:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
