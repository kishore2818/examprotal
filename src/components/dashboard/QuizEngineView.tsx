import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { api, Assignment } from '../../utils/api';

interface Props {
  assignment: Assignment;
  onFinish: () => void;
}

export const QuizEngineView: React.FC<Props> = ({ assignment, onFinish }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    // If studentAnswers is passed as Map, convert or read directly
    return assignment.studentAnswers || {};
  });
  const [isSubmitted, setIsSubmitted] = useState(() => assignment.status === 'completed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Stopwatch
  const [elapsedTime, setElapsedTime] = useState(0);

  // Swipe Gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
  };

  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const questions = assignment.questions || [];
  const totalQuestions = questions.length;
  
  if (totalQuestions === 0) {
    return (
      <div className="empty-state">
        <p>No questions found in this assessment.</p>
        <button className="btn-primary" onClick={onFinish}>Return</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted || isSubmitting) return; // Read-only once submitted
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm(
        `You have only answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    } else {
      const confirmSubmit = window.confirm("Are you sure you want to submit your exam?");
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);

    try {
      await api.submitExam(assignment._id, answers, elapsedTime);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      alert(err.message || 'Failed to submit exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Render Result view
  if (isSubmitted) {
    let correct = assignment.score !== undefined ? assignment.score : 0;
    if (assignment.score === undefined || Object.keys(answers).length > 0) {
      let calcCorrect = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.ans) calcCorrect++;
      });
      correct = calcCorrect;
    }
    const pct = assignment.score !== undefined && assignment.pct !== undefined && Object.keys(answers).length === 0
      ? assignment.pct 
      : Math.round((correct / totalQuestions) * 100);
    const passed = pct >= 40;

    return (
      <div className="quiz-result-view animate-fade-in">
        {/* Result Header */}
        <header className="exam-header" style={{
          backgroundColor: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-light)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-navy-primary)', margin: 0 }}>Review Results</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{assignment.title}</span>
          </div>
          <button 
            className="btn-secondary" 
            onClick={onFinish}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            ← Exit
          </button>
        </header>

        <div className="result-main-card">
          <div className={`result-score-circle ${passed ? 'passed' : 'failed'}`}>
            <span className="result-score-pct">{pct}%</span>
            <span className="result-score-lbl">Score</span>
          </div>

          <h2 className="result-title">
            {passed ? 'Assessment Completed! 🎉' : 'Needs Practice 📚'}
          </h2>
          <p className={`result-badge ${passed ? 'passed' : 'failed'}`}>
            {passed ? '✓ PASSED (min. 40% required)' : '✗ NOT PASSED — Review and try again'}
          </p>

          <div className="result-stats-grid">
            <div className="result-stat-card">
              <div className="result-stat-val">{correct}</div>
              <div className="result-stat-lbl">Correct</div>
            </div>
            <div className="result-stat-card">
              <div className="result-stat-val">{totalQuestions - correct}</div>
              <div className="result-stat-lbl">Wrong</div>
            </div>
            {elapsedTime > 0 && (
              <div className="result-stat-card">
                <div className="result-stat-val">{formatTime(elapsedTime)}</div>
                <div className="result-stat-lbl">Time Spent</div>
              </div>
            )}
          </div>
        </div>

        {/* Answer Key Grid */}
        <div className="result-review-card">
          <h3 className="result-section-title">Answer Key Grid</h3>
          <div className="answer-key-grid">
            {questions.map((q, idx) => {
              const ua = answers[idx];
              const isCorrect = ua === q.ans;
              const letter = ['A', 'B', 'C', 'D'][q.ans];
              const uaLetter = ua !== undefined ? ['A', 'B', 'C', 'D'][ua] : '—';
              
              return (
                <div 
                  key={idx} 
                  className={`answer-key-cell ${isCorrect ? 'correct' : ua === undefined ? 'unanswered' : 'incorrect'}`}
                  onClick={() => setCurrentQuestionIndex(idx)}
                >
                  <div className="answer-key-cell-num">Q{idx + 1}</div>
                  <div className="answer-key-cell-letter">
                    {letter}
                  </div>
                  {ua !== undefined && !isCorrect && (
                    <div className="answer-key-cell-ua">
                      {uaLetter}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed MCQ Review */}
        <div className="result-review-card">
          <h3 className="result-section-title">Detailed Questions Review</h3>
          
          <div className="result-detailed-review">
            {questions.map((q, idx) => {
              const ua = answers[idx];
              const isCorrect = ua === q.ans;
              
              return (
                <div 
                  key={idx} 
                  className="result-review-item"
                  style={{
                    borderBottom: idx === totalQuestions - 1 ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  <div className="result-review-header">
                    <span className="result-review-counter">
                      Question {idx + 1} of {totalQuestions}
                    </span>
                    <span className={`result-review-status ${isCorrect ? 'correct' : ua === undefined ? 'unanswered' : 'incorrect'}`}>
                      {isCorrect ? 'Correct' : ua === undefined ? 'Not Answered' : 'Wrong'}
                    </span>
                  </div>

                  <p className="result-review-qtext">
                    {q.q}
                  </p>

                  <div className="result-review-options-list">
                    {q.opts.map((opt, optIdx) => {
                      const isOptionCorrect = optIdx === q.ans;
                      const isOptionSelected = optIdx === ua;
                      
                      return (
                        <div 
                          key={optIdx} 
                          className={`result-review-opt ${isOptionCorrect ? 'correct' : isOptionSelected && !isCorrect ? 'selected-incorrect' : ''}`}
                        >
                          <span className={`result-review-opt-letter ${isOptionCorrect ? 'correct' : isOptionSelected ? 'selected' : ''}`}>
                            {['A', 'B', 'C', 'D'][optIdx]}
                          </span>
                          <span className="result-review-opt-text">{opt}</span>
                          {isOptionCorrect && <span className="result-review-opt-status correct">Correct Answer</span>}
                          {isOptionSelected && !isCorrect && <span className="result-review-opt-status incorrect">Your Answer</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.exp && (
                    <div className="result-review-explanation">
                      <strong className="result-review-explanation-title">Explanation:</strong>
                      <p className="result-review-explanation-text">{q.exp}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button className="btn-primary" onClick={onFinish} style={{ width: '100%', padding: '1rem' }}>
          Finish and Return to Assessments
        </button>
      </div>
    );
  }

  return (
    <div 
      className="quiz-engine-container animate-fade-in" 
      style={{ maxWidth: '800px', margin: '0 auto' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Quiz Header */}
      <header className="exam-header" style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            type="button"
            onClick={() => {
              if (window.confirm("Are you sure you want to exit the exam? Your progress will not be saved.")) {
                onFinish();
              }
            }} 
            className="btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            ← Exit
          </button>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-navy-primary)', margin: 0 }}>{assignment.title}</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {assignment.unit} · Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-navy-primary)' }}>
          <Clock size={18} />
          <span>{formatTime(elapsedTime)}</span>
        </div>
      </header>

      {/* Answer Selector Bubbles */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {questions.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentQuestionIndex(idx)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.85rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.15s',
                backgroundColor: currentQuestionIndex === idx 
                  ? 'var(--color-navy-primary)' 
                  : answers[idx] !== undefined 
                    ? 'var(--color-navy-medium)' 
                    : 'white',
                color: currentQuestionIndex === idx || answers[idx] !== undefined ? 'white' : 'var(--text-main)',
                borderColor: currentQuestionIndex === idx ? 'var(--color-navy-primary)' : '#cbd5e1'
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Main Question Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-light)'
      }}>
        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-blue-accent)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
        
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '2rem', lineHeight: '1.5', color: '#1e293b' }}>
          {currentQuestion.q}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentQuestion.opts.map((opt, optIdx) => {
            const isSelected = answers[currentQuestionIndex] === optIdx;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(optIdx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid var(--color-blue-accent)' : '1px solid #cbd5e1',
                  backgroundColor: isSelected ? 'var(--color-blue-glow)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  gap: '1rem',
                  width: '100%'
                }}
              >
                <span style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  backgroundColor: isSelected ? 'var(--color-blue-accent)' : '#f1f5f9',
                  color: isSelected ? 'white' : 'var(--text-muted)',
                  border: '1px solid #cbd5e1'
                }}>
                  {['A', 'B', 'C', 'D'][optIdx]}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: '500', color: '#334155' }}>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nav Controls */}
      <div className="quiz-nav-controls">
        <button 
          type="button" 
          className="btn-secondary quiz-nav-btn" 
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
        >
          ← Previous
        </button>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <button 
            type="button" 
            className="submit-btn publish-exam-btn quiz-nav-btn submit-quiz-btn" 
            onClick={handleSubmit}
          >
            Submit Exam ✓
          </button>
        ) : (
          <button 
            type="button" 
            className="btn-primary quiz-nav-btn" 
            onClick={handleNext}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
};
