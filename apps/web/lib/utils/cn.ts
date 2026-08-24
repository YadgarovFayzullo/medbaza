/**
 * Join class names, dropping falsy values.
 *
 * Deliberately tiny — the project does not add a utility dependency for this
 * (CLAUDE.md §14).
 */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
