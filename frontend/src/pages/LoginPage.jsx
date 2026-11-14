import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import Icon from '../components/Icon.jsx';
import { getErrorMessage, getFieldErrors } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { validateLogin } from '../utils/validation.js';

// Seeded sample accounts (see backend/database/seeders/UserSeeder.php).
// Shown only in development builds to make reviewing quicker.
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@example.com', password: 'Admin@123' },
  { label: 'Alice', email: 'alice@example.com', password: 'User@1234' },
  { label: 'Bob', email: 'bob@example.com', password: 'User@1234' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const clientErrors = validateLogin(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await login({ email: values.email.trim(), password: values.password });
      showToast(`Welcome back, ${user.name}!`);
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) setFormError(getErrorMessage(error, 'Login failed.'));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back 👋" subtitle="Log in to see and manage your tasks.">
      {formError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <Icon name="alert" size={18} /> {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          type="email"
          label="Email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          required
          autoFocus
        />
        <FormField
          type="password"
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          required
        />
        <button type="submit" className="btn btn-primary w-100 py-2" disabled={submitting}>
          {submitting && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
          Log in
        </button>
      </form>

      {import.meta.env.DEV && (
        <div className="demo-accounts mt-4">
          <div className="fw-semibold mb-2">Demo accounts (development only)</div>
          <div className="d-flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="btn btn-sm btn-soft-primary"
                onClick={() => {
                  setValues({ email: account.email, password: account.password });
                  setErrors({});
                }}
              >
                <Icon name="user" size={13} /> {account.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="small text-center mt-4 mb-0">
        No account yet? <Link to="/register" className="fw-semibold">Create one</Link>
      </p>
    </AuthLayout>
  );
}
