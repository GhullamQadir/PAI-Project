import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../api/client';
import './AIAssistant.css';

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const SUGGESTIONS = [
    "Summarize",
    "Generate subtitles",
    "Trim silence",
    "Find highlights",
    "Auto edit"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textOverride) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await chatWithAI(userMessage);
      const aiResponse = typeof res === 'string' ? res : (res.response || res.message || 'Error parsing response.');
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="ai-panel">
      <header className="ai-header">
        <div className="ai-header-dot" />
        <h2>Nova AI</h2>
      </header>
      
      <div className="ai-chat-area">
        {messages.length === 0 ? (
          <div className="ai-welcome animate-fade-in">
            <div className="ai-message ai-message-assistant">
              Hello! I am Nova, your AI assistant. How can I help you edit your video today?
            </div>
            <div className="ai-suggestions">
              {SUGGESTIONS.map(sug => (
                <button 
                  key={sug} 
                  className="ai-suggestion-chip"
                  onClick={() => handleSend(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`ai-message animate-slide-up ${msg.role === 'user' ? 'ai-message-user' : 'ai-message-assistant'}`}
            >
              {msg.content}
            </div>
          ))
        )}

        {isLoading && (
          <div className="ai-typing animate-slide-up">
            <div className="ai-typing-dot" />
            <div className="ai-typing-dot" />
            <div className="ai-typing-dot" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="ai-input-area">
        <div className="ai-input-wrapper">
          <textarea 
            className="ai-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nova to edit..."
            disabled={isLoading}
          />
          <button 
            className="ai-send-btn"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <div className="ai-input-hint">
          Shift + Enter for new line
        </div>
      </div>
    </aside>
  );
};

export default AIAssistant;
