import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { playlistAPI } from '../services/api';
import { Playlist } from '../types';
import { Loader2, AlertCircle, RefreshCw, Plus, Folder, Clock, Play } from 'lucide-react';

const Playlists: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching playlists...');
      
      const playlistList = await playlistAPI.getAll();
      console.log('Playlists fetched:', playlistList);
      
      setPlaylists(playlistList);
    } catch (err: any) {
      console.error('Error fetching playlists:', err);
      
      let errorMessage = 'Failed to load playlists';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Authentication required. Please log in.';
        } else if (err.response.status === 403) {
          errorMessage = 'Access denied. You may not have permission to view playlists.';
        } else if (err.response.status === 404) {
          errorMessage = 'Playlist service not found. Please check if the backend is running.';
        } else if (err.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = `Server error: ${err.response.status} - ${err.response.data?.detail || err.response.statusText}`;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection and ensure the backend server is running on http://localhost:8000';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchPlaylists();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="pt-16 pl-64">
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-youtube-red" />
              <span className="text-white text-lg">Loading playlists...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-16 pl-64">
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Playlists</h2>
              <p className="text-youtube-light-gray mb-6">{error}</p>
              
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-youtube-red text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again ({retryCount + 1})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pl-64">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Your Playlists</h1>
          <Link
            to="/playlists/create"
            className="flex items-center space-x-2 px-4 py-2 bg-youtube-red text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Playlist</span>
          </Link>
        </div>
        
        {playlists.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <Folder className="w-16 h-16 mx-auto text-youtube-light-gray" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No Playlists Found</h2>
              <p className="text-youtube-light-gray text-lg mb-4">Start organizing your videos</p>
              <p className="text-youtube-light-gray mb-6">Create your first playlist to get started!</p>
              
              <Link
                to="/playlists/create"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-youtube-red text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Playlist</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                to={`/playlists/${playlist.id}`}
                className="group block bg-youtube-gray rounded-lg overflow-hidden hover:bg-youtube-gray/80 transition-colors"
              >
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Folder className="w-8 h-8 text-youtube-red" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {playlist.title}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-youtube-light-gray">
                    <div className="flex items-center space-x-2">
                      <Play className="w-3 h-3" />
                      <span>{playlist.host_ids?.length || 0} videos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>Created {formatDate(playlist.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Playlists;
