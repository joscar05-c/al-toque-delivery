import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

interface NotificationRecord {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  reference_id: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

interface DeviceTokenRow {
  id: string;
  token: string;
  platform: "ios" | "android" | "web";
}

let cachedAccessToken: { token: string; expiresAtMs: number } | null = null;

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlEncodeString(input: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(input));
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const normalized = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getFirebaseAccessToken(
  clientEmail: string,
  privateKeyPem: string,
): Promise<string> {
  const nowMs = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAtMs - 300_000 > nowMs) {
    return cachedAccessToken.token;
  }

  const nowSec = Math.floor(nowMs / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: nowSec,
    exp: nowSec + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const signingInput = `${base64UrlEncodeString(JSON.stringify(header))}.${base64UrlEncodeString(
    JSON.stringify(payload),
  )}`;

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const assertion = `${signingInput}.${base64UrlEncodeBytes(new Uint8Array(signatureBuffer))}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`OAuth2 token exchange failed (${tokenResponse.status}): ${errorText}`);
  }

  const tokenJson = (await tokenResponse.json()) as {
    access_token: string;
    expires_in?: number;
  };

  cachedAccessToken = {
    token: tokenJson.access_token,
    expiresAtMs: nowMs + (tokenJson.expires_in ?? 3600) * 1000,
  };

  return cachedAccessToken.token;
}

function toStringRecord(
  notification: NotificationRecord,
): Record<string, string> {
  const result: Record<string, string> = {
    notificationId: notification.id,
    type: notification.type,
  };
  if (notification.reference_id) {
    result.referenceId = notification.reference_id;
  }
  if (notification.data && typeof notification.data === "object") {
    for (const [key, value] of Object.entries(notification.data)) {
      if (value !== undefined && value !== null) {
        result[key] = typeof value === "string" ? value : JSON.stringify(value);
      }
    }
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as { notification_id?: string };
    const notificationId = body.notification_id?.trim();

    if (!notificationId) {
      return new Response(JSON.stringify({ error: "Missing notification_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select("id, user_id, title, body, type, reference_id, data, created_at")
      .eq("id", notificationId)
      .single<NotificationRecord>();

    if (notifError || !notification) {
      return new Response(
        JSON.stringify({ error: "Notification not found", details: notifError?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Prevent replay of old notifications (> 15 minutes old)
    const createdAgeMs = Date.now() - new Date(notification.created_at).getTime();
    if (Number.isFinite(createdAgeMs) && createdAgeMs > 15 * 60 * 1000) {
      return new Response(
        JSON.stringify({ status: "ignored_stale_notification", notificationId }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const { data: tokens, error: tokenError } = await supabase
      .from("device_tokens")
      .select("id, token, platform")
      .eq("user_id", notification.user_id)
      .eq("isActive", true);

    if (tokenError) {
      throw new Error(`Failed querying device_tokens: ${tokenError.message}`);
    }

    const activeTokens = (tokens ?? []) as DeviceTokenRow[];
    if (activeTokens.length === 0) {
      return new Response(
        JSON.stringify({ status: "no_active_tokens", userId: notification.user_id }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const expoTokens: DeviceTokenRow[] = [];
    const fcmTokens: DeviceTokenRow[] = [];

    for (const row of activeTokens) {
      if (
        row.token.startsWith("ExponentPushToken[") ||
        row.token.startsWith("ExpoPushToken[")
      ) {
        expoTokens.push(row);
      } else {
        fcmTokens.push(row);
      }
    }

    const invalidTokenIds: string[] = [];
    let deliveredCount = 0;
    const stringData = toStringRecord(notification);

    // 1. Send to native FCM tokens via Firebase Cloud Messaging HTTP v1
    if (fcmTokens.length > 0) {
      const projectId = Deno.env.get("FIREBASE_ADMIN_PROJECT_ID");
      const clientEmail = Deno.env.get("FIREBASE_ADMIN_CLIENT_EMAIL");
      const privateKey = Deno.env.get("FIREBASE_ADMIN_PRIVATE_KEY");

      if (!projectId || !clientEmail || !privateKey) {
        console.error(
          "[send-push] Missing FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL or FIREBASE_ADMIN_PRIVATE_KEY",
        );
      } else {
        const accessToken = await getFirebaseAccessToken(clientEmail, privateKey);
        const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

        await Promise.all(
          fcmTokens.map(async (tokenRow) => {
            const fcmResponse = await fetch(fcmEndpoint, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: {
                  token: tokenRow.token,
                  notification: {
                    title: notification.title,
                    body: notification.body,
                  },
                  data: stringData,
                  android: {
                    priority: "HIGH",
                    notification: {
                      channel_id: "al-toque-orders",
                      sound: "default",
                      default_sound: true,
                      default_vibrate_timings: true,
                    },
                  },
                  apns: {
                    payload: {
                      aps: {
                        sound: "default",
                        "content-available": 1,
                      },
                    },
                  },
                },
              }),
            });

            if (fcmResponse.ok) {
              deliveredCount += 1;
              return;
            }

            const errBody = await fcmResponse.text();
            console.warn(
              `[send-push] FCM delivery failed for token ${tokenRow.id} (${fcmResponse.status}): ${errBody}`,
            );

            if (
              fcmResponse.status === 404 ||
              errBody.includes("UNREGISTERED") ||
              errBody.includes(" registration token is not a valid FCM registration token")
            ) {
              invalidTokenIds.push(tokenRow.id);
            }
          }),
        );
      }
    }

    // 2. Fallback: Send to Expo Push Tokens if any exist
    if (expoTokens.length > 0) {
      const expoMessages = expoTokens.map((row) => ({
        to: row.token,
        sound: "default",
        title: notification.title,
        body: notification.body,
        data: stringData,
        priority: "high",
        channelId: "al-toque-orders",
      }));

      const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expoMessages),
      });

      if (expoResponse.ok) {
        const expoResult = (await expoResponse.json()) as {
          data?: Array<{
            status: string;
            details?: { error?: string };
          }>;
        };
        const tickets = expoResult.data ?? [];
        tickets.forEach((ticket, idx) => {
          if (ticket.status === "ok") {
            deliveredCount += 1;
          } else if (ticket.details?.error === "DeviceNotRegistered") {
            const targetRow = expoTokens[idx];
            if (targetRow) invalidTokenIds.push(targetRow.id);
          }
        });
      }
    }

    // 3. Deactivate invalid/unregistered tokens automatically
    if (invalidTokenIds.length > 0) {
      await supabase
        .from("device_tokens")
        .update({ isActive: false, updated_at: new Date().toISOString() })
        .in("id", invalidTokenIds);
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        notificationId: notification.id,
        deliveredCount,
        deactivatedTokens: invalidTokenIds.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[send-push] Unhandled error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

