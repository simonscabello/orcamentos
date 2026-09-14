import { Head, Link } from '@inertiajs/react';
import { Download, LoaderCircle, Pencil, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/format';
type Estimate = {
    id: number;
    number: number;
    total: number;
    date: string;
    notes?: string;
    customer: { name: string; phone?: string };
    vehicle: { model: string; plate?: string; color?: string };
    items: { id: number; description: string; amount: number }[];
};
export default function EstimateShow({ estimate }: { estimate: Estimate }) {
    const pdfUrl = `/estimates/${estimate.id}/pdf`;
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
        link.download = `orcamento-${String(estimate.number).padStart(3, '0')}.pdf`;
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
            const file = new File(
                [blob],
                `orcamento-${String(estimate.number).padStart(3, '0')}.pdf`,
                { type: 'application/pdf' },
            );
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
    return (
        <>
            <Head title={`Orçamento #${estimate.number}`} />
            <div className="mb-5 flex items-start justify-between">
                <div>
                    <p className="text-sm font-semibold text-orange-700">
                        ORÇAMENTO
                    </p>
                    <h1 className="text-3xl font-bold">
                        #{String(estimate.number).padStart(3, '0')}
                    </h1>
                </div>
                <Link
                    href={`/estimates/${estimate.id}/edit`}
                    aria-label="Editar orçamento"
                    className="flex size-11 items-center justify-center rounded-xl border border-stone-300 text-stone-700"
                >
                    <Pencil />
                </Link>
            </div>
            <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
                <div>
                    <p className="text-sm text-stone-500">Cliente</p>
                    <p className="font-bold">{estimate.customer.name}</p>
                    <p className="text-sm text-stone-500">
                        {estimate.customer.phone}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-stone-500">Veículo</p>
                    <p className="font-bold">{estimate.vehicle.model}</p>
                    <p className="text-sm text-stone-500">
                        {estimate.vehicle.plate || 'Sem placa'}
                        {estimate.vehicle.color
                            ? ` · ${estimate.vehicle.color}`
                            : ''}
                    </p>
                </div>
                <p className="text-sm text-stone-500">
                    Data: {formatDate(estimate.date)}
                </p>
            </div>
            <section className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
                <h2 className="border-b border-stone-100 p-4 text-lg font-bold">
                    Itens
                </h2>
                {estimate.items.map((item) => (
                    <div
                        key={item.id}
                        className="flex justify-between gap-4 border-b border-stone-100 p-4"
                    >
                        <p>{item.description}</p>
                        <p className="font-semibold whitespace-nowrap">
                            {formatCurrency(item.amount)}
                        </p>
                    </div>
                ))}
                <div className="flex justify-between p-4 text-lg font-bold">
                    <p>TOTAL</p>
                    <p>{formatCurrency(estimate.total)}</p>
                </div>
            </section>
            {estimate.notes && (
                <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5">
                    <h2 className="mb-2 font-bold">Observações</h2>
                    <p className="whitespace-pre-line text-stone-600">
                        {estimate.notes}
                    </p>
                </section>
            )}
            <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                    disabled={pdfAction !== null}
                    onClick={share}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 font-bold text-white disabled:opacity-60"
                >
                    {pdfAction === 'share' ? (
                        <LoaderCircle className="size-5 animate-spin" />
                    ) : (
                        <Share2 className="size-5" />
                    )}
                    {pdfAction === 'share' ? 'Gerando PDF...' : 'Compartilhar'}
                </button>
                <button
                    disabled={pdfAction !== null}
                    onClick={download}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 font-bold disabled:opacity-60"
                >
                    {pdfAction === 'download' ? (
                        <LoaderCircle className="size-5 animate-spin" />
                    ) : (
                        <Download className="size-5" />
                    )}
                    {pdfAction === 'download' ? 'Gerando PDF...' : 'Baixar PDF'}
                </button>
            </div>
        </>
    );
}
