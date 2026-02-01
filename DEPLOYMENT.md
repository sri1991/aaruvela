# Deployment Guide: Aaruvela PWA

This guide details how to deploy your application to **Render** and configure a **Custom Domain**.

## Prerequisites

1.  **Git Repository**: Ensure your code is pushed to a remote repository (GitHub, GitLab, or Gitea).
    *   *You have already initialized the local repo. You just need to push it.*

## Part 1: Deploying to Render

Render is a cloud provider that offers free static site hosting with SSL.

1.  **Create Account**: Log in to [dashboard.render.com](https://dashboard.render.com/).
2.  **New Static Site**:
    *   Click **New +** and select **Static Site**.
3.  **Connect Repository**:
    *   If using GitHub/GitLab, connect your account and select the `aaruvela` repository.
    *   If using Gitea or a public repo, you can use the "Public Git Repository" URL field, strictly if the repo is public. If private, you may need to use a different method or move to GitHub/GitLab for easier integration.
4.  **Configure Build**:
    *   **Name**: `aaruvela-app` (or similar)
    *   **Branch**: `main`
    *   **Root Directory**: `.` (leave empty)
    *   **Build Command**: `npm run build`
    *   **Publish Directory**: `dist`
5.  **Deploy**: Click **Create Static Site**.
    *   Render will clone your repo, install dependencies, and run the build.

### Critical: Single Page Application (SPA) Fix

Since this is a React app with routing (e.g., `/about`, `/administration`), you must configure Render to handle client-side routes.

1.  Go to your Static Site's **Settings** tab.
2.  Scroll down to **Redirects / Rewrites**.
3.  Click **Add Rule**.
4.  Enter the following:
    *   **Source**: `/*`
    *   **Destination**: `/index.html`
    *   **Action**: `Rewrite`
5.  Save Changes.

## Part 2: Configuring a Custom Domain

You mentioned you have purchased a domain name. Here is how to link it.

1.  **Add Domain in Render**:
    *   Go to your Static Site's **Settings** tab.
    *   Scroll to **Custom Domains**.
    *   Click **Add Custom Domain**.
    *   Enter your domain name (e.g., `www.yourdomain.com`).

2.  **Update DNS Records**:
    *   Render will provide you with DNS records to add to your Domain Registrar (where you bought the domain, e.g., GoDaddy, Namecheap).
    *   **If using a subdomain (www.example.com)**:
        *   Create a **CNAME** record.
        *   **Host/Name**: `www`
        *   **Value/Target**: `[your-app-name].onrender.com`
    *   **If using the root domain (example.com)**:
        *   Create an **A** record.
        *   **Host/Name**: `@`
        *   **Value**: *Render will show you the IP address (usually `216.24.57.1`)*.

3.  **Verification**:
    *   Wait for DNS propagation (can take minutes to a few hours).
    *   Render will automatically verify the domain and issue a **free SSL certificate** (HTTPS).

## Troubleshooting

-   **"Page Not Found" on Refresh**: Ensure you added the **Rewrite Rule** mentioned in Part 1.
-   **Images not showing**: Ensure all images are in `src/assets` or `public` and imported correctly. (Your app is currently set up correctly for this).
