<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'owner_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'document' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Informe o nome da oficina.',
            'name.max' => 'O nome da oficina é muito longo.',
            'owner_name.max' => 'O nome do responsável é muito longo.',
            'phone.max' => 'O telefone informado é muito longo.',
            'document.max' => 'O CPF/CNPJ informado é muito longo.',
            'address.max' => 'O endereço informado é muito longo.',
        ];
    }
}
