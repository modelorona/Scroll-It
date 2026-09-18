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

// Reddit proxy as a Netlify Function.
// Reddit's public JSON endpoints send no CORS headers and 403 non-browser
// clients, so the frontend calls same-origin /reddit/* and this function
// forwards to oauth.reddit.com using application-only OAuth.
//
// Required environment variables (set in the Netlify UI):
//   REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME

const ALLOWED_PATHS = [
  /^\/r\/[A-Za-z0-9_+-]{2,200}\/(hot|new|top|rising)\.json$/,
  /^\/api\/search_reddit_names\.json$/,
];

function getUserAgent(): string {
  return `web:scroll-it.xyz:v1.0.0 (by /u/${process.env.REDDIT_USERNAME || 'unknown'})`;
}

// Token cache survives across invocations while the function instance is warm.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Refresh 5 minutes before expiry
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.token;
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
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Reddit token request failed with status ${response.status}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

export default async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/reddit/, '');

  if (!ALLOWED_PATHS.some(pattern => pattern.test(path))) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const token = await getAccessToken();
    // oauth.reddit.com uses the same paths without the .json suffix
    const target = `https://oauth.reddit.com${path.replace(/\.json$/, '')}${url.search}`;

    const upstream = await fetch(target, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': getUserAgent(),
      },
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('Reddit proxy error:', error);
    return new Response(JSON.stringify({ error: 'Upstream request failed' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};

export const config = {
  path: '/reddit/*',
};
