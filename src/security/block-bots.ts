const DEFAULT_BOTS = [
    "claudebot",
    "gptbot",
    "googlebot",
    "bingbot",
    "ahrefsbot",
    "yandexbot",
    "semrushbot",
    "mj12bot",
    "facebookexternalhit",
    "twitterbot"
  ];
  
  export function blockAICrawlers(
    request: Request,
    bots: string[] = DEFAULT_BOTS
  ): Response | null {
    const ua = (request.headers.get("user-agent") || "").toLowerCase();
  
    if (bots.some(bot => ua.includes(bot))) {
      return new Response(
        "Forbidden: AI crawlers are not allowed.",
        { status: 403 }
      );
    }
  
    return null;
  }
  