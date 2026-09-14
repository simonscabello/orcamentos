<?php

use App\Support\BrazilianFormat;
use Carbon\CarbonImmutable;

it('formats Brazilian mobile and landline phones', function () {
    expect(BrazilianFormat::formatPhone('27 99716-8860'))->toBe('(27) 99716-8860')
        ->and(BrazilianFormat::formatPhone('2733211234'))->toBe('(27) 3321-1234');
});

it('handles empty and unexpected phone values safely', function () {
    expect(BrazilianFormat::formatPhone(null))->toBeNull()
        ->and(BrazilianFormat::formatPhone('telefone'))->toBeNull()
        ->and(BrazilianFormat::formatPhone('123'))->toBe('123');
});

it('formats CPF and CNPJ documents', function () {
    expect(BrazilianFormat::formatCpf('12345678900'))->toBe('123.456.789-00')
        ->and(BrazilianFormat::formatCnpj('23682756000128'))->toBe('23.682.756/0001-28')
        ->and(BrazilianFormat::formatDocument('12345678900'))->toBe('123.456.789-00')
        ->and(BrazilianFormat::formatDocument('23682756000128'))->toBe('23.682.756/0001-28');
});

it('handles an empty document and formats Brazilian currency and dates', function () {
    expect(BrazilianFormat::formatDocument(null))->toBeNull()
        ->and(BrazilianFormat::documentLabel('12345678900'))->toBe('CPF')
        ->and(BrazilianFormat::documentLabel('23682756000128'))->toBe('CNPJ')
        ->and(BrazilianFormat::formatCurrency(25000))->toBe('R$ 250,00')
        ->and(BrazilianFormat::formatCurrency(323000))->toBe('R$ 3.230,00')
        ->and(BrazilianFormat::formatCurrency(1234567))->toBe('R$ 12.345,67')
        ->and(BrazilianFormat::formatDate(CarbonImmutable::parse('2026-09-14')))->toBe('14/09/2026');
});
