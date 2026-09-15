import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
    {
        variants: {
            tone: {
                neutral: 'bg-muted text-muted-foreground',
                primary: 'bg-primary-soft text-primary-strong',
                success: 'bg-success-soft text-success',
                warning: 'bg-warning-soft text-warning',
                danger: 'bg-destructive-soft text-destructive',
            },
        },
        defaultVariants: {
            tone: 'neutral',
        },
    },
);

function Badge({
    className,
    tone,
    ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
    return (
        <span className={cn(badgeVariants({ tone }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
