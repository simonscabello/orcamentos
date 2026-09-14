<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estimates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('vehicle_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('number');
            $table->string('status')->default('draft');
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('total')->default(0);
            $table->date('date');
            $table->timestamps();
            $table->unique(['business_id', 'number']);
            $table->index(['business_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estimates');
    }
};
