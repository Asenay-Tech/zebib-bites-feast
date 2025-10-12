# /usr/bin/env bash
set -e

# 0) safety
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Run inside a git repo"; exit 1; }
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "You have uncommitted changes. Commit or stash first."; exit 1
fi

# 1) build from main
git checkout main
npm ci || npm install
npm run build

# 2) publish dist to deploy branch (clean root)
git checkout -B deploy
git rm -rf . > /dev/null 2>&1 || true
git checkout main -- dist
shopt -s dotglob
mv dist/* .
rm -rf dist

# 3) make sure .htaccess is in deploy (optional: copy from /deploy-support)
if [ -f deploy-support/.htaccess ]; then cp deploy-support/.htaccess .; fi

git add -A
git commit -m "Deploy build $(date -u +'%Y-%m-%d %H:%M:%S UTC')" || echo "No changes to deploy."
git push origin deploy -f

# 4) go back to main
git checkout main
echo "Done. Hostinger will auto-deploy the new commit on 'deploy'."
