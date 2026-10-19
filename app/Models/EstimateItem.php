<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstimateItem extends Model
{
    use HasFactory;

    protected $fillable = ['description', 'type', 'quantity', 'unit_amount', 'amount'];

    protected function casts(): array
    {
        return ['quantity' => 'integer', 'unit_amount' => 'integer', 'amount' => 'integer'];
    }

    public function estimate(): BelongsTo
    {
        return $this->belongsTo(Estimate::class);
    }
}
