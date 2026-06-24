// app/dashboard/patient/PatientSidebar.jsx
//
// Sidebar that is:
//   - sticky left rail on ≥1024px
//   - hidden behind a hamburger on <1024px, slides in as an overlay drawer
//     when toggled. Auto-closes on route change so navigating to a new
//     section doesn't leave the drawer parked open.
//
// Body scroll is locked while the drawer is open to prevent the underlying
// page from scrolling under the user's finger on mobile.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { confirmSignOut } from "@/lib/auth/signOut";
import { marketingLoginPathForDashboard } from "@/lib/urls/dashboardPaths";
import { DEFAULT_LOGO, MOBILE_HEADER_LOGO_SIZE } from "@/lib/branding/defaults";
import BrandLogo from "@/components/BrandLogo";
import styles from "./dashboard.module.css";

// See AdminSidebar for the `basePath` + `branding` rationale.
const NAV_DEFS = [
  { sub: "", label: "Overview", icon: HomeIcon, exact: true },
  { sub: "/profile", label: "My details", icon: UserIcon },
  { sub: "/health", label: "Health profile", icon: HeartIcon },
  { sub: "/appointments", label: "Appointments", icon: CalendarIcon },
  { sub: "/plan", label: "Plan & billing", icon: CardIcon },
  { sub: "/documents", label: "Documents", icon: DocIcon },
  { sub: "/about", label: "About us", icon: InfoIcon },
];

const DEFAULT_BRANDING = DEFAULT_LOGO;

export default function PatientSidebar({
  profile,
  user,
  basePath = "",
  branding = DEFAULT_BRANDING,
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const dashHome = `${basePath}/dashboard/patient`;
  const NAV = NAV_DEFS.map((n) => ({ ...n, href: `${dashHome}${n.sub}` }));
  const b = { ...DEFAULT_BRANDING, ...branding };

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Patient";
  const displayEmail = profile?.email || user?.email || "";
  const initial = (
    profile?.firstName?.[0] ||
    profile?.email?.[0] ||
    user?.email?.[0] ||
    "P"
  ).toUpperCase();
  const activeLabel =
    NAV.find((n) =>
      n.exact ? pathname === n.href : pathname.startsWith(n.href),
    )?.label || "Dashboard";

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

  // Close drawer on Escape for keyboard users.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const handleSignOut = () => {
    confirmSignOut({
      loginPath: marketingLoginPathForDashboard(pathname),
    });
  };

  const sidebarMarkup = (
    <aside
      className={`${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ""}`}
      aria-label="Patient navigation"
    >
      {/* Close button only visible on mobile (CSS-gated). Lets the user
          dismiss the drawer without tapping the backdrop, and gives a clear
          affordance that this is a dismissible overlay. */}
      <button
        type="button"
        className={styles.drawerCloseBtn}
        onClick={() => setDrawerOpen(false)}
        aria-label="Close menu"
      >
        <CloseIcon />
      </button>

      <Link
        href={dashHome}
        className={styles.brand}
        onClick={() => setDrawerOpen(false)}
      >
        <BrandLogo
          branding={b}
          className={styles.brandLogo}
          imageClassName={styles.brandLogoImg}
        />
      </Link>

      <nav className={styles.navList}>
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
              onClick={() => setDrawerOpen(false)}
            >
              <span className={styles.navIcon}><Icon /></span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.userFooter}>
        <div className={styles.avatar} aria-hidden>{initial}</div>
        <div className={styles.userMeta}>
          <div className={styles.userName}>{displayName}</div>
          {displayEmail && (
            <div className={styles.userEmail}>{displayEmail}</div>
          )}
        </div>
        <button
          type="button"
          className={styles.signOutBtn}
          onClick={handleSignOut}
          aria-label="Sign out"
          title="Sign out"
        >
          <SignOutIcon />
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile topbar */}
      <div className={styles.mobileBar}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
        >
          <MenuIcon />
          <span className={styles.mobileBarLabel}>{activeLabel}</span>
        </button>
        <Link href={dashHome} className={styles.mobileBrandLink}>
          <BrandLogo
            branding={b}
            width={MOBILE_HEADER_LOGO_SIZE.logoWidth}
            height={MOBILE_HEADER_LOGO_SIZE.logoHeight}
            className={styles.brandLogoCompact}
            imageClassName={styles.brandLogoImg}
          />
        </Link>
      </div>

      {/* Backdrop for mobile drawer */}
      {drawerOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      {sidebarMarkup}
    </>
  );
}

/* ── Icons ───────────────────────────────────────────────────────────── */
function iconProps(size = 18) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

function HomeIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M3 12l9-9 9 9" />
      <path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <line x1="3" y1="11" x2="21" y2="11" />
      <line x1="7" y1="15" x2="11" y2="15" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg {...iconProps(20)}>
      <line x1="4" y1="7"  x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg {...iconProps(16)}>
      <path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4" />
      <path d="M10 17l-5-5 5-5" />
      <line x1="15" y1="12" x2="5" y2="12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg {...iconProps(18)}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
