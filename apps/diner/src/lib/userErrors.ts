/**
 * Map technical/API/network errors to friendly messages. Never show .env, VITE_,
 * API URLs, status codes, or stack traces to users.
 */

const PAYMENT_UNAVAILABLE = "Payments aren't available right now. Try again in a moment.";
const CONNECTION_ERROR = "Couldn't connect. Check your internet and try again.";
const SOMETHING_WRONG = "Something went wrong. Please try again.";
const SIGN_IN_AGAIN = "Session expired. Please sign in again.";
const PAY_AT_TABLE = "Pay at the table or try again later.";

/** Returns true if the message looks technical (env, API, URL, status, etc.) */
function isTechnical(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes('vite_') ||
    lower.includes('.env') ||
    lower.includes('api_url') ||
    lower.includes('endpoint') ||
    (lower.includes('not found') && (lower.includes('api') || lower.includes('404'))) ||
    lower.includes('invalid') && lower.includes('api key') ||
    lower.includes('forbidden') && lower.includes('secret') ||
    lower.includes('fetch') ||
    lower.includes('network') ||
    lower.includes('econnrefused') ||
    lower.includes('failed to fetch') ||
    /\b(4\d{2}|5\d{2})\b/.test(msg) ||
    /https?:\/\//.test(msg)
  );
}

/** Known API error codes where we show the API message (user-friendly). */
const P2P_MESSAGE_CODES = [
  'RECIPIENT_NOT_FOUND',
  'SELF_TRANSFER',
  'MISSING_FIELDS',
  'P2P_DISABLED',
  'UNAUTHORIZED',
  'INVALID_TOKEN',
  'AUTH_FAILED',
];

/**
 * User-facing message for P2P create-intent. Use when you have the full API response.
 * Shows the API message for known codes (e.g. recipient not found); otherwise sanitized generic.
 */
export function toP2PError(data: { error?: string; code?: string }, status: number): string {
  const code = data?.code;
  if (code === 'INVALID_TOKEN') return sessionExpiredMessage();
  const msg = (data?.error || '').trim();
  if (code && P2P_MESSAGE_CODES.includes(code) && msg && !isTechnical(msg)) return msg;
  return toPaymentError(msg, status);
}

/** User-facing message for payment flows (P2P, checkout). */
export function toPaymentError(raw: string | undefined, status?: number): string {
  const msg = (raw || '').trim();
  if (status === 401 && (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('session'))) {
    return sessionExpiredMessage();
  }
  if (status === 404 && !msg.toLowerCase().includes('recipient')) return PAYMENT_UNAVAILABLE;
  if (status && status >= 500) return PAYMENT_UNAVAILABLE;
  if (isTechnical(msg)) return PAYMENT_UNAVAILABLE;
  if (msg.includes('not configured') || msg.includes('not set up')) return PAY_AT_TABLE;
  if (msg.length > 120) return PAYMENT_UNAVAILABLE; // likely stack or long error
  return msg || PAYMENT_UNAVAILABLE;
}

/** User-facing message for auth (sign in / sign up). */
export function toAuthError(raw: string | undefined): string {
  const msg = (raw || '').trim();
  if (isTechnical(msg)) return CONNECTION_ERROR;
  if (msg.includes('Invalid login')) return "Email or password doesn't match. Try again.";
  if (msg.includes('already registered')) return "An account with this email already exists. Sign in instead.";
  if (msg.toLowerCase().includes('unsupported phone provider') || msg.toLowerCase().includes('sms provider')) {
    return "Phone sign-in isn't set up yet. Use Email instead.";
  }
  if (msg.length > 120) return SOMETHING_WRONG;
  return msg || SOMETHING_WRONG;
}

/** Generic API/network → friendly. Use for menus, table, scan, etc. */
export function toUserError(raw: string | undefined, context: 'connection' | 'generic' = 'generic'): string {
  const msg = (raw || '').trim();
  if (isTechnical(msg)) return context === 'connection' ? CONNECTION_ERROR : SOMETHING_WRONG;
  if (msg.length > 120) return SOMETHING_WRONG;
  return msg || SOMETHING_WRONG;
}

export function sessionExpiredMessage(): string {
  return SIGN_IN_AGAIN;
}

/** Message when fetch fails (network/connection). Use when API URL is known. */
export function toConnectionError(apiUrl?: string): string {
  if (apiUrl && (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1'))) {
    return "Couldn't reach the server. Is the API running? Run: npm run dev:pay from the repo root.";
  }
  return CONNECTION_ERROR;
}
