# Scout

Scout is an open-source directory of where developers go to create API keys,
OAuth apps, access tokens, webhook secrets, service accounts, and other setup
credentials.

The useful work in this repo is the data. If you know where a provider keeps
its API key page, OAuth app console, webhook signing secret, or service account
setup flow, add or improve that provider record. You do not need to run a web
app or understand the deployment path to contribute.

## What To Add

Add links that help someone get from "I need credentials for this provider" to
the correct settings page quickly:

- API key pages
- OAuth app registration pages
- Personal access token pages
- Webhook secret or signing-key pages
- Service account setup pages
- Developer dashboard pages
- Official docs when a direct dashboard URL is not stable

Use public, generic URLs. Do not add real API keys, tokens, account IDs,
private workspace names, personal credentials, or customer-specific links.

## Provider Records

Credential provider records live in `src/*.json`. Add one provider per file,
using a kebab-case filename:

```text
src/provider-name.json
```

Use this basic shape:

```json
{
  "name": "Provider Name",
  "url": "https://dashboard.example.com/api-keys",
  "category": "Category",
  "domain": "dashboard.example.com"
}
```

The filename becomes the provider `slug` in `catalog.json`.

If the provider has more than one useful credential surface, keep `url` pointed
at the best default and add `credentialUrls`:

```json
{
  "name": "Provider Name",
  "url": "https://dashboard.example.com/oauth/apps",
  "category": "Category",
  "domain": "dashboard.example.com",
  "credentialUrls": [
    {
      "label": "OAuth apps",
      "kind": "oauth-app",
      "url": "https://dashboard.example.com/oauth/apps",
      "domain": "dashboard.example.com"
    },
    {
      "label": "API keys",
      "kind": "api-key",
      "url": "https://dashboard.example.com/api-keys",
      "domain": "dashboard.example.com"
    }
  ]
}
```

Supported `credentialUrls.kind` values include:

- `api-key`
- `oauth-app`
- `access-token`
- `webhook-secret`
- `service-account`
- `dashboard`
- `docs`

## Placeholders

If a URL needs a variable part, use a clear placeholder and add a matching
`variables` entry:

```json
{
  "name": "Provider Name",
  "url": "https://dashboard.example.com/{workspaceSlug}/api-keys",
  "category": "Category",
  "domain": "dashboard.example.com",
  "variables": [
    {
      "key": "workspaceSlug",
      "label": "Workspace slug",
      "placeholder": "your-workspace"
    }
  ]
}
```

Placeholder keys must match exactly. Use examples such as `your-org`,
`workspace-id`, or `project-id`, not real private values.

## Validate Changes

After adding or changing provider data, run:

```bash
npm run build
```

This validates the source records and regenerates:

- `providers.json`, the legacy compatibility list of provider credential URLs.
- `catalog.json`, the richer Scout catalog with slugs and credential URL
  variants.

Check the generated diff before opening a pull request.

## Public JSON

The data is published as JSON:

```bash
curl https://scout.raggle.co/
curl https://scout.raggle.co/catalog.json
curl https://scout.raggle.co/api/v1/catalog.json
```

The legacy provider-list endpoint is:

```bash
curl https://scout.raggle.co/api.json
```

## AI Client Records

Scout can also track AI-client launchers in `catalog/ai-clients/*.json`, but
provider credential data is the primary contribution path. Add AI-client records
only when you are capturing a stable launcher, deep link, documentation URL, or
setup flow.

## Pull Requests

1. Add or update the source JSON record.
2. Run `npm run build`.
3. Include the source record and generated JSON changes.
4. Open a pull request describing which provider credential or setup surface you
   added.

Do not include secrets, private tokens, personal account identifiers, or
customer-specific URLs.
