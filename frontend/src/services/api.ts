import axios from 'axios';
import { User, Video, Playlist, WatchEvent, AuthResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data, error.config?.url);
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  signup: async (email: string, password: string, username: string): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('password_confirm', password); // Backend expects password_confirm
    formData.append('username', username); // Add username field
    
    const response = await api.post('/auth/signup', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await api.get('/auth/user');
      return response.data.user;
    } catch (error) {
      return null;
    }
  },
};

// Video endpoints
export const videoAPI = {
  getAll: async (): Promise<Video[]> => {
    try {
      const response = await api.get('/videos/api/videos');
      console.log('Video API Response:', response.data);
      return response.data.videos || [];
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  },

  getById: async (hostId: string): Promise<Video> => {
    const response = await api.get(`/videos/api/videos/${hostId}`);
    return response.data;
  },

  getCreateForm: async (playlistId?: string): Promise<any> => {
    const params = playlistId ? { playlist_id: playlistId } : {};
    const response = await api.get('/videos/api/videos/create', { params });
    return response.data;
  },

  getEditForm: async (hostId: string): Promise<any> => {
    const response = await api.get(`/videos/api/videos/${hostId}/edit`);
    return response.data;
  },

  create: async (title: string, url: string, playlistId?: string): Promise<Video> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('url', url);
    if (playlistId) {
      formData.append('playlist_id', playlistId);
    }
    
    const response = await api.post('/videos/api/videos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (hostId: string, title: string, url: string): Promise<Video> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('url', url);
    
    const response = await api.put(`/videos/api/videos/${hostId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (hostId: string): Promise<boolean> => {
    const response = await api.delete(`/videos/api/videos/${hostId}`);
    return response.status === 200;
  },
};

// Playlist endpoints
export const playlistAPI = {
  getAll: async (): Promise<Playlist[]> => {
    const response = await api.get('/playlists/api/playlists');
    return response.data.playlists || [];
  },

  getById: async (dbId: string): Promise<Playlist> => {
    const response = await api.get(`/playlists/api/playlists/${dbId}`);
    return response.data;
  },

  getCreateForm: async (): Promise<any> => {
    const response = await api.get('/playlists/api/playlists/create');
    return response.data;
  },

  getAddVideoForm: async (playlistId: string): Promise<any> => {
    const response = await api.get(`/playlists/api/playlists/${playlistId}/add-video`);
    return response.data;
  },

  create: async (title: string): Promise<Playlist> => {
    const formData = new FormData();
    formData.append('title', title);
    
    const response = await api.post('/playlists/api/playlists', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  addVideo: async (playlistId: string, title: string, url: string): Promise<Video> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('url', url);
    
    const response = await api.post(`/playlists/api/playlists/${playlistId}/videos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.video;
  },

  removeVideo: async (playlistId: string, hostId: string): Promise<boolean> => {
    const response = await api.delete(`/playlists/api/playlists/${playlistId}/videos/${hostId}`);
    return response.status === 200;
  },
};

// Watch events endpoints
export const watchEventAPI = {
  create: async (hostId: string, startTime: number, endTime: number, duration: number, complete: boolean): Promise<WatchEvent> => {
    try {
      const response = await api.post('/watch-events/api/watch-events', {
        host_id: hostId,
        start_time: startTime,
        end_time: endTime,
        duration,
        complete,
        path: `/videos/${hostId}`
      });
      return response.data;
    } catch (error) {
      console.error('Error creating watch event:', error);
      throw error;
    }
  },

  getResumeTime: async (hostId: string): Promise<number> => {
    try {
      const response = await api.get(`/watch-events/api/watch-events/${hostId}/resume`);
      return response.data.resume_time || 0;
    } catch (error: any) {
      console.error('Error getting resume time:', error);
      // If it's a 404 or any other error, just return 0 (start from beginning)
      if (error.response?.status === 404 || error.response?.status === 401) {
        return 0;
      }
      // For other errors, still return 0 but log the error
      return 0;
    }
  },
};

export default api;
