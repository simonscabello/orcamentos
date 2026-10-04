import { toast } from 'sonner';

/**
 * Leva o usuário até o primeiro campo com erro depois de uma validação do
 * servidor. Em formulários longos (como o de orçamento) o erro pode estar
 * fora da tela, atrás do rodapé fixo.
 */
export function focusFirstError(errors: Record<string, string>): void {
    const count = Object.keys(errors).length;

    if (!count) return;

    toast.error(
        count === 1
            ? 'Revise o campo destacado para continuar.'
            : `Revise os ${count} campos destacados para continuar.`,
    );

    // Espera o React renderizar as mensagens de erro antes de procurar o campo.
    requestAnimationFrame(() => {
        const field = document.querySelector<HTMLElement>(
            '[aria-invalid="true"]',
        );

        field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        field?.focus({ preventScroll: true });
    });
}
