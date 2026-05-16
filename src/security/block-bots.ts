/**
 * Default list of AI-training / LLM crawlers.
 *
 * Intentionally excludes traditional search-engine bots (Googlebot, Bingbot)
 * because blocking those will de-index your site. If you want to block ALL
 * bots, pass `ALL_BOTS` explicitly, or compose your own list.
 */
export const AI_CRAWLERS: readonly string[] = [
  "gptbot",
  "chatgpt-user",
  "oai-searchbot",
  "claudebot",
  "claude-web",
  "anthropic-ai",
  "perplexitybot",
  "cohere-ai",
  "google-extended",
  "ccbot",
  "bytespider",
  "amazonbot",
  "applebot-extended",
  "diffbot",
  "facebookbot",
  "meta-externalagent",
  "img2dataset",
];

/**
 * Convenience list combining AI crawlers with general/SEO/scraper bots.
 * Pass this to `blockAICrawlers(request, [...ALL_BOTS])` only if you really
 * want to block search engines too — note this WILL break your SEO.
 */
export const ALL_BOTS: readonly string[] = [
  ...AI_CRAWLERS,
  "googlebot",
  "bingbot",
  "ahrefsbot",
  "yandexbot",
  "semrushbot",
  "mj12bot",
  "facebookexternalhit",
  "twitterbot",
];

/**
 * Block requests whose `User-Agent` substring-matches any entry in `bots`.
 *
 * Defaults to `AI_CRAWLERS`. Returns a 403 `Response` on match, or `null`
 * otherwise so callers can continue their middleware chain.
 */
export function blockAICrawlers(
  request: Request,
  bots: readonly string[] = AI_CRAWLERS
): Response | null {
  const ua = (request.headers.get("user-agent") || "").toLowerCase();
  if (!ua) return null;

  if (bots.some((bot) => ua.includes(bot))) {
    return new Response("Forbidden: AI crawlers are not allowed.", {
      status: 403,
    });
  }

  return null;
}
