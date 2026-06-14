#!/bin/bash
# push.sh — Safe git commit & push for IGI portal
# Usage: ./push.sh "Your commit message"
# Or just: ./push.sh   (will prompt for message)

set -e

# Remove any stale git lock files left by crashed processes
find .git -name "*.lock" -type f -delete 2>/dev/null && echo "🔓 Cleared stale git locks" || true

MSG="${1}"
if [ -z "$MSG" ]; then
  read -p "Commit message: " MSG
fi

if [ -z "$MSG" ]; then
  echo "❌ No commit message. Aborting."
  exit 1
fi

git add -A
git commit -m "$MSG"
git push origin main
echo "✅ Pushed to GitHub."
