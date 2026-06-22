import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const credentialsDir = path.join(rootDir, "src");
const applicationsDir = path.join(rootDir, "catalog", "applications");
const providersOutputPath = path.join(rootDir, "providers.json");
const catalogOutputPath = path.join(rootDir, "catalog.json");

const catalogName = "Raggle Scout";
const catalogVersion = 1;

const categoryOrder = [
  "AI/ML",
  "Payments",
  "Fintech",
  "Investing",
  "Commerce",
  "Cloud",
  "Database",
  "DevOps",
  "Email",
  "Auth",
  "Analytics",
  "Storage",
  "E-Signature",
  "Productivity",
  "Government",
  "Media",
];

const credentialUrlKinds = [
  "api-key",
  "oauth-app",
  "access-token",
  "webhook-secret",
  "service-account",
  "dashboard",
  "docs",
];

async function main() {
  const credentials = await readCredentials();
  const applications = await readCollection(applicationsDir, validateApplication);

  const sortedCredentials = credentials.sort(compareCredentials);
  const sortedApplications = applications.sort(compareByName);

  const providers = sortedCredentials.map(({ slug, credentialUrls, ...provider }) => provider);
  const catalog = {
    name: catalogName,
    version: catalogVersion,
    collections: {
      credentials: sortedCredentials,
      applications: sortedApplications,
      dashboards: [],
      docs: [],
      recipes: [],
    },
  };

  await writeFile(providersOutputPath, `${JSON.stringify(providers, null, 2)}\n`);
  await writeFile(catalogOutputPath, `${JSON.stringify(catalog, null, 2)}\n`);

  console.log(
    `Built providers.json and catalog.json from ${sortedCredentials.length} credentials and ${sortedApplications.length} applications`,
  );
}

async function readCredentials() {
  const entries = await readJsonEntries(credentialsDir);
  const credentials = [];
  const seenNames = new Set();
  const seenSlugs = new Set();

  for (const entry of entries) {
    const filePath = path.join(credentialsDir, entry.name);
    const provider = JSON.parse(await readFile(filePath, "utf8"));
    const slug = path.basename(entry.name, ".json");
    const credential = { slug, ...provider };

    validateCredential(credential, filePath);
    assertUnique(credential, filePath, seenNames, seenSlugs);
    credentials.push(credential);
  }

  return credentials;
}

async function readCollection(collectionDir, validateRecord) {
  const entries = await readJsonEntries(collectionDir);
  const records = [];
  const seenNames = new Set();
  const seenSlugs = new Set();

  for (const entry of entries) {
    const filePath = path.join(collectionDir, entry.name);
    const record = JSON.parse(await readFile(filePath, "utf8"));

    validateFilenameSlug(entry.name, record.slug, filePath);
    validateRecord(record, filePath);
    assertUnique(record, filePath, seenNames, seenSlugs);
    records.push(record);
  }

  return records;
}

async function readJsonEntries(dir) {
  let entries;

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      await mkdir(dir, { recursive: true });
      return [];
    }

    throw error;
  }

  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));
}

function validateCredential(credential, filePath) {
  validateFilenameSlug(`${credential.slug}.json`, credential.slug, filePath);

  for (const field of ["name", "slug", "url", "category", "domain"]) {
    assertNonEmptyString(credential[field], `${filePath} must include a non-empty "${field}" string`);
  }

  assertOnlyFields(
    credential,
    ["name", "slug", "url", "category", "domain", "variables", "credentialUrls"],
    filePath,
  );
  validateUrl(credential.url, `${filePath} url`);
  validateHostname(credential.domain, `${filePath} domain`);
  validateVariables(credential.variables, credential.url, filePath);
  validateCredentialUrls(credential.credentialUrls, credential, filePath);
}

function validateCredentialUrls(credentialUrls, credential, filePath) {
  if (credentialUrls === undefined) return;
  if (!Array.isArray(credentialUrls) || credentialUrls.length === 0) {
    throw new Error(`${filePath} credentialUrls must be a non-empty array`);
  }

  let includesPrimaryUrl = false;

  for (const credentialUrl of credentialUrls) {
    assertOnlyFields(
      credentialUrl,
      ["label", "kind", "url", "domain", "variables"],
      `${filePath} credentialUrls`,
    );
    assertNonEmptyString(
      credentialUrl.label,
      `${filePath} credentialUrls entries must include a non-empty label`,
    );
    assertNonEmptyString(
      credentialUrl.kind,
      `${filePath} credentialUrls "${credentialUrl.label}" must include a non-empty kind`,
    );

    if (!credentialUrlKinds.includes(credentialUrl.kind)) {
      throw new Error(
        `${filePath} credentialUrls "${credentialUrl.label}" kind must be one of: ${credentialUrlKinds.join(", ")}`,
      );
    }

    assertNonEmptyString(
      credentialUrl.url,
      `${filePath} credentialUrls "${credentialUrl.label}" must include a non-empty url`,
    );
    assertNonEmptyString(
      credentialUrl.domain,
      `${filePath} credentialUrls "${credentialUrl.label}" must include a non-empty domain`,
    );
    validateUrl(credentialUrl.url, `${filePath} credentialUrls "${credentialUrl.label}" url`);
    validateHostname(
      credentialUrl.domain,
      `${filePath} credentialUrls "${credentialUrl.label}" domain`,
    );
    validateVariables(credentialUrl.variables, credentialUrl.url, filePath);

    if (credentialUrl.url === credential.url) includesPrimaryUrl = true;
  }

  if (!includesPrimaryUrl) {
    throw new Error(`${filePath} credentialUrls must include the primary url`);
  }
}

