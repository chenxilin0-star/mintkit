import { NextRequest, NextResponse } from 'next/server';
import { generateProductContent, ProductIdea } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { idea } = await request.json();

    if (!idea || !idea.type || !idea.title) {
      return NextResponse.json(
        { error: 'Invalid idea data' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const productContent = await generateProductContent(idea as ProductIdea);

    return NextResponse.json({ product: productContent });
  } catch (error) {
    console.error('Error generating product:', error);
    return NextResponse.json(
      { error: 'Failed to generate product. Please try again.' },
      { status: 500 }
    );
  }
}
