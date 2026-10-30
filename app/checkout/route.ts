import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { userId, siteId } = await req.json();

    if (!userId || !siteId) {
      return NextResponse.json({ error: 'חסר מזהה משתמש או מזהה אתר' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'ils',
            product_data: {
              name: 'מנוי SiteAI Pro',
              description: 'שדרוג אתר למסלול Pro כולל יומן תורים ואחסון תמונות',
            },
            unit_amount: 2900, // 29 ש"ח
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing`,
      metadata: {
        userId,
        siteId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}