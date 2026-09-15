import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FormSection } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import {
    centsToInput,
    formatCurrency,
    formatPhone,
    moneyToCents,
} from '@/lib/format';

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
    selectedCustomerId,
    selectedVehicleId,
}: {
    estimate?: Estimate;
    customers: Customer[];
    vehicles: Vehicle[];
    selectedCustomerId?: number | null;
    selectedVehicleId?: number | null;
}) {
    // Sem cliente pré-selecionado: só vem preenchido ao editar ou quando a tela de origem indicou o cliente/veículo.
    const initialCustomerId = String(
        estimate?.customer_id || selectedCustomerId || '',
    );
    const initialCustomerVehicles = vehicles.filter(
        (vehicle) => String(vehicle.customer_id) === initialCustomerId,
    );

    const form = useForm({
        customer_id: initialCustomerId,
        vehicle_id: String(
            estimate?.vehicle_id ||
                selectedVehicleId ||
                (initialCustomerId && initialCustomerVehicles.length === 1
                    ? initialCustomerVehicles[0].id
                    : ''),
        ),
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

    const descriptionRefs = useRef<(HTMLInputElement | null)[]>([]);
    const focusIndex = useRef<number | null>(null);

    const options = vehicles.filter(
        (vehicle) => String(vehicle.customer_id) === form.data.customer_id,
    );
    const total = form.data.items.reduce(
        (sum, item) => sum + moneyToCents(item.amount),
        0,
    );

    // Move o foco para o item recém-adicionado.
    useEffect(() => {
        if (focusIndex.current === null) return;

        descriptionRefs.current[focusIndex.current]?.focus();
        focusIndex.current = null;
    }, [form.data.items.length]);

    const setItem = (index: number, patch: Partial<Item>) =>
        form.setData(
            'items',
            form.data.items.map((item, i) =>
                i === index ? { ...item, ...patch } : item,
            ),
        );

    const addItem = () => {
        focusIndex.current = form.data.items.length;
        form.setData('items', [
            ...form.data.items,
            { description: '', amount: '' },
        ]);
    };

    const removeItem = (index: number) =>
        form.setData(
            'items',
            form.data.items.filter((_, i) => i !== index),
        );

    const selectCustomer = (customerId: string) => {
        const customerVehicles = vehicles.filter(
            (vehicle) => String(vehicle.customer_id) === customerId,
        );

        form.setData((data) => ({
            ...data,
            customer_id: customerId,
            // Com um único veículo, já deixamos selecionado para poupar um toque.
            vehicle_id:
                customerVehicles.length === 1
                    ? String(customerVehicles[0].id)
                    : '',
        }));
    };

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

    const customerHasNoVehicle = Boolean(
        form.data.customer_id && options.length === 0,
    );

    return (
        <>
            <Head title={estimate ? 'Editar orçamento' : 'Novo orçamento'} />

            <PageHeader
                title={estimate ? 'Editar orçamento' : 'Novo orçamento'}
                description="Escolha o cliente, liste os serviços e salve."
                backHref={estimate ? `/estimates/${estimate.id}` : '/estimates'}
            />

            <form onSubmit={submit} className="space-y-4">
                <FormSection title="Cliente e veículo">
                    <Field
                        id="customer_id"
                        label="Cliente"
                        error={form.errors.customer_id}
                    >
                        {(field) => (
                            <Select
                                {...field}
                                name="customer_id"
                                required
                                value={form.data.customer_id}
                                onChange={(event) =>
                                    selectCustomer(event.target.value)
                                }
                            >
                                <option value="">Selecione um cliente</option>
                                {customers.map((customer) => (
                                    <option
                                        key={customer.id}
                                        value={customer.id}
                                    >
                                        {customer.name}
                                        {customer.phone
                                            ? ` · ${formatPhone(customer.phone)}`
                                            : ''}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                    <Link
                        href="/customers/create"
                        className="text-primary -mt-3 inline-flex min-h-9 items-center gap-1 rounded-lg text-sm font-semibold hover:underline"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        Cadastrar cliente
                    </Link>

                    <Field
                        id="vehicle_id"
                        label="Veículo"
                        error={form.errors.vehicle_id}
                        hint={
                            customerHasNoVehicle
                                ? 'Este cliente ainda não tem veículo cadastrado.'
                                : undefined
                        }
                    >
                        {(field) => (
                            <Select
                                {...field}
                                name="vehicle_id"
                                required
                                disabled={!form.data.customer_id}
                                value={form.data.vehicle_id}
                                onChange={(event) =>
                                    form.setData(
                                        'vehicle_id',
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="">Selecione um veículo</option>
                                {options.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.model}
                                        {vehicle.plate
                                            ? ` · ${vehicle.plate}`
                                            : ''}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                    <Link
                        href={
                            form.data.customer_id
                                ? `/vehicles/create?customer_id=${form.data.customer_id}`
                                : '/vehicles/create'
                        }
                        className="text-primary -mt-3 inline-flex min-h-9 items-center gap-1 rounded-lg text-sm font-semibold hover:underline"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        Cadastrar veículo
                    </Link>

                    <Field id="date" label="Data" error={form.errors.date}>
                        {(field) => (
                            <Input
                                {...field}
                                name="date"
                                type="date"
                                required
                                value={form.data.date}
                                onChange={(event) =>
                                    form.setData('date', event.target.value)
                                }
                            />
                        )}
                    </Field>
                </FormSection>

                <section className="border-border bg-card rounded-2xl border p-4 sm:p-5">
                    <header className="mb-4 flex items-baseline justify-between gap-4">
                        <h2 className="text-base font-semibold">
                            Itens do orçamento
                        </h2>
                        <span className="text-muted-foreground text-sm">
                            {form.data.items.length}{' '}
                            {form.data.items.length === 1 ? 'item' : 'itens'}
                        </span>
                    </header>

                    <ul className="space-y-3">
                        {form.data.items.map((item, index) => {
                            const descriptionError =
                                form.errors[`items.${index}.description`];
                            const amountError =
                                form.errors[`items.${index}.amount`];

                            return (
                                <li
                                    key={index}
                                    className="border-border bg-muted/40 rounded-xl border p-3"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                            Item {index + 1}
                                        </span>
                                        {form.data.items.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() =>
                                                    removeItem(index)
                                                }
                                                aria-label={`Remover item ${index + 1}`}
                                                className="text-destructive hover:bg-destructive-soft hover:text-destructive"
                                            >
                                                <Trash2 aria-hidden="true" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
                                        <Field
                                            id={`items-${index}-description`}
                                            label="Descrição do serviço"
                                            error={descriptionError}
                                        >
                                            {(field) => (
                                                <Input
                                                    {...field}
                                                    ref={(element) => {
                                                        descriptionRefs.current[
                                                            index
                                                        ] = element;
                                                    }}
                                                    required
                                                    value={item.description}
                                                    onChange={(event) =>
                                                        setItem(index, {
                                                            description:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                    placeholder="Ex.: Pintura do para-choque"
                                                />
                                            )}
                                        </Field>

                                        <Field
                                            id={`items-${index}-amount`}
                                            label="Valor"
                                            error={amountError}
                                        >
                                            {(field) => (
                                                <div className="relative">
                                                    <span
                                                        aria-hidden="true"
                                                        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-medium"
                                                    >
                                                        R$
                                                    </span>
                                                    <Input
                                                        {...field}
                                                        required
                                                        inputMode="decimal"
                                                        value={item.amount}
                                                        onChange={(event) =>
                                                            setItem(index, {
                                                                amount: event
                                                                    .target
                                                                    .value,
                                                            })
                                                        }
                                                        onBlur={(event) =>
                                                            event.target
                                                                .value &&
                                                            setItem(index, {
                                                                amount: centsToInput(
                                                                    moneyToCents(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    ),
                                                                ),
                                                            })
                                                        }
                                                        placeholder="0,00"
                                                        className="tabular pl-10 text-right font-semibold"
                                                    />
                                                </div>
                                            )}
                                        </Field>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={addItem}
                        className="mt-3 w-full border-dashed"
                    >
                        <Plus aria-hidden="true" />
                        Adicionar item
                    </Button>

                    {form.errors.items && (
                        <FieldError>{form.errors.items}</FieldError>
                    )}
                </section>

                <FormSection>
                    <Field
                        id="notes"
                        label="Observações"
                        optional
                        hint="Aparecem no PDF enviado ao cliente."
                        error={form.errors.notes}
                    >
                        {(field) => (
                            <Textarea
                                {...field}
                                name="notes"
                                value={form.data.notes}
                                onChange={(event) =>
                                    form.setData('notes', event.target.value)
                                }
                                placeholder="Ex.: orçamento válido por 7 dias."
                            />
                        )}
                    </Field>
                </FormSection>

                <div className="border-border bg-card sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-10 rounded-2xl border p-4 shadow-lg lg:bottom-4">
                    <div className="mb-3 flex items-baseline justify-between gap-4">
                        <span className="text-muted-foreground text-sm font-medium">
                            Total do orçamento
                        </span>
                        <span
                            className="tabular text-2xl font-bold tracking-tight"
                            aria-live="polite"
                        >
                            {formatCurrency(total)}
                        </span>
                    </div>
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        loading={form.processing}
                    >
                        {form.processing
                            ? 'Salvando...'
                            : estimate
                              ? 'Salvar alterações'
                              : 'Salvar orçamento'}
                    </Button>
                </div>

                <div className="pt-1 text-center">
                    <Button asChild variant="ghost">
                        <Link
                            href={
                                estimate
                                    ? `/estimates/${estimate.id}`
                                    : '/estimates'
                            }
                        >
                            Cancelar
                        </Link>
                    </Button>
                </div>
            </form>
        </>
    );
}
