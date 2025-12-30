const URL_REGEX = /(https?:\/\/[^\s<>"']+)/i;

export interface NormalizeUrlInput {
  url?: string | null;

  // Support both names so callers don't break
  rawText?: string | null;
  text?: string | null;

  title?: string | null;
  notes?: string | null;
  source_app?: string | null;
}

export interface NormalizeUrlResult {
  url: string;
  domain: string;
  title?: string;
  notes?: string;
  source_app?: string;
}

const sanitizeUrl = (value: string) =>
  value
    .trim()
    // strip common trailing punctuation/brackets/quotes from share payloads
    .replace(/[)\]\s>',"]+$/, '');

export function normalizeUrl(input: NormalizeUrlInput): NormalizeUrlResult | null {
  const direct = input.url?.trim() ?? '';
  let candidate = direct;

  const raw = input.rawText ?? input.text ?? null;

  if (!candidate && raw) {
    const match = raw.match(URL_REGEX);
    candidate = match?.[0] ?? '';
  }

  if (!candidate) return null;

  const sanitized = sanitizeUrl(candidate);

  try {
    const parsed = new URL(sanitized);
    if (!parsed.protocol || !parsed.host) return null;

    return {
      url: parsed.toString(),
      domain: parsed.hostname,
      title: input.title?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      source_app: input.source_app?.trim() || undefined,
    };
  } catch {
    return null;
  }
}
