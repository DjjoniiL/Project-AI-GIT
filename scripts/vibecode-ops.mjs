/* global console, fetch, process */
import { existsSync, readFileSync } from 'node:fs';

const DEFAULT_API_BASE_URL = 'https://vibecode.bitrix24.tech';
const DEFAULT_EXPECTED_PORTAL = 'vibecode01.bitrix24.ru';
const DEFAULT_APP_URL = 'https://app-5670766a17c1.vibecode.bitrix24.tech';
const DEFAULT_SERVER_ID = 'e95ca529-f434-4432-bbb8-a7e0e8f85837';

const FIELD_DEFINITIONS = [
  { key: 'productType', fieldName: 'PRODUCT_TYPE', userTypeId: 'string', label: 'Тип изделия' },
  { key: 'fabric', fieldName: 'FABRIC', userTypeId: 'string', label: 'Ткань' },
  { key: 'care', fieldName: 'CARE', userTypeId: 'string', label: 'Уход за материалом' },
  { key: 'printMethod', fieldName: 'PRINT_METHOD', userTypeId: 'string', label: 'Способ нанесения принта' },
  { key: 'bodyColor', fieldName: 'BODY_COLOR', userTypeId: 'string', label: 'Основной цвет' },
  { key: 'trimColor', fieldName: 'TRIM_COLOR', userTypeId: 'string', label: 'Цвет отделки' },
  { key: 'sizes', fieldName: 'SIZES_JSON', userTypeId: 'string', label: 'Размеры и количество' },
  { key: 'options', fieldName: 'OPTIONS', userTypeId: 'string', label: 'Дополнительные опции' },
  { key: 'printZone', fieldName: 'PRINT_ZONE', userTypeId: 'string', label: 'Зона размещения принта' },
  { key: 'comment', fieldName: 'COMMENT', userTypeId: 'string', label: 'Комментарий' },
  { key: 'designFileId', fieldName: 'DESIGN_FILE_ID', userTypeId: 'file', label: 'Файл макета' },
];

function readDotEnv() {
  if (!existsSync('.env')) return {};

  const env = {};
  const lines = readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    env[key] = rawValue.replace(/^"|"$/g, '');
  }
  return env;
}

const env = { ...readDotEnv(), ...process.env };

function getConfig() {
  return {
    apiBaseUrl: env.VIBE_API_BASE_URL || DEFAULT_API_BASE_URL,
    appKey: env.VIBE_APP_KEY || '',
    personalApiKey: env.VIBE_PERSONAL_API_KEY || env.VIBE_API_KEY || '',
    expectedPortal: env.VIBE_EXPECTED_PORTAL || DEFAULT_EXPECTED_PORTAL,
    appUrl: env.VIBE_APP_URL || DEFAULT_APP_URL,
    serverId: env.VIBE_SERVER_ID || DEFAULT_SERVER_ID,
  };
}

