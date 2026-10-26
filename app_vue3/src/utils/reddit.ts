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

// Calls Reddit's OAuth API directly from the browser (oauth.reddit.com sends CORS headers).
// An app-only token comes from the /reddit-token Netlify Function and is kept in
// localStorage until shortly before it expires.

const TOKEN_STORAGE_KEY = 'redditToken';
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

interface StoredToken {
  token: string;
  expiresAt: number;
}

let pendingToken: Promise<string> | null = null;

function readStoredToken(): string | null {
  try {
    const stored: StoredToken = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) || 'null');
    if (stored && Date.now() < stored.expiresAt - EXPIRY_BUFFER_MS) {
      return stored.token;
    }
  } catch {
    // Corrupt entry, fall through to a fresh token
  }
  return null;
}

async function requestToken(): Promise<string> {
  const response = await fetch('/reddit-token');
  if (!response.ok) {
    throw new Error(`Token request failed with status ${response.status}`);
  }
  const data = await response.json();
  const stored: StoredToken = { token: data.access_token, expiresAt: data.expires_at };
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(stored));
  return stored.token;
}

function getToken(): Promise<string> {
  const stored = readStoredToken();
  if (stored) return Promise.resolve(stored);
  // Share one in-flight request between concurrent callers
  pendingToken ??= requestToken().finally(() => {
    pendingToken = null;
  });
  return pendingToken;
}

/**
 * Fetches an oauth.reddit.com path, e.g. `/r/pics/hot?limit=100`.
 * Reddit answers a bad token (and a nonexistent subreddit's redirect) without CORS
 * headers, which surfaces as a fetch TypeError, so retry once with a fresh token.
 */
export async function redditFetch(path: string): Promise<Response> {
  const request = async () =>
    fetch(`https://oauth.reddit.com${path}`, {
      headers: { Authorization: `Bearer ${await getToken()}` },
    });

  try {
    return await request();
  } catch {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return request();
  }
}
