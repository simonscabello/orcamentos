<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstimateVersion extends Model
{
    protected $fillable = ['estimate_id', 'version', 'total', 'snapshot'];

    protected function casts(): array
    {
        return ['version' => 'integer', 'total' => 'integer', 'snapshot' => 'array'];
    }

    public function estimate(): BelongsTo
    {
        return $this->belongsTo(Estimate::class);
    }
}