class ApiError extends Error {
  constructor(status, code, message, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function request({ method = 'GET', path, apiKey, authorization, body }) {
  const headers = {};
  if (apiKey) headers['X-Api-Key'] = apiKey;
  if (authorization) headers.Authorization = authorization;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${getConfig().apiBaseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok || payload.success === false) {
    const error = payload.error ?? {};
    throw new ApiError(
      response.status,
      error.code ?? 'VIBECODE_REQUEST_FAILED',
      error.message ?? 'VibeCode request failed',
      payload,
    );
  }

  return payload.data;
}

async function checkApiKey({ apiKey, label, requireApp = false }) {
  const config = getConfig();
  if (!apiKey) {
    throw new Error(`${label} is required`);
  }

  const me = await request({ path: '/v1/me', apiKey });
  const portal = String(me.portal ?? '');
  if (portal !== config.expectedPortal) {
    throw new Error(
      `${label} belongs to ${portal}, expected ${config.expectedPortal}. Refusing to change portal data.`,
    );
  }
  if (requireApp && me.type !== 'oauth_app') {
    throw new Error(`${label} must be an OAuth app key for this operation, got ${me.type}`);
  }

  console.log(`${label} OK: portal=${portal}, type=${me.type}, scopes=${(me.scopes ?? []).join(',')}`);
  return me;
}

async function checkAppKey() {
  return checkApiKey({ apiKey: getConfig().appKey, label: 'VIBE_APP_KEY', requireApp: true });
}

function normalizeUserfieldCode(field) {
  const candidates = [
    field.code,
    field.fieldName,
    field.field_name,
    field.FIELD_NAME,
    field.name,
    field.id,
  ].filter(Boolean);

  return candidates.map(String).find((value) => value.startsWith('UF_CRM_'));
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.fields)) return data.fields;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

function normalizeAvailablePlacements(data) {
  const direct = asArray(data);
  if (direct.length > 0) return direct;

  const groups = data?.groups;
  if (!groups || typeof groups !== 'object') return [];
  return Object.values(groups).flatMap((items) => (Array.isArray(items) ? items : []));
}

async function ensureUserFields() {
  const config = getConfig();
  const apiKey = config.personalApiKey || config.appKey;
  await checkApiKey({ apiKey, label: config.personalApiKey ? 'VIBE_PERSONAL_API_KEY' : 'VIBE_APP_KEY' });

  let existingFields = [];
  try {
    existingFields = asArray(await request({ path: '/v1/userfields/deals', apiKey }));
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Cannot read deal UF fields: ${error.status} ${error.code} ${error.message}`);
    }
    throw error;
  }

  const existingCodes = new Set(existingFields.map(normalizeUserfieldCode).filter(Boolean));
  for (const field of FIELD_DEFINITIONS) {
    const expectedCode = `UF_CRM_${field.fieldName}`;
    if (existingCodes.has(expectedCode)) {
      console.log(`UF exists: ${expectedCode}`);
      continue;
    }

    await request({
      method: 'POST',
      path: '/v1/userfields/deals',
      apiKey,
      body: {
        userTypeId: field.userTypeId,
        fieldName: field.fieldName,
        label: field.label,
      },
    });
    console.log(`UF created: ${expectedCode}`);
  }
}

async function bindPlacement() {
  const config = getConfig();
  await checkAppKey();

  const available = normalizeAvailablePlacements(
    await request({ path: '/v1/placements/available', apiKey: config.personalApiKey || config.appKey }),
  );
  const hasDealTab = available.some((item) => {
    if (typeof item === 'string') return item === 'CRM_DEAL_DETAIL_TAB';
    return Object.values(item ?? {}).map(String).includes('CRM_DEAL_DETAIL_TAB');
  });
  if (!hasDealTab) {
    throw new Error('CRM_DEAL_DETAIL_TAB is not present in /v1/placements/available');
  }

  await request({
    method: 'POST',
    path: '/v1/placements/bind',
    apiKey: config.appKey,
    body: {
      placement: 'CRM_DEAL_DETAIL_TAB',
      handler: config.appUrl,
      title: 'Конструктор одежды',
    },
  });
  console.log(`Placement bound: CRM_DEAL_DETAIL_TAB -> ${config.appUrl}`);
}

async function checkServer() {
  const config = getConfig();
  if (!config.personalApiKey) {
    const response = await fetch(`${config.appUrl}/api/health`);
    const text = await response.text();
    console.log(`Public health probe: status=${response.status}, body=${text.slice(0, 240)}`);
    console.log('Set VIBE_PERSONAL_API_KEY to mint an owner-only access token and run full health probes.');
    return;
  }

  const tokenData = await request({
    method: 'POST',
    path: `/v1/infra/servers/${config.serverId}/access-tokens`,
    apiKey: config.personalApiKey,
    body: { mode: 'api-bearer' },
  });
  const token = tokenData.token ?? tokenData.accessToken ?? tokenData.jwt ?? tokenData.value;
  if (!token) {
    throw new Error('Access token response did not contain a token field');
  }

  const health = await fetch(`${config.appUrl}/api/health`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`Authorized health: status=${health.status}, body=${await health.text()}`);

  const root = await fetch(`${config.appUrl}/?placement=CRM_DEAL_DETAIL_TAB&placement_options=%7B%22ID%22%3A%2242%22%7D`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`Authorized SPA probe: status=${root.status}, contentType=${root.headers.get('content-type')}`);
}

async function main() {
  const command = process.argv[2];
  if (!command || !['check-server', 'ensure-fields', 'bind-placement', 'setup-portal'].includes(command)) {
    console.log('Usage: node scripts/vibecode-ops.mjs <check-server|ensure-fields|bind-placement|setup-portal>');
    process.exitCode = 1;
    return;
  }

  if (command === 'check-server') await checkServer();
  if (command === 'ensure-fields') await ensureUserFields();
  if (command === 'bind-placement') await bindPlacement();
  if (command === 'setup-portal') {
    await ensureUserFields();
    await bindPlacement();
  }
}

main().catch((error) => {
  const prefix = error instanceof ApiError ? `${error.status} ${error.code}: ` : '';
  console.error(`${prefix}${error.message}`);
  process.exitCode = 1;
});
