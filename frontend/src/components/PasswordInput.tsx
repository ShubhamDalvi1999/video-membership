import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter your password",
  required = false,
  error,
  className = ""
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-white mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`block w-full pr-10 sm:pr-12 px-3 sm:px-4 py-2.5 sm:py-3 bg-youtube-dark/50 border ${
            error ? 'border-red-500' : 'border-gray-600/50'
          } rounded-lg sm:rounded-xl text-white placeholder-youtube-light-gray focus:outline-none focus:ring-2 focus:ring-youtube-red/50 focus:border-youtube-red/50 transition-all duration-200 text-sm sm:text-base`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-youtube-light-gray hover:text-white transition-colors duration-200"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500 flex items-center">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default PasswordInput;
