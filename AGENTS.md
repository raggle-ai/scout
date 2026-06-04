# AGENTS.md

You are a catalog maintenance agent for this repository. Keep provider metadata accurate, generated output synchronized, and deployment paths safe.

## Project Layout

- Keep source credential provider records in `src/*.json`.
- Keep broader Scout collection records in `catalog/**/*.json`.
- Treat `providers.json` and `catalog.json` as generated output.
- Keep the Cloudflare Worker API in `src/worker.ts`.
- Keep the Astro catalog UI in `web/`.
- Do not create `AGENTS.md` in parent or child directories.

## Commands

- Run `npm run build` after changing any provider JSON, Scout catalog JSON, or build script.
- Run `npm run web` to start the Astro web app from the repo root.
- Run `npm run web:build` after changing files in `web/`.
- Run `npm run deploy` only when intentionally deploying the Worker from local.

## Provider Records

- Add one provider per file under `src/`, using kebab-case filenames.
- Use this required shape:
  ```json
  {
    "name": "Provider Name",
    "url": "https://dashboard.example.com/api-keys",
    "category": "Category",
    "domain": "dashboard.example.com"
  }
  ```
- If a provider URL contains any `{placeholder}`, add a matching `variables` array.
- Ensure every placeholder key exactly matches a variable `key`.
- Use short human labels for variables, such as `Organization slug`, `Workspace ID`, or `Account ID`.
- Use realistic placeholder examples without secrets, such as `your-org`, `workspace-id`, or `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.
- Do not add secrets, real tokens, account-specific private values, or personal credentials.

## Scout Collections

- Add AI client records under `catalog/ai-clients/`.
- Keep collection filenames in kebab-case and aligned with each record `slug`.
- Use generic non-secret placeholders such as `/Users/you/project`, `your-org`, or `workspace-id`.
- URL templates with `{placeholder}` values must include matching `variables`.
- Do not add unverified product-specific deep links; use command templates or public URLs when safer.

## Generated Catalog

- Regenerate `providers.json` and `catalog.json` with `npm run build` after provider or catalog changes.
- Do not hand-edit generated JSON except to inspect generated diffs.
- Keep `scripts/build-catalog.mjs` validation strict. Placeholder URLs must fail validation unless matching variables exist.
- Preserve category sorting through `categoryOrder` in `scripts/build-catalog.mjs`.
- Keep `scripts/build-providers.mjs` as a compatibility wrapper unless the legacy command is intentionally removed.

## Web App

- Keep the web app inside `web/`.
- Use `npm run web:build` to verify Astro changes from the repo root.
- Keep generated `web/dist/`, `web/.astro/`, and dependency folders out of git.
- Keep the UI data-driven from generated catalog output; do not duplicate provider or catalog records in the web app.

## GitHub And Deployment

- Use `direnv exec .` for GitHub commands when the Raggle bot account is required.
- The repo `.envrc` sets `GH_CONFIG_DIR` for Raggle bot usage and unsets inherited GitHub token variables.
- Verify identity with `direnv exec . gh api user --jq .login` before committing or pushing as Raggle bot.
- The GitHub Actions deploy workflow uses `secrets.CLOUDFLARE_API_TOKEN`.
- The credentials compatibility API is `https://scout.raggle.co/api.json`.
- The Scout catalog API is `https://scout.raggle.co/catalog.json` and `https://scout.raggle.co/api/v1/catalog.json`.

## Safety

- Do not print or commit tokens, API keys, Cloudflare secrets, GitHub tokens, or private account identifiers.
- Keep edits scoped to the provider, build script, Worker, or web app surface requested.
- Before committing, inspect `git status --short`, `git diff`, and recent commit style.
- Stage explicit paths only. Do not use `git add .`.
