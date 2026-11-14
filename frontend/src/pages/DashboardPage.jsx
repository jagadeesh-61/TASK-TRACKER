import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Icon from '../components/Icon.jsx';
import Pagination from '../components/Pagination.jsx';
import Spinner from '../components/Spinner.jsx';
import SummaryCards from '../components/SummaryCards.jsx';
import TaskFilters from '../components/TaskFilters.jsx';
import TaskList from '../components/TaskList.jsx';
import { getErrorMessage } from '../api/client.js';
import { deleteTask, getTaskSummary, listTasks, updateTaskStatus } from '../api/tasks.js';
import { PER_PAGE, STATUSES } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function heroMessage(scope, summary) {
  if (scope) return "Admin view: you can see every user's tasks, but you can only change your own.";
  if (!summary) return 'Here is everything on your plate.';
  const open = summary.pending + summary.in_progress;
  if (open === 0) return 'All caught up – nothing open right now. 🎉';
  return `You have ${open} open task${open === 1 ? '' : 's'}. Let's get them done!`;
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const showToast = useToast();
  const [params, setParams] = useSearchParams();

  // Filters live in the URL, so they survive refresh and can be bookmarked.
  const search = params.get('search') ?? '';
  const statusParam = params.get('status') ?? '';
  const status = STATUSES.includes(statusParam) ? statusParam : '';
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  const scope = isAdmin && params.get('scope') === 'all' ? 'all' : '';

  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const latestRequest = useRef(0);

  const updateParams = useCallback(
    (changes) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          Object.entries(changes).forEach(([key, value]) => {
            if (value) next.set(key, String(value));
            else next.delete(key);
          });
          // Changing a filter starts again from page 1.
          if (!('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const loadTasks = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError('');

    const query = { page, per_page: PER_PAGE };
    if (search) query.search = search;
    if (status) query.status = status;
    if (scope) query.scope = scope;

    try {
      const [list, counts] = await Promise.all([listTasks(query), getTaskSummary(scope ? { scope } : {})]);
      if (requestId !== latestRequest.current) return; // a newer request superseded this one
      setTasks(list.data);
      setMeta(list.meta);
      setSummary(counts);
      // Page no longer exists (e.g. after deleting the last task on it).
      if (list.meta.last_page < page && page > 1) updateParams({ page: list.meta.last_page });
    } catch (err) {
      if (requestId === latestRequest.current) setError(getErrorMessage(err, 'Could not load tasks.'));
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [page, search, status, scope, updateParams]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleStatusChange(task, newStatus) {
    setBusyId(task.id);
    try {
      const result = await updateTaskStatus(task.id, newStatus);
      showToast(result.message ?? 'Status updated.');
      await loadTasks();
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not change the status.'), 'danger');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteConfirmed() {
    setDeleting(true);
    try {
      const result = await deleteTask(taskToDelete.id);
      showToast(result.message ?? 'Task deleted.');
      setTaskToDelete(null);
      await loadTasks();
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not delete the task.'), 'danger');
    } finally {
      setDeleting(false);
    }
  }

  const closeDeleteModal = useCallback(() => setTaskToDelete(null), []);
  const clearFilters = useCallback(() => updateParams({ search: '', status: '' }), [updateParams]);
  const hasFilters = Boolean(search || status);

  return (
    <>
      <section className="hero-banner mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 fade-up">
        <div>
          <p className="hero-eyebrow">{greeting()}</p>
          <h1 className="h2 mb-1">Hi, {user.name.split(' ')[0]}! 👋</h1>
          <p className="hero-sub">{heroMessage(scope, summary)}</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {isAdmin && (
            <div className="btn-group" role="group" aria-label="Which tasks to show">
              <button
                type="button"
                className={`btn btn-sm btn-light-glass${scope ? '' : ' active'}`}
                aria-pressed={!scope}
                onClick={() => updateParams({ scope: '' })}
              >
                <Icon name="user" size={15} /> My tasks
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-light-glass${scope ? ' active' : ''}`}
                aria-pressed={Boolean(scope)}
                onClick={() => updateParams({ scope: 'all' })}
              >
                <Icon name="users" size={15} /> All users
              </button>
            </div>
          )}
          <Link to="/tasks/new" className="btn btn-white btn-sm px-3">
            <Icon name="plus" size={16} strokeWidth={2.5} /> Add task
          </Link>
        </div>
      </section>

      <SummaryCards summary={summary} />

      <TaskFilters search={search} status={status} onChange={updateParams} onClear={clearFilters} />

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={loadTasks}>
            Retry
          </button>
        </div>
      )}

      {loading && tasks.length === 0 ? (
        <Spinner label="Loading tasks…" />
      ) : tasks.length === 0 && !error ? (
        <div className="card glass-card">
          <div className="empty-state">
            <div className="empty-illustration">
              <Icon name={hasFilters ? 'search' : 'inbox'} size={40} strokeWidth={1.8} />
            </div>
            {hasFilters ? (
              <>
                <h2 className="h5">No tasks match your filters</h2>
                <p className="text-secondary">Try a different search word or status.</p>
                <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>
                  <Icon name="x" size={15} /> Clear filters
                </button>
              </>
            ) : (
              <>
                <h2 className="h5">No tasks yet</h2>
                <p className="text-secondary">Your list is empty. Add your first task to get started!</p>
                <Link to="/tasks/new" className="btn btn-primary">
                  <Icon name="plus" size={16} strokeWidth={2.5} /> Add your first task
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <div style={{ opacity: loading ? 0.6 : 1 }}>
          <TaskList
            tasks={tasks}
            showOwner={Boolean(scope)}
            busyId={busyId}
            onStatusChange={handleStatusChange}
            onDeleteRequest={setTaskToDelete}
          />
          <Pagination meta={meta} onPageChange={(next) => updateParams({ page: next })} />
        </div>
      )}

      <ConfirmModal
        show={Boolean(taskToDelete)}
        title="Delete task?"
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={closeDeleteModal}
      >
        <p className="mb-0">
          Are you sure you want to delete <strong>{taskToDelete?.title}</strong>? This cannot be undone.
        </p>
      </ConfirmModal>
    </>
  );
}
