import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProject, getVideos, uploadVideo } from '../api/client';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [projectData, videosData] = await Promise.all([
          getProject(id),
          getVideos(id)
        ]);
        setProject(projectData);
        setVideos(videosData || []);
      } catch (err) {
        setError('Failed to load project details.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  const retryFetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projectData, videosData] = await Promise.all([
        getProject(id),
        getVideos(id)
      ]);
      setProject(projectData);
      setVideos(videosData || []);
    } catch (err) {
      setError('Failed to load project details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a valid video file.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await uploadVideo(file, id);
      if (result && result.id) {
        // Automatically navigate to the editor with the new video
        navigate(`/editor/${result.id}`);
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to upload video.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading) {
    return (
      <div className="project-detail-container loading">
        <div className="spinner"></div>
        <p>Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-detail-container error">
        <p>{error}</p>
        <div className="error-actions">
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          <button className="btn-primary" onClick={retryFetch}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-detail-container animate-fade-in">
      <header className="project-header">
        <div className="header-left">
          <Link to="/dashboard" className="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Dashboard
          </Link>
          <span className="header-divider"></span>
          <h1 className="project-title">{project?.title || 'Project Details'}</h1>
        </div>
      </header>

      {uploadError && (
        <div className="upload-error-alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {uploadError}
          <button className="close-alert" onClick={() => setUploadError(null)}>&times;</button>
        </div>
      )}

      <div className="project-content">
        <div className="upload-section">
          <input 
            type="file" 
            accept="video/*" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
            id="video-upload-input"
          />
          <label 
            htmlFor="video-upload-input" 
            className={`upload-dropzone ${isUploading ? 'uploading' : ''}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('video-upload-input').click(); }}
            tabIndex={0}
            role="button"
          >
            {isUploading ? (
              <div className="upload-progress">
                <div className="spinner"></div>
                <h3>Uploading Video...</h3>
                <p>Please do not close this page.</p>
              </div>
            ) : (
              <>
                <div className="upload-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                    <line x1="7" y1="2" x2="7" y2="22"></line>
                    <line x1="17" y1="2" x2="17" y2="22"></line>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <line x1="2" y1="7" x2="7" y2="7"></line>
                    <line x1="2" y1="17" x2="7" y2="17"></line>
                    <line x1="17" y1="17" x2="22" y2="17"></line>
                    <line x1="17" y1="7" x2="22" y2="7"></line>
                  </svg>
                </div>
                <h3>Upload Raw Video</h3>
                <p>Click or drag a video file here to start editing.</p>
                <span className="btn-primary" style={{ marginTop: '16px' }}>Select File</span>
              </>
            )}
          </label>
        </div>

        {videos.length > 0 && (
          <div className="videos-list-section">
            <h2 className="section-title">Project Media</h2>
            <div className="videos-grid">
              {videos.map((video) => (
                <div 
                  key={video.id} 
                  className="video-card"
                  onClick={() => navigate(`/editor/${video.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/editor/${video.id}`) }}
                >
                  <div className="video-thumbnail">
                    {/* Placeholder thumbnail, typically you'd generate/store one */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </div>
                  <div className="video-info">
                    <h4>{video.filename || 'Untitled Video'}</h4>
                    <p>{new Date(video.created_at || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
