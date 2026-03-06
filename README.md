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

## Git basics (for non-technical users)

Git is a version history tool for your project:

1. It remembers every change made to files.
2. It lets you go back if something breaks.
3. It helps multiple people work on the same project safely.
4. It sends your local updates to GitHub (shared online version).

Simple idea:

- Your computer has a local copy.
- GitHub has the shared copy.
- You sync them regularly, make changes, then publish them.

---

## Git branching (what it is and why it helps)

A branch is a separate workspace for a specific change.

- `main` = the stable, official version.
- `feature branch` = where you safely test a new change.

Why use branches:

1. Keeps `main` clean and stable.
2. Avoids mixing unrelated changes together.
3. Makes review and rollback easier.

Typical branch start:

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/my-change
```

---

## Pull latest `main` before any modification

Before editing files, always sync with the latest code:

```bash
git switch main
git fetch origin
git pull --ff-only origin main
```

Why this is important:

1. Prevents working on outdated code.
2. Reduces conflicts later.
3. Avoids history mistakes (for example, building on old commits).

---

## Commit and push your changes

After your edits are done:

```bash
# 1. If you are not on a feature branch yet, create one
git switch -c feat/my-change

# 2. Save your work in Git
git add .
git commit -m "Describe what was changed"

# 3. Publish to GitHub
git push -u origin feat/my-change
```

Then open a Pull Request from your branch to `main`.

Useful commands:

| Command             | What it does                            |
| ------------------- | --------------------------------------- |
| `git status`        | Shows changed files                     |
| `git diff`          | Shows exact line-by-line differences    |
| `git log --oneline` | Shows recent commit history             |

---

## AI prompting for Cursor

Use this prompt in Cursor when asking for code changes:

```text
Act as a senior front-end developer specialized in HTML, CSS, and JavaScript.

Project constraints:
- Always follow the current project structure and naming conventions.
- Do not introduce unnecessary frameworks, build tools, or dependencies.
- Keep existing behavior unless the requested change explicitly requires otherwise.

Engineering standards:
- Apply separation of concerns (HTML structure, CSS styling, JS behavior).
- Follow DRY principles and avoid duplicated logic.
- Write clean, readable, and maintainable code.
- Prefer small, focused, reusable functions.
- Add concise comments only when the intent is not obvious.

Quality requirements:
- Keep performance in mind (minimal DOM work, efficient selectors/events, avoid unnecessary reflows).
- Keep accessibility in mind (semantic HTML, keyboard navigation, focus states, aria attributes when needed, sufficient contrast).
- Ensure responsive behavior on desktop and mobile.
- Preserve compatibility with current files and deployment workflow.

Before finalizing:
- Briefly explain what changed and why.
- Highlight any tradeoffs.
- Provide a quick verification checklist for functionality, performance, and accessibility.
```
