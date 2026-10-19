<?php

namespace App\Support;

/**
 * Busca "contém", sem diferenciar maiúsculas, tratando `%` e `_` como texto.
 *
 * Compara a coluna com dois padrões: o termo em `mb_strtolower` (para "JOÃO"
 * encontrar "João" no PostgreSQL) e o termo em `strtolower`, que só baixa ASCII
 * e casa com o `lower()` do sqlite em nomes gravados em maiúsculas com acento.
 */
class SearchTerm
{
    public static function sql(string $column): string
    {
        return "(lower({$column}) like ? escape '\\' or lower({$column}) like ? escape '\\')";
    }

    /**
     * @return array{0: string, 1: string}
     */
    public static function bindings(string $term): array
    {
        return [self::pattern(mb_strtolower($term)), self::pattern(strtolower($term))];
    }

    private static function pattern(string $term): string
    {
        return '%'.addcslashes($term, '\\%_').'%';
    }
}
