import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from './FormField.jsx';
import { getErrorMessage, getFieldErrors } from '../api/client.js';
import { DESCRIPTION_MAX, PRIORITIES, STATUSES, TITLE_MAX } from '../constants.js';
import { todayIso, validateTask } from '../utils/validation.js';

const EMPTY_TASK = { title: '', description: '', status: 'Pending', priority: 'Medium', due_date: '' };

/** Shared add/edit form. `onSubmit(values)` must return a promise. */
export default function TaskForm({ initialValues, onSubmit, submitLabel, isEdit = false }) {
  const [values, setValues] = useState({ ...EMPTY_TASK, ...initialValues });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const clientErrors = validateTask(values, { isEdit });
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim() || null,
        status: values.status,
        priority: values.priority,
        due_date: values.due_date || null,
      });
    } catch (error) {
      // Server-side validation (422) is shown next to each field.
      const serverErrors = getFieldErrors(error);
      setErrors(serverErrors);
      if (Object.keys(serverErrors).length === 0) {
        setFormError(getErrorMessage(error, 'Could not save the task.'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      )}

      <FormField
        label="Title"
        name="title"
        value={values.title}
        onChange={handleChange}
        error={errors.title}
        maxLength={TITLE_MAX}
        placeholder="e.g. Prepare monthly report"
        hint={`${values.title.length}/${TITLE_MAX} characters`}
        required
        autoFocus
      />

      <FormField
        as="textarea"
        label="Description"
        name="description"
        rows={4}
        value={values.description}
        onChange={handleChange}
        error={errors.description}
        maxLength={DESCRIPTION_MAX}
        placeholder="Optional details"
        hint={`${values.description.length}/${DESCRIPTION_MAX} characters`}
      />

      <div className="row">
        <div className="col-sm-4">
          <FormField as="select" label="Status" name="status" value={values.status} onChange={handleChange} error={errors.status}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </FormField>
        </div>
        <div className="col-sm-4">
          <FormField as="select" label="Priority" name="priority" value={values.priority} onChange={handleChange} error={errors.priority}>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </FormField>
        </div>
        <div className="col-sm-4">
          <FormField
            type="date"
            label="Due date"
            name="due_date"
            value={values.due_date}
            onChange={handleChange}
            error={errors.due_date}
            min={isEdit ? undefined : todayIso()}
          />
        </div>
      </div>

      <div className="d-flex gap-2 justify-content-end">
        <Link to="/" className="btn btn-outline-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
