import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { centsToInput, formatCurrency, moneyToCents } from '@/lib/format';
type Customer = { id: number; name: string; phone?: string };
type Vehicle = {
    id: number;
    customer_id: number;
    model: string;
    plate?: string;
    color?: string;
};
type Estimate = {
    id: number;
    customer_id: number;
    vehicle_id: number;
    date: string;
    status: 'draft' | 'sent';
    notes?: string;
    items: { description: string; amount: number }[];
};
type Item = { description: string; amount: string };
export default function EstimateForm({
    estimate,
    customers,
    vehicles,
}: {
    estimate?: Estimate;
    customers: Customer[];
    vehicles: Vehicle[];
}) {
    const form = useForm({
        customer_id: String(estimate?.customer_id || customers[0]?.id || ''),
        vehicle_id: String(estimate?.vehicle_id || ''),
        date: estimate?.date || new Date().toISOString().slice(0, 10),
        status: estimate?.status || 'draft',
        notes: estimate?.notes || '',
        items: estimate
            ? estimate.items.map((item) => ({
                  ...item,
                  amount: centsToInput(item.amount),
              }))
            : ([{ description: '', amount: '' }] as Item[]),
    });
    const options = vehicles.filter(
        (vehicle) => String(vehicle.customer_id) === form.data.customer_id,
    );
    const total = form.data.items.reduce(
        (sum, item) => sum + moneyToCents(item.amount),
        0,
    );
    const setItem = (index: number, patch: Partial<Item>) =>
        form.setData(
            'items',
            form.data.items.map((item, i) =>
                i === index ? { ...item, ...patch } : item,
            ),
        );
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            items: data.items.map((item) => ({
                ...item,
                amount: moneyToCents(item.amount),
            })),
        }));
        if (estimate) form.put(`/estimates/${estimate.id}`);
        else form.post('/estimates');
    };
    return (
        <>
            <Head title={estimate ? 'Editar orçamento' : 'Novo orçamento'} />
            <div className="mb-6">
                <h1 className="text-2xl font-bold">
                    {estimate ? 'Editar orçamento' : 'Novo orçamento'}
                </h1>
                <p className="text-sm text-stone-500">
                    Preencha só o necessário.
                </p>
            </div>
            <form onSubmit={submit} className="space-y-5">
                <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
                    <label className="block font-medium">
                        Cliente <span className="text-red-600">*</span>
                        <select
                            required
                            value={form.data.customer_id}
                            onChange={(e) =>
                                form.setData((data) => ({
                                    ...data,
                                    customer_id: e.target.value,
                                    vehicle_id: '',
                                }))
                            }
                            aria-invalid={Boolean(form.errors.customer_id)}
                            className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-3 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100"
                        >
                            <option value="">Selecione um cliente</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name}
                                    {customer.phone
                                        ? ` · ${customer.phone}`
                                        : ''}
                                </option>
                            ))}
                        </select>
                        {form.errors.customer_id && (
                            <small className="text-red-600">
                                {form.errors.customer_id}
                            </small>
                        )}
                        <Link
                            href="/customers/create"
                            className="mt-2 inline-block text-sm font-semibold text-orange-700"
                        >
                            + Cadastrar cliente
                        </Link>
                    </label>
                    <label className="block font-medium">
                        Veículo <span className="text-red-600">*</span>
                        <select
                            required
                            value={form.data.vehicle_id}
                            onChange={(e) =>
                                form.setData('vehicle_id', e.target.value)
                            }
                            disabled={!form.data.customer_id}
                            aria-invalid={Boolean(form.errors.vehicle_id)}
                            className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-3 disabled:bg-stone-100 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100"
                        >
                            <option value="">Selecione um veículo</option>
                            {options.map((vehicle) => (
                                <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.model}
                                    {vehicle.plate ? ` · ${vehicle.plate}` : ''}
                                </option>
                            ))}
                        </select>
                        {form.errors.vehicle_id && (
                            <small className="text-red-600">
                                {form.errors.vehicle_id}
                            </small>
                        )}
                        <Link
                            href="/vehicles/create"
                            className="mt-2 inline-block text-sm font-semibold text-orange-700"
                        >
                            + Cadastrar veículo
                        </Link>
                    </label>
                    <label className="block font-medium">
                        Data <span className="text-red-600">*</span>
                        <input
                            required
                            type="date"
                            value={form.data.date}
                            onChange={(e) =>
                                form.setData('date', e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.date)}
                            className="mt-2 h-12 w-full rounded-xl border border-stone-300 px-3 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100"
                        />
                        {form.errors.date && (
                            <small className="text-red-600">
                                {form.errors.date}
                            </small>
                        )}
                    </label>
                </section>
                <section className="rounded-2xl border border-stone-200 bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold">Itens</h2>
                        <span className="font-bold text-orange-700">
                            {formatCurrency(total)}
                        </span>
                    </div>
                    <div className="space-y-4">
                        {form.data.items.map((item, index) => (
                            <div
                                key={index}
                                className="rounded-xl bg-stone-50 p-3"
                            >
                                <div className="mb-2 flex justify-between">
                                    <span className="text-sm font-medium">
                                        Item {index + 1}
                                    </span>
                                    {form.data.items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                form.setData(
                                                    'items',
                                                    form.data.items.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                )
                                            }
                                            className="flex size-11 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                                            aria-label={`Remover item ${index + 1}`}
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    )}
                                </div>
                                <label className="mb-2 block text-sm font-medium">
                                    Descrição{' '}
                                    <span className="text-red-600">*</span>
                                    <input
                                        id={`item-${index}-description`}
                                        required
                                        value={item.description}
                                        onChange={(e) =>
                                            setItem(index, {
                                                description: e.target.value,
                                            })
                                        }
                                        placeholder="Ex.: Pintura do para-choque"
                                        aria-invalid={Boolean(
                                            form.errors[
                                                `items.${index}.description`
                                            ],
                                        )}
                                        className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100"
                                    />
                                </label>
                                {form.errors[`items.${index}.description`] && (
                                    <small className="mb-2 block text-red-600">
                                        {
                                            form.errors[
                                                `items.${index}.description`
                                            ]
                                        }
                                    </small>
                                )}
                                <label className="block text-sm font-medium">
                                    Valor{' '}
                                    <span className="text-red-600">*</span>
                                    <input
                                        id={`item-${index}-amount`}
                                        required
                                        inputMode="decimal"
                                        value={item.amount}
                                        onChange={(e) =>
                                            setItem(index, {
                                                amount: e.target.value,
                                            })
                                        }
                                        placeholder="0,00"
                                        aria-invalid={Boolean(
                                            form.errors[
                                                `items.${index}.amount`
                                            ],
                                        )}
                                        className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100"
                                    />
                                </label>
                                {form.errors[`items.${index}.amount`] && (
                                    <small className="mt-2 block text-red-600">
                                        {form.errors[`items.${index}.amount`]}
                                    </small>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            form.setData('items', [
                                ...form.data.items,
                                { description: '', amount: '' },
                            ])
                        }
                        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-orange-300 font-semibold text-orange-700"
                    >
                        <Plus className="size-5" />
                        Adicionar item
                    </button>
                    {form.errors.items && (
                        <small className="text-red-600">
                            {form.errors.items}
                        </small>
                    )}
                </section>
                <section className="rounded-2xl border border-stone-200 bg-white p-5">
                    <label className="block font-medium">
                        Observações{' '}
                        <span className="font-normal text-stone-400">
                            (opcional)
                        </span>
                        <textarea
                            value={form.data.notes}
                            onChange={(e) =>
                                form.setData('notes', e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.notes)}
                            className="mt-2 min-h-24 w-full rounded-xl border border-stone-300 p-3 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100"
                            placeholder="Ex.: validade deste orçamento"
                        />
                        {form.errors.notes && (
                            <small className="text-red-600">
                                {form.errors.notes}
                            </small>
                        )}
                    </label>
                </section>
                <div className="sticky bottom-20 rounded-2xl bg-stone-900 p-4 text-white shadow-lg">
                    <p className="text-sm text-stone-300">Total do orçamento</p>
                    <p className="mb-3 text-2xl font-bold">
                        {formatCurrency(total)}
                    </p>
                    <button
                        disabled={form.processing}
                        className="min-h-12 w-full rounded-xl bg-orange-600 font-bold disabled:opacity-60"
                    >
                        {form.processing && (
                            <LoaderCircle className="mr-2 inline size-4 animate-spin" />
                        )}
                        {form.processing ? 'Salvando...' : 'Salvar orçamento'}
                    </button>
                </div>
                <Link
                    href={estimate ? `/estimates/${estimate.id}` : '/estimates'}
                    className="block pb-3 text-center font-medium text-stone-600"
                >
                    Cancelar
                </Link>
            </form>
        </>
    );
}
