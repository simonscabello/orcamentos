import { router } from '@inertiajs/react';
import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { controlClasses } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SearchFieldProps = {
    /** Rota que recebe o parâmetro `search`. */
    url: string;
    /** Termo atual devolvido pelo servidor. */
    value: string;
    placeholder: string;
    label: string;
    className?: string;
};

/**
 * Busca com atualização automática enquanto o usuário digita.
 * Mantém foco e posição da lista para não atrapalhar quem usa o celular.
 */
export function SearchField({
    url,
    value,
    placeholder,
    label,
    className,
}: SearchFieldProps) {
    const [term, setTerm] = useState(value);
    const [searching, setSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => setTerm(value), [value]);

    useEffect(() => {
        const trimmed = term.trim();

        if (trimmed === value) {
            return;
        }

        const timeout = setTimeout(() => {
            router.get(url, trimmed ? { search: trimmed } : {}, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setSearching(true),
                onFinish: () => setSearching(false),
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [term, url, value]);

    const clear = () => {
        setTerm('');
        inputRef.current?.focus();
    };

    return (
        <form
            role="search"
            onSubmit={(event) => {
                event.preventDefault();
                inputRef.current?.blur();
            }}
            className={cn('relative', className)}
        >
            <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
                aria-hidden="true"
            />
            <input
                ref={inputRef}
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={placeholder}
                aria-label={label}
                enterKeyHint="search"
                autoComplete="off"
                className={cn(
                    controlClasses,
                    'h-12 pr-12 pl-11 [&::-webkit-search-cancel-button]:hidden',
                )}
            />
            {searching ? (
                <Loader2
                    role="status"
                    aria-label="Buscando"
                    className="text-muted-foreground absolute top-1/2 right-3.5 size-5 -translate-y-1/2 animate-spin"
                />
            ) : term ? (
                <button
                    type="button"
                    onClick={clear}
                    aria-label="Limpar busca"
                    className="text-muted-foreground hover:bg-accent hover:text-foreground absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg transition-colors"
                >
                    <X className="size-5" aria-hidden="true" />
                </button>
            ) : null}
        </form>
    );
}
