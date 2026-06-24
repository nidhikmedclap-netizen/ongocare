// lib/ui/usePagination.js
//
// Client-side pagination for dashboard tables and lists.

"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * @param {unknown[]} items — full filtered list
 * @param {{ pageSize?: number, pageSizeOptions?: number[], resetDeps?: unknown[] }} options
 */
export function usePagination(items, options = {}) {
  const {
    pageSize: initialPageSize = 10,
    pageSizeOptions = [10, 25, 50],
    resetDeps = [],
  } = options;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetDeps supplied by caller
  }, [pageSize, ...resetDeps]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const showingFrom = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, totalItems);

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    pageSizeOptions,
    totalItems,
    totalPages,
    paginatedItems,
    showingFrom,
    showingTo,
  };
}
