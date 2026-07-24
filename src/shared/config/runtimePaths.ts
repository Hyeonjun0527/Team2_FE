const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

export const normalizeBasePath = (value: string | undefined) => {
  const normalized = stripTrailingSlashes(value?.trim() || '');
  if (!normalized || normalized === '/') {
    return '';
  }
  return ensureLeadingSlash(normalized);
};

export const joinRuntimeUrl = (baseUrl: string, path: string) => {
  const normalizedBaseUrl = stripTrailingSlashes(baseUrl);
  const normalizedPath = ensureLeadingSlash(path);
  return `${normalizedBaseUrl}${normalizedPath}`;
};

export const APP_BASE_PATH = normalizeBasePath(import.meta.env.BASE_URL);
export const API_ORIGIN = stripTrailingSlashes(
  import.meta.env.VITE_API_BASE_URL?.trim() || APP_BASE_PATH,
);

export const withAppBasePath = (path: string) => joinRuntimeUrl(APP_BASE_PATH, path);

export const toAbsoluteAppUrl = (path: string, origin = window.location.origin) =>
  new URL(withAppBasePath(path), origin).toString();
