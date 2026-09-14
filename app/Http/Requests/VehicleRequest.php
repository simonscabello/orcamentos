<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
