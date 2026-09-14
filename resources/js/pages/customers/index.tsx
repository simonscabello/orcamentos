import { Head, Link, router } from '@inertiajs/react';
import { ChevronRight, LoaderCircle, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    const [term, setTerm] = useState(search);
    const [searching, setSearching] = useState(false);

    useEffect(() => setTerm(search), [search]);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.get('/customers', term ? { search: term } : {}, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setSearching(true),
            onFinish: () => setSearching(false),
        });
    };

    const clearSearch = () => {
        setTerm('');
        router.get(
            '/customers',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setSearching(true),
                onFinish: () => setSearching(false),
            },
        );
    };
    return (
        <>
            <Head title="Clientes" />
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Clientes</h1>
                    <p className="text-sm text-stone-500">
                        Encontre ou cadastre um cliente
                    </p>
                </div>
                <Link
                    href="/customers/create"
                    aria-label="Cadastrar cliente"
                    className="flex size-11 items-center justify-center rounded-xl bg-orange-600 text-white"
                >
                    <Plus />
                </Link>
            </div>
            <form onSubmit={submit} className="relative mb-4">
                <Search className="absolute top-3 left-3 size-5 text-stone-400" />
                <input
                    type="search"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Buscar por nome ou telefone"
                    aria-label="Buscar clientes por nome ou telefone"
                    className="h-12 w-full rounded-xl border border-stone-300 bg-white pr-20 pl-10"
                />
                {searching ? (
                    <LoaderCircle className="absolute top-3 right-3 size-5 animate-spin text-stone-400" />
                ) : term ? (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute top-1 right-1 flex size-10 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"
                        aria-label="Limpar busca"
                    >
                        <X className="size-5" />
                    </button>
                ) : null}
            </form>
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                {customers.length ? (
                    customers.map((customer) => (
                        <Link
                            key={customer.id}
                            href={`/customers/${customer.id}`}
                            className="flex items-center gap-3 border-b border-stone-100 p-4 last:border-0"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold">{customer.name}</p>
                                <p className="text-sm text-stone-500">
                                    {customer.phone || 'Sem telefone'} ·{' '}
                                    {customer.vehicles_count} veículo(s)
                                </p>
                            </div>
                            <ChevronRight className="text-stone-400" />
                        </Link>
                    ))
                ) : (
                    <div className="space-y-3 p-8 text-center">
                        <p className="font-medium text-stone-700">
                            {search
                                ? 'Nenhum resultado encontrado para esta busca.'
                                : 'Você ainda não cadastrou nenhum cliente.'}
                        </p>
                        {!search && (
                            <Link
                                href="/customers/create"
                                className="inline-flex min-h-11 items-center rounded-xl bg-orange-600 px-4 font-semibold text-white"
                            >
                                Cadastrar primeiro cliente
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
