import React, { useState, useEffect, FormEvent } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Sparkles, 
  Settings as SettingsIcon, 
  HelpCircle, 
  Bell, 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  UploadCloud, 
  RefreshCw, 
  Info, 
  Sparkle, 
  Check, 
  ExternalLink,
  ChevronRight,
  LogOut,
  HelpCircle as SupportIcon,
  X,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { SAMPLE_RESUMES } from './data';
import { ResumeData, ActiveScreen, BulletPoint } from './types';

export const bulletIdToStarQuestion = (bulletId: string, roleName: string): string => {
  const defaultQ = `Describe a challenging scenario where you had to perform key responsibilities as a ${roleName}. How did you measure performance?`;
  const dictionary: Record<string, string> = {
    'bull-se-1': `Tell me about a time you designed or implemented web APIs or backend infrastructure. How did you optimize for high-concurrency scale or sub-100ms latency?`,
    'bull-se-2': `Give me an example of managing standard database migrations or resolving high query latency. How did you secure schema integrity under load?`,
    'bull-se-3': `Describe a collaborative team development project where you partnered across front-end and back-end platforms within Agile sprints. How did you track sprint completion?`,
    'bull-pm-1': `Tell me about a high-fidelity mobile application features launch where you gathered user feedback. How did you structure development sprints or scale retention?`,
    'bull-pm-2': `Describe a scenario where you negotiated trade-offs with stakeholders or engineers to direct roadmap milestones on a tight budget.`,
    'bull-pm-3': `Give me an example of where you analyzed telemetry metrics to evaluate a feature's performance and present growth opportunities to product executives.`
  };
  return dictionary[bulletId] || defaultQ;
};

// Utility helper to extract meaningful keywords from target job description
export const getJobKeywords = (jobDesc: string): string[] => {
  if (!jobDesc || !jobDesc.trim()) return [];
  const stopwords = new Set([
    'with', 'this', 'that', 'they', 'then', 'from', 'have', 'more', 'your', 'about',
    'will', 'each', 'their', 'some', 'other', 'been', 'were', 'also', 'than', 'into',
    'them', 'good', 'best', 'work', 'join', 'team', 'highly', 'experience', 'years',
    'role', 'skills', 'responsibilities', 'minimum', 'preferred', 'required', 'ideal',
    'candidate', 'must', 'have', 'ability', 'knowledge', 'understanding', 'working',
    'using', 'familiarity', 'strong', 'excellent', 'development', 'design', 'building',
    'tools', 'technologies', 'platforms', 'applications', 'solutions', 'highly', 'ability',
    'successful', 'skills', 'experience', 'written', 'verbal', 'communication', 'track',
    'record', 'degree', 'computer', 'science', 'field', 'including', 'key', 'job', 'position'
  ]);
  
  // Replace punctuation, split into words, remove empty items, filter by length and stopwords
  const cleanDesc = jobDesc.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ');
  const words = cleanDesc.split(/\s+/);
  
  const keywords = Array.from(new Set(words))
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !stopwords.has(w) && isNaN(Number(w)));
    
  return keywords;
};

