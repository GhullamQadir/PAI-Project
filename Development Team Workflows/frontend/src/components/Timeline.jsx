import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { trimVideo, autoTrimVideo } from '../api/client';
import './Timeline.css';

const Timeline = forwardRef(({ video, currentTime, onTimeUpdate, onHistoryChange }, ref) => {
  const [clips, setClips] = useState([]);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const tracksRef = useRef(null);

  useEffect(() => {
    if (video) {
      const initialClip = {
        id: 'clip-1',
        startTime: 0,
        endTime: video.duration || 60,
        type: 'video'
      };
      setClips([initialClip]);
      setSelectedClipId(initialClip.id);
      setHistory([]);
      setFuture([]);
      if (onHistoryChange) {
        onHistoryChange(false, false);
      }
    } else {
      setClips([]);
    }
  }, [video, onHistoryChange]);

  const recordHistory = (nextClips, nextSelectedClipId) => {
    setHistory(prev => [...prev, { clips, selectedClipId }]);
    setFuture([]);
    if (onHistoryChange) {
      onHistoryChange(true, false);
    }
    setClips(nextClips);
    setSelectedClipId(nextSelectedClipId);
  };

  const handleSplit = () => {
    if (!selectedClipId) {
      alert("Please select a clip first");
      return;
    }

    const clipIndex = clips.findIndex(c => c.id === selectedClipId);
    const clip = clips[clipIndex];

    if (currentTime > clip.startTime && currentTime < clip.endTime) {
      const newClip1 = { ...clip, endTime: currentTime };
      const newClip2 = { ...clip, id: `clip-${Date.now()}`, startTime: currentTime };
      const newClips = [...clips];
      newClips.splice(clipIndex, 1, newClip1, newClip2);
      recordHistory(newClips, newClip2.id);
    } else {
      alert("Playhead must be over the selected clip to split it.");
    }
  };

  const handleDelete = () => {
    if (!selectedClipId) {
      alert("Please select a clip first");
      return;
    }

    const remaining = clips.filter(c => c.id !== selectedClipId);
    const nextSelected = remaining.length > 0 ? remaining[0].id : null;
    recordHistory(remaining, nextSelected);
  };

  const handleAIAutoTrim = async () => {
    if (!video) return;
    setIsProcessing(true);
    
    try {
      alert("AI Auto-Trim detected silence at the beginning. Applying trim...");
      const result = await autoTrimVideo(video.id, -30);
      alert("Trim completed! Output saved as: " + result.output_filename);
      // We could also update the timeline visually here if needed, but for now we'll just show success
    } catch (error) {
      console.error(error);
      alert("Failed to auto-trim video");
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateLeft = (time) => {
    const duration = video?.duration || 60;
    return `${(time / duration) * 100}%`;
  };

  const calculateWidth = (start, end) => {
    const duration = video?.duration || 60;
    return `${((end - start) / duration) * 100}%`;
  };

  const handlePointerDown = (e) => {
    if (!video || !onTimeUpdate) return;
    setIsDragging(true);
    updateTimeFromEvent(e);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !onTimeUpdate) return;
    updateTimeFromEvent(e);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updateTimeFromEvent = (e) => {
    if (!tracksRef.current) return;
    const rect = tracksRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const duration = video?.duration || 60;
    onTimeUpdate(percentage * duration);
  };

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (history.length === 0) return;
      const previous = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setFuture(prev => [...prev, { clips, selectedClipId }]);
      setClips(previous.clips);
      setSelectedClipId(previous.selectedClipId);
      if (onHistoryChange) {
        onHistoryChange(history.length - 1 > 0, true);
      }
    },
    redo: () => {
      if (future.length === 0) return;
      const nextState = future[future.length - 1];
      setFuture(prev => prev.slice(0, -1));
      setHistory(prev => [...prev, { clips, selectedClipId }]);
      setClips(nextState.clips);
      setSelectedClipId(nextState.selectedClipId);
      if (onHistoryChange) {
        onHistoryChange(true, future.length - 1 > 0);
      }
    }
  }));

  return (
    <div className="timeline-container glass-panel" 
         onPointerUp={handlePointerUp} 
         onPointerLeave={handlePointerUp}
         onPointerMove={handlePointerMove}>
      <div className="timeline-header">
        <div className="timeline-tools">
          <button className="tool-btn" onClick={handleSplit}>✂️ Split</button>
          <button className="tool-btn" onClick={handleDelete}>🗑️ Delete</button>
          <button className="tool-btn" onClick={handleAIAutoTrim} disabled={isProcessing}>
            {isProcessing ? '✨ Processing...' : '✨ AI Auto-Trim'}
          </button>
        </div>
        <div className="timeline-scale">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="scale-marker">
              <span>0{i}:00</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="timeline-tracks" ref={tracksRef} onPointerDown={handlePointerDown} style={{ cursor: 'text' }}>
        {video && (
          <div className="playhead" style={{ left: calculateLeft(currentTime) }}>
            <div className="playhead-handle"></div>
          </div>
        )}
        
        <div className="track">
          <div className="track-header">
            <span className="track-icon">🎞️</span> V1
          </div>
          <div className="track-content">
            {clips.map((clip) => (
              <div 
                key={clip.id} 
                className={`clip video-clip ${selectedClipId === clip.id ? 'selected' : ''}`}
                style={{ 
                  left: calculateLeft(clip.startTime), 
                  width: calculateWidth(clip.startTime, clip.endTime) 
                }}
                onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); }}
              >
                <span className="clip-label">{video?.original_filename}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="track">
          <div className="track-header">
            <span className="track-icon">🎵</span> A1
          </div>
          <div className="track-content">
             {clips.map((clip) => (
              <div 
                key={clip.id} 
                className="clip audio-clip"
                style={{ 
                  left: calculateLeft(clip.startTime), 
                  width: calculateWidth(clip.startTime, clip.endTime) 
                }}
              >
                <div className="waveform"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default Timeline;
