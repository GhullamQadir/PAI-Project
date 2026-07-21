import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import Timeline from '../components/Timeline';
import { getVideos, analyzeVideo } from '../api/client';
import './Editor.css';

const Editor = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clips, setClips] = useState([]);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allVideos = await getVideos();
        const currentVideo = allVideos.find(v => v.id === parseInt(videoId) || v.id === videoId);

        if (currentVideo) {
          setVideo(currentVideo);
        } else {
          setVideo({ id: videoId, stored_filename: 'dummy.mp4', original_filename: 'Video Not Found', duration: 60 });
        }
      } catch (err) {
        setError('Failed to load video.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoDetails();
  }, [videoId]);

  // Initialize tracks V1 and A1 when video is loaded
  useEffect(() => {
    if (video) {
      const dur = video.duration || 60;
      setClips([
        {
          id: 'v-clip-1',
          track: 'v1',
          startTime: 0,
          endTime: dur,
          sourceStart: 0,
          sourceEnd: dur,
          name: video.original_filename || 'Video Track V1'
        },
        {
          id: 'a-clip-1',
          track: 'a1',
          startTime: 0,
          endTime: dur,
          sourceStart: 0,
          sourceEnd: dur,
          name: `Audio Track A1`
        }
      ]);
      setSelectedClipId('v-clip-1');
    }
  }, [video]);

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handleHistoryChange = (_canUndo, _canRedo) => {
    // We could lift undo/redo state here if we want header buttons for it
  };

  const runAnalysis = async () => {
    if (!video) return;
    setIsAnalyzing(true);
    try {
      await analyzeVideo(video.id);
      alert('AI Analysis Complete! Check the chat assistant for suggestions.');
    } catch (err) {
      console.error(err);
      alert('Failed to run AI analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="editor-container loading">
        <div className="spinner"></div>
        <p>Loading Editor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editor-container error">
        <p>{error}</p>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="editor-container animate-fade-in">
      <header className="editor-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div className="video-title">
            <h2>{video?.original_filename || 'Untitled Video'}</h2>
            <span className="status-badge saved">Saved</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-secondary" onClick={runAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? '✨ Analyzing...' : '✨ Run AI Analysis'}
          </button>
          <button className="btn-primary export-btn">
            Export
          </button>
        </div>
      </header>

      <div className="editor-layout">
        <div className="editor-main">
          <div className="video-section">
            <VideoPlayer
              video={video}
              currentTime={currentTime}
              onTimeUpdate={handleTimeUpdate}
              clips={clips}
              selectedClipId={selectedClipId}
            />
          </div>

          <div className="timeline-section">
            <Timeline
              ref={timelineRef}
              video={video}
              currentTime={currentTime}
              onTimeUpdate={handleTimeUpdate}
              onHistoryChange={handleHistoryChange}
              clips={clips}
              setClips={setClips}
              selectedClipId={selectedClipId}
              setSelectedClipId={setSelectedClipId}
            />
          </div>
        </div>

        {/* AIAssistant takes up the right panel. It's rendered in MainLayout but we can hide it there and render here, or let MainLayout render it. */}
        {/* Since MainLayout already renders AIAssistant, we might have duplicate assistants if we render it here. */}
      </div>
    </div>
  );
};

export default Editor;
