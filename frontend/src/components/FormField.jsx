/**
 * Label + input/textarea/select with Bootstrap validation styling.
 * Pass `as="textarea"` or `as="select"` (with <option> children).
 */
export default function FormField({ label, name, error, hint, as = 'input', children, required, ...props }) {
  const Control = as;
  const id = `field-${name}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const baseClass = as === 'select' ? 'form-select' : 'form-control';

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
      </label>
      <Control
        id={id}
        name={name}
        className={`${baseClass}${error ? ' is-invalid' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        required={required}
        {...props}
      >
        {children}
      </Control>
      {hint && !error && (
        <div id={`${id}-hint`} className="form-text">
          {hint}
        </div>
      )}
      {error && (
        <div id={`${id}-error`} className="invalid-feedback">
          {error}
        </div>
      )}
    </div>
  );
}
