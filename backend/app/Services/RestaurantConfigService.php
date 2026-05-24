<?php

namespace App\Services;

use App\Repositories\Contracts\RestaurantConfigRepositoryInterface;
use Illuminate\Support\Facades\DB;

class RestaurantConfigService extends BaseService
{
    protected RestaurantConfigRepositoryInterface $configRepository;

    public function __construct(RestaurantConfigRepositoryInterface $configRepository)
    {
        $this->configRepository = $configRepository;
    }

    /**
     * Retrieve all configurations structured as key-value pairs formatted for the frontend.
     */
    public function getSettings(): array
    {
        $configs = $this->configRepository->getAllConfigs();
        $settings = [];
        foreach ($configs as $config) {
            $settings[$config->key] = $config->value;
        }

        return [
            'name' => $settings['restaurant_name'] ?? 'RestoSuite',
            'ruc' => $settings['ruc'] ?? '',
            'address' => $settings['address'] ?? '',
            'phone' => $settings['phone'] ?? '',
            'tax_rate' => isset($settings['tax_percentage']) ? (float)$settings['tax_percentage'] : 18.0,
            'currency' => $settings['currency_code'] ?? 'PEN',
            'currency_symbol' => $settings['currency_symbol'] ?? 'S/',
        ];
    }

    /**
     * Update restaurant configuration values dynamically in a transaction.
     */
    public function updateSettings(array $data): array
    {
        return DB::transaction(function () use ($data) {
            if (isset($data['name'])) {
                $this->configRepository->setConfig('restaurant_name', $data['name']);
            }
            if (isset($data['ruc'])) {
                $this->configRepository->setConfig('ruc', $data['ruc']);
            }
            if (isset($data['address'])) {
                $this->configRepository->setConfig('address', $data['address']);
            }
            if (isset($data['phone'])) {
                $this->configRepository->setConfig('phone', $data['phone']);
            }
            if (isset($data['tax_rate'])) {
                $this->configRepository->setConfig('tax_percentage', (string)$data['tax_rate']);
            }
            if (isset($data['currency'])) {
                $this->configRepository->setConfig('currency_code', $data['currency']);
                
                // Automatically derive appropriate currency symbol
                $symbol = 'S/';
                switch ($data['currency']) {
                    case 'USD':
                        $symbol = '$';
                        break;
                    case 'EUR':
                        $symbol = '€';
                        break;
                    case 'COP':
                    case 'MXN':
                        $symbol = '$';
                        break;
                }
                $this->configRepository->setConfig('currency_symbol', $symbol);
            }

            return $this->getSettings();
        });
    }
}
