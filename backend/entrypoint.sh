#!/bin/sh
set -e

echo 'Ejecutando php artisan migrate --force...'
php artisan migrate --force

echo 'Arrancando FrankenPHP...'
exec frankenphp run --config /etc/caddy/Caddyfile
