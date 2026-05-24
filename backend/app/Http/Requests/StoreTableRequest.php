<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'number' => 'required|integer|unique:tables,number',
            'capacity' => 'required|integer|min:1',
            'status' => 'nullable|string|in:free,busy,reserved',
        ];
    }
}
