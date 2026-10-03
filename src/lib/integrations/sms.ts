/**
 * YourBulkSMS client — mirrors Laravel JobsController assign / inspect curls.
 * Secrets must come from env (never hardcode auth keys).
 *
 * Live send requires SMS_ENABLED=true and SMS_AUTH_KEY. Default is stub/log
 * only — do not force-enable in local/dev.
 */

export type SmsSendResult = {
  ok: boolean;
  stubbed: boolean;
  status?: number;
  body?: string;
  /** Provider message id when known. */
  messageId?: string;
  reason?: string;
};

export type SmsConfig = {
  enabled: boolean;
  apiUrl: string;
  authKey: string;
  sender: string;
  route: string;
  country: string;
  /** Optional DLT template id (YourBulkSMS / TRAI). */
  dltTeId: string;
  timeoutMs: number;
  /** Request JSON responses when the gateway supports `format=json`. */
  preferJson: boolean;
};

function flagEnabled(name: string): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") return false;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export function isSmsSendEnabled(): boolean {
  return flagEnabled("SMS_ENABLED");
}

/** Default on — clearer provider errors. Set SMS_FORMAT_JSON=false for plain text. */
function preferJsonFormat(): boolean {
  const raw = process.env.SMS_FORMAT_JSON;
  if (raw == null || raw === "") return true;
  return flagEnabled("SMS_FORMAT_JSON");
}

export function getSmsConfig(): SmsConfig {
  const timeoutRaw = Number(process.env.SMS_TIMEOUT_MS ?? "15000");
  return {
    enabled: isSmsSendEnabled(),
    apiUrl:
      process.env.SMS_API_URL ??
      "http://login.yourbulksms.com/api/sendhttp.php",
    authKey: process.env.SMS_AUTH_KEY ?? "",
    sender: process.env.SMS_SENDER ?? "DTECHI",
    route: process.env.SMS_ROUTE ?? "4",
    country: process.env.SMS_COUNTRY ?? "91",
    dltTeId: process.env.SMS_DLT_TE_ID?.trim() ?? "",
    timeoutMs: Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : 15_000,
    preferJson: preferJsonFormat(),
  };
}

/**
 * Describe live-path readiness for worker/boot logs (never logs the auth key).
 */
export function describeSmsLiveReadiness(): {
  live: boolean;
  detail: string;
} {
  const config = getSmsConfig();
  if (!config.enabled) {
    return {
      live: false,
      detail: "SMS_ENABLED=false (stub/log only)",
    };
  }
  if (!config.authKey.trim()) {
    return {
      live: false,
      detail: "SMS_ENABLED=true but SMS_AUTH_KEY is empty — live sends will fail",
    };
  }
  if (!config.sender.trim()) {
    return {
      live: false,
      detail: "SMS_ENABLED=true but SMS_SENDER is empty",
    };
  }
  const parts = [
    `live → ${config.apiUrl}`,
    `sender=${config.sender}`,
    `route=${config.route}`,
  ];
  if (config.dltTeId) parts.push("DLT_TE_ID=set");
  return { live: true, detail: parts.join(" ") };
}

/** Last 10 digits, Indian mobile style (Laravel substr($phone, -10)). */
export function normalizeMobile(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

function redactAuthInUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.searchParams.has("authkey")) {
      u.searchParams.set("authkey", "***");
    }
    return u.toString();
  } catch {
    return url.replace(/authkey=[^&]*/gi, "authkey=***");
  }
}

/**
 * YourBulkSMS successful HTTP bodies are typically a numeric message id.
 * With format=json, look for type/status success and a message/request id.
 * Error bodies often mention auth/balance/sender issues (plain text).
 */
function classifyProviderBody(body: string): {
  ok: boolean;
  reason?: string;
  messageId?: string;
} {
  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, reason: "provider_empty_body" };
  }

  // Plain success: message id (digits)
  if (/^\d+$/.test(trimmed)) {
    return { ok: true, messageId: trimmed };
  }

  // JSON response (format=json)
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown> | unknown[];
      const obj = Array.isArray(parsed)
        ? ((parsed[0] as Record<string, unknown> | undefined) ?? {})
        : parsed;

      const type =
        typeof obj.type === "string" ? obj.type.toLowerCase() : "";
      const status =
        typeof obj.status === "string"
          ? obj.status.toLowerCase()
          : typeof obj.status === "number"
            ? String(obj.status)
            : "";
      const code =
        typeof obj.code === "string" || typeof obj.code === "number"
          ? String(obj.code)
          : "";
      const msg =
        typeof obj.message === "string"
          ? obj.message
          : typeof obj.description === "string"
            ? obj.description
            : "";
      const messageId =
        typeof obj.message_id === "string" || typeof obj.message_id === "number"
          ? String(obj.message_id)
          : typeof obj.msgid === "string" || typeof obj.msgid === "number"
            ? String(obj.msgid)
            : typeof obj.request_id === "string"
              ? obj.request_id
              : /^\d+$/.test(msg)
                ? msg
                : undefined;

      if (
        type === "success" ||
        status === "success" ||
        status === "ok" ||
        code === "200" ||
        code === "001"
      ) {
        return { ok: true, messageId, reason: messageId ? undefined : "provider_json_success" };
      }

      if (
        type === "error" ||
        status === "error" ||
        status === "fail" ||
        status === "failed" ||
        /invalid|auth|unauthor|balance|reject|error|fail/i.test(msg) ||
        /invalid|auth|unauthor|balance|reject|error|fail/i.test(code)
      ) {
        return {
          ok: false,
          reason: `provider_json_error:${(msg || code || type || status || "unknown").slice(0, 120)}`,
        };
      }

      // Opaque JSON — soft success like legacy plain opaque body
      return {
        ok: true,
        messageId,
        reason: "provider_opaque_json",
      };
    } catch {
      return { ok: false, reason: "provider_invalid_json" };
    }
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.includes("invalid") ||
    lower.includes("auth") ||
    lower.includes("unauthor") ||
    lower.includes("balance") ||
    lower.includes("reject") ||
    lower.includes("error") ||
    lower.includes("fail") ||
    lower.includes("credits unavailable")
  ) {
    return { ok: false, reason: "provider_error_body" };
  }

  // Unknown non-numeric body — soft success (legacy Laravel ignored body)
  return { ok: true, reason: "provider_opaque_body" };
}

