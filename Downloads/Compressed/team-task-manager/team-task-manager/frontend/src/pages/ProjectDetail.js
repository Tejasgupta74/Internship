import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import '../styles/Dashboard.css';

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [projectForm, setProjectForm] = useState({ title: '', description: '' });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axiosInstance.get(`/projects/${id}`);
        setProject(res.data);
        setProjectForm({
          title: res.data.title || '',
          description: res.data.description || ''
        });
      } catch (err) {
        console.error('Error fetching project:', err);
      }
    };
    fetchProject();
  }, [id]);

  const updateProject = async () => {
    try {
      const res = await axiosInstance.put(`/projects/${id}`, projectForm);
      setProject(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating project:', err);
    }
  };

  if (!project) return (
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
            <h2>{project.title}</h2>
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
                value={projectForm.title}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, title: e.target.value })
                }
                placeholder="Project Title"
              />
              <textarea
                rows="4"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, description: e.target.value })
                }
                placeholder="Project Description"
              />
              <button className="btn btn-primary" onClick={updateProject}>
                Save Project
              </button>
            </div>
          ) : (
            <p style={{ whiteSpace: 'pre-wrap' }}>{project.description || 'No description'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;
