import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoAPI } from '../services/api';
import { Video } from '../types';
import { Loader2, AlertCircle, ArrowLeft, Save, Trash2 } from 'lucide-react';

const VideoEdit: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  const fetchVideo = async () => {
    if (!videoId) return;

    try {
      setLoading(true);
      setError(null);
      
      const videoData = await videoAPI.getById(videoId);
      setVideo(videoData);
      setFormData({
        title: videoData.title || '',
        url: videoData.url || ''
      });
    } catch (err: any) {
      console.error('Error fetching video:', err);
      setError('Failed to load video details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId) return;

    try {
      setSaving(true);
      setError(null);

      await videoAPI.update(videoId, formData.title, formData.url);
      
      // Navigate back to video detail page
      navigate(`/videos/${videoId}`);
    } catch (err: any) {
      console.error('Error updating video:', err);
      setError('Failed to update video');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!videoId || !window.confirm('Are you sure you want to delete this video?')) return;

    try {
      setSaving(true);
      setError(null);

      await videoAPI.delete(videoId);
      
      // Navigate back to videos list
      navigate('/videos');
    } catch (err: any) {
      console.error('Error deleting video:', err);
      setError('Failed to delete video');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-youtube-dark">
        <div className="pt-16">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-youtube-red" />
              <span className="text-white text-lg">Loading video...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !video) {
    return (
      <div className="min-h-screen bg-youtube-dark">
        <div className="pt-16">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Video</h2>
              <p className="text-youtube-light-gray mb-6">{error}</p>
              
              <button
                onClick={() => navigate('/videos')}
                className="flex items-center justify-center space-x-2 mx-auto px-4 py-2 bg-youtube-red text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Videos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-youtube-dark">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-youtube-dark border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(`/videos/${videoId}`)}
            className="flex items-center space-x-2 text-youtube-light-gray hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Video</span>
          </button>
          
          <h1 className="text-white font-medium">Edit Video</h1>
          
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </div>

      <div className="pt-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-youtube-gray rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Video Details</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-white font-medium mb-2">
                  Video Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-youtube-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-youtube-red focus:outline-none"
                  placeholder="Enter video title"
                />
              </div>

              {/* URL */}
              <div>
                <label htmlFor="url" className="block text-white font-medium mb-2">
                  Video URL
                </label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-youtube-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-youtube-red focus:outline-none"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-youtube-light-gray text-sm mt-1">
                  Enter the full YouTube URL
                </p>
              </div>

              {/* Current Video Info */}
              {video && (
                <div className="bg-youtube-dark rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Current Video Info</h3>
                  <div className="space-y-2 text-sm text-youtube-light-gray">
                    <p><span className="text-white">Host ID:</span> {video.host_id}</p>
                    <p><span className="text-white">Platform:</span> {video.host_service}</p>
                    <p><span className="text-white">Added:</span> {new Date(video.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2 bg-youtube-red text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/videos/${videoId}`)}
                  disabled={saving}
                  className="px-6 py-2 bg-youtube-dark border border-gray-600 text-white rounded-lg hover:bg-youtube-dark/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEdit;
