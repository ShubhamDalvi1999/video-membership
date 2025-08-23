import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const getStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '', feedback: [] };
    
    let score = 0;
    let feedback: string[] = [];
    
    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');
    
    // Contains lowercase
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Lowercase letter');
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Uppercase letter');
    
    // Contains number
    if (/\d/.test(password)) score += 1;
    else feedback.push('Number');
    
    // Contains special character
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Special character');
    
    const strengthMap = [
      { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-400' },
      { label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-400' },
      { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
      { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-400' },
      { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-400' }
    ];
    
    return {
      score: Math.min(score, 5),
      label: strengthMap[Math.min(score, 5) - 1]?.label || 'Very Weak',
      color: strengthMap[Math.min(score, 5) - 1]?.color || 'bg-red-500',
      textColor: strengthMap[Math.min(score, 5) - 1]?.textColor || 'text-red-400',
      feedback
    };
  };

  const strength = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center space-x-3">
        <div className="flex-1 bg-youtube-dark/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ease-out ${strength.color}`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${strength.textColor}`}>
          {strength.label}
        </span>
      </div>
      {strength.feedback.length > 0 && (
        <div className="text-xs text-youtube-light-gray/80">
          <p className="flex items-center">
            <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Add: {strength.feedback.slice(0, 2).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default PasswordStrength;

