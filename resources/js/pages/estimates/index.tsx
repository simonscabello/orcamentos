import { Head, Link } from '@inertiajs/react';
import { CarFront, FileText, Plus, SearchX, X } from 'lucide-react';

import {
    EstimateListItem,
    type EstimateListItemData,
} from '@/components/estimate-list-item';
import { SearchField } from '@/components/search-field';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

type VehicleFilter = {
    id: number;
    model: string;
    plate?: string | null;
    customer: { id: number; name: string };
};

type Props = {
    estimates: EstimateListItemData[];
    search: string;
    vehicle: VehicleFilter | null;
};

export default function EstimatesIndex({ estimates, search, vehicle }: Props) {
    const createHref = vehicle
        ? `/estimates/create?vehicle_id=${vehicle.id}`
        : '/estimates/create';
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
                        <Link href={createHref}>
                            <Plus aria-hidden="true" />
                        </Link>
                    </Button>
                }
            />

            {vehicle ? (
                // Filtro vindo da ficha do cliente: mostra de quem é e permite voltar à lista completa.
                <div className="border-border bg-card mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3">
                    <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
                        <CarFront className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                            {vehicle.model}
                            {vehicle.plate ? ` · ${vehicle.plate}` : ''}
                        </p>
                        <p className="text-muted-foreground truncate text-sm">
                            {vehicle.customer.name}
                        </p>
                    </div>
                    <Button
                        asChild
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Limpar filtro por veículo"
                    >
                        <Link href="/estimates">
                            <X aria-hidden="true" />
                        </Link>
                    </Button>
                </div>
            ) : (
                <SearchField
                    url="/estimates"
                    value={search}
                    placeholder="Cliente, telefone ou placa"
                    label="Buscar orçamentos por cliente, telefone ou placa"
                    className="mb-4"
                />
            )}

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
                ) : vehicle ? (
                    <EmptyState
                        icon={FileText}
                        title="Nenhum orçamento para este veículo"
                        description="Gere o primeiro orçamento deste veículo."
                        action={
                            <Button asChild>
                                <Link href={createHref}>
                                    <Plus aria-hidden="true" />
                                    Gerar orçamento
                                </Link>
                            </Button>
                        }
                    />
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
                                <Link href={createHref}>
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
