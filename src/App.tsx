import { useState } from 'react';
import { GraduationCap, Shield, BookOpen, LogOut } from 'lucide-react';
import { LoginCard } from './components/LoginCard';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { api, User } from './utils/api';
import './App.css';

interface SectionSelectorProps {
  portalMode: 'student' | 'admin';
  onSelect: (section: '10th' | '11th' | '12th') => void;
  onLogout: () => void;
}

const SectionSelector: React.FC<SectionSelectorProps> = ({ portalMode, onSelect, onLogout }) => {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="school-branding">
          <BookOpen className="dashboard-logo-icon" size={28} style={{ color: 'var(--color-white)' }} />
          <div className="school-branding-text">
            <h1 className="school-name">Practice Physics</h1>
            <span className="portal-tag">
              {portalMode === 'admin' ? 'Admin Console' : 'Student Portal'}
            </span>
          </div>
        </div>
        <button className="portal-toggle-btn" onClick={onLogout} title="Logout">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </header>

      <main className="app-main">
        <div className="login-card animate-fade-in" style={{ textAlign: 'center', width: '100%', maxWidth: '600px' }}>
          <h2 className="card-title" style={{ marginBottom: '0.5rem', color: 'var(--color-navy-primary)' }}>Select Division</h2>
          <p className="card-subtitle" style={{ marginBottom: '2rem' }}>Choose the academic division you want to access.</p>
          
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => onSelect('10th')}
              style={{
                flex: '1 1 150px',
                backgroundColor: 'var(--color-primary, #0f172a)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                padding: '2rem 1.5rem',
                color: 'white',
                fontSize: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-blue-accent, #3b82f6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary, #0f172a)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
            >
              <BookOpen size={32} />
              <span>Class 10</span>
            </button>

            <button 
              onClick={() => onSelect('11th')}
              style={{
                flex: '1 1 150px',
                backgroundColor: 'var(--color-primary, #0f172a)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                padding: '2rem 1.5rem',
                color: 'white',
                fontSize: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-blue-accent, #3b82f6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary, #0f172a)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
            >
              <GraduationCap size={32} />
              <span>Class 11</span>
            </button>

            <button 
              onClick={() => onSelect('12th')}
              style={{
                flex: '1 1 150px',
                backgroundColor: 'var(--color-primary, #0f172a)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                padding: '2rem 1.5rem',
                color: 'white',
                fontSize: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-blue-accent, #3b82f6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary, #0f172a)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
            >
              <GraduationCap size={32} />
              <span>Class 12</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div>
          &copy; {new Date().getFullYear()} Practice Physics. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

function App() {
  const [user, setUser] = useState<User | null>(() => api.getCurrentUser());
  const [portalMode, setPortalMode] = useState<'student' | 'admin'>('student');
  const [selectedSection, setSelectedSection] = useState<'10th' | '11th' | '12th' | null>(() => {
    const u = api.getCurrentUser();
    if (u && u.role === 'student') {
      return u.classDivision as any;
    }
    return null;
  });

  const isLoggedIn = !!user;
  const currentPortalMode = user ? user.role : portalMode;

  const togglePortalMode = () => {
    setPortalMode((prev) => (prev === 'student' ? 'admin' : 'student'));
  };

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    if (authenticatedUser.role === 'student') {
      setSelectedSection(authenticatedUser.classDivision as any);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setSelectedSection(null);
  };

  // If logged in and section is not selected (Admin flow)
  if (isLoggedIn && !selectedSection) {
    return (
      <SectionSelector 
        portalMode={currentPortalMode} 
        onSelect={setSelectedSection} 
        onLogout={handleLogout} 
      />
    );
  }

  // Student Dashboard Routing
  if (isLoggedIn && currentPortalMode === 'student' && selectedSection) {
    return (
      <StudentDashboard 
        selectedClass={selectedSection}
        onChangeClass={() => {
          // Do nothing / Students are locked to their standard based on register number
        }}
        onLogout={handleLogout} 
      />
    );
  }

  // Admin Dashboard Routing
  if (isLoggedIn && currentPortalMode === 'admin' && selectedSection) {
    return (
      <AdminDashboard 
        selectedSection={selectedSection}
        onChangeSection={() => setSelectedSection(null)}
        onLogout={handleLogout} 
      />
    );
  }

  // Otherwise, show the Login view
  return (
    <div className="app-container">
      <header className="app-header">
        <a href="/" className="school-branding" onClick={(e) => e.preventDefault()}>
          <BookOpen className="dashboard-logo-icon" size={28} style={{ color: 'var(--color-white)' }} />
          <div className="school-branding-text">
            <h1 className="school-name">Practice Physics</h1>
            <span className="portal-tag">Exam Portal</span>
          </div>
        </a>

        {/* Toggle between Student & Admin in top right */}
        <button 
          className="portal-toggle-btn" 
          onClick={togglePortalMode}
          aria-label={portalMode === 'student' ? 'Switch to admin login' : 'Switch to student login'}
        >
          {portalMode === 'student' ? (
            <>
              <Shield size={16} />
              <span>Admin Login</span>
            </>
          ) : (
            <>
              <GraduationCap size={16} />
              <span>Student Login</span>
            </>
          )}
        </button>
      </header>

      {/* Main Form content area */}
      <main className="app-main">
        <LoginCard mode={portalMode} onLogin={handleLogin} />
      </main>

      {/* Footer Branding & Links */}
      <footer className="app-footer">
        <div>
          &copy; {new Date().getFullYear()} Practice Physics. All rights reserved.
        </div>
        <div className="footer-links">
          <a href="#help" className="footer-link" onClick={(e) => e.preventDefault()}>
            Help & Support
          </a>
          <a href="#privacy" className="footer-link" onClick={(e) => e.preventDefault()}>
            Privacy Policy
          </a>
          <a href="#terms" className="footer-link" onClick={(e) => e.preventDefault()}>
            Terms of Use
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
