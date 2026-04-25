// icons.jsx — tiny Lucide-style stroke icons as React components
// Stroke 1.75, currentColor fills, 16px default size.

const Ico = ({ d, size = 16, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
       {...rest}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const I = {
  Home: (p) => <Ico {...p} d={<><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></>} />,
  Users: (p) => <Ico {...p} d={<><circle cx="9" cy="8" r="4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="3"/><path d="M21 19c0-2.2-1.8-4-4-4"/></>} />,
  FileText: (p) => <Ico {...p} d={<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h6"/></>} />,
  LayoutTemplate: (p) => <Ico {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></>} />,
  ClipboardCheck: (p) => <Ico {...p} d={<><rect x="8" y="3" width="8" height="4" rx="1"/><path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/><path d="m9 13 2 2 4-4"/></>} />,
  Shield: (p) => <Ico {...p} d={<path d="M12 2 4 6v6c0 5 3.4 9.3 8 10 4.6-.7 8-5 8-10V6l-8-4Z"/>} />,
  Bell: (p) => <Ico {...p} d={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>} />,
  RefreshCw: (p) => <Ico {...p} d={<><path d="M21 12a9 9 0 0 0-15-6.7L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/><path d="M21 21v-5h-5"/></>} />,
  Plus: (p) => <Ico {...p} d="M12 5v14M5 12h14" />,
  Search: (p) => <Ico {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>} />,
  ChevronDown: (p) => <Ico {...p} d="m6 9 6 6 6-6" />,
  ChevronRight: (p) => <Ico {...p} d="m9 6 6 6-6 6" />,
  ArrowRight: (p) => <Ico {...p} d="M5 12h14m-6-6 6 6-6 6" />,
  Send: (p) => <Ico {...p} d={<><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/></>} />,
  Save: (p) => <Ico {...p} d={<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></>} />,
  Download: (p) => <Ico {...p} d={<><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>} />,
  GitCommit: (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M3 12h6M15 12h6"/></>} />,
  Sparkles: (p) => <Ico {...p} d={<><path d="m12 3 2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M19 13v4M17 15h4"/></>} />,
  CheckCircle: (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></>} />,
  LogOut: (p) => <Ico {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></>} />,
  Star: (p) => <Ico {...p} d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />,
  BarChart: (p) => <Ico {...p} d={<><path d="M3 3v18h18"/><path d="M7 14v4M12 8v10M17 11v7"/></>} />,
  TrendingUp: (p) => <Ico {...p} d="m3 17 6-6 4 4 8-8M15 7h6v6" />,
  Mail: (p) => <Ico {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>} />,
  Edit: (p) => <Ico {...p} d="M17 3 21 7 8 20H4v-4L17 3Z" />,
  Trash: (p) => <Ico {...p} d={<><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></>} />,
  Key: (p) => <Ico {...p} d="M21 2 12 11m-2 2a4 4 0 1 1-4-4 4 4 0 0 1 4 4Zm8-6 3 3m-5-1 3 3" />,
  Wand: (p) => <Ico {...p} d="M15 4V2m0 14v-2m-6-6H7m14 0h-2M5.6 5.6 4.2 4.2M20 20l-1.4-1.4m0-13.2L20 4M4.2 19.8 5.6 18.4M13 7l5 5-8 8H5v-5l8-8Z" />,
  MessageSquare: (p) => <Ico {...p} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
};

Object.assign(window, { Ico, I });
