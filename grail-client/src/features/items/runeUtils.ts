export function normalizeRuneName(value: string): string {
  const trimmed = value.trim().toLowerCase()
  if (trimmed.endsWith(' rune')) {
    return trimmed.slice(0, -5).trim()
  }
  return trimmed
}

export function runeNamesMatch(a: string, b: string): boolean {
  return normalizeRuneName(a) === normalizeRuneName(b)
}
