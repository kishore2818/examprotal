import React, { useState, useEffect } from 'react';
import { PHYSICS_CURRICULUM, Question } from '../../data/mockData';
import { ExamQuestionEditor } from './ExamQuestionEditor';
import { 
  LogOut, 
  Plus, 
  Calendar, 
  ClipboardList, 
  TrendingUp, 
  Users, 
  Award, 
  RefreshCw,
  Atom,
  FileSpreadsheet,
  Menu
} from 'lucide-react';
import { api, Assignment, Attempt } from '../../utils/api';

interface Props {
  selectedSection: '10th' | '11th' | '12th';
  onChangeSection: () => void;
  onLogout: () => void;
}

interface ExamDraft {
  title: string;
  questionsCount: number;
  dueDate: string;
}

interface AdminAttempt extends Attempt {
  studentName: string;
  registerNumber: string;
  classDivision: string;
}

export const AdminDashboard: React.FC<Props> = ({ selectedSection, onChangeSection, onLogout }) => {
  const units = PHYSICS_CURRICULUM[selectedSection];
  const [activeUnit, setActiveUnit] = useState<string>(units[0] || '');
  const [assignmentsList, setAssignmentsList] = useState<Assignment[]>([]);
  const [attemptsList, setAttemptsList] = useState<AdminAttempt[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Modal state for creating new exam
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamQuestions, setNewExamQuestions] = useState(5);
  const [newExamDueDate, setNewExamDueDate] = useState('');

  // Multi-step: Question Editor state
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);
  const [examDraft, setExamDraft] = useState<ExamDraft | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch assignments for this standard
      const assignments = await api.getAssignmentsForAdmin(selectedSection);
      setAssignmentsList(assignments);

      // Fetch all student grades and flatten them into attempt records
      const grades = await api.getAllGrades();
      const attempts: AdminAttempt[] = [];
      
      grades.forEach(student => {
        student.exams.forEach(exam => {
          attempts.push({
            assignmentId: exam.assignmentId,
            assignmentTitle: exam.assignmentTitle,
            unit: exam.unit,
            score: exam.score,
            total: exam.total,
            pct: exam.pct,
            passed: exam.passed,
            timeSpent: exam.timeSpent,
            studentAnswers: exam.studentAnswers,
            date: exam.date,
            studentName: student.studentName,
            registerNumber: student.registerNumber,
            classDivision: selectedSection // standard
          });
        });
      });
      
      setAttemptsList(attempts);
    } catch (err) {
      console.error('Error loading admin dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync state if selectedSection changes
  useEffect(() => {
    const updatedUnits = PHYSICS_CURRICULUM[selectedSection];
    setActiveUnit(updatedUnits[0] || '');
    loadDashboardData();
  }, [selectedSection]);

  // Phase 1: Modal "Next" handler -> move to Question Editor
  const handleNextToEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim() || !activeUnit) return;

    setExamDraft({
      title: newExamTitle,
      questionsCount: Number(newExamQuestions),
      dueDate: newExamDueDate
    });

    setIsModalOpen(false);
    setIsEditingQuestions(true);
  };

  // Phase 2: Publish from Question Editor -> add assignment and return
  const handlePublishExam = async (questions: Question[]) => {
    if (!examDraft) return;

    try {
      // Map frontend Question items to match database requirements
      const formattedQuestions = questions.map(q => ({
        q: q.q,
        opts: q.opts,
        ans: q.ans,
        exp: q.exp || ''
      }));

      const newAssignment = {
        classDivision: selectedSection,
        unit: activeUnit,
        title: examDraft.title,
        dueDate: examDraft.dueDate ? new Date(examDraft.dueDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        questionsCount: examDraft.questionsCount,
        questions: formattedQuestions
      };

      const published = await api.createAssignment(newAssignment);
      setAssignmentsList(prev => [published, ...prev]);

      setIsEditingQuestions(false);
      setExamDraft(null);
      setNewExamTitle('');
      setNewExamQuestions(5);
      setNewExamDueDate('');
    } catch (err: any) {
      console.error('Failed to create assignment on server:', err);
      alert(err.message || 'Error publishing assignment');
    }
  };

  // Cancel from editor -> return to dashboard
  const handleCancelEditor = () => {
    setIsEditingQuestions(false);
    setExamDraft(null);
  };

  // Get current active unit assignments
  const activeAssignments = assignmentsList.filter(
    a => a.classDivision === selectedSection && a.unit === activeUnit
  );

  // Get current active unit attempts for statistics
  const activeAttempts = attemptsList.filter(
    att => att.classDivision === selectedSection && att.unit === activeUnit
  );

  const averageScore = activeAttempts.length > 0 
    ? Math.round(activeAttempts.reduce((sum, att) => sum + att.pct, 0) / activeAttempts.length) 
    : 0;

  const passRate = activeAttempts.length > 0 
    ? Math.round((activeAttempts.filter(att => att.passed).length / activeAttempts.length) * 100) 
    : 0;

  // ===== PHASE 2: Show the Question Editor =====
  if (isEditingQuestions && examDraft) {
    return (
      <ExamQuestionEditor
        examTitle={examDraft.title}
        questionsCount={examDraft.questionsCount}
        onCancel={handleCancelEditor}
        onPublish={handlePublishExam}
      />
    );
  }

  // ===== PHASE 1 / Dashboard =====
  return (
    <div className="dashboard-layout animate-fade-in">
      {/* Top Console Navbar */}
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <Atom className="dashboard-logo-icon animate-float" size={28} style={{ color: 'var(--color-navy-primary)' }} />
          <div>
            <h1 className="dashboard-school-name">Physics Admin Console</h1>
            <span className="admin-console-section">
              Class {selectedSection === '10th' ? '10' : selectedSection === '11th' ? '11' : '12'}
            </span>
          </div>
        </div>
        
        <div className="dashboard-actions">
          <button 
            className="change-section-btn" 
            onClick={onChangeSection}
            title="Switch Division"
          >
            <RefreshCw size={16} />
            <span>Switch Division</span>
          </button>
          
          <button 
            className="logout-btn" 
            onClick={onLogout} 
            title="Log out Admin"
            style={{ marginLeft: '0.5rem' }}
          >
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
          <span>{isMobileMenuOpen ? 'Hide Units Menu' : 'Browse Units'}</span>
        </button>
        
        {isMobileMenuOpen && (
          <div className="mobile-accordion-content animate-fade-in">
            {units.map(unit => (
              <button
                key={`mobile-${unit}`}
                className={`mobile-course-item ${activeUnit === unit ? 'active' : ''}`}
                onClick={() => {
                  setActiveUnit(unit);
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

      {/* Main Console Layout */}
      <div className="dashboard-body">
        {/* Sidebar unit navigator */}
        <aside className="dashboard-sidebar animate-slide-right">
          <h2 className="sidebar-title">Physics Chapters</h2>
          <nav className="course-nav">
            {units.map((unit, index) => (
              <button
                key={unit}
                className={`course-nav-item animate-slide-right stagger-${(index % 5) + 1} ${activeUnit === unit ? 'active' : ''}`}
                onClick={() => setActiveUnit(unit)}
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

        {/* Console Workspace */}
        <main className="dashboard-main-content">
          {loading ? (
            <div className="empty-state" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div className="spinner" style={{ borderColor: 'var(--color-navy-primary) transparent transparent transparent', width: '40px', height: '40px', borderWidth: '3.5px', marginBottom: '1.5rem' }} />
              <p style={{ fontWeight: '600', color: 'var(--text-main)' }}>Syncing school exam databases...</p>
            </div>
          ) : (
            <>
              <div className="admin-workspace-header">
                <div>
                  <h2 className="content-title" style={{ fontSize: '1.25rem', wordBreak: 'break-word' }}>
                    {activeUnit}
                  </h2>
                  <p className="content-subtitle">Created assessments, statistics, and submissions analysis.</p>
                </div>
                
                <button 
                  className="create-exam-btn"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus size={18} />
                  <span>Create MCQ Exam</span>
                </button>
              </div>

              {/* Quick Metrics Grid */}
              <div className="admin-metrics-grid animate-fade-in">
                <div className="metric-card animate-slide-bottom stagger-1">
                  <div className="metric-header">
                    <span className="metric-label">Active Exams</span>
                    <ClipboardList size={20} className="metric-icon blue" />
                  </div>
                  <div className="metric-value">{activeAssignments.length}</div>
                  <div className="metric-subtext">Active test series</div>
                </div>

                <div className="metric-card animate-slide-bottom stagger-2">
                  <div className="metric-header">
                    <span className="metric-label">Total Submissions</span>
                    <Users size={20} className="metric-icon green" />
                  </div>
                  <div className="metric-value">{activeAttempts.length}</div>
                  <div className="metric-subtext">Attempts recorded</div>
                </div>

                <div className="metric-card animate-slide-bottom stagger-3">
                  <div className="metric-header">
                    <span className="metric-label">Average Score</span>
                    <Award size={20} className="metric-icon purple" />
                  </div>
                  <div className="metric-value">{averageScore}%</div>
                  <div className="metric-subtext">Class performance avg</div>
                </div>

                <div className="metric-card animate-slide-bottom stagger-4">
                  <div className="metric-header">
                    <span className="metric-label">Pass Rate</span>
                    <TrendingUp size={20} className="metric-icon orange" />
                  </div>
                  <div className="metric-value">{passRate}%</div>
                  <div className="metric-subtext">Passing threshold: 40%</div>
                </div>
              </div>

              {/* Exam Schedule / List */}
              <div className="exams-section-container">
                <h3 className="section-block-title">Scheduled Exams ({activeAssignments.length})</h3>
                
                {activeAssignments.length === 0 ? (
                  <div className="empty-exams-state">
                    <FileSpreadsheet size={48} className="text-muted" />
                    <p>No exams created yet for this unit.</p>
                    <button 
                      className="create-exam-inline-btn"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Create your first exam
                    </button>
                  </div>
                ) : (
                  <div className="admin-exams-table-wrapper">
                    <table className="admin-exams-table">
                      <thead>
                        <tr>
                          <th>Exam Details</th>
                          <th>Due Date</th>
                          <th>Questions</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAssignments.map(exam => (
                          <tr key={exam._id || exam.id} className={exam.isNew ? 'row-new' : ''}>
                            <td>
                              <div className="exam-title-cell">
                                <strong>{exam.title}</strong>
                                {exam.isNew && <span className="new-badge">New</span>}
                              </div>
                            </td>
                            <td>
                              <div className="table-flex-cell">
                                <Calendar size={14} className="text-muted" />
                                <span>{new Date(exam.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            </td>
                            <td>{exam.questionsCount} MCQs</td>
                            <td>
                              <span className={`status-pill completed`}>
                                Accepting Submissions
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Student Submissions Performance Log */}
              <div className="exams-section-container" style={{ marginTop: '2.5rem' }}>
                <h3 className="section-block-title">Student Submissions Log ({activeAttempts.length})</h3>
                
                {activeAttempts.length === 0 ? (
                  <div className="empty-exams-state">
                    <Users size={48} className="text-muted" />
                    <p>No student submissions recorded yet for this chapter.</p>
                  </div>
                ) : (
                  <div className="admin-exams-table-wrapper">
                    <table className="admin-exams-table">
                      <thead>
                        <tr>
                          <th>Student Details</th>
                          <th>Exam Title</th>
                          <th>Score / Percentage</th>
                          <th>Time Spent</th>
                          <th>Date Completed</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAttempts.map((attempt, index) => (
                          <tr key={index}>
                            <td>
                              <div>
                                <strong style={{ color: 'var(--color-navy-primary)' }}>{attempt.studentName}</strong>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                  Register No: {attempt.registerNumber.toUpperCase()}
                                </div>
                              </div>
                            </td>
                            <td>
                              <strong>{attempt.assignmentTitle}</strong>
                            </td>
                            <td>
                              <span style={{ 
                                fontWeight: '700', 
                                color: attempt.passed ? '#15803d' : '#b91c1c',
                                backgroundColor: attempt.passed ? '#dcfce7' : '#fee2e2',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.85rem'
                              }}>
                                {attempt.score} / {attempt.total} ({attempt.pct}%)
                              </span>
                            </td>
                            <td>
                              {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                            </td>
                            <td>
                              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                {new Date(attempt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to allow ${attempt.studentName} to retake this exam? This will clear their current score.`)) {
                                    try {
                                      await api.resetStudentExam(attempt.registerNumber, attempt.assignmentId);
                                      loadDashboardData();
                                    } catch (err: any) {
                                      alert(err.message || 'Failed to reset exam');
                                    }
                                  }
                                }}
                              >
                                Retake Test
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Create Exam Modal Form - Phase 1 */}
      {isModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-container animate-scale-up">
            <div className="modal-header">
              <h3>Create Assessment</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleNextToEditor}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Exam Title / Subject Chapter</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    required 
                    placeholder="e.g. Kinematics Chapter Exam" 
                    value={newExamTitle}
                    onChange={(e) => setNewExamTitle(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Number of Questions</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    required 
                    min="1" 
                    max="100" 
                    value={newExamQuestions}
                    onChange={(e) => setNewExamQuestions(Number(e.target.value))}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Due Date & Time</label>
                  <input 
                    type="datetime-local" 
                    className="input-field" 
                    required 
                    value={newExamDueDate}
                    onChange={(e) => setNewExamDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Next: Add Questions →</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
