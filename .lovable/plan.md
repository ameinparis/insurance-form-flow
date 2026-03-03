

## Clean Up Redundant Root-Level Files

Based on the project structure, the Vite config sets `root: "frontend"`, meaning everything outside `frontend/` that duplicates its purpose is unnecessary.

### Files to Delete

| File | Reason |
|------|--------|
| `index.html` (root) | Duplicate — `frontend/index.html` is the active entry point |
| `vite.config.mjs` | Duplicate — `vite.config.ts` already exists with the same config |
| `public/logo-darkmode.png` | Not referenced anywhere in the frontend code; the `frontend/public/` folder is the correct location for static assets |

### Files to Keep (root level)

| File | Reason |
|------|--------|
| `package.json` | Required — defines dependencies and scripts |
| `package-lock.json` / `bun.lock` | Lock files for dependency resolution |
| `vite.config.ts` | Active Vite configuration |
| `.gitignore` | Git configuration |
| `node_modules/` | Installed dependencies |

### Technical Steps

1. Delete `index.html` from root
2. Delete `vite.config.mjs` from root
3. Delete `public/logo-darkmode.png` (and the empty `public/` directory)

No code changes needed — just file removals.

