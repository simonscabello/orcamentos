import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Plus, SearchX, Users } from 'lucide-react';

import { SearchField } from '@/components/search-field';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { formatPhone } from '@/lib/format';

type Customer = {
    id: number;
    name: string;
    phone?: string;
    vehicles_count: number;
};

export default function CustomersIndex({
    customers,
    search,
}: {
    customers: Customer[];
    search: string;
}) {
    return (
        <>
            <Head title="Clientes" />

            <PageHeader
                title="Clientes"
                description={
                    customers.length
                        ? `${customers.length} ${customers.length === 1 ? 'cliente' : 'clientes'}`
                        : undefined
                }
                action={
                    <Button asChild size="icon" aria-label="Cadastrar cliente">
                        <Link href="/customers/create">
                            <Plus aria-hidden="true" />
                        </Link>
                    </Button>
                }
            />

            <SearchField
                url="/customers"
                value={search}
                placeholder="Nome ou telefone"
                label="Buscar clientes por nome ou telefone"
                className="mb-4"
            />

            <div className="border-border bg-card overflow-hidden rounded-2xl border">
                {customers.length ? (
                    <ul className="divide-border divide-y">
                        {customers.map((customer) => (
                            <li key={customer.id}>
                                <Link
                                    href={`/customers/${customer.id}`}
                                    className="hover:bg-accent/60 active:bg-accent flex min-h-16 items-center gap-3 px-4 py-3 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground truncate font-semibold">
                                            {customer.name}
                                        </p>
                                        <p className="text-muted-foreground truncate text-sm">
                                            {formatPhone(customer.phone) ||
                                                'Sem telefone'}{' '}
                                            ·{' '}
                                            {customer.vehicles_count === 1
                                                ? '1 veículo'
                                                : `${customer.vehicles_count} veículos`}
                                        </p>
                                    </div>
                                    <ChevronRight
                                        className="text-muted-foreground/60 size-5 shrink-0"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : search ? (
                    <EmptyState
                        icon={SearchX}
                        title="Nenhum cliente encontrado"
                        description="Tente buscar por outro nome ou telefone."
                    />
                ) : (
                    <EmptyState
                        icon={Users}
                        title="Nenhum cliente ainda"
                        description="Cadastre um cliente para começar a criar orçamentos."
                        action={
                            <Button asChild>
                                <Link href="/customers/create">
                                    <Plus aria-hidden="true" />
                                    Cadastrar cliente
                                </Link>
                            </Button>
                        }
                    />
                )}
            </div>
        </>
    );
}
