import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
type Business = {
    name: string;
    owner_name?: string;
    phone?: string;
    document?: string;
    address?: string;
};
export default function BusinessEdit({ business }: { business: Business }) {
    const form = useForm({
        name: business.name || '',
        owner_name: business.owner_name || '',
        phone: business.phone || '',
        document: business.document || '',
        address: business.address || '',
    });
    return (
        <>
            <Head title="Configurações" />
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Configurações da oficina</h1>
                <p className="text-sm text-stone-500">
                    Estes dados aparecem no PDF.
                </p>
            </div>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.put('/settings/business');
                }}
                className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5"
            >
                {[
                    ['name', 'Nome da oficina', true, 'text'],
                    ['owner_name', 'Nome do responsável', false, 'text'],
                    ['phone', 'Telefone', false, 'tel'],
                    ['document', 'CPF/CNPJ', false, 'text'],
                    ['address', 'Endereço', false, 'text'],
                ].map(([field, label, required, type]) => (
                    <label className="block font-medium" key={field as string}>
                        {label}
                        {required && <span className="text-red-600"> *</span>}
                        <input
                            type={type as string}
                            required={Boolean(required)}
                            value={form.data[field as keyof typeof form.data]}
                            onChange={(e) =>
                                form.setData(
                                    field as keyof typeof form.data,
                                    e.target.value,
                                )
                            }
                            aria-invalid={Boolean(
                                form.errors[field as keyof typeof form.errors],
                            )}
                            className="mt-2 h-12 w-full rounded-xl border border-stone-300 px-3 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100"
                        />
                        {form.errors[field as keyof typeof form.errors] && (
                            <small className="text-red-600">
                                {form.errors[field as keyof typeof form.errors]}
                            </small>
                        )}
                    </label>
                ))}
                <button
                    disabled={form.processing}
                    className="min-h-12 w-full rounded-xl bg-orange-600 font-bold text-white"
                >
                    {form.processing && (
                        <LoaderCircle className="mr-2 inline size-4 animate-spin" />
                    )}
                    {form.processing ? 'Salvando...' : 'Salvar configurações'}
                </button>
            </form>
        </>
    );
}
