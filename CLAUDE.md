# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scroll-It is a Reddit image slideshow application built as a learning project during the 2020 lockdown. It provides auto-scrolling functionality for viewing images from Reddit subreddits in a slideshow format. The application handles albums, images, videos, and embedded content with NSFW filtering and infinite scrolling.

## Architecture

This is a **monorepo** with two main parts:

### 1. Frontend: Vue 3 Application (`app_vue3/`)
- **Framework**: Vue 3 with Composition API and `<script setup>` syntax
- **Build Tool**: Vite (dev server runs on port 3000)
- **UI Framework**: Vuetify 3 (Material Design components)
- **State Management**: Pinia stores (see `app_vue3/src/stores/`)
- **Routing**: Auto-generated from files in `app_vue3/src/pages/` via unplugin-vue-router
- **Component Loading**: Auto-imported via unplugin-vue-components (no manual imports needed)
- **Package Manager**: pnpm (enforced via packageManager field)

Key conventions:
- Uses TypeScript with `vue-tsc` for type checking
- Components are automatically imported - no need for manual imports
- Routes are file-based in `src/pages/`
- Layouts managed via vite-plugin-vue-layouts in `src/layouts/`

### 2. Backend: Firebase Cloud Functions (`functions/`) — NOT IN USE
**The frontend no longer uses this backend.** The proxy integration was removed from the Vue app (billing cost); the code is kept in the repo for reference but is not deployed or called. The app talks to Reddit's public JSON API directly.

- **Runtime**: Node.js 22
- **Functions Framework**: Firebase Functions v2
- **Build**: TypeScript compiled to `lib/` directory
- **Region**: europe-west4

Key functions:
- `redditProxy`: Proxies Reddit API requests with OAuth authentication, rate limiting (5 req/min), and monthly limits
- `searchSubredditsProxy`: Proxies Reddit subreddit search with rate limiting (10 req/min)
- `proxyStatus`: Health check endpoint for monitoring service status
- `analyticsStatus`: Returns anonymous aggregated usage statistics
- `cleanupRateLimits`: Scheduled function (runs hourly) to clean up expired rate limit entries

Infrastructure:
- **Rate Limiting**: Firestore-based, IP-tracked (see `functions/src/rateLimiter.ts`)
- **CORS**: Configured with allowed origins + localhost support with optional secret validation
- **OAuth**: Reddit API access via application-only OAuth with token caching (see `functions/src/config.ts`)
- **Analytics**: Privacy-compliant, GeoIP-based country tracking without storing IPs (see `functions/src/anonymousAnalytics.ts`)
- **Monthly Limits**: Firestore-based tracking to prevent quota exhaustion (see `functions/src/monthlyLimit.ts`)

## Development Commands

### Frontend (app_vue3/)
```bash
cd app_vue3

# Install dependencies
pnpm install

# Start dev server (http://localhost:3000)
pnpm dev

# Type check and build for production
pnpm build

# Run ESLint with auto-fix
pnpm lint

# Preview production build
pnpm preview
```

### Backend (functions/)
```bash
cd functions

# Install dependencies
npm install

# Lint TypeScript files
npm run lint

# Build TypeScript to JavaScript
npm run build

# Watch mode for development
npm run build:watch

# Test functions locally with Firebase emulators
npm run serve

# Deploy to Firebase
npm run deploy

# View function logs
npm run logs
```

### Firebase (root)
```bash
# Deploy only functions (runs lint + build first via predeploy hooks)
firebase deploy --only functions

# Deploy firestore rules
firebase deploy --only firestore

# Start local emulators
firebase emulators:start
```

## Environment Configuration

### Frontend Environment Variables
None required (the `VITE_LOCALHOST_SECRET` variable was only used for the removed proxy integration).

### Backend Environment Variables (unused backend)
Firebase Functions uses Firebase Params (defined in `functions/src/config.ts`):
- `ALLOWED_ORIGINS`: Comma-separated CORS origins
- `LOCALHOST_SECRET`: Optional secret for localhost access
- `REDDIT_USERNAME`: Reddit username for User-Agent
- `REDDIT_CLIENT_ID`: OAuth client ID from https://www.reddit.com/prefs/apps
- `REDDIT_CLIENT_SECRET`: OAuth client secret

See `functions/.env.example` for reference.

## State Management

The application uses Pinia with three stores in `app_vue3/src/stores/`:

1. **gallery.ts**: Core application state
   - Posts, images, and slideshow management
   - Reddit API integration (direct)
   - NSFW filtering and dialog state
   - Subreddit search

2. **settings.ts**: User preferences (persisted to localStorage)
   - Slideshow interval
   - Sort option (hot/new/top/rising)
   - NSFW consent

3. **app.ts**: Global app state (minimal)

## Reddit API Integration

The app calls Reddit's public JSON API directly:
- URL: `https://www.reddit.com/r/{subreddit}/{sort}.json`
- Limited by CORS and potential network restrictions
- No authentication required

A Firebase Functions proxy mode previously existed as a fallback; it was removed from the app (the backend code remains in `functions/` but is unused).

## Key Components

- `ScrollContent.vue`: Main slideshow container
- `ImageGrid.vue`: Grid view of images
- `MediaOverlay.vue`: Full-screen slideshow view with controls
- `SearchBar.vue`: Subreddit search with autocomplete
- `NSFWAlert.vue`: NSFW content warning dialog
- `SettingsDialog.vue`: User preferences configuration

## Firebase Integration

- **Firestore Collections**:
  - `rateLimits`: IP-based rate limiting tracking
  - `analytics`: Anonymous country-level usage statistics
  - `monthlyUsage`: Function invocation tracking

- **Deployment**: Netlify for frontend (Firebase Functions backend is no longer deployed)
- **Security**: Firestore rules defined in `firestore.rules`

## Testing

No test suite is currently configured for this project.

## Notes

- The project uses ESLint with Vue and TypeScript configurations
- Both frontend and backend enforce strict linting via predeploy hooks
- The dev server port is explicitly set to 3000 (not Vite's default 5173)
- Reddit OAuth tokens are cached with 5-minute refresh buffer to minimize API calls
