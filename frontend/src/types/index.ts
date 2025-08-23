export interface User {
  id: string;
  email: string;
  username: string;
  is_authenticated: boolean;
}

export interface Video {
  id: string;
  host_id: string;
  db_id: string;
  host_service: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: string;
  db_id: string;
  title: string;
  user_id: string;
  host_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface WatchEvent {
  id: string;
  host_id: string;
  user_id: string;
  path: string;
  start_time: number;
  end_time: number;
  duration: number;
  complete: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  session_id: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}
