import { Head, Link } from '@inertiajs/react';
import { FileText, Plus, SearchX } from 'lucide-react';

import {
    EstimateListItem,
    type EstimateListItemData,
} from '@/components/estimate-list-item';
import { SearchField } from '@/components/search-field';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

type Props = {
    estimates: EstimateListItemData[];
    search: string;
};

export default function EstimatesIndex({ estimates, search }: Props) {
    return (
        <>
            <Head title="Orçamentos" />

            <PageHeader
                title="Orçamentos"
                description={
                    estimates.length
                        ? `${estimates.length} ${estimates.length === 1 ? 'orçamento' : 'orçamentos'}${search ? ' encontrados' : ''}`
                        : undefined
                }
                action={
                    <Button asChild size="icon" aria-label="Novo orçamento">
                        <Link href="/estimates/create">
                            <Plus aria-hidden="true" />
                        </Link>
                    </Button>
                }
            />

            <SearchField
                url="/estimates"
                value={search}
                placeholder="Cliente, telefone ou placa"
                label="Buscar orçamentos por cliente, telefone ou placa"
                className="mb-4"
            />

            <div className="border-border bg-card overflow-hidden rounded-2xl border">
                {estimates.length ? (
                    <ul className="divide-border divide-y">
                        {estimates.map((estimate) => (
                            <EstimateListItem
                                key={estimate.id}
                                estimate={estimate}
                                showStatus
                            />
                        ))}
                    </ul>
                ) : search ? (
                    <EmptyState
                        icon={SearchX}
                        title="Nenhum orçamento encontrado"
                        description="Tente buscar por outro cliente, telefone ou placa."
                    />
                ) : (
                    <EmptyState
                        icon={FileText}
                        title="Nenhum orçamento ainda"
                        description="Crie seu primeiro orçamento e ele aparecerá aqui."
                        action={
                            <Button asChild>
                                <Link href="/estimates/create">
                                    <Plus aria-hidden="true" />
                                    Novo orçamento
                                </Link>
                            </Button>
                        }
                    />
                )}
            </div>
        </>
    );
}
