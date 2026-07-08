// All content here is placeholder / mock static data.

export const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Architects', href: '#architects' },
  { label: 'Services', href: '#services' },
  { label: 'Partners', href: '#partners' },
  { label: 'Apps', href: '#apps' },
  { label: 'Contact', href: '#contact' },
]

export const slides = [
  {
    id: 1,
    headline: 'Build the Future with Claude',
    subheadline:
      'Technical Hub partners with institutions and enterprises to ship AI that actually works.',
    cta: 'Explore Services',
    href: '#services',
    gradient: 'from-white via-brand-50 to-brand-100',
  },
  {
    id: 2,
    headline: 'Work with an Official Claude Partner',
    subheadline:
      'Technical Hub is a certified Anthropic partner — bringing Claude to institutions and enterprises with training, products, and integration.',
    cta: 'Partner With Us',
    href: '#contact',
    gradient: 'from-brand-50 via-white to-brand-50',
    partner: true,
  },
  {
    id: 3,
    headline: 'AI Curriculum, Delivered',
    subheadline:
      'Faculty development, hands-on workshops, and integration support — end to end.',
    cta: 'Get In Touch',
    href: '#contact',
    gradient: 'from-white via-brand-50 to-brand-100',
  },
  {
    id: 4,
    headline: 'Claude-Powered Applications',
    subheadline:
      'From Myna to Project Space — real products built on Anthropic’s Claude.',
    cta: 'See Our Apps',
    href: '#apps',
    gradient: 'from-brand-100 via-brand-50 to-white',
  },
]

export const architects = [
  { id: 1, name: 'Harshavardhini', role: 'Claude Architect' },
  { id: 2, name: 'Prasanth', role: 'Claude Architect' },
  { id: 3, name: 'Bobby Pamarthi', role: 'Claude Architect' },
  { id: 4, name: 'Peter', role: 'Claude Architect' },
  { id: 5, name: 'Sudhir', role: 'Claude Architect' },
  { id: 6, name: 'Akhilesh', role: 'Claude Architect' },
  { id: 7, name: 'Bhargav', role: 'Claude Architect' },
  { id: 8, name: 'Manikanta', role: 'Claude Architect' },
  { id: 9, name: 'Naveen', role: 'Claude Architect' },
  { id: 10, name: 'Azar', role: 'Claude Architect' },
]

export const services = [
  {
    id: 'ai-ready-engineer',
    title: 'AI Ready Engineer',
    description:
      "The future won't just need engineers — it will need AI Ready Engineers. In collaboration with Torii Minds and Nagarjuna College, a program preparing students for an AI-driven future.",
    icon: 'spark',
    points: [
      'Understand AI and its real-world applications',
      'Hands-on, practical AI problem solving',
      'Build confidence with emerging technologies',
      'From Engineers → To AI Ready Engineers',
    ],
  },
  {
    id: 'certification',
    title: 'Claude Certification',
    description:
      'Official, structured certification programs that validate real Claude and applied-AI skills.',
    icon: 'academic',
    points: [
      'Official, exam-backed certification tracks',
      'Beginner to advanced Claude skill paths',
      'Hands-on projects and assessments',
      'Shareable, verifiable digital certificates',
    ],
  },
  {
    id: 'training',
    title: 'Claude Training',
    description:
      'Live, hands-on training that turns teams and students into confident Claude builders.',
    icon: 'user',
    points: [
      'Live, instructor-led sessions',
      'Tailored team and student cohorts',
      'Real-world prompt & workflow labs',
      'Post-training support and resources',
    ],
  },
  {
    id: 'products',
    title: 'AI Product Building',
    description:
      'We design and ship production AI products on Claude — from prototype to launch.',
    icon: 'cube',
    points: [
      'Discovery, prototyping, and MVP builds',
      'Production-grade Claude integrations',
      'QA, deployment, and scaling',
      'Ongoing iteration and support',
    ],
  },
  {
    id: 'fdp',
    title: 'FDP & Trainings',
    description:
      'Faculty Development Programs and workshops with ready-to-teach Claude modules.',
    icon: 'book',
    points: [
      'Structured Faculty Development Programs',
      'Ready-to-teach Claude modules',
      'Workshops and hands-on bootcamps',
      'Curriculum and assessment design',
    ],
  },
  {
    id: 'ailab',
    title: 'AI Lab Setup',
    description:
      'End-to-end setup of AI labs in your organization — infrastructure, curriculum, and support.',
    icon: 'building',
    points: [
      'Infrastructure and tooling setup',
      'Curriculum and lab manuals',
      'Trainer and staff enablement',
      'Ongoing maintenance and support',
    ],
  },
  {
    id: 'integration',
    title: 'Claude Integration',
    description:
      'Integrate Claude into your existing tools, workflows, and platforms — seamlessly.',
    icon: 'spark',
    points: [
      'Connect Claude to your existing tools',
      'Workflow and API integration',
      'Secure, scalable deployment',
      'Monitoring and optimization',
    ],
  },
]

