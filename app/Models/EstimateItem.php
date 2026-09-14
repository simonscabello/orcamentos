<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstimateItem extends Model
{
    use HasFactory;

    protected $fillable = ['description', 'amount'];

    public function estimate(): BelongsTo
    {
        return $this->belongsTo(Estimate::class);
    }
}
