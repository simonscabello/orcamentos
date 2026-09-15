import { Head, Link } from '@inertiajs/react';
import { Download, Pencil, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import {
    formatCurrency,
    formatDate,
    formatEstimateNumber,
    formatPhone,
} from '@/lib/format';

type Estimate = {
    id: number;
    number: number;
    total: number;
    date: string;
    status?: string;
    notes?: string;
    customer: { name: string; phone?: string };
    vehicle: { model: string; plate?: string; color?: string };
    items: { id: number; description: string; amount: number }[];
};

function DetailRow({
    label,
    value,
    secondary,
}: {
    label: string;
    value: string;
    secondary?: React.ReactNode;
}) {
    return (
        <div className="py-3 first:pt-0 last:pb-0">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {label}
            </p>
            <p className="text-foreground mt-0.5 font-semibold">{value}</p>
            {secondary && (
                <p className="text-muted-foreground text-sm">{secondary}</p>
            )}
        </div>
    );
}

export default function EstimateShow({ estimate }: { estimate: Estimate }) {
    const pdfUrl = `/estimates/${estimate.id}/pdf`;
    const fileName = `orcamento-${String(estimate.number).padStart(3, '0')}.pdf`;
    const [pdfAction, setPdfAction] = useState<'download' | 'share' | null>(
        null,
    );

    const fetchPdf = async () => {
        const response = await fetch(pdfUrl);

        if (!response.ok) {
            throw new Error('Não foi possível gerar o PDF.');
        }

        return response.blob();
    };

    const downloadBlob = (blob: Blob) => {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    const download = async () => {
        setPdfAction('download');

        try {
            downloadBlob(await fetchPdf());
        } catch {
            toast.error('Não foi possível gerar o PDF. Tente novamente.');
        } finally {
            setPdfAction(null);
        }
    };

    const share = async () => {
        setPdfAction('share');

        try {
            const blob = await fetchPdf();
            const file = new File([blob], fileName, {
                type: 'application/pdf',
            });

            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: `Orçamento #${estimate.number}`,
                    files: [file],
                });
                return;
            }

            downloadBlob(blob);
            toast.success('Seu PDF foi baixado.');
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }

            toast.error('Não foi possível gerar o PDF. Tente novamente.');
        } finally {
            setPdfAction(null);
        }
    };

    const vehicleDetails = [estimate.vehicle.plate, estimate.vehicle.color]
        .filter(Boolean)
        .join(' · ');

    return (
        <>
            <Head
                title={`Orçamento ${formatEstimateNumber(estimate.number)}`}
            />

            <PageHeader
                eyebrow="Orçamento"
                title={formatEstimateNumber(estimate.number)}
                description={formatDate(estimate.date)}
                backHref="/estimates"
                backLabel="Orçamentos"
                action={
                    <Button
                        asChild
                        variant="outline"
                        size="icon"
                        aria-label="Editar orçamento"
                    >
                        <Link href={`/estimates/${estimate.id}/edit`}>
                            <Pencil aria-hidden="true" />
                        </Link>
                    </Button>
                }
            />

            {estimate.status && (
                <div className="mb-4">
                    <Badge
                        tone={
                            estimate.status === 'sent' ? 'success' : 'neutral'
                        }
                    >
                        {estimate.status === 'sent' ? 'Enviado' : 'Rascunho'}
                    </Badge>
                </div>
            )}

            <div className="divide-border border-border bg-card divide-y rounded-2xl border p-4 sm:p-5">
                <DetailRow
                    label="Cliente"
                    value={estimate.customer.name}
                    secondary={
                        estimate.customer.phone ? (
                            <a
                                href={`tel:${estimate.customer.phone.replace(/\D/g, '')}`}
                                className="hover:text-foreground hover:underline"
                            >
                                {formatPhone(estimate.customer.phone)}
                            </a>
                        ) : null
                    }
                />
                <DetailRow
                    label="Veículo"
                    value={estimate.vehicle.model}
                    secondary={vehicleDetails || 'Sem placa'}
                />
            </div>

            <section className="border-border bg-card mt-4 overflow-hidden rounded-2xl border">
                <h2 className="border-border border-b px-4 py-3 text-base font-semibold sm:px-5">
                    Itens
                </h2>
                <ul className="divide-border divide-y">
                    {estimate.items.map((item) => (
                        <li
                            key={item.id}
                            className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5"
                        >
                            <span className="text-foreground">
                                {item.description}
                            </span>
                            <span className="tabular shrink-0 font-medium">
                                {formatCurrency(item.amount)}
                            </span>
                        </li>
                    ))}
                </ul>
                <div className="bg-muted/50 flex items-baseline justify-between gap-4 px-4 py-4 sm:px-5">
                    <span className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                        Total
                    </span>
                    <span className="tabular text-2xl font-bold tracking-tight">
                        {formatCurrency(estimate.total)}
                    </span>
                </div>
            </section>

            {estimate.notes && (
                <section className="border-border bg-card mt-4 rounded-2xl border p-4 sm:p-5">
                    <h2 className="mb-1.5 text-base font-semibold">
                        Observações
                    </h2>
                    <p className="text-muted-foreground text-sm whitespace-pre-line">
                        {estimate.notes}
                    </p>
                </section>
            )}

            <div className="border-border bg-card/95 sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-10 mt-4 grid grid-cols-2 gap-3 rounded-2xl border p-3 shadow-lg backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
                <Button
                    type="button"
                    size="lg"
                    onClick={share}
                    disabled={pdfAction !== null}
                    loading={pdfAction === 'share'}
                >
                    {pdfAction !== 'share' && <Share2 aria-hidden="true" />}
                    {pdfAction === 'share' ? 'Gerando PDF...' : 'Compartilhar'}
                </Button>
                <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={download}
                    disabled={pdfAction !== null}
                    loading={pdfAction === 'download'}
                >
                    {pdfAction !== 'download' && (
                        <Download aria-hidden="true" />
                    )}
                    {pdfAction === 'download' ? 'Gerando PDF...' : 'Baixar PDF'}
                </Button>
            </div>
        </>
    );
}
