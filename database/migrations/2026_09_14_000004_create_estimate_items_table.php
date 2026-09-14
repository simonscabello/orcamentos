<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estimate_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estimate_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->unsignedBigInteger('amount');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estimate_items');
    }
};
