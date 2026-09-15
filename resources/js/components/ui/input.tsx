import type * as React from 'react';

import { cn } from '@/lib/utils';

const controlClasses =
    'flex w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-base text-foreground shadow-xs transition-[color,border-color,box-shadow] outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/15';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(controlClasses, 'h-12', className)}
            {...props}
        />
    );
}

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(controlClasses, 'min-h-28 py-3 leading-relaxed', className)}
            {...props}
        />
    );
}

function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
    return (
        <div className="relative">
            <select
                data-slot="select"
                className={cn(
                    controlClasses,
                    'h-12 appearance-none pr-10',
                    className,
                )}
                {...props}
            >
                {children}
            </select>
            <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            >
                <path
                    d="m5 8 5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
}

export { Input, Select, Textarea, controlClasses };
