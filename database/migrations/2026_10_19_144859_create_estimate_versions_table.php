<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Versões do orçamento: ao editar um orçamento já enviado, o estado anterior é
 * guardado como cópia (snapshot) para saber o que o cliente recebeu em cada versão.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estimates', function (Blueprint $table) {
            $table->unsignedInteger('version')->default(1)->after('number');
            // Conteúdo da última gravação/envio: vira a versão anterior quando o orçamento enviado é editado.
            $table->json('content_snapshot')->nullable();
        });

        Schema::create('estimate_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estimate_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->unsignedBigInteger('total');
            $table->json('snapshot');
            $table->timestamps();
            $table->unique(['estimate_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estimate_versions');

        Schema::table('estimates', function (Blueprint $table) {
            $table->dropColumn(['version', 'content_snapshot']);
        });
    }
};
