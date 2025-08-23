import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Videos from './pages/Videos';
import VideoDetail from './pages/VideoDetail';
import VideoEdit from './pages/VideoEdit';
import Playlists from './pages/Playlists';
import CreatePlaylist from './pages/CreatePlaylist';
import AddVideo from './pages/AddVideo';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App bg-youtube-dark min-h-screen">
          <Header />
          <Routes>
            {/* Routes with sidebar */}
            <Route path="/" element={
              <div className="flex">
                <Sidebar />
                <main className="flex-1 ml-64">
                  <Home />
                </main>
              </div>
            } />
            <Route path="/videos" element={
              <div className="flex">
                <Sidebar />
                <main className="flex-1 ml-64">
                  <Videos />
                </main>
              </div>
            } />
            <Route path="/videos/create" element={
              <div className="flex">
                <Sidebar />
                <main className="flex-1 ml-64">
                  <AddVideo />
                </main>
              </div>
            } />
            <Route path="/playlists" element={
              <div className="flex">
                <Sidebar />
                <main className="flex-1 ml-64">
                  <Playlists />
                </main>
              </div>
            } />
            <Route path="/playlists/create" element={
              <div className="flex">
                <Sidebar />
                <main className="flex-1 ml-64">
                  <CreatePlaylist />
                </main>
              </div>
            } />
            <Route path="/videos/:videoId" element={
              <div className="flex">
                <Sidebar />
                <main className="flex-1 ml-64">
                  <VideoDetail />
                </main>
              </div>
            } />
            <Route path="/dashboard" element={
              <div className="flex">
                <Sidebar />
                <main className="flex-1 ml-64">
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </main>
              </div>
            } />
            
            {/* Routes without sidebar (full width) */}
            <Route path="/videos/:videoId/edit" element={<VideoEdit />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
