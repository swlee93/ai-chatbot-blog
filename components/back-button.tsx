'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string;
  label?: string;
}

export function BackButton({ href = '/blog/context', label = 'Back' }: BackButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (href) {
      // Use Link navigation
      return;
    }
    e.preventDefault();
    router.back();
  };

  const ButtonContent = () => (
    <>
      <ChevronLeft className="size-4" />
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
      >
        <ButtonContent />
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
    >
      <ButtonContent />
    </button>
  );
}
