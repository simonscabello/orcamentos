<?php

namespace App\Http\Requests;

use App\Models\Vehicle;
use App\Support\VehicleOwnership;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class VehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->where('business_id', $this->user()->business_id)],
            'model' => ['required', 'string', 'max:255'],
            'plate' => ['nullable', 'string', 'max:16'],
            'color' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * Um veículo com orçamentos não muda de dono: os orçamentos antigos ficariam com o cliente errado.
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $vehicle = $this->route('vehicle')
                ? Vehicle::forBusiness($this->user()->business_id)->find($this->route('vehicle'))
                : null;

            if ($vehicle && $this->filled('customer_id') && $vehicle->customer_id !== $this->integer('customer_id') && $vehicle->estimates()->exists()) {
                $validator->errors()->add('customer_id', VehicleOwnership::OWNER_LOCKED_MESSAGE);
            }
        }];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Selecione um cliente.',
            'customer_id.exists' => 'Selecione um cliente válido.',
            'model.required' => 'Informe o modelo do veículo.',
            'model.max' => 'O modelo do veículo é muito longo.',
            'plate.max' => 'A placa informada é muito longa.',
            'color.max' => 'A cor informada é muito longa.',
        ];
    }
}
