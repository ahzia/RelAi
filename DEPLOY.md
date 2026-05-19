# Deploy RelAI to Vultr

Path of least resistance: **Vultr Cloud Compute VM + Coolify**. Auto-handles TLS, auto-deploys from GitHub, no Docker knowledge needed. Total time: ~40 minutes the first time, ~30 seconds for every redeploy.

This guide is opinionated — it picks the choice that works for the hackathon and skips alternatives. See the **Troubleshooting** and **Alternative paths** sections at the bottom if you hit a wall.

---

## Prerequisites

- A Vultr account with the hackathon coupon credited ($200 credit). Sign up at https://www.vultr.com if you haven't.
- GitHub access to the `RelAi` repo (the Coolify app pulls from `main`).
- SSH key on your laptop. If unsure:
  ```bash
  ls ~/.ssh/id_ed25519.pub || ssh-keygen -t ed25519 -C "you@example.com"
  cat ~/.ssh/id_ed25519.pub   # add this to Vultr in step 1
  ```
- The contents of your `.env` ready to paste into Coolify (every key, no quotes).

---

## Step 1 — Provision the Vultr VM (~5 min)

1. Log in to https://my.vultr.com → **Products** → **Deploy Server**.
2. Pick:
   - **Server type:** *Cloud Compute — Regular Performance*
   - **Location:** **Frankfurt** (`fra`) or **Amsterdam** (`ams`) — both are close to Milan, low latency
   - **Image:** *Ubuntu 22.04 LTS x64* (Coolify works best on it)
   - **Plan:** *Regular Cloud Compute · 2 vCPU / 4 GB RAM* (~$24/mo). Smaller (1 vCPU / 2 GB) will OOM during the Next.js build.
   - **Auto-backups, IPv6, monitoring:** leave off (saves credits)
   - **SSH key:** add yours from prerequisites
   - **Hostname / Label:** `relai-prod`
3. Click **Deploy Now**. Wait ~60 seconds.
4. Copy the **public IPv4** address — you'll need it in every later step. From now on, this is referred to as `<VM_IP>`.

---

## Step 2 — Decide on a domain (~5 min)

You need HTTPS for the Telegram webhook to work. Two options:

### Option A — Free, instant: `nip.io`

`<VM_IP>.nip.io` automatically resolves to your VM. No DNS setup needed.

Example: if your VM IP is `45.76.12.34`, your URL becomes `https://relai-45-76-12-34.nip.io`. Coolify can issue Let's Encrypt certs against this.

**Use this for the hackathon — it just works.**

### Option B — Real domain

Add an **A record** in your DNS provider:
```
relai   A   <VM_IP>   TTL 60
```
Then use `relai.yourdomain.com`. Wait for DNS to propagate (`dig relai.yourdomain.com` should return `<VM_IP>`).

---

## Step 3 — Install Coolify on the VM (~10 min)

