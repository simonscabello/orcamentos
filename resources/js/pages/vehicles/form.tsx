import { Head, Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Field, FormSection } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { focusFirstError } from '@/lib/form-errors';

type Customer = { id: number; name: string };
type Vehicle = {
    id: number;
    customer_id: number;
    model: string;
    plate?: string;
    color?: string;
};
type KnownPlate = {
    plate: string;
    customer_id: number;
    customer_name: string;
    model: string;
};

/** Mesma normalização do servidor (Vehicle::normalizePlate): só letras e números. */
const normalizePlate = (plate: string) =>
    plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

export default function VehicleForm({
    vehicle,
    customers,
    selectedCustomerId,
    knownPlates = [],
    hasEstimates = false,
}: {
    vehicle?: Vehicle;
    customers: Customer[];
    selectedCustomerId?: number;
    knownPlates?: KnownPlate[];
    hasEstimates?: boolean;
}) {
    const form = useForm({
        // Sem cliente indicado pela tela de origem, o usuário escolhe: evita vincular o veículo ao cliente errado.
        customer_id: String(vehicle?.customer_id || selectedCustomerId || ''),
        model: vehicle?.model || '',
        plate: vehicle?.plate || '',
        color: vehicle?.color || '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const options = { onError: focusFirstError };

        if (vehicle) form.put(`/vehicles/${vehicle.id}`, options);
        else form.post('/vehicles', options);
    };

    useUnsavedChanges(form.isDirty && !form.processing);

    // O mesmo carro pode voltar com outra pessoa: avisa, mas deixa salvar.
    const plate = normalizePlate(form.data.plate);
    const repeatedPlate = plate
        ? knownPlates.find((known) => known.plate === plate)
        : undefined;
    const repeatedForSameCustomer =
        repeatedPlate &&
        String(repeatedPlate.customer_id) === form.data.customer_id;

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
                            !customers.length
                                ? 'Cadastre um cliente antes de continuar.'
                                : hasEstimates
                                  ? 'Este veículo já tem orçamentos, por isso o cliente não muda. Para um novo dono, cadastre o veículo de novo.'
                                  : undefined
                        }
                    >
                        {(field) => (
                            <Select
                                {...field}
                                name="customer_id"
                                required
                                disabled={hasEstimates}
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
                            <Link href="/customers/create">Novo cliente</Link>
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
                    {repeatedPlate && (
                        <p
                            role="status"
                            className="-mt-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
                        >
                            {repeatedForSameCustomer
                                ? `Este cliente já tem um veículo com essa placa (${repeatedPlate.model}).`
                                : `Esta placa já está cadastrada para ${repeatedPlate.customer_name} (${repeatedPlate.model}). Você pode salvar mesmo assim para este cliente.`}
                        </p>
                    )}

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
