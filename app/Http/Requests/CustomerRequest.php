<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:255'], 'phone' => ['nullable', 'string', 'max:40']];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Informe o nome do cliente.',
            'name.max' => 'O nome do cliente é muito longo.',
            'phone.max' => 'O telefone informado é muito longo.',
        ];
    }
}
