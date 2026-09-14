<?php

namespace App\Http\Requests;

use App\Models\Vehicle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EstimateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->where('business_id', $this->user()->business_id)],
            'vehicle_id' => ['required', 'integer', Rule::exists('vehicles', 'id')->where('business_id', $this->user()->business_id)],
            'date' => ['required', 'date'],
            'status' => ['required', Rule::in(['draft', 'sent'])],
            'notes' => ['nullable', 'string', 'max:4000'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.amount' => ['required', 'integer', 'min:1', 'max:999999999'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if (! $this->filled('vehicle_id') || ! $this->filled('customer_id')) {
                return;
            }
            $vehicle = Vehicle::forBusiness($this->user()->business_id)->find($this->integer('vehicle_id'));
            if ($vehicle && $vehicle->customer_id !== $this->integer('customer_id')) {
                $validator->errors()->add('vehicle_id', 'O veículo deve pertencer ao cliente selecionado.');
            }
        }];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Selecione um cliente.',
            'customer_id.exists' => 'Selecione um cliente válido.',
            'vehicle_id.required' => 'Selecione um veículo.',
            'vehicle_id.exists' => 'Selecione um veículo válido.',
            'date.required' => 'Informe a data do orçamento.',
            'date.date' => 'Informe uma data válida.',
            'status.in' => 'Selecione um status válido.',
            'notes.max' => 'As observações são muito longas.',
            'items.required' => 'Adicione pelo menos um item.',
            'items.array' => 'Adicione itens válidos ao orçamento.',
            'items.min' => 'Adicione pelo menos um item.',
            'items.max' => 'O orçamento não pode ter mais de 100 itens.',
            'items.*.description.required' => 'Informe a descrição do item.',
            'items.*.description.max' => 'A descrição do item é muito longa.',
            'items.*.amount.required' => 'Informe o valor do item.',
            'items.*.amount.integer' => 'Informe um valor válido para o item.',
            'items.*.amount.min' => 'O valor do item deve ser maior que zero.',
            'items.*.amount.max' => 'O valor do item é muito alto.',
        ];
    }
}
