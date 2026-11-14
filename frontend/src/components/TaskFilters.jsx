import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { STATUSES } from '../constants.js';

const SEARCH_DEBOUNCE_MS = 300;

/** Search box (debounced) + status filter. Values live in the URL. */
export default function TaskFilters({ search, status, onChange, onClear }) {
  const [text, setText] = useState(search);

  // Keep the input in sync when the URL changes (e.g. "Clear" or back button).
  useEffect(() => {
    setText(search);
  }, [search]);

  useEffect(() => {
    if (text === search) return undefined;
    // Sent as typed (the API trims it); trimming here would strip the space
    // the user just typed when the URL value syncs back into the input.
    const timer = setTimeout(() => onChange({ search: text }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, search, onChange]);

  const hasFilters = Boolean(search || status);

  return (
    <div className="card glass-card filter-bar mb-3">
      <form className="row g-2 align-items-end" role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="col-12 col-md-6">
          <label htmlFor="task-search" className="form-label small text-secondary mb-1">
            Search by title
          </label>
          <div className="input-icon">
            <Icon name="search" size={16} />
            <input
              id="task-search"
              type="search"
              className="form-control"
              placeholder="Type to search…"
              value={text}
              maxLength={100}
              onChange={(event) => setText(event.target.value)}
            />
          </div>
        </div>
        <div className="col-8 col-md-4">
          <label htmlFor="task-status-filter" className="form-label small text-secondary mb-1">
            Status
          </label>
          <select
            id="task-status-filter"
            className="form-select"
            value={status}
            onChange={(event) => onChange({ status: event.target.value })}
          >
            <option value="">All statuses</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="col-4 col-md-2 d-grid">
          <button type="button" className="btn btn-outline-secondary" onClick={onClear} disabled={!hasFilters}>
            <Icon name="x" size={15} /> Clear
          </button>
        </div>
      </form>
    </div>
  );
}
