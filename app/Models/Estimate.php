<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Estimate extends Model
{
    use BelongsToBusiness, HasFactory;

    protected $fillable = ['business_id', 'customer_id', 'vehicle_id', 'number', 'status', 'notes', 'total', 'date'];

    protected function casts(): array
    {
        return ['date' => 'date:Y-m-d', 'total' => 'integer'];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(EstimateItem::class);
    }
}
