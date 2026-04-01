import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateIdeas } from '@/lib/openai';
import { getUserById, countGenerationsToday, countGenerationsThisMonth } from '@/lib/db';
import { Plan, isOverDailyLimit, isOverMonthlyLimit } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  // Require authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
      // If D1 is not configured, allow generation without limit check
      if (!dbErr.message?.includes('Missing CLOUDFLARE')) {
        throw dbErr;
      }
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
