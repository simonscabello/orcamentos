<?php

namespace App\Support;

use App\Models\Vehicle;
use Illuminate\Validation\ValidationException;

/**
 * Garante, dentro da transação, que o veículo do orçamento é do cliente escolhido.
 *
 * Trava a linha do veículo: assim a gravação de um orçamento e a troca de dono do
 * mesmo veículo (VehicleController@update) não se intercalam.
 */
class VehicleOwnership
{
    public const OWNER_LOCKED_MESSAGE = 'Este veículo já tem orçamentos com outro cliente. Para o novo dono, cadastre o veículo de novo.';

    public static function lockAndCheck(int $businessId, int|string $vehicleId, int|string $customerId): void
    {
        $vehicle = Vehicle::forBusiness($businessId)->lockForUpdate()->findOrFail($vehicleId);

        if ($vehicle->customer_id !== (int) $customerId) {
            throw ValidationException::withMessages(['vehicle_id' => 'O veículo deve pertencer ao cliente selecionado.']);
        }
    }
}
