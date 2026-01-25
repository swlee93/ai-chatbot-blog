'use client';

import { cn } from '@/lib/utils';
import { Database, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  {
    href: '/',
    label: 'Interview',
    icon: MessageSquare,
  },
  {
    href: '/blog/context',
    label: 'Context',
    icon: Database,
  },
];

export function BlogNav() {
  const pathname = usePathname();

  return (
    <nav className="group/nav relative z-10 flex h-14 items-center justify-center px-6 opacity-40 transition-opacity duration-300 hover:opacity-100">
      <div className="flex items-center gap-1 scale-75 transition-transform duration-300 group-hover/nav:scale-100">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
