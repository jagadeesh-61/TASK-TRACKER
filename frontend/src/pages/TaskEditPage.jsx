import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import TaskForm from '../components/TaskForm.jsx';
import { getErrorMessage } from '../api/client.js';
import { getTask, updateTask } from '../api/tasks.js';
import { useToast } from '../context/ToastContext.jsx';

export default function TaskEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setTask(null);
    setError('');
    getTask(id)
      .then((loaded) => !cancelled && setTask(loaded))
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.status === 404 ? 'Task not found.' : getErrorMessage(err, 'Could not load the task.'));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(values) {
    const result = await updateTask(id, values);
    showToast(result.message ?? 'Task updated.');
    navigate('/');
  }

  if (error) {
    return (
      <div className="card glass-card fade-up">
        <div className="empty-state">
          <div className="empty-illustration">
            <Icon name="alert" size={40} strokeWidth={1.8} />
          </div>
          <h1 className="h5">{error}</h1>
          <p className="text-secondary">It may have been deleted, or it isn&apos;t yours.</p>
          <Link to="/" className="btn btn-primary">
            <Icon name="arrowLeft" size={16} /> Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!task) return <Spinner label="Loading task…" />;

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8 fade-up">
        <div className="page-header">
          <span className="page-header-icon">
            <Icon name={task.can.update ? 'edit' : 'eye'} size={22} />
          </span>
          <div>
            <h1 className="h3 mb-0">{task.can.update ? 'Edit task' : 'View task'}</h1>
            <p className="text-secondary mb-0 small">
              {task.owner && !task.can.update ? `Owned by ${task.owner.name}` : 'Update the details and save.'}
            </p>
          </div>
        </div>
        <div className="card glass-card">
          <div className="card-body p-4">
            {task.can.update ? (
              <TaskForm
                isEdit
                submitLabel="Save changes"
                onSubmit={handleSubmit}
                initialValues={{
                  title: task.title,
                  description: task.description ?? '',
                  status: task.status,
                  priority: task.priority,
                  due_date: task.due_date ?? '',
                }}
              />
            ) : (
              <>
                <div className="alert alert-info d-flex align-items-center gap-2">
                  <Icon name="shield" size={18} /> Only the owner of this task can edit it.
                </div>
                <h2 className="h5">{task.title}</h2>
                {task.description && <p className="text-secondary">{task.description}</p>}
                <div className="d-flex gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
                <div className="mt-4">
                  <Link to="/" className="btn btn-outline-secondary">
                    <Icon name="arrowLeft" size={16} /> Back to dashboard
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
