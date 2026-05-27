import { NextRequest, NextResponse } from "next/server";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

export async function POST(req: NextRequest) {
  if (!stripeSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const { amount, designation, recurring } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const stripe = require("stripe")(stripeSecret);
    const origin = req.headers.get("origin") || "https://mhma-update.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: recurring ? "subscription" : "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `${designation.charAt(0).toUpperCase() + designation.slice(1)} Donation - MHMA`,
          },
          unit_amount: Math.round(amount * 100),
          recurring: recurring ? { interval: "month" } : undefined,
        },
        quantity: 1,
      }],
      metadata: {
        designation,
        source: "web",
      },
      success_url: `${origin}/donate?success=true`,
      cancel_url: `${origin}/donate?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout creation failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
