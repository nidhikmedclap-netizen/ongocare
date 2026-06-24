// app/dashboard/doctor/DoctorSidebar.jsx
//
// Doctor-side mirror of PatientSidebar. Same sticky-rail / mobile-drawer
// behavior, branding updated for clinicians.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { confirmSignOut } from "@/lib/auth/signOut";
import { marketingLoginPathForDashboard } from "@/lib/urls/dashboardPaths";
import { DEFAULT_LOGO, MOBILE_HEADER_LOGO_SIZE } from "@/lib/branding/defaults";
import BrandLogo from "@/components/BrandLogo";
import styles from "../patient/dashboard.module.css";

// See AdminSidebar for the `basePath` + `branding` rationale.
const NAV_DEFS = [
  { sub: "", label: "Overview", icon: HomeIcon, exact: true },
  { sub: "/patients", label: "Patients", icon: UsersIcon },
  { sub: "/appointments", label: "Appointments", icon: CalendarIcon },
  { sub: "/transactions", label: "Transactions", icon: ReceiptIcon },
  { sub: "/availability", label: "Availability", icon: ClockIcon },
];

const DEFAULT_BRANDING = DEFAULT_LOGO;

export default function DoctorSidebar({
  profile,
  user,
  basePath = "",
  branding = DEFAULT_BRANDING,
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const dashHome = `${basePath}/dashboard/doctor`;
  const NAV = NAV_DEFS.map((n) => ({ ...n, href: `${dashHome}${n.sub}` }));
  const b = { ...DEFAULT_BRANDING, ...branding };

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Doctor";
  const displayEmail = profile?.email || user?.email || "";
  const initial = (
    profile?.firstName?.[0] ||
    profile?.email?.[0] ||
    user?.email?.[0] ||
    "D"
  ).toUpperCase();
  const activeLabel =
    NAV.find((n) =>
      n.exact ? pathname === n.href : pathname.startsWith(n.href),
    )?.label || "Dashboard";

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

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
      aria-label="Doctor navigation"
    >
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
        {profile?.photoURL ? (
          <div
            className={styles.avatar}
            aria-hidden
            style={{
              backgroundImage: `url("${profile.photoURL}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              color: "transparent",
            }}
          />
        ) : (
          <div className={styles.avatar} aria-hidden>{initial}</div>
        )}
        <div className={styles.userMeta}>
          <div className={styles.userName}>Dr. {displayName}</div>
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

function UsersIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3.5-6 7-6s7 2 7 6" />
      <circle cx="17" cy="8" r="3" />
      <path d="M22 20c0-3-2-5-5-5" />
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

function ClockIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2Z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
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
