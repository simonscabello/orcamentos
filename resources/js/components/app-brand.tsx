import { Link } from '@inertiajs/react';
import { FileText } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Marca do produto: ícone + nome. Usada no cabeçalho, no menu e no login. */
export function AppBrand({
    className,
    size = 'md',
    asLink = true,
}: {
    className?: string;
    size?: 'md' | 'lg';
    asLink?: boolean;
}) {
    const content = (
        <>
            <span
                className={cn(
                    'bg-primary text-primary-foreground flex items-center justify-center rounded-xl',
                    size === 'lg' ? 'size-12 rounded-2xl' : 'size-9',
                )}
            >
                <FileText
                    className={size === 'lg' ? 'size-6' : 'size-5'}
                    aria-hidden="true"
                />
            </span>
            <span
                translate="no"
                className={cn(
                    'text-foreground font-bold tracking-tight',
                    size === 'lg' ? 'text-xl' : 'text-base',
                )}
            >
                Orçamentos
            </span>
        </>
    );

    if (!asLink) {
        return (
            <span className={cn('flex items-center gap-2.5', className)}>
                {content}
            </span>
        );
    }

    return (
        <Link
            href="/dashboard"
            aria-label="Ir para o início"
            className={cn(
                'flex items-center gap-2.5 rounded-xl transition-opacity hover:opacity-80',
                className,
            )}
        >
            {content}
        </Link>
    );
}
