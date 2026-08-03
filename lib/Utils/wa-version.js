import { Boom } from '@hapi/boom';
import { fetchLatestWaWebVersion } from './generics.js';
export const WA_WEB_VERSION_CACHE_MS = 60 * 60 * 1000;
const CHECK_UPDATE_URL = 'https://web.whatsapp.com/check-update?version=1&platform=web';
const DEFAULT_HEADERS = {
    'sec-fetch-site': 'none',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
};
let cached;
let pending;
const parseWaVersion = (raw) => {
    const parts = raw?.trim().split('.').map(Number);
    if (parts?.length !== 3 || parts.some(part => !Number.isInteger(part) || part < 0)) {
        return undefined;
    }
    return parts;
};
export const fetchWaWebVersionFromCheckUpdate = async (options = {}) => {
    const response = await fetch(CHECK_UPDATE_URL, {
        ...options,
        method: 'GET',
        headers: { ...DEFAULT_HEADERS, ...options.headers }
    });
    if (!response.ok) {
        throw new Boom(`Failed to fetch check-update: ${response.statusText}`, { statusCode: response.status });
    }
    const body = (await response.json());
    const version = parseWaVersion(body?.currentVersion);
    if (!version) {
        throw new Boom('Could not find the current version in the check-update response', { statusCode: 500 });
    }
    return version;
};
const fetchLiveWaWebVersion = async ({ logger, options, timeoutMs }) => {
    const controller = new AbortController();
    const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
    const fetchOptions = { ...options, signal: controller.signal };
    try {
        const result = await fetchLatestWaWebVersion(fetchOptions);
        if (result.isLatest) {
            return result.version;
        }
        logger?.warn({ err: result.error }, 'could not read the WA Web version off sw.js, falling back to check-update');
        return await fetchWaWebVersionFromCheckUpdate(fetchOptions);
    }
    catch (err) {
        logger?.warn({ err }, 'could not fetch the live WA Web version, keeping the configured one');
        return undefined;
    }
    finally {
        clearTimeout(timer);
    }
};
export const resolveWaWebVersion = async ({ logger, options, timeoutMs = 10000, cacheMs = WA_WEB_VERSION_CACHE_MS, force = false } = {}) => {
    if (!force && cached && cached.expiresAt > Date.now()) {
        return cached.version;
    }
    if (!pending) {
        pending = fetchLiveWaWebVersion({ logger, options, timeoutMs })
            .then(version => {
            if (version) {
                cached = { version, expiresAt: Date.now() + cacheMs };
            }
            return version;
        })
            .finally(() => {
            pending = undefined;
        });
    }
    return pending;
};
export const getCachedWaWebVersion = () => cached?.version;
export const clearWaWebVersionCache = () => {
    cached = undefined;
};
//# sourceMappingURL=wa-version.js.map