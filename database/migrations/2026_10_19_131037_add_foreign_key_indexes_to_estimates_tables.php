<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * O PostgreSQL não cria índice para chave estrangeira. Sem estes índices, abrir,
 * editar ou gerar o PDF de um orçamento, as sugestões de itens e a ficha do
 * cliente varriam as tabelas inteiras (de todas as oficinas).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estimate_items', function (Blueprint $table) {
            $table->index('estimate_id');
        });

        Schema::table('estimates', function (Blueprint $table) {
            $table->index('vehicle_id');
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::table('estimate_items', function (Blueprint $table) {
            $table->dropIndex(['estimate_id']);
        });

        Schema::table('estimates', function (Blueprint $table) {
            $table->dropIndex(['vehicle_id']);
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropIndex(['customer_id']);
        });
    }
};
