import { NextRequest, NextResponse } from 'next/server';
import { generateIdeas } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { niche } = await request.json();

    if (!niche || typeof niche !== 'string' || niche.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please provide a valid niche (at least 2 characters)' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const ideas = await generateIdeas(niche.trim());

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error('Error generating ideas:', error);
    return NextResponse.json(
      { error: 'Failed to generate ideas. Please try again.' },
      { status: 500 }
    );
  }
}
