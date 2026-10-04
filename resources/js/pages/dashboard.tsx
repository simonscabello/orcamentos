import { Head, Link } from '@inertiajs/react';
import { Check, FileText, Plus, UserPlus } from 'lucide-react';

import {
    EstimateListItem,
    type EstimateListItemData,
} from '@/components/estimate-list-item';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { firstName, greeting } from '@/lib/format';
import { cn } from '@/lib/utils';

type Onboarding = { hasCustomers: boolean; hasVehicles: boolean };

type Props = {
    business: { owner_name?: string; name: string };
    estimates: EstimateListItemData[];
    onboarding?: Onboarding | null;
};

/** Passo a passo exibido enquanto a oficina ainda não criou orçamentos. */
function FirstSteps({ onboarding }: { onboarding: Onboarding }) {
    const steps = [
        {
            title: 'Cadastre o cliente',
            description: 'Nome e, se quiser, telefone.',
            href: '/customers/create',
            done: onboarding.hasCustomers,
        },
        {
            title: 'Adicione o veículo',
            description: 'Na ficha do cliente, toque em “Novo veículo”.',
            href: '/customers',
            done: onboarding.hasVehicles,
        },
        {
            title: 'Monte o orçamento',
            description: 'Liste os serviços com seus valores e salve.',
            href: '/estimates/create',
            done: false,
        },
        {
            title: 'Envie o PDF',
            description: 'No orçamento salvo, toque em “Compartilhar”.',
            done: false,
        },
    ];
    const current = steps.findIndex((step) => !step.done);

    return (
        <section
            aria-labelledby="primeiros-passos"
            className="border-border bg-card mt-8 rounded-2xl border p-4 sm:p-5"
        >
            <h2 id="primeiros-passos" className="text-base font-semibold">
                Primeiros passos
            </h2>
            <p className="text-muted-foreground mt-0.5 text-sm">
                Do cadastro ao PDF enviado ao cliente em quatro etapas.
            </p>

            <ol className="mt-4 space-y-3">
                {steps.map((step, index) => {
                    const content = (
                        <>
                            <span
                                className={cn(
                                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                    step.done
                                        ? 'bg-success-soft text-success'
                                        : index === current
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {step.done ? (
                                    <>
                                        <Check
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        <span className="sr-only">
                                            Concluído:
                                        </span>
                                    </>
                                ) : (
                                    index + 1
                                )}
                            </span>
                            <span className="min-w-0">
                                <span
                                    className={cn(
                                        'block text-sm font-semibold',
                                        step.done &&
                                            'text-muted-foreground line-through',
                                    )}
                                >
                                    {step.title}
                                </span>
                                <span className="text-muted-foreground block text-sm">
                                    {step.description}
                                </span>
                            </span>
                        </>
                    );

                    return (
                        <li key={step.title}>
                            {step.href && !step.done ? (
                                <Link
                                    href={step.href}
                                    className="hover:bg-accent -mx-2 flex items-start gap-3 rounded-xl px-2 py-1.5 transition-colors"
                                >
                                    {content}
                                </Link>
                            ) : (
                                <div className="flex items-start gap-3 py-1.5">
                                    {content}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

export default function Dashboard({ business, estimates, onboarding }: Props) {
    const name = firstName(business.owner_name);

    return (
        <>
            <Head title="Início" />

            <header className="mb-6">
                <p className="text-muted-foreground truncate text-sm">
                    {business.name}
                </p>
                <h1 className="sm:text-display text-2xl font-bold tracking-tight">
                    {greeting()}
                    {name ? `, ${name}` : ''}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Monte um orçamento em poucos toques e envie para o cliente.
                </p>
            </header>

            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                <Button asChild size="xl" className="w-full">
                    <Link href="/estimates/create">
                        <Plus aria-hidden="true" />
                        Novo orçamento
                    </Link>
                </Button>
                <Button asChild variant="outline" size="xl" className="w-full">
                    <Link href="/customers/create">
                        <UserPlus aria-hidden="true" />
                        Novo cliente
                    </Link>
                </Button>
            </div>

            {onboarding && <FirstSteps onboarding={onboarding} />}

            <section className="mt-8">
                <div className="mb-3 flex items-baseline justify-between gap-4">
                    <h2 className="text-base font-semibold">
                        Orçamentos recentes
                    </h2>
                    {estimates.length > 0 && (
                        <Link
                            href="/estimates"
                            className="text-primary rounded-sm text-sm font-semibold hover:underline"
                        >
                            Ver todos
                        </Link>
                    )}
                </div>

                <div className="border-border bg-card overflow-hidden rounded-2xl border">
                    {estimates.length ? (
                        <ul className="divide-border divide-y">
                            {estimates.map((estimate) => (
                                <EstimateListItem
                                    key={estimate.id}
                                    estimate={estimate}
                                />
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            icon={FileText}
                            title="Nenhum orçamento ainda"
                            description="Crie o primeiro orçamento e ele aparecerá aqui."
                            action={
                                <Button asChild>
                                    <Link href="/estimates/create">
                                        <Plus aria-hidden="true" />
                                        Novo orçamento
                                    </Link>
                                </Button>
                            }
                        />
                    )}
                </div>
            </section>
        </>
    );
}
