import type { HTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <p
            {...props}
            role="alert"
            aria-live="polite"
            className={cn(
                'text-destructive flex items-start gap-1.5 text-sm font-medium',
                className,
            )}
        >
            <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
            />
            <span>{message}</span>
        </p>
    ) : null;
}
