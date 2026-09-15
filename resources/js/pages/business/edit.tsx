import { Head, useForm } from '@inertiajs/react';

import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

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
            <Head title="Ajustes da oficina" />

            <section className="space-y-6">
                <Heading
                    title="Dados da oficina"
                    description="Estes dados aparecem no cabeçalho do PDF enviado ao cliente."
                />

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.put('/settings/business');
                    }}
                    className="border-border bg-card space-y-5 rounded-2xl border p-4 sm:p-5"
                >
                    <Field
                        id="name"
                        label="Nome da oficina"
                        error={form.errors.name}
                    >
                        {(field) => (
                            <Input
                                {...field}
                                name="name"
                                required
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder="Ex.: Funilaria São Jorge"
                            />
                        )}
                    </Field>

                    <Field
                        id="owner_name"
                        label="Nome do responsável"
                        optional
                        error={form.errors.owner_name}
                    >
                        {(field) => (
                            <Input
                                {...field}
                                name="owner_name"
                                autoComplete="name"
                                value={form.data.owner_name}
                                onChange={(event) =>
                                    form.setData(
                                        'owner_name',
                                        event.target.value,
                                    )
                                }
                            />
                        )}
                    </Field>

                    <Field
                        id="phone"
                        label="Telefone"
                        optional
                        error={form.errors.phone}
                    >
                        {(field) => (
                            <Input
                                {...field}
                                name="phone"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                value={form.data.phone}
                                onChange={(event) =>
                                    form.setData('phone', event.target.value)
                                }
                                placeholder="(00) 00000-0000"
                            />
                        )}
                    </Field>

                    <Field
                        id="document"
                        label="CPF ou CNPJ"
                        optional
                        error={form.errors.document}
                    >
                        {(field) => (
                            <Input
                                {...field}
                                name="document"
                                inputMode="numeric"
                                value={form.data.document}
                                onChange={(event) =>
                                    form.setData('document', event.target.value)
                                }
                            />
                        )}
                    </Field>

                    <Field
                        id="address"
                        label="Endereço"
                        optional
                        error={form.errors.address}
                    >
                        {(field) => (
                            <Input
                                {...field}
                                name="address"
                                autoComplete="street-address"
                                value={form.data.address}
                                onChange={(event) =>
                                    form.setData('address', event.target.value)
                                }
                                placeholder="Rua, número, bairro e cidade"
                            />
                        )}
                    </Field>

                    <Button
                        type="submit"
                        size="lg"
                        loading={form.processing}
                        className="w-full sm:w-auto"
                    >
                        {form.processing ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                </form>
            </section>
        </>
    );
}
