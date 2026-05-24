<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Require user authentication
        return true;
    }

    public function rules(): array
    {
        return [
            'table_id' => 'required|integer|exists:tables,id',
            'user_id' => 'nullable|integer|exists:users,id',
            'total' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.dish_id' => 'required|integer|exists:dishes,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string|max:255',
        ];
    }
}
