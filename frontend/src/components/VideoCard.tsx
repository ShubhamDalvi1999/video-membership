import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MoreVertical, Clock, Play, Edit, Trash2 } from 'lucide-react';
import { Video } from '../types';
import { watchEventAPI, videoAPI } from '../services/api';

interface VideoCardProps {
  video: Video;
  showProgress?: boolean;
  progress?: number;
  onDelete?: (videoId: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, showProgress = true, progress: propProgress, onDelete }) => {
  const [progress, setProgress] = useState<number>(propProgress || 0);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showProgress && video.host_id) {
      fetchProgress();
    }
  }, [video.host_id, showProgress]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const fetchProgress = async () => {
    if (!video.host_id) return;

    try {
      setLoading(true);
      const resumeTime = await watchEventAPI.getResumeTime(video.host_id);
      // For now, we'll show progress as a simple indicator if user has watched
      // In a full implementation, you'd want to store and retrieve actual progress percentages
      if (resumeTime > 0) {
        setProgress(25); // Show some progress if user has watched
      }
    } catch (err) {
      // Silently fail - progress is optional
      console.log('Could not fetch progress for video:', video.host_id);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    navigate(`/videos/${video.host_id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    
    try {
      await videoAPI.delete(video.host_id);
      if (onDelete) {
        onDelete(video.host_id);
      }
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('Failed to delete video');
    }
    setShowMenu(false);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getThumbnailUrl = (hostId: string) => {
    if (!hostId) return '/placeholder-thumbnail.jpg';
    return `https://img.youtube.com/vi/${hostId}/maxresdefault.jpg`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (video.host_id) {
      // Try medium quality thumbnail
      target.src = `https://img.youtube.com/vi/${video.host_id}/hqdefault.jpg`;
    } else {
      // Use placeholder
      target.src = '/placeholder-thumbnail.jpg';
    }
  };

  // Validate video data
  if (!video || !video.host_id) {
    return (
      <div className="group cursor-pointer">
        <div className="relative aspect-video bg-youtube-gray rounded-lg overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-youtube-light-gray">
              <Play className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Invalid video data</p>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-white font-medium text-sm">Invalid Video</h3>
          <p className="text-youtube-light-gray text-xs">Missing video information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group cursor-pointer">
      
      <div className="relative aspect-video bg-youtube-gray rounded-lg overflow-hidden">
        <img
          src={getThumbnailUrl(video.host_id)}
          alt={video.title || 'Video thumbnail'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={handleImageError}
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-white ml-1" />
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-youtube-gray">
            <div 
              className="h-full bg-youtube-red" 
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
          {/* We'll need to get actual duration from the backend */}
          {formatDuration(630)} {/* 10:30 in seconds */}
        </div>

        {/* More Options Button */}
        <div className="absolute top-2 right-2" ref={menuRef}>
          <button 
            className="w-8 h-8 bg-black bg-opacity-70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical className="w-4 h-4 text-white" />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute top-full right-0 mt-1 bg-youtube-gray border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]">
              <button
                onClick={handleEdit}
                className="w-full px-3 py-2 text-left text-white hover:bg-youtube-dark flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-3 py-2 text-left text-red-400 hover:bg-youtube-dark flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Video Info */}
      <div className="mt-3 flex space-x-3">
        {/* Channel Avatar */}
        <div className="w-9 h-9 bg-youtube-gray rounded-full flex-shrink-0">
          <div className="w-full h-full bg-youtube-red rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {video.user_id?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>

        {/* Video Details */}
        <div className="flex-1 min-w-0">
          <Link to={`/videos/${video.host_id}`}>
            <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
              {video.title || 'Untitled Video'}
            </h3>
          </Link>
          
          <div className="mt-1 text-youtube-light-gray text-xs">
            <p>{video.user_id || 'Unknown User'}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span>1.2K views</span>
              <span>•</span>
              <span>2 days ago</span>
              {showProgress && progress > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Watched {Math.round(progress)}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
