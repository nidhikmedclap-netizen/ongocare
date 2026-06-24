/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Separate cache dirs so `dev:marketing` + `dev:dashboard` can run together locally.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // Firebase Admin + GCS must stay external — bundling google-auth-library breaks
  // OAuth token fetch (https://www.googleapis.com/oauth2/v4/token: Premature close).
  experimental: {
    serverComponentsExternalPackages: [
      "firebase-admin",
      "google-auth-library",
      "@google-cloud/storage",
      "gaxios",
      "gtoken",
      "gcp-metadata",
      "teeny-request",
    ],
  },

  async headers() {
    const securityHeaders = [
      {
        key: "X-Robots-Tag",
        value: "noindex, nofollow, noarchive, nosnippet",
      },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];
    const onboardCameraHeaders = [
      ...securityHeaders.filter((h) => h.key !== "Permissions-Policy"),
      {
        key: "Permissions-Policy",
        value: "camera=(self), microphone=(), geolocation=()",
      },
    ];
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/weightloss-onboard/:path*",
        headers: onboardCameraHeaders,
      },
      {
        source: "/:organization/weightloss-onboard/:path*",
        headers: onboardCameraHeaders,
      },
    ];
  },

  // The doctor registration page moved under /doctor/* so patients never
  // see clinician-facing URLs on the public site. Keep the old URL alive
  // for any bookmarks or stale links.
  async redirects() {
    return [
      {
        source: "/doctor-onboard",
        destination: "/doctor/doctor-onboard",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
