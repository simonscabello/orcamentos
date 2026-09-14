import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
type Customer = { id: number; name: string; phone?: string };
export default function CustomerForm({ customer }: { customer?: Customer }) {
    const form = useForm({
        name: customer?.name || '',
        phone: customer?.phone || '',
    });
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (customer) form.put(`/customers/${customer.id}`);
        else form.post('/customers');
    };
    return (
        <>
            <Head title={customer ? 'Editar cliente' : 'Novo cliente'} />
            <h1 className="mb-6 text-2xl font-bold">
                {customer ? 'Editar cliente' : 'Novo cliente'}
            </h1>
            <form
                onSubmit={submit}
                className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5"
            >
                <label className="block font-medium">
                    Nome <span className="text-red-600">*</span>
                    <input
                        autoFocus
                        required
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        aria-invalid={Boolean(form.errors.name)}
                        className="mt-2 h-12 w-full rounded-xl border border-stone-300 px-3 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100"
                        placeholder="Nome do cliente"
                    />
                    {form.errors.name && (
                        <small className="text-red-600">
                            {form.errors.name}
                        </small>
                    )}
                </label>
                <label className="block font-medium">
                    Telefone{' '}
                    <span className="font-normal text-stone-400">
                        (opcional)
                    </span>
                    <input
                        type="tel"
                        value={form.data.phone}
                        onChange={(e) => form.setData('phone', e.target.value)}
                        inputMode="tel"
                        aria-invalid={Boolean(form.errors.phone)}
                        className="mt-2 h-12 w-full rounded-xl border border-stone-300 px-3 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100"
                        placeholder="(00) 00000-0000"
                    />
                    {form.errors.phone && (
                        <small className="text-red-600">
                            {form.errors.phone}
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
                    {form.processing ? 'Salvando...' : 'Salvar cliente'}
                </button>
                <Link
                    href={customer ? `/customers/${customer.id}` : '/customers'}
                    className="block py-2 text-center font-medium text-stone-600"
                >
                    Cancelar
                </Link>
            </form>
        </>
    );
}
