import { reactive } from 'vue';
import { version as faviconVersion } from '~~/public/favicons/version.json';

const cachedFavicons = reactive({ hrefs: {} as Record<string, string> });
const preloadState: { promise?: Promise<void> } = {};

function getFaviconPath(unreadCount: number): string {
  const path = unreadCount > 0 ? `/favicons/unread-${unreadCount > 9 ? 'dot' : unreadCount}` : '/favicon';
  return `${path}.png?v=${faviconVersion}`;
}

export function getFaviconHref(unreadCount: number): string {
  const path = getFaviconPath(unreadCount);
  return cachedFavicons.hrefs[path] || path;
}

export function preloadFavicons(): Promise<void> {
  if (!import.meta.client) return Promise.resolve();

  if (!preloadState.promise) {
    preloadState.promise = Promise.all(Array.from({ length: 11 }, async (_, count) => {
      const path = getFaviconPath(count);

      try {
        const response = await fetch(path, { cache: 'force-cache' });
        if (!response.ok) return;

        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.addEventListener('load', () => resolve(reader.result as string));
          reader.addEventListener('error', () => reject(reader.error));
          reader.readAsDataURL(blob);
        });

        cachedFavicons.hrefs[path] = dataUrl;
      } catch {
        // Keep the normal asset URL as a fallback when preloading fails.
      }
    })).then(() => { /* Expose one completion promise for the preload batch. */ });
  }

  return preloadState.promise;
}
