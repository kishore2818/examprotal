import React, { useState } from 'react';
import { QuizEngineView } from './QuizEngineView';
import { ArrowLeft, PlayCircle, Calendar, CheckCircle, Award } from 'lucide-react';
import { Assignment } from '../../utils/api';

interface Props {
  assignment: Assignment;
  onBack: () => void;
}

export const AssignmentStartView: React.FC<Props> = ({ assignment, onBack }) => {
  const [isQuizStarted, setIsQuizStarted] = useState(false);

  if (!assignment) {
    return (
      <div>
        <p>Assessment not found.</p>
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Back to Assignments</span>
        </button>
      </div>
    );
  }

  if (isQuizStarted) {
    return (
      <QuizEngineView 
        assignment={assignment} 
        onFinish={() => {
          setIsQuizStarted(false);
          onBack();
        }} 
      />
    );
  }

  const isCompleted = assignment.status === 'completed';

  return (
    <div className="assignment-start-view animate-scale-up">
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={18} />
        <span>Back to Assignments</span>
      </button>

      <div className="start-card" style={{ marginTop: '1.5rem' }}>
        <h2 className="start-title">{assignment.title}</h2>
        <div className="start-meta">
          <div className="meta-item">
            <Calendar size={20} />
            <span>Due: <strong>{new Date(assignment.dueDate).toLocaleDateString()}</strong></span>
          </div>
          <div className="meta-item">
            <CheckCircle size={20} />
            <span>Questions: <strong>{assignment.questionsCount} MCQs</strong></span>
          </div>
        </div>
        
        {isCompleted ? (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            borderRadius: '12px',
            backgroundColor: 'var(--color-blue-glow)',
            border: '1.5px solid var(--color-blue-accent)',
            textAlign: 'center'
          }}>
            <Award size={36} style={{ color: 'var(--color-blue-accent)', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>You completed this assessment!</h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Your Score: <strong>{assignment.score} / {assignment.questionsCount} ({assignment.pct}%)</strong>
            </p>
            <button 
              className="btn-primary" 
              onClick={() => setIsQuizStarted(true)}
              style={{ width: '100%' }}
            >
              Review My Answers & Explanations
            </button>
          </div>
        ) : (
          <>
            <div className="start-instructions">
              <h3>Instructions</h3>
              <ul>
                <li>Ensure you have a stable internet connection before starting.</li>
                <li>There is no time limit for this timed MCQ assessment. Take your time.</li>
                <li>Explanations will be shown for each question after submission.</li>
              </ul>
            </div>

            <button 
              className="btn-primary start-action-btn" 
              onClick={() => setIsQuizStarted(true)}
            >
              <PlayCircle size={24} />
              <span>Start MCQ Assessment Now</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