// Partners grouped into tiers (sponsor-style layout). `logo` is null until the
// real logo image is dropped in — the card falls back to the initials mark.
export const partnerTiers = [
  {
    id: 'technology',
    label: 'Technology Partner',
    accent: 'coral',
    partners: [
      {
        id: 'toriiminds',
        name: 'Toriiminds',
        tagline: 'Official Claude model provider',
        initials: 'T',
        logo: null,
        link: '#contact',
        linkLabel: 'toriiminds',
      },
    ],
  },
  {
    id: 'academic',
    label: 'Academic Partner',
    accent: 'green',
    partners: [
      {
        id: 'ncet',
        name: 'NCET',
        tagline: 'Nagarjuna College of Engineering & Technology',
        initials: 'N',
        logo: null,
        link: '#contact',
        linkLabel: 'ncet.ac.in',
      },
      {
        id: 'ycce',
        name: 'YCCE',
        tagline: 'Yeshwantrao Chavan College of Engineering',
        initials: 'Y',
        logo: null,
        link: '#contact',
        linkLabel: 'ycce.edu',
      },
      {
        id: 'geeta',
        name: 'Geeta University',
        tagline: 'Partner university for AI programs',
        initials: 'G',
        logo: null,
        link: '#contact',
        linkLabel: 'geetauniversity.edu.in',
      },
    ],
  },
]

export const apps = [
  {
    id: 'myna',
    name: 'Myna',
    description:
      'Elevate your communication with the Myna app. It not only improves how you connect with interviewers but also accelerates your career growth.',
    category: 'Communication',
    bg: 'bg-claude-600',
    link: 'https://myna.toriiminds.com/',
  },
  {
    id: 'project-space',
    name: 'Project Space',
    description:
      'An intelligent project collaboration platform for students, mentors, and administrators. A unified dashboard for project info, team profiles, mentor details, progress updates, attendance, and milestones — with domain-wise categorization and real-time status tracking to simplify project monitoring.',
    category: 'Collaboration',
    bg: 'bg-brand-600',
    link: 'https://projectspace.technicalhub.io',
  },
]

// Upcoming webinars & workshops (frontend-only for now).
export const webinars = [
  {
    id: 'claude-foundations',
    kind: 'Webinar',
    title: 'Claude Foundations for Educators',
    date: 'Aug 12, 2026',
    time: '5:00 PM IST · 90 min',
    presenter: 'Bobby Pamarthi',
    role: 'Head of AI Training',
    gradient: 'from-claude-500 via-claude-600 to-brand-700',
    summary: 'Get started with Claude in the classroom.',
    description:
      'A hands-on introduction to using Claude for teaching and learning — prompt basics, lesson design, and building your first classroom assistant. Perfect for faculty new to AI.',
  },
  {
    id: 'prompt-engineering',
    kind: 'Workshop',
    title: 'Prompt Engineering Masterclass',
    date: 'Aug 20, 2026',
    time: '6:00 PM IST · 2 hrs',
    presenter: 'Harshavardhini',
    role: 'Lead Claude Architect',
    gradient: 'from-brand-500 via-brand-600 to-claude-700',
    summary: 'Write prompts that actually work.',
    description:
      'Go deep on prompt patterns, structured outputs, tool use, and evaluation. Bring a real problem and leave with a production-ready prompt built on Claude.',
  },
  {
    id: 'ai-lab-blueprint',
    kind: 'Webinar',
    title: 'Building an AI Lab: The Blueprint',
    date: 'Sep 03, 2026',
    time: '5:30 PM IST · 60 min',
    presenter: 'Prasanth',
    role: 'AI Solutions Architect',
    gradient: 'from-claude-400 via-claude-600 to-brand-800',
    summary: 'From empty room to running AI lab.',
    description:
      'The exact playbook we use to stand up AI labs on campus — hardware, curriculum, faculty enablement, and Claude integration. Includes a downloadable checklist.',
  },
  {
    id: 'claude-apps',
    kind: 'Workshop',
    title: 'Build a Claude-Powered App in a Day',
    date: 'Sep 15, 2026',
    time: '10:00 AM IST · Full day',
    presenter: 'Peter',
    role: 'Claude Product Lead',
    gradient: 'from-brand-600 via-claude-600 to-claude-500',
    summary: 'Ship a real product with Claude.',
    description:
      'A full-day, code-along workshop where you build and deploy a working Claude application end-to-end — from idea to live demo. Laptops required.',
  },
  {
    id: 'fdp-ai-curriculum',
    kind: 'Webinar',
    title: 'FDP: Designing an AI Curriculum',
    date: 'Sep 24, 2026',
    time: '4:00 PM IST · 90 min',
    presenter: 'Sudhir',
    role: 'Curriculum Director',
    gradient: 'from-claude-600 via-brand-700 to-brand-600',
    summary: 'Curriculum that keeps up with AI.',
    description:
      'A faculty development session on structuring an industry-relevant AI curriculum with Claude at its core — modules, assessments, and hands-on labs.',
  },
  {
    id: 'claude-integration',
    kind: 'Workshop',
    title: 'Integrating Claude into Your Stack',
    date: 'Oct 07, 2026',
    time: '6:00 PM IST · 2 hrs',
    presenter: 'Bhargav',
    role: 'Integration Specialist',
    gradient: 'from-brand-500 via-claude-700 to-claude-600',
    summary: 'Claude, wired into your systems.',
    description:
      'For engineering teams: patterns for adding Claude to existing apps and workflows — APIs, retrieval, guardrails, and cost control, with live examples.',
  },
]

export const contactDetails = [
  { id: 'email', label: 'Email', value: 'support@technicalhub.io', href: 'mailto:support@technicalhub.io', icon: 'mail' },
  { id: 'mobile', label: 'Mobile', value: '+91 98765 43210', href: 'tel:+919876543210', icon: 'phone' },
  // { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/company/technicalhub', href: 'https://linkedin.com/company/technicalhub', icon: 'linkedin' },
  // { id: 'address', label: 'Address', value: '4th Floor, Innovation Towers, HITEC City, Hyderabad, India 500081', href: null, icon: 'pin' },
]
