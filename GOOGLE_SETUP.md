# Google OAuth Setup Guide

Follow these steps to enable Google sign-in for MintKit.

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **"Select a project"** → **"New Project"**
3. Enter a project name (e.g., `MintKit Auth`)
4. Click **Create**
5. Set the project as active (select from the dropdown)

---

## Step 2: Enable the Google+ API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for **"Google+"** API
3. Click on **Google+ API** → **Enable**

---

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `MintKit Web Client`
5. Click **Create**
6. Copy the **Client ID** and **Client Secret** — you'll need them in Step 5

---

## Step 4: Add Authorized Redirect URI

1. In the **OAuth 2.0 Client IDs** section, click on the client you just created
2. In **Authorized redirect URIs**, add:
   ```
   https://mintkit.cxlvip.com/api/auth/callback/google
   ```
3. Click **Save**

> ⚠️ For local development, the redirect URI is:
> `http://localhost:3000/api/auth/callback/google`

---

## Step 5: Add Environment Variables to Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add:

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | Paste from Step 3 |
| `GOOGLE_CLIENT_SECRET` | Paste from Step 3 |
| `NEXTAUTH_URL` | `https://mintkit.cxlvip.com` |
| `NEXTAUTH_SECRET` | Generate below |

### Generate NEXTAUTH_SECRET

Run this in your terminal:

```bash
openssl rand -base64 32
```

Copy the output and paste it as the value for `NEXTAUTH_SECRET`.

---

## Step 6: Redeploy

After adding environment variables in Vercel, go to **Deployments** and **Redeploy** the latest deployment to apply the changes.

---

## Local Development

For local testing, create a `.env.local` file in the project root:

```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret
```

Then run:

```bash
npm run dev
```

---

## Troubleshooting

**"redirect_uri_mismatch" error**
→ Check that the redirect URI in Google Cloud Console exactly matches:
`https://mintkit.cxlvip.com/api/auth/callback/google`

**OAuth not working in production**
→ Ensure `NEXTAUTH_URL` is set to `https://mintkit.cxlvip.com` (no trailing slash) in Vercel environment variables.

**Session not persisting**
→ Make sure `NEXTAUTH_SECRET` is set and consistent between environments.
