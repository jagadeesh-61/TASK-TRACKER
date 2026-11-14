export function formatDate(value) {
  if (!value) return '—';
  // Date-only strings (YYYY-MM-DD) are parsed as local dates to avoid an
  // off-by-one day caused by UTC conversion.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
