<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vehicle extends Model
{
    use BelongsToBusiness, HasFactory;

    protected $fillable = ['business_id', 'customer_id', 'plate', 'model', 'color'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
