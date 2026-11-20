const ORIGIN = 'http://x';

function hasUnsafeChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    // C0 controls, space, DEL, C1 controls, backslash.
    if (code <= 0x20 || (code >= 0x7f && code <= 0x9f) || code === 0x5c) return true;
  }
  return false;
}

function isSafePath(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//')) return false;
  if (hasUnsafeChars(value)) return false;
  try {
    return new URL(value, ORIGIN).origin === ORIGIN;
  } catch {
    return false;
  }
}

/**
 * Validates a post-login redirect target (`?next=`) so it can only point back
 * into this app. Anything that could leave the origin, or be read that way by
 * some browser or proxy, falls back to `fallback`.
 *
 * Accepted: same-origin absolute paths such as `/account/orders?x=1`.
 * Rejected:
 * - absolute and scheme URLs (`https://evil`, `javascript:alert(1)`)
 * - protocol-relative forms (`//evil`, `/\evil`, `\\evil`)
 * - any backslash, whitespace, or control character (browsers strip tabs and
 *   newlines and turn `\` into `/`, so `/\t/evil` would become `//evil`)
 * - percent-encoded versions of the above: the value is decoded once and must
 *   pass the same checks. `/%2F%2Fevil` resolves same-origin on its own, but it
 *   decodes to `//evil`, and any layer that decodes before redirecting would
 *   send the user off-site. No real route needs an encoded leading slash, so
 *   we reject it.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = '/'): string {
  if (!value || !isSafePath(value)) return fallback;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  return isSafePath(decoded) ? value : fallback;
}
