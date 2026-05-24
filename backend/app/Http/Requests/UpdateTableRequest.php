<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tableId = $this->route('table');

        return [
            'number' => 'sometimes|required|integer|unique:tables,number,' . $tableId,
            'capacity' => 'sometimes|required|integer|min:1',
            'status' => 'sometimes|required|string|in:free,busy,reserved',
        ];
    }
}
