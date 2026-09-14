<?php

namespace App\Support;

use DateTimeInterface;

final class BrazilianFormat
{
    public static function formatPhone(?string $value): ?string
    {
        $digits = self::digits($value);

        return match (strlen($digits)) {
            11 => sprintf('(%s) %s-%s', substr($digits, 0, 2), substr($digits, 2, 5), substr($digits, 7, 4)),
            10 => sprintf('(%s) %s-%s', substr($digits, 0, 2), substr($digits, 2, 4), substr($digits, 6, 4)),
            default => $digits ?: null,
        };
    }

    public static function formatCpf(?string $value): ?string
    {
        $digits = self::digits($value);

        if (strlen($digits) !== 11) {
            return $digits ?: null;
        }

        return sprintf('%s.%s.%s-%s', substr($digits, 0, 3), substr($digits, 3, 3), substr($digits, 6, 3), substr($digits, 9, 2));
    }

    public static function formatCnpj(?string $value): ?string
    {
        $digits = self::digits($value);

        if (strlen($digits) !== 14) {
            return $digits ?: null;
        }

        return sprintf('%s.%s.%s/%s-%s', substr($digits, 0, 2), substr($digits, 2, 3), substr($digits, 5, 3), substr($digits, 8, 4), substr($digits, 12, 2));
    }

    public static function formatDocument(?string $value): ?string
    {
        return match (strlen(self::digits($value))) {
            11 => self::formatCpf($value),
            14 => self::formatCnpj($value),
            default => self::digits($value) ?: null,
        };
    }

    public static function documentLabel(?string $value): ?string
    {
        return match (strlen(self::digits($value))) {
            11 => 'CPF',
            14 => 'CNPJ',
            default => null,
        };
    }

    public static function formatCurrency(int $cents): string
    {
        $negative = $cents < 0;
        $absolute = abs($cents);
        $whole = intdiv($absolute, 100);
        $fraction = $absolute % 100;

        return sprintf('%sR$ %s,%02d', $negative ? '-' : '', number_format($whole, 0, ',', '.'), $fraction);
    }

    public static function formatDate(?DateTimeInterface $date): ?string
    {
        return $date?->format('d/m/Y');
    }

    private static function digits(?string $value): string
    {
        return preg_replace('/\D+/', '', $value ?? '') ?? '';
    }
}
