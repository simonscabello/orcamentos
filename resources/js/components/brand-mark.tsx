import type { SVGAttributes } from 'react';

/**
 * Símbolo do produto: um check que sobe, sugerindo orçamento aprovado.
 * Desenhado com currentColor para funcionar sobre qualquer fundo.
 * A versão completa (símbolo + nome) está em public/brand/.
 */
export function BrandMark(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            <path
                d="M4.75 12.4 10 17.65 19.4 6.6"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
