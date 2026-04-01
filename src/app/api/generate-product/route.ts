import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateProductContent, ProductIdea } from '@/lib/openai';
import { getUserById, countGenerationsToday, countGenerationsThisMonth } from '@/lib/db';
import { Plan, isOverDailyLimit, isOverMonthlyLimit } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  // Require authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    // Check generation limits
    try {
      const [todayCount, monthlyCount] = await Promise.all([
        countGenerationsToday(session.user.id),
        countGenerationsThisMonth(session.user.id),
      ]);
      const user = await getUserById(session.user.id);
      const plan = (user?.plan || 'free') as Plan;

      if (isOverDailyLimit(plan, todayCount)) {
        return NextResponse.json(
          { error: 'Daily generation limit reached. Upgrade for more!', code: 'DAILY_LIMIT_EXCEEDED' },
          { status: 429 }
        );
      }
      if (isOverMonthlyLimit(plan, monthlyCount)) {
        return NextResponse.json(
          { error: 'Monthly generation limit reached. Upgrade for more!', code: 'MONTHLY_LIMIT_EXCEEDED' },
          { status: 429 }
        );
      }
    } catch (dbErr: any) {
      if (!dbErr.message?.includes('Missing CLOUDFLARE')) {
        throw dbErr;
      }
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
