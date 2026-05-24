#!/bin/sh
set -e

# Ejecutar las migraciones de la base de datos en producción
echo "Ejecutando php artisan migrate --force..."
php artisan migrate --force

# Arrancar el servidor web FrankenPHP
echo "Arrancando FrankenPHP..."
exec frankenphp run --config /etc/caddy/Caddyfile
