import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type EmptyStateProps = {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
};

/** Estado vazio padrão: ícone discreto, título, explicação e ação opcional. */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center px-6 py-10 text-center',
                className,
            )}
        >
            <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Icon className="size-6" aria-hidden="true" />
            </span>
            <p className="text-base font-semibold text-foreground">{title}</p>
            {description && (
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
