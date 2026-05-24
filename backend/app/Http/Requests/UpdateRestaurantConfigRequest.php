<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRestaurantConfigRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'ruc' => 'sometimes|nullable|string|max:50',
            'address' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:50',
            'tax_rate' => 'sometimes|required|numeric|min:0|max:100',
            'currency' => 'sometimes|required|string|in:PEN,USD,EUR,COP,MXN',
        ];
    }
}
