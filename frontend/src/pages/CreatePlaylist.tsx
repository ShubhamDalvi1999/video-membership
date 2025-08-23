import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { playlistAPI } from '../services/api';
import { ArrowLeft, Plus, Loader2, AlertCircle } from 'lucide-react';

const CreatePlaylist: React.FC = () => {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a playlist title');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Creating playlist:', title);
      const playlist = await playlistAPI.create(title.trim());
      console.log('Playlist created:', playlist);
      
      // Navigate to the new playlist
      navigate(`/playlists/${playlist.id}`);
    } catch (err: any) {
      console.error('Error creating playlist:', err);
      
      let errorMessage = 'Failed to create playlist';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Authentication required. Please log in.';
        } else if (err.response.status === 400) {
          const errors = err.response.data?.errors || [];
          errorMessage = errors.join(', ') || 'Invalid playlist data';
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

  return (
    <div className="pt-16 pl-64">
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/playlists')}
            className="flex items-center space-x-2 text-youtube-light-gray hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Playlists</span>
          </button>
        </div>

        <div className="bg-youtube-gray rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Plus className="w-8 h-8 text-youtube-red" />
            <h1 className="text-2xl font-bold text-white">Create New Playlist</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-white font-medium mb-2">
                Playlist Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter playlist title..."
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

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-youtube-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Playlist</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/playlists')}
                disabled={loading}
                className="px-6 py-3 bg-youtube-dark border border-gray-600 text-white rounded-lg hover:bg-youtube-dark/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-youtube-dark/50 rounded-lg">
            <h3 className="text-white font-medium mb-2">Tips for creating a great playlist:</h3>
            <ul className="text-youtube-light-gray text-sm space-y-1">
              <li>• Choose a descriptive title that reflects the content</li>
              <li>• You can add videos to your playlist after creating it</li>
              <li>• Playlists help organize your favorite videos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePlaylist;
