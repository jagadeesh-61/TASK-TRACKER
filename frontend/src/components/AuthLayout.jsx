import Icon from './Icon.jsx';

const FEATURES = [
  { icon: 'list', text: 'Organise every task in one place' },
  { icon: 'filter', text: 'Search and filter in a flash' },
  { icon: 'checkCircle', text: 'Track progress from Pending to Completed' },
  { icon: 'shield', text: 'Your tasks stay private to you' },
];

/** Two-panel card used by the login and register pages. */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="row justify-content-center py-md-4">
      <div className="col-xl-10">
        <div className="card auth-shell fade-up">
          <div className="row g-0">
            <div className="col-lg-5 auth-hero d-none d-lg-flex flex-column justify-content-between">
              <div>
                <span className="brand-logo mb-4" style={{ width: '3rem', height: '3rem' }}>
                  <Icon name="check" size={24} strokeWidth={3} />
                </span>
                <h2 className="h3 fw-bold mb-2">Get things done, beautifully.</h2>
                <p className="opacity-75 mb-4">A simple, colourful home for all your tasks.</p>
                {FEATURES.map((feature) => (
                  <div key={feature.text} className="auth-feature">
                    <span className="auth-feature-icon">
                      <Icon name={feature.icon} size={18} />
                    </span>
                    <span className="small">{feature.text}</span>
                  </div>
                ))}
              </div>
              <p className="small opacity-75 mb-0">RTIH · Intern IT Assignment</p>
            </div>

            <div className="col-lg-7 auth-form">
              <h1 className="h3 mb-1">{title}</h1>
              <p className="text-secondary mb-4">{subtitle}</p>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
