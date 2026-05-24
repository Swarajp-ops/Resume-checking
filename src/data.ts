import { ResumeData } from './types';

export const SAMPLE_RESUMES: Record<string, ResumeData> = {
  // 1. Software Engineer (Based on Image 2 and Image 3)
  'SoftwareEngineer_2023.pdf': {
    id: 'res-se-1',
    filename: 'SoftwareEngineer_2023.pdf',
    uploadedAt: 'Today at 10:42 AM',
    contact: {
      name: 'John Doe',
      location: 'San Francisco, CA',
      email: 'john.doe@email.com',
      phone: '(555) 123-4567',
      linkedin: 'linkedin.com/in/johndoe',
    },
    summary: {
      original: 'Experienced software developer with a background in web applications. Good at problem solving and working in teams. Looking for a new role in a growing company.',
      optimized: 'Results-driven Senior Software Engineer with 4+ years of experience architecting scalable web applications. Proven track record of optimizing backend performance by 30% and leading cross-functional agile teams.',
      status: 'pending',
      explanation: 'Your current summary is generic, passive, and lacks quantifiable achievements. The optimized version outlines exact domain expertise, years of experience, and concrete leadership achievements.',
    },
    experience: [
      {
        id: 'exp-se-1',
        role: 'Senior Web Developer',
        company: 'Tech Solutions Inc.',
        period: 'Jan 2020 - Present',
        bullets: [
          {
            id: 'bull-se-1',
            original: 'Worked on backend APIs using Node.js and Express.',
            optimized: 'Designed and implemented high-throughput RESTful APIs using Node.js and Express, supporting a 50% increase in daily active users with sub-100ms response times.',
            feedbackType: 'Missing Metrics',
            severity: 'warning',
            explanation: 'Explain the scale of the service you worked on. Quantify user metrics or backend performance metrics to show true engineering impact.',
            status: 'pending',
            tags: ['Added Scale', 'Improved Verbs', 'Backend Performance'],
          },
          {
            id: 'bull-se-2',
            original: 'Managed database migrations and updates.',
            optimized: 'Orchestrated 15+ complex Postgres schema migrations with zero system downtime, refactoring composite index queries to reduce average database read latency by 42%.',
            feedbackType: 'Weak Impact',
            severity: 'error',
            explanation: 'Simply updating databases does not capture the complexity. Highlight the scale of database migrations and speed improvements.',
            status: 'pending',
            tags: ['Strong Verbs', 'Database Optimization'],
          },
          {
            id: 'bull-se-3',
            original: 'Collaborated with frontend team to deliver features on time.',
            optimized: 'Partnered with cross-functional React engineers to deliver 12 major product features in 2-week sprints, achieving a 98% sprint commitment reliability rate.',
            feedbackType: 'Passive Phrasing',
            severity: 'info',
            explanation: 'Replace "collaborated" with active partnership and mention the delivery cadence or velocity of the team.',
            status: 'pending',
            tags: ['Active Phrasing', 'Agile Delivery'],
          }
        ]
      }
    ],
    skills: {
      original: 'Good communicator, Python, SQL, data, teamwork, Excel.',
      optimizedCategories: [
        { category: 'Languages', skills: ['Python', 'SQL', 'JavaScript', 'TypeScript'] },
        { category: 'Tools & Platforms', skills: ['PostgreSQL', 'Tableau', 'Advanced Excel', 'Docker'] },
        { category: 'Core Competencies', skills: ['Data Query Optimization', 'Backend Architecture', 'Agile/Scrum'] }
      ],
      tags: ['Categorized Format', 'Removed Hard Softskills'],
      status: 'pending',
    },
    originalScore: 60,
    currentScore: 60,
    optimizedScore: 88,
    subscores: {
      keywordMatch: { original: 55, current: 55, optimized: 85 },
      parsability: { original: 68, current: 68, optimized: 92 },
      impactVerbs: { original: 50, current: 50, optimized: 88 },
    }
  },

  // 2. Product Manager (Based on Image 1)
  'Product_Manager_v2.pdf': {
    id: 'res-pm-1',
    filename: 'Product_Manager_v2.pdf',
    uploadedAt: 'Yesterday at 3:15 PM',
    contact: {
      name: 'Sarah Jenkins',
      location: 'New York, NY',
      email: 's.jenkins@email.com',
      phone: '(555) 987-6543',
      linkedin: 'linkedin.com/in/sjenkins-pm',
    },
    summary: {
      original: 'Energetic Product Manager with experience leading developers to build features. Passionate about customers and looking for growth opportunities.',
      optimized: 'Metrics-driven Senior Product Manager with 5+ years of scaling consumer mobile apps. Expert in user retention strategy, managing $1M+ budgets, and directing Agile product lifecycles.',
      status: 'pending',
      explanation: 'Your profile introductory statement contains generic filler words. The optimized version outlines specific domains (mobile, consumer apps) and highlights budget scope.',
    },
    experience: [
      {
        id: 'exp-pm-1',
        role: 'Product Manager',
        company: 'AppSpace Corporation',
        period: 'Mar 2021 - Present',
        bullets: [
          {
            id: 'bull-pm-1',
            original: 'Managed a team of developers to build new features for the company app. We released it on time and users liked it.',
            optimized: 'Spearheaded a cross-functional Agile team of 8 engineers to architect and deploy 3 major iOS/Android features, resulting in a 24% increase in user retention within Q3.',
            feedbackType: 'Weak Impact',
            severity: 'error',
            explanation: 'Lacks quantifiable metrics, weak action verbs, and misses target keywords like Agile, iOS, or Android.',
            status: 'pending',
            tags: ['Added Metrics', 'Strong Verbs', '+ Agile'],
          },
          {
            id: 'bull-pm-2',
            original: 'Ran A/B testing on pricing parameters to increase sales.',
            optimized: 'Designed and executed 14 multi-variant pricing A/B tests that optimized standard checkout flows, capturing a $320K incremental annual revenue increase.',
            feedbackType: 'Missing Metrics',
            severity: 'warning',
            explanation: 'What was the exact business outcome? Adding money or percentage increases makes this highly compelling.',
            status: 'pending',
            tags: ['A/B Testing', 'Revenue Impact'],
          }
        ]
      }
    ],
    skills: {
      original: 'Communicating, Jira, wireframing, SQL, roadmap, analytics.',
      optimizedCategories: [
        { category: 'Product Management', skills: ['Agile Roadmap Planning', 'User Persona Research', 'Wireframing'] },
        { category: 'Analytics & Dev', skills: ['SQL (Postgres)', 'Jira Admin', 'Tableau', 'A/B Testing'] },
        { category: 'Methodologies', skills: ['Scrum Framework', 'Feature Prioritization (RICE)'] }
      ],
      tags: ['ATS Structure Optimization', 'Structured Categories'],
      status: 'pending',
    },
    originalScore: 28,
    currentScore: 28,
    optimizedScore: 82,
    subscores: {
      keywordMatch: { original: 42, current: 42, optimized: 86 },
      parsability: { original: 39, current: 39, optimized: 90 },
      impactVerbs: { original: 34, current: 34, optimized: 85 },
    }
  },

  // 3. Marketing Manager Draft
  'PM_Google_App_Final.docx': {
    id: 'res-mk-1',
    filename: 'PM_Google_App_Final.docx',
    uploadedAt: 'Today at 8:15 AM',
    contact: {
      name: 'Michael Chang',
      location: 'Austin, TX',
      email: 'm.chang@email.com',
      phone: '(555) 456-7890',
      linkedin: 'linkedin.com/in/changmarketing',
    },
    summary: {
      original: 'Marketing specialist focused on digital systems and brand growth. Strong writer and content strategist with positive attitude.',
      optimized: 'Growth Marketing Executive specializing in multi-channel paid acquisition. Managed $400K+ annual ad spend, scaling user acquisition by 3x and lowering average CAC by 35%.',
      status: 'pending',
      explanation: 'Your intro summary reads like an employee self-review. The rewrite gives absolute financial parameters ($400k+ budget) and clear metrics (user acquisition scale).',
    },
    experience: [
      {
        id: 'exp-mk-1',
        role: 'Growth Strategist',
        company: 'Velo Brand Agency',
        period: 'Jun 2019 - Present',
        bullets: [
          {
            id: 'bull-mk-1',
            original: 'Handled social media ads and wrote articles for the company blog to raise awareness.',
            optimized: 'Directed the creative strategy and deployment of Facebook/Google PPC campaigns with $35k monthly budgets, improving organic traffic by 85% via targeted SEO content.',
            feedbackType: 'Weak Impact',
            severity: 'error',
            explanation: 'Vague verbs like "handled social systems". Replacing them with PPC, search parameters, and organic traffic metrics is vastly more competitive.',
            status: 'pending',
            tags: ['SEO Marketing', 'Active Verbs', 'Paid Acquisition'],
          },
          {
            id: 'bull-mk-2',
            original: 'Sent out regular email newsletters to our subscriber lists.',
            optimized: 'Developed and automated lifecycle email drip nurturing programs for 50k+ subscribers, scaling aggregate open rates to 31% and direct attribution sales by 18%.',
            feedbackType: 'Missing Metrics',
            severity: 'warning',
            explanation: 'What was the list size? Newsletter stats (Open/Click rates, CTR) should be included.',
            status: 'pending',
            tags: ['Lifecycle Drip', 'Automation Scale'],
          }
        ]
      }
    ],
    skills: {
      original: 'Copywriting, Facebook advertising, SEO, team leading, blogs.',
      optimizedCategories: [
        { category: 'Paid Performance', skills: ['Google AdWords', 'Facebook/Meta Ads Manager', 'CTR Optimization'] },
        { category: 'Strategy & Growth', skills: ['SEO Content Lifecycle', 'Content Inbound funneling', 'Klaviyo Automation'] },
        { category: 'Analytics', skills: ['Google Analytics v4', 'A/B Messaging Analysis'] }
      ],
      tags: ['Added Platform Names', 'Categorized Layout'],
      status: 'pending',
    },
    originalScore: 68,
    currentScore: 68,
    optimizedScore: 84,
    subscores: {
      keywordMatch: { original: 72, current: 72, optimized: 88 },
      parsability: { original: 70, current: 70, optimized: 91 },
      impactVerbs: { original: 62, current: 62, optimized: 85 },
    }
  }
};
