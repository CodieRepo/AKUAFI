
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://cillxiosrgtnnbqhzyld.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpbGx4aW9zcmd0bm5icWh6eWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODY0NzQsImV4cCI6MjA4NTM2MjQ3NH0.L5N6VqEjyRSCxCvjI1DyIVmyl-A6-CXiNErey8NBY7I"
);

async function inspectViews() {
  console.log("Inspecting client_campaign_summary...");
  const { data: summary, error: err1 } = await supabase
    .from("client_campaign_summary")
    .select("*")
    .limit(1);
  if (err1) console.error("Error fetching summary:", err1);
  else console.log("Summary Row:", summary?.[0]);

  console.log("\nInspecting client_recent_activity...");
  const { data: activity, error: err2 } = await supabase
    .from("client_recent_activity")
    .select("*")
    .limit(1);
  if (err2) console.error("Error fetching activity:", err2);
  else console.log("Activity Row:", activity?.[0]);

  console.log("\nInspecting client_weekly_scans...");
  const { data: weekly, error: err3 } = await supabase
    .from("client_weekly_scans")
    .select("*")
    .limit(1);
  if (err3) console.error("Error fetching weekly:", err3);
  else console.log("Weekly Row:", weekly?.[0]);
}

inspectViews();
