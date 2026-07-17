import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Timeline from './components/Timeline';
import VideoPlayer from './components/VideoPlayer';
import AIAssistant from './components/AIAssistant';
import Auth from './components/Auth';
import { getVideos, uploadVideo, deleteVideo, saveAIConfig, getAIStatus, trimVideo, getToken, logoutUser } from './api/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE"; // Replace with real Client ID from Google Cloud Console

function App() {
  const [activeTab, setActiveTab] = useState('editor');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [isUploading, setIsUploading] = useState(false);
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [groqKey, setGroqKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [aiStatus, setAiStatus] = useState({ gemini_key_set: false, groq_key_set: false, cooldowns: {} });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const timelineRef = useRef(null);
  // Default to light (car showroom) theme
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(false);

  // Sync state across components
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    // Apply theme immediately
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadVideos = async () => {
      try {
        const data = await getVideos();
        setVideos(data.videos || []);
        if (data.videos && data.videos.length > 0 && !selectedVideo) {
          setSelectedVideo(data.videos[0]);
        }
      } catch (error) {
        console.error("Failed to load videos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadAIStatus = async () => {
      try {
        const status = await getAIStatus();
        setAiStatus(status);
      } catch (error) {
        console.warn('Could not load AI status:', error);
      }
    };

    loadVideos();
    loadAIStatus();

    // Poll AI status every 10 seconds to keep token limit live
    const intervalId = setInterval(loadAIStatus, 10000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  const handleSaveSettings = async () => {
    try {
      await saveAIConfig(geminiKey, groqKey);
      localStorage.setItem('gemini_api_key', geminiKey);
      localStorage.setItem('groq_api_key', groqKey);
      const status = await getAIStatus();
      setAiStatus(status);
      alert('AI settings saved successfully!');
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      alert('Failed to save AI settings. Check the console for details.');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const video = await uploadVideo(file);
      const data = await getVideos();
      setVideos(data.videos || []);
      setSelectedVideo(video);
      setActiveTab('editor');
    } catch (error) {
      console.error("Upload failed:", error);
      const detail = error?.response?.data?.detail || error?.message || "Failed to upload video";
      alert(`Failed to upload video: ${detail}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Delete this video permanently?')) return;
    try {
      await deleteVideo(videoId);
      const data = await getVideos();
      setVideos(data.videos || []);
      if (selectedVideo?.id === videoId) {
        setSelectedVideo(data.videos?.[0] || null);
        setActiveTab(data.videos && data.videos.length > 0 ? 'editor' : 'media');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete video');
    }
  };

  const handleViewVideo = (video) => {
    setSelectedVideo(video);
    setActiveTab('editor');
  };

  const handleTrimVideoNow = async (video) => {
    if (!video) return;
    const duration = video.duration || 10;
    const endTime = Math.min(duration, 10);
    try {
      const result = await trimVideo(video.id, 0, endTime);
      const data = await getVideos();
      setVideos(data.videos || []);
      setSelectedVideo({ ...video, original_filename: `Trimmed: ${video.original_filename}` });
      setActiveTab('editor');
      alert(`Trim completed. A new trimmed video was created: ${result.output_filename}`);
    } catch (error) {
      console.error('Trim failed:', error);
      alert('Failed to trim video.');
    }
  };

  const handleUndo = () => {
    if (timelineRef.current?.undo) {
      timelineRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (timelineRef.current?.redo) {
      timelineRef.current.redo();
    }
  };

  const handleHistoryChange = (undoAvailable, redoAvailable) => {
    setCanUndo(undoAvailable);
    setCanRedo(redoAvailable);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'editor':
        return (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <main className="main-workspace">
              <div className="workspace-header">
                <h2>{selectedVideo ? selectedVideo.original_filename : 'No Video Selected'}</h2>
                <div className="header-actions">
                  <button className="secondary" onClick={handleUndo} disabled={!canUndo} title="Undo">
                    ⤺
                  </button>
                  <button className="secondary" onClick={handleRedo} disabled={!canRedo} title="Redo">
                    ⤻
                  </button>
                  <button className="primary export-btn">Export</button>
                </div>
              </div>
              
              <div className="player-section">
                <VideoPlayer 
                  video={selectedVideo} 
                  currentTime={currentTime}
                  onTimeUpdate={setCurrentTime}
                />
              </div>
              
              <div className="timeline-section">
                <Timeline 
                  ref={timelineRef}
                  video={selectedVideo} 
                  currentTime={currentTime}
                  onTimeUpdate={setCurrentTime}
                  onHistoryChange={handleHistoryChange}
                />
              </div>
            </main>
            
            <aside className={`right-sidebar ${isRightOpen ? 'open' : 'closed'}`}>
              <AIAssistant video={selectedVideo} aiStatus={aiStatus} onChatComplete={async () => {
                const status = await getAIStatus();
                setAiStatus(status);
              }} />
            </aside>
          </div>
        );
      
      case 'media':
        return (
          <main className="main-workspace full-width" style={{ padding: '2rem' }}>
            <div className="upload-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Media Library</h2>
              <button className="upload-btn primary" onClick={() => document.getElementById('media-upload').click()} disabled={isUploading}>
                {isUploading ? '📤 Uploading...' : '📤 Upload Media'}
              </button>
              <input type="file" id="media-upload" accept="video/*,audio/*,image/*,text/plain,.pdf,.doc,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
            </div>
            
            <div className="media-grid">
              {videos.map(v => (
                <div 
                  key={v.id} 
                  className={`media-card ${selectedVideo?.id === v.id ? 'selected' : ''}`}
                >
                  <div className="media-preview">
                    <span className="media-icon" onClick={() => handleViewVideo(v)}>🎥</span>
                    <div className="media-overlay">
                      <button className="secondary btn-sm" onClick={() => handleViewVideo(v)}>View</button>
                      <button className="danger btn-sm" onClick={() => handleDeleteVideo(v.id)}>Delete</button>
                    </div>
                  </div>
                  <div className="media-info" onClick={() => handleViewVideo(v)}>
                    <p className="media-title">{v.original_filename}</p>
                    <small className="media-size">{(v.file_size / (1024 * 1024)).toFixed(2)} MB</small>
                  </div>
                </div>
              ))}
            </div>
          </main>
        );
        
      case 'ai-tools':
        return (
          <main className="main-workspace full-width" style={{ padding: '2rem', overflowY: 'auto' }}>
            <h2>AI Editing Tools</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Enhance your videos instantly with AI.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="tool-card glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-card)' }}>
                <h3 style={{ color: 'var(--accent-neon)', marginBottom: '10px' }}>✨ Smart Trim</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '15px' }}>Automatically detect and remove silent parts or filler words from your video.</p>
                <button className="primary" onClick={() => setActiveTab('editor')}>Try Smart Trim</button>
              </div>
              
              <div className="tool-card glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-card)' }}>
                <h3 style={{ color: 'var(--accent-pink)', marginBottom: '10px' }}>📝 Auto-Captions</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '15px' }}>Generate accurate subtitles and burn them directly into your video.</p>
                <button className="primary" onClick={() => setActiveTab('editor')}>Generate Captions</button>
              </div>
              
              <div className="tool-card glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-card)' }}>
                <h3 style={{ color: '#4a90e2', marginBottom: '10px' }}>🔍 AI Analysis</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '15px' }}>Analyze the video to generate chapters, summaries, and SEO tags.</p>
                <button className="primary" onClick={() => setActiveTab('editor')}>Analyze Video</button>
              </div>
            </div>
          </main>
        );
        
      case 'settings':
        return (
          <main className="main-workspace full-width" style={{ padding: '2rem' }}>
            <div className="settings-page glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', background: 'var(--bg-card)' }}>
              <h2>Settings</h2>
              
              <div className="settings-group" style={{ marginTop: '2rem' }}>
                <h3>AI Configuration</h3>
                <div className="setting-item" style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Gemini API Key</label>
                  <input 
                    type="password" 
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Required for Gemini-powered AI Chat, Smart Trim, and Auto-Captions.</p>
                </div>
                <div className="setting-item" style={{ marginTop: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Groq API Key</label>
                  <input 
                    type="password" 
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="Enter your Groq API key"
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Used automatically when Gemini reaches its limit.</p>
                </div>
                <div className="status-block" style={{ marginTop: '1.5rem', padding: '16px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Gemini configured: {aiStatus.gemini_key_set ? 'Yes' : 'No'}</p>
                  <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>Groq configured: {aiStatus.groq_key_set ? 'Yes' : 'No'}</p>
                  {aiStatus.cooldowns && (
                    <div style={{ marginTop: '12px' }}>
                      {aiStatus.cooldowns.gemini?.is_in_cooldown && (
                        <p style={{ margin: 0, color: 'var(--accent-pink)' }}>Gemini is in cooldown until {aiStatus.cooldowns.gemini.cooldown_until}</p>
                      )}
                      {aiStatus.cooldowns.groq?.is_in_cooldown && (
                        <p style={{ margin: 0, color: 'var(--accent-pink)' }}>Groq is in cooldown until {aiStatus.cooldowns.groq.cooldown_until}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button className="primary" style={{ marginTop: '2rem', width: '100%', padding: '12px' }} onClick={handleSaveSettings}>Save Settings</button>
            </div>
          </main>
        );
        
      default:
        return <div>Select a tab</div>;
    }
  };

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Auth onLoginSuccess={() => setIsAuthenticated(true)} />
      </GoogleOAuthProvider>
    );
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isLeftOpen} 
        toggleSidebar={() => setIsLeftOpen(!isLeftOpen)} 
      />
      
      <div className="content-wrapper">
        <nav className="top-navbar">
          <div className="navbar-left"></div>
          <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className={`theme-toggle-dongle ${theme}`} onClick={toggleTheme}>
              <div className="theme-icons">
                <span>☀️</span>
                <span>🌙</span>
              </div>
              <div className="theme-slider"></div>
            </div>
            <button className="primary" onClick={handleLogout} style={{ padding: '6px 12px', fontSize: '13px' }}>
              Logout
            </button>
          </div>
        </nav>
        
        {renderContent()}
      </div>
      
    </div>
  );
}

export default App;
