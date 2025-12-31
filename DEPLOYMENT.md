# coCreate Deployment Guide

## Overview

coCreate is a Next.js 14 application with Supabase backend, Daily.co for live streaming, and Stream Chat for real-time messaging.

## Recommended: Vercel Deployment

Vercel is the recommended platform for Next.js apps - zero-config deployment with automatic optimizations.

### Step 1: Push to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: coCreate Phase 1+2"

# Add GitHub remote (create repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/coCreate.git

# Push to main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New" > "Project"
3. Import your `coCreate` repository
4. Configure environment variables (see below)
5. Click "Deploy"

### Step 3: Configure Environment Variables in Vercel

In your Vercel project settings > Environment Variables, add:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `DAILY_API_KEY` | Daily.co API key for streaming |
| `NEXT_PUBLIC_STREAM_CHAT_KEY` | Stream Chat public key |
| `STREAM_CHAT_SECRET` | Stream Chat secret (server-side only) |

### Step 4: Configure Supabase for Production

1. **Update Auth Settings**
   - Go to Supabase Dashboard > Authentication > URL Configuration
   - Add your Vercel URL to "Site URL": `https://your-app.vercel.app`
   - Add to "Redirect URLs": `https://your-app.vercel.app/**`

2. **Run Database Migration**
   - Execute the SQL in `supabase/migrations/20241210_add_streams_table.sql`
   - This creates the `streams` table for live streaming

3. **Enable Realtime**
   - Go to Database > Replication
   - Ensure `streams`, `nodes`, `node_placements`, `buckets` tables have realtime enabled

### Step 5: Configure External Services

**Daily.co:**
1. Go to [dashboard.daily.co](https://dashboard.daily.co)
2. Settings > Domain: Note your domain (e.g., `cocreate.daily.co`)
3. Update `app/api/streams/start/route.ts` if using custom domain

**Stream Chat:**
1. Go to [dashboard.getstream.io](https://dashboard.getstream.io)
2. Your app should already be configured from development

---

## Alternative: Self-Hosted Deployment

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

Update `next.config.js` for standalone output:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

module.exports = nextConfig
```

Build and run:

```bash
docker build -t cocreate .
docker run -p 3000:3000 --env-file .env.local cocreate
```

### Railway / Render / Fly.io

These platforms also support Next.js with minimal configuration:

1. Connect your GitHub repository
2. Set environment variables
3. Deploy

---

## Post-Deployment Checklist

- [ ] Verify authentication flow works (sign up, sign in, sign out)
- [ ] Test bubble world loading and node creation
- [ ] Test network view loads all users
- [ ] Verify realtime presence updates
- [ ] Test live streaming (start/end stream)
- [ ] Test chat functionality
- [ ] Check CORS settings if using custom domain
- [ ] Set up monitoring/error tracking (optional: Sentry, LogRocket)

---

## Custom Domain Setup

### Vercel
1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS as instructed
4. Update Supabase redirect URLs

### SSL/HTTPS
Vercel and most platforms provide automatic SSL. For self-hosted, use:
- Let's Encrypt with Certbot
- Cloudflare (free SSL proxy)

---

## Performance Optimizations

Already configured in the codebase:
- Next.js Image optimization
- Dynamic imports for heavy components
- Zustand for efficient state management

Consider adding:
- Vercel Analytics
- CDN for static assets (automatic on Vercel)

### API Route Caching

Vercel automatically caches API route responses by default. For routes that serve dynamic data (like `/api/network` which returns all users), caching must be disabled to ensure fresh data:

```typescript
// Add this export to prevent Vercel from caching the route
export const dynamic = 'force-dynamic'
```

**Routes configured for dynamic rendering:**
- `/api/network` - Returns all users for the network view (must always be fresh)

**Routes that CAN be cached:**
- Static content routes
- Routes with infrequent data changes

If new data (users, nodes, etc.) isn't appearing after creation, check that the relevant API route has `export const dynamic = 'force-dynamic'` set.

---

## Monitoring & Maintenance

### Recommended Tools
- **Error Tracking**: Sentry
- **Analytics**: Vercel Analytics, Plausible
- **Uptime**: UptimeRobot, Better Uptime

### Database Maintenance
- Regular Supabase backups (automatic on Pro plan)
- Monitor connection pool usage
- Clean up old/ended streams periodically

---

## Estimated Costs (Monthly)

| Service | Free Tier | Production Estimate |
|---------|-----------|---------------------|
| Vercel | 100GB bandwidth | $20/mo (Pro) |
| Supabase | 500MB DB, 2GB storage | $25/mo (Pro) |
| Daily.co | 2,000 participant mins | Pay-as-you-go |
| Stream Chat | 10K MAU | $99/mo (Scale) |

**Note**: Free tiers are sufficient for development and small-scale launch.
