import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

type Estimate = {
    id: number;
    number: number;
    total: number;
    customer: { name: string };
    vehicle: { model: string };
};

export default function Dashboard({
    business,
    estimates,
}: {
    business: { owner_name?: string; name: string };
    estimates: Estimate[];
}) {
    return (
        <>
            <Head title="Início" />
            <section className="mb-6">
                <p className="text-sm text-stone-500">{business.name}</p>
                <h1 className="text-3xl font-bold">
                    Olá, {business.owner_name?.split(' ')[0] || 'você'}
                </h1>
            </section>
            <Link
                href="/estimates/create"
                className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 text-lg font-bold text-white shadow-sm active:bg-orange-700"
            >
                <Plus className="size-6" />
                NOVO ORÇAMENTO
            </Link>
            <section className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Orçamentos recentes</h2>
                    <Link
                        href="/estimates"
                        className="text-sm font-semibold text-orange-700"
                    >
                        Ver todos
                    </Link>
                </div>
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
                                        #
                                        {String(estimate.number).padStart(
                                            3,
                                            '0',
                                        )}{' '}
                                        · {estimate.vehicle.model}
                                    </p>
                                    <p className="text-sm text-stone-500">
                                        {estimate.customer.name}
                                    </p>
                                </div>
                                <p className="text-sm font-bold">
                                    {formatCurrency(estimate.total)}
                                </p>
                                <ArrowRight className="size-4 text-stone-400" />
                            </Link>
                        ))
                    ) : (
                        <div className="space-y-3 p-6 text-center text-sm">
                            <p className="text-stone-500">
                                Você ainda não criou nenhum orçamento.
                            </p>
                            <Link
                                href="/estimates/create"
                                className="inline-flex min-h-11 items-center rounded-xl border border-orange-300 px-4 font-semibold text-orange-700"
                            >
                                Criar primeiro orçamento
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
