<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    use BelongsToBusiness, HasFactory;

    protected $fillable = ['business_id', 'customer_id', 'plate', 'model', 'color'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** Placa só com letras e números, em maiúsculas: "abc-1234" e "ABC1234" são a mesma. */
    public static function normalizePlate(?string $plate): string
    {
        return preg_replace('/[^A-Z0-9]/', '', strtoupper((string) $plate));
    }

    public function estimates(): HasMany
    {
        return $this->hasMany(Estimate::class);
    }
}
