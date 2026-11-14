<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            // Every task has exactly one owner; deleting a user removes their tasks.
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 150);
            $table->text('description')->nullable();
            // ENUM makes MySQL itself reject any value outside the allowed list.
            $table->enum('status', ['Pending', 'In Progress', 'Completed'])->default('Pending');
            $table->enum('priority', ['Low', 'Medium', 'High'])->default('Medium');
            $table->date('due_date')->nullable();
            $table->timestamps();

            // Dashboard query: "tasks of user X, optionally with status Y".
            $table->index(['user_id', 'status']);
            // Title search.
            $table->index('title');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
