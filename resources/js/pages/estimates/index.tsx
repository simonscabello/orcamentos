import { Head, Link, router } from '@inertiajs/react';
import { ChevronRight, LoaderCircle, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/format';
type Estimate = {
    id: number;
    number: number;
    total: number;
    status: string;
    date: string;
    customer: { name: string };
    vehicle: { model: string; plate?: string };
};
export default function EstimatesIndex({
    estimates,
    search,
}: {
    estimates: Estimate[];
    search: string;
}) {
    const [term, setTerm] = useState(search);
    const [searching, setSearching] = useState(false);

    useEffect(() => setTerm(search), [search]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/estimates', term ? { search: term } : {}, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setSearching(true),
            onFinish: () => setSearching(false),
        });
    };

    const clearSearch = () => {
        setTerm('');
        router.get(
            '/estimates',
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
            <Head title="Orçamentos" />
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Orçamentos</h1>
                    <p className="text-sm text-stone-500">
                        Mais recentes primeiro
                    </p>
                </div>
                <Link
                    href="/estimates/create"
                    aria-label="Criar novo orçamento"
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
                    placeholder="Buscar por cliente, telefone ou placa"
                    aria-label="Buscar orçamentos por cliente, telefone ou placa"
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
                {estimates.length ? (
                    estimates.map((estimate) => (
                        <Link
                            key={estimate.id}
                            href={`/estimates/${estimate.id}`}
                            className="flex items-center gap-3 border-b border-stone-100 p-4 last:border-0"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="font-bold">
                                    #{String(estimate.number).padStart(3, '0')}{' '}
                                    · {estimate.customer.name}
                                </p>
                                <p className="truncate text-sm text-stone-500">
                                    {estimate.vehicle.model}
                                    {estimate.vehicle.plate
                                        ? ` · ${estimate.vehicle.plate}`
                                        : ''}{' '}
                                    · {formatDate(estimate.date)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">
                                    {formatCurrency(estimate.total)}
                                </p>
                                <p className="text-xs text-stone-500">
                                    {estimate.status === 'sent'
                                        ? 'Enviado'
                                        : 'Rascunho'}
                                </p>
                            </div>
                            <ChevronRight className="size-4 text-stone-400" />
                        </Link>
                    ))
                ) : (
                    <div className="space-y-3 p-8 text-center">
                        <p className="font-medium text-stone-700">
                            {search
                                ? 'Nenhum resultado encontrado para esta busca.'
                                : 'Você ainda não criou nenhum orçamento.'}
                        </p>
                        {!search && (
                            <Link
                                href="/estimates/create"
                                className="inline-flex min-h-11 items-center rounded-xl bg-orange-600 px-4 font-semibold text-white"
                            >
                                Novo orçamento
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
