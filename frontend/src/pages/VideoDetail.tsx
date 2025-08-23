import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoAPI, watchEventAPI } from '../services/api';
import { Video } from '../types';
import { Loader2, AlertCircle, RefreshCw, ArrowLeft, Play, Clock, User } from 'lucide-react';

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const VideoDetail: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [resumeTime, setResumeTime] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const navigate = useNavigate();
  
  // YouTube Player references
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const monitorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeSinceLastSavedRef = useRef(0);
  
  // Constants
  const MONITOR_INTERVAL = 200; // ms
  const SAVE_INTERVAL = 5000; // ms

  useEffect(() => {
    if (videoId) {
      fetchVideo();
      fetchResumeTime();
    }
  }, [videoId]);

  // Handle resume time changes
  useEffect(() => {
    if (isPlayerReady && resumeTime > 0 && playerRef.current) {
      console.log('Resume time updated, seeking to:', resumeTime);
      
      // Single seek attempt with a reasonable delay
      const seekToResumeTime = () => {
        if (playerRef.current && playerRef.current.seekTo) {
          playerRef.current.seekTo(resumeTime, true);
          console.log('SeekTo called from useEffect');
        }
      };

      // Try once after a short delay to ensure player is ready
      setTimeout(seekToResumeTime, 1000);
    }
  }, [resumeTime, isPlayerReady]);

  useEffect(() => {
    // Load YouTube API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

    return () => {
      // Cleanup
      if (monitorTimeoutRef.current) {
        clearTimeout(monitorTimeoutRef.current);
      }
    };
  }, []);

  const fetchVideo = async () => {
    if (!videoId) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching video:', videoId);
      
      const videoData = await videoAPI.getById(videoId);
      console.log('Video fetched:', videoData);
      
      setVideo(videoData);
    } catch (err: any) {
      console.error('Error fetching video:', err);
      
      let errorMessage = 'Failed to load video';
      
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Video not found';
        } else if (err.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = `Server error: ${err.response.status} - ${err.response.data?.detail || err.response.statusText}`;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumeTime = async () => {
    if (!videoId) return;

    try {
      const resumeTimeData = await watchEventAPI.getResumeTime(videoId);
      setResumeTime(resumeTimeData);
      console.log('Resume time fetched:', resumeTimeData);
    } catch (err: any) {
      console.error('Error fetching resume time:', err);
      // Don't show error to user, just start from beginning
      setResumeTime(0);
    }
  };

  const onYouTubeIframeAPIReady = () => {
    if (!videoId || !playerContainerRef.current) return;

    console.log('Creating YouTube player with resume time:', resumeTime);

    playerRef.current = new window.YT.Player(playerContainerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        'modestbranding': 1,
        'autoplay': 0, // Explicitly disable autoplay
        'start': Math.floor(resumeTime), // Ensure it's an integer
        'playsinline': 1,
        'controls': 1,
        'rel': 0,
        'fs': 1, // Allow fullscreen
        'iv_load_policy': 3, // Disable annotations
        'cc_load_policy': 0, // Disable closed captions by default
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      }
    });
  };

  const onPlayerReady = (event: any) => {
    console.log('YouTube player ready');
    setIsPlayerReady(true);
    
    // Don't seek here, let the useEffect handle it when resumeTime is available
    console.log('Player ready, resume time will be handled by useEffect');
  };

  const onPlayerStateChange = (event: any) => {
    const { YT } = window;
    
    if (event.data === YT.PlayerState.PLAYING) {
      console.log('Video started playing');
      monitorCurrentPlayback();
    } else if (event.data === YT.PlayerState.PAUSED) {
      console.log('Video paused');
      clearTimeout(monitorTimeoutRef.current!);
      storeWatchEvent();
    } else if (event.data === YT.PlayerState.ENDED) {
      console.log('Video ended');
      clearTimeout(monitorTimeoutRef.current!);
      storeWatchEvent();
    } else if (event.data === YT.PlayerState.CUED) {
      console.log('Video cued - ready to play');
      // Don't seek here to avoid multiple refreshes
    }
  };

  const monitorCurrentPlayback = () => {
    if (!playerRef.current) return;

    const currentTime = playerRef.current.getCurrentTime();
    timeSinceLastSavedRef.current += MONITOR_INTERVAL;

    if (timeSinceLastSavedRef.current >= SAVE_INTERVAL) {
      storeWatchEvent();
    }

    monitorTimeoutRef.current = setTimeout(monitorCurrentPlayback, MONITOR_INTERVAL);
  };

  const storeWatchEvent = async () => {
    if (!playerRef.current || !videoId) return;

    try {
      const currentTime = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      const complete = (duration * 0.98) < currentTime;

      console.log('Storing watch event:', {
        hostId: videoId,
        startTime: resumeTime,
        endTime: currentTime,
        duration,
        complete
      });

      await watchEventAPI.create(
        videoId,
        resumeTime,
        currentTime,
        duration,
        complete
      );

      console.log('Watch event saved successfully');

      timeSinceLastSavedRef.current = 0;
    } catch (err: any) {
      console.error('Error saving watch event:', err);
      // Don't throw error, just log it - we don't want to break the video player
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchVideo();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-youtube-red" />
          <span className="text-white text-lg">Loading video...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Video</h2>
          <p className="text-youtube-light-gray mb-6">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-youtube-red text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again ({retryCount + 1})</span>
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-youtube-dark border border-gray-600 text-white rounded-lg hover:bg-youtube-dark/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Video Not Found</h2>
        <p className="text-youtube-light-gray mb-4">The video you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center space-x-2 mx-auto px-4 py-2 bg-youtube-red text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Video Player Section */}
      <div className="mb-6">
        {/* Resume Time Indicator */}
        {resumeTime > 0 && (
          <div className="mb-4 bg-youtube-gray rounded-lg p-3">
            <div className="flex items-center space-x-2 text-white">
              <Clock className="w-4 h-4 text-youtube-red" />
              <span>Resume from {formatTime(resumeTime)}</span>
            </div>
          </div>
        )}
        
        {/* Video Player Container - Better proportions */}
        <div className="relative w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden shadow-2xl">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
            <div 
              ref={playerContainerRef}
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Video Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-youtube-gray rounded-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-4">{video.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-youtube-light-gray text-sm mb-6">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{video.user_id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Added {formatDate(video.created_at)}</span>
              </div>
              {resumeTime > 0 && (
                <div className="flex items-center space-x-2">
                  <Play className="w-4 h-4 text-youtube-red" />
                  <span>Progress saved</span>
                </div>
              )}
            </div>

            {/* Video URL */}
            <div className="mb-4">
              <h3 className="text-white font-medium mb-2">Video URL:</h3>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 break-all"
              >
                {video.url}
              </a>
            </div>

            {/* Video ID */}
            <div className="mb-4">
              <h3 className="text-white font-medium mb-2">Video ID:</h3>
              <p className="text-youtube-light-gray font-mono">{video.host_id}</p>
            </div>

            {/* Host Service */}
            <div>
              <h3 className="text-white font-medium mb-2">Platform:</h3>
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-youtube-red" />
                <span className="text-youtube-light-gray capitalize">{video.host_service}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Sidebar - More intuitive layout */}
        <div className="lg:col-span-1">
          <div className="bg-youtube-gray rounded-lg p-4 sticky top-24">
            <h3 className="text-white font-medium mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              {/* Primary Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/videos/${videoId}/edit`)}
                  className="w-full px-4 py-3 bg-youtube-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  ✏️ Edit Video
                </button>
                
                <button
                  onClick={() => navigate('/videos/create')}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  ➕ Add New Video
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="pt-2 border-t border-gray-600">
                <h4 className="text-youtube-light-gray text-sm font-medium mb-3">Navigation</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/videos')}
                    className="w-full px-3 py-2 bg-youtube-dark border border-gray-600 text-white rounded-lg hover:bg-youtube-dark/80 transition-colors text-sm"
                  >
                    📺 Browse Videos
                  </button>
                  
                  <button
                    onClick={() => navigate('/playlists')}
                    className="w-full px-3 py-2 bg-youtube-dark border border-gray-600 text-white rounded-lg hover:bg-youtube-dark/80 transition-colors text-sm"
                  >
                    📚 View Playlists
                  </button>
                  
                  <button
                    onClick={() => navigate('/')}
                    className="w-full px-3 py-2 bg-youtube-dark border border-gray-600 text-white rounded-lg hover:bg-youtube-dark/80 transition-colors text-sm"
                  >
                    🏠 Back to Home
                  </button>
                </div>
              </div>

              {/* Video Info */}
              <div className="pt-2 border-t border-gray-600">
                <h4 className="text-youtube-light-gray text-sm font-medium mb-2">Video Info</h4>
                <div className="text-xs text-youtube-light-gray space-y-1">
                  <p><span className="text-white">Platform:</span> {video.host_service}</p>
                  <p><span className="text-white">Added:</span> {formatDate(video.created_at)}</p>
                  {resumeTime > 0 && (
                    <p><span className="text-white">Progress:</span> {formatTime(resumeTime)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;
