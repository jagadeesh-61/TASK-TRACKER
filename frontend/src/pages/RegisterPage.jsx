import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import Icon from '../components/Icon.jsx';
import { getErrorMessage, getFieldErrors } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { validateRegistration } from '../utils/validation.js';

const EMPTY = { name: '', email: '', password: '', password_confirmation: '' };

export default function RegisterPage() {
  const { register } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY);
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
    const clientErrors = validateRegistration(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register({ ...values, name: values.name.trim(), email: values.email.trim() });
      showToast('Account created. Welcome aboard! 🎉');
      navigate('/', { replace: true });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) setFormError(getErrorMessage(error, 'Registration failed.'));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account ✨" subtitle="It takes less than a minute. New accounts get the standard user role.">
      {formError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <Icon name="alert" size={18} /> {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="row">
          <div className="col-md-6">
            <FormField
              label="Name"
              name="name"
              autoComplete="name"
              placeholder="Your full name"
              maxLength={100}
              value={values.name}
              onChange={handleChange}
              error={errors.name}
              required
              autoFocus
            />
          </div>
          <div className="col-md-6">
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
            />
          </div>
          <div className="col-md-6">
            <FormField
              type="password"
              label="Password"
              name="password"
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
              hint="8+ characters, with a letter and a number."
              required
            />
          </div>
          <div className="col-md-6">
            <FormField
              type="password"
              label="Confirm password"
              name="password_confirmation"
              autoComplete="new-password"
              value={values.password_confirmation}
              onChange={handleChange}
              error={errors.password_confirmation}
              required
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary w-100 py-2" disabled={submitting}>
          {submitting && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
          Create account
        </button>
      </form>

      <p className="small text-center mt-4 mb-0">
        Already registered? <Link to="/login" className="fw-semibold">Log in</Link>
      </p>
    </AuthLayout>
  );
}
