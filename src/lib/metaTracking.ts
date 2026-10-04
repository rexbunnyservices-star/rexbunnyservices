type MetaEventParams = Record<string, string | number | boolean | undefined>;

type MetaWindow = Window & {
  fbq?: (command: string, eventName: string, params?: MetaEventParams) => void;
};

/**
 * Fire a browser-only Meta Pixel event when the pixel is available.
 * This intentionally does not send form contents or personal data.
 */
export function trackMetaEvent(eventName: string, params: MetaEventParams = {}): void {
  if (typeof window === 'undefined') return;
  const metaWindow = window as MetaWindow;
  metaWindow.fbq?.('track', eventName, params);
}
