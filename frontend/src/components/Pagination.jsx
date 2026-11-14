const WINDOW = 2; // pages shown on each side of the current page

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page: current, last_page: last, from, to, total } = meta;
  const start = Math.max(1, current - WINDOW);
  const end = Math.min(last, current + WINDOW);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  const item = (page, label, { disabled = false, active = false } = {}) => (
    <li key={`${label}-${page}`} className={`page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`}>
      <button
        type="button"
        className="page-link"
        onClick={() => onPageChange(page)}
        disabled={disabled}
        aria-current={active ? 'page' : undefined}
      >
        {label}
      </button>
    </li>
  );

  return (
    <nav className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 mt-3" aria-label="Task pages">
      <span className="small text-secondary">
        Showing {from}–{to} of {total}
      </span>
      <ul className="pagination pagination-sm mb-0">
        {item(current - 1, '‹ Prev', { disabled: current === 1 })}
        {pages.map((page) => item(page, String(page), { active: page === current }))}
        {item(current + 1, 'Next ›', { disabled: current === last })}
      </ul>
    </nav>
  );
}
