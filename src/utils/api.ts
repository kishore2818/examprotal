export interface Question {
  id?: string;
  _id?: string;
  q: string;
  opts: string[];
  ans: number;
  exp?: string;
}

export interface Assignment {
  id?: string;
  _id: string;
  classDivision: '10th' | '11th' | '12th';
  unit: string;
  title: string;
  dueDate: string;
  questionsCount: number;
  questions: Question[];
  status: 'pending' | 'completed';
  isNew: boolean;
  score?: number;
  pct?: number;
  studentAnswers?: Record<number, number>;
}

export interface Attempt {
  assignmentId: string;
  assignmentTitle: string;
  unit: string;
  score: number;
  total: number;
  pct: number;
  passed: boolean;
  timeSpent: number;
  studentAnswers: Record<number, number>;
  date: string;
}

export interface UserGrade {
  registerNumber: string;
  studentName: string;
  exams: Attempt[];
}

export interface User {
  _id: string;
  name: string;
  registerNumber: string;
  role: 'student' | 'admin';
  classDivision: '10th' | '11th' | '12th' | 'admin';
  token: string;
}

const API_BASE = import.meta.env.PROD 
  ? 'https://examprotal-backend.onrender.com' 
  : '';

const apiFetch = (path: string, options?: RequestInit) => {
  return fetch(`${API_BASE}${path}`, options);
};

const getHeaders = () => {
  const token = localStorage.getItem('exam_portal_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }
  return res.json();
};

export const api = {
  // Auth endpoints
  async login(registerNumber: string, password: string): Promise<User> {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registerNumber, password })
    });
    const data = await handleResponse(res);
    localStorage.setItem('exam_portal_token', data.token);
    localStorage.setItem('exam_portal_user', JSON.stringify(data));
    return data;
  },

  async register(name: string, registerNumber: string, password: string): Promise<User> {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, registerNumber, password })
    });
    const data = await handleResponse(res);
    localStorage.setItem('exam_portal_token', data.token);
    localStorage.setItem('exam_portal_user', JSON.stringify(data));
    return data;
  },

  logout() {
    localStorage.removeItem('exam_portal_token');
    localStorage.removeItem('exam_portal_user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('exam_portal_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Assignment endpoints
  async getAssignments(): Promise<Assignment[]> {
    const res = await apiFetch('/api/assignments', {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getAssignmentsForAdmin(classDivision: '10th' | '11th' | '12th'): Promise<Assignment[]> {
    const res = await apiFetch(`/api/assignments/standard/${classDivision}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createAssignment(assignment: Omit<Assignment, '_id' | 'status' | 'isNew'>): Promise<Assignment> {
    const res = await apiFetch('/api/assignments', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(assignment)
    });
    return handleResponse(res);
  },

  async submitExam(
    assignmentId: string, 
    answers: Record<number, number>, 
    timeSpent: number
  ): Promise<{
    success: boolean;
    score: number;
    total: number;
    pct: number;
    passed: boolean;
    timeSpent: number;
    studentAnswers: Record<number, number>;
  }> {
    const res = await apiFetch(`/api/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ answers, timeSpent })
    });
    return handleResponse(res);
  },

  // Grades endpoints
  async getMyGrades(): Promise<UserGrade> {
    const res = await apiFetch('/api/grades/my', {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getAllGrades(): Promise<UserGrade[]> {
    const res = await apiFetch('/api/grades/admin', {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async resetStudentExam(registerNumber: string, assignmentId: string): Promise<any> {
    const res = await apiFetch(`/api/grades/admin/retake/${registerNumber}/${assignmentId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};
