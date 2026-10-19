import type * as React from 'react';

import { Input } from '@/components/ui/input';
import { centsToInput, isMoneyInput, moneyToCents } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Campo de valor com prefixo (R$ ou %) que formata o número ao sair, quando é válido. */
export function MoneyInput({
    value,
    onValueChange,
    prefix = 'R$',
    className,
    ...props
}: Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'prefix'> & {
    value: string;
    onValueChange: (value: string) => void;
    prefix?: string;
}) {
    return (
        <div className="relative">
            <span
                aria-hidden="true"
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-medium"
            >
                {prefix}
            </span>
            <Input
                {...props}
                inputMode="decimal"
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                onBlur={(event) =>
                    isMoneyInput(event.target.value) &&
                    onValueChange(
                        centsToInput(moneyToCents(event.target.value)),
                    )
                }
                placeholder="0,00"
                className={cn('tabular pl-10 text-right', className)}
            />
        </div>
    );
}
