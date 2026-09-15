import { Head, Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Field, FormSection } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';

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

    const cancelHref = customer ? `/customers/${customer.id}` : '/customers';

    return (
        <>
            <Head title={customer ? 'Editar cliente' : 'Novo cliente'} />

            <PageHeader
                title={customer ? 'Editar cliente' : 'Novo cliente'}
                description="O telefone facilita achar o cliente na busca."
                backHref={cancelHref}
            />

            <form onSubmit={submit} className="space-y-4">
                <FormSection>
                    <Field id="name" label="Nome" error={form.errors.name}>
                        {(field) => (
                            <Input
                                {...field}
                                name="name"
                                required
                                autoFocus
                                autoComplete="name"
                                enterKeyHint="next"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder="Nome do cliente"
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
                                enterKeyHint="done"
                                value={form.data.phone}
                                onChange={(event) =>
                                    form.setData('phone', event.target.value)
                                }
                                placeholder="(00) 00000-0000"
                            />
                        )}
                    </Field>
                </FormSection>

                <div className="flex flex-col-reverse gap-2 sm:flex-row-reverse">
                    <Button
                        type="submit"
                        size="lg"
                        loading={form.processing}
                        className="w-full sm:w-auto"
                    >
                        {form.processing ? 'Salvando...' : 'Salvar cliente'}
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        size="lg"
                        className="w-full sm:w-auto"
                    >
                        <Link href={cancelHref}>Cancelar</Link>
                    </Button>
                </div>
            </form>
        </>
    );
}
