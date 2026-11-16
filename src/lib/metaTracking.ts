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


type UmamiWindow = Window & {
  umami?: {
    track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void;
  };
};

/**
 * Fire a privacy-safe Umami event when the tracker is available.
 * Never pass PII (email, name, phone, message) in event data.
 */
export function trackUmamiEvent(
  eventName: string,
  eventData: Record<string, string | number | boolean> = {},
): void {
  if (typeof window === 'undefined') return;
  const w = window as UmamiWindow;
  w.umami?.track(eventName, eventData);
}
