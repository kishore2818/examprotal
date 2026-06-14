import React, { useState, useEffect } from 'react';
import { PHYSICS_CURRICULUM } from '../../data/mockData';
import { AssignmentListView } from './AssignmentListView';
import { AssignmentStartView } from './AssignmentStartView';
import { Bell, UserCircle, LogOut, Atom, Menu } from 'lucide-react';
import { api, Assignment } from '../../utils/api';

interface Props {
  selectedClass: '10th' | '11th' | '12th';
  onChangeClass: () => void;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<Props> = ({ selectedClass, onLogout }) => {
  const units = PHYSICS_CURRICULUM[selectedClass];
  const [activeUnit, setActiveUnit] = useState<string>(units[0] || '');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = api.getCurrentUser();
  const studentName = currentUser ? currentUser.name : 'Student';

  // Load assignments when component mounts or when division changes
  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await api.getAssignments();
      setAssignments(data);
    } catch (err) {
      console.error('Error loading assignments from server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const updatedUnits = PHYSICS_CURRICULUM[selectedClass];
    setActiveUnit(updatedUnits[0] || '');
    loadAssignments();
    setSelectedAssignmentId(null);
  }, [selectedClass]);

  // Sync state helper to trigger refresh after completing a test
  const refreshAssignments = () => {
    loadAssignments();
  };

  // Check if there are any new assignments to show the notification dot
  const hasNewNotifications = assignments.some(
    a => a.classDivision === selectedClass && a.isNew && a.status !== 'completed'
  );

  return (
    <div className="dashboard-layout animate-fade-in">
      {/* Top Navbar */}
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <Atom className="dashboard-logo-icon animate-float" size={28} style={{ color: 'var(--color-navy-primary)' }} />
          <div>
            <h1 className="dashboard-school-name">Physics Student Portal</h1>
            <span className="admin-console-section" style={{ backgroundColor: 'var(--color-navy-medium)', color: 'white' }}>
              Class {selectedClass === '10th' ? '10' : selectedClass === '11th' ? '11' : '12'}
            </span>
          </div>
        </div>
        
        <div className="dashboard-actions">
          <button className="notification-btn" aria-label="Notifications">
            <Bell size={20} />
            {hasNewNotifications && <span className="notification-dot" />}
          </button>

          <div className="user-profile">
            <UserCircle size={24} className="text-muted" />
            <span className="user-name">{studentName}</span>
          </div>
          
          <button className="logout-btn" onClick={onLogout} aria-label="Log out" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Mobile Accordion Menu */}
      <div className="mobile-accordion-nav">
        <button 
          className="mobile-accordion-toggle" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu size={20} />
          <span>{isMobileMenuOpen ? 'Hide Chapters Menu' : 'Browse Chapters'}</span>
        </button>
        
        {isMobileMenuOpen && (
          <div className="mobile-accordion-content animate-fade-in">
            {units.map(unit => (
              <button
                key={`mobile-${unit}`}
                className={`mobile-course-item ${activeUnit === unit ? 'active' : ''}`}
                onClick={() => {
                  setActiveUnit(unit);
                  setSelectedAssignmentId(null);
                  setIsMobileMenuOpen(false);
                }}
              >
                <Atom size={18} />
                <span>{unit}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-body">
        {/* Sidebar Navigation */}
        <aside className="dashboard-sidebar animate-slide-right">
          <h2 className="sidebar-title">Physics Chapters</h2>
          <nav className="course-nav">
            {units.map((unit, index) => (
              <button
                key={unit}
                className={`course-nav-item animate-slide-right stagger-${(index % 5) + 1} ${activeUnit === unit ? 'active' : ''}`}
                onClick={() => {
                  setActiveUnit(unit);
                  setSelectedAssignmentId(null);
                }}
                title={unit}
              >
                <Atom size={18} />
                <span style={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  display: 'inline-block', 
                  width: '100%' 
                }}>
                  {unit}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="dashboard-main-content">
          {selectedAssignmentId && assignments.find(a => (a._id || a.id) === selectedAssignmentId) ? (
            <AssignmentStartView 
              assignment={assignments.find(a => (a._id || a.id) === selectedAssignmentId)!} 
              onBack={() => {
                setSelectedAssignmentId(null);
                refreshAssignments();
              }} 
            />
          ) : (
            <>
              <h2 className="content-title" style={{ fontSize: '1.25rem', wordBreak: 'break-word' }}>
                {activeUnit} Assessments
              </h2>
              {loading ? (
                <div className="empty-state">
                  <div className="spinner" style={{ borderColor: 'var(--color-navy-primary) transparent transparent transparent', margin: '0 auto 1rem' }} />
                  <p>Loading assessments from school database...</p>
                </div>
              ) : (
                <AssignmentListView 
                  classDivision={selectedClass}
                  unit={activeUnit}
                  assignments={assignments}
                  onSelectAssignment={(id) => setSelectedAssignmentId(id)} 
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