function buildSendUrl(config: SmsConfig, mobile: string, message: string): string {
  const url = new URL(config.apiUrl);
  url.searchParams.set("authkey", config.authKey);
  url.searchParams.set("mobiles", `${config.country}${mobile}`);
  url.searchParams.set("message", message);
  url.searchParams.set("sender", config.sender);
  url.searchParams.set("route", config.route);
  // Laravel always passes country=0 (prefix already on mobiles)
  url.searchParams.set("country", "0");
  if (config.dltTeId) {
    url.searchParams.set("DLT_TE_ID", config.dltTeId);
  }
  if (config.preferJson) {
    url.searchParams.set("format", "json");
  }
  return url.toString();
}

/**
 * Send an SMS via YourBulkSMS HTTP API.
 * When SMS_ENABLED is off, returns a stub result (no network call).
 * When enabled but SMS_AUTH_KEY is missing, returns ok:false (misconfig).
 */
export async function sendSms(params: {
  mobile: string;
  message: string;
}): Promise<SmsSendResult> {
  const config = getSmsConfig();
  const mobile = normalizeMobile(params.mobile);
  if (!mobile) {
    console.error("[sms] invalid_mobile — need ≥10 digits");
    return { ok: false, stubbed: false, reason: "invalid_mobile" };
  }

  const message = params.message?.trim() ?? "";
  if (!message) {
    console.error("[sms] empty_message — refusing send to", mobile);
    return { ok: false, stubbed: false, reason: "empty_message" };
  }

  if (!config.enabled) {
    console.info(
      "[sms] stub (SMS_ENABLED=false) →",
      mobile,
      message.slice(0, 80),
    );
    return {
      ok: true,
      stubbed: true,
      reason: "SMS_ENABLED=false — set SMS_ENABLED=true + SMS_AUTH_KEY to send",
    };
  }

  if (!config.authKey.trim()) {
    console.error(
      "[sms] SMS_ENABLED=true but SMS_AUTH_KEY is empty — not sending",
    );
    return {
      ok: false,
      stubbed: false,
      reason: "missing_SMS_AUTH_KEY",
    };
  }

  if (!config.sender.trim()) {
    console.error("[sms] SMS_SENDER is empty — not sending");
    return { ok: false, stubbed: false, reason: "missing_SMS_SENDER" };
  }

  let requestUrl: string;
  try {
    requestUrl = buildSendUrl(config, mobile, message);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[sms] invalid SMS_API_URL:", errMsg);
    return { ok: false, stubbed: false, reason: `invalid_SMS_API_URL: ${errMsg.slice(0, 120)}` };
  }

  const safeUrl = redactAuthInUrl(requestUrl);
  console.info("[sms] live GET", mobile, "→", safeUrl.replace(/message=[^&]*/i, "message=…"));

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(config.timeoutMs),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const timedOut =
      (error instanceof Error && error.name === "TimeoutError") ||
      /aborted|timeout/i.test(errMsg);
    console.error(
      timedOut ? "[sms] timeout:" : "[sms] network error:",
      errMsg,
      "url=",
      safeUrl.replace(/message=[^&]*/i, "message=…"),
    );
    return {
      ok: false,
      stubbed: false,
      reason: timedOut
        ? `timeout_after_${config.timeoutMs}ms`
        : `network_error: ${errMsg.slice(0, 200)}`,
    };
  }

  let body = "";
  try {
    body = await response.text();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[sms] failed reading provider body:", errMsg);
    return {
      ok: false,
      stubbed: false,
      status: response.status,
      reason: "provider_body_read_error",
    };
  }

  if (!response.ok) {
    console.error("[sms] provider HTTP", response.status, body.slice(0, 200));
    return {
      ok: false,
      stubbed: false,
      status: response.status,
      body: body.slice(0, 500),
      reason: "provider_http_error",
    };
  }

  const classified = classifyProviderBody(body);
  if (!classified.ok) {
    console.error(
      "[sms] provider rejected",
      mobile,
      classified.reason,
      body.slice(0, 200),
    );
    return {
      ok: false,
      stubbed: false,
      status: response.status,
      body: body.slice(0, 500),
      reason: classified.reason,
    };
  }

  console.info(
    "[sms] sent to",
    mobile,
    "status",
    response.status,
    classified.messageId ? `msgid=${classified.messageId}` : classified.reason ?? "ok",
  );
  return {
    ok: true,
    stubbed: false,
    status: response.status,
    body: body.slice(0, 500),
    messageId: classified.messageId,
    reason: classified.reason,
  };
}
