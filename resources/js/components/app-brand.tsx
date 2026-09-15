import { Link, usePage } from '@inertiajs/react';

import { BrandMark } from '@/components/brand-mark';
import { cn } from '@/lib/utils';

/**
 * Marca do produto (símbolo + nome). O nome vem de APP_NAME via Inertia,
 * então trocar a marca não exige mexer nos componentes.
 */
export function AppBrand({
    className,
    size = 'md',
    asLink = true,
    showName = true,
}: {
    className?: string;
    size?: 'md' | 'lg';
    asLink?: boolean;
    showName?: boolean;
}) {
    const { name } = usePage().props;

    const content = (
        <>
            <span
                className={cn(
                    'bg-primary text-primary-foreground flex items-center justify-center',
                    size === 'lg'
                        ? 'size-12 rounded-2xl'
                        : 'size-9 rounded-[0.625rem]',
                )}
            >
                <BrandMark className={size === 'lg' ? 'size-7' : 'size-5'} />
            </span>
            {showName && (
                <span
                    translate="no"
                    className={cn(
                        'text-foreground font-bold tracking-tight',
                        size === 'lg' ? 'text-xl' : 'text-base',
                    )}
                >
                    {name}
                </span>
            )}
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
            aria-label={`${name} — ir para o início`}
            className={cn(
                'flex items-center gap-2.5 rounded-xl transition-opacity hover:opacity-80',
                className,
            )}
        >
            {content}
        </Link>
    );
}
