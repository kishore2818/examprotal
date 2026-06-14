export interface Question {
  id: string;
  q: string;
  opts: string[];
  ans: number; // 0 for A, 1 for B, 2 for C, 3 for D
  exp?: string; // Optional explanation
}

export interface Assignment {
  id: string;
  classDivision: '10th' | '11th' | '12th';
  unit: string;
  title: string;
  dueDate: string;
  questionsCount: number;
  questions: Question[];
  status: 'pending' | 'completed';
  isNew: boolean;
  score?: number; // Store student score if completed
  pct?: number; // Store student percentage if completed
  studentAnswers?: Record<number, number>; // Stored student answers index mapping
}

export interface Attempt {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  classDivision: '10th' | '11th' | '12th';
  unit: string;
  score: number;
  total: number;
  pct: number;
  passed: boolean;
  timeSpent: number; // in seconds
  date: string;
}

export const PHYSICS_CURRICULUM: Record<'10th' | '11th' | '12th', string[]> = {
  '10th': [
    'Unit 1 — Laws of Motion',
    'Unit 2 — Optics',
    'Unit 3 — Thermal Physics',
    'Unit 4 — Electricity',
    'Unit 5 — Acoustics',
    'Unit 6 — Nuclear Physics'
  ],
  '11th': [
    'Unit 1 — Nature of Physical World and Measurement',
    'Unit 2 — Kinematics',
    'Unit 3 — Laws of Motion',
    'Unit 4 — Work, Energy and Power',
    'Unit 5 — Motion of System of Particles and Rigid Bodies',
    'Unit 6 — Gravitation',
    'Unit 7 — Properties of Matter',
    'Unit 8 — Heat and Thermodynamics',
    'Unit 9 — Kinetic Theory of Gases',
    'Unit 10 — Oscillations',
    'Unit 11 — Waves'
  ],
  '12th': [
    'Unit 1 — Electrostatics',
    'Unit 2 — Current Electricity',
    'Unit 3 — Magnetism and Magnetic Effects of Electric Current',
    'Unit 4 — Electromagnetic Induction and Alternating Current',
    'Unit 5 — Electromagnetic Waves and Wave Optics',
    'Unit 6 — Ray Optics',
    'Unit 7 — Dual Nature of Radiation and Matter',
    'Unit 8 — Atomic and Nuclear Physics',
    'Unit 9 — Semiconductor Electronics',
    'Unit 10 — Communication Systems',
    'Unit 11 — Recent Developments in Physics'
  ]
};

// Initial default assignments for demonstration
const defaultAssignments: Assignment[] = [
  {
    id: 'a1',
    classDivision: '10th',
    unit: 'Unit 1 — Laws of Motion',
    title: 'Newtonian Laws Assessment',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    questionsCount: 3,
    status: 'pending',
    isNew: true,
    questions: [
      {
        id: 'q1-1',
        q: 'Which law defines inertia?',
        opts: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Conservation of Momentum"],
        ans: 0,
        exp: "Newton's first law of motion defines inertia as the property of a body to resist changes in its state of rest or motion."
      },
      {
        id: 'q1-2',
        q: 'What is the unit of force in SI system?',
        opts: ["Joule", "Newton", "Pascal", "Watt"],
        ans: 1,
        exp: "The SI unit of force is Newton (N), named after Isaac Newton."
      },
      {
        id: 'q1-3',
        q: 'If the net force acting on an object is zero, its acceleration is:',
        opts: ["Constant", "Zero", "Increasing", "Decreasing"],
        ans: 1,
        exp: "According to Newton's second law (F = ma), if F = 0, acceleration (a) must also be zero."
      }
    ]
  },
  {
    id: 'a2',
    classDivision: '12th',
    unit: 'Unit 1 — Electrostatics',
    title: 'Coulomb\'s Law & Field lines Quiz',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    questionsCount: 2,
    status: 'pending',
    isNew: true,
    questions: [
      {
        id: 'q2-1',
        q: 'The electrostatic force between two charges is inversely proportional to:',
        opts: ["Product of charges", "Distance between charges", "Square of distance between charges", "Sum of charges"],
        ans: 2,
        exp: "Coulomb's Law states F = k*(q1*q2)/(r^2), so force is inversely proportional to the square of the distance (r^2)."
      },
      {
        id: 'q2-2',
        q: 'Electric field lines always start from:',
        opts: ["Negative charge", "Infinity", "Positive charge", "Zero potential"],
        ans: 2,
        exp: "Electric field lines originate on positive charges and terminate on negative charges."
      }
    ]
  }
];

// Local Storage Helper functions
export const getAssignmentsFromStorage = (): Assignment[] => {
  const data = localStorage.getItem('physics_assignments');
  if (!data) {
    localStorage.setItem('physics_assignments', JSON.stringify(defaultAssignments));
    return defaultAssignments;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultAssignments;
  }
};

export const saveAssignmentsToStorage = (assignments: Assignment[]) => {
  localStorage.setItem('physics_assignments', JSON.stringify(assignments));
};

export const getAttemptsFromStorage = (): Attempt[] => {
  const data = localStorage.getItem('physics_attempts');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveAttemptToStorage = (attempt: Attempt) => {
  const attempts = getAttemptsFromStorage();
  attempts.unshift(attempt);
  localStorage.setItem('physics_attempts', JSON.stringify(attempts));
};
