<?php

namespace App\Http\Requests;

use App\Models\Vehicle;
use App\Support\EstimateTotals;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'valid_until' => ['nullable', 'date', 'after_or_equal:date'],
            'insurer_name' => ['nullable', 'string', 'max:120'],
            'claim_number' => ['nullable', 'string', 'max:60'],
            // integer:strict: o front envia números; texto que ele não conseguiu converter (ex.: "+100") é recusado.
            'deductible' => ['nullable', 'integer:strict', 'min:0', 'max:999999999'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.type' => ['nullable', Rule::in(['part', 'labor'])],
            'items.*.quantity' => ['nullable', 'required_with:items.*.unit_amount', 'integer:strict', 'min:1', 'max:999'],
            'items.*.unit_amount' => ['nullable', 'required_with:items.*.quantity', 'integer:strict', 'min:1', 'max:999999999'],
            // Com quantidade × unitário o valor do item é recalculado no servidor.
            'items.*.amount' => ['nullable', 'required_without:items.*.unit_amount', 'integer', 'min:1', 'max:999999999'],
            'discount_type' => ['nullable', Rule::in([EstimateTotals::DISCOUNT_FIXED, EstimateTotals::DISCOUNT_PERCENT])],
            'discount_value' => ['nullable', 'required_with:discount_type', 'integer:strict', 'min:1'],
        ];
    }

    public function after(): array
    {
        return [$this->validateTotals(...), function ($validator): void {
            if (! $this->filled('vehicle_id') || ! $this->filled('customer_id')) {
                return;
            }
            $vehicle = Vehicle::forBusiness($this->user()->business_id)->find($this->integer('vehicle_id'));
            if ($vehicle && $vehicle->customer_id !== $this->integer('customer_id')) {
                $validator->errors()->add('vehicle_id', 'O veículo deve pertencer ao cliente selecionado.');
            }
        }];
    }

    /**
     * Confere o valor de cada item com quantidade e o desconto contra o subtotal calculado.
     */
    private function validateTotals(Validator $validator): void
    {
        if ($validator->errors()->isNotEmpty()) {
            return;
        }

        $totals = EstimateTotals::calculate($this->input('items'));

        foreach ($totals['items'] as $index => $item) {
            if ($item['amount'] > 999999999) {
                $validator->errors()->add("items.{$index}.unit_amount", 'O valor total do item é muito alto.');
            }
        }

        $discountValue = $this->integer('discount_value');

        if ($this->input('discount_type') === EstimateTotals::DISCOUNT_PERCENT && $discountValue > 10000) {
            $validator->errors()->add('discount_value', 'O desconto não pode passar de 100%.');
        }

        if ($this->input('discount_type') === EstimateTotals::DISCOUNT_FIXED && $discountValue > $totals['subtotal']) {
            $validator->errors()->add('discount_value', 'O desconto não pode ser maior que o subtotal.');
        }
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
            'valid_until.date' => 'Informe uma data de validade válida.',
            'valid_until.after_or_equal' => 'A validade não pode ser anterior à data do orçamento.',
            'insurer_name.max' => 'O nome da seguradora é muito longo.',
            'claim_number.max' => 'O número do sinistro é muito longo.',
            'deductible.integer' => 'Informe um valor de franquia válido.',
            'deductible.min' => 'A franquia não pode ser negativa.',
            'deductible.max' => 'O valor da franquia é muito alto.',
            'items.required' => 'Adicione pelo menos um item.',
            'items.array' => 'Adicione itens válidos ao orçamento.',
            'items.min' => 'Adicione pelo menos um item.',
            'items.max' => 'O orçamento não pode ter mais de 100 itens.',
            'items.*.description.required' => 'Informe a descrição do item.',
            'items.*.description.max' => 'A descrição do item é muito longa.',
            'items.*.amount.required_without' => 'Informe o valor do item.',
            'items.*.amount.integer' => 'Informe um valor válido para o item.',
            'items.*.amount.min' => 'O valor do item deve ser maior que zero.',
            'items.*.amount.max' => 'O valor do item é muito alto.',
            'items.*.type.in' => 'Selecione um tipo de item válido.',
            'items.*.quantity.required_with' => 'Informe a quantidade.',
            'items.*.quantity.integer' => 'A quantidade deve ser um número inteiro.',
            'items.*.quantity.min' => 'A quantidade deve ser pelo menos 1.',
            'items.*.quantity.max' => 'A quantidade é muito alta.',
            'items.*.unit_amount.required_with' => 'Informe o valor unitário.',
            'items.*.unit_amount.integer' => 'Informe um valor unitário válido.',
            'items.*.unit_amount.min' => 'O valor unitário deve ser maior que zero.',
            'items.*.unit_amount.max' => 'O valor unitário é muito alto.',
            'discount_type.in' => 'Selecione um tipo de desconto válido.',
            'discount_value.required_with' => 'Informe o valor do desconto.',
            'discount_value.integer' => 'Informe um desconto válido.',
            'discount_value.min' => 'O desconto deve ser maior que zero.',
        ];
    }
}
