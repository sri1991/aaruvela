# Deployment Guide: Aaruvela App

This guide details how to deploy your full-stack application (FastAPI Backend + Vite Frontend) to **Render** using a Blueprint.

## Prerequisites

1.  **Git Repository**: Ensure your code is pushed to a remote repository (GitHub, GitLab, or Gitea).
2.  **Render Account**: Create an account at [dashboard.render.com](https://dashboard.render.com/).

## easy Deployment with Blueprint (Recommended)

I have created a `render.yaml` file in your repository. This file tells Render exactly how to build and deploy both your backend and frontend.

1.  **New Blueprint**:
    *   In the Render Dashboard, click **New +** and select **Blueprint**.
2.  **Connect Repository**:
    *   Connect your `aaruvela` repository.
3.  **Approve**:
    *   Render will read the `render.yaml` file and show you two services: `aaruvela-api` and `aaruvela-web`.
    *   Click **Apply**.

### Environment Variables

After the initial sync, you MUST configure the environment variables for your services. The build might fail initially until these are set.

#### 1. Backend Service (`aaruvela-api`)
Go to the **Environment** tab of your new backend service and add:

-   `SUPABASE_URL`: Your Supabase URL
-   `SUPABASE_SERVICE_KEY`: Your Supabase Service Key (from Supabase Dashboard > Settings > API)
-   `SUPABASE_ANON_KEY`: Your Supabase Anon Key
-   `JWT_SECRET`: A strong random string
-   `RAZORPAY_KEY_ID`: Your Razorpay Key ID
-   `RAZORPAY_KEY_SECRET`: Your Razorpay Secret
-   `CORS_ORIGINS`: After deployment, set this to your Frontend URL (e.g., `https://aaruvela-web.onrender.com`)

#### 2. Frontend Service (`aaruvela-web`)
Go to the **Environment** tab of your new frontend static site and add:

-   `VITE_SUPABASE_URL`: Your Supabase URL
-   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key

*Note: `VITE_API_URL` and `VITE_API_BASE_URL` are automatically linked to your backend service by the blueprint.*

---

## Alternative: Manual Deployment

If you prefer to deploy services manually, follow these steps:

### Part 1: Backend (Web Service)
1.  **New Web Service** -> Connect Repo.
2.  **Root Directory**: `backend`
3.  **Runtime**: Python 3
4.  **Build Command**: `pip install -r requirements.txt`
5.  **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6.  **Environment Variables**: Add all backend variables listed above.

### Part 2: Frontend (Static Site)
1.  **New Static Site** -> Connect Repo.
2.  **Root Directory**: `.` (leave empty)
3.  **Build Command**: `npm install && npm run build`
4.  **Publish Directory**: `dist`
5.  **Redirects/Rewrites**:
    *   Source: `/*`
    *   Destination: `/index.html`
    *   Action: `Rewrite`
6.  **Environment Variables**: Add all frontend variables listed above.

## Custom Domain Setup

1.  Go to your service's **Settings** > **Custom Domains**.
2.  Add your domain (e.g., `www.yourdomain.com`).
3.  Follow the DNS instructions provided by Render (add CNAME or A record).
