import { getRandomString } from '~/tools/util';

const ACTIVE_TAB_KEY = 'everhoof:active-chat-tab';

// Some browser hosts report multiple tabs as focused. Share only an activity token
// so a message received in another chat tab cannot be mistaken for a read message.
export function trackTabActivity(onActivate: () => void) {
  const tabId = getRandomString(32);

  function isActive(): boolean {
    try {
      return localStorage.getItem(ACTIVE_TAB_KEY) === tabId;
    } catch {
      // Browsers that block storage can still use native focus and visibility.
      return true;
    }
  }

  function activate() {
    if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
    try {
      if (!isActive()) localStorage.setItem(ACTIVE_TAB_KEY, tabId);
    } catch {
      // Native focus and visibility remain available when storage is blocked.
    }
    onActivate();
  }

  function onInteraction(event: Event) {
    if (event.isTrusted) activate();
  }

  function release() {
    try {
      if (isActive()) localStorage.removeItem(ACTIVE_TAB_KEY);
    } catch {}
  }

  document.addEventListener('pointerdown', onInteraction, { capture: true });
  document.addEventListener('keydown', onInteraction, { capture: true });
  document.addEventListener('visibilitychange', activate);
  window.addEventListener('focus', activate);
  window.addEventListener('pageshow', activate);
  window.addEventListener('pagehide', release);
  activate();

  function dispose() {
    document.removeEventListener('pointerdown', onInteraction, true);
    document.removeEventListener('keydown', onInteraction, true);
    document.removeEventListener('visibilitychange', activate);
    window.removeEventListener('focus', activate);
    window.removeEventListener('pageshow', activate);
    window.removeEventListener('pagehide', release);
    release();
  }

  return { isActive, dispose };
}
