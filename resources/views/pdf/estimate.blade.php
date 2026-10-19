<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 42px 46px; }
        body { color: #1f2937; font-family: DejaVu Sans, sans-serif; font-size: 10.5px; line-height: 1.5; }
        .business-header { border-bottom: 2px solid #1f2937; margin-bottom: 22px; padding-bottom: 16px; }
        .business-name { color: #111827; font-size: 20px; font-weight: bold; line-height: 1.2; margin: 0 0 8px; }
        .business-detail { margin: 2px 0; }
        .estimate-title { color: #111827; font-size: 15px; font-weight: bold; letter-spacing: .3px; margin: 0 0 18px; }
        .details { margin-bottom: 22px; }
        .detail { margin: 2px 0; }
        .label { font-weight: bold; }
        table { border-collapse: collapse; width: 100%; }
        thead th { border-bottom: 1px solid #9ca3af; color: #4b5563; font-size: 10px; font-weight: bold; padding: 8px 0; text-align: left; }
        tbody td { border-bottom: 1px solid #e5e7eb; padding: 10px 0; vertical-align: top; }
        tr { page-break-inside: avoid; }
        .description { padding-right: 18px; word-wrap: break-word; }
        .amount { text-align: right; white-space: nowrap; }
        tfoot { page-break-inside: avoid; }
        .item-meta { color: #6b7280; font-size: 9.5px; }
        .summary-row td { color: #4b5563; padding: 4px 0; }
        .total-row td { border-top: 2px solid #374151; color: #111827; font-size: 14px; font-weight: bold; padding-top: 12px; }
        .notes { margin-top: 26px; page-break-inside: avoid; }
        .notes-title { font-size: 11px; font-weight: bold; margin: 0 0 5px; }
        .notes-content { margin: 0; white-space: pre-line; }
    </style>
</head>
<body>
    @php
        $phone = \App\Support\BrazilianFormat::formatPhone($estimate->business->phone);
        $document = \App\Support\BrazilianFormat::formatDocument($estimate->business->document);
        $documentLabel = \App\Support\BrazilianFormat::documentLabel($estimate->business->document);
        $typeLabels = ['part' => 'Peça', 'labor' => 'Mão de obra'];
        $typedTotals = collect($typeLabels)
            ->map(fn ($label, $type) => $estimate->items->where('type', $type)->sum('amount'))
            ->filter();
        $subtotal = $estimate->total + (int) $estimate->discount_amount;
    @endphp

    <header class="business-header">
        <p class="business-name">{{ $estimate->business->name }}</p>
        @if ($phone)
            <p class="business-detail"><span class="label">Telefone:</span> {{ $phone }}</p>
        @endif
        @if ($document)
            <p class="business-detail"><span class="label">{{ $documentLabel ?? 'Documento' }}:</span> {{ $document }}</p>
        @endif
        @if ($estimate->business->address)
            <p class="business-detail">{{ $estimate->business->address }}</p>
        @endif
    </header>

    <h1 class="estimate-title">ORÇAMENTO Nº {{ str_pad((string) $estimate->number, 3, '0', STR_PAD_LEFT) }}@if ($estimate->version > 1) · VERSÃO {{ $estimate->version }}@endif</h1>

    <section class="details">
        <p class="detail"><span class="label">Cliente:</span> {{ $estimate->customer->name }}</p>
        <p class="detail"><span class="label">Veículo:</span> {{ $estimate->vehicle->model }}</p>
        @if ($estimate->vehicle->plate)
            <p class="detail"><span class="label">Placa:</span> {{ $estimate->vehicle->plate }}</p>
        @endif
        <p class="detail"><span class="label">Data:</span> {{ \App\Support\BrazilianFormat::formatDate($estimate->date) }}</p>
        @if ($estimate->valid_until)
            <p class="detail"><span class="label">Válido até:</span> {{ \App\Support\BrazilianFormat::formatDate($estimate->valid_until) }}</p>
        @endif
    </section>

    @if (filled($estimate->insurer_name) || filled($estimate->claim_number) || $estimate->deductible !== null)
        <section class="details">
            @if (filled($estimate->insurer_name))
                <p class="detail"><span class="label">Seguradora:</span> {{ $estimate->insurer_name }}</p>
            @endif
            @if (filled($estimate->claim_number))
                <p class="detail"><span class="label">Sinistro:</span> {{ $estimate->claim_number }}</p>
            @endif
            @if ($estimate->deductible !== null)
                <p class="detail"><span class="label">Franquia:</span> {{ \App\Support\BrazilianFormat::formatCurrency($estimate->deductible) }}</p>
            @endif
        </section>
    @endif

    <table>
        <thead>
            <tr>
                <th>Descrição</th>
                <th class="amount">Valor</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($estimate->items as $item)
                <tr>
                    <td class="description">
                        {{ $item->description }}
                        @if ($item->type || $item->quantity !== null)
                            <br><span class="item-meta">{{ collect([
                                $typeLabels[$item->type] ?? null,
                                $item->quantity !== null ? $item->quantity.' × '.\App\Support\BrazilianFormat::formatCurrency($item->unit_amount) : null,
                            ])->filter()->implode(' · ') }}</span>
                        @endif
                    </td>
                    <td class="amount">{{ \App\Support\BrazilianFormat::formatCurrency($item->amount) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            @if ($typedTotals->isNotEmpty())
                @foreach ($typedTotals as $type => $amount)
                    <tr class="summary-row">
                        <td>{{ $type === 'part' ? 'Peças' : 'Mão de obra' }}</td>
                        <td class="amount">{{ \App\Support\BrazilianFormat::formatCurrency($amount) }}</td>
                    </tr>
                @endforeach
            @endif
            @if ($estimate->discount_amount > 0)
                <tr class="summary-row">
                    <td>Subtotal</td>
                    <td class="amount">{{ \App\Support\BrazilianFormat::formatCurrency($subtotal) }}</td>
                </tr>
                <tr class="summary-row">
                    <td>Desconto{{ $estimate->discount_type === 'percent' ? ' ('.rtrim(rtrim(number_format($estimate->discount_value / 100, 2, ',', '.'), '0'), ',').'%)' : '' }}</td>
                    <td class="amount">− {{ \App\Support\BrazilianFormat::formatCurrency($estimate->discount_amount) }}</td>
                </tr>
            @endif
            <tr class="total-row">
                <td>TOTAL</td>
                <td class="amount">{{ \App\Support\BrazilianFormat::formatCurrency($estimate->total) }}</td>
            </tr>
        </tfoot>
    </table>

    @if ($estimate->notes)
        <section class="notes">
            <p class="notes-title">Observações</p>
            <p class="notes-content">{{ $estimate->notes }}</p>
        </section>
    @endif
</body>
</html>
