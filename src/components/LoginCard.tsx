import React, { useState } from 'react';
import { 
  GraduationCap, 
  ShieldAlert, 
  Lock, 
  Hash, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  Mail
} from 'lucide-react';

import { api, User } from '../utils/api';

interface LoginCardProps {
  mode: 'student' | 'admin';
  onLogin?: (user: User) => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({ mode, onLogin }) => {
  // Form values
  const [studentName, setStudentName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle password toggle
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Reset states when mode changes
  React.useEffect(() => {
    setIdentifier('');
    setPassword('');
    setStudentName('');
    setIsSignUp(false);
    setErrorMsg('');
    setSuccessMsg('');
  }, [mode]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple frontend validation
    if (mode === 'student' && isSignUp && !studentName.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Please enter both your register number and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'student') {
        if (isSignUp) {
          // Register student
          const user = await api.register(studentName, identifier, password);
          setSuccessMsg('Account created successfully! Logging you in...');
          setTimeout(() => {
            if (onLogin) onLogin(user);
          }, 1000);
        } else {
          // Login student
          const user = await api.login(identifier, password);
          setSuccessMsg('Successfully authenticated! Welcome back.');
          setTimeout(() => {
            if (onLogin) onLogin(user);
          }, 1000);
        }
      } else {
        // Login Admin
        const user = await api.login(identifier, password);
        setSuccessMsg('Admin login authorized! Loading console dashboard...');
        setTimeout(() => {
          if (onLogin) onLogin(user);
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch between mode headers dynamically
  const isStudent = mode === 'student';

  return (
    <div className="login-card animate-scale-up">
      {/* Dynamic Header */}
      <div className="card-header">
        <div className="card-icon-container">
          {isStudent ? (
            <GraduationCap size={32} strokeWidth={1.5} />
          ) : (
            <ShieldAlert size={32} strokeWidth={1.5} />
          )}
        </div>
        <h2 className="card-title">
          {isStudent ? (isSignUp ? 'Create Student Account' : 'Student Login') : 'Administrator Login'}
        </h2>
        <p className="card-subtitle">
          {isStudent 
            ? (isSignUp ? 'Sign up to register for your exams' : 'Sign in to access your examinations and reports') 
            : 'Authorized administrative access only'}
        </p>
      </div>

      {/* Login / Register Form */}
      <form className="login-form" onSubmit={handleSubmit}>
        
        {/* Status Alerts */}
        {errorMsg && (
          <div className="form-alert form-alert-error animate-fade-in">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}
        
        {successMsg && (
          <div className="form-alert form-alert-success animate-fade-in">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Student Name Field (Sign-Up Only) */}
        {isStudent && isSignUp && (
          <div className="form-group animate-fade-in">
            <label className="form-label" htmlFor="studentName">
              Student Full Name
            </label>
            <div className="input-container">
              <div className="input-icon-left">
                <GraduationCap size={18} />
              </div>
              <input
                id="studentName"
                type="text"
                className="input-field"
                placeholder="e.g., Jane Doe"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                disabled={isLoading || successMsg !== ''}
                required
                autoComplete="name"
              />
            </div>
          </div>
        )}

        {/* Username / Roll Number Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="identifier">
            {isStudent ? 'Student Register Number' : 'Admin Username'}
          </label>
          <div className="input-container">
            <div className="input-icon-left">
              {isStudent ? <Hash size={18} /> : <Mail size={18} />}
            </div>
            <input
              id="identifier"
              type="text"
              className="input-field"
              placeholder={isStudent ? 'e.g., 12A01 or 11B08' : 'e.g., admin'}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              disabled={isLoading || successMsg !== ''}
              autoComplete="username"
              required
            />
          </div>
          {isStudent && isSignUp && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              * Must start with 10 (Class 10), 11 (Class 11), or 12 (Class 12).
            </span>
          )}
        </div>

        {/* Password Field */}
        <div className="form-group">
          <div className="form-label">
            <label htmlFor="password">Password</label>
            {!isSignUp && (
              <a href="#forgot" className="forgot-link" onClick={(e) => e.preventDefault()}>
                Forgot?
              </a>
            )}
          </div>
          <div className="input-container">
            <div className="input-icon-left">
              <Lock size={18} />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="input-field password-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              disabled={isLoading || successMsg !== ''}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
            />
            <button
              type="button"
              className="input-btn-right"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isLoading || successMsg !== ''}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Form Options */}
        {!isSignUp && (
          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading || successMsg !== ''}
              />
              <span>Remember me</span>
            </label>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="submit-btn"
          disabled={isLoading || successMsg !== ''}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              <span>{isSignUp ? 'Creating Account...' : 'Authenticating...'}</span>
            </>
          ) : (
            <>
              <span>
                {isStudent 
                  ? (isSignUp ? 'Register & Sign In' : 'Sign In as Student') 
                  : 'Sign In as Admin'}
              </span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Mode Toggle Footer */}
        {isStudent && (
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="forgot-link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.85rem'
              }}
              disabled={isLoading || successMsg !== ''}
            >
              {isSignUp ? 'Already have an account? Sign In' : 'New to the portal? Create an account'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
