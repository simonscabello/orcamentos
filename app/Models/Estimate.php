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

    protected $fillable = ['business_id', 'customer_id', 'vehicle_id', 'number', 'status', 'notes', 'total', 'date', 'valid_until', 'insurer_name', 'claim_number', 'deductible', 'discount_type', 'discount_value', 'discount_amount'];

    /** A cópia interna do conteúdo não vai para as páginas. */
    protected $hidden = ['content_snapshot'];

    protected function casts(): array
    {
        return ['content_snapshot' => 'array', 'version' => 'integer', 'date' => 'date:Y-m-d', 'valid_until' => 'date:Y-m-d', 'total' => 'integer', 'deductible' => 'integer', 'discount_value' => 'integer', 'discount_amount' => 'integer'];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(EstimateVersion::class)->orderBy('version');
    }

    public function items(): HasMany
    {
        return $this->hasMany(EstimateItem::class)->orderBy('id');
    }
}
