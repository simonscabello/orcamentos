import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type FieldControlProps = {
    id: string;
    'aria-invalid'?: true;
    'aria-describedby'?: string;
};

type FieldProps = {
    id: string;
    label: string;
    /** Texto auxiliar exibido abaixo do campo. */
    hint?: string;
    error?: string;
    /** Marca o campo como opcional (os demais são entendidos como obrigatórios). */
    optional?: boolean;
    className?: string;
    children: ReactNode | ((props: FieldControlProps) => ReactNode);
};

/**
 * Agrupa label, controle, texto auxiliar e mensagem de erro com espaçamento
 * e acessibilidade padronizados em toda a aplicação.
 */
export function Field({
    id,
    label,
    hint,
    error,
    optional = false,
    className,
    children,
}: FieldProps) {
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

    const control =
        typeof children === 'function'
            ? children({
                  id,
                  'aria-invalid': error ? true : undefined,
                  'aria-describedby': describedBy,
              })
            : children;

    return (
        <div className={cn('space-y-2', className)}>
            <label
                htmlFor={id}
                className="flex items-baseline gap-1.5 text-sm font-medium text-foreground"
            >
                {label}
                {optional && (
                    <span className="text-xs font-normal text-muted-foreground">
                        opcional
                    </span>
                )}
            </label>
            {control}
            {hint && !error && (
                <p id={hintId} className="text-xs text-muted-foreground">
                    {hint}
                </p>
            )}
            {error && <FieldError id={errorId}>{error}</FieldError>}
        </div>
    );
}

export function FieldError({
    id,
    children,
}: {
    id?: string;
    children: ReactNode;
}) {
    return (
        <p
            id={id}
            role="alert"
            className="flex items-start gap-1.5 text-sm font-medium text-destructive"
        >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{children}</span>
        </p>
    );
}

/** Agrupa campos relacionados dentro de um cartão com título opcional. */
export function FormSection({
    title,
    description,
    children,
    className,
}: {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'rounded-2xl border border-border bg-card p-4 sm:p-5',
                className,
            )}
        >
            {title && (
                <header className="mb-4">
                    <h2 className="text-base font-semibold text-foreground">
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </header>
            )}
            <div className="space-y-5">{children}</div>
        </section>
    );
}
