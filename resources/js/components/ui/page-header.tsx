import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type PageHeaderProps = {
    title: string;
    description?: string;
    /** Rótulo curto acima do título (ex.: "Orçamento"). */
    eyebrow?: string;
    /** Link de volta exibido acima do título. */
    backHref?: string;
    backLabel?: string;
    /** Ação principal da página, alinhada à direita no desktop. */
    action?: ReactNode;
    className?: string;
};

export function PageHeader({
    title,
    description,
    eyebrow,
    backHref,
    backLabel = 'Voltar',
    action,
    className,
}: PageHeaderProps) {
    return (
        <header className={cn('mb-5', className)}>
            {backHref && (
                <Link
                    href={backHref}
                    className="-ml-2 mb-2 inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    {backLabel}
                </Link>
            )}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    {eyebrow && (
                        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                            {eyebrow}
                        </p>
                    )}
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-display">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
        </header>
    );
}
