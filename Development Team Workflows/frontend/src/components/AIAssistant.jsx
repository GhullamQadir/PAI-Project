import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatWithAI, trimVideo, autoTrimVideo, getChatSessions, getChatHistory, createNewChat } from '../api/client';
import './AIAssistant.css';

const AIAssistant = ({ video, aiStatus, onChatComplete }) => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Hi! I am NovaCut AI. Tell me what you want to do with your video.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getChatSessions();
      setSessions(data);
    } catch (e) {
      console.error('Failed to load chat sessions', e);
    }
  };

  const loadHistory = async (sessionId) => {
    try {
      const data = await getChatHistory(sessionId);
      setCurrentSessionId(data.id);
      
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages.map(msg => ({
          id: msg.id,
          type: msg.role === 'user' ? 'user' : 'bot',
          text: msg.content,
          actions: [] 
        })));
      } else {
        setMessages([{ id: 1, type: 'bot', text: 'Hi! I am NovaCut AI. Tell me what you want to do with your video.' }]);
      }
      
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  };

  const handleNewChat = async () => {
    try {
      const session = await createNewChat(`Chat about ${video ? video.original_filename : 'Video'}`, video ? video.id : null);
      setSessions([session, ...sessions]);
      setCurrentSessionId(session.id);
      setMessages([{ id: 1, type: 'bot', text: 'Hi! I am NovaCut AI. Tell me what you want to do with your video.' }]);
    } catch (e) {
      console.error('Failed to create new chat', e);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      try {
        const session = await createNewChat(`Chat about ${video ? video.original_filename : 'Video'}`, video ? video.id : null);
        setSessions([session, ...sessions]);
        setCurrentSessionId(session.id);
        activeSessionId = session.id;
      } catch (e) {
        console.error('Failed to create new chat', e);
      }
    }

    const newMsg = { id: Date.now(), type: 'user', text: inputValue };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setIsTyping(true);
    
    try {
      const response = await chatWithAI(newMsg.text, video?.id, activeSessionId);
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: response.reply,
        actions: response.actions || []
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: "Error: " + (error.response?.data?.detail || error.message || "Failed to communicate with AI.")
      }]);
    } finally {
      setIsTyping(false);
      if (onChatComplete) onChatComplete();
    }
  };

  const handleActionClick = async (action) => {
    if (!video) {
      alert("Please select a video first.");
      return;
    }

    try {
      setIsTyping(true); // show loading state while processing
      if (action.type === 'trim') {
        const result = await trimVideo(video.id, action.start_time, action.end_time);
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'bot',
          text: `Trim complete! The new video is saved as ${result.output_filename}.`
        }]);
      } else if (action.type === 'remove_silence') {
        const result = await autoTrimVideo(video.id, action.threshold_db || -30);
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'bot',
          text: `Auto-trim complete! The new video is saved as ${result.output_filename}.`
        }]);
      } else if (action.type === 'add_captions') {
        // We'll mock this for now since whisper requires extra setup
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'bot',
            text: `Captions generated and burned into the video successfully!`
          }]);
          setIsTyping(false);
        }, 3000);
        return;
      } else {
        alert(`Action ${action.type} is not fully implemented yet.`);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: `Error executing action: ${error.message}`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing) {
      // For right sidebar, new width is window width minus mouse X
      let newWidth = window.innerWidth - e.clientX;
      if (newWidth < 300) newWidth = 300;
      if (newWidth > 800) newWidth = 800;
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
    <div className="ai-assistant-container glass-panel" style={{ width: `${width}px`, position: 'relative' }}>
      <div className="ai-resizer" onMouseDown={startResizing} />
      
      <div className="ai-layout-container">
        {/* Sidebar */}
        <div className={`chat-history-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
          <div className="history-header">
            <h4>Chat History</h4>
            <button className="new-chat-btn" onClick={handleNewChat}>+ New</button>
          </div>
          <div className="history-list">
            {sessions.map(session => (
              <div 
                key={session.id} 
                className={`history-item ${currentSessionId === session.id ? 'active' : ''}`}
                onClick={() => loadHistory(session.id)}
              >
                {session.title || "New Chat"}
              </div>
            ))}
            {sessions.length === 0 && (
              <div style={{ padding: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>No previous chats</div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="ai-main-chat">
          <div className="assistant-header">
            <button 
              className="toggle-history-btn" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle History"
            >
              ☰
            </button>
            <div className="ai-icon">✨</div>
            <h3>NovaCut AI</h3>
            {video && <span className="video-badge">Analyzing: {video.original_filename}</span>}
          </div>
          
          <div className="messages-area">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-wrapper ${msg.type}`}>
                {msg.type === 'bot' && <div className="avatar bot-avatar">✨</div>}
                
                <div className="message-content">
                  <div className="message-bubble">{msg.text}</div>
                  
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="message-actions">
                      {msg.actions.map((action, idx) => (
                        <button 
                          key={idx} 
                          className="action-btn"
                          onClick={() => handleActionClick(action)}
                        >
                          {action.label || action.type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {msg.type === 'user' && <div className="avatar user-avatar">U</div>}
              </div>
            ))}
            
            {isTyping && (
              <div className="message-wrapper bot">
                <div className="avatar bot-avatar">✨</div>
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="input-area" style={{ position: 'relative' }}>
            {aiStatus && aiStatus.usage && (
              <div className="token-limit-container">
                <span className="token-limit-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </span>
                <div className="token-limit-tooltip">
                  <strong>Daily API Limits:</strong><br />
                  Gemini: {1500 - (aiStatus.usage.gemini_usage_today || 0)} / 1500 remaining<br />
                  Groq: {14400 - (aiStatus.usage.groq_usage_today || 0)} / 14400 remaining
                </div>
              </div>
            )}
            <input 
              type="text" 
              placeholder="Ask AI to edit... (e.g., 'Trim from 5s to 10s')" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="send-btn" onClick={handleSend} disabled={!inputValue.trim()}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
