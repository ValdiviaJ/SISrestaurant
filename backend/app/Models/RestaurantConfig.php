<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RestaurantConfig extends Model
{
    use HasFactory;

    protected $table = 'restaurant_configs';

    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * Helper to get configuration values quickly.
     */
    public static function getVal(string $key, $default = null)
    {
        $config = self::where('key', $key)->first();
        return $config ? $config->value : $default;
    }

    /**
     * Helper to set configuration values quickly.
     */
    public static function setVal(string $key, $value): self
    {
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }
}
