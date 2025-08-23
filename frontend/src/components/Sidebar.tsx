import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Play, 
  Clock, 
  ThumbsUp, 
  BookOpen, 
  Plus,
  FolderPlus,
  Settings,
  HelpCircle
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Play, label: 'Videos', path: '/videos' },
    { icon: Clock, label: 'History', path: '/history' },
    { icon: ThumbsUp, label: 'Liked Videos', path: '/liked' },
    { icon: BookOpen, label: 'Playlists', path: '/playlists' },
  ];

  const userMenuItems = [
    { icon: Plus, label: 'Add Video', path: '/videos/create' },
    { icon: FolderPlus, label: 'Create Playlist', path: '/playlists/create' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help', path: '/help' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 top-16 w-64 h-screen bg-youtube-dark border-r border-youtube-gray overflow-y-auto">
      <div className="py-4">
        {/* Main Menu */}
        <div className="mb-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-4 px-4 py-3 text-white hover:bg-youtube-gray transition-colors ${
                isActive(item.path) ? 'bg-youtube-gray' : ''
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-youtube-gray my-4"></div>

        {/* User Menu */}
        <div className="mb-6">
          <h3 className="px-4 py-2 text-youtube-light-gray text-sm font-medium uppercase tracking-wide">
            User
          </h3>
          {userMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-4 px-4 py-3 text-white hover:bg-youtube-gray transition-colors ${
                isActive(item.path) ? 'bg-youtube-gray' : ''
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-youtube-gray my-4"></div>

        {/* Footer */}
        <div className="px-4 py-2">
          <p className="text-youtube-light-gray text-xs">
            © 2024 VideoApp
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
