import React, { useRef, useState, useEffect } from 'react';
import { getVideoStreamUrl } from '../api/client';
import './VideoPlayer.css';

const VideoPlayer = ({ video, currentTime, onTimeUpdate, clips = [], selectedClipId }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef(null);

  // Find active video and audio clips at the current timeline playhead position
  const activeVideoClip = clips.find(
    (c) => c.track === 'v1' && currentTime >= c.startTime && currentTime <= c.endTime
  );

  const activeAudioClip = clips.find(
    (c) => c.track === 'a1' && currentTime >= c.startTime && currentTime <= c.endTime
  );

  // Sync HTML5 media element time and state with timeline currentTime
  useEffect(() => {
    if (!videoRef.current) return;

    // Total project duration
    const totalDuration = video?.duration || 60;
    if (currentTime >= totalDuration) {
      setIsPlaying(false);
      return;
    }

    if (activeVideoClip) {
      // Map timeline time to the source file time
      const sourceTime = (currentTime - activeVideoClip.startTime) + activeVideoClip.sourceStart;

      // Sync media player current position
      if (Math.abs(videoRef.current.currentTime - sourceTime) > 0.3) {
        videoRef.current.currentTime = sourceTime;
      }

      // Control play/pause on HTML5 video element
      if (isPlaying) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => { });
        }
      } else {
        if (!videoRef.current.paused) {
          videoRef.current.pause();
        }
      }

      // Audio track mute override
      // If there is no active audio clip covering current time, mute the player.
      videoRef.current.muted = !activeAudioClip;
    } else {
      // No video clip covering this time. Pause the playback
      if (!videoRef.current.paused) {
        videoRef.current.pause();
      }

      // Play audio anyway if audio clip is present at this time
      if (activeAudioClip) {
        const sourceTime = (currentTime - activeAudioClip.startTime) + activeAudioClip.sourceStart;
        if (Math.abs(videoRef.current.currentTime - sourceTime) > 0.3) {
          videoRef.current.currentTime = sourceTime;
        }
        if (isPlaying && videoRef.current.paused) {
          videoRef.current.play().catch(() => { });
        }
        videoRef.current.muted = false;
      } else {
        videoRef.current.muted = true;
      }
    }
  }, [currentTime, isPlaying, activeVideoClip, activeAudioClip, video]);

  // Master playback playhead driving loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();

      const tick = () => {
        const now = performance.now();
        const delta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        const totalDuration = video?.duration || 60;
        const nextTime = Math.min(totalDuration, currentTime + delta);

        onTimeUpdate(nextTime);

        if (nextTime >= totalDuration) {
          setIsPlaying(false);
        } else {
          animationFrameRef.current = requestAnimationFrame(tick);
        }
      };

      animationFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, video, onTimeUpdate]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
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
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
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
    ? `http://127.0.0.1:8000/outputs/${video.output_filename}`
    : (video.stored_filename?.startsWith('blob:')
      ? video.stored_filename
      : getVideoStreamUrl(video.stored_filename));

  // If there's no active clip from either track, show a black placeholder viewport
  const isVideoVisible = !!activeVideoClip;

  return (
    <div className="video-player-container glass-panel">
      <div className="video-viewport" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', position: 'relative' }}>

        {/* Render HTML5 video element */}
        {!video.mime_type?.startsWith('image/') && !video.mime_type?.startsWith('text/') && video.mime_type !== 'application/pdf' && (
          <video
            ref={videoRef}
            src={videoUrl}
            className="active-video"
            style={{
              transform: `scale(${zoomLevel})`,
              opacity: isVideoVisible ? 1 : 0, // Opacity is 0 during video gaps
              transition: 'opacity 0.15s ease',
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={handlePlayPause}
          />
        )}

        {/* If in video gap, show overlay */}
        {!isVideoVisible && !video.mime_type?.startsWith('image/') && (
          <div className="video-gap-overlay" style={{ position: 'absolute', color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)', pointerEvents: 'none' }}>
            ⬛ Video Gap (Black Screen)
          </div>
        )}

        {video.mime_type?.startsWith('image/') && (
          <img
            src={videoUrl}
            className="active-video"
            style={{ transform: `scale(${zoomLevel})`, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            alt={video.original_filename}
          />
        )}

        {/* Zoom Controls Overlay */}
        {(!video.mime_type?.startsWith('audio/') && !video.mime_type?.startsWith('text/') && video.mime_type !== 'application/pdf') && (
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}>+</button>
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button className="zoom-btn" onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.25))}>-</button>
          </div>
        )}
      </div>

      {/* Player Controls */}
      {(!video.mime_type?.startsWith('image/') && !video.mime_type?.startsWith('text/') && video.mime_type !== 'application/pdf') && (
        <div className="player-controls-wrapper">
          <div
            className="player-tracker"
            onPointerDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const update = (eMove) => {
                const x = Math.max(0, Math.min(eMove.clientX - rect.left, rect.width));
                const pct = x / rect.width;
                onTimeUpdate(pct * (video.duration || 60));
              };
              update(e);
              const up = () => {
                window.removeEventListener('pointermove', update);
                window.removeEventListener('pointerup', up);
              };
              window.addEventListener('pointermove', update);
              window.addEventListener('pointerup', up);
            }}
          >
            <div className="tracker-fill" style={{ width: `${(currentTime / (video.duration || 60)) * 100}%` }}></div>
            <div className="tracker-thumb" style={{ left: `${(currentTime / (video.duration || 60)) * 100}%` }}></div>
          </div>

          <div className="player-controls">
            <div className="control-group center">
              <button className="control-btn" onClick={() => onTimeUpdate(Math.max(0, currentTime - 5))}>⏮</button>
              <button className="control-btn play-btn" onClick={handlePlayPause}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="control-btn" onClick={() => onTimeUpdate(Math.min(video.duration || 60, currentTime + 5))}>⏭</button>
            </div>

            <div className="control-group right">
              <div className="time-display">
                <span>{formatTime(currentTime)}</span> / <span>{formatTime(video.duration || duration)}</span>
              </div>
              <button className="control-btn active" style={{ marginLeft: 8 }}>HD</button>
              <button className="control-btn" onClick={toggleFullscreen}>⛶</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
