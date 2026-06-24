// app/dashboard/admin/AdminSidebar.jsx
//
// Admin-side sidebar. Mirrors the doctor/patient sidebar pattern so the
// chrome stays consistent across portals — same sticky rail, same mobile
// drawer behaviour, swapped nav items and branding.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// import {
//   Collapsible,
//   CollapsibleTrigger,
//   CollapsibleContent,
// } from "@/components/ui/collapsible";
import { confirmSignOut } from "@/lib/auth/signOut";
import { marketingLoginPathForDashboard } from "@/lib/urls/dashboardPaths";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { accountDisplayEmail } from "@/lib/auth/accountDisplayEmail";
import { ADMIN_PORTAL_OPTIONS } from "@/lib/admin/portals";
import { DEFAULT_LOGO, MOBILE_HEADER_LOGO_SIZE } from "@/lib/branding/defaults";
import BrandLogo from "@/components/BrandLogo";
import { useAdminPortal } from "./AdminPortalContext";
import admin from "./admin.module.css";
import styles from "../patient/dashboard.module.css";

// Each NAV item's href is built at render time so the same sidebar works
// for both the default Ongo dashboard at /dashboard/admin/* and per-portal
// dashboards at /<slug>/dashboard/admin/*. `basePath` is "" for default
// and "/<slug>" for portal-scoped renders.
const NAV_DEFS = [
  { sub: "", label: "Overview", icon: HomeIcon, exact: true },
  { sub: "/doctors", label: "Doctors", icon: StethIcon },
  { sub: "/patients", label: "Patients", icon: UsersIcon },
  {sub:"/emails", label:"Emails", icon:UsersIcon},
  { sub: "/appointments", label: "Appointments", icon: CalendarIcon },
  { sub: "/transactions", label: "Transactions", icon: ReceiptIcon },
  { sub: "/coupons", label: "Coupons", icon: TagIcon },
];

const DEFAULT_BRANDING = DEFAULT_LOGO;

export default function AdminSidebar({
  profile,
  user,
  basePath = "",
  branding = DEFAULT_BRANDING,
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // const [emailsOpen, setEmailsOpen] = useState(false); 
  const { role } = useAuthUser();
  const isSuper = role === "superadmin";
  const { selectedPortal, setSelectedPortal, hydrated } = useAdminPortal();

  const dashHome = `${basePath}/dashboard/admin`;
  const NAV = NAV_DEFS.map((n) => ({ ...n, href: `${dashHome}${n.sub}` }));
  const b = { ...DEFAULT_BRANDING, ...branding };
// const emailsActive = pathname.startsWith(`${dashHome}/emails`);

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Admin";
  const displayEmail = accountDisplayEmail(user, profile);
  const initial = (
    profile?.firstName?.[0] ||
    profile?.email?.[0] ||
    user?.email?.[0] ||
    "A"
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
      aria-label="Admin navigation"
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

      {isSuper && hydrated && (
        <div className={admin.portalFilter}>
          <label className={admin.portalFilterLabel} htmlFor="admin-portal-filter">
            Portal
          </label>
          <select
            id="admin-portal-filter"
            className={admin.portalFilterSelect}
            value={selectedPortal}
            onChange={(e) => setSelectedPortal(e.target.value)}
          >
            {ADMIN_PORTAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

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

    {/* <div>
      <button
        type="button"
        onClick={() => setEmailsOpen((v) => !v)}
        className={`flex items-center w-full px-3 py-2 rounded-md transition ${
          emailsActive
            ? "bg-green-100 text-green-700 font-medium"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <span className="mr-2">
          <ReceiptIcon />
        </span>

        Emails

        <span className="ml-auto">
          {emailsOpen ? "▲" : "▼"}
        </span>
      </button>

      {emailsOpen && (
        <div className="flex flex-col ml-6 mt-2 space-y-1">
          <Link
            href={`${dashHome}/emails/send`}
            className={`block px-3 py-2 rounded-md transition ${
              pathname === `${dashHome}/emails/send`
                ? "bg-green-100 text-green-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Send Email
          </Link>

          <Link
            href={`${dashHome}/emails/conversations`}
            className={`block px-3 py-2 rounded-md transition ${
              pathname === `${dashHome}/emails/conversations`
                ? "bg-green-100 text-green-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Conversations
          </Link>
        </div>
      )}
    </div> */}
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
        <Link
          href={dashHome}
          className={styles.mobileBrandLink}
        >
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

function StethIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M5 3v6a5 5 0 0010 0V3" />
      <line x1="5" y1="3" x2="3" y2="3" />
      <line x1="10" y1="3" x2="12" y2="3" />
      <circle cx="18" cy="15" r="3" />
      <path d="M15 14v-2a4 4 0 00-4-4" />
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

function ReceiptIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2Z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L3 13V3h10l7.59 7.59a2 2 0 010 2.82z" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
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
