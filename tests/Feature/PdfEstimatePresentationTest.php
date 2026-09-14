<?php

use App\Models\Business;
use App\Models\Customer;
use App\Models\Estimate;
use App\Models\EstimateItem;
use App\Models\Vehicle;

function estimateForPdf(?string $plate = 'QAF5G33', ?string $notes = 'Prazo de validade: 7 dias.'): Estimate
{
    $estimate = new Estimate([
        'number' => 1,
        'total' => 1234567,
        'date' => '2026-09-14',
    ]);

    $estimate->setRelation('business', new Business([
        'name' => 'Oficina André Kar',
        'phone' => '27997168860',
        'document' => '23682756000128',
        'address' => 'Rua Campina Grande, 39 - Barcelona, Serra - ES',
    ]));
    $estimate->setRelation('customer', new Customer(['name' => 'Simão José']));
    $estimate->setRelation('vehicle', new Vehicle(['model' => 'Toyota Prius', 'plate' => $plate]));
    $estimate->setRelation('items', collect([
        new EstimateItem(['description' => 'Funelaria Porta Direita', 'amount' => 25000]),
        new EstimateItem(['description' => 'Recuperação Porta-Malas', 'amount' => 55000]),
        new EstimateItem(['description' => 'Mão de Obra', 'amount' => 1169567]),
    ]));
    $estimate->notes = $notes;

    return $estimate;
}

it('renders formatted company, estimate, monetary, date and accented data in the PDF view', function () {
    $html = view('pdf.estimate', ['estimate' => estimateForPdf()])->render();

    expect($html)->toContain('Oficina André Kar')
        ->toContain('Telefone:</span> (27) 99716-8860')
        ->toContain('CNPJ:</span> 23.682.756/0001-28')
        ->toContain('Rua Campina Grande, 39 - Barcelona, Serra - ES')
        ->toContain('ORÇAMENTO Nº 001')
        ->toContain('Cliente:</span> Simão José')
        ->toContain('Veículo:</span> Toyota Prius')
        ->toContain('Placa:</span> QAF5G33')
        ->toContain('Data:</span> 14/09/2026')
        ->toContain('Recuperação Porta-Malas')
        ->toContain('R$ 12.345,67')
        ->toContain('Observações')
        ->toContain('Prazo de validade: 7 dias.');
});

it('omits empty plate and observations from the PDF view', function () {
    $html = view('pdf.estimate', ['estimate' => estimateForPdf(null, null)])->render();

    expect($html)->not->toContain('Placa:')
        ->not->toContain('Observações');
});
