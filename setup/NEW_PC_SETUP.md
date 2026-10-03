# Complete Setup Guide: Running on a Different PC

This guide walks you step-by-step through setting up and running this Browser Automation project on a fresh or different PC without running into common configuration or migration errors.

---

## 1. Prerequisites on the New PC

Ensure the following tools are installed:
- **Node.js**: Version 20+ (Node 22 LTS or Node 24 recommended)
- **Git**
- **A terminal** (PowerShell, Bash, or Command Prompt)

---

## 2. Get the Code & Install Dependencies

1. Clone or copy the project repository to your new PC:
   ```bash
   git clone <your-repository-url>
   cd browser-automation-app
   ```
2. Install npm packages:
   ```bash
   npm install
   ```

---

## 3. Database Setup (Neon Postgres & Drizzle via CLI)

Add the following credentials in your `.env` file:

```env
# Neon Database (Postgres)
NEON_BRANCH=main
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...
```

### Step 3C: Push Database Schema & Migrations via CLI

Once your connection string is in `.env`, initialize the database tables:

1. **Push the schema directly** *(Recommended for development)*:
   ```bash
   npm run db:push
   ```
   *This creates the `workflows` table in Postgres, preventing the `relation "workflows" does not exist` error.*

2. **Alternatively, apply migration files**:
   ```bash
   npm run db:migrate
   ```

3. **Verify the database tables (Optional GUI)**:
   You can view and browse your database tables directly in your browser with Drizzle Studio:
   ```bash
   npm run db:studio
   ```
---

## 4. Configure the Environment Variables (`.env`)

Create a file named `.env` in the root folder of the project. Fill in the following credentials:

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Neon Database (Postgres)
NEON_BRANCH=main
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Trigger.dev Background Worker
TRIGGER_SECRET_KEY=tr_dev_sk_...

# Liveblocks (Multiplayer Canvas)
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dev_...
LIVEBLOCKS_SECRET_KEY=sk_dev_...

# Browserbase (Headless Browser & Replays)
BROWSERBASE_API_KEY=bb_live_...

# Resend (Email Notification Node)
RESEND_API_KEY=re_...

# Sentry (Optional for local dev)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

---

## 5. Verify `trigger.config.ts` and Start the Worker

1. Open `trigger.config.ts` and confirm the `project` key matches your Trigger.dev project ID:
   ```ts
   export default defineConfig({
     project: "proj_qazpptaxfuxikpdpyvgw", // Ensure this matches your project ID
     // ...
     dirs: ["features"],
   });
   ```
2. On the new PC, authenticate the Trigger.dev CLI with your account:
   ```bash
   npx trigger.dev login
   ```
3. Start the Trigger.dev background worker in **Terminal 1**:
   ```bash
   npx trigger.dev dev
   ```
   You should see:
   ```text
   ○ Local worker ready on branch: default [node] -> ...
   ```
   *(Keep this terminal running in the background).*

---

## 6. Verify Clerk Configuration (One-time check)

Ensure the following are configured in your [Clerk Dashboard](https://dashboard.clerk.com/):
1. **Organizations**: Make sure **Organizations** are enabled (Workflows are scoped to organizations).
2. **Organization Billing**:
   - Go to **Billing** ➔ **Settings**.
   - Ensure **Enable organization billing** is toggled **ON**.
   - Go to **Billing** ➔ **Plans** (Organization Plans tab):
     - Ensure there is a plan with Key: `pro` (Name: `Pro`).
     - This unlocks the **Agent** node and **Session Replays**.

---

## 7. Run the Application

In **Terminal 2**, start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Quick Daily Startup Checklist

Whenever you want to work on this project, simply run these two commands in separate terminal tabs:

| Terminal | Command | Purpose |
|---|---|---|
| **Terminal 1** | `npx trigger.dev dev` | Runs the cloud automation background worker |
| **Terminal 2** | `npm run dev` | Runs the web application UI |
