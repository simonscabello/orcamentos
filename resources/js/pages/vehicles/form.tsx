import { Head, Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Field, FormSection } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';

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

    const cancelHref = form.data.customer_id
        ? `/customers/${vehicle?.customer_id || form.data.customer_id}`
        : '/customers';

    return (
        <>
            <Head title={vehicle ? 'Editar veículo' : 'Novo veículo'} />

            <PageHeader
                title={vehicle ? 'Editar veículo' : 'Novo veículo'}
                description="Só o modelo é obrigatório. Placa e cor ajudam a identificar depois."
                backHref={cancelHref}
            />

            <form onSubmit={submit} className="space-y-4">
                <FormSection>
                    <Field
                        id="customer_id"
                        label="Cliente"
                        error={form.errors.customer_id}
                        hint={
                            customers.length
                                ? undefined
                                : 'Cadastre um cliente antes de continuar.'
                        }
                    >
                        {(field) => (
                            <Select
                                {...field}
                                name="customer_id"
                                required
                                value={form.data.customer_id}
                                onChange={(event) =>
                                    form.setData(
                                        'customer_id',
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="">Selecione um cliente</option>
                                {customers.map((customer) => (
                                    <option
                                        key={customer.id}
                                        value={customer.id}
                                    >
                                        {customer.name}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>

                    {!customers.length && (
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/customers/create">
                                Cadastrar cliente
                            </Link>
                        </Button>
                    )}

                    <Field id="model" label="Modelo" error={form.errors.model}>
                        {(field) => (
                            <Input
                                {...field}
                                name="model"
                                required
                                autoFocus
                                value={form.data.model}
                                onChange={(event) =>
                                    form.setData('model', event.target.value)
                                }
                                placeholder="Ex.: Chevrolet Onix"
                            />
                        )}
                    </Field>

                    <Field
                        id="plate"
                        label="Placa"
                        optional
                        error={form.errors.plate}
                    >
                        {(field) => (
                            <Input
                                {...field}
                                name="plate"
                                autoCapitalize="characters"
                                autoCorrect="off"
                                spellCheck={false}
                                value={form.data.plate}
                                onChange={(event) =>
                                    form.setData(
                                        'plate',
                                        event.target.value.toUpperCase(),
                                    )
                                }
                                className="uppercase"
                                placeholder="ABC1D23"
                            />
                        )}
                    </Field>

                    <Field
                        id="color"
                        label="Cor"
                        optional
                        error={form.errors.color}
                    >
                        {(field) => (
                            <Input
                                {...field}
                                name="color"
                                value={form.data.color}
                                onChange={(event) =>
                                    form.setData('color', event.target.value)
                                }
                                placeholder="Ex.: Prata"
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
                        {form.processing ? 'Salvando...' : 'Salvar veículo'}
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
