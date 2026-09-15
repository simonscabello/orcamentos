import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatEstimateNumber } from '@/lib/format';

export type EstimateListItemData = {
    id: number;
    number: number;
    total: number;
    date?: string;
    status?: string;
    customer: { name: string };
    vehicle: { model: string; plate?: string | null };
};

/** Linha de orçamento usada no início e na listagem, para manter o mesmo padrão. */
export function EstimateListItem({
    estimate,
    showStatus = false,
}: {
    estimate: EstimateListItemData;
    showStatus?: boolean;
}) {
    const secondary = [
        estimate.vehicle.model,
        estimate.vehicle.plate || null,
        estimate.date ? formatDate(estimate.date) : null,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <li>
            <Link
                href={`/estimates/${estimate.id}`}
                className="hover:bg-accent/60 active:bg-accent flex min-h-18 items-center gap-3 px-4 py-3.5 transition-colors"
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="tabular text-muted-foreground text-xs font-semibold">
                            {formatEstimateNumber(estimate.number)}
                        </span>
                        {showStatus && estimate.status && (
                            <Badge
                                tone={
                                    estimate.status === 'sent'
                                        ? 'success'
                                        : 'neutral'
                                }
                            >
                                {estimate.status === 'sent'
                                    ? 'Enviado'
                                    : 'Rascunho'}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                        <p className="text-foreground truncate font-semibold">
                            {estimate.customer.name}
                        </p>
                        <p className="tabular text-foreground shrink-0 font-semibold">
                            {formatCurrency(estimate.total)}
                        </p>
                    </div>
                    <p className="text-muted-foreground truncate text-sm">
                        {secondary}
                    </p>
                </div>
                <ChevronRight
                    className="text-muted-foreground/60 size-5 shrink-0"
                    aria-hidden="true"
                />
            </Link>
        </li>
    );
}
