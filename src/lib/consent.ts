export const CONSENT_VERSION = "v1";
export const CONSENT_STORAGE_KEY = "atlas-cookie-consent";
export const CONSENT_COOKIE_NAME = "atlas_consent_version";

export type CookieConsent = {
  version: typeof CONSENT_VERSION;
  decidedAt: string;
  expiresAt: string;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  doNotSellOrShare?: boolean;
};

export function consentLevel(consent: Pick<CookieConsent, "analytics" | "functional"> | null) {
  if (!consent) return "none" as const;
  if (consent.analytics) return "analytics" as const;
  if (consent.functional) return "functional" as const;
  return "none" as const;
}

export function buildConsent(input: {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  doNotSellOrShare?: boolean;
}): CookieConsent {
  const now = new Date();
  const expires = new Date(now);
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  return {
    version: CONSENT_VERSION,
    decidedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    functional: input.functional,
    analytics: input.analytics,
    marketing: input.marketing,
    doNotSellOrShare: input.doNotSellOrShare ?? false,
  };
}

export function isConsentExpired(consent: CookieConsent | null) {
  if (!consent || consent.version !== CONSENT_VERSION) return true;
  return new Date(consent.expiresAt).getTime() <= Date.now();
}
