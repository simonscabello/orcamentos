import { Head, Link } from '@inertiajs/react';
import { CarFront, Pencil, Phone, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { formatPhone } from '@/lib/format';

type Vehicle = { id: number; model: string; plate?: string; color?: string };
type Customer = {
    id: number;
    name: string;
    phone?: string;
    vehicles: Vehicle[];
};

export default function CustomerShow({ customer }: { customer: Customer }) {
    return (
        <>
            <Head title={customer.name} />

            <PageHeader
                title={customer.name}
                backHref="/customers"
                backLabel="Clientes"
                action={
                    <Button
                        asChild
                        variant="outline"
                        size="icon"
                        aria-label="Editar cliente"
                    >
                        <Link href={`/customers/${customer.id}/edit`}>
                            <Pencil aria-hidden="true" />
                        </Link>
                    </Button>
                }
                description={
                    customer.phone ? undefined : 'Sem telefone cadastrado'
                }
            />

            {customer.phone && (
                <a
                    href={`tel:${customer.phone.replace(/\D/g, '')}`}
                    className="border-border bg-card hover:bg-accent mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors"
                >
                    <Phone
                        className="text-muted-foreground size-4"
                        aria-hidden="true"
                    />
                    {formatPhone(customer.phone)}
                </a>
            )}

            <section>
                <div className="mb-3 flex items-center justify-between gap-4">
                    <h2 className="text-base font-semibold">Veículos</h2>
                    <Button asChild variant="outline" size="sm">
                        <Link
                            href={`/vehicles/create?customer_id=${customer.id}`}
                        >
                            <Plus aria-hidden="true" />
                            Adicionar
                        </Link>
                    </Button>
                </div>

                <div className="border-border bg-card overflow-hidden rounded-2xl border">
                    {customer.vehicles.length ? (
                        <ul className="divide-border divide-y">
                            {customer.vehicles.map((vehicle) => (
                                <li
                                    key={vehicle.id}
                                    className="flex min-h-16 items-center gap-3 px-4 py-3"
                                >
                                    <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
                                        <CarFront
                                            className="size-5"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground truncate font-semibold">
                                            {vehicle.model}
                                        </p>
                                        <p className="text-muted-foreground truncate text-sm">
                                            {vehicle.plate || 'Sem placa'}
                                            {vehicle.color
                                                ? ` · ${vehicle.color}`
                                                : ''}
                                        </p>
                                    </div>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link
                                            href={`/vehicles/${vehicle.id}/edit`}
                                            aria-label={`Editar ${vehicle.model}`}
                                        >
                                            Editar
                                        </Link>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            icon={CarFront}
                            title="Nenhum veículo cadastrado"
                            description="Adicione o veículo para criar orçamentos para este cliente."
                            action={
                                <Button asChild>
                                    <Link
                                        href={`/vehicles/create?customer_id=${customer.id}`}
                                    >
                                        <Plus aria-hidden="true" />
                                        Adicionar veículo
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
