/** "In Progress" → "in-progress" (used for CSS class names). */
export function statusSlug(status = '') {
  return status.toLowerCase().replace(/\s+/g, '-');
}

export default function StatusBadge({ status }) {
  return <span className={`status-pill status-${statusSlug(status)}`}>{status}</span>;
}
