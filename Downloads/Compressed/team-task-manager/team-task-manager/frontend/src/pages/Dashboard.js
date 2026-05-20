import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import '../styles/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'Pending', dueDate: '', project: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axiosInstance.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axiosInstance.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const createProject = async () => {
    if (!newProject.title.trim()) return;
    try {
      setLoading(true);
      await axiosInstance.post('/projects', newProject);
      setNewProject({ title: '', description: '' });
      fetchProjects();
    } catch (err) {
      console.error('Error creating project:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      setLoading(true);
      await axiosInstance.delete(`/projects/${projectId}`);
      fetchProjects();
      fetchTasks();
    } catch (err) {
      console.error('Error deleting project:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim() || !newTask.project) return;
    try {
      setLoading(true);
      await axiosInstance.post('/tasks', newTask);
      setNewTask({ title: '', description: '', status: 'Pending', dueDate: '', project: '' });
      fetchTasks();
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axiosInstance.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      setLoading(true);
      await axiosInstance.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>Task Manager</h1>
          <button className="btn-secondary btn-small" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="container">
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              Projects
            </button>
            <button
              className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              Tasks
            </button>
          </div>

          {activeTab === 'projects' && (
            <div className="tab-content">
              <div className="section">
                <h2>Create New Project</h2>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Project Title"
                    value={newProject.title}
                    onChange={(e) =>
                      setNewProject({ ...newProject, title: e.target.value })
                    }
                  />
                  <textarea
                    placeholder="Project Description"
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({ ...newProject, description: e.target.value })
                    }
                    rows="3"
                  />
                  <button
                    className="btn btn-primary"
                    onClick={createProject}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </div>

              <div className="section">
                <h2>Your Projects ({projects.length})</h2>
                <div className="projects-grid">
                  {projects.length === 0 ? (
                    <p className="empty-state">No projects yet. Create one to get started!</p>
                  ) : (
                    projects.map((project) => (
                      <div
                        key={project._id}
                        className="project-card card"
                        onClick={() => navigate(`/projects/${project._id}`)}
                      >
                        <h3>{project.title}</h3>
                        <p>{project.description || 'No description'}</p>
                        <small className="text-muted">
                          Created:{' '}
                          {project.createdAt
                            ? new Date(project.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </small>
                        <div className="project-actions">
                          <button
                            className="btn-secondary btn-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects/${project._id}`);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-danger btn-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProject(project._id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="tab-content">
              <div className="section">
                <h2>Create New Task</h2>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Task Title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                  />
                  <textarea
                    placeholder="Task Description"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    rows="2"
                  />
                  <select
                    value={newTask.status}
                    onChange={(e) =>
                      setNewTask({ ...newTask, status: e.target.value })
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <select
                    value={newTask.project}
                    onChange={(e) =>
                      setNewTask({ ...newTask, project: e.target.value })
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
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                  />
                  <button
                    className="btn btn-primary"
                    onClick={createTask}
                    disabled={loading || !projects.length}
                  >
                    {loading ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </div>

              <div className="section">
                <h2>Tasks ({tasks.length})</h2>
                <div className="tasks-list">
                  {tasks.length === 0 ? (
                    <p className="empty-state">No tasks yet. Create one to get started!</p>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task._id}
                        className="task-item card"
                        onClick={() => navigate(`/tasks/${task._id}`)}
                      >
                        <div className="task-header">
                          <h4>{task.title}</h4>
                          <span
                            className={`status-badge status-${task.status
                              .toLowerCase()
                              .replace(/\s+/g, '-')}`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <div className="task-meta">
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
                        </div>
                        <div className="task-actions">
                          {task.status !== 'Completed' && (
                            <button
                              className="btn-success btn-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTaskStatus(task._id, 'Completed');
                              }}
                            >
                              Mark Complete
                            </button>
                          )}
                          {task.status === 'Pending' && (
                            <button
                              className="btn-primary btn-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTaskStatus(task._id, 'In Progress');
                              }}
                            >
                              Start
                            </button>
                          )}
                          <button
                            className="btn-secondary btn-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tasks/${task._id}`);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-danger btn-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(task._id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;