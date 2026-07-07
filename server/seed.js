// Initial sessions loaded into MongoDB the first time the server starts with an
// empty collection. Mirrors the built-in list the frontend used to seed from.
export const seedWebinars = [
  {
    id: 'claude-foundations',
    kind: 'Webinar',
    title: 'Claude Foundations for Educators',
    date: 'Aug 12, 2026',
    time: '5:00 PM IST · 90 min',
    presenter: 'Bobby Pamarthi',
    role: 'Head of AI Training',
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
    summary: 'Claude, wired into your systems.',
    description:
      'For engineering teams: patterns for adding Claude to existing apps and workflows — APIs, retrieval, guardrails, and cost control, with live examples.',
  },
]
