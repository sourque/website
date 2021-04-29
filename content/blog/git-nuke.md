+++
title="git-nuke"
date="2021-03-10"
+++

Quick script to overwrite a `git` repo's history, and push to remote. Obviously, `git` is not intended to be used like this. But, nobody can stop me.

```bash
#!/bin/bash
set -e

MSG="Update website"
BRANCH="main"

REMOTE=$(cat .git/config | grep "url" | cut -d " " -f3)
if [[ -z $REMOTE ]]; then
    echo "Not a valid git repo, or no remote configured."
    exit 1
fi

echo "REPO: $REMOTE"
echo "Commit message: $MSG"
echo "Branch: $BRANCH"

read -p "Are you sure you want to nuke this repo? (y/N)"
if [[ $REPLY == "y" ]]; then
    echo "Removing .git..."
    rm -rf .git
    echo "Initializing repo..."
    git init
    git add -A
    git commit -m "$MSG"
    git branch -m $BRANCH
    echo "Pushing..."
    git remote add origin $REMOTE
    git push -u --force origin $BRANCH
else
    echo "Not nuking."
fi
```
