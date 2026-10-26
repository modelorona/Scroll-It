/*
 * Copyright 2025 modelorona
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Issues an application-only Reddit OAuth token to the frontend.
// The browser then calls oauth.reddit.com directly (it sends CORS headers),
// caching the token in localStorage, so this runs about once per visitor per day.
// The client secret never leaves this function. The response has no CORS headers,
// so other websites cannot read the token from a visitor's browser.
//
// Required environment variables (set in the Netlify UI):
//   REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME

// Reddit tokens last 24h. The CDN shares one response across all visitors for
// CDN_CACHE_SECONDS, so only reuse a token while it outlives that window by a margin.
const CDN_CACHE_SECONDS = 6 * 60 * 60;
const MIN_REMAINING_MS = 12 * 60 * 60 * 1000;

function getUserAgent(): string {
  return `web:scroll-it.xyz:v1.0.0 (by /u/${process.env.REDDIT_USERNAME || 'unknown'})`;
}

// Token cache survives across invocations while the function instance is warm.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<{ token: string; expiresAt: number }> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - MIN_REMAINING_MS) {
    return cachedToken;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Reddit OAuth credentials are not configured');
  }

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': getUserAgent(),
    },
    // The token is handed to browsers, so limit it to reading public data
    body: 'grant_type=client_credentials&scope=read',
  });

  if (!response.ok) {
    throw new Error(`Reddit token request failed with status ${response.status}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken;
}

export default async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const { token, expiresAt } = await getAccessToken();
    return new Response(JSON.stringify({ access_token: token, expires_at: expiresAt }), {
      headers: {
        'content-type': 'application/json',
        // Browsers keep the token in localStorage instead of the HTTP cache
        'cache-control': 'no-cache',
        // One shared response at the edge, so repeat calls don't invoke the function
        'netlify-cdn-cache-control': `public, s-maxage=${CDN_CACHE_SECONDS}, durable`,
      },
    });
  } catch (error) {
    console.error('Reddit token error:', error);
    return new Response(JSON.stringify({ error: 'Token request failed' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};

export const config = {
  path: '/reddit-token',
};
