export interface ContactInfo {
  name: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
}

export interface BulletPoint {
  id: string;
  original: string;
  optimized: string;
  feedbackType: 'Weak Impact' | 'Missing Metrics' | 'Cluttered Structure' | 'Passive Phrasing' | 'Repetitive';
  severity: 'error' | 'warning' | 'info';
  explanation: string;
  status: 'pending' | 'applied';
  tags: string[];
}

export interface SkillsSection {
  original: string;
  optimizedCategories: {
    category: string;
    skills: string[];
  }[];
  tags: string[];
  status: 'pending' | 'applied';
}

export interface WorkExperience {
  id: string;
  role: string;
  company: string;
  period: string;
  bullets: BulletPoint[];
}

export interface ResumeData {
  id: string;
  filename: string;
  uploadedAt: string;
  contact: ContactInfo;
  summary: {
    original: string;
    optimized: string;
    status: 'pending' | 'applied';
    explanation: string;
  };
  experience: WorkExperience[];
  skills: SkillsSection;
  originalScore: number;
  currentScore: number;
  optimizedScore: number;
  subscores: {
    keywordMatch: { original: number; current: number; optimized: number };
    parsability: { original: number; current: number; optimized: number };
    impactVerbs: { original: number; current: number; optimized: number };
  };
}

export type ActiveScreen = 'dashboard' | 'analysis' | 'comparison' | 'optimizations' | 'settings';
