import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyAdmin } from "@/lib/adminAuth";

export async function GET() {
  try {
    await verifyAdmin();

    // Canonical contract: redeemed_at must come from actual redemption timestamp.
    const { data, error } = await getSupabaseAdmin()
      .from("coupons")
      .select(
        `
        id,
        coupon_code,
        status,
        redeemed_at,
        bottles ( qr_token ),
        users ( phone ),
        campaigns ( name )
      `,
      )
      .in("status", ["claimed", "redeemed"])
      .not("redeemed_at", "is", null)
      .order("redeemed_at", { ascending: false })
      .limit(100);

    if (error) {
      // Fallback or specific error handling
      console.error("Redemptions fetch error:", error);
      throw error;
    }

    // Transform data flat for the UI. No semantic remapping from created_at.
    const formatted = data.map((item: any) => ({
      id: item.id,
      qr_token: item.bottles?.qr_token || "N/A",
      campaign_name: item.campaigns?.name || "Unknown",
      phone: item.users?.phone || "Unknown",
      coupon_code: item.coupon_code || "-",
      coupon_status: item.status,
      redeemed_at: item.redeemed_at,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    const status = error.message.includes("Unauthorized")
      ? 401
      : error.message.includes("Forbidden")
        ? 403
        : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Deprecated endpoint. Use POST /api/coupons/redeem for canonical claim timestamp semantics.",
    },
    { status: 410 },
  );
}
