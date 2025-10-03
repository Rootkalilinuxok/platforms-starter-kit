import Link from 'next/link';
import type {Route} from 'next';

import {buttonVariants} from '@/components/ui/button';
import {cn} from '@/lib/utils';

interface CtaLink {
  label: string;
  href?: string;
  external?: boolean;
}

interface DualCtaProps {
  primary: CtaLink;
  secondary?: CtaLink;
  caption?: string;
}

function renderLink(link: CtaLink, className: string) {
  if (!link.href) {
    return null;
  }

  const isExternal = link.external ?? link.href.startsWith('http');

  if (isExternal) {
    return (
      <a href={link.href} className={className} target="_blank" rel="noreferrer">
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href as Route} className={className}>
      {link.label}
    </Link>
  );
}

export function DualCta({primary, secondary, caption}: DualCtaProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-wrap gap-3">
        {renderLink(primary, cn(buttonVariants({size: 'lg'}), 'px-6 shadow-md shadow-primary/20'))}
        {secondary
          ? renderLink(secondary, cn(buttonVariants({variant: 'ghost', size: 'lg'}), 'px-6'))
          : null}
      </div>
      {caption ? <p className="text-sm text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