SSH in (use the password from the Vultr dashboard if your key didn't take):

```bash
ssh root@<VM_IP>
```

Run the official Coolify installer:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

This installs Docker, then Coolify. It takes 5–10 minutes — you'll see live progress. When it finishes you'll get a URL like:

```
Coolify is ready. Open http://<VM_IP>:8000 in your browser.
```

---

## Step 4 — Set up Coolify (~5 min)

1. Open `http://<VM_IP>:8000` in your browser.
2. Create the admin account (email + password — write these down).
3. On the dashboard, click **Servers** → you'll see `localhost` already registered. Good.
4. **Settings** → **Configuration** → set the **Instance Domain** field to your domain from Step 2 (e.g. `coolify-relai-45-76-12-34.nip.io`). Coolify will reissue its own cert in a moment — for now we don't need to access it on HTTPS, only the app.
5. Skip the rest of onboarding (telemetry, etc.).

---

## Step 5 — Create the RelAI application (~10 min)

1. Click **+ New** (top nav) → **Resource** → **Public Repository** (or **Private Repository** if you set up the GitHub App).
2. Paste the repo URL: `https://github.com/<your-org>/RelAi` (or your fork).
3. **Branch:** `main`
4. **Build pack:** `Nixpacks` (default, auto-detects Next.js + pnpm)
5. **Port:** `3000` (Next.js default)
6. Click **Save** → you're now on the application page.

### Set environment variables

Open **Environment Variables** in the left sidebar of the app page. Paste in each of these (no quotes around values):

| Key | Value | Build-time? |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://<your-domain>` | yes |
| `NEXT_PUBLIC_SUPABASE_URL` | from `.env` | yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from `.env` | yes |
| `SUPABASE_SECRET_KEY` | from `.env` | no |
| `SUPABASE_DATABASE_PASSWORD` | from `.env` | no |
| `GEMINI_API_KEY` | from `.env` | no |
| `GEMINI_FLASH_MODEL` | `gemini-2.5-flash` | no |
| `GEMINI_PRO_MODEL` | `gemini-2.5-pro` | no |
| `TELEGRAM_BOT_TOKEN` | from BOT teammate | no |
| `TELEGRAM_WEBHOOK_SECRET` | leave empty for now | no |
| `USE_DEMO_FALLBACK` | `false` | no |

For each `NEXT_PUBLIC_*` variable, **check the "Available at build time" box** — Next.js inlines those during `next build`.

### Bind the domain

In the app's **Domains** tab:

1. Click **+ Add Domain**
2. Enter `https://<your-domain>` (e.g. `https://relai-45-76-12-34.nip.io`)
3. **Generate SSL Certificate** — leave on (Let's Encrypt, free)
4. Save

---

## Step 6 — Deploy (~5 min)

1. Top of the app page: click **Deploy**.
2. Watch the logs. First build downloads pnpm + builds Next.js — takes 3–5 minutes.
3. When you see `started successfully` in the logs and the container shows **green**, visit `https://<your-domain>` in your browser.

Expected: the RelAI landing page loads, TLS green padlock, no console errors.

---

## Step 7 — Apply the database schema (~2 min)

If BE hasn't already applied it:

1. Open https://supabase.com/dashboard/project/<project-ref>/sql/new
2. Paste the contents of `supabase/schema.sql` from the repo
3. Click **Run**
4. Verify with:
   ```sql
   select table_name from information_schema.tables
   where table_schema = 'public' order by table_name;
   ```
   Should list: `agents, attendees, conversations, graph_events, matches`.

---

## Step 8 — Register the Telegram webhook (~1 min)

(BOT teammate's task, but it's a one-liner — do it yourself if needed.)

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://<your-domain>/api/telegram/webhook"
```

Verify:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

`"url"` in the response should match what you set. `"pending_update_count"` should be `0`.

---

## Step 9 — Enable auto-deploy on push (~1 min)

In the Coolify app page → **Webhooks**:

1. Toggle **Auto Deploy** on.
2. Coolify gives you a GitHub webhook URL — copy it.
3. Go to **GitHub repo → Settings → Webhooks → Add webhook**:
   - Payload URL: paste from Coolify
   - Content type: `application/json`
   - Events: **Just the push event**
4. Save.

Every push to `main` now redeploys in ~90 seconds. Test it: push a tiny commit and watch Coolify's deployment list.

---

## Step 10 — Final smoke test (~3 min)

From your laptop:

```bash
# Landing page loads
curl -I https://<your-domain>/                  # → HTTP/2 200

# TLS is real
curl -v https://<your-domain>/ 2>&1 | grep "SSL certificate verify ok"

# Telegram bot is webhook'd
# (do /start in Telegram — bot should reply)
```

If all three pass, you're production-deployed. Record the URL and post it in the team chat.

---

## Submission deliverables (per `hackathon_info.md`)

Track these as you complete them:

- [x] Vultr VM deployment (this guide)
- [x] Public demo URL: `https://<your-domain>`
- [ ] Public GitHub repository (MIT) — done, just verify it's public
- [ ] Recorded demo video showing the public URL working
- [ ] Cover image + slide deck
- [ ] Filed on lablab.ai with tags: **Collaborative Systems**, Agentic Workflows, Enterprise Utility, **Gemini**, **Vultr**

---

## Troubleshooting

### Build OOMs

Symptom: build logs show `Killed` or `JavaScript heap out of memory`.

Fix: upgrade the VM plan in Vultr to **2 vCPU / 4 GB** or higher. Recreate is not required — Vultr resizes in place.

### Coolify panel won't load on `:8000`

The installer opens port 8000 on the host but Vultr's firewall might not. From the Vultr dashboard, attach a firewall group to the VM allowing `8000/tcp` from your IP. **Don't open it to the world.**

### TLS cert fails to issue

Most common cause: DNS doesn't resolve to the VM yet. From the VM:
```bash
dig +short <your-domain>     # should print <VM_IP>
```
If it's empty or wrong, fix DNS first, then retry from Coolify (**Domains → Re-issue**).

### "Module not found" or pnpm errors during build

Check the build logs for the actual error. Most common: a dependency was added locally but the lockfile wasn't pushed. Run `git status` locally and commit `pnpm-lock.yaml`.

### Telegram webhook returns 502

App container crashed. **Application → Logs** in Coolify. Most common cause: missing env var. Cross-check against the table in Step 5.

### Container restarts every 30s

Usually a `next start` crash. Check the app logs. The fix is almost always a missing/typo'd env var — Supabase clients throw at startup if URL or key is missing.

---

## Alternative paths (skip unless Coolify breaks)

- **Docker Compose by hand:** clone repo on VM, `docker build`, run with env. Faster iteration locally but no TLS automation.
- **PM2 + Caddy:** `pnpm build`, `pm2 start npm -- start`, Caddyfile to terminate TLS. Lighter than Coolify but you're on the hook for everything.
- **Vultr Serverless Inference:** for Gemini-replacement open-source models. Out of scope here — we're using Google Gemini.

---

## What this gets you for hackathon judging

- ✅ Vultr VM deployment requirement (Best-of-Vultr prize eligibility)
- ✅ Public HTTPS demo URL
- ✅ Auto-deploy from `main` (low-effort iteration during demo polish)
- ✅ Stable infra for the recorded demo video

Total ongoing cost during hackathon: ~$1–2 from credits.

---

## After the hackathon

- Detach payment method from Vultr if you don't want continued billing.
- Take the VM down: `Vultr Dashboard → Server → Destroy`. (Don't do this until prize distribution is confirmed.)
