export interface ContextItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  href: string;
  icon: string;
}

export const contextItems: ContextItem[] = [
  {
    id: 'profile',
    title: 'Profile',
    description: 'Core profile details, key strengths, and current focus',
    tags: ['Profile', 'Strengths', 'B2B', 'Observability'],
    href: '/blog/context/profile',
    icon: 'User',
  },
  {
    id: 'experience',
    title: 'Experience',
    description: 'Career history, key projects, and outcomes',
    tags: ['Experience', 'Projects', 'WhaTap', 'Mayi'],
    href: '/blog/context/experience',
    icon: 'Briefcase',
  },
];
