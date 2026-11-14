import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import TaskForm from '../components/TaskForm.jsx';
import { createTask } from '../api/tasks.js';
import { useToast } from '../context/ToastContext.jsx';

export default function TaskCreatePage() {
  const navigate = useNavigate();
  const showToast = useToast();

  async function handleSubmit(values) {
    const result = await createTask(values);
    showToast(result.message ?? 'Task added.');
    navigate('/');
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8 fade-up">
        <div className="page-header">
          <span className="page-header-icon">
            <Icon name="plus" size={24} strokeWidth={2.5} />
          </span>
          <div>
            <h1 className="h3 mb-0">Add a new task</h1>
            <p className="text-secondary mb-0 small">Give it a clear title. Everything else is optional.</p>
          </div>
        </div>
        <div className="card glass-card">
          <div className="card-body p-4">
            <TaskForm onSubmit={handleSubmit} submitLabel="Add task" />
          </div>
        </div>
      </div>
    </div>
  );
}
