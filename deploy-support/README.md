# 🔄 Auto Deployment Guide (Hostinger + GitHub)

This project supports automated deployment via GitHub → Hostinger Webhook.

---

## 🚀 Deployment Branch Setup

- Deployment branch: `deploy`
- Hostinger deploy directory: `public_html`
- Files deployed: contents of `/dist`

---

## 📁 Required Folder

Make sure your `dist/` folder contains:

- `index.html`
- `assets/` folder
- `favicon.ico`
- Any other static files
- ✅ And this `.htaccess` file: [`deploy-support/.htaccess`](./.htaccess)

Copy `.htaccess` to your `/dist` folder before pushing to `deploy` branch.

---

## 🔁 Deployment Steps

```bash
npm run build                 # 1. Build the project
cp deploy-support/.htaccess dist/  # 2. Copy .htaccess into build
git checkout deploy           # 3. Switch to deploy branch
rm -rf *                      # 4. Wipe old contents
cp -r ../dist/* .             # 5. Copy new build files
git add . && git commit -m "Deploy"
git push origin deploy        # 6. Push to deploy → triggers Hostinger deploy webhook
```
