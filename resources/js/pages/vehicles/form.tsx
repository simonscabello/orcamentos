import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
type Customer = { id: number; name: string };
type Vehicle = {
    id: number;
    customer_id: number;
    model: string;
    plate?: string;
    color?: string;
};
export default function VehicleForm({
    vehicle,
    customers,
    selectedCustomerId,
}: {
    vehicle?: Vehicle;
    customers: Customer[];
    selectedCustomerId?: number;
}) {
    const form = useForm({
        customer_id: String(
            vehicle?.customer_id ||
                selectedCustomerId ||
                customers[0]?.id ||
                '',
        ),
        model: vehicle?.model || '',
        plate: vehicle?.plate || '',
        color: vehicle?.color || '',
    });
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (vehicle) form.put(`/vehicles/${vehicle.id}`);
        else form.post('/vehicles');
    };
    return (
        <>
            <Head title={vehicle ? 'Editar veículo' : 'Novo veículo'} />
            <h1 className="mb-6 text-2xl font-bold">
                {vehicle ? 'Editar veículo' : 'Novo veículo'}
            </h1>
            <form
                onSubmit={submit}
                className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5"
            >
                <label className="block font-medium">
                    Cliente <span className="text-red-600">*</span>
                    <select
                        required
                        value={form.data.customer_id}
                        onChange={(e) =>
                            form.setData('customer_id', e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.customer_id)}
                        className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-3 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100"
                    >
                        <option value="">Selecione um cliente</option>
                        {customers.map((customer) => (
                            <option value={customer.id} key={customer.id}>
                                {customer.name}
                            </option>
                        ))}
                    </select>
                    {form.errors.customer_id && (
                        <small className="text-red-600">
                            {form.errors.customer_id}
                        </small>
                    )}
                    {!customers.length && (
                        <Link
                            href="/customers/create"
                            className="mt-2 inline-block text-sm font-semibold text-orange-700"
                        >
                            Cadastre um cliente antes de continuar
                        </Link>
                    )}
                </label>
                <label className="block font-medium">
                    Modelo <span className="text-red-600">*</span>
                    <input
                        autoFocus
                        required
                        value={form.data.model}
                        onChange={(e) => form.setData('model', e.target.value)}
                        aria-invalid={Boolean(form.errors.model)}
                        className="mt-2 h-12 w-full rounded-xl border border-stone-300 px-3 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100"
                        placeholder="Ex.: Chevrolet Onix"
                    />
                    {form.errors.model && (
                        <small className="text-red-600">
                            {form.errors.model}
                        </small>
                    )}
                </label>
                <label className="block font-medium">
                    Placa{' '}
                    <span className="font-normal text-stone-400">
                        (opcional)
                    </span>
                    <input
                        value={form.data.plate}
                        onChange={(e) =>
                            form.setData('plate', e.target.value.toUpperCase())
                        }
                        aria-invalid={Boolean(form.errors.plate)}
                        className="mt-2 h-12 w-full rounded-xl border border-stone-300 px-3 uppercase aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100"
                        placeholder="ABC1D23"
                    />
                    {form.errors.plate && (
                        <small className="text-red-600">
                            {form.errors.plate}
                        </small>
                    )}
                </label>
                <label className="block font-medium">
                    Cor{' '}
                    <span className="font-normal text-stone-400">
                        (opcional)
                    </span>
                    <input
                        value={form.data.color}
                        onChange={(e) => form.setData('color', e.target.value)}
                        aria-invalid={Boolean(form.errors.color)}
                        className="mt-2 h-12 w-full rounded-xl border border-stone-300 px-3 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100"
                        placeholder="Ex.: Prata"
                    />
                    {form.errors.color && (
                        <small className="text-red-600">
                            {form.errors.color}
                        </small>
                    )}
                </label>
                <button
                    disabled={form.processing}
                    className="min-h-12 w-full rounded-xl bg-orange-600 font-bold text-white disabled:opacity-60"
                >
                    {form.processing && (
                        <LoaderCircle className="mr-2 inline size-4 animate-spin" />
                    )}
                    {form.processing ? 'Salvando...' : 'Salvar veículo'}
                </button>
                <Link
                    href={`/customers/${vehicle?.customer_id || form.data.customer_id}`}
                    className="block py-2 text-center font-medium text-stone-600"
                >
                    Cancelar
                </Link>
            </form>
        </>
    );
}
