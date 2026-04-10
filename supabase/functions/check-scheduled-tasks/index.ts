import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      return new Response(JSON.stringify({ error: "Missing FIREBASE_SERVICE_ACCOUNT" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const now = Date.now();
    console.log(`[check] Running at ${new Date(now).toISOString()}`);

    // ATOMIC CLAIM: update notified=true and return only the rows we claimed
    // This prevents duplicates even if cron fires multiple times
    const { data: claimed, error: claimError } = await supabase
      .from("scheduled_tasks")
      .update({ notified: true })
      .eq("completed", false)
      .eq("notified", false)
      .lte("scheduled_time", now)
      .select("*");

    if (claimError) {
      console.error("Claim error:", claimError);
      return new Response(JSON.stringify({ error: claimError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[check] Claimed ${claimed?.length ?? 0} tasks`);

    if (!claimed || claimed.length === 0) {
      return new Response(JSON.stringify({ message: "No due tasks", checked_at: now }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get FCM tokens
    const { data: tokens } = await supabase.from("fcm_tokens").select("token");
    if (!tokens || tokens.length === 0) {
      console.log("No FCM tokens");
      return new Response(JSON.stringify({ message: "No tokens", tasks_claimed: claimed.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;
    let sent = 0;

    for (const task of claimed) {
      for (const { token } of tokens) {
        try {
          const res = await fetch(
            `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: {
                  token,
                  notification: {
                    title: "Task Reminder",
                    body: `You have a task: ${task.title}`,
                  },
                  webpush: {
                    notification: {
                      title: "Task Reminder",
                      body: `You have a task: ${task.title}`,
                      icon: "/icon-192.png",
                      requireInteraction: true,
                    },
                  },
                },
              }),
            }
          );

          if (res.ok) {
            sent++;
            console.log(`[check] Sent for task ${task.task_id}`);
          } else {
            const errBody = await res.text();
            console.error(`[check] FCM error: ${errBody}`);
            // Remove invalid tokens
            if (res.status === 404 || res.status === 400) {
              await supabase.from("fcm_tokens").delete().eq("token", token);
            }
          }
        } catch (e) {
          console.error(`[check] Send error:`, (e as Error).message);
        }
      }
    }

    return new Response(JSON.stringify({ sent, tasks_claimed: claimed.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[check] Error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const hB64 = b64url(enc.encode(JSON.stringify(header)));
  const pB64 = b64url(enc.encode(JSON.stringify(payload)));
  const unsigned = `${hB64}.${pB64}`;

  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, "");
  const binaryKey = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(unsigned));
  const jwt = `${unsigned}.${b64url(new Uint8Array(sig))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(`Token failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

function b64url(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
