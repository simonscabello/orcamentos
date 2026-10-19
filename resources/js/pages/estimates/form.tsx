import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { MoneyInput } from '@/components/money-input';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FormSection } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import type { DiscountType, ItemType } from '@/lib/estimate-totals';
import {
    discountCents,
    isQuantityInput,
    itemCents,
    itemTypeLabels,
} from '@/lib/estimate-totals';
import { focusFirstError } from '@/lib/form-errors';
import {
    addDaysToIsoDate,
    centsToInput,
    formatCurrency,
    formatEstimateNumber,
    formatPhone,
    isMoneyInput,
    moneyToCents,
    todayIsoDate,
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
    valid_until?: string | null;
    insurer_name?: string | null;
    claim_number?: string | null;
    deductible?: number | null;
    discount_type?: 'fixed' | 'percent' | null;
    discount_value?: number | null;
    items: SavedItem[];
};
type SavedItem = {
    description: string;
    amount: number;
    type?: 'part' | 'labor' | null;
    quantity?: number | null;
    unit_amount?: number | null;
};
type Item = {
    description: string;
    amount: string;
    type: ItemType;
    detailed: boolean;
    quantity: string;
    unit_amount: string;
};

const emptyItem: Item = {
    description: '',
    amount: '',
    type: '',
    detailed: false,
    quantity: '',
    unit_amount: '',
};
type Status = 'draft' | 'sent';
type DuplicateOf = {
    number: number;
    notes?: string | null;
    insurer_name?: string | null;
    claim_number?: string | null;
    deductible?: number | null;
    discount_type?: 'fixed' | 'percent' | null;
    discount_value?: number | null;
    items: SavedItem[];
};

const discountOptions: { value: DiscountType; label: string }[] = [
    { value: '', label: 'Sem desconto' },
    { value: 'fixed', label: 'Em R$' },
    { value: 'percent', label: 'Em %' },
];

const validityShortcuts = [7, 15, 30];

const statusOptions: { value: Status; label: string; hint: string }[] = [
    {
        value: 'draft',
        label: 'Rascunho',
        hint: 'Ainda não foi enviado ao cliente.',
    },
    { value: 'sent', label: 'Enviado', hint: 'O cliente já recebeu o PDF.' },
];

