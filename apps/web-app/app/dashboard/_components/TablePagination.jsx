"use client";

import admin from "../admin/admin.module.css";

/**
 * Footer pagination bar for dashboard tables and lists.
 */
export default function TablePagination({
  page,
  setPage,
  pageSize,
  setPageSize,
  pageSizeOptions = [10, 25, 50],
  totalItems,
  totalPages,
  showingFrom,
  showingTo,
}) {
  if (totalItems === 0) return null;

  const pages = buildPageWindow(page, totalPages);

  return (
    <nav
      className={admin.paginationBar}
      aria-label="Table pagination"
    >
      <div className={admin.paginationSummary}>
        Showing{" "}
        <strong>
          {showingFrom}–{showingTo}
        </strong>{" "}
        of <strong>{totalItems}</strong>
      </div>

      <div className={admin.paginationControls}>
        <label className={admin.paginationSizeLabel}>
          Rows
          <select
            className={admin.paginationSizeSelect}
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <div className={admin.paginationPages}>
          <button
            type="button"
            className={admin.paginationBtn}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            aria-label="Previous page"
          >
            ←
          </button>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className={admin.paginationEllipsis} aria-hidden>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`${admin.paginationBtn} ${
                  p === page ? admin.paginationBtnActive : ""
                }`}
                onClick={() => setPage(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            className={admin.paginationBtn}
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            aria-label="Next page"
          >
            →
          </button>
        </div>
      </div>
    </nav>
  );
}

function buildPageWindow(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current]);
  if (current > 1) pages.add(current - 1);
  if (current < total) pages.add(current + 1);
  if (current > 2) pages.add(current - 2);
  if (current < total - 1) pages.add(current + 2);

  const sorted = [...pages].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}
