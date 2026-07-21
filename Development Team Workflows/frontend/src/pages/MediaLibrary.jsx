import React, { useState, useEffect, useRef } from 'react';
import { getVideos, deleteVideo, uploadVideo } from '../api/client';
import './MediaLibrary.css';

const MediaLibrary = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const data = await getVideos();
      if (data && Array.isArray(data.videos)) {
        setVideos(data.videos);
      } else if (Array.isArray(data)) {
        setVideos(data);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error("Failed to load videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadVideo(file);
      fetchVideos();
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.message || "Failed to upload video");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteVideo(id);
      fetchVideos();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const filteredVideos = videos.filter(v => 
    (v.original_filename || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="media-container animate-fade-in">
      <header className="media-header">
        <div className="media-title-group">
          <h1 className="workspace-title">Media Library</h1>
          <p className="workspace-subtitle">Upload and manage your raw video files.</p>
        </div>
        
        <div className="media-actions">
          <div className="search-input-wrapper">
            <svg className="search-input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              className="search-input"
              placeholder="Search media..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="video/*"
            onChange={handleFileChange}
          />
          <button 
            className="btn-primary" 
            onClick={handleUploadClick}
            disabled={isUploading}
            style={{ opacity: isUploading ? 0.7 : 1, cursor: isUploading ? 'wait' : 'pointer' }}
          >
            {isUploading ? (
              <div className="typing-dot" style={{ width: 16, height: 16, display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 4, height: 4, background: '#fff', borderRadius: '50%' }}></span>
                <span style={{ width: 4, height: 4, background: '#fff', borderRadius: '50%', animationDelay: '0.2s' }}></span>
                <span style={{ width: 4, height: 4, background: '#fff', borderRadius: '50%', animationDelay: '0.4s' }}></span>
              </div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Upload
              </>
            )}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
           <div className="typing-dot" style={{ width: 8, height: 8, backgroundColor: 'var(--color-primary)', borderRadius: '50%' }} />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
          <h2 className="empty-state-title">
            {search ? 'No matches found' : 'Your library is empty'}
          </h2>
          <p className="empty-state-desc">
            {search ? `We couldn't find anything matching "${search}".` : "Upload videos to start building your media collection."}
          </p>
          {!search && (
            <button className="btn-primary" onClick={handleUploadClick} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload Media'}
            </button>
          )}
        </div>
      ) : (
        <div className="media-grid">
          {filteredVideos.map(video => (
            <div key={video.id} className="media-card">
              <div className="media-card-preview">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
              <div className="media-card-info">
                <div style={{ overflow: 'hidden' }}>
                  <h3 className="media-card-title">
                    {video.original_filename || `Video ${video.id}`}
                  </h3>
                  <p className="media-card-meta">
                    {video.file_size ? `${(video.file_size / (1024*1024)).toFixed(1)} MB` : 'Unknown size'}
                  </p>
                </div>
                <button 
                  className="media-card-delete"
                  onClick={(e) => handleDelete(video.id, e)}
                  title="Delete Video"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
