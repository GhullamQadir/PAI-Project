import React, { useState, useCallback, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab, isOpen, toggleSidebar }) => {
  const [width, setWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e) => {
    e.preventDefault(); // Prevent text selection
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing) {
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200; // min width
      if (newWidth > 600) newWidth = 600; // max width
      setWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <aside 
      className={`sidebar glass-panel ${isOpen ? 'open' : 'closed'} ${isResizing ? 'resizing' : ''}`}
      style={{ width: isOpen ? `${width}px` : '80px' }}
    >
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/src/assets/logo.png" alt="NovaCut AI" style={{ height: '32px', objectFit: 'contain' }} />
        </div>
        <button 
          onClick={toggleSidebar} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li 
            className={activeTab === 'editor' ? 'active' : ''} 
            onClick={() => setActiveTab('editor')}
            title="Video Editor"
          >
            <span className="nav-icon">🎬</span>
            {isOpen && <span className="nav-text">Editor</span>}
          </li>
          <li 
            className={activeTab === 'media' ? 'active' : ''} 
            onClick={() => setActiveTab('media')}
            title="Media Library"
          >
            <span className="nav-icon">📁</span>
            {isOpen && <span className="nav-text">Media</span>}
          </li>
          <li 
            className={activeTab === 'ai-tools' ? 'active' : ''} 
            onClick={() => setActiveTab('ai-tools')}
            title="AI Tools"
          >
            <span className="nav-icon">✨</span>
            {isOpen && <span className="nav-text">AI Tools</span>}
          </li>
          <li 
            className={activeTab === 'settings' ? 'active' : ''} 
            onClick={() => setActiveTab('settings')}
            title="Settings"
          >
            <span className="nav-icon">⚙️</span>
            {isOpen && <span className="nav-text">Settings</span>}
          </li>
        </ul>
      </nav>
      {isOpen && <div className="sidebar-resizer" onMouseDown={startResizing} />}
    </aside>
  );
};

export default Sidebar;