function validateApplication(application, filePath) {
  for (const field of ["name", "slug", "category", "homepage"]) {
    assertNonEmptyString(application[field], `${filePath} must include a non-empty "${field}" string`);
  }

  assertOnlyFields(
    application,
    [
      "name",
      "slug",
      "category",
      "homepage",
      "platforms",
      "appNames",
      "bundleId",
      "capabilities",
      "deeplinks",
      "launchers",
      "docs",
    ],
    filePath,
  );
  if (application.category !== "Application") {
    throw new Error(`${filePath} category must be "Application"`);
  }
  validateSlug(application.slug, `${filePath} slug`);
  validateUrl(application.homepage, `${filePath} homepage`);
  validateStringArray(application.platforms, `${filePath} platforms`);
  if (application.appNames !== undefined) validateStringArray(application.appNames, `${filePath} appNames`);
  if (application.bundleId !== undefined) {
    assertNonEmptyString(application.bundleId, `${filePath} bundleId must be a non-empty string`);
  }
  validateCapabilities(application.capabilities, filePath);
  validateLinks(application.docs, `${filePath} docs`);
  validateDeeplinks(application.deeplinks, filePath);
  validateLaunchers(application.launchers, filePath);
}

function validateCapabilities(capabilities, filePath) {
  if (capabilities === undefined) return;
  assertOnlyFields(
    capabilities,
    ["opensProjectFolder", "canResumeProjectSession", "canStartNewProjectSession"],
    `${filePath} capabilities`,
  );

  for (const field of ["opensProjectFolder", "canResumeProjectSession", "canStartNewProjectSession"]) {
    if (typeof capabilities[field] !== "boolean") {
      throw new Error(`${filePath} capabilities.${field} must be a boolean`);
    }
  }
}

function validateLinks(links, label) {
  if (links === undefined) return;
  if (!Array.isArray(links)) throw new Error(`${label} must be an array`);

  for (const link of links) {
    assertOnlyFields(link, ["label", "url"], label);
    assertNonEmptyString(link.label, `${label} entries must include a non-empty label`);
    assertNonEmptyString(link.url, `${label} entries must include a non-empty url`);
    validateUrl(link.url, `${label} ${link.label} url`);
  }
}

function validateLaunchers(launchers, filePath) {
  if (launchers === undefined) return;
  if (!Array.isArray(launchers)) throw new Error(`${filePath} launchers must be an array`);

  for (const launcher of launchers) {
    assertOnlyFields(launcher, ["id", "label", "kind", "intent", "urlTemplate", "variables"], filePath);
    if (launcher.id !== undefined) validateSlug(launcher.id, `${filePath} launcher id`);
    assertNonEmptyString(launcher.label, `${filePath} launchers must include a non-empty label`);
    assertNonEmptyString(launcher.kind, `${filePath} launcher "${launcher.label}" must include a kind`);

    if (!["command", "web"].includes(launcher.kind)) {
      throw new Error(
        `${filePath} launcher "${launcher.label}" kind must be command or web`,
      );
    }

    if (launcher.intent !== undefined) {
      const validIntents = ["open-project", "open-folder", "new-session", "resume-session", "settings", "fallback"];
      if (!validIntents.includes(launcher.intent)) {
        throw new Error(`${filePath} launcher "${launcher.label}" has invalid intent`);
      }
    }

    assertNonEmptyString(
      launcher.urlTemplate,
      `${filePath} launcher "${launcher.label}" must include a urlTemplate`,
    );

    if (launcher.kind === "web") validateUrl(launcher.urlTemplate, `${filePath} launcher urlTemplate`);
    validateVariables(launcher.variables, launcher.urlTemplate, filePath);
  }
}

