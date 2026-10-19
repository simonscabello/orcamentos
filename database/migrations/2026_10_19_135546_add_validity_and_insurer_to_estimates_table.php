<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Validade e dados de seguradora, todos opcionais: só aparecem no PDF quando preenchidos.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estimates', function (Blueprint $table) {
            $table->date('valid_until')->nullable()->after('date');
            $table->string('insurer_name', 120)->nullable()->after('valid_until');
            $table->string('claim_number', 60)->nullable()->after('insurer_name');
            $table->unsignedBigInteger('deductible')->nullable()->after('claim_number');
        });
    }

    public function down(): void
    {
        Schema::table('estimates', function (Blueprint $table) {
            $table->dropColumn(['valid_until', 'insurer_name', 'claim_number', 'deductible']);
        });
    }
};
