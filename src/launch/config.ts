export interface LaunchRedirect {
  source: string;
  destination: string;
  statusCode?: number;
  response?: {
    headers?: Record<string, string>;
  };
}

export interface LaunchRewrite {
  source: string;
  destination: string;
}

export interface LaunchConfig {
  redirects?: LaunchRedirect[];
  rewrites?: LaunchRewrite[];
  cache?: {
    cachePriming?: {
      urls: string[];
    };
  };
}


export function generateLaunchConfig(options: Partial<LaunchConfig>): LaunchConfig {
  return {
    redirects: options.redirects || [],
    rewrites: options.rewrites || [],
    cache: {
      cachePriming: {
        urls: options.cache?.cachePriming?.urls || []
      }
    }
  };
}
