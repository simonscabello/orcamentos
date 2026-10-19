<?php

namespace App\Support;

/**
 * Monta o padrão de busca "contém" usado com `lower(coluna) like ? escape '\'`.
 *
 * Usa `mb_strtolower` para que "JOÃO" encontre "João" e escapa `%` e `_`
 * para que o que a pessoa digitou seja tratado como texto, não como curinga.
 */
class SearchTerm
{
    public const LIKE_SQL = "lower(%s) like ? escape '\\'";

    public static function pattern(string $term): string
    {
        return '%'.addcslashes(mb_strtolower($term), '\\%_').'%';
    }

    public static function sql(string $column): string
    {
        return sprintf(self::LIKE_SQL, $column);
    }
}
