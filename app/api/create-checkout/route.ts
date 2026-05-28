import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const { amount, designation, recurring, firebaseUid } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "https://mhma-update.vercel.app";

    const body: Record<string, any> = {
      mode: recurring ? "subscription" : "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `${designation.charAt(0).toUpperCase() + designation.slice(1)} Donation`,
          },
          unit_amount: Math.round(amount * 100),
          recurring: recurring ? { interval: "month" } : undefined,
        },
        quantity: 1,
      }],
      metadata: { designation, source: "web", firebaseUid: firebaseUid || "" },
      success_url: `${origin}/donate?success=true`,
      cancel_url: `${origin}/donate?canceled=true`,
    };

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(flatten(body)),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Stripe API error:", data);
      return NextResponse.json({ error: data.error?.message || "Stripe error" }, { status: res.status });
    }

    return NextResponse.json({ url: data.url });
  } catch (err: any) {
    console.error("Checkout creation failed:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}

function flatten(obj: Record<string, any>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const k = prefix ? `${prefix}[${key}]` : key;
    if (value === undefined || value === null) continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flatten(value, k));
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === "object") {
          Object.assign(result, flatten(item, `${k}[${i}]`));
        } else {
          result[`${k}[${i}]`] = String(item);
        }
      });
    } else {
      result[k] = String(value);
    }
  }
  return result;
}
