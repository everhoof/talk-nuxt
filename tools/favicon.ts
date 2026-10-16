import Vue from 'vue';
import { version as faviconVersion } from '~/static/favicons/version.json';

const cachedFavicons = Vue.observable({ hrefs: {} as Record<string, string> });
let preloadPromise: Promise<void> | undefined;

function getFaviconPath(unreadCount: number): string {
  const path = unreadCount > 0 ? `/favicons/unread-${unreadCount > 9 ? 'dot' : unreadCount}` : '/favicon';
  return `${path}.png?v=${faviconVersion}`;
}

export function getFaviconHref(unreadCount: number): string {
  const path = getFaviconPath(unreadCount);
  return cachedFavicons.hrefs[path] || path;
}

export function preloadFavicons(): Promise<void> {
  if (!process.client) return Promise.resolve();

  if (!preloadPromise) {
    preloadPromise = Promise.all(
      Array.from({ length: 11 }, async (_, count) => {
        const path = getFaviconPath(count);

        try {
          const response = await fetch(path, { cache: 'force-cache' });
          if (!response.ok) return;

          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });

          Vue.set(cachedFavicons.hrefs, path, dataUrl);
        } catch {
          // Keep the normal asset URL as a fallback when preloading fails.
        }
      }),
    ).then(() => undefined);
  }

  return preloadPromise;
}
