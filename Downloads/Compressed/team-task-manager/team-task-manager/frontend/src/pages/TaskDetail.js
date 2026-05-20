import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import '../styles/Dashboard.css';

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'Pending',
    dueDate: '',
    project: ''
  });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await axiosInstance.get(`/tasks/${id}`);
        setTask(res.data);
        setTaskForm({
          title: res.data.title || '',
          description: res.data.description || '',
          status: res.data.status || 'Pending',
          dueDate: res.data.dueDate ? res.data.dueDate.split('T')[0] : '',
          project: res.data.project?._id || ''
        });
      } catch (err) {
        console.error('Error fetching task:', err);
      }
    };

    const fetchProjects = async () => {
      try {
        const res = await axiosInstance.get('/projects');
        setProjects(res.data);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };

    fetchProjects();
    fetchTask();
  }, [id]);

  const updateTask = async () => {
    try {
      const res = await axiosInstance.put(`/tasks/${id}`, taskForm);
      setTask(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  if (!task) return (
    <div className="detail-page-wrapper">
      <div className="container detail-page">Loading...</div>
    </div>
  );

  return (
    <div className="detail-page-wrapper">
      <div className="container detail-page">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
        <div className="detail-card">
          <div className="detail-header">
            <h2>{task.title}</h2>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {isEditing ? (
            <div className="edit-form">
              <input
                type="text"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                placeholder="Task Title"
              />
              <textarea
                rows="4"
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, description: e.target.value })
                }
                placeholder="Task Description"
              />
              <select
                value={taskForm.status}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, status: e.target.value })
                }
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <select
                value={taskForm.project}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, project: e.target.value })
                }
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, dueDate: e.target.value })
                }
              />
              <button className="btn btn-primary" onClick={updateTask}>
                Save Task
              </button>
            </div>
          ) : (
            <>
              <p style={{ whiteSpace: 'pre-wrap' }}>{task.description || 'No description'}</p>
              {task.dueDate && (
                <p>
                  <strong>Due:</strong>{' '}
                  {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
              {task.project && task.project.title && (
                <p>
                  <strong>Project:</strong> {task.project.title}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskDetail;
