# Git Ignore Notes

## Files/directories currently ignored by `.gitignore`

### Environment & Secrets
- `.env` — environment variables (secrets)
- `credentials.json` — API credentials
- `admin/.env.local` — local environment for admin app

### Virtual Environments & Dependencies
- `.venv/` — Python virtual environment
- `uv.lock` — lock file (ignored explicitly in .gitignore, last line `*.txt` catches it too)
- `.langgraph_api/` — langgraph API artifacts
- `admin/node_modules/` — npm dependencies

### Build & Cache
- `.ruff_cache/` — ruff linter/formatter cache
- `src/__pycache__/` and all nested `__pycache__/` dirs
- `admin/.next/` — Next.js build output
- `admin/tsconfig.tsbuildinfo` — TypeScript incremental build info
- `*.egg-info/` — Python package build info

### Editor & Misc
- `admin/lib/` — likely generated or external libs
- `admin/next-env.d.ts` — Next.js generated types
- `ADDTIONS.txt` — personal notes file
- `*.txt` — all .txt files (last rule in .gitignore)

## Untracked (new) files NOT ignored
These will be included if you push:
- `src/marketing_agent/tools/relevant_ads.py`
- `src/shared/metrics_service.py`
