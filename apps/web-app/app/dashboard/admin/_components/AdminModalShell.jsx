"use client";

import admin from "../admin.module.css";

/**
 * Shared admin modal layout — gradient header, scrollable body, sticky footer.
 * @param {"compact" | "wide"} size — compact (~520px) or wide (~980px)
 * @param {"form" | "div"} as — root element inside the backdrop
 */
export default function AdminModalShell({
  title,
  subtitle,
  badge,
  onClose,
  size = "compact",
  as = "form",
  onSubmit,
  noValidate,
  children,
  footer,
  className = "",
}) {
  const Root = as;
  const panelClass =
    size === "wide" ? admin.modalShellWide : admin.modalShellCompact;

  const rootProps = {
    className: `${admin.modal} ${panelClass} ${className}`.trim(),
    onClick: (e) => e.stopPropagation(),
    ...(as === "form" ? { onSubmit, noValidate } : {}),
  };

  return (
    <div className={admin.modalBackdrop} onClick={onClose} role="presentation">
      <Root {...rootProps}>
        <header className={admin.modalShellHeader}>
          <h2 className={admin.modalTitle}>{title}</h2>
          {(subtitle || badge) && (
            <p className={admin.modalSub}>
              {subtitle}
              {badge ? (
                <span className={admin.modalStatusPill}>{badge}</span>
              ) : null}
            </p>
          )}
        </header>

        <div className={admin.modalShellBody}>{children}</div>

        {footer ? (
          <footer className={admin.modalShellFooter}>{footer}</footer>
        ) : null}
      </Root>
    </div>
  );
}
