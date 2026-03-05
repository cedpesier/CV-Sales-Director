# CV — Cédric Pesier, VP Sales EMEA

A personal CV website built as a single web page. No framework, no build step — just HTML, CSS, and JavaScript served directly in the browser.

## What's in the project

| File / Folder                  | Purpose                                  |
| ------------------------------ | ---------------------------------------- |
| `index.html`                   | The CV page (structure and content)      |
| `styles.css`                   | Visual design and layout                 |
| `index.js`                     | Interactive behaviour (animations, etc.) |
| `assets/`                      | Images and logo files                    |
| `.github/workflows/deploy.yml` | Automatic deployment to GitHub Pages     |

---

## Live website

The site is automatically published at:

**[https://cedpesier.github.io/CV-Sales-Director/](https://cedpesier.github.io/CV-Sales-Director/)**

Every time code is pushed to the `main` branch, GitHub rebuilds and republishes the site automatically — no manual action needed.

---

## Deployment to GitHub Pages

Deployment is fully automated via **GitHub Actions**.

The workflow file `.github/workflows/deploy.yml` triggers on every push to `main` and does three things:

1. Checks out the code
2. Packages the site files
3. Publishes them to GitHub Pages

To deploy a change: just push your code to `main` (see below). The site will update within a minute or two.

---

## How to push code changes to GitHub

After editing any file locally, run these those commands in your terminal:

```bash
# 1. Stage your changes (tell git which files to include)
git add .

# 2. Commit with a short description of what you changed
git commit -m "A brief message describing the change"

# 3. Push to GitHub — this also triggers the deployment
git push
```

The live site will reflect your changes automatically within a minute.

### Useful git commands

| Command             | What it does                            |
| ------------------- | --------------------------------------- |
| `git status`        | Shows which files have been modified    |
| `git diff`          | Shows exactly what changed line by line |
| `git log --oneline` | Lists recent commits                    |