export default function App() {
  // Navigation states
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('SoftwareEngineer_2023.pdf');
  const [resumes, setResumes] = useState<Record<string, ResumeData>>(SAMPLE_RESUMES);
  
  // Custom API sandbox states
  const [customBulletInput, setCustomBulletInput] = useState<string>('');
  const [customBulletRole, setCustomBulletRole] = useState<string>('Senior Software Engineer');
  const [apiOptimizing, setApiOptimizing] = useState<boolean>(false);
  const [customOptimizedResult, setCustomOptimizedResult] = useState<any>(null);
  
  // UI helper states
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [hasServerApiKey, setHasServerApiKey] = useState<boolean | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [simulatedDropFile, setSimulatedDropFile] = useState<boolean>(false);

  // User Authentication & Live Session States
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Drag over states & upload states
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Persistent Settings States
  const [targetJobDescription, setTargetJobDescription] = useState<string>(() => {
    return localStorage.getItem('settings_targetJobDescription') || '';
  });
  const [enforceStrictATS, setEnforceStrictATS] = useState<boolean>(() => {
    const val = localStorage.getItem('settings_enforceStrictATS');
    return val !== null ? val === 'true' : true;
  });
  const [autoIncludeMetrics, setAutoIncludeMetrics] = useState<boolean>(() => {
    const val = localStorage.getItem('settings_autoIncludeMetrics');
    return val !== null ? val === 'true' : true;
  });
  const [suggestKeywordsMatch, setSuggestKeywordsMatch] = useState<boolean>(() => {
    const val = localStorage.getItem('settings_suggestKeywordsMatch');
    return val !== null ? val === 'true' : true;
  });
  const [selectedAIModel, setSelectedAIModel] = useState<string>(() => {
    return localStorage.getItem('settings_selectedAIModel') || 'gemini-3.5-flash';
  });

  // Advance Portfolio Features States
  const [resumeViewerMode, setResumeViewerMode] = useState<'recruiter' | 'ats'>('recruiter');
  const [expandedStarCoachId, setExpandedStarCoachId] = useState<string | null>(null);
  const [starCoachResponseMap, setStarCoachResponseMap] = useState<Record<string, string>>({});
  const [starCoachGrades, setStarCoachGrades] = useState<Record<string, { rating: 'Strong' | 'Average' | 'Needs Improvement'; score: number; feedback: string; verbDensity: string; metricCount: number }>>({});

  // Interactive Notifications states
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; timestamp: string; read: boolean }>>(() => {
    const cached = localStorage.getItem('app_notifications');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: 'notif-1',
        title: 'Welcome to ResumeAI! 👋',
        message: 'Optimize your skills matrix, target metrics, or paste a custom Target Job Description in Settings to scan gaps.',
        timestamp: 'Just now',
        read: false
      },
      {
        id: 'notif-2',
        title: 'ATS Parser Update',
        message: 'Parser engine upgraded to v1.4.2 with deep keyword density analysis support.',
        timestamp: '1 hour ago',
        read: false
      }
    ];
  });

  // Track notifications to localStorage
  useEffect(() => {
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Helper to add interactive notification
  const addNotification = (title: string, message: string) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Automated STAR interviewer practice responder evaluation algorithm
  const handleGradeStarResponse = (bulletId: string, userText: string) => {
    if (!userText || userText.trim().length < 12) {
      triggerToast("Practice response is too short to parse properly. Elaborate more!");
      return;
    }

    const trimmed = userText.toLowerCase().trim();
    
    // Heuristics:
    // 1. Check for active verbs
    const actionVerbs = ['designed', 'implemented', 'launched', 'solved', 'orchestrated', 'built', 'created', 'optimized', 'managed', 'developed', 'led', 'delivered', 'partnered', 'reduced', 'increased', 'engineered', 'analyzed', 'migrated', 'resolved'];
    const matchedVerbs = actionVerbs.filter(verb => trimmed.includes(verb));
    
    // 2. Check for quantitative metrics
    const numberRegex = /\b\d+(?:%|\+)?\b/g;
    const numbersFound = trimmed.match(numberRegex) || [];
    
    // Score compilation out of 100
    let rating: 'Strong' | 'Average' | 'Needs Improvement' = 'Needs Improvement';
    let score = 30;
    
    // Increment based on verbal metrics
    score += Math.min(matchedVerbs.length * 12, 35);
    // Increment based on quantitative elements
    score += Math.min(numbersFound.length * 15, 35);
    
    if (userText.length > 80) score += 10;
    if (userText.length > 150) score += 10;

    score = Math.min(score, 100);
    
    if (score >= 75 && numbersFound.length > 0 && matchedVerbs.length > 0) {
      rating = 'Strong';
    } else if (score >= 50) {
      rating = 'Average';
    }
    
    // Generate helpful custom feedback
    let feedback = "";
    if (rating === 'Strong') {
      feedback = "Outstanding behavioral impact! You have successfully detailed concrete actions using robust operational vocabulary and precisely quantified metrics to back your outcomes.";
    } else if (rating === 'Average') {
      feedback = "Good foundation. You have outlined the core achievements, but try to use descriptive power-verbs and add more specific performance percentages or dollar scopes.";
    } else {
      feedback = "Needs expansion. Ensure you articulate the 'Action' (what you personally engineered) and 'Result' (concrete numbers, cost savings, response time reductions) to satisfy ATS and hiring panel standards.";
    }
    
    setStarCoachGrades(prev => ({
      ...prev,
      [bulletId]: {
        rating,
        score,
        feedback,
        verbDensity: matchedVerbs.length > 0 ? matchedVerbs.slice(0, 3).join(', ') : 'None detected',
        metricCount: numbersFound.length
      }
    }));
    
    triggerToast(`Analyzed! Grade rating: ${rating} (${score}/100)`);
    addNotification(
      'STAR Coach Evaluated',
      `Graded practice response for bullet point prep. Score achieved: ${score}% (${rating})`
    );
  };

  // Listen for target job description keyword extraction updates dynamically
  useEffect(() => {
    if (!targetJobDescription.trim()) return;
    const timer = setTimeout(() => {
      const kws = getJobKeywords(targetJobDescription);
      if (kws.length > 0) {
        addNotification(
          "Job Match Scanned",
          `Extracted ${kws.length} technology and business outcome keywords from target description.`
        );
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [targetJobDescription]);

  // Listen for AI model selection change to alert user
  const isFirstModelRef = React.useRef(true);
  useEffect(() => {
    if (isFirstModelRef.current) {
      isFirstModelRef.current = false;
      return;
    }
    addNotification("AI Model Switcher", `Optimizations re-targeted for heavy analysis using ${selectedAIModel}.`);
  }, [selectedAIModel]);

  // Active loaded resume details
  const currentResume = resumes[selectedResumeId] || resumes['SoftwareEngineer_2023.pdf'];

  // Check backend server health and API Key status on load
  useEffect(() => {
    fetch("/api/health")
      .then(res => res.json())
      .then(data => {
        setHasServerApiKey(data.hasApiKey);
      })
      .catch(() => {
        setHasServerApiKey(false); // local or dev standard
      });
  }, []);

  // Sync user profile & custom uploaded resumes when matching session changes
  useEffect(() => {
    if (!token) return;
    
    fetch("/api/resumes", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          handleLogout();
          return [];
        }
        return res.json();
      })
      .then((data: ResumeData[]) => {
        if (data && data.length > 0) {
          const fetchedMap: Record<string, ResumeData> = {};
          data.forEach(r => {
            fetchedMap[r.filename] = r;
          });
          setResumes(prev => ({
            ...prev,
            ...fetchedMap
          }));
          // Switch to their newly fetched resume structure (most recently uploaded)
          setSelectedResumeId(data[data.length - 1].filename);
        }
      })
      .catch(err => {
        console.error("Failed to sync registered user documents:", err);
      });
  }, [token]);

  // Handle local JWT parsing for header avatar representations
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.userId, email: payload.email });
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    triggerToast("Logged out successfully.");
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      triggerToast("Input parameters cannot be blank.");
      return;
    }
    setAuthLoading(true);
    const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setIsAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      triggerToast(authTab === 'login' ? `Welcome back, ${data.user.email}!` : "Secure worldwide account registered!");
    } catch (err: any) {
      triggerToast(err.message || "Failed to reach servers.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Real Multi-Part PDF & TXT File Selection suggests dynamic rewrite
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const filenameLower = file.name.toLowerCase();
    if (!filenameLower.endsWith('.pdf') && !filenameLower.endsWith('.txt')) {
      triggerToast("Invalid format. We accept PDF and TXT text files.");
      return;
    }

    setIsUploading(true);
    triggerToast(`Scoring and formatting options matching Gemini models...`);

    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        headers,
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to extract text data suggestions.");
      }

      setResumes(prev => ({
        ...prev,
        [data.filename]: data
      }));

      setSelectedResumeId(data.filename);
      setActiveScreen('analysis');
      triggerToast(`Dynamic suggestions compiled for: ${data.filename}`);
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Suggestions processing failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // Show quick temporary feedback messages
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Switch resumes cleanly
  const handleSelectResume = (id: string, screen: ActiveScreen = 'analysis') => {
    setSelectedResumeId(id);
    setActiveScreen(screen);
    triggerToast(`Loaded resume: ${id}`);
    addNotification('Career Track Loaded', `Switched active analysis profile to: ${id}`);
  };

  // Handle active fix merge (magical merging animation)
  const applyFix = (targetType: 'summary' | 'experience' | 'skills', targetId?: string) => {
    const updatedResumes = { ...resumes };
    const resume = updatedResumes[selectedResumeId];

    if (!resume) return;

    if (targetType === 'summary') {
      if (resume.summary.status === 'applied') return;
      resume.summary.status = 'applied';
      resume.currentScore = Math.min(resume.optimizedScore, resume.currentScore + 10);
      resume.subscores.impactVerbs.current = Math.min(resume.subscores.impactVerbs.optimized, resume.subscores.impactVerbs.current + 15);
      triggerToast("Summarized text optimized and applied!");
      addNotification('Summary Optimized ✨', 'Merged AI-approved active verb & outcome metrics into career summary.');
    } else if (targetType === 'skills') {
      if (resume.skills.status === 'applied') return;
      resume.skills.status = 'applied';
      resume.currentScore = Math.min(resume.optimizedScore, resume.currentScore + 8);
      resume.subscores.parsability.current = Math.min(resume.subscores.parsability.optimized, resume.subscores.parsability.current + 12);
      triggerToast("Structured skills categorized format applied!");
      addNotification('Skills Matrix Formatted 🏷️', 'Successfully generated dynamic ATS-compliant skills categories.');
    } else if (targetType === 'experience' && targetId) {
      let bulletName = "";
      resume.experience = resume.experience.map(exp => {
        const updatedBullets = exp.bullets.map(b => {
          if (b.id === targetId && b.status === 'pending') {
            b.status = 'applied';
            resume.currentScore = Math.min(resume.optimizedScore, resume.currentScore + 10);
            resume.subscores.keywordMatch.current = Math.min(resume.subscores.keywordMatch.optimized, resume.subscores.keywordMatch.current + 15);
            triggerToast("Experience metrics and active verb corrections applied!");
            bulletName = exp.role;
          }
          return b;
        });
        return { ...exp, bullets: updatedBullets };
      });
      if (bulletName) {
        addNotification('Experience Bullet Optimized 📈', `Applied quantified metric updates to ${bulletName} position.`);
      }
    }

    setResumes(updatedResumes);
  };

  // Custom live bullet optimization using real Gemini backend API
  const handleCustomBulletOptimize = async (e: FormEvent) => {
    e.preventDefault();
    if (!customBulletInput.trim()) return;

    setApiOptimizing(true);
    setCustomOptimizedResult(null);

    try {
      const response = await fetch("/api/optimize-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet: customBulletInput.trim(),
          role: customBulletRole,
        }),
      });

      const result = await response.json();
      setCustomOptimizedResult(result);
      triggerToast("Gemini model optimization complete!");
    } catch (err) {
      console.error(err);
      triggerToast("API call failed. Used smart local enhancement.");
    } finally {
      setApiOptimizing(false);
    }
  };

  // Apply a custom optimized bullet as an addition to the active resume list
  const applyCustomBulletToActiveResume = () => {
    if (!customOptimizedResult) return;

    const updatedResumes = { ...resumes };
    const resume = updatedResumes[selectedResumeId];

    if (!resume || resume.experience.length === 0) {
      triggerToast("Please switch to an editable resume template first.");
      return;
    }

    const newBullet: BulletPoint = {
      id: `custom-bull-${Date.now()}`,
      original: customBulletInput,
      optimized: customOptimizedResult.optimized,
      feedbackType: customOptimizedResult.feedbackType || 'Missing Metrics',
      severity: 'warning',
      explanation: customOptimizedResult.explanation || 'Custom user insertion via the Interactive Sandbox.',
      status: 'applied', // applied immediately
      tags: customOptimizedResult.tags || ['Custom Enhanced', 'Sandbox AI']
    };

    resume.experience[0].bullets.push(newBullet);
    resume.currentScore = Math.min(98, resume.currentScore + 4);
    
    setResumes(updatedResumes);
    setCustomBulletInput('');
    setCustomOptimizedResult(null);
    setActiveScreen('analysis');
    triggerToast("Injected custom AI rewritten bullet directly into resume workload!");
  };

  // Download printable copy helper
  const handleDownloadDraft = () => {
    try {
      const doc = new jsPDF({ format: 'a4', unit: 'mm' });
      let y = 20;

      const addPageIfNeeded = (requiredHeight: number) => {
        if (y + requiredHeight > 275) {
          doc.addPage();
          y = 20;
        }
      };

      // 1. Candidate Name (Bold, Centered)
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(33, 33, 33);
      doc.text(currentResume.contact.name, 105, y, { align: 'center' });
      y += 8;

      // 2. Contact info (Centered below Name)
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      const contactParts = [];
      if (currentResume.contact.location) contactParts.push(currentResume.contact.location);
      if (currentResume.contact.email) contactParts.push(currentResume.contact.email);
      if (currentResume.contact.phone) contactParts.push(currentResume.contact.phone);
      if (currentResume.contact.linkedin) contactParts.push(currentResume.contact.linkedin);
      
      const contactStr = contactParts.join('  |  ');
      doc.text(contactStr, 105, y, { align: 'center' });
      y += 10;

      // Draw a clean horizontal rule divider line below contact block
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.2);
      doc.line(20, y, 190, y);
      y += 8;

      // 3. Summary section
      const summaryText = currentResume.summary.status === 'applied' 
        ? currentResume.summary.optimized 
        : currentResume.summary.original;

      if (summaryText && summaryText.trim() !== '') {
        addPageIfNeeded(15);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text("PROFESSIONAL SUMMARY", 20, y);
        y += 5;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const splitSummary = doc.splitTextToSize(summaryText, 170);
        const linesCount = splitSummary.length;
        addPageIfNeeded(linesCount * 5.5);
        doc.text(splitSummary, 20, y);
        y += (linesCount * 5.2) + 8;
      }

      // 4. Experience section
      if (currentResume.experience && currentResume.experience.length > 0) {
        addPageIfNeeded(15);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text("PROFESSIONAL EXPERIENCE", 20, y);
        y += 5;

        for (const job of currentResume.experience) {
          addPageIfNeeded(12);
          
          // Role & Company Bold (Left-aligned)
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(33, 33, 33);
          const jobHeader = `${job.role}  |  ${job.company}`;
          doc.text(jobHeader, 20, y);

          // Period (Right-aligned)
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(110, 110, 110);
          doc.text(job.period, 190, y, { align: 'right' });
          y += 6;

          // Bullets
          for (const bullet of job.bullets) {
            const bulletText = bullet.status === 'applied' ? bullet.optimized : bullet.original;
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);

            const wrappedBullet = doc.splitTextToSize(bulletText, 162);
            const bulletLines = wrappedBullet.length;

            addPageIfNeeded((bulletLines * 5.2) + 3);

            // Bullet marker (bullet point icon)
            doc.setFillColor(100, 100, 100);
            doc.circle(23, y - 1, 0.6, 'F');

            // Actual bullet text (indented to x=28)
            doc.text(wrappedBullet, 28, y);
            y += (bulletLines * 5.2) + 1.8;
          }
          y += 3; // Space between jobs
        }
        y += 5;
      }

      // 5. Skills section
      addPageIfNeeded(15);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text("CORE SKILLS & TECHNOLOGIES", 20, y);
      y += 5;

      if (currentResume.skills.status === 'applied' && currentResume.skills.optimizedCategories) {
        for (const cat of currentResume.skills.optimizedCategories) {
          addPageIfNeeded(10);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(33, 33, 33);
          const catLabel = `${cat.category}: `;
          doc.text(catLabel, 20, y);
          
          const labelWidth = doc.getTextWidth(catLabel);
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          
          const skillsList = cat.skills.join(', ');
          const wrappedSkills = doc.splitTextToSize(skillsList, 170 - labelWidth);
          doc.text(wrappedSkills, 20 + labelWidth, y);
          
          const catLines = wrappedSkills.length;
          y += (catLines * 5.2) + 1.5;
        }
      } else {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const originalSkills = currentResume.skills.original;
        const wrappedOriginal = doc.splitTextToSize(originalSkills, 170);
        const originalLines = wrappedOriginal.length;
        addPageIfNeeded(originalLines * 5.5);
        doc.text(wrappedOriginal, 20, y);
        y += (originalLines * 5.2) + 3;
      }

      const safeFilename = `${currentResume.contact.name.replace(/\s+/g, '_')}_Resume_Optimized.pdf`;
      doc.save(safeFilename);
      triggerToast(`Fidelity PDF downloaded successfully: ${safeFilename}`);
    } catch (err: any) {
      console.error("PDF download crashed:", err);
      triggerToast(`PDF compilation failed: ${err.message}`);
    }
  };

  // Download printable Word Document copy helper
  const handleDownloadDocx = () => {
    try {
      const resume = currentResume;
      const summaryText = resume.summary.status === 'applied' ? resume.summary.optimized : resume.summary.original;
      
      let experienceHtml = '';
      resume.experience.forEach(job => {
        let bulletsHtml = '';
        job.bullets.forEach(b => {
          const bText = b.status === 'applied' ? b.optimized : b.original;
          bulletsHtml += `<li style="margin-bottom: 6px; text-align: left;">${bText}</li>`;
        });
        experienceHtml += `
          <div style="margin-bottom: 20px; font-family: Arial, sans-serif;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
              <tr>
                <td style="font-weight: bold; font-size: 11.5pt; color: #1a1a1a; text-align: left;">
                  ${job.role} <span style="font-weight: normal; color: #555555;">at</span> ${job.company}
                </td>
                <td style="text-align: right; font-size: 10pt; color: #666666; font-weight: bold;">
                  ${job.period}
                </td>
              </tr>
            </table>
            <ul style="margin-top: 4px; margin-bottom: 4px; padding-left: 20px; font-size: 10pt; color: #444444; line-height: 1.5;">
              ${bulletsHtml}
            </ul>
          </div>
        `;
      });

      let skillsHtml = '';
      if (resume.skills.status === 'applied' && resume.skills.optimizedCategories) {
        resume.skills.optimizedCategories.forEach(cat => {
          skillsHtml += `
            <p style="font-size: 10pt; font-family: Arial, sans-serif; margin: 6px 0; color: #444444; text-align: left;">
              <strong>${cat.category}:</strong> ${cat.skills.join(', ')}
            </p>
          `;
        });
      } else {
        skillsHtml += `
          <p style="font-size: 10pt; font-family: Arial, sans-serif; margin: 6px 0; color: #444444; text-align: left;">
            ${resume.skills.original}
          </p>
        `;
      }

      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <title>${resume.contact.name} - Optimized Resume</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: 8.5in 11in;
              margin: 0.85in 0.85in 0.85in 0.85in;
              mso-header-margin: 0.5in;
              mso-footer-margin: 0.5in;
              mso-paper-source: 0;
            }
            body { 
              font-family: Arial, sans-serif; 
              color: #333333; 
              line-height: 1.4;
            }
            h1 { 
              font-size: 22pt; 
              text-align: center; 
              margin-top: 0px;
              margin-bottom: 4px; 
              color: #111111;
              font-family: Arial, sans-serif;
            }
            .contact-info { 
              text-align: center; 
              font-size: 9.5pt; 
              color: #666666; 
              margin-bottom: 24px; 
              font-family: Arial, sans-serif;
            }
            h2 { 
              font-size: 12pt; 
              font-family: Arial, sans-serif;
              border-bottom: 1px solid #dcdcdc; 
              padding-bottom: 4px; 
              margin-top: 26px; 
              margin-bottom: 12px; 
              text-transform: uppercase; 
              color: #1a1a1a; 
              letter-spacing: 0.5px;
            }
            p { 
              font-size: 10pt; 
              font-family: Arial, sans-serif;
              color: #444444;
              line-height: 1.5; 
              margin-top: 0px; 
              margin-bottom: 8px;
              text-align: left;
            }
          </style>
        </head>
        <body style="tab-interval:.5in">
          <div style="margin: 0 auto; max-width: 6.8in;">
            <h1>${resume.contact.name}</h1>
            <div class="contact-info">
              ${[
                resume.contact.location,
                resume.contact.email,
                resume.contact.phone,
                resume.contact.linkedin
              ].filter(Boolean).join('  |  ')}
            </div>
            
            <h2>Professional Summary</h2>
            <p>${summaryText}</p>
            
            <h2>Professional Experience</h2>
            ${experienceHtml}
            
            <h2>Core Skills & Technologies</h2>
            ${skillsHtml}
          </div>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const downloadName = `${resume.contact.name.replace(/\s+/g, '_')}_Resume_Optimized.doc`;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast(`Fidelity Word (.doc) downloaded successfully: ${downloadName}`);
    } catch (docxErr: any) {
      console.error("Word download failed:", docxErr);
      triggerToast(`Word Document generation failed: ${docxErr.message}`);
    }
  };

  return (
    <div id="app-root" className="bg-background text-on-background font-sans h-screen flex overflow-hidden relative">
      
      {/* Dynamic Cosmic Ambient Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute top-[10%] left-[20%] w-[450px] h-[450px] rounded-full bg-brand-primary/10 blur-[130px] animate-float-orb-1" />
        <div className="absolute bottom-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-brand-success/5 blur-[140px] animate-float-orb-2" />
        <div className="absolute top-[40%] right-[30%] w-[380px] h-[380px] rounded-full bg-indigo-500/10 blur-[110px] animate-float-orb-3" />
        
        {/* Fine-grained tech checkerboard alignment grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* 1. TOAST NOTIFICATION BANNER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-surface-container border border-brand-primary p-4 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-brand-success animate-pulse" />
            <span className="text-sm font-medium text-on-surface font-sans">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. PREMIUM UPGRADE MODAL */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-container border border-outline-variant p-8 rounded-2xl max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                  <Sparkle className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <h3 className="text-2xl font-bold">ResumeAI Pro Premium</h3>
              </div>
              
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Unlock unrestricted AI edits, direct real-time Google Docs integration, infinite PDF exports, and precise matching against leading corporate applicant tracking systems (Workday, Greenhouse, Lever).
              </p>

              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-brand-success" />
                  <span>Uncapped server-side Gemini 3.5 API access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-brand-success" />
                  <span>Custom job description keyword matching engine</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-brand-success" />
                  <span>Export directly to raw Word (.docx) and PDF</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-brand-success" />
                  <span>Interactive skills categorizer &amp; soft-skill cleanser</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">$12</span>
                <span className="text-on-surface-variant text-sm">/ month billed annually</span>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setShowUpgradeModal(false);
                    triggerToast("Mock premium subscription initiated successfully!");
                  }}
                  className="flex-1 py-3 px-4 bg-brand-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity active:scale-95 duration-100"
                >
                  Activate Pro Access
                </button>
                <button 
                  onClick={() => setShowUpgradeModal(false)}
                  className="py-3 px-5 border border-outline bg-surface-container-low rounded-xl text-sm font-medium hover:bg-surface-variant transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. SIDE SIDEBAR (DESKTOP) */}
      <nav id="desktop-sidebar" className="bg-surface-container/60 backdrop-blur-2xl border-r border-outline-variant h-screen w-64 fixed left-0 top-0 hidden md:flex flex-col p-4 gap-2 z-50">
        <div className="px-4 py-6 flex flex-col gap-1 border-b border-outline-variant mb-4">
          <h1 className="text-2xl font-bold text-brand-primary flex items-center gap-2 font-sans tracking-tight">
            ResumeAI Pro
          </h1>
          <p className="text-xs text-on-surface-variant tracking-wider font-mono font-medium brightness-90">
            AI-Powered Career Hub
          </p>
        </div>

        <div className="flex-1 flex flex-col gap-1.5 focus-target-sidebar">
          {/* Dashboard Item */}
          <button 
            id="tab-dashboard-btn"
            onClick={() => setActiveScreen('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left ${activeScreen === 'dashboard' ? 'bg-brand-primary text-white font-bold shadow-lg shadow-brand-primary/10' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>

          {/* My Resumes Item (routes directly to active resume's analysis) */}
          <button 
            id="tab-resumes-btn"
            onClick={() => handleSelectResume(selectedResumeId, 'analysis')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left ${activeScreen === 'analysis' ? 'bg-brand-primary/25 text-on-surface border border-brand-primary/30 font-bold' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm font-medium">AI Analysis</span>
          </button>

          {/* ATS Comparison Item */}
          <button 
            id="tab-comparison-btn"
            onClick={() => setActiveScreen('comparison')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left ${activeScreen === 'comparison' ? 'bg-brand-primary/25 text-on-surface border border-brand-primary/30 font-bold' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm font-medium">ATS Comparison</span>
          </button>

          {/* Sandbox Generator Item */}
          <button 
            id="tab-optimizations-btn"
            onClick={() => setActiveScreen('optimizations')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left ${activeScreen === 'optimizations' ? 'bg-brand-primary/25 text-on-surface border border-brand-primary/30 font-bold' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}
          >
            <Sparkles className="w-5 h-5 text-brand-success" />
            <span className="text-sm font-medium">Sandbox AI Rewriter</span>
          </button>

          {/* Settings Item */}
          <button 
            id="tab-settings-btn"
            onClick={() => setActiveScreen('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left ${activeScreen === 'settings' ? 'bg-brand-primary/25 text-on-surface border border-brand-primary/30 font-bold' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant pt-4 space-y-1">
          <div className="flex items-center gap-2 px-4 py-2 text-xs font-mono text-on-surface-variant">
            <span className={`w-2 h-2 rounded-full ${hasServerApiKey ? 'bg-brand-success animate-pulse' : 'bg-brand-warning'}`} />
            <span>AI Status: {hasServerApiKey ? 'Gemini Pro Live' : 'Sandbox (No Key)'}</span>
          </div>

          <button 
            onClick={() => triggerToast("Need assistance? Email supports at team@resumeai.pro.")}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-variant text-sm text-left transition-colors"
          >
            <SupportIcon className="w-4 h-4" />
            <span>Support</span>
          </button>

          {user ? (
            <div className="px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant flex flex-col gap-1 mb-2.5">
              <span className="text-[10px] font-mono font-bold tracking-wider text-brand-success uppercase">Active User Profile</span>
              <span className="text-xs text-white font-medium truncate select-all">{user.email}</span>
              <button 
                onClick={handleLogout}
                className="mt-2 text-left text-[11px] text-brand-error hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3 h-3" /> Sign Out Account
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                setAuthTab('login');
                setIsAuthModalOpen(true);
              }}
              className="w-full mb-2.5 py-3 px-4 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              Sign In / Register
            </button>
          )}

          <button 
            onClick={() => setShowUpgradeModal(true)}
            className="w-full mt-2 py-3 px-4 bg-brand-primary text-white rounded-xl text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-md shadow-brand-primary/10 active:scale-95"
          >
            <Sparkle className="w-3.5 h-3.5" />
            Upgrade to Premium
          </button>
        </div>
      </nav>

      {/* 4. MAIN CONTENT CONTAINER (SCROLLABLE WRAPPER) */}
      <div className="flex-1 flex flex-col md:ml-64 w-full h-full bg-surface-container-lowest/80 backdrop-blur-3xl overflow-hidden transition-all duration-300 z-10">
        
        {/* DESKTOP NAV HEADER */}
        <header className="bg-surface-container/40 backdrop-blur-md w-full sticky top-0 z-40 hidden md:flex justify-between items-center px-10 h-16 border-b border-outline-variant select-none">
          <div id="header-left">
            {activeScreen !== 'dashboard' ? (
              <span 
                onClick={() => setActiveScreen('dashboard')}
                className="text-sm font-medium text-on-surface-variant cursor-pointer hover:text-brand-primary transition-colors flex items-center gap-1.5 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Resumes
              </span>
            ) : (
              <div className="text-xs text-on-surface-variant font-mono font-medium">
                ResumeAI Cloud Engine v1.4.2
              </div>
            )}
          </div>

          <div id="header-right" className="flex items-center gap-6 text-on-surface-variant relative">
            <div className="relative">
              <span 
                onClick={() => {
                  const stateChange = !isNotificationsOpen;
                  setIsNotificationsOpen(stateChange);
                  if (stateChange) {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  }
                }}
                className="cursor-pointer hover:text-brand-primary transition-colors flex items-center justify-center relative p-1.5"
                title="System Notifications"
              >
                <Bell className="w-5 h-5 text-on-surface-variant" />
                {notifications.some(n => !n.read) && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-brand-error rounded-full animate-bounce" />
                )}
              </span>

              {/* Dynamic Notification Popover */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsNotificationsOpen(false)} 
                    />
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-80 bg-surface-container rounded-2xl border border-outline-variant shadow-2xl z-50 overflow-hidden font-sans text-left"
                    >
                      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">My Notifications</span>
                        {notifications.some(n => !n.read) ? (
                          <button 
                            onClick={() => {
                              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                              triggerToast("All notifications marked as read.");
                            }}
                            className="text-[10px] text-brand-primary font-bold hover:underline cursor-pointer bg-transparent border-0 outline-none"
                          >
                            Mark all read
                          </button>
                        ) : null}
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant/50 max-w-full">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-3.5 space-y-1 transition-colors ${notif.read ? 'bg-transparent' : 'bg-brand-primary/5 hover:bg-brand-primary/8'}`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-xs font-semibold leading-snug ${notif.read ? 'text-on-surface' : 'text-white'}`}>
                                  {notif.title}
                                </span>
                                <span className="text-[9px] text-on-surface-variant/75 shrink-0 font-mono mt-0.5">
                                  {notif.timestamp}
                                </span>
                              </div>
                              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                                {notif.message}
                              </p>
                              <div className="flex justify-between items-center pt-1.5">
                                {!notif.read ? (
                                  <button
                                    onClick={() => {
                                      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                                    }}
                                    className="text-[9.5px] text-brand-primary font-bold hover:underline cursor-pointer"
                                  >
                                    Mark read
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-brand-success font-semibold flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5" /> Read
                                  </span>
                                )}
                                <button
                                  onClick={() => {
                                    setNotifications(prev => prev.filter(n => n.id !== notif.id));
                                    triggerToast("Notification dismissed.");
                                  }}
                                  className="text-on-surface-variant hover:text-brand-error transition-colors cursor-pointer"
                                  title="Dismiss Alert"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-on-surface-variant/70 font-mono text-xs select-none space-y-1">
                            <div>📭</div>
                            <div>No notifications found</div>
                          </div>
                        )}
                      </div>
                      
                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-outline-variant text-center bg-surface-container-low/30">
                          <button 
                            onClick={() => {
                              setNotifications([]);
                              triggerToast("Cleared alert log.");
                            }}
                            className="text-[10px] text-on-surface-variant hover:text-white transition-colors cursor-pointer"
                          >
                            Clear all history
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <span 
              onClick={() => triggerToast("Need help? Read our step-by-step ATS analysis guide in resources panel.")}
              className="material-symbols-outlined cursor-pointer hover:text-brand-primary transition-colors flex items-center justify-center p-1.5"
            >
              <HelpCircle className="w-5 h-5" />
            </span>
            {user ? (
              <div 
                onClick={() => triggerToast(`Currently logged in as: ${user.email}`)}
                className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
              >
                <span className="text-xs text-on-surface-variant max-w-[140px] truncate">{user.email}</span>
                <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-xs font-bold text-white border border-brand-primary/50 overflow-hidden shrink-0">
                  {user.email[0].toUpperCase()}
                </div>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setAuthTab('login');
                  setIsAuthModalOpen(true);
                }}
                className="px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/25 hover:bg-brand-primary text-brand-primary hover:text-white rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* SCROLLABLE VIEW PORT */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-10 pb-28 md:pb-12 max-w-[1360px] w-full mx-auto space-y-8">
          
          <AnimatePresence mode="wait">
            
            {/* ==================== SCREEN 1: DASHBOARD (OVERVIEW) ==================== */}
            {activeScreen === 'dashboard' && (
              <motion.div 
                key="dashboard-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8 animate-fade-in-up"
              >
                {/* Header text */}
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-white font-sans">Overview</h1>
                  <p className="text-on-surface-variant font-medium text-sm mt-2">
                    Track your document performance and AI optimizations.
                  </p>
                </div>

                {/* Info status if server API Key missing */}
                {hasServerApiKey === false && (
                  <div className="bg-brand-warning/10 border border-brand-warning/30 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-brand-warning shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-brand-warning font-semibold text-sm">Demo Sandbox Workspace Mode</h4>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        To activate unlimited real-time **Gemini 3.5 Flash optimizations**, configure your `GEMINI_API_KEY` inside the AI Studio Secrets panel. The app is currently running in smart-heuristic local generation mode.
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick stats counters */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Total Scans Card */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 flex flex-col gap-2 hover:border-brand-primary/40 transition-colors shadow-sm">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <FileText className="w-4 h-4 text-brand-primary" />
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider">Total Scans</span>
                    </div>
                    <div className="text-3xl md:text-5xl font-bold font-sans text-white mt-1">24</div>
                  </div>

                  {/* Avg ATS Score Card */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 flex flex-col gap-2 hover:border-brand-primary/40 transition-colors shadow-sm">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <BarChart3 className="w-4 h-4 text-brand-success" />
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider">Avg Score</span>
                    </div>
                    <div className="text-3xl md:text-5xl font-bold font-sans text-brand-success mt-1 flex items-baseline gap-1">
                      78 <span className="text-sm font-medium text-on-surface-variant font-mono">/ 100</span>
                    </div>
                  </div>

                  {/* Avg Improvement Card */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 flex flex-col gap-2 col-span-2 md:col-span-1 hover:border-brand-primary/40 transition-colors shadow-sm">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Sparkle className="w-4 h-4 text-brand-primary" />
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider">Avg Improvement</span>
                    </div>
                    <div className="text-3xl md:text-5xl font-bold font-sans text-brand-primary mt-1 flex items-center gap-2">
                      +15%
                    </div>
                  </div>
                </div>

                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left block: Upload Document */}
                  <div 
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => document.getElementById('resume-file-input')?.click()}
                    className={`lg:col-span-12 xl:col-span-5 bg-surface-container border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 group min-h-[340px] cursor-pointer ${dragOver ? 'border-brand-success bg-brand-success/10 animate-pulse' : 'border-outline-variant hover:border-brand-primary hover:bg-brand-primary/5'}`}
                  >
                    <input 
                      id="resume-file-input"
                      type="file"
                      accept=".pdf,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    {isUploading ? (
                      <div className="space-y-4">
                        <div className="w-20 h-20 rounded-full bg-brand-success/15 flex items-center justify-center text-brand-success mx-auto shadow-lg">
                          <RefreshCw className="w-10 h-10 animate-spin" />
                        </div>
                        <h3 className="text-xl font-bold text-brand-success">Generating AI Suggestions...</h3>
                        <p className="text-xs text-on-surface-variant max-w-[280px]">Dissecting document nodes, formulating metrics guidelines, and structuring professional improvement suggestions.</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mb-6 group-hover:bg-brand-primary group-hover:text-white text-brand-primary transition-all duration-300 shadow-sm shadow-brand-primary/10">
                          <UploadCloud className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-primary transition-colors">
                          Analyze Your Real Document
                        </h3>
                        <p className="text-xs text-on-surface-variant max-w-[280px] mb-8 leading-relaxed font-sans">
                          Drag &amp; drop your digital Resume (PDF or TXT) here, or click to choose from disk. We'll identify weak phrasing and metric gaps with custom rewrites.
                        </p>
                        <button className="px-6 py-2.5 bg-brand-primary text-white font-medium text-xs rounded-xl active:scale-95 duration-150 shadow-lg shadow-brand-primary/15 hover:opacity-90">
                          Choose PDF / TXT File
                        </button>
                      </>
                    )}
                  </div>

                  {/* Right block: Recent Scans */}
                  <div className="lg:col-span-12 xl:col-span-7 bg-surface-container-low border border-outline-variant rounded-2xl flex flex-col overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center bg-surface-container select-none">
                      <h3 className="text-lg font-bold text-white font-sans">Recent Scans</h3>
                      <button 
                        onClick={() => triggerToast("Showing all current development test files.")}
                        className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1 active:scale-95"
                      >
                        View All <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Scan Item lists */}
                    <div className="flex-1 p-6 space-y-3.5 overflow-y-auto">
                      {Object.values(resumes).map((res: ResumeData) => {
                        // Dynamically determine colors depending on score
                        const isHigh = res.currentScore >= 80;
                        const isMid = res.currentScore >= 60 && res.currentScore < 80;
                        const scoreColor = isHigh ? 'text-brand-success' : isMid ? 'text-brand-warning' : 'text-brand-error';
                        const strokeColor = isHigh ? '#10b981' : isMid ? '#f59e0b' : '#ef4444';
                        
                        // Circle stroke parameters
                        const radius = 16;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDashoffset = circumference - (res.currentScore / 100) * circumference;

                        return (
                          <div 
                            key={res.id}
                            onClick={() => handleSelectResume(res.filename, 'analysis')}
                            className="flex items-center justify-between p-4 border border-outline-variant rounded-xl hover:border-brand-primary/60 hover:bg-surface-container transition-all cursor-pointer bg-surface-container-lowest group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-brand-primary transition-colors shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-white group-hover:text-brand-primary transition-colors">
                                  {res.filename}
                                </h4>
                                <p className="text-xs text-on-surface-variant mt-1">
                                  Analyzed {res.uploadedAt}
                                </p>
                              </div>
                            </div>

                            {/* Circular progress wheel on right */}
                            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                                <circle 
                                  className="text-surface-variant stroke-current" 
                                  cx="20" cy="20" r={radius} 
                                  fill="none" strokeWidth="2.5" 
                                />
                                <circle 
                                  cx="20" cy="20" r={radius} 
                                  fill="none" strokeWidth="3" 
                                  stroke={strokeColor}
                                  strokeDasharray={circumference}
                                  strokeDashoffset={strokeDashoffset}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className={`absolute text-xs font-bold font-mono ${scoreColor}`}>
                                {res.currentScore}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==================== SCREEN 2: RUNTIME AI ANALYSIS REPORT ==================== */}
            {activeScreen === 'analysis' && (
              <motion.div 
                key="analysis-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8 animate-fade-in-up"
              >
                {/* Header title block */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      Analysis Results: {currentResume.filename}
                    </h1>
                    <p className="text-xs text-on-surface-variant mt-2 font-mono">
                      Uploaded {currentResume.uploadedAt}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 shrink-0">
                    <button 
                      onClick={handleDownloadDraft}
                      className="flex items-baseline gap-2 px-5 py-3 border border-outline bg-surface-container-low text-on-surface rounded-xl font-medium text-xs hover:bg-surface-variant transition-all hover:scale-102 active:scale-95 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Resume
                    </button>
                    <button 
                      onClick={() => setActiveScreen('comparison')}
                      className="flex items-center gap-2 px-5 py-3 bg-brand-primary text-white rounded-xl font-medium text-xs hover:opacity-95 transition-all hover:scale-102 hover:shadow-lg hover:shadow-brand-primary/10 active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Proceed to ATS Check
                    </button>
                  </div>
                </div>

                {/* Subpanel Container split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* LEFT COLUMN: ACTIVE FAUX RESUME SHEET PREVIEW */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 select-none">
                      <div className="flex bg-surface-container rounded-xl p-1 border border-outline-variant w-full sm:w-auto">
                        <button
                          onClick={() => {
                            setResumeViewerMode('recruiter');
                            triggerToast("Toggled to Recruiter visual canvas.");
                          }}
                          className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${resumeViewerMode === 'recruiter' ? 'bg-brand-primary text-white shadow' : 'text-on-surface-variant hover:text-white'}`}
                        >
                          👤 Recruiter View
                        </button>
                        <button
                          onClick={() => {
                            setResumeViewerMode('ats');
                            triggerToast("Toggled to raw ATS data stream analysis.");
                            addNotification("ATS Compiler Visualizer Active", "Generating raw NLP token stream & scanning layout density heuristics.");
                          }}
                          className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer font-mono ${resumeViewerMode === 'ats' ? 'bg-brand-primary text-white shadow' : 'text-on-surface-variant hover:text-white'}`}
                        >
                          🤖 ATS Parser Stream
                        </button>
                      </div>
                      <span className="text-xs font-sans text-brand-primary flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-brand-primary animate-pulse" /> 
                        {resumeViewerMode === 'recruiter' ? 'Click highlighted sections for AI corrections' : 'Parser encoding: UTF-8 standard stream'}
                      </span>
                    </div>

                    {resumeViewerMode === 'recruiter' ? (
                      <div className="bg-surface-container-low border border-outline-variant p-6 md:p-8 rounded-2xl shadow-xl space-y-6 max-h-[820px] overflow-y-auto">
                      <header className="border-b border-outline-variant pb-6 mb-6 text-center select-none space-y-2">
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                          {currentResume.contact.name}
                        </h2>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {currentResume.contact.location} | {currentResume.contact.email} | {currentResume.contact.phone}
                        </p>
                        <p className="text-xs text-brand-primary font-mono select-text">
                          {currentResume.contact.linkedin}
                        </p>
                      </header>

                      {/* Professional Summary Module */}
                      <section 
                        onClick={() => {
                          setActiveHighlightId('summary');
                          triggerToast("Inspect summary details on the right card panel.");
                        }}
                        className={`group rounded-xl p-3.5 -mx-3.5 transition-all cursor-pointer relative ${activeHighlightId === 'summary' ? 'bg-brand-primary/10 border border-brand-primary/30' : 'hover:bg-surface-container/40 border border-transparent'}`}
                      >
                        <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-outline-variant pb-1.5 mb-2.5">
                          Summary
                        </h3>
                        {currentResume.summary.status === 'applied' ? (
                          <p className="text-sm text-on-background leading-relaxed font-sans mt-1">
                            {currentResume.summary.optimized}
                          </p>
                        ) : (
                          <div className="relative">
                            <p className="text-sm text-on-background leading-relaxed font-sans blur-[0.3px] group-hover:blur-none transition-all">
                              {currentResume.summary.original}
                            </p>
                            <div className="absolute top-0 right-0 w-2 h-2 bg-brand-error rounded-full animate-ping" />
                          </div>
                        )}
                        <div className="mt-2 text-[10px] font-mono text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity flex justify-between">
                          <span>Click to toggle AI rewrite details</span>
                          {currentResume.summary.status === 'applied' && <span className="text-brand-success font-semibold flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Applied</span>}
                        </div>
                      </section>

                      {/* Work Experience Section */}
                      <section className="space-y-6">
                        <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-outline-variant pb-1.5 mb-3.5 select-none">
                          Work Experience
                        </h3>

                        {currentResume.experience.map(job => (
                          <div key={job.id} className="space-y-3">
                            <div className="flex justify-between items-baseline select-none">
                              <h4 className="font-bold text-white text-base font-sans">{job.role}</h4>
                              <span className="text-xs text-on-surface-variant font-mono">{job.period}</span>
                            </div>
                            <div className="text-xs text-on-surface-variant font-mono -mt-1">{job.company}</div>

                             <ul className="list-disc pl-5 space-y-3 font-sans text-sm text-on-surface">
                              {job.bullets.map(bull => {
                                const bullText = (bull.status === 'applied' ? bull.optimized : bull.original).toLowerCase();
                                const jobKws = getJobKeywords(targetJobDescription);
                                const matchedKws = jobKws.filter(kw => bullText.includes(kw.toLowerCase()));
                                const hasJobKws = jobKws.length > 0;
                                const isMissingKws = hasJobKws && matchedKws.length === 0;

                                return (
                                  <li 
                                    key={bull.id}
                                    onClick={() => {
                                      setActiveHighlightId(bull.id);
                                      triggerToast(`Selected detail bullet points corrections.`);
                                    }}
                                    className={`relative group cursor-pointer pl-2 py-2 px-2.5 rounded border-l-2 transition-all leading-normal ${
                                      activeHighlightId === bull.id 
                                        ? 'bg-brand-primary/15 text-white border-brand-primary' 
                                        : isMissingKws
                                          ? 'bg-brand-error/5 hover:bg-brand-error/10 text-on-surface border-brand-error'
                                          : bulletStatusColor(bull.status)
                                    }`}
                                  >
                                    {bull.status === 'applied' ? (
                                      <span>{bull.optimized}</span>
                                    ) : (
                                      <span className="relative inline-block border-b border-dashed border-brand-warning/60">
                                        {bull.original}
                                      </span>
                                    )}

                                    {/* Quick visual dot highlights */}
                                    {bull.status === 'pending' && !isMissingKws && (
                                      <span className="inline-block ml-1.5 w-1.5 h-1.5 rounded-full bg-brand-warning" />
                                    )}

                                    {/* If target job description is loaded, show the keyword tags / mismatch label */}
                                    {hasJobKws && (
                                      <div className="mt-1 flex flex-wrap gap-1 items-center select-none">
                                        {matchedKws.length > 0 ? (
                                          <span className="text-[9px] font-mono font-medium text-brand-success bg-brand-success/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                            <Check className="w-2.5 h-2.5" /> Core Match: {matchedKws.slice(0, 3).join(', ')} {matchedKws.length > 3 && `+${matchedKws.length - 3}`}
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-mono font-medium text-brand-error bg-brand-error/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                                            <AlertTriangle className="w-2.5 h-2.5" /> Missing job-desc industry keywords
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </section>

                      {/* Key Skills Section */}
                      <section 
                        onClick={() => {
                          setActiveHighlightId('skills');
                          triggerToast("Active skills profile categorization loading...");
                        }}
                        className={`group rounded-xl p-3.5 -mx-3.5 transition-all cursor-pointer ${activeHighlightId === 'skills' ? 'bg-brand-primary/10 border border-brand-primary/30' : 'hover:bg-surface-container/40 border border-transparent'}`}
                      >
                        <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-outline-variant pb-1.5 mb-2.5">
                          Core Skills & Technologies
                        </h3>
                        
                        {currentResume.skills.status === 'applied' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                            {currentResume.skills.optimizedCategories.map((cat, i) => {
                              const catText = `${cat.category} ${cat.skills.join(', ')}`.toLowerCase();
                              const jobKws = getJobKeywords(targetJobDescription);
                              const matchedKws = jobKws.filter(kw => {
                                const lowerKw = kw.toLowerCase();
                                // Check if the keyword exists as a sub-word or matches any skill listed exactly
                                return catText.includes(lowerKw) || cat.skills.some(skill => {
                                  const lowerSkill = skill.toLowerCase();
                                  return lowerSkill.includes(lowerKw) || lowerKw.includes(lowerSkill);
                                });
                              });
                              const hasJobKws = jobKws.length > 0;
                              const isMissingKws = hasJobKws && matchedKws.length === 0;

                              return (
                                <div 
                                  key={i} 
                                  className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                                    isMissingKws 
                                      ? 'bg-brand-error/5 border-brand-error/40 shadow-sm hover:shadow-brand-error/5' 
                                      : 'bg-surface-container-lowest border-outline-variant hover:border-brand-primary/30 shadow-sm hover:shadow-md'
                                  }`}
                                >
                                  <div>
                                    <span className="block text-[11px] font-bold text-brand-primary tracking-wide uppercase">
                                      {cat.category}
                                    </span>
                                    
                                    {/* Skills listed */}
                                    <div className="flex flex-wrap gap-1 mt-1.5 mb-3">
                                      {cat.skills.map((skill, sIdx) => {
                                        const isMatched = jobKws.some(kw => {
                                          const lSkill = skill.toLowerCase();
                                          const lKw = kw.toLowerCase();
                                          return lSkill.includes(lKw) || lKw.includes(lSkill);
                                        });
                                        return (
                                          <span 
                                            key={sIdx} 
                                            className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                              isMatched 
                                                ? 'bg-brand-success/15 text-white border border-brand-success/30 font-semibold' 
                                                : 'bg-surface-container text-on-surface-variant'
                                            }`}
                                          >
                                            {skill}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Progress bar illustrating target job keywords met */}
                                  <div className="border-t border-outline-variant/30 pt-2 mt-auto">
                                    {hasJobKws ? (
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px] font-mono">
                                          <span className="text-on-surface-variant">Keywords Met</span>
                                          <span className="text-brand-success font-bold font-mono">
                                            {matchedKws.length} / {jobKws.length}
                                          </span>
                                        </div>
                                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden relative">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, jobKws.length > 0 ? (matchedKws.length / jobKws.length) * 100 : 0)}%` }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                            className="bg-brand-success h-full rounded-full"
                                          />
                                        </div>
                                        {matchedKws.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1 font-mono text-[9px] text-brand-success leading-none">
                                            <span className="text-on-surface-variant mr-1">Matches:</span>
                                            {matchedKws.slice(0, 3).map((m, mIdx) => (
                                              <span key={mIdx} className="underline decoration-dotted font-semibold">
                                                {m}
                                              </span>
                                            ))}
                                            {matchedKws.length > 3 && <span>+{matchedKws.length - 3} more</span>}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-on-surface-variant/60 italic font-mono flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40" />
                                        No active job description
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm italic text-on-surface-variant">
                              {currentResume.skills.original}
                            </p>
                            {/* Uncategorized raw skills matching representation */}
                            {getJobKeywords(targetJobDescription).length > 0 && (() => {
                              const jobKws = getJobKeywords(targetJobDescription);
                              const originalText = currentResume.skills.original.toLowerCase();
                              const matchedKws = jobKws.filter(kw => originalText.includes(kw.toLowerCase()));
                              return (
                                <div className="p-3 rounded-xl border border-outline-variant bg-surface-container-lowest">
                                  <span className="block text-[10px] font-bold text-brand-warning tracking-wide uppercase mb-1">Uncategorized Target Progress</span>
                                  <div className="flex justify-between items-center text-[10px] font-mono leading-relaxed">
                                    <span className="text-on-surface-variant">Satisfaction Ratio</span>
                                    <span className="text-brand-success font-bold">{matchedKws.length} / {jobKws.length} Match</span>
                                  </div>
                                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1 max-w-sm">
                                    <div 
                                      className="bg-brand-warning h-full transition-all duration-300 rounded-full"
                                      style={{ width: `${Math.min(100, (matchedKws.length / jobKws.length) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Summary of keyword match if loaded */}
                        {getJobKeywords(targetJobDescription).length > 0 && (() => {
                          const jobKws = getJobKeywords(targetJobDescription);
                          const skillsText = (currentResume.skills.status === 'applied' 
                            ? currentResume.skills.optimizedCategories.map(c => `${c.category} ${c.skills.join(' ')}`).join(' ') 
                            : currentResume.skills.original).toLowerCase();
                          const matchedKws = jobKws.filter(kw => skillsText.includes(kw.toLowerCase()));
                          const missingKws = jobKws.filter(kw => !skillsText.includes(kw.toLowerCase()));

                          return (
                            <div className="mt-3 bg-surface-container/20 p-3 rounded-xl border border-outline-variant space-y-2 select-none">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">Job Skill keywords alignment:</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${missingKws.length > 0 ? 'text-brand-warning bg-brand-warning/10' : 'text-brand-success bg-brand-success/10'}`}>
                                  {matchedKws.length} / {jobKws.length} Matched
                                </span>
                              </div>
                              {missingKws.length > 0 ? (
                                <div className="space-y-1">
                                  <span className="text-[9px] text-brand-warning font-mono block">⚠️ Missing match keywords in skills:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {missingKws.slice(0, 10).map((kw, idx) => (
                                      <span key={idx} className="bg-brand-warning/10 text-brand-warning text-[9px] px-1.5 py-0.5 rounded font-mono font-medium">
                                        {kw}
                                      </span>
                                    ))}
                                    {missingKws.length > 10 && (
                                      <span className="text-on-surface-variant text-[9px] font-mono mt-0.5">+{missingKws.length - 10} more</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[9.5px] text-brand-success font-semibold flex items-center gap-1 font-mono">
                                  <Check className="w-3" /> Excellent! All job technical skill keywords matched.
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        <div className="mt-2 text-[10px] font-mono text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity flex justify-between">
                          <span>Click to organize Skills matrix</span>
                          {currentResume.skills.status === 'applied' ? <span className="text-brand-success font-semibold">Applied</span> : <span className="text-brand-warning">Requires formatting structure</span>}
                        </div>
                      </section>
                    </div>
                    ) : (
                      <div className="bg-[#0b0c10] border border-outline-variant p-6 rounded-2xl shadow-2xl space-y-5 h-[820px] overflow-y-auto font-mono text-xs text-emerald-400 text-left select-text relative">
                        {/* Terminal scan glow */}
                        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 to-transparent pointer-events-none rounded-2xl" />
                        
                        <div className="flex items-center justify-between border-b border-emerald-900 pb-3 mb-2 select-none">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand-success animate-ping shrink-0" />
                            <span className="text-white font-bold tracking-wider font-mono uppercase text-[11px]">ATS NLP parser console v2.1.4</span>
                          </div>
                          <span className="text-emerald-500/60 font-mono text-[9px]">ENCODING: STANDARD UTF-8</span>
                        </div>

                        {/* Diagnostics Section */}
                        <div className="space-y-2 bg-[#10131a] p-4 rounded-xl border border-emerald-950/50 shadow-inner">
                          <span className="text-white font-bold text-[10px] uppercase font-mono tracking-widest flex items-center gap-1.5 select-none text-[11px]">
                            <AlertTriangle className="w-4 h-4 text-brand-warning shrink-0" />
                            Parser Compiler Diagnostics
                          </span>
                          <div className="space-y-1.5 font-mono text-[10.5px] mt-2 block">
                            <div className="text-yellow-400 flex items-start gap-1 leading-normal">
                              <span className="shrink-0 font-bold">⚠️ [WARN_LAYOUT_DENSITY]:</span>
                              <span>Modern double-column layout detected. Probability of reading flow inversion across Taleo/Workday indexing algorithms is <strong className="underline">42%</strong>. Recommended structure: Single-column standard flow.</span>
                            </div>
                            <div className="text-yellow-400 flex items-start gap-1 leading-normal">
                              <span className="shrink-0 font-bold">⚠️ [WARN_BULLET_GLYPH]:</span>
                              <span>Non-standard custom unicode glyph block detected on EXPERIENCE bullets list. Recommended standard list markers of type "round-dot" or "disc" for parsability.</span>
                            </div>
                            {!targetJobDescription.trim() ? (
                              <div className="text-brand-error flex items-start gap-1 leading-normal">
                                <span className="shrink-0 font-bold">❌ [ERR_JOB_DESC]:</span>
                                <span>Target job description payload is null. NLP cannot correlate semantic skills weight vector matches. Paste description in Settings!</span>
                              </div>
                            ) : (
                              <div className="text-emerald-400 flex items-start gap-1 leading-normal">
                                <span className="shrink-0 font-bold">✅ [OK_SEMANTIC_MATCH]:</span>
                                <span>Co-relation vector successfully mapped against job text profile. Found {getJobKeywords(targetJobDescription).length} technical entities keywords.</span>
                              </div>
                            )}
                            <div className="text-emerald-400 flex items-start gap-1 leading-normal">
                              <span className="shrink-0 font-bold">✅ [OK_CONTACT_METADATA]:</span>
                              <span>Name: "{currentResume.contact.name}", Email: Validated, Phone: Parsed. Extracted metadata confidence is 98.4%.</span>
                            </div>
                          </div>
                        </div>

                        {/* Extracted JSON schema */}
                        <div className="space-y-2.5">
                          <span className="text-white font-bold text-[10px] uppercase font-mono tracking-widest flex items-center gap-1.5 select-none pt-2 text-[11px]">
                            <span>📦</span> Extracted Entity Schema (JSON Object)
                          </span>
                          
                          <pre className="p-4 rounded-xl bg-black/60 border border-emerald-950/70 overflow-x-auto text-[11px] text-emerald-300 leading-relaxed scrollbar-thin select-text font-mono">
{`{
  "profile_identity": {
    "full_name": "${currentResume.contact.name}",
    "geo_location": "${currentResume.contact.location}",
    "linked_accounts": {
      "linkedin": "${currentResume.contact.linkedin}"
    }
  },
  "scores": {
    "cumulative_ats_rank": ${currentResume.currentScore},
    "parsability_weight": ${currentResume.subscores.parsability.current},
    "quantifiable_metrics_percentage": ${currentResume.experience[0]?.bullets?.some(b => b.status === 'applied') ? 90 : 40},
    "vocabulary_integrity_score": ${currentResume.subscores.impactVerbs.current}
  },
  "indexed_skills": [
    ${currentResume.skills.status === 'applied' 
      ? currentResume.skills.optimizedCategories.map(cat => `{\n      "group": "${cat.category}",\n      "keywords": [${cat.skills.map(s => `"${s}"`).join(', ')}]\n    }`).join(',\n    ')
      : `["${currentResume.skills.original.split(',').map(s => s.trim()).join('", "')}"]`
    }
  ],
  "experience_nodes_count": ${currentResume.experience.length},
  "nlp_keywords_match_ratio": ${currentResume.subscores.keywordMatch.current / 100}
}`}
                          </pre>
                        </div>

                        {/* Byte stream token stream simulation */}
                        <div className="space-y-2 border-t border-emerald-950 pt-4">
                          <span className="text-white font-bold text-[10px] uppercase font-mono tracking-widest flex items-center gap-1.5 select-none text-[11px]">
                            <span>📄</span> Tokenized Parser Byte Stream Chunks
                          </span>
                          <p className="text-[10px] text-emerald-500/70 leading-relaxed font-mono p-4 rounded-xl bg-black/30 border border-emerald-950/50 select-text select-none">
                            <span className="text-white font-bold mr-1">[0x004A]</span>
                            {currentResume.contact.name.toUpperCase().split('').map(c => `0x${c.charCodeAt(0).toString(16).toUpperCase()}`).join(' ')}
                            <br />
                            <span className="text-white font-bold mr-1">[0x005B]</span>
                            {"SUMMARY".split('').map(c => `0x${c.charCodeAt(0).toString(16).toUpperCase()}`).join(' ')}: &quot;
                            {((currentResume.summary.status === 'applied' ? currentResume.summary.optimized : currentResume.summary.original).slice(0, 140))}&quot;...
                            <br />
                            <span className="text-white font-bold mr-1">[0x006C]</span>
                            {currentResume.experience.map(j => 
                              j.bullets.map(b => (b.status === 'applied' ? b.optimized : b.original).slice(0, 60)).join('\n')
                            ).join('\n').slice(0, 160)}...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: CURRENT SCORE + RECOMMENDATION CARD DECK */}
                  <div className="lg:col-span-6 space-y-6">
                    {/* Circle Score module */}
                    <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex items-center justify-between shadow-sm">
                      <div>
                        <h2 className="text-lg font-bold text-white font-sans">Analysis Score</h2>
                        <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                          Based on industry standards for {selectedResumeId.startsWith('PM') ? 'Product' : 'Engineering'} roles.
                        </p>
                      </div>

                      {/* Main Dynamic Large Score Ring */}
                      <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle 
                            className="text-surface-variant stroke-current" 
                            cx="50" cy="50" r="42" 
                            fill="none" strokeWidth="6" 
                          />
                          <circle 
                            className="text-brand-primary stroke-current transition-all duration-1000 ease-out" 
                            cx="50" cy="50" r="42" 
                            fill="none" strokeWidth="8" 
                            strokeDasharray={2 * Math.PI * 42}
                            strokeDashoffset={2 * Math.PI * 42 - (currentResume.currentScore / 100) * (2 * Math.PI * 42)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center font-sans tracking-tighter">
                          <span className="text-2xl font-bold text-white leading-none">{currentResume.currentScore}</span>
                          <span className="text-[10px] text-on-surface-variant font-mono mt-0.5">/ 100</span>
                        </div>
                      </div>
                    </div>

                    {/* Main deck instructions and items card mapping */}
                    <div className="space-y-4">
                      {/* Interactive header helper */}
                      <div className="text-xs font-mono text-on-surface-variant uppercase tracking-wider select-none px-1">
                        Priority Enhancements Action Items
                      </div>

                      {/* SUMMARY CORRECTION CARD */}
                      <div 
                        id="card-summary-box"
                        className={`bg-surface-container rounded-2xl border relative overflow-hidden transition-all duration-300 ${activeHighlightId === 'summary' ? 'border-brand-primary ring-2 ring-brand-primary/10 shadow-lg' : 'border-outline-variant hover:border-brand-primary/40'}`}
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-error" />
                        <div className="p-5 space-y-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-brand-error" />
                            <h3 className="text-sm font-semibold text-white">Summary Hook Phrasing</h3>
                            <span className="ml-auto bg-brand-error/15 text-brand-error text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold">
                              Weak Impact
                            </span>
                          </div>

                          <p className="text-xs text-on-surface-variant leading-relaxed leading-normal">
                            Your introduction reads passiveness. It is missing specific years metrics, domain focus, and key technical capabilities standard to ATS parsers.
                          </p>

                          <div className="space-y-2.5">
                            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant">
                              <span className="text-[10px] font-mono text-on-surface-variant block uppercase tracking-wider">Original text:</span>
                              <p className="text-xs text-on-surface mt-1 leading-relaxed">{currentResume.summary.original}</p>
                            </div>
                            
                            <div className="bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/20">
                              <span className="text-[10px] font-mono text-brand-primary block uppercase tracking-wider flex items-center gap-1">
                                <Sparkle className="w-3 h-3 text-brand-success" /> AI Optimized Replacement:
                              </span>
                              <p className="text-xs text-white mt-1 leading-relaxed">{currentResume.summary.optimized}</p>
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            {currentResume.summary.status === 'applied' ? (
                              <button className="flex items-center gap-1 px-4 py-2 bg-brand-success/15 text-brand-success border border-brand-success/25 font-semibold text-xs rounded-xl cursor-default select-none">
                                <Check className="w-3.5 h-3.5" /> Applied Correction
                              </button>
                            ) : (
                              <button 
                                onClick={() => applyFix('summary')}
                                className="px-4 py-2 bg-brand-primary text-white font-semibold text-xs rounded-xl hover:opacity-95 transition-opacity active:scale-95 duration-100 shrink-0"
                              >
                                Apply Fix
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* EXPERIENCE BULLET CARD WRAPPERS */}
                      {currentResume.experience.map(job => (
                        job.bullets.map(bull => {
                          const bullText = (bull.status === 'applied' ? bull.optimized : bull.original).toLowerCase();
                          const jobKws = getJobKeywords(targetJobDescription);
                          const matchedKws = jobKws.filter(kw => bullText.includes(kw.toLowerCase()));
                          const hasJobKws = jobKws.length > 0;
                          const isMissingKws = hasJobKws && matchedKws.length === 0;

                          return (
                            <div 
                              key={bull.id}
                              className={`bg-surface-container rounded-2xl border relative overflow-hidden transition-all duration-300 ${
                                activeHighlightId === bull.id 
                                  ? 'border-brand-primary ring-2 ring-brand-primary/10 shadow-lg' 
                                  : isMissingKws 
                                    ? 'border-brand-error/50 hover:border-brand-error shadow-[0_0_12px_rgba(239,68,68,0.05)]'
                                    : 'border-outline-variant hover:border-brand-primary/40'
                              }`}
                            >
                              <div className={`absolute top-0 left-0 w-1 h-full ${isMissingKws ? 'bg-brand-error' : bull.severity === 'error' ? 'bg-brand-error' : 'bg-brand-warning'}`} />
                              <div className="p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                  {isMissingKws ? (
                                    <AlertTriangle className="w-4 h-4 text-brand-error animate-pulse" />
                                  ) : bull.severity === 'error' ? (
                                    <AlertTriangle className="w-4 h-4 text-brand-error" />
                                  ) : (
                                    <Info className="w-4 h-4 text-brand-warning" />
                                  )}
                                  <h3 className="text-sm font-semibold text-white">Experience Focus Item</h3>
                                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                                    isMissingKws 
                                      ? 'bg-brand-error/15 text-brand-error' 
                                      : bull.severity === 'error' 
                                        ? 'bg-brand-error/15 text-brand-error' 
                                        : 'bg-brand-warning/15 text-brand-warning'
                                  }`}>
                                    {isMissingKws ? 'Keyword Gap' : bull.feedbackType}
                                  </span>
                                </div>

                                {isMissingKws ? (
                                  <div className="p-3 bg-brand-error/5 border border-brand-error/40 rounded-xl select-none">
                                    <p className="text-xs text-brand-error font-medium leading-relaxed font-sans">
                                      ⚠️ This experience bullet point is missing keywords from your targeted job description. Consider organizing metrics or injecting industry terminology like: <strong className="underline">{jobKws.slice(0, 4).join(', ')}</strong>.
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-xs text-on-surface-variant leading-relaxed">
                                    {bull.explanation}
                                  </p>
                                )}

                                <div className="space-y-2.5">
                                  <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant">
                                    <span className="text-[10px] font-mono text-on-surface-variant block uppercase tracking-wider">Original Bullet:</span>
                                    <p className="text-xs text-on-surface mt-1 leading-relaxed">{bull.original}</p>
                                  </div>
                                  <div className="bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/20">
                                    <span className="text-[10px] font-mono text-brand-primary block uppercase tracking-wider flex items-center gap-1">
                                      <Sparkle className="w-3 h-3 text-brand-success" /> AI Improved Alternative:
                                    </span>
                                    <p className="text-xs text-white mt-1 leading-relaxed">{bull.optimized}</p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                  <div className="flex gap-1.5 flex-wrap">
                                    {bull.tags.map((tag, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-surface-container-low border border-outline-variant rounded-md text-[9px] font-mono text-on-surface-variant font-semibold">
                                        {tag}
                                      </span>
                                    ))}
                                    {hasJobKws && matchedKws.map((kw, i) => (
                                      <span key={`kw-${i}`} className="px-2 py-0.5 bg-brand-success/10 border border-brand-success/20 rounded-md text-[9px] font-mono text-brand-success font-bold flex items-center gap-0.5">
                                        <Check className="w-2.5 h-2.5" /> {kw}
                                      </span>
                                    ))}
                                  </div>

                                  {bull.status === 'applied' ? (
                                    <button className="flex items-center gap-1 px-4 py-2 bg-brand-success/15 text-brand-success border border-brand-success/25 font-semibold text-xs rounded-xl cursor-default select-none">
                                      <Check className="w-3.5 h-3.5" /> Applied Correction
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => applyFix('experience', bull.id)}
                                      className="px-4 py-2 bg-brand-primary text-white font-semibold text-xs rounded-xl hover:opacity-95 transition-opacity active:scale-95 duration-100 shrink-0"
                                    >
                                      Apply Fix
                                    </button>
                                  )}
                                </div>

                                {/* STAR behavioral prep coach module */}
                                <div className="border border-outline-variant/60 rounded-xl bg-surface-container-low overflow-hidden mt-3 transition-all duration-300">
                                  <button
                                    onClick={() => {
                                      setExpandedStarCoachId(expandedStarCoachId === bull.id ? null : bull.id);
                                    }}
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-surface-container-lowest hover:bg-surface-container-low/60 transition-colors text-left"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>💬</span>
                                      <span className="text-xs font-semibold text-white"> Launch STAR Behavioral Interview Prep</span>
                                    </div>
                                    <span className="text-xs font-mono text-brand-primary font-bold">
                                      {expandedStarCoachId === bull.id ? 'Close Coach ✕' : 'Practice ➔'}
                                    </span>
                                  </button>
                                  
                                  {expandedStarCoachId === bull.id && (() => {
                                    const mockQuestion = bulletIdToStarQuestion(bull.id, job.role);
                                    const cachedResponse = starCoachResponseMap[bull.id] || "";
                                    const cachedGrade = starCoachGrades[bull.id];

                                    return (
                                      <div className="p-4 space-y-4 border-t border-outline-variant/40">
                                        <div className="space-y-1">
                                          <span className="text-[9px] font-mono uppercase bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded font-bold">
                                            Practicing Behavioral Question:
                                          </span>
                                          <p className="text-xs text-white font-medium leading-relaxed italic">
                                            &quot;{mockQuestion}&quot;
                                          </p>
                                        </div>

                                        {/* STAR structuring tips */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] font-sans">
                                          <div className="bg-[#10131a] p-2.5 rounded-lg border border-outline-variant/30 text-[11px]">
                                            <span className="block font-bold text-white text-[9.5px] uppercase font-mono tracking-tight text-brand-primary">
                                              S / T: Situation & Task
                                            </span>
                                            <span className="text-on-surface-variant block mt-1 leading-relaxed">
                                              Describe the initial high-stakes environment or system problem at {job.company}.
                                            </span>
                                          </div>
                                          <div className="bg-[#10131a] p-2.5 rounded-lg border border-outline-variant/30 text-[11px]">
                                            <span className="block font-bold text-white text-[9.5px] uppercase font-mono tracking-tight text-brand-success">
                                              A / R: Action & Result
                                            </span>
                                            <span className="text-on-surface-variant block mt-1 leading-relaxed">
                                              Focus on what YOU personally coded or designed, and quantify the velocity/savings.
                                            </span>
                                          </div>
                                        </div>

                                        {/* Practice Area */}
                                        <div className="space-y-1.5 pt-1">
                                          <label className="text-[10px] font-mono text-on-surface-variant block uppercase tracking-wider">
                                            Type Your Practice Response:
                                          </label>
                                          <textarea
                                            value={cachedResponse}
                                            onChange={(e) => {
                                              const text = e.target.value;
                                              setStarCoachResponseMap(prev => ({ ...prev, [bull.id]: text }));
                                            }}
                                            placeholder="At Tech Solutions, our server response times were spiking by 50%. I redesigned our REST routes using Node/Express filters. This stabilized latency below 100ms and supported 50% extra traffic."
                                            className="w-full text-xs font-sans text-on-surface bg-surface-container-lowest border border-outline-variant p-2.5 rounded-xl placeholder:text-on-surface-variant/40 focus:outline-none focus:border-brand-primary transition-colors min-h-[75px] resize-none animate-fade-in"
                                          />
                                        </div>

                                        {/* Grade action and checklist */}
                                        <div className="flex gap-2 items-center justify-between">
                                          <span className="text-[9.5px] text-on-surface-variant italic">
                                            Includes real-time NLP metric auditing
                                          </span>
                                          <button
                                            onClick={() => handleGradeStarResponse(bull.id, cachedResponse)}
                                            className="px-3 py-1.5 bg-brand-primary text-white text-[11px] font-semibold rounded-lg hover:opacity-95 transition-all cursor-pointer"
                                          >
                                            Evaluate Answer ➔
                                          </button>
                                        </div>

                                        {/* Grading feedback if available */}
                                        {cachedGrade && (
                                          <div className="p-3 rounded-lg border bg-[#10131a] space-y-2 border-outline-variant animate-fade-in">
                                            <div className="flex justify-between items-center border-b border-outline-variant pb-1.5">
                                              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                                Grading Assessment Score:
                                              </span>
                                              <div className="flex items-center gap-1.5">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                                                  cachedGrade.rating === 'Strong' 
                                                    ? 'bg-brand-success/15 text-brand-success' 
                                                    : cachedGrade.rating === 'Average' 
                                                      ? 'bg-brand-warning/15 text-brand-warning' 
                                                      : 'bg-brand-error/15 text-brand-error'
                                                }`}>
                                                  {cachedGrade.rating}
                                                </span>
                                                <span className="text-white font-mono font-bold text-xs">
                                                  {cachedGrade.score}/100
                                                </span>
                                              </div>
                                            </div>
                                            
                                            <p className="text-[11px] text-on-surface-variant leading-relaxed">
                                              {cachedGrade.feedback}
                                            </p>

                                            <div className="grid grid-cols-2 gap-2 pt-1.5 text-[9.5px] font-mono">
                                              <div className="bg-black/30 p-1.5 rounded border border-outline-variant/30">
                                                <span className="text-on-surface-variant block uppercase text-[8px] tracking-wide">Action verbs:</span>
                                                <span className="text-white block mt-1 font-semibold">{cachedGrade.verbDensity}</span>
                                              </div>
                                              <div className="bg-black/30 p-1.5 rounded border border-outline-variant/30">
                                                <span className="text-on-surface-variant block uppercase text-[8px] tracking-wide">Metrics found:</span>
                                                <span className="text-white block mt-1 font-semibold">{cachedGrade.metricCount} matched</span>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ))}

                      {/* SKILLS CARD BOX */}
                      <div 
                        className={`bg-surface-container rounded-2xl border relative overflow-hidden transition-all duration-300 ${activeHighlightId === 'skills' ? 'border-brand-primary ring-2 ring-brand-primary/10 shadow-lg' : 'border-outline-variant hover:border-brand-primary/40'}`}
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-warning" />
                        <div className="p-5 space-y-4">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-brand-warning" />
                            <h3 className="text-sm font-semibold text-white">Skills Structural Layout</h3>
                            <span className="ml-auto bg-brand-warning/15 text-brand-warning text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold">
                              Unstructured Format
                            </span>
                          </div>

                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            Single comma-separated soft/hard elements are highly unreadable for corporate ATS indexes. Group tools, frameworks, and core methodologies systematically.
                          </p>

                          <div className="flex justify-end pt-1">
                            {currentResume.skills.status === 'applied' ? (
                              <button className="flex items-center gap-1 px-4 py-2 bg-brand-success/15 text-brand-success border border-brand-success/25 font-semibold text-xs rounded-xl cursor-default select-none">
                                <Check className="w-3.5 h-3.5" /> Categorized Applied
                              </button>
                            ) : (
                              <button 
                                onClick={() => applyFix('skills')}
                                className="px-4 py-2 bg-brand-primary text-white font-semibold text-xs rounded-xl hover:opacity-95 transition-opacity active:scale-95 duration-100 shrink-0"
                              >
                                Apply Fix
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* ==================== SCREEN 3: ATS COMPARISON view (SIDE-BY-SIDE ANALYTICS) ==================== */}
            {activeScreen === 'comparison' && (
              <motion.div 
                key="comparison-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8 animate-fade-in-up"
              >
                {/* Header back metrics */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white font-sans">ATS Comparison</h1>
                    <p className="text-xs text-on-surface-variant font-medium mt-2">
                      Detailed breakdown of AI enhancements for "{currentResume.filename}"
                    </p>
                  </div>
                  <div className="flex gap-4 scroll-smooth">
                    <button 
                      onClick={handleDownloadDocx}
                      className="flex items-center gap-2 px-5 py-3 border border-outline bg-surface-container-low text-on-surface rounded-xl font-medium text-xs hover:bg-surface-variant transition-all hover:scale-102 active:scale-95 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-on-surface-variant" />
                      Word (.docx)
                    </button>
                    <button 
                      onClick={handleDownloadDraft}
                      className="flex items-center gap-2 px-5 py-3 bg-brand-primary text-white rounded-xl font-medium text-xs hover:opacity-95 transition-all hover:scale-102 hover:shadow-lg hover:shadow-brand-primary/10 active:scale-95 cursor-pointer shadow-sm shadow-brand-primary/15"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  </div>
                </div>

                {/* Score Comparison grid blocks */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Card Left: Current Version */}
                  <div className="md:col-span-4 bg-surface-container-low border border-outline-variant rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden text-center min-h-[290px] shadow-sm select-none">
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-outline" />
                      <span className="font-mono text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Current Version</span>
                    </div>

                    <div className="relative w-36 h-36 mt-4">
                      {/* Sub-circle drawing */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle 
                          className="text-surface-variant stroke-current" 
                          cx="50" cy="50" r="40" 
                          fill="none" strokeWidth="6" 
                        />
                        <circle 
                          className="text-outline stroke-current" 
                          cx="50" cy="50" r="40" 
                          fill="none" strokeWidth="8" 
                          strokeDasharray={2 * Math.PI * 40}
                          strokeDashoffset={2 * Math.PI * 40 - (currentResume.originalScore / 100) * (2 * Math.PI * 40)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center font-sans tracking-tighter">
                        <span className="text-4xl font-bold text-white">{currentResume.originalScore}</span>
                        <span className="text-xs text-on-surface-variant font-mono mt-1">/ 100</span>
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider font-mono mt-5">
                      Needs Improvement
                    </p>
                  </div>

                  {/* Card Middle: Optimized Version */}
                  <div className="md:col-span-4 bg-surface-container-low border border-brand-primary/90 rounded-2xl p-6 flex flex-col items-center justify-center relative shadow-[0_12px_40px_rgba(0,0,0,0.5)] text-center min-h-[290px] select-none animate-pulse-glow">
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-success" />
                      <span className="font-mono text-xs font-semibold text-brand-success uppercase tracking-wider">AI Optimized</span>
                    </div>

                    <div className="relative w-36 h-36 mt-4">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle 
                          className="text-surface-variant stroke-current" 
                          cx="50" cy="50" r="40" 
                          fill="none" strokeWidth="6" 
                        />
                        <circle 
                          className="text-brand-success stroke-current" 
                          cx="50" cy="50" r="40" 
                          fill="none" strokeWidth="8" 
                          strokeDasharray={2 * Math.PI * 40}
                          strokeDashoffset={2 * Math.PI * 40 - (currentResume.optimizedScore / 100) * (2 * Math.PI * 40)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center font-sans tracking-tighter">
                        <span className="text-4xl font-bold text-white">{currentResume.optimizedScore}</span>
                        <span className="text-xs text-on-surface-variant font-mono mt-1">/ 100</span>
                      </div>
                    </div>

                    <p className="text-xs text-brand-success font-semibold uppercase tracking-wider font-mono mt-5">
                      Highly Competitive
                    </p>
                  </div>

                  {/* Card Right: Subscores Breakdown */}
                  <div className="md:col-span-4 flex flex-col gap-3 justify-between select-none">
                    {/* Subscore 1: Keyword match */}
                    <div className="flex-1 bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex flex-col gap-1 pr-2">
                        <span className="text-xs font-bold text-white leading-none">Keyword Match</span>
                        <span className="text-[11px] text-on-surface-variant block mt-1">Alignment against job description</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right flex flex-col">
                          <span className="text-xs font-semibold text-on-surface-variant line-through">{currentResume.subscores.keywordMatch.original}%</span>
                          <span className="text-lg font-bold text-white font-mono">{currentResume.subscores.keywordMatch.current}%</span>
                        </div>
                        <div className="px-2 py-1 bg-brand-success/15 text-brand-success rounded-lg font-mono font-bold text-[10px] flex items-center gap-0.5">
                          +{currentResume.subscores.keywordMatch.optimized - currentResume.subscores.keywordMatch.original}%
                        </div>
                      </div>
                    </div>

                    {/* Subscore 2: Parsability */}
                    <div className="flex-1 bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex flex-col gap-1 pr-2">
                        <span className="text-xs font-bold text-white leading-none">Parsability</span>
                        <span className="text-[11px] text-on-surface-variant block mt-1">ATS structured format standard</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right flex flex-col">
                          <span className="text-xs font-semibold text-on-surface-variant line-through">{currentResume.subscores.parsability.original}%</span>
                          <span className="text-lg font-bold text-white font-mono">{currentResume.subscores.parsability.current}%</span>
                        </div>
                        <div className="px-2 py-1 bg-brand-success/15 text-brand-success rounded-lg font-mono font-bold text-[10px] flex items-center gap-0.5">
                          +{currentResume.subscores.parsability.optimized - currentResume.subscores.parsability.original}%
                        </div>
                      </div>
                    </div>

                    {/* Subscore 3: Impact Verbs */}
                    <div className="flex-1 bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex flex-col gap-1 pr-2">
                        <span className="text-xs font-bold text-white leading-none">Impact Verbs</span>
                        <span className="text-[11px] text-on-surface-variant block mt-1">Direct-action active phrased verbs</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right flex flex-col">
                          <span className="text-xs font-semibold text-on-surface-variant line-through">{currentResume.subscores.impactVerbs.original}%</span>
                          <span className="text-lg font-bold text-white font-mono">{currentResume.subscores.impactVerbs.current}%</span>
                        </div>
                        <div className="px-2 py-1 bg-brand-success/15 text-brand-success rounded-lg font-mono font-bold text-[10px] flex items-center gap-0.5">
                          +{currentResume.subscores.impactVerbs.optimized - currentResume.subscores.impactVerbs.original}%
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Content Enhancements side-by-side comparative list */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white tracking-tight">Content Enhancements</h3>
                  
                  <div className="space-y-4">
                    {/* Comparative row mapped based on experience */}
                    {currentResume.experience.map(job => (
                      job.bullets.map(b => (
                        <div key={b.id} className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden flex flex-col md:flex-row hover:border-brand-primary/40 transition-colors shadow-sm">
                          {/* L: Original Left with orange warnings */}
                          <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-outline-variant bg-surface-container/30 space-y-3.5">
                            <div className="flex items-center gap-2 select-none text-on-surface-variant">
                              <Info className="w-4 h-4 text-outline" />
                              <span className="text-xs font-mono font-semibold uppercase tracking-wider">Original Experience Bullet</span>
                            </div>
                            <div className="p-3.5 rounded-xl border border-outline-variant bg-surface-variant font-sans text-sm text-on-surface leading-normal select-none">
                              {b.original}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-3 flex items-start gap-1.5 leading-relaxed">
                              <AlertTriangle className="w-4 h-4 text-brand-warning shrink-0 mt-0.5" />
                              <span>{b.explanation}</span>
                            </p>
                          </div>

                          {/* R: Optimized Right with active greens */}
                          <div className="flex-1 p-5 bg-surface-container-low relative flex flex-col justify-between min-h-[170px]">
                            {/* Pulse fix state badge */}
                            <div className="absolute top-0 right-0 py-1.5 px-3 bg-brand-success/15 text-brand-success rounded-bl-2xl font-mono text-[10px] uppercase font-bold tracking-wider select-none pr-3 animate-pulse">
                              Applied Fix
                            </div>

                            <div className="space-y-3.5 pr-20">
                              <div className="flex items-center gap-2 text-brand-success select-none">
                                <Sparkle className="w-4 h-4 text-brand-success shrink-0" />
                                <span className="text-xs font-mono font-bold uppercase tracking-wider shimmer-active">AI Optimized Bullet</span>
                              </div>
                              <div className="p-3.5 rounded-xl border border-brand-primary/20 bg-brand-primary/5 font-sans text-sm text-white font-medium leading-relaxed">
                                {b.optimized}
                              </div>
                            </div>

                            {/* bottom metadata tags */}
                            <div className="mt-4 flex flex-wrap gap-1.5 select-none justify-start pt-2">
                              {b.tags.map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded-md text-[10px] font-mono font-semibold">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* ==================== SCREEN 4: SANDBOX CUSTOM REWRITER ==================== */}
            {activeScreen === 'optimizations' && (
              <motion.div 
                key="sandbox-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8 animate-fade-in-up"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Sandbox AI Rewriter</h1>
                  <p className="text-xs text-on-surface-variant font-medium mt-2">
                    Test the live Gemini model on any resume bullet point or write custom accomplishments here!
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Input Panel */}
                  <form 
                    onSubmit={handleCustomBulletOptimize}
                    className="lg:col-span-7 bg-surface-container border border-outline-variant p-6 rounded-2xl shadow-xl space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface-variant block">
                        Accomplishment Bullet (Before)
                      </label>
                      <textarea 
                        rows={4}
                        placeholder='e.g., "I made a website faster. I also helped on the database sometimes."'
                        value={customBulletInput}
                        onChange={(e) => setCustomBulletInput(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant p-4 rounded-xl text-sm text-on-surface focus:outline-none focus:border-brand-primary font-sans leading-relaxed resize-none focus:ring-1 focus:ring-brand-primary/30 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface-variant block">
                          Target Role / Job Title
                        </label>
                        <input 
                          type="text"
                          value={customBulletRole}
                          onChange={(e) => setCustomBulletRole(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant p-3 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface-variant block">
                          Primary API Model
                        </label>
                        <select className="w-full bg-surface-container-lowest border border-outline-variant p-3 rounded-xl text-xs text-on-surface focus:outline-none focus:border-brand-primary cursor-default">
                          <option>gemini-3.5-flash (Default scale)</option>
                          <option>gemini-3.1-pro-preview (Paid keys req)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                      <button 
                        type="submit"
                        disabled={apiOptimizing || !customBulletInput.trim()}
                        className="flex-1 py-3 px-4 bg-brand-primary text-white rounded-xl font-bold text-xs hover:opacity-90 transition-opacity active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {apiOptimizing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Optimizing via Gemini...</span>
                          </>
                        ) : (
                          <>
                            <Sparkle className="w-4 h-4 text-brand-success" />
                            <span>Rewrite accomplished with AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Right Column: Dynamic Output Panel */}
                  <div className="lg:col-span-5 bg-surface-container-low border border-outline-variant p-6 rounded-2xl min-h-[300px] flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface-variant block mb-4 border-b border-outline-variant pb-2">
                        AI Output Stream
                      </h4>

                      {apiOptimizing ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                          <RefreshCw className="w-10 h-10 animate-spin text-brand-primary" />
                          <p className="text-xs text-on-surface-variant max-w-[200px]">Generating metrics and active verbs using Cloud models...</p>
                        </div>
                      ) : customOptimizedResult ? (
                        <div className="space-y-5 animate-fade-in-up">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-bold text-brand-success uppercase tracking-wider block">Recommended rewritten bullet:</span>
                            <div className="p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/20 text-sm text-white leading-relaxed font-semibold">
                              "{customOptimizedResult.optimized}"
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-bold text-brand-warning uppercase tracking-wider block">AI Correction Feedback:</span>
                            <p className="text-xs text-on-surface-variant leading-relaxed">
                              {customOptimizedResult.explanation}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {customOptimizedResult.tags?.map((tag: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-surface-container-highest rounded text-[10px] font-mono text-on-surface font-semibold">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-14 text-on-surface-variant select-none space-y-2">
                          <Sparkles className="w-8 h-8 text-outline mx-auto animate-bounce opacity-40" />
                          <p className="text-xs max-w-[200px] mx-auto">Input any resume accomplishment bullet on the left form to see rewrite results.</p>
                        </div>
                      )}
                    </div>

                    {customOptimizedResult && (
                      <button 
                        onClick={applyCustomBulletToActiveResume}
                        className="w-full mt-6 py-3 px-4 bg-brand-success text-white font-bold text-xs rounded-xl hover:opacity-95 transition-opacity active:scale-95 duration-150 flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Infect directly into Custom Resume Workload
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==================== SCREEN 5: APP SETTINGS PANEL ==================== */}
            {activeScreen === 'settings' && (
              <motion.div 
                key="settings-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8 animate-fade-in-up"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Settings</h1>
                  <p className="text-xs text-on-surface-variant font-medium mt-2">
                    Manage Career track parameters, parsing parameters, and server-side connections.
                  </p>
                </div>

                <div className="bg-surface-container border border-outline-variant p-6 rounded-2xl shadow-xl space-y-6">
                  
                  {/* Option 1: Persona choice */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border-b border-outline-variant pb-6">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Default Target ATS Career Track</h4>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        Specify target professions to prioritize exact keyword matches from that industry.
                      </p>
                    </div>
                    <div>
                      <select 
                        value={selectedResumeId}
                        onChange={(e) => {
                          handleSelectResume(e.target.value, 'settings');
                          triggerToast("Career track changed successfully.");
                        }}
                        className="w-full bg-surface-container-low border border-outline-variant p-3.5 rounded-xl text-xs text-on-surface outline-none cursor-pointer focus:border-brand-primary/50"
                      >
                        <option value="SoftwareEngineer_2023.pdf">Software Engineering Track (Senior Web Dev)</option>
                        <option value="Product_Manager_v2.pdf">Product Management Track (Mobile / Growth)</option>
                        <option value="PM_Google_App_Final.docx">Marketing &amp; Content Track (Growth specialist)</option>
                      </select>
                    </div>
                  </div>

                  {/* New Option: Model selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border-b border-outline-variant pb-6">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Gemini Processing Model Type</h4>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        Select the primary AI engine used for scanning layout nodes and generating smart optimization advice.
                      </p>
                    </div>
                    <div>
                      <select 
                        value={selectedAIModel}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedAIModel(val);
                          localStorage.setItem('settings_selectedAIModel', val);
                          triggerToast(`Selected model updated to ${val}`);
                        }}
                        className="w-full bg-surface-container-low border border-outline-variant p-3.5 rounded-xl text-xs text-on-surface outline-none cursor-pointer focus:border-brand-primary/50"
                      >
                        <option value="gemini-3.5-flash">Gemini 3.5 Flash (Ultra-Fast & Smart)</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Standard Speed)</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (High Precision Parsing)</option>
                      </select>
                    </div>
                  </div>

                  {/* Option 2: Server connection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border-b border-outline-variant pb-6">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Gemini API Key configuration</h4>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        Displays status of external variables configured in Google AI Studio secrets manager.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-2 bg-brand-primary/5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-2 ${hasServerApiKey ? 'text-brand-success border-brand-success/20 bg-brand-success/5' : 'text-brand-warning border-brand-warning/20 bg-brand-warning/5'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${hasServerApiKey ? 'bg-brand-success' : 'bg-brand-warning animate-pulse'}`} />
                        {hasServerApiKey ? 'LIVE KEY DETECTED (GEMINI_API_KEY)' : 'SANDBOX SIMULATED (FALLBACK ACTIVATED)'}
                      </div>
                    </div>
                  </div>

                  {/* Option 3: Checkboxes parameter toggle */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-xs">Parsing constraints options</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <label className="flex items-start gap-3 p-4 rounded-xl border border-outline-variant bg-surface-container-low cursor-pointer hover:border-brand-primary/50 transition-colors select-none">
                        <input 
                          type="checkbox" 
                          checked={enforceStrictATS} 
                          onChange={(e) => {
                            const val = e.target.checked;
                            setEnforceStrictATS(val);
                            localStorage.setItem('settings_enforceStrictATS', String(val));
                            triggerToast(val ? "Strict ATS parsability enabled!" : "Strict ATS disabled.");
                          }}
                          className="mt-1 accent-brand-primary shrink-0" 
                        />
                        <div>
                          <span className="text-xs font-semibold text-white block">Enforce Strict ATS Parsability</span>
                          <span className="text-[10px] text-on-surface-variant block mt-0.5">Strips unreadable nested layouts or grid blocks automatic.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 rounded-xl border border-outline-variant bg-surface-container-low cursor-pointer hover:border-brand-primary/50 transition-colors select-none">
                        <input 
                          type="checkbox" 
                          checked={autoIncludeMetrics} 
                          onChange={(e) => {
                            const val = e.target.checked;
                            setAutoIncludeMetrics(val);
                            localStorage.setItem('settings_autoIncludeMetrics', String(val));
                            triggerToast(val ? "Auto-include quantifiable metrics enabled!" : "Metric constraints disabled.");
                          }}
                          className="mt-1 accent-brand-primary shrink-0" 
                        />
                        <div>
                          <span className="text-xs font-semibold text-white block">Auto-include Quantifiable Metrics</span>
                          <span className="text-[10px] text-on-surface-variant block mt-0.5">Demands high-impact business outcomes dynamically.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 rounded-xl border border-outline-variant bg-surface-container-low cursor-pointer hover:border-brand-primary/50 transition-colors select-none md:col-span-2">
                        <input 
                          type="checkbox" 
                          checked={suggestKeywordsMatch} 
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSuggestKeywordsMatch(val);
                            localStorage.setItem('settings_suggestKeywordsMatch', String(val));
                            triggerToast(val ? "Proactive ATS keyword matching enabled!" : "ATS keyword matching disabled.");
                          }}
                          className="mt-1 accent-brand-primary shrink-0" 
                        />
                        <div>
                          <span className="text-xs font-semibold text-white block">Active Keyword Density Suggestion</span>
                          <span className="text-[10px] text-on-surface-variant block mt-0.5">Scans resume for core keywords and tags gaps relative to target career tracks.</span>
                        </div>
                      </label>

                    </div>
                  </div>

                  {/* Option 4: Custom Target Job Description */}
                  <div className="border-t border-outline-variant pt-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Target Job Description Matching</h4>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed font-sans">
                        Input the job description you are targeting. We will automatically highlight missing skills and identify bullet points on the <strong className="text-brand-primary">Analysis</strong> screen that lack matching keywords.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <textarea
                        value={targetJobDescription}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTargetJobDescription(val);
                          localStorage.setItem('settings_targetJobDescription', val);
                        }}
                        placeholder="Paste target job description here (e.g. Seeking a Senior Web Developer with strong skills in React, TypeScript, Node.js, GraphQL, and AWS...)"
                        rows={5}
                        className="w-full bg-surface-container-lowest border border-outline-variant p-4 rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-brand-primary/40 focus:border-brand-primary placeholder:text-on-surface-variant/40 font-sans leading-relaxed"
                      />
                      <div className="flex justify-between items-center text-[11px] font-mono">
                        <span className="text-on-surface-variant flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                          {getJobKeywords(targetJobDescription).length} unique keywords extracted
                        </span>
                        {targetJobDescription.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetJobDescription('');
                              localStorage.removeItem('settings_targetJobDescription');
                              triggerToast("Target Job Description cleared successfully.");
                            }}
                            className="text-brand-error hover:underline cursor-pointer"
                          >
                            Clear job description
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </main>

        {/* 5. MOBILE BOTTOM NAVIGATION HEADER */}
        <nav id="mobile-bottom-nav" className="bg-surface-container fixed bottom-0 w-full z-50 md:hidden border-t border-outline-variant shadow-[0_-4px_16px_rgba(0,0,0,0.45)] h-16 flex justify-around items-center px-4">
          
          <button 
            onClick={() => setActiveScreen('dashboard')}
            className={`flex flex-col items-center justify-center transition-all ${activeScreen === 'dashboard' ? 'text-brand-primary font-bold' : 'text-on-surface-variant'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-1">Home</span>
          </button>

          <button 
            onClick={() => handleSelectResume(selectedResumeId, 'analysis')}
            className={`flex flex-col items-center justify-center transition-all ${activeScreen === 'analysis' ? 'text-brand-primary font-bold' : 'text-on-surface-variant'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] mt-1">Analysis</span>
          </button>

          <button 
            onClick={() => setActiveScreen('comparison')}
            className={`flex flex-col items-center justify-center transition-all ${activeScreen === 'comparison' ? 'text-brand-primary font-bold' : 'text-on-surface-variant'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] mt-1">Compare</span>
          </button>

          <button 
            onClick={() => setActiveScreen('optimizations')}
            className={`flex flex-col items-center justify-center transition-all ${activeScreen === 'optimizations' ? 'text-brand-primary font-bold' : 'text-on-surface-variant'}`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] mt-1">Rewrite</span>
          </button>

        </nav>

      </div>

      {/* GLOBAL SECURE AUTH MODAL (SIGN IN / REGISTER) */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setIsAuthModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-container border border-outline-variant p-8 rounded-2xl max-w-md w-full shadow-2xl relative"
            >
              {/* Close Icon button */}
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-white text-2xl leading-none cursor-pointer"
              >
                &times;
              </button>

              <div className="text-center space-y-1.5 pb-2">
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-4 border border-brand-primary/20">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-white font-sans">
                  {authTab === 'login' ? 'Sign In to ResumeAI Pro' : 'Register Secure Profile'}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {authTab === 'login' ? 'Securely load and manage your scanned resumes worldwide' : 'Create an account to persist your files and suggestions.'}
                </p>
              </div>

              {/* TABS HEADER CONTROL */}
              <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant gap-1.5 select-none my-4">
                <button 
                  type="button"
                  onClick={() => setAuthTab('login')}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-colors cursor-pointer ${authTab === 'login' ? 'bg-brand-primary text-white shadow-md' : 'text-on-surface-variant hover:text-white'}`}
                >
                  Sign In
                </button>
                <button 
                  type="button"
                  onClick={() => setAuthTab('register')}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-colors cursor-pointer ${authTab === 'register' ? 'bg-brand-primary text-white shadow-md' : 'text-on-surface-variant hover:text-white'}`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-5 pt-1">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface-variant block">
                    Email Address
                  </label>
                  <input 
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant p-3.5 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary/40 focus:border-brand-primary shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface-variant block">
                    Password Verification
                  </label>
                  <input 
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant p-3.5 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary/40 focus:border-brand-primary shadow-inner"
                  />
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant text-[11px] text-on-surface-variant leading-relaxed font-sans">
                  {authTab === 'login' 
                    ? 'Session is maintained securely inside continuous token store variables.' 
                    : 'Your password is model encrypted using cryptographic scrypt hashes on the server.'}
                </div>

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-xs hover:opacity-95 transition-opacity active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-brand-primary/10 cursor-pointer disabled:opacity-40"
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>{authTab === 'login' ? 'Sign In and Sync' : 'Provision Account'}</span>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Utility styling logic
function bulletStatusColor(status: 'pending' | 'applied'): string {
  if (status === 'applied') {
    return 'hover:bg-brand-success/15 border-l-2 border-brand-success text-white pl-2 p-1.5 rounded transition-all duration-200';
  }
  return 'hover:bg-brand-warning/15 border-l-2 border-brand-warning text-on-surface pl-2 p-1.5 rounded transition-all duration-200';
}
