<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use BelongsToBusiness, HasFactory;

    protected $fillable = ['business_id', 'name', 'phone'];

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    public function estimates(): HasMany
    {
        return $this->hasMany(Estimate::class);
    }
}
