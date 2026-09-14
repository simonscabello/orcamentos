export const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(cents / 100);

export const formatDate = (date?: string | null) => {
    const match = date?.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (!match) return '';

    const [, year, month, day] = match;

    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
        new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))),
    );
};

export const moneyToCents = (value: string) => {
    const normalized = value.replace(/R\$|\s/g, '');

    if (!normalized) return 0;

    const hasComma = normalized.includes(',');
    const decimalSeparator = hasComma
        ? ','
        : normalized.includes('.')
          ? '.'
          : null;

    if (!decimalSeparator) return Number(normalized.replace(/\D/g, '')) * 100;

    const [whole, decimal = ''] = normalized.split(decimalSeparator);
    const cents = decimal.padEnd(2, '0').slice(0, 2);

    return Number(whole.replace(/\D/g, '') || '0') * 100 + Number(cents);
};

export const centsToInput = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
