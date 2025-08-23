import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { videoAPI } from '../services/api';
import { ArrowLeft, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const AddVideo: React.FC = () => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const playlistId = searchParams.get('playlist_id');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a video title');
      return;
    }

    if (!url.trim()) {
      setError('Please enter a video URL');
      return;
    }

    // Basic URL validation
    if (!url.includes('youtube.com/watch?v=') && !url.includes('youtu.be/')) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      console.log('Adding video:', { title, url, playlistId });
      const video = await videoAPI.create(title.trim(), url.trim(), playlistId || undefined);
      console.log('Video added:', video);
      
      setSuccess('Video added successfully!');
      
      // Navigate after a short delay
      setTimeout(() => {
        if (playlistId) {
          navigate(`/playlists/${playlistId}`);
        } else {
          navigate('/');
        }
      }, 1500);
    } catch (err: any) {
      console.error('Error adding video:', err);
      
      let errorMessage = 'Failed to add video';
      
      if (err.response) {
        console.log('Response status:', err.response.status);
        console.log('Response data:', err.response.data);
        
        if (err.response.status === 401) {
          errorMessage = 'Authentication required. Please log in.';
        } else if (err.response.status === 400) {
          const responseData = err.response.data;
          if (responseData.errors && Array.isArray(responseData.errors)) {
            errorMessage = responseData.errors.join(', ');
          } else if (responseData.error) {
            errorMessage = responseData.error;
          } else if (responseData.detail) {
            errorMessage = responseData.detail;
          } else {
            errorMessage = 'Invalid video data. Please check your input.';
          }
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

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null); // Clear error when user starts typing
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setError(null); // Clear error when user starts typing
  };

  return (
    <div className="pt-16 pl-64">
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate(playlistId ? `/playlists/${playlistId}` : '/')}
            className="flex items-center space-x-2 text-youtube-light-gray hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back {playlistId ? 'to Playlist' : 'to Home'}</span>
          </button>
        </div>

        <div className="bg-youtube-gray rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Plus className="w-8 h-8 text-youtube-red" />
            <h1 className="text-2xl font-bold text-white">
              {playlistId ? 'Add Video to Playlist' : 'Add New Video'}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-white font-medium mb-2">
                Video Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter video title..."
                className="w-full px-4 py-3 bg-youtube-dark border border-gray-600 rounded-lg text-white placeholder-youtube-light-gray focus:outline-none focus:ring-2 focus:ring-youtube-red/50 focus:border-youtube-red/50 transition-all duration-200"
                disabled={loading}
              />
            </div>

            {/* URL Input */}
            <div>
              <label htmlFor="url" className="block text-white font-medium mb-2">
                YouTube URL *
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 bg-youtube-dark border border-gray-600 rounded-lg text-white placeholder-youtube-light-gray focus:outline-none focus:ring-2 focus:ring-youtube-red/50 focus:border-youtube-red/50 transition-all duration-200"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading || !title.trim() || !url.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-youtube-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{playlistId ? 'Add to Playlist' : 'Add Video'}</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate(playlistId ? `/playlists/${playlistId}` : '/')}
                disabled={loading}
                className="px-6 py-3 bg-youtube-dark border border-gray-600 text-white rounded-lg hover:bg-youtube-dark/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-youtube-dark/50 rounded-lg">
            <h3 className="text-white font-medium mb-2">Supported video formats:</h3>
            <ul className="text-youtube-light-gray text-sm space-y-1">
              <li>• YouTube videos (youtube.com/watch?v=...)</li>
              <li>• YouTube short URLs (youtu.be/...)</li>
              <li>• Make sure the video is public and accessible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVideo;
