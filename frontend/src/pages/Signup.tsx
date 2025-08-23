import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/\d/.test(password)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPasswordError('');

    if (!validatePasswords()) {
      setLoading(false);
      return;
    }

    try {
      await signup(email, password, username);
      navigate('/');
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join(', '));
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-youtube-dark via-gray-900 to-black relative overflow-hidden px-4 py-4 sm:py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-20 left-20 w-32 h-32 bg-youtube-red rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-600 rounded-full opacity-10 blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Card container */}
        <div className="bg-youtube-gray/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-youtube-red to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border-2 border-red-400/20">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Create Account</h1>
              <p className="mt-2 text-youtube-light-gray text-sm">Join our video membership platform</p>
            </div>
          </div>
          
          {/* Form */}
          <form className="space-y-3 sm:space-y-4 lg:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 sm:p-4 rounded-xl flex items-center space-x-3">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
            
            {/* Username field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-white">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-youtube-dark/50 border border-gray-600/50 rounded-lg sm:rounded-xl text-white placeholder-youtube-light-gray focus:outline-none focus:ring-2 focus:ring-youtube-red/50 focus:border-youtube-red/50 transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter your username"
                />
                <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-youtube-light-gray" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-white">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-youtube-dark/50 border border-gray-600/50 rounded-lg sm:rounded-xl text-white placeholder-youtube-light-gray focus:outline-none focus:ring-2 focus:ring-youtube-red/50 focus:border-youtube-red/50 transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter your email"
                />
                <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-youtube-light-gray" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Password field */}
            <div className="space-y-2">
              <PasswordInput
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Create a strong password"
                required
                error={passwordError}
              />
              <PasswordStrength password={password} />
            </div>
            
            {/* Confirm Password field */}
            <div className="space-y-2">
              <PasswordInput
                id="confirmPassword"
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm your password"
                required
                error={passwordError}
              />
              {confirmPassword && password === confirmPassword && !passwordError && (
                <div className="flex items-center space-x-2 text-green-400 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Passwords match</span>
                </div>
              )}
            </div>
            
            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-youtube-red to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-youtube-red/50 focus:ring-offset-2 focus:ring-offset-youtube-gray disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          
          {/* Footer */}
          <div className="text-center pt-3 sm:pt-4 border-t border-gray-700/50">
            <p className="text-youtube-light-gray text-sm">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-youtube-red hover:text-red-400 font-medium transition-colors duration-200 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
        
        {/* Terms and privacy notice */}
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs text-youtube-light-gray/70">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-youtube-red/70 hover:text-youtube-red transition-colors duration-200">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-youtube-red/70 hover:text-youtube-red transition-colors duration-200">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
