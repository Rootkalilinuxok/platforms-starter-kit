import {ReactNode} from 'react';

import {cn} from '@/lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  className
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 text-balance sm:flex-row sm:items-end sm:justify-between sm:gap-6',
        className
      )}
    >
      <div className="max-w-2xl space-y-2">
        {eyebrow ? (
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
        {description ? (
          <p className="text-base text-muted-foreground sm:text-lg">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
