import { escapeHtml } from "./dom.js";

export const PAGE_SIZE = 10;

export function paginate(items = [], page = 0, pageSize = PAGE_SIZE) {
  const list = Array.isArray(items) ? items : [];
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const safePage = Math.min(Math.max(0, Number(page) || 0), totalPages - 1);
  const start = safePage * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total: list.length,
  };
}

export function renderPager(page, totalPages, tab) {
  if (totalPages <= 1) return "";
  return `
    <div class="pager flex items-center justify-between gap-2 mt-3">
      <button type="button" class="btn flex-1 !min-h-11" data-action="history-page" data-tab="${escapeHtml(tab)}" data-dir="-1" ${page <= 0 ? "disabled" : ""}>Prev</button>
      <span class="text-xs shrink-0" style="color:var(--mute)">${page + 1} / ${totalPages}</span>
      <button type="button" class="btn flex-1 !min-h-11" data-action="history-page" data-tab="${escapeHtml(tab)}" data-dir="1" ${page >= totalPages - 1 ? "disabled" : ""}>Next</button>
    </div>
  `;
}
