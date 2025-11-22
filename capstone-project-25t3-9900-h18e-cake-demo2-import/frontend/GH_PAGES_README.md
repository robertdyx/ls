
# GitHub Pages + <iframe> Embed

## Deploy
1. Create a new GitHub repo and push this project (default branch `main`).
2. Settings → Pages: enable GitHub Pages (Source: GitHub Actions).
3. Settings → Secrets and variables → Actions: add secret `VITE_API_BASE` with your backend HTTPS URL.
4. Push to `main` to trigger the workflow; wait for Pages URL.

## Embed
Use:
<iframe src="YOUR_PAGES_URL/?embed=1" width="100%" height="1000" style="border:0;max-width:100%;" loading="lazy" allowfullscreen></iframe>