export default function EstimateForm({
    estimate,
    customers,
    vehicles,
    selectedCustomerId,
    selectedVehicleId,
    itemSuggestions = [],
    duplicateOf,
}: {
    estimate?: Estimate;
    customers: Customer[];
    vehicles: Vehicle[];
    selectedCustomerId?: number | null;
    selectedVehicleId?: number | null;
    itemSuggestions?: string[];
    duplicateOf?: DuplicateOf | null;
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
        date: estimate?.date || todayIsoDate(),
        status: (estimate?.status || 'draft') as Status,
        notes: estimate?.notes || duplicateOf?.notes || '',
        valid_until: estimate?.valid_until || '',
        insurer_name: (estimate ?? duplicateOf)?.insurer_name || '',
        claim_number: (estimate ?? duplicateOf)?.claim_number || '',
        deductible:
            (estimate ?? duplicateOf)?.deductible != null
                ? centsToInput((estimate ?? duplicateOf)!.deductible!)
                : '',
        discount_type: ((estimate ?? duplicateOf)?.discount_type ??
            '') as DiscountType,
        discount_value:
            (estimate ?? duplicateOf)?.discount_value != null
                ? centsToInput((estimate ?? duplicateOf)!.discount_value!)
                : '',
        items: (estimate?.items ?? duplicateOf?.items)?.map((item): Item => ({
            description: item.description,
            amount: centsToInput(item.amount),
            type: item.type ?? '',
            detailed: item.quantity != null,
            quantity: item.quantity != null ? String(item.quantity) : '',
            unit_amount:
                item.unit_amount != null ? centsToInput(item.unit_amount) : '',
        })) ?? [emptyItem],
    });

    useUnsavedChanges(form.isDirty && !form.processing);

    // A seção da seguradora fica aberta quando já há dados dela.
    const [hasInsurer, setHasInsurer] = useState(
        Boolean(
            form.data.insurer_name ||
            form.data.claim_number ||
            form.data.deductible,
        ),
    );

    const toggleInsurer = (enabled: boolean) => {
        setHasInsurer(enabled);

        if (!enabled) {
            form.setData((data) => ({
                ...data,
                insurer_name: '',
                claim_number: '',
                deductible: '',
            }));
        }
    };

    const descriptionRefs = useRef<(HTMLInputElement | null)[]>([]);
    const amountRefs = useRef<(HTMLInputElement | null)[]>([]);
    const focusIndex = useRef<number | null>(null);

    const options = vehicles.filter(
        (vehicle) => String(vehicle.customer_id) === form.data.customer_id,
    );
    const subtotal = form.data.items.reduce(
        (sum, item) => sum + itemCents(item),
        0,
    );
    const discount = discountCents(
        subtotal,
        form.data.discount_type,
        form.data.discount_value,
    );
    const total = subtotal - discount;

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
        form.setData('items', [...form.data.items, emptyItem]);
    };

    // Remoção imediata, com opção de desfazer: evita um diálogo de confirmação a cada item.
    const removeItem = (index: number) => {
        const removed = form.data.items[index];

        form.setData(
            'items',
            form.data.items.filter((_, i) => i !== index),
        );

        toast(`Item ${index + 1} removido.`, {
            action: {
                label: 'Desfazer',
                onClick: () =>
                    form.setData((data) => {
                        const items = [...data.items];
                        items.splice(index, 0, removed);

                        return { ...data, items };
                    }),
            },
        });
    };

    // No teclado do celular, "Enter" avança para o próximo campo em vez de salvar o orçamento pela metade.
    const onItemKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
        index: number,
        field: 'description' | 'amount',
    ) => {
        if (event.key !== 'Enter') return;

        event.preventDefault();

        if (field === 'description') {
            amountRefs.current[index]?.focus();
        } else if (index < form.data.items.length - 1) {
            descriptionRefs.current[index + 1]?.focus();
        } else {
            addItem();
        }
    };

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
            // Franquia inválida segue como texto para o servidor recusar com mensagem,
            // em vez de virar R$ 0,00 em silêncio.
            deductible: !data.deductible.trim()
                ? null
                : isMoneyInput(data.deductible)
                  ? moneyToCents(data.deductible)
                  : data.deductible,
            discount_type: data.discount_type || null,
            discount_value: !data.discount_type
                ? null
                : isMoneyInput(data.discount_value)
                  ? moneyToCents(data.discount_value)
                  : data.discount_value,
            // Valores inválidos seguem como texto para o servidor recusar com mensagem.
            items: data.items.map(({ detailed, ...item }) => ({
                description: item.description,
                type: item.type || null,
                quantity: !detailed
                    ? null
                    : isQuantityInput(item.quantity)
                      ? Number(item.quantity)
                      : item.quantity,
                unit_amount: !detailed
                    ? null
                    : isMoneyInput(item.unit_amount)
                      ? moneyToCents(item.unit_amount)
                      : item.unit_amount,
                amount: detailed ? null : moneyToCents(item.amount),
            })),
        }));

        const visitOptions = { onError: focusFirstError };

        if (estimate) form.put(`/estimates/${estimate.id}`, visitOptions);
        else form.post('/estimates', visitOptions);
    };

    const customerHasNoVehicle = Boolean(
        form.data.customer_id && options.length === 0,
    );

    return (
        <>
            <Head title={estimate ? 'Editar orçamento' : 'Novo orçamento'} />

            <PageHeader
                title={estimate ? 'Editar orçamento' : 'Novo orçamento'}
                description={
                    duplicateOf
                        ? `Cópia do orçamento ${formatEstimateNumber(duplicateOf.number)}. Revise os dados e salve.`
                        : 'Escolha o cliente, liste os serviços e salve.'
                }
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
                        Novo cliente
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
                        Novo veículo
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
                    <header className="mb-4">
                        <div className="flex items-baseline justify-between gap-4">
                            <h2 className="text-base font-semibold">
                                Itens do orçamento
                            </h2>
                            <span className="text-muted-foreground text-sm">
                                {form.data.items.length}{' '}
                                {form.data.items.length === 1
                                    ? 'item'
                                    : 'itens'}
                            </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-sm">
                            Use vírgula para os centavos, como em 1.250,00.
                        </p>
                    </header>

                    {itemSuggestions.length > 0 && (
                        <datalist id="item-suggestions">
                            {itemSuggestions.map((suggestion) => (
                                <option key={suggestion} value={suggestion} />
                            ))}
                        </datalist>
                    )}

                    <ul className="space-y-3">
                        {form.data.items.map((item, index) => {
                            const descriptionError =
                                form.errors[`items.${index}.description`];
                            const amountError =
                                form.errors[`items.${index}.amount`];
                            const quantityError =
                                form.errors[`items.${index}.quantity`];
                            const unitError =
                                form.errors[`items.${index}.unit_amount`];
                            const typeError =
                                form.errors[`items.${index}.type`];

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
                                            label="Descrição"
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
                                                    list={
                                                        itemSuggestions.length
                                                            ? 'item-suggestions'
                                                            : undefined
                                                    }
                                                    autoComplete="off"
                                                    enterKeyHint="next"
                                                    onKeyDown={(event) =>
                                                        onItemKeyDown(
                                                            event,
                                                            index,
                                                            'description',
                                                        )
                                                    }
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

                                        {item.detailed ? (
                                            <div className="grid grid-cols-[5rem_1fr] gap-3">
                                                <Field
                                                    id={`items-${index}-quantity`}
                                                    label="Qtd"
                                                    error={quantityError}
                                                >
                                                    {(field) => (
                                                        <Input
                                                            {...field}
                                                            inputMode="numeric"
                                                            value={
                                                                item.quantity
                                                            }
                                                            onChange={(event) =>
                                                                setItem(index, {
                                                                    quantity:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            }
                                                            className="tabular text-center"
                                                        />
                                                    )}
                                                </Field>
                                                <Field
                                                    id={`items-${index}-unit_amount`}
                                                    label="Valor unitário"
                                                    error={unitError}
                                                >
                                                    {(field) => (
                                                        <MoneyInput
                                                            {...field}
                                                            value={
                                                                item.unit_amount
                                                            }
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                setItem(index, {
                                                                    unit_amount:
                                                                        value,
                                                                })
                                                            }
                                                            className="font-semibold"
                                                        />
                                                    )}
                                                </Field>
                                            </div>
                                        ) : (
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
                                                            ref={(element) => {
                                                                amountRefs.current[
                                                                    index
                                                                ] = element;
                                                            }}
                                                            required
                                                            inputMode="decimal"
                                                            enterKeyHint={
                                                                index ===
                                                                form.data.items
                                                                    .length -
                                                                    1
                                                                    ? 'enter'
                                                                    : 'next'
                                                            }
                                                            onKeyDown={(
                                                                event,
                                                            ) =>
                                                                onItemKeyDown(
                                                                    event,
                                                                    index,
                                                                    'amount',
                                                                )
                                                            }
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
                                        )}
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        {(
                                            Object.keys(
                                                itemTypeLabels,
                                            ) as Exclude<ItemType, ''>[]
                                        ).map((type) => (
                                            <Button
                                                key={type}
                                                type="button"
                                                size="sm"
                                                variant={
                                                    item.type === type
                                                        ? 'primary'
                                                        : 'outline'
                                                }
                                                aria-pressed={
                                                    item.type === type
                                                }
                                                onClick={() =>
                                                    setItem(index, {
                                                        type:
                                                            item.type === type
                                                                ? ''
                                                                : type,
                                                    })
                                                }
                                            >
                                                {itemTypeLabels[type]}
                                            </Button>
                                        ))}
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="ml-auto"
                                            onClick={() =>
                                                setItem(
                                                    index,
                                                    item.detailed
                                                        ? {
                                                              detailed: false,
                                                              amount: centsToInput(
                                                                  itemCents(
                                                                      item,
                                                                  ),
                                                              ),
                                                          }
                                                        : {
                                                              detailed: true,
                                                              quantity: '1',
                                                              unit_amount:
                                                                  item.amount,
                                                          },
                                                )
                                            }
                                        >
                                            {item.detailed
                                                ? 'Valor único'
                                                : 'Qtd × unitário'}
                                        </Button>
                                    </div>
                                    {item.detailed && (
                                        <p className="text-muted-foreground mt-2 text-right text-sm">
                                            Total do item:{' '}
                                            <span className="tabular text-foreground font-semibold">
                                                {formatCurrency(
                                                    itemCents(item),
                                                )}
                                            </span>
                                        </p>
                                    )}
                                    {typeError && (
                                        <FieldError>{typeError}</FieldError>
                                    )}
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

                <FormSection title="Desconto">
                    <div
                        className="bg-muted grid grid-cols-3 gap-1 rounded-xl p-1"
                        role="radiogroup"
                        aria-label="Tipo de desconto"
                    >
                        {discountOptions.map((option) => (
                            <label
                                key={option.value || 'none'}
                                className="has-checked:bg-card has-checked:text-foreground text-muted-foreground has-focus-visible:ring-ring flex min-h-10 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors has-checked:shadow-xs has-focus-visible:ring-2"
                            >
                                <input
                                    type="radio"
                                    name="discount_type"
                                    value={option.value}
                                    checked={
                                        form.data.discount_type === option.value
                                    }
                                    onChange={() =>
                                        form.setData((data) => ({
                                            ...data,
                                            discount_type: option.value,
                                            discount_value: option.value
                                                ? data.discount_value
                                                : '',
                                        }))
                                    }
                                    className="sr-only"
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                    {form.errors.discount_type && (
                        <FieldError>{form.errors.discount_type}</FieldError>
                    )}

                    {form.data.discount_type && (
                        <Field
                            id="discount_value"
                            label={
                                form.data.discount_type === 'percent'
                                    ? 'Desconto (%)'
                                    : 'Desconto (R$)'
                            }
                            hint={
                                discount > 0
                                    ? `Desconto de ${formatCurrency(discount)} sobre ${formatCurrency(subtotal)}.`
                                    : undefined
                            }
                            error={form.errors.discount_value}
                        >
                            {(field) => (
                                <MoneyInput
                                    {...field}
                                    prefix={
                                        form.data.discount_type === 'percent'
                                            ? '%'
                                            : 'R$'
                                    }
                                    value={form.data.discount_value}
                                    onValueChange={(value) =>
                                        form.setData('discount_value', value)
                                    }
                                />
                            )}
                        </Field>
                    )}
                </FormSection>

                <FormSection>
                    <fieldset>
                        <legend className="text-foreground mb-2 text-sm font-medium">
                            Situação
                        </legend>
                        <div className="bg-muted grid grid-cols-2 gap-1 rounded-xl p-1">
                            {statusOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className="has-checked:bg-card has-checked:text-foreground text-muted-foreground has-focus-visible:ring-ring flex min-h-10 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors has-checked:shadow-xs has-focus-visible:ring-2"
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={option.value}
                                        checked={
                                            form.data.status === option.value
                                        }
                                        onChange={() =>
                                            form.setData('status', option.value)
                                        }
                                        className="sr-only"
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </div>
                        <p className="text-muted-foreground mt-2 text-xs">
                            {
                                statusOptions.find(
                                    (option) =>
                                        option.value === form.data.status,
                                )?.hint
                            }
                        </p>
                        {form.errors.status && (
                            <FieldError>{form.errors.status}</FieldError>
                        )}
                    </fieldset>

                    <Field
                        id="valid_until"
                        label="Válido até"
                        optional
                        hint="Aparece no PDF. Deixe em branco se não houver prazo."
                        error={form.errors.valid_until}
                    >
                        {(field) => (
                            <Input
                                {...field}
                                name="valid_until"
                                type="date"
                                min={form.data.date || undefined}
                                value={form.data.valid_until}
                                onChange={(event) =>
                                    form.setData(
                                        'valid_until',
                                        event.target.value,
                                    )
                                }
                            />
                        )}
                    </Field>
                    <div
                        className="-mt-2 flex flex-wrap gap-2"
                        role="group"
                        aria-label="Atalhos de validade"
                    >
                        {validityShortcuts.map((days) => (
                            <Button
                                key={days}
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!form.data.date}
                                onClick={() =>
                                    form.setData(
                                        'valid_until',
                                        addDaysToIsoDate(form.data.date, days),
                                    )
                                }
                            >
                                {days} dias
                            </Button>
                        ))}
                        {form.data.valid_until && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => form.setData('valid_until', '')}
                            >
                                Sem validade
                            </Button>
                        )}
                    </div>

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
                                placeholder="Ex.: peças com garantia de 90 dias."
                            />
                        )}
                    </Field>
                </FormSection>

                <FormSection>
                    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
                        <span>
                            <span className="text-foreground block text-base font-semibold">
                                Orçamento para seguradora
                            </span>
                            <span className="text-muted-foreground block text-sm">
                                Seguradora, sinistro e franquia no PDF.
                            </span>
                        </span>
                        <input
                            type="checkbox"
                            checked={hasInsurer}
                            onChange={(event) =>
                                toggleInsurer(event.target.checked)
                            }
                            className="accent-primary size-5 shrink-0"
                        />
                    </label>

                    {hasInsurer && (
                        <div className="mt-4 space-y-4">
                            <Field
                                id="insurer_name"
                                label="Seguradora"
                                optional
                                error={form.errors.insurer_name}
                            >
                                {(field) => (
                                    <Input
                                        {...field}
                                        name="insurer_name"
                                        maxLength={120}
                                        value={form.data.insurer_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'insurer_name',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Ex.: Porto Seguro"
                                    />
                                )}
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    id="claim_number"
                                    label="Nº do sinistro"
                                    optional
                                    error={form.errors.claim_number}
                                >
                                    {(field) => (
                                        <Input
                                            {...field}
                                            name="claim_number"
                                            maxLength={60}
                                            value={form.data.claim_number}
                                            onChange={(event) =>
                                                form.setData(
                                                    'claim_number',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    )}
                                </Field>
                                <Field
                                    id="deductible"
                                    label="Franquia"
                                    optional
                                    error={form.errors.deductible}
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
                                                name="deductible"
                                                inputMode="decimal"
                                                value={form.data.deductible}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'deductible',
                                                        event.target.value,
                                                    )
                                                }
                                                onBlur={(event) =>
                                                    isMoneyInput(
                                                        event.target.value,
                                                    ) &&
                                                    form.setData(
                                                        'deductible',
                                                        centsToInput(
                                                            moneyToCents(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        ),
                                                    )
                                                }
                                                placeholder="0,00"
                                                className="tabular pl-10 text-right"
                                            />
                                        </div>
                                    )}
                                </Field>
                            </div>
                        </div>
                    )}
                </FormSection>

                <div className="border-border bg-card sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-10 rounded-2xl border p-4 shadow-lg lg:bottom-4">
                    {discount > 0 && (
                        <p className="text-muted-foreground tabular mb-1 flex justify-between gap-4 text-sm">
                            <span>Subtotal {formatCurrency(subtotal)}</span>
                            <span>Desconto −{formatCurrency(discount)}</span>
                        </p>
                    )}
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
