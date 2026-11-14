import { Link } from 'react-router-dom';
import Icon, { initials } from './Icon.jsx';
import StatusBadge, { statusSlug } from './StatusBadge.jsx';
import PriorityBadge from './PriorityBadge.jsx';
import { STATUSES } from '../constants.js';
import { formatDate } from '../utils/format.js';

function StatusControl({ task, busy, onStatusChange }) {
  if (!task.can.update) return null;
  return (
    <select
      className={`form-select form-select-sm status-select status-${statusSlug(task.status)}`}
      aria-label={`Change status of ${task.title}`}
      value={task.status}
      disabled={busy}
      onChange={(event) => onStatusChange(task, event.target.value)}
    >
      {STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

function TaskActions({ task, busy, onDeleteRequest }) {
  if (!task.can.update && !task.can.delete) {
    return (
      <span className="small text-secondary d-inline-flex align-items-center gap-1">
        <Icon name="eye" size={14} /> View only
      </span>
    );
  }
  return (
    <div className="d-flex gap-2">
      {task.can.update && (
        <Link
          to={`/tasks/${task.id}/edit`}
          className="btn btn-icon btn-soft-primary"
          title="Edit task"
          aria-label={`Edit ${task.title}`}
        >
          <Icon name="edit" size={15} />
        </Link>
      )}
      {task.can.delete && (
        <button
          type="button"
          className="btn btn-icon btn-soft-danger"
          title="Delete task"
          aria-label={`Delete ${task.title}`}
          disabled={busy}
          onClick={() => onDeleteRequest(task)}
        >
          <Icon name="trash" size={15} />
        </button>
      )}
    </div>
  );
}

function DueDate({ task }) {
  if (!task.due_date) return <span className="text-secondary">—</span>;
  return (
    <span className={task.is_overdue ? 'due-overdue' : undefined}>
      {formatDate(task.due_date)}
      {task.is_overdue && ' · overdue'}
    </span>
  );
}

function Owner({ owner }) {
  if (!owner) return null;
  return (
    <span className="owner-chip">
      <span className="avatar" aria-hidden="true">
        {initials(owner.name)}
      </span>
      {owner.name}
    </span>
  );
}

/**
 * Tasks as a table on medium+ screens and as cards on phones.
 * All values are rendered as JSX text, which React escapes (XSS-safe).
 */
export default function TaskList({ tasks, showOwner, busyId, onStatusChange, onDeleteRequest }) {
  return (
    <>
      <div className="card glass-card d-none d-md-block overflow-hidden">
        <div className="table-responsive">
          <table className="table task-table">
            <thead>
              <tr>
                <th scope="col">Task</th>
                {showOwner && <th scope="col">Owner</th>}
                <th scope="col">Status</th>
                <th scope="col">Priority</th>
                <th scope="col">Due</th>
                <th scope="col">Created</th>
                <th scope="col">Update status</th>
                <th scope="col" className="text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const slug = statusSlug(task.status);
                return (
                  <tr key={task.id} className={`accent-${slug}${slug === 'completed' ? ' is-completed' : ''}`}>
                    <td>
                      <div className="task-title">{task.title}</div>
                      {task.description && <div className="task-description small text-truncate">{task.description}</div>}
                    </td>
                    {showOwner && (
                      <td>
                        <Owner owner={task.owner} />
                      </td>
                    )}
                    <td>
                      <StatusBadge status={task.status} />
                    </td>
                    <td>
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="small text-nowrap">
                      <DueDate task={task} />
                    </td>
                    <td className="small text-nowrap text-secondary">{formatDate(task.created_at)}</td>
                    <td>
                      <StatusControl task={task} busy={busyId === task.id} onStatusChange={onStatusChange} />
                    </td>
                    <td>
                      <div className="d-flex justify-content-end">
                        <TaskActions task={task} busy={busyId === task.id} onDeleteRequest={onDeleteRequest} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-md-none d-grid gap-3">
        {tasks.map((task) => {
          const slug = statusSlug(task.status);
          return (
            <div key={task.id} className={`card glass-card task-card accent-${slug}${slug === 'completed' ? ' is-completed' : ''}`}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <h2 className="h6 task-title mb-0">{task.title}</h2>
                  <StatusBadge status={task.status} />
                </div>
                {task.description && <p className="small text-secondary mb-2">{task.description}</p>}
                <div className="meta-row mb-3">
                  <PriorityBadge priority={task.priority} />
                  <span>
                    <Icon name="calendar" size={13} /> <DueDate task={task} />
                  </span>
                  <span>
                    <Icon name="clock" size={13} /> {formatDate(task.created_at)}
                  </span>
                  {showOwner && <Owner owner={task.owner} />}
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
                  <StatusControl task={task} busy={busyId === task.id} onStatusChange={onStatusChange} />
                  <TaskActions task={task} busy={busyId === task.id} onDeleteRequest={onDeleteRequest} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
