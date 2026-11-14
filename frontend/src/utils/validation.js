import { DESCRIPTION_MAX, PRIORITIES, STATUSES, TITLE_MAX } from '../constants.js';

// Client-side checks mirror the Laravel Form Requests for instant feedback.
// The server validates again, because browser checks can be bypassed.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Today's date as YYYY-MM-DD in the user's local time zone. */
export function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function validateTask(values, { isEdit = false } = {}) {
  const errors = {};
  const title = values.title.trim();

  if (!title) errors.title = 'Please enter a task title.';
  else if (title.length > TITLE_MAX) errors.title = `The title must be ${TITLE_MAX} characters or fewer.`;

  if (values.description.length > DESCRIPTION_MAX) {
    errors.description = `The description must be ${DESCRIPTION_MAX} characters or fewer.`;
  }
  if (!STATUSES.includes(values.status)) errors.status = 'Please choose a valid status.';
  if (!PRIORITIES.includes(values.priority)) errors.priority = 'Please choose a valid priority.';
  if (!isEdit && values.due_date && values.due_date < todayIso()) {
    errors.due_date = 'The due date cannot be in the past.';
  }

  return errors;
}

export function validateLogin(values) {
  const errors = {};
  if (!values.email.trim()) errors.email = 'Please enter your email address.';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email address.';
  if (!values.password) errors.password = 'Please enter your password.';
  return errors;
}

export function validateRegistration(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Please enter your name.';
  else if (values.name.trim().length > 100) errors.name = 'The name must be 100 characters or fewer.';

  if (!values.email.trim()) errors.email = 'Please enter your email address.';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email address.';

  if (!values.password) errors.password = 'Please choose a password.';
  else if (values.password.length < 8) errors.password = 'The password must be at least 8 characters.';
  else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = 'The password must contain at least one letter and one number.';
  }

  if (values.password_confirmation !== values.password) {
    errors.password_confirmation = 'The passwords do not match.';
  }
  return errors;
}
