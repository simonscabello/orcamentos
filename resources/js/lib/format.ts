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

/**
 * Converte o valor digitado em centavos.
 *
 * Trata o padrão brasileiro: a vírgula é sempre decimal e o ponto é separador
 * de milhar quando os grupos têm três dígitos (1.200 = mil e duzentos reais).
 * Um único ponto seguido de um ou dois dígitos ainda é aceito como decimal
 * (10.5 = dez reais e cinquenta centavos).
 */
export const moneyToCents = (value: string) => {
    const normalized = value.replace(/R\$|\s|\u00a0/g, '');

    if (!normalized) return 0;

    const toCents = (whole: string, decimal: string) =>
        Number(whole.replace(/\D/g, '') || '0') * 100 +
        Number(decimal.padEnd(2, '0').slice(0, 2));

    if (normalized.includes(',')) {
        const [whole, decimal = ''] = normalized.split(',');

        return toCents(whole, decimal.replace(/\D/g, ''));
    }

    const groups = normalized.split('.');

    if (groups.length === 1) {
        return Number(normalized.replace(/\D/g, '')) * 100;
    }

    const last = groups[groups.length - 1].replace(/\D/g, '');
    const looksLikeThousands = groups
        .slice(1)
        .every((group) => group.replace(/\D/g, '').length === 3);

    if (looksLikeThousands) {
        return Number(normalized.replace(/\D/g, '')) * 100;
    }

    return toCents(groups.slice(0, -1).join(''), last);
};

export const centsToInput = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export const formatEstimateNumber = (number: number) =>
    `#${String(number).padStart(3, '0')}`;

export const greeting = (date = new Date()) => {
    const hour = date.getHours();

    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';

    return 'Boa noite';
};

export const firstName = (name?: string | null) =>
    name?.trim().split(/\s+/)[0] ?? '';

/** Formata telefones brasileiros; devolve o valor original quando não reconhece. */
export const formatPhone = (phone?: string | null) => {
    const digits = phone?.replace(/\D/g, '') ?? '';

    if (digits.length === 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return phone ?? '';
};
