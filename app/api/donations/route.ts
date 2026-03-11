import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get summary statistics for donations
    const totalDonations = await prisma.donation.aggregate({
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json(
      {
        total: totalDonations._sum.amount || 0,
        count: totalDonations._count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, donorName, email, method } = body;

    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const donation = await prisma.donation.create({
      data: {
        amount,
        donorName: donorName || null,
        email: email || null,
        method: method || null,
      },
    });

    return NextResponse.json(
      { message: 'Donation recorded successfully', id: donation.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating donation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
