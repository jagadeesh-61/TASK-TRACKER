import Icon from './Icon.jsx';

const CARDS = [
  { key: 'total', label: 'Total tasks', className: 'stat-total', icon: 'list' },
  { key: 'pending', label: 'Pending', className: 'stat-pending', icon: 'clock' },
  { key: 'in_progress', label: 'In progress', className: 'stat-progress', icon: 'loader' },
  { key: 'completed', label: 'Completed', className: 'stat-completed', icon: 'checkCircle' },
];

export default function SummaryCards({ summary }) {
  const percent = summary?.total ? Math.round((summary.completed / summary.total) * 100) : 0;

  return (
    <>
      <div className="row g-3 mb-3">
        {CARDS.map(({ key, label, className, icon }, index) => (
          <div key={key} className="col-6 col-lg-3 fade-up" style={{ animationDelay: `${index * 60}ms` }}>
            <div className={`stat-card ${className}`}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-value">{summary ? summary[key] : '–'}</div>
                  <div className="stat-label">{label}</div>
                </div>
                <span className="stat-icon">
                  <Icon name={icon} size={20} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card glass-card progress-card mb-4">
        <div className="card-body py-3">
          <div className="d-flex justify-content-between align-items-center mb-2 small">
            <span className="fw-semibold">Overall progress</span>
            <span className="text-secondary">
              {summary ? `${summary.completed} of ${summary.total} done · ${percent}%` : '–'}
            </span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-label="Completed tasks"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-bar" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </>
  );
}
