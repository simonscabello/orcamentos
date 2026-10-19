import { isMoneyInput, moneyToCents } from '@/lib/format';

/**
 * Espelho do cálculo do servidor (App\Support\EstimateTotals), só para mostrar
 * os valores ao vivo. O servidor recalcula tudo ao salvar.
 */
export type ItemType = '' | 'part' | 'labor';
export type DiscountType = '' | 'fixed' | 'percent';

export type ItemInput = {
    amount: string;
    detailed: boolean;
    quantity: string;
    unit_amount: string;
};

export const itemTypeLabels: Record<Exclude<ItemType, ''>, string> = {
    labor: 'Mão de obra',
    part: 'Peça',
};

export const isQuantityInput = (value: string) =>
    /^\d{1,3}$/.test(value.trim()) && Number(value) >= 1;

export const itemCents = (item: ItemInput) =>
    item.detailed
        ? isQuantityInput(item.quantity)
            ? Number(item.quantity) * moneyToCents(item.unit_amount)
            : 0
        : moneyToCents(item.amount);

/** Desconto em centavos; o percentual vem digitado como "5,5" e vale 550 centésimos de ponto. */
export const discountCents = (
    subtotal: number,
    type: DiscountType,
    value: string,
) => {
    if (!type || !isMoneyInput(value)) return 0;

    const discount = moneyToCents(value);

    return type === 'fixed'
        ? discount
        : Math.floor((subtotal * discount + 5000) / 10000);
};
