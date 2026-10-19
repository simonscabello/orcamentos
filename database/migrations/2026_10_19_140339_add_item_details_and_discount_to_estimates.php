<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Itens com tipo (peça ou mão de obra) e quantidade × valor unitário, e desconto
 * no orçamento. Tudo opcional: orçamentos existentes continuam com itens manuais
 * e desconto zero, e o `total` mantém o significado de valor a pagar.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estimate_items', function (Blueprint $table) {
            $table->string('type', 10)->nullable()->after('description');
            $table->unsignedInteger('quantity')->nullable()->after('type');
            $table->unsignedBigInteger('unit_amount')->nullable()->after('quantity');
        });

        Schema::table('estimates', function (Blueprint $table) {
            $table->string('discount_type', 10)->nullable()->after('total');
            $table->unsignedBigInteger('discount_value')->nullable()->after('discount_type');
            $table->unsignedBigInteger('discount_amount')->default(0)->after('discount_value');
        });
    }

    public function down(): void
    {
        Schema::table('estimate_items', function (Blueprint $table) {
            $table->dropColumn(['type', 'quantity', 'unit_amount']);
        });

        Schema::table('estimates', function (Blueprint $table) {
            $table->dropColumn(['discount_type', 'discount_value', 'discount_amount']);
        });
    }
};
