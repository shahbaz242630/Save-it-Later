export function extractDomain(input: string | URL) {
  try {
    const parsed = typeof input === 'string' ? new URL(input) : input;
    return parsed.hostname || null;
  } catch {
    return null;
  }
}
