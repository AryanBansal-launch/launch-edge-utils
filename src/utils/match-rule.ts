/**
 * Shared matcher for Launch-style `source` → `destination` rules, used by both
 * redirects and rewrites.
 *
 * Matching semantics:
 *   - Exact: `source` equals the pathname (e.g. `/legacy/about`).
 *   - Wildcard: a `source` ending in `/*` matches any pathname under that
 *     prefix. If `destination` contains a `*`, the captured tail is
 *     substituted for it; otherwise `destination` is a static catch-all and
 *     the tail is dropped.
 *
 * Examples:
 *   `/old-shop/*` → `/shop/*`      : `/old-shop/a/b` → `/shop/a/b`
 *   `/archive/*`  → `/blog/archive/*` : `/archive/2020` → `/blog/archive/2020`
 *   `/drop/*`     → `/gone`        : `/drop/x/y` → `/gone` (static catch-all)
 *   `/legacy/about` → `/about`     : `/legacy/about` → `/about`
 *
 * The first rule to match (in array order) wins.
 */

export interface SourceDestRule {
  source: string;
  destination: string;
  statusCode?: number;
  response?: { headers?: Record<string, string> };
}

export interface RuleMatch<R extends SourceDestRule> {
  rule: R;
  /** Destination pathname with any wildcard tail substituted in. */
  destination: string;
}

function isWildcard(source: string): boolean {
  return source.endsWith("/*") || source === "*";
}

export function matchRule<R extends SourceDestRule>(
  pathname: string,
  rules: R[]
): RuleMatch<R> | null {
  for (const rule of rules) {
    if (!rule || typeof rule.source !== "string") continue;

    if (!isWildcard(rule.source)) {
      if (pathname === rule.source) {
        return { rule, destination: rule.destination };
      }
      continue;
    }

    // Wildcard: strip the trailing "*", keep the prefix (incl. the slash).
    const prefix = rule.source.slice(0, -1); // e.g. "/old-shop/"
    if (pathname.startsWith(prefix)) {
      const tail = pathname.slice(prefix.length); // captured portion
      const destination = rule.destination.includes("*")
        ? rule.destination.replace(/\*/, tail)
        : rule.destination; // static catch-all: tail dropped
      return { rule, destination };
    }
  }
  return null;
}
