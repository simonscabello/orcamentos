<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('plate')->nullable();
            $table->string('model');
            $table->string('color')->nullable();
            $table->timestamps();
            $table->index(['business_id', 'customer_id']);
            $table->index(['business_id', 'plate']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
