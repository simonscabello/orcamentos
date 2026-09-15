import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-55 active:scale-[0.99] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
    {
        variants: {
            variant: {
                primary:
                    'bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover',
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-accent',
                outline:
                    'border border-border-strong bg-card text-foreground hover:bg-accent',
                ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
                destructive:
                    'bg-destructive text-destructive-foreground shadow-xs hover:brightness-95',
                link: 'h-auto rounded-sm px-0 text-primary underline-offset-4 hover:underline',
            },
            size: {
                sm: 'h-9 px-3 text-sm [&_svg:not([class*=size-])]:size-4',
                md: 'h-11 px-4 text-sm',
                lg: 'h-12 px-5 text-base',
                xl: 'h-14 px-6 text-base [&_svg:not([class*=size-])]:size-6',
                icon: 'size-11 rounded-xl',
                'icon-sm': 'size-9 rounded-lg [&_svg:not([class*=size-])]:size-4',
            },
        },
        compoundVariants: [
            {
                variant: 'link',
                size: ['sm', 'md', 'lg', 'xl'],
                class: 'h-auto px-0',
            },
        ],
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    },
);

type ButtonProps = React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
        loading?: boolean;
    };

function Button({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    disabled,
    children,
    ...props
}: ButtonProps) {
    // O Slot exige exatamente um filho, por isso o asChild não recebe spinner.
    if (asChild) {
        return (
            <Slot
                data-slot="button"
                className={cn(buttonVariants({ variant, size, className }))}
                {...props}
            >
                {children}
            </Slot>
        );
    }

    return (
        <button
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...props}
        >
            {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
            {children}
        </button>
    );
}

export { Button, buttonVariants };
