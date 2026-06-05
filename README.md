# Raggle Scout

Raggle Scout is a public, structured knowledge catalog for developer tools and
AI workflows. It includes credential-link records alongside AI clients,
launchers, dashboards, docs, and setup recipes.

## Build

```bash
npm run build
```

This generates:

- `providers.json` from `src/*.json` for the legacy credentials API.
- `catalog.json` from `src/*.json` and `catalog/**/*.json` for the Scout API.

## Public JSON

The Cloudflare Worker serves the credentials compatibility endpoint at:

```text
https://scout.raggle.co/api.json
```

It also serves the broader Scout catalog at:

```text
https://scout.raggle.co/
https://scout.raggle.co/catalog.json
https://scout.raggle.co/api/v1/catalog.json
```

Deploy with:

```bash
npm run deploy
```

The GitHub Actions deploy workflow expects a `CLOUDFLARE_API_TOKEN` repository
secret with Workers deploy permissions. DNS for `scout.raggle.co` must exist in
Cloudflare and be proxied to the Worker custom domain.

## Adding Credential Links

Create a credential file:

```text
src/provider-name.json
```

```json
{
  "name": "Provider Name",
  "url": "https://dashboard.url/api-keys",
  "category": "Category",
  "domain": "dashboard.url"
}
```

The filename becomes the credential `slug` in `catalog.json`.

## Adding AI Clients

Create an AI client file:

```text
catalog/ai-clients/client-name.json
```

```json
{
  "name": "Client Name",
  "slug": "client-name",
  "category": "AI Client",
  "homepage": "https://client.example",
  "platforms": ["macOS", "Windows", "Linux"],
  "launchers": [
    {
      "label": "Open project",
      "kind": "command",
      "urlTemplate": "client {projectPath}",
      "variables": [
        {
          "key": "projectPath",
          "label": "Project folder",
          "placeholder": "/Users/you/project"
        }
      ]
    }
  ],
  "docs": [
    {
      "label": "Documentation",
      "url": "https://client.example/docs"
    }
  ]
}
```

Validation checks stable names and slugs, kebab-case filenames, duplicate names
or slugs within a collection, URL/template placeholder variables, generic
non-secret placeholders, and unknown fields.

AI client records can also include `capabilities`, `appNames`, `bundleId`,
`deeplinks`, and launcher `intent` metadata. Consumers such as Raycast should
read URL-scheme templates from `deeplinks` directly, use `launchers` for command
or web fallbacks, and encode variables according to each variable's `encoding`
value before replacing placeholders in `urlTemplate`.
