// Supabase Edge Function: send-contact-notification
// Triggered by a DB webhook on INSERT into contact_queries
// Uses Resend API to send an email to info@akuafi.com

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const TO_EMAIL       = "info@akuafi.com";
const FROM_EMAIL     = "Akuafi Contact <onboarding@resend.dev>"; // change to a verified sender once domain verified

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  // Supabase DB webhooks send { type, table, schema, record, old_record }
  // We support both that shape and a raw record shape for flexibility
  const record = payload?.record ?? payload;

  const {
    full_name  = "—",
    company    = "—",
    email      = "—",
    interest   = "—",
    message    = "—",
    created_at = new Date().toISOString(),
  } = record;

  const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9, #06b6d4); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">🚨 New Akuafi Website Inquiry</h1>
  </div>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; width: 140px;">
          <strong style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Name</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(full_name)}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <strong style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Company</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${escapeHtml(company)}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <strong style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Email</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <a href="mailto:${escapeHtml(email)}" style="color: #0ea5e9;">${escapeHtml(email)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <strong style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Interest</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${escapeHtml(interest)}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
          <strong style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Message</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; white-space: pre-wrap;">${escapeHtml(message)}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0;">
          <strong style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Received At</strong>
        </td>
        <td style="padding: 10px 0; color: #64748b; font-size: 13px;">${new Date(created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td>
      </tr>
    </table>

    <div style="margin-top: 24px; padding: 16px; background: #dbeafe; border-radius: 8px; border-left: 4px solid #3b82f6;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        💡 Reply directly to <strong>${escapeHtml(email)}</strong> to respond to this inquiry.
      </p>
    </div>
  </div>
  <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 16px;">
    Akuafi Private Limited · Gorakhpur, UP, India
  </p>
</body>
</html>
  `.trim();

  // Send via Resend
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [TO_EMAIL],
        reply_to: email,          // replies go straight to the lead
        subject: "🚨 New Akuafi Website Inquiry",
        html:    htmlBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[send-contact-notification] Resend error:", res.status, errText);
      // Return 200 so the DB webhook doesn't retry endlessly
      return new Response(JSON.stringify({ ok: false, error: errText }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    console.log("[send-contact-notification] Email sent:", data.id);
    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    // Log but never crash — DB insert must not be blocked
    console.error("[send-contact-notification] Unexpected error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ── Utility ────────────────────────────────────────────────────────────────────
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#x27;");
}
