// data.jsx — mock data shared across screens
const DATA = {
  currentUser: { name: 'Alex Rivera', email: 'alex@jointheleague.org', role: 'Instructor · Admin', initials: 'AR' },

  month: '2026-04',
  months: [
    { v: '2026-04', l: 'April 2026' },
    { v: '2026-03', l: 'March 2026' },
    { v: '2026-02', l: 'February 2026' },
    { v: '2026-01', l: 'January 2026' },
    { v: '2025-12', l: 'December 2025' },
    { v: '2025-11', l: 'November 2025' },
  ],

  dashboardStats: [
    { lbl: 'Total students',  num: 18, delta: '+2 this month' },
    { lbl: 'Pending reviews', num: 7,  delta: 'needs action', dir: 'down' },
    { lbl: 'Draft reviews',   num: 4,  delta: '' },
    { lbl: 'Sent reviews',    num: 7,  delta: '+5 vs last month' },
  ],

  students: [
    { name: 'Maya Chen',        gh: 'mayachen-py',   status: 'sent',    grade: 7, class: 'Python Apprentice' },
    { name: 'Devon Okafor',     gh: 'devono',        status: 'draft',   grade: 9, class: 'Java Journeyman' },
    { name: 'Priya Raman',      gh: 'praman-dev',    status: 'pending', grade: 6, class: 'Python Apprentice' },
    { name: 'Jacob Weiss',      gh: 'jacobw',        status: 'sent',    grade: 10, class: 'League Labs' },
    { name: 'Sofía Mendoza',    gh: 'sofimendoza',   status: 'pending', grade: 5, class: 'Micro:bit Electronics' },
    { name: 'Liam O\u2019Brien', gh: 'liamobr',       status: 'draft',   grade: 8, class: 'Robot Riot' },
    { name: 'Aiko Tanaka',      gh: 'aikot',         status: 'sent',    grade: 7, class: 'Python Games' },
    { name: 'Marcus Johnson',   gh: 'mjohnson',      status: 'pending', grade: 11, class: 'AI Agents' },
    { name: 'Nina Patel',       gh: 'ninacodes',     status: 'sent',    grade: 6, class: 'Python Apprentice' },
    { name: 'Theo Brandt',      gh: 'tbrandt',       status: 'pending', grade: 8, class: 'Orbit Lab' },
  ],

  templates: [
    { name: 'Python Apprentice — month summary', subject: 'April progress for {{studentName}}', snippet: 'Hi {{studentName}}, here\u2019s what we covered in Python Apprentice this month…', updated: '2 days ago' },
    { name: 'Java — midterm check-in',            subject: 'Java progress update ({{month}})',     snippet: 'Good work this month on exception handling and the Pig Latin project…', updated: '1 week ago' },
    { name: 'Robotics — build log',               subject: 'Robot Riot update — {{month}}',          snippet: 'Our team finalized the chassis and began sensor wiring this session…', updated: '3 weeks ago' },
    { name: 'League Labs — project milestone',    subject: 'Labs check-in: {{studentName}}',         snippet: 'This month you shipped a working prototype of the API layer…', updated: '1 month ago' },
  ],

  draftReview: {
    studentName: 'Devon Okafor',
    month: 'April 2026',
    subject: 'April progress for Devon Okafor',
    body: `Hi Devon,

Here\u2019s a quick recap of what we covered in Java Journeyman this month.

\u2022 We finished the Interfaces & Polymorphism unit — your BankAccount hierarchy was a highlight. Cleanly separated the abstract class from the two concrete types.
\u2022 We introduced exception handling. Your retry-on-failure pattern for the file loader was better than what I\u2019d sketched on the board.
\u2022 We shipped your first GitHub Pages site with unit tests running in Actions. Nice work getting the badge to render.

Next month we move into collections and generic types. A few things to practice at home:
  1. Rewrite the calculator project using an ArrayList instead of an array.
  2. Read chapter 9 of the textbook before next class.
  3. Commit your code at the end of every session — it\u2019s great resume material.

Let me know if you have questions between now and then.

\u2014 Alex`,
    status: 'draft',
  },

  adminStats: [
    { lbl: 'Reviews sent',   num: 142, delta: '+34 vs March' },
    { lbl: 'Feedback rate',  num: '68%', delta: '+5 pts' },
    { lbl: 'Avg rating',     num: '4.6', delta: '' },
    { lbl: 'Top suggestion', num: 'More projects', small: true },
  ],

  notifications: [
    { kind: 'review',   msg: 'Lauren finished 5 reviews today',       when: '2h ago' },
    { kind: 'feedback', msg: 'New guardian feedback on Maya Chen',    when: '4h ago' },
    { kind: 'checkin',  msg: 'TA check-in due from 2 instructors',     when: 'yesterday' },
    { kind: 'pike13',   msg: 'Pike13 sync completed — 18 rosters',    when: 'yesterday' },
  ],
};

window.DATA = DATA;
