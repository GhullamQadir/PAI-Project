import React, { useState, useEffect } from 'react';
import { getAIStatus, saveAIConfig, logoutUser } from '../api/client';
import './Settings.css';

const Settings = () => {
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await getAIStatus();
      setStatus(data);
    } catch (err) {
      console.error("Failed to load AI status", err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAIConfig(geminiKey, groqKey);
      setGeminiKey('');
      setGroqKey('');
      await loadStatus();
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    window.dispatchEvent(new Event('auth_error'));
  };

  return (
    <div className="settings-container animate-fade-in">
      <header className="workspace-header">
        <div>
          <h1 className="workspace-title">Settings</h1>
          <p className="workspace-subtitle">Manage preferences and AI configuration.</p>
        </div>
      </header>

      <section className="settings-card">
        <h2 className="settings-section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20"></path>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          AI Configuration
        </h2>
        
        {status && (
          <div style={{ display: 'flex', gap: 'var(--space-12)', marginBottom: 'var(--space-32)' }}>
            <div className="status-badge">
              <div className={`status-dot ${status.gemini_configured ? 'active' : 'inactive'}`} />
              Gemini
            </div>
            <div className="status-badge">
              <div className={`status-dot ${status.groq_configured ? 'active' : 'inactive'}`} />
              Groq
            </div>
          </div>
        )}

        <form className="settings-form" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Gemini API Key</label>
            <input 
              type="password" 
              className="form-input"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Enter new key to update..."
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Groq API Key</label>
            <input 
              type="password" 
              className="form-input"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="Enter new key to update..."
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={saving || (!geminiKey && !groqKey)}
              style={{ opacity: (saving || (!geminiKey && !groqKey)) ? 0.5 : 1 }}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </section>

      <section className="settings-card" style={{ marginTop: 'var(--space-24)', borderColor: 'var(--color-danger-dim)' }}>
        <h2 className="settings-section-title" style={{ color: 'var(--color-danger)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Account
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-16)' }}>
          Log out of your NovaCut AI account. You will need to log back in to access your projects.
        </p>
        <button 
          onClick={handleLogout} 
          className="btn-primary" 
          style={{ backgroundColor: 'var(--color-danger)' }}
        >
          Log Out
        </button>
      </section>
    </div>
  );
};

export default Settings;
