import React, { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import { videoAPI } from '../services/api';
import { Video } from '../types';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const Home: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching videos...');
      
      const videoList = await videoAPI.getAll();
      console.log('Videos fetched:', videoList);
      
      setVideos(videoList);
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      
      let errorMessage = 'Failed to load videos';
      
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 401) {
          errorMessage = 'Authentication required. Please log in.';
        } else if (err.response.status === 403) {
          errorMessage = 'Access denied. You may not have permission to view videos.';
        } else if (err.response.status === 404) {
          errorMessage = 'Video service not found. Please check if the backend is running.';
        } else if (err.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = `Server error: ${err.response.status} - ${err.response.data?.detail || err.response.statusText}`;
        }
      } else if (err.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and ensure the backend server is running on http://localhost:8000';
      } else {
        // Other error
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchVideos();
  };

  if (loading) {
    return (
      <div className="pt-16 pl-64">
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-youtube-red" />
              <span className="text-white text-lg">Loading videos...</span>
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
              <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Videos</h2>
              <p className="text-youtube-light-gray mb-6">{error}</p>
              
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-youtube-red text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again ({retryCount + 1})</span>
                </button>
                
                <div className="text-xs text-youtube-light-gray space-y-1">
                  <p>If the problem persists, please check:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Backend server is running on http://localhost:8000</li>
                    <li>Database connection is working</li>
                    <li>You are logged in (if required)</li>
                  </ul>
                </div>
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
        <h1 className="text-2xl font-bold text-white mb-6">Recommended Videos</h1>
        
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-youtube-light-gray" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No Videos Found</h2>
              <p className="text-youtube-light-gray text-lg mb-4">The video library is empty</p>
              <p className="text-youtube-light-gray mb-6">Start by adding some videos to your collection!</p>
              
              <div className="text-xs text-youtube-light-gray space-y-1">
                <p>To add videos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Run the seed data script: <code className="bg-youtube-gray px-1 rounded">python seed_data.py</code></li>
                  <li>Or create videos through the API</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
