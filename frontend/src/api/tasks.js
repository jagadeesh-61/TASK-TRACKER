import client from './client.js';

/** Returns { data: Task[], meta, links } (Laravel paginated resource). */
export async function listTasks(params) {
  const { data } = await client.get('/api/tasks', { params });
  return data;
}

export async function getTaskSummary(params) {
  const { data } = await client.get('/api/tasks/summary', { params });
  return data.data;
}

export async function getTask(id) {
  const { data } = await client.get(`/api/tasks/${encodeURIComponent(id)}`);
  return data.data;
}

/** Returns { data: Task, message }. */
export async function createTask(task) {
  const { data } = await client.post('/api/tasks', task);
  return data;
}

export async function updateTask(id, task) {
  const { data } = await client.put(`/api/tasks/${encodeURIComponent(id)}`, task);
  return data;
}

export async function updateTaskStatus(id, status) {
  const { data } = await client.patch(`/api/tasks/${encodeURIComponent(id)}/status`, { status });
  return data;
}

export async function deleteTask(id) {
  const { data } = await client.delete(`/api/tasks/${encodeURIComponent(id)}`);
  return data;
}
