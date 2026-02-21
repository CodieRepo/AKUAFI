import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// Force dynamic rendering so minimum_order_value is always fresh from DB
export const dynamic = "force-dynamic";

import {
  Sparkles,
  Trophy,
  Zap,
  QrCode,
  Users,
  BarChart2,
  TrendingUp,
  CheckCircle2,
  Activity,
} from "lucide-react";
import CouponVerification from "@/components/dashboard/coupons/CouponVerification";
import GeneratedCouponsList from "@/components/dashboard/coupons/GeneratedCouponsList";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString("en-IN"); }
function fmtDate(s: string) {
  if (!s) return "-";
  return new Date(s).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function getLast7Days() {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}
function claimLabel(pct: number) {
  if (pct >= 20) return { text: "Strong", cls: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20" };
  if (pct >= 5)  return { text: "Moderate", cls: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20" };
  return { text: "Low", cls: "text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900/20" };
}
function barColor(pct: number) {
  if (pct >= 20) return "bg-emerald-500";
  if (pct >= 5)  return "bg-amber-500";
  return "bg-red-500";
}

// ─── Inline SVG Charts ────────────────────────────────────────────────────────
function QRvsClaimsChart({ campaigns }: { campaigns: CampaignMetricRow[] }) {
  if (!campaigns.length) return <div className="text-sm text-gray-400 py-6 text-center">No campaign data.</div>;
  const BAR_W = 22, GAP = 20, H = 160;
  const PAD = { top: 16, bottom: 40, left: 44, right: 12 };
  const maxVal = Math.max(...campaigns.flatMap(c => [c.total_qr, c.total_claims]), 1);
  const totalW = campaigns.length * (BAR_W * 2 + GAP) + PAD.left + PAD.right;
  const svgW = Math.max(totalW, 360);
  const svgH = H + PAD.top + PAD.bottom;
  const sc = (v: number) => (v / maxVal) * H;
  const ticks = [0, 0.5, 1].map(t => Math.round(t * maxVal));
  return (
    <div className="w-full overflow-x-auto">
      <svg width={svgW} height={svgH}>
        {ticks.map((t, i) => {
          const y = PAD.top + H - sc(t);
          return <g key={i}>
            <line x1={PAD.left} x2={svgW - PAD.right} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
              {t >= 1000 ? `${(t/1000).toFixed(0)}k` : t}
            </text>
          </g>;
        })}
        {campaigns.map((c, i) => {
          const x = PAD.left + i * (BAR_W * 2 + GAP);
          const qrH = sc(c.total_qr); const clH = sc(c.total_claims);
          const name = c.campaign_name.length > 8 ? c.campaign_name.slice(0, 7) + "…" : c.campaign_name;
          return <g key={c.campaign_id}>
            <rect x={x} y={PAD.top + H - qrH} width={BAR_W} height={qrH} rx={3} fill="#3b82f6" fillOpacity={0.85} />
            <rect x={x + BAR_W + 2} y={PAD.top + H - clH} width={BAR_W} height={clH} rx={3} fill="#10b981" fillOpacity={0.85} />
            <text x={x + BAR_W} y={svgH - 10} textAnchor="middle" fontSize={9} fill="#6b7280">{name}</text>
          </g>;
        })}
        <line x1={PAD.left} x2={svgW - PAD.right} y1={PAD.top + H} y2={PAD.top + H} stroke="#d1d5db" strokeWidth={1} />
      </svg>
      <div className="flex gap-5 mt-1 ml-10">
        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />QR Generated</span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />Claims</span>
      </div>
    </div>
  );
}

function DailyClaimsChart({ data }: { data: { date: string; count: number }[] }) {
  const allZero = data.every(d => d.count === 0);
  if (allZero)
    return <div className="text-sm text-gray-400 py-6 text-center">No claims in last 7 days.</div>;

  const W = 480, H = 120;
  const PAD = { top: 12, bottom: 32, left: 36, right: 12 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const pts = data.map((d, i) => {
    const x = PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = PAD.top + innerH - (d.count / maxVal) * innerH;
    return `${x},${y}`;
  }).join(" ");
  const firstX = PAD.left, lastX = PAD.left + innerW;
  return (
    <div className="w-full overflow-x-auto">
      <svg width={W} height={H}>
        <polygon points={`${firstX},${PAD.top + innerH} ${pts} ${lastX},${PAD.top + innerH}`} fill="#3b82f6" fillOpacity={0.12} />
        <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
          return <g key={i}>
            {d.count > 0 && <circle cx={x} cy={PAD.top + innerH - (d.count / maxVal) * innerH} r={3} fill="#3b82f6" />}
            <text x={x} y={H - 6} textAnchor="middle" fontSize={9} fill="#9ca3af">
              {new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" })}
            </text>
          </g>;
        })}
      </svg>
    </div>
  );
}

// ─── Smart Suggestions Card ────────────────────────────────────────────────
type Suggestion = {
  emoji: string;
  title: string;
  body: string;
  badge: string;
  badgeCls: string;
  gradientCls: string;
  borderCls: string;
};

function SmartSuggestionsCard({
  conversionPct, totalQR, totalClaims, uniqueUsers,
}: { conversionPct: number; totalQR: number; totalClaims: number; uniqueUsers: number }) {
  const suggestions: Suggestion[] = [];

  if (conversionPct < 2) {
    suggestions.push({
      emoji: "📉",
      title: "Low Conversion",
      body: "Your campaign conversion is below 2%. Consider increasing coupon value or improving QR visibility.",
      badge: "< 2% conversion",
      badgeCls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      gradientCls: "from-red-50 to-white dark:from-red-950/30 dark:to-slate-900",
      borderCls: "border-red-100 dark:border-red-900/30",
    });
  }

  if (uniqueUsers > 0 && totalClaims > uniqueUsers) {
    suggestions.push({
      emoji: "🔁",
      title: "Repeat Claims Detected",
      body: "Some users are claiming multiple times. You may want to review campaign targeting.",
      badge: "Multiple claims",
      badgeCls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      gradientCls: "from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900",
      borderCls: "border-amber-100 dark:border-amber-900/30",
    });
  }

  if (totalQR > 500 && totalClaims < 10) {
    suggestions.push({
      emoji: "📡",
      title: "High Reach, Low Engagement",
      body: "QR scans are high but claims are low. Try clearer CTA messaging near your QR codes.",
      badge: "High reach",
      badgeCls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      gradientCls: "from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900",
      borderCls: "border-blue-100 dark:border-blue-900/30",
    });
  }

  if (conversionPct >= 5) {
    suggestions.push({
      emoji: "🚀",
      title: "Strong Performance",
      body: "Your campaign is performing well. Consider scaling QR distribution to grow further.",
      badge: `${conversionPct.toFixed(1)}% conversion`,
      badgeCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      gradientCls: "from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900",
      borderCls: "border-emerald-100 dark:border-emerald-900/30",
    });
  }

  // Fallback if no condition triggered
  if (suggestions.length === 0) {
    suggestions.push({
      emoji: "📊",
      title: "Getting Started",
      body: "Keep running your campaigns. Insights will appear once more data is collected.",
      badge: "Early stage",
      badgeCls: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
      gradientCls: "from-gray-50 to-white dark:from-slate-900 dark:to-slate-900",
      borderCls: "border-gray-100 dark:border-slate-800",
    });
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
        <span className="text-base">📊</span>
        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Growth Suggestions</h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className={`p-4 bg-gradient-to-br ${s.gradientCls} border-l-4 ${s.borderCls} group hover:brightness-95 dark:hover:brightness-110 transition-all duration-200`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5 shrink-0">{s.emoji}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{s.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.badgeCls}`}>{s.badge}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{s.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Campaign Health Card ───────────────────────────────────────────────────
function CampaignHealthCard({ conversionPct }: { conversionPct: number }) {
  const clamped = Math.min(conversionPct, 100);
  const engagement = conversionPct >= 5 ? "High" : conversionPct >= 2 ? "Medium" : "Low";
  const engagementCls =
    engagement === "High"   ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20"
    : engagement === "Medium" ? "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20"
    : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
  const barCls =
    engagement === "High"   ? "bg-emerald-500"
    : engagement === "Medium" ? "bg-amber-500"
    : "bg-red-500";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">📈</span>
        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Campaign Health</h3>
      </div>

      <div className="space-y-4">
        {/* Conversion */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs text-gray-500 dark:text-slate-400">Conversion Rate</p>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{conversionPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barCls}`}
              style={{ width: `${Math.max(clamped, conversionPct > 0 ? 3 : 0)}%` }}
            />
          </div>
        </div>

        {/* Claim Rate = same as conversion for this context */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs text-gray-500 dark:text-slate-400">Claim Rate</p>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{conversionPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barCls}`}
              style={{ width: `${Math.max(clamped, conversionPct > 0 ? 3 : 0)}%` }}
            />
          </div>
        </div>

        {/* Engagement level tile */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Engagement Level</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {engagement === "High" ? "> 5% conversion" : engagement === "Medium" ? "2–5% conversion" : "< 2% conversion"}
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${engagementCls}`}>{engagement}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Best Campaign Card ─────────────────────────────────────────────────────
function BestCampaignCard({ campaigns }: { campaigns: CampaignMetricRow[] }) {
  const ranked = [...campaigns]
    .filter((c) => c.total_qr > 0)
    .map((c) => ({
      ...c,
      pct: Math.round((c.total_claims / c.total_qr) * 100),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  if (!ranked.length) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
        <span className="text-base">🏆</span>
        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Best Performing Campaigns</h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {ranked.map((c, i) => (
          <div key={c.campaign_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
            <span className="text-sm font-bold text-gray-300 dark:text-slate-600 w-4 shrink-0 text-center">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.campaign_name}</p>
              <div className="mt-1 h-1.5 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${i === 0 ? "bg-emerald-500" : i === 1 ? "bg-blue-500" : "bg-amber-500"}`}
                  style={{ width: `${Math.min(c.pct, 100)}%` }}
                />
              </div>
            </div>
            <span className={`text-xs font-bold shrink-0 ${i === 0 ? "text-emerald-600 dark:text-emerald-400" : i === 1 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
              {c.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type CampaignMetricRow = {
  campaign_id: string;
  campaign_name: string;
  total_qr: number;
  total_claims: number;
  unique_users: number;
  total_scans: number;
  status?: string;
  minimum_order_value: number;
};
type UniqueUserRow = {
  user_name: string | null;
  phone: string;
  campaign_name: string;
  claim_count: number;
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ClientDashboard() {
  const supabase = await createClient();

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/client/login");

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, client_name")
    .eq("user_id", user.id)
    .single();

  if (clientError || !client) return redirect("/client/login?error=no_client_profile");

  const clientId = client.id;

  // 2. Parallel data fetch — all scoped to clientId
  const last7 = getLast7Days();

  // Step 1: Get client record + campaign IDs first (required for subsequent view queries)
  const { data: campaignsData } = await supabase
    .from("campaigns")
    .select("id, name, location, campaign_date, minimum_order_value, total_scans")
    .eq("client_id", clientId);

  const campaignIds = (campaignsData || []).map((c: any) => c.id);
  const campaignMap = new Map((campaignsData || []).map((c: any) => [c.id, c]));

  // Step 2: Parallel fetch — campaign_user_details_v1 filtered by campaign_id IN (...)
  const [
    { data: overviewRow },
    { data: campaignMetrics },
    { data: uniqueUsersRaw },
    { data: dailyClaimsRaw },
    { data: couponsProper },
  ] = await Promise.all([
    // Top metrics from client_dashboard_v1
    supabase.from("client_dashboard_v1").select("*").eq("client_id", clientId).maybeSingle(),

    // Campaign table from campaign_metrics_v1
    supabase.from("campaign_metrics_v1").select("*").eq("client_id", clientId),

    // Issue 1: Unique users — NO status filter: appear as soon as coupon is generated
    campaignIds.length > 0
      ? supabase
          .from("campaign_user_details_v1")
          .select("user_name, phone, campaign_name")
          .in("campaign_id", campaignIds)
      : Promise.resolve({ data: [] }),

    // Daily activity (last 7 days) — keep claimed filter for conversion chart accuracy
    campaignIds.length > 0
      ? supabase
          .from("campaign_user_details_v1")
          .select("redeemed_at")
          .in("campaign_id", campaignIds)
          .eq("status", "claimed")
          .gte("redeemed_at", last7[0])
      : Promise.resolve({ data: [] }),

    // Issue 3: Generated coupons — include discount_value
    campaignIds.length > 0
      ? supabase
          .from("coupons")
          .select("id, coupon_code, status, discount_value, generated_at, redeemed_at, campaign_id")
          .in("campaign_id", campaignIds)
          .order("generated_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
  ]);

  // 3. Process top metrics
  const metrics = overviewRow as any;
  const totalCampaigns = Number(metrics?.total_campaigns || 0);
  const totalQR        = Number(metrics?.total_qr        || 0);
  const totalClaims    = Number(metrics?.total_claims    || 0);
  const totalUsers     = Number(metrics?.unique_users    || 0);
  const totalBottlesDistributed = Number(metrics?.total_bottles_distributed || totalQR);
  const totalCouponsGenerated = Number(metrics?.total_coupons_generated || totalQR);
  const conversionPct  = totalQR > 0 ? ((totalClaims / totalQR) * 100).toFixed(1) : "0.0";

  // 4. Campaign rows
  const campaigns: CampaignMetricRow[] = (campaignMetrics || []).map((r: any) => ({
    campaign_id:         r.campaign_id || r.id,
    campaign_name:       r.campaign_name || r.name || "—",
    total_qr:            Number(r.total_qr     || 0),
    total_claims:        Number(r.total_claims || 0),
    unique_users:        Number(r.unique_users || 0),
    total_scans:         Number((campaignMap.get(r.campaign_id || r.id) as any)?.total_scans || 0),
    status:              r.status,
    // Pull MOV from campaigns table data (already fetched in campaignMap)
    minimum_order_value: Number((campaignMap.get(r.campaign_id || r.id) as any)?.minimum_order_value || 0),
  }));

  const bestCampaign = [...campaigns].sort((a, b) => b.total_claims - a.total_claims)[0];
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalScans = campaigns.reduce((sum, c) => sum + Number(c.total_scans || 0), 0);
  const topPerformingCampaignByScans = [...campaigns].sort((a, b) => b.total_scans - a.total_scans)[0];

  // 5. Unique users — aggregate claim count per phone
  const userMap = new Map<string, UniqueUserRow>();
  for (const r of (uniqueUsersRaw || []) as any[]) {
    const phone = r.phone || 'unknown';
    if (userMap.has(phone)) {
      userMap.get(phone)!.claim_count++;
    } else {
      userMap.set(phone, {
        user_name:    r.user_name || null,
        phone,
        campaign_name: r.campaign_name || '—',
        claim_count:  1,
      });
    }
  }
  const uniqueUsers: UniqueUserRow[] = Array.from(userMap.values())
    .sort((a, b) => b.claim_count - a.claim_count);

  // 6. Daily claims (last 7 days)
  const claimsByDate: Record<string, number> = {};
  last7.forEach(d => { claimsByDate[d] = 0; });
  for (const r of (dailyClaimsRaw || []) as any[]) {
    const day = (r.redeemed_at || "").slice(0, 10);
    if (day && claimsByDate[day] !== undefined) claimsByDate[day]++;
  }
  const dailyClaims = last7.map(date => ({ date, count: claimsByDate[date] }));

  // 7. Generated coupons — include discount_value
  const generatedCoupons = (couponsProper || []).map((r: any) => {
    const camp = campaignMap.get(r.campaign_id);
    return {
      id: r.id, coupon_code: r.coupon_code || "N/A", status: r.status || "active",
      discount_value: r.discount_value ?? null,
      generated_at: r.generated_at || r.redeemed_at, redeemed_at: r.redeemed_at,
      campaign_id: r.campaign_id,
      location: (camp as any)?.location || null,
      campaign_date: (camp as any)?.campaign_date || null,
      campaign_name: (camp as any)?.name || "Unknown",
    };
  });

  // 8. Discount metrics (from couponsProper — all statuses)
  const couponsAll = couponsProper || [];
  const totalDiscountIssued = (couponsAll as any[]).reduce((s, c) => s + Number(c.discount_value || 0), 0);
  const estimatedRevenue    = (couponsAll as any[]).filter(c => c.status === 'claimed').reduce((s, c) => s + Number(c.discount_value || 0), 0);
  const avgDiscount         = (couponsAll as any[]).length > 0 ? Math.round(totalDiscountIssued / (couponsAll as any[]).length) : 0;

  // 9. Analytics metrics (display-only, no DB change)
  // Impressions = total QR generated across all campaigns
  const impressions = totalQR;
  // Estimated Reach = total_bottles_distributed × 2.3
  const estimatedReach = Math.round(totalBottlesDistributed * 2.3);
  // Estimated Revenue = total_coupons_generated × min_order_value
  // Applied campaign-wise to preserve per-campaign MOV: Σ(campaign_total_qr × campaign_minimum_order_value)
  const defaultMinOrderValue = Number((campaignsData || []).find((c: any) => Number(c.minimum_order_value || 0) > 0)?.minimum_order_value || 0);
  const estimatedRevenueByMOV = campaigns.some((c) => c.minimum_order_value > 0)
    ? campaigns.reduce((sum, c) => {
        if (c.minimum_order_value <= 0) return sum;
        return sum + (c.total_qr * c.minimum_order_value);
      }, 0)
    : (totalCouponsGenerated * defaultMinOrderValue);
  // Whether any campaign has MOV configured (drives helper text display)
  const hasMOVConfigured = (campaignsData || []).some((c: any) => Number(c.minimum_order_value || 0) > 0);

  // ── Empty state
  if (campaigns.length === 0) {
    return (
      <div className="min-h-screen bg-black lg:bg-transparent flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-12 text-center shadow-2xl">
          <div className="mx-auto w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 ring-1 ring-blue-400/20">
            <Sparkles className="h-10 w-10 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Launch Your First Campaign</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
            Start tracking QR generations and claims in real-time. Create a campaign to unlock your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* ── Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{client.client_name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live analytics
            </p>
          </div>
        </header>

        {/* ── 1. Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Campaigns",  value: fmt(totalCampaigns), icon: <Zap className="h-4 w-4" />,          color: "text-violet-500" },
            { label: "QR Generated", value: fmt(totalQR),     icon: <QrCode className="h-4 w-4" />,        color: "text-blue-500" },
            { label: "Total Claims", value: fmt(totalClaims), icon: <CheckCircle2 className="h-4 w-4" />,  color: "text-emerald-500" },
            { label: "Unique Users", value: fmt(totalUsers),  icon: <Users className="h-4 w-4" />,         color: "text-amber-500" },
            { label: "Conversion",  value: `${conversionPct}%`, icon: <TrendingUp className="h-4 w-4" />, color: "text-pink-500" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
              <div className={`${color} mb-2`}>{icon}</div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Discount Metrics Row (shown once any coupon has a discount) */}
        {totalDiscountIssued > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="text-green-600 dark:text-green-400 mb-2">💰</div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Discount Issued</p>
              <p className="text-2xl font-bold mt-1 text-green-700 dark:text-green-400">₹{totalDiscountIssued.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Across all active + claimed coupons</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="text-emerald-600 dark:text-emerald-400 mb-2">📈</div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Estimated Revenue Impact</p>
              <p className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">₹{estimatedRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Claimed coupons only</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="text-blue-500 mb-2">🎯</div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Avg Discount / Coupon</p>
              <p className="text-2xl font-bold mt-1">₹{avgDiscount}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Across {(couponsProper || []).length} coupons</p>
            </div>
          </div>
        )}

        {/* ── Analytics Metrics Row: Impressions · Reach · Revenue */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Impressions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="text-violet-500 mb-2">👁️</div>
            <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Impressions</p>
            <p className="text-2xl font-bold mt-1">{fmt(impressions)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Total coupons generated</p>
          </div>

          {/* Estimated Reach */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="text-blue-500 mb-2">📡</div>
            <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Estimated Reach</p>
            <p className="text-2xl font-bold mt-1">{fmt(estimatedReach)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Projected audience exposure based on QR distribution</p>
          </div>

          {/* Estimated Revenue (MOV-based) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="text-emerald-500 mb-2">💵</div>
            <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Estimated Revenue</p>
            {hasMOVConfigured ? (
              <>
                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  ₹{estimatedRevenueByMOV.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Estimated from total coupons generated × minimum order value</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold mt-1 text-gray-300 dark:text-slate-600">₹0</p>
                <p className="text-[10px] text-amber-500 mt-0.5">Admin must set minimum order value in campaign settings</p>
              </>
            )}
          </div>
        </div>

        {/* ── My Earnings */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h2 className="font-bold text-gray-900 dark:text-white">My Earnings</h2>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-lg border border-gray-200 dark:border-slate-800 p-4 bg-gray-50/50 dark:bg-slate-900/40">
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Bottles Distributed</p>
              <p className="text-2xl font-bold mt-1">{fmt(totalBottlesDistributed)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-slate-800 p-4 bg-gray-50/50 dark:bg-slate-900/40">
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Scans</p>
              <p className="text-2xl font-bold mt-1">{fmt(totalScans)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-slate-800 p-4 bg-gray-50/50 dark:bg-slate-900/40">
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Revenue Generated</p>
              <p className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">₹{estimatedRevenueByMOV.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-slate-800 p-4 bg-gray-50/50 dark:bg-slate-900/40">
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Top Performing Campaign</p>
              <p className="text-sm font-semibold mt-2 truncate text-gray-900 dark:text-white">
                {topPerformingCampaignByScans?.campaign_name || "—"}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {fmt(topPerformingCampaignByScans?.total_scans || 0)} scans
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-slate-800 p-4 bg-gray-50/50 dark:bg-slate-900/40">
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Impressions</p>
              <p className="text-2xl font-bold mt-1">{fmt(impressions)}</p>
            </div>
          </div>
        </section>

        {/* ── 2. Main grid: Campaign table + right column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT (2-col): Campaign Performance Table */}
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-500" />
                <h2 className="font-bold text-gray-900 dark:text-white">Campaign Performance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-900/60 text-gray-400 dark:text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Campaign</th>
                      <th className="px-6 py-3 text-right">QR</th>
                      <th className="px-6 py-3 text-right">Impressions</th>
                      <th className="px-6 py-3 text-right">Claims</th>
                      <th className="px-6 py-3 text-right">Users</th>
                      <th className="px-6 py-3 text-right" title="Claims / QR Generated">Conversion</th>
                    
                        <th className="px-6 py-3 text-right">Est. Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {campaigns.map((c) => {
                      const pct = c.total_qr > 0 ? Math.round((c.total_claims / c.total_qr) * 100) : 0;
                      const label = claimLabel(pct);
                      return (
                        <tr key={c.campaign_id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 dark:text-white">{c.campaign_name}</p>
                          </td>
                          <td className="px-6 py-4 text-right font-mono">{fmt(c.total_qr)}</td>
                          <td className="px-6 py-4 text-right font-mono">{fmt(c.total_qr)}</td>
                          <td className="px-6 py-4 text-right font-mono">{fmt(c.total_claims)}</td>
                          <td className="px-6 py-4 text-right font-mono">{fmt(c.unique_users)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${label.cls}`}>
                                {pct}% · {label.text}
                              </span>
                              <div className="w-20 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {c.minimum_order_value > 0 ? (
                              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                ₹{(c.total_claims * c.minimum_order_value).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-slate-500">Order value not configured</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chart 1: QR vs Claims per campaign */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="h-5 w-5 text-blue-500" />
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">QR Generated vs Claims — Per Campaign</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Volume comparison</p>
                </div>
              </div>
              <QRvsClaimsChart campaigns={campaigns} />
            </div>

            {/* Chart 2: Daily claims (last 7 days) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-violet-500" />
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Daily Claims — Last 7 Days</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Claim activity trend</p>
                </div>
              </div>
              <DailyClaimsChart data={dailyClaims} />
            </div>

            {/* Unique Users table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Unique Users</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Customers who claimed at least once</p>
                </div>
              </div>
              {uniqueUsers.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No users yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900/60 text-gray-400 dark:text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Phone</th>
                        <th className="px-6 py-3">Campaign</th>
                        <th className="px-6 py-3 text-right">Claims</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {uniqueUsers.slice(0, 50).map((u, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                                {(u.user_name || u.phone).charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">{u.user_name || "—"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 font-mono text-gray-600 dark:text-slate-400">{u.phone}</td>
                          <td className="px-6 py-3 text-gray-600 dark:text-slate-400">{u.campaign_name}</td>
                          <td className="px-6 py-3 text-right">
                            <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                              {u.claim_count}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Generated Coupons List */}
            <GeneratedCouponsList coupons={generatedCoupons} />

          </div>

          {/* RIGHT (1-col): Smart Suggestions + Campaign Health + Best Campaign + Verify */}
          <div className="space-y-5">

            {/* ── Smart Suggestions ─────────────────────────────────── */}
            <SmartSuggestionsCard
              conversionPct={parseFloat(conversionPct)}
              totalQR={totalQR}
              totalClaims={totalClaims}
              uniqueUsers={totalUsers}
            />

            {/* ── Campaign Health ────────────────────────────────────── */}
            <CampaignHealthCard conversionPct={parseFloat(conversionPct)} />

            {/* ── Best Performing Campaign (only if multiple) ─────────── */}
            {campaigns.length > 1 && bestCampaign && (
              <BestCampaignCard campaigns={campaigns} />
            )}

            {/* ── Coupon Verification ────────────────────────────────── */}
            <CouponVerification campaignIds={campaignIds} />

          </div>
        </div>
      </div>
    </div>
  );
}
