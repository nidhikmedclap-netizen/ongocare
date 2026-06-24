/** Shared logo asset — same as homepage Header.jsx */
export const DEFAULT_LOGO = {
  logoSrc: "/images/ongo-weight-loss-logo.webp",
  logoAlt: "Ongo Weight Loss",
  logoWidth: 220,
  logoHeight: 144,
};

/** PNG logo for transactional email (transparent background, from site webp). */
export const EMAIL_LOGO = {
  logoSrc: "/images/emailtemplateongologo.png",
  logoAlt: "Ongo Weight Loss",
  logoWidth: 220,
  logoHeight: 67,
};

/** Smaller intrinsic size for dashboard mobile header logos. */
export const MOBILE_HEADER_LOGO_SIZE = {
  logoWidth: 148,
  logoHeight: 38,
};

export function mergeLogoBranding(partial) {
  return { ...DEFAULT_LOGO, ...(partial || {}) };
}

/** Build logo props from an org record (tenant portals). */
export function logoBrandingFromOrg(org, href = null) {
  const b = org?.branding || {};
  return {
    logoSrc: b.logoSrc ?? DEFAULT_LOGO.logoSrc,
    logoAlt: b.logoAlt ?? org?.name ?? DEFAULT_LOGO.logoAlt,
    logoWidth: b.logoWidth ?? DEFAULT_LOGO.logoWidth,
    logoHeight: b.logoHeight ?? DEFAULT_LOGO.logoHeight,
    href: href ?? (org?.slug ? `/${org.slug}` : "/"),
  };
}
