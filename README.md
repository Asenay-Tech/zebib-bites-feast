# 🚀 Zebib Bites Feast – Deployment Guide

This project uses a clean workflow for deploying updates to Hostinger via GitHub.

We keep the main branch (`main`) for development and use a separate deployment branch (`deploy`) that contains the built static files from `dist/`.

---

## ✅ Everyday Deployment Workflow

Follow this routine every time you want to make changes and publish them online:

---

### 🧑‍💻 1. Make Changes Locally

```bash
#*********************************#
git checkout main
# edit your code...
git add -A
git commit -m "Describe what you changed"
git push origin main
#*********************************#

# 🏗️ 2. Build and Publish
#*********************************#
# After pushing your latest changes to main, run:

./deploy.sh
#*********************************#

#Project Structure

├── public/
├── src/
├── deploy-support/
│   └── .htaccess      ← needed for proper routing on Hostinger
├── dist/              ← generated after build
├── deploy.sh          ← auto-deploy script
├── README.md

First-Time Setup (for new team members)

Clone the repo:

git clone https://github.com/Asenay-Tech/zebib-bites-feast.git
cd zebib-bites-feast


Install dependencies:

npm install


Make sure you have deploy-support/.htaccess and deploy.sh.

You're ready to follow the everyday workflow above.

Requirements

Node.js + npm

Git

Bash (for running deploy.sh)

Hosting

We deploy using Hostinger Git Integration with a Webhook tied to the deploy branch. All files in dist/ are synced to public_html/.
```
