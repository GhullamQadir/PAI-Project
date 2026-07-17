import React, { useRef, useState, useEffect } from 'react';
import { getVideoStreamUrl } from '../api/client';
import './VideoPlayer.css';

const VideoPlayer = ({ video, currentTime, onTimeUpdate }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Sync external time changes (from timeline)
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) { /* Safari */
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) { /* IE11 */
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!video) {
    return (
      <div className="video-player-container glass-panel">
        <div className="video-viewport">
          <div className="video-placeholder">
            <span style={{ color: 'var(--text-muted)' }}>Select or upload a video</span>
          </div>
        </div>
      </div>
    );
  }

  const videoUrl = video.output_filename 
    ? `http://localhost:8000/outputs/${video.output_filename}`
    : getVideoStreamUrl(video.stored_filename);

  return (
    <div className="video-player-container glass-panel">
      <div className="video-viewport" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        {video.mime_type?.startsWith('image/') ? (
          <img
            src={videoUrl}
            className="active-video"
            style={{ transform: `scale(${zoomLevel})`, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            alt={video.original_filename}
          />
        ) : video.mime_type?.startsWith('audio/') ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white' }}>
            <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎵</span>
            <h3>{video.original_filename}</h3>
            <audio
              ref={videoRef}
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        ) : video.mime_type?.startsWith('text/') || video.mime_type === 'application/pdf' ? (
          <iframe 
            src={videoUrl} 
            style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }} 
            title={video.original_filename}
          />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className="active-video"
            style={{ transform: `scale(${zoomLevel})` }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={handlePlayPause}
            onEnded={() => setIsPlaying(false)}
          />
        )}
        
        {/* Zoom Controls Overlay (hide for audio and text) */}
        {(!video.mime_type?.startsWith('audio/') && !video.mime_type?.startsWith('text/') && video.mime_type !== 'application/pdf') && (
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}>+</button>
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button className="zoom-btn" onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.25))}>-</button>
          </div>
        )}
      </div>
      
      {/* Player Controls (hide for image and text) */}
      {(!video.mime_type?.startsWith('image/') && !video.mime_type?.startsWith('text/') && video.mime_type !== 'application/pdf') && (
        <div className="player-controls">
          <div className="control-group">
            <button className="control-btn" onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 5; }}>⏮</button>
            <button className="control-btn play-btn" onClick={handlePlayPause}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="control-btn" onClick={() => { if (videoRef.current) videoRef.current.currentTime += 5; }}>⏭</button>
          </div>
          
          <div className="time-display">
            <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration || video.duration)}</span>
          </div>
          
          <div className="control-group">
            <button className="control-btn active">HD</button>
            <button className="control-btn" onClick={toggleFullscreen}>⛶</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
