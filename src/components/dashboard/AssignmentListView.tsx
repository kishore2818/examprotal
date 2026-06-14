import { Assignment } from '../../utils/api';
import { CheckCircle2, Calendar, CheckCircle } from 'lucide-react';

interface Props {
  classDivision: '10th' | '11th' | '12th';
  unit: string;
  assignments: Assignment[];
  onSelectAssignment: (id: string) => void;
}

export const AssignmentListView: React.FC<Props> = ({ classDivision, unit, assignments, onSelectAssignment }) => {
  const courseAssignments = assignments.filter(
    a => a.classDivision === classDivision && a.unit === unit
  );

  if (courseAssignments.length === 0) {
    return (
      <div className="empty-state animate-fade-in">
        <p>No assessments currently available for this chapter.</p>
      </div>
    );
  }

  return (
    <div className="assignments-grid animate-fade-in">
      {courseAssignments.map(assignment => (
        <div 
          key={assignment._id} 
          className={`assignment-card ${assignment.status === 'completed' ? 'completed' : ''}`}
          onClick={() => onSelectAssignment(assignment._id)}
        >
          <div className="assignment-card-header">
            <h3 className="assignment-title">{assignment.title}</h3>
            {assignment.isNew && assignment.status !== 'completed' && <span className="badge badge-new">New</span>}
            {assignment.status === 'completed' && (
              <span className="badge badge-completed">
                <CheckCircle2 size={14} /> Completed
              </span>
            )}
          </div>
          
          <div className="assignment-card-body">
            <div className="assignment-meta-list">
              <div className="meta-info">
                <Calendar size={14} />
                <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="meta-info">
                <CheckCircle size={14} />
                <span>{assignment.questionsCount} Questions</span>
              </div>
              {assignment.status === 'completed' && assignment.score !== undefined && (
                <div className="meta-info" style={{ color: 'var(--color-navy-primary)', fontWeight: 'bold' }}>
                  <span>Score: {assignment.score}/{assignment.questionsCount} ({assignment.pct}%)</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="assignment-card-footer">
            <button className="take-btn">
              {assignment.status === 'completed' ? 'Review Results' : 'Select'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
