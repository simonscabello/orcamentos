import { Head, Link } from '@inertiajs/react';
import { FileText, Plus, UserPlus } from 'lucide-react';

import {
    EstimateListItem,
    type EstimateListItemData,
} from '@/components/estimate-list-item';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { firstName, greeting } from '@/lib/format';

type Props = {
    business: { owner_name?: string; name: string };
    estimates: EstimateListItemData[];
};

export default function Dashboard({ business, estimates }: Props) {
    const name = firstName(business.owner_name);

    return (
        <>
            <Head title="Início" />

            <header className="mb-6">
                <p className="text-muted-foreground truncate text-sm">
                    {business.name}
                </p>
                <h1 className="sm:text-display text-2xl font-bold tracking-tight">
                    {greeting()}
                    {name ? `, ${name}` : ''}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Monte um orçamento em poucos toques e envie para o cliente.
                </p>
            </header>

            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                <Button asChild size="xl" className="w-full">
                    <Link href="/estimates/create">
                        <Plus aria-hidden="true" />
                        Novo orçamento
                    </Link>
                </Button>
                <Button asChild variant="outline" size="xl" className="w-full">
                    <Link href="/customers/create">
                        <UserPlus aria-hidden="true" />
                        Novo cliente
                    </Link>
                </Button>
            </div>

            <section className="mt-8">
                <div className="mb-3 flex items-baseline justify-between gap-4">
                    <h2 className="text-base font-semibold">
                        Orçamentos recentes
                    </h2>
                    {estimates.length > 0 && (
                        <Link
                            href="/estimates"
                            className="text-primary rounded-sm text-sm font-semibold hover:underline"
                        >
                            Ver todos
                        </Link>
                    )}
                </div>

                <div className="border-border bg-card overflow-hidden rounded-2xl border">
                    {estimates.length ? (
                        <ul className="divide-border divide-y">
                            {estimates.map((estimate) => (
                                <EstimateListItem
                                    key={estimate.id}
                                    estimate={estimate}
                                />
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            icon={FileText}
                            title="Nenhum orçamento ainda"
                            description="Crie o primeiro orçamento e ele aparecerá aqui."
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
            </section>
        </>
    );
}
