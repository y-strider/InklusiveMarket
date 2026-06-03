<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
$table->id();
$table->foreignId('order_id')->constrained()->cascadeOnDelete();
$table->string('provider')->default('paymongo');
$table->string('payment_id')->nullable();
$table->string('method')->nullable();
$table->decimal('amount', 10, 2)->default(0);
$table->enum('status', ['pending','paid','failed','refunded'])->default('pending');
$table->json('raw')->nullable();
$table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