function validateDeeplinks(deeplinks, filePath) {
  if (deeplinks === undefined) return;
  if (!Array.isArray(deeplinks)) throw new Error(`${filePath} deeplinks must be an array`);

  for (const deeplink of deeplinks) {
    assertOnlyFields(deeplink, ["id", "label", "intent", "urlTemplate", "variables"], filePath);
    if (deeplink.id !== undefined) validateSlug(deeplink.id, `${filePath} deeplink id`);
    assertNonEmptyString(deeplink.label, `${filePath} deeplinks must include a non-empty label`);

    if (deeplink.intent !== undefined) {
      const validIntents = ["open-project", "open-folder", "new-session", "resume-session", "settings", "fallback"];
      if (!validIntents.includes(deeplink.intent)) {
        throw new Error(`${filePath} deeplink "${deeplink.label}" has invalid intent`);
      }
    }

    assertNonEmptyString(
      deeplink.urlTemplate,
      `${filePath} deeplink "${deeplink.label}" must include a urlTemplate`,
    );
    validateDeepLink(deeplink.urlTemplate, filePath);
    validateVariables(deeplink.variables, deeplink.urlTemplate, filePath);
  }
}

function validateVariables(variables, template, filePath) {
  const placeholders = new Set(
    [...template.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]),
  );

  if (variables === undefined) {
    if (placeholders.size > 0) {
      throw new Error(`${filePath} template placeholders must have matching variables`);
    }
    return;
  }

  if (!Array.isArray(variables)) throw new Error(`${filePath} variables must be an array`);

  const variableKeys = new Set();

  for (const variable of variables) {
    assertOnlyFields(variable, ["key", "label", "placeholder", "format", "encoding"], filePath);
    assertNonEmptyString(variable.key, `${filePath} variables must include non-empty key strings`);
    assertNonEmptyString(
      variable.label,
      `${filePath} variable "${variable.key}" must include a non-empty label string`,
    );

    if (variable.placeholder !== undefined && typeof variable.placeholder !== "string") {
      throw new Error(`${filePath} variable "${variable.key}" placeholder must be a string`);
    }

    if (isPersonalPath(variable.placeholder)) {
      throw new Error(`${filePath} variable "${variable.key}" placeholder must not be a personal path`);
    }

    if (
      variable.format !== undefined &&
      !["absolute-path", "uuid", "slug", "string"].includes(variable.format)
    ) {
      throw new Error(`${filePath} variable "${variable.key}" format is invalid`);
    }

    if (
      variable.encoding !== undefined &&
      !["none", "url-component"].includes(variable.encoding)
    ) {
      throw new Error(`${filePath} variable "${variable.key}" encoding is invalid`);
    }

    variableKeys.add(variable.key);
  }

  for (const placeholder of placeholders) {
    if (!variableKeys.has(placeholder)) {
      throw new Error(`${filePath} template placeholder "{${placeholder}}" must have a matching variable`);
    }
  }
}

function validateStringArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must be a non-empty array`);
  }

  for (const item of value) {
    assertNonEmptyString(item, `${label} entries must be non-empty strings`);
  }
}

function validateFilenameSlug(fileName, slug, filePath) {
  const expectedFileName = `${slug}.json`;
  validateSlug(slug, `${filePath} slug`);

  if (fileName !== expectedFileName) {
    throw new Error(`${filePath} filename must match slug "${expectedFileName}"`);
  }
}

function validateSlug(value, label) {
  assertNonEmptyString(value, `${label} must be a non-empty string`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`${label} must be kebab-case`);
  }
}

function validateUrl(value, label) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("URL must use http or https");
    }
  } catch {
    throw new Error(`${label} must be a valid http(s) URL`);
  }
}

function validateDeepLink(value, filePath) {
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    throw new Error(`${filePath} deep-link launcher must include a URL scheme`);
  }
}

function validateHostname(value, label) {
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)) {
    throw new Error(`${label} must be a hostname`);
  }
}

function assertOnlyFields(record, fields, label) {
  const allowedFields = new Set(fields);

  for (const field of Object.keys(record)) {
    if (!allowedFields.has(field)) {
      throw new Error(`${label} includes unknown field "${field}"`);
    }
  }
}

function assertNonEmptyString(value, message) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }
}

function assertUnique(record, filePath, seenNames, seenSlugs) {
  const normalizedName = record.name.toLowerCase();

  if (seenNames.has(normalizedName)) {
    throw new Error(`Duplicate name "${record.name}" in ${filePath}`);
  }

  if (seenSlugs.has(record.slug)) {
    throw new Error(`Duplicate slug "${record.slug}" in ${filePath}`);
  }

  seenNames.add(normalizedName);
  seenSlugs.add(record.slug);
}

function isPersonalPath(value) {
  return typeof value === "string" && /^\/Users\/(?!you(?:\/|$))[^/]+/i.test(value);
}

function compareCredentials(a, b) {
  const categoryComparison =
    categoryRank(a.category) - categoryRank(b.category);

  if (categoryComparison !== 0) return categoryComparison;

  return compareByName(a, b);
}

function compareByName(a, b) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function categoryRank(category) {
  const index = categoryOrder.indexOf(category);
  return index === -1 ? categoryOrder.length : index;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
