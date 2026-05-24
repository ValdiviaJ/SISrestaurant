#!/bin/sh
set -e

echo "Esperando a que la base de datos este lista..."
php -r "
\$dbReady = false;
for (\$i = 0; \$i < 30; \$i++) {
    try {
        \$host = getenv('DB_HOST');
        \$port = getenv('DB_PORT') ?: '5432';
        \$dbname = getenv('DB_DATABASE');
        \$user = getenv('DB_USERNAME');
        \$pass = getenv('DB_PASSWORD');
        \$pdo = new PDO('pgsql:host=' . \$host . ';port=' . \$port . ';dbname=' . \$dbname, \$user, \$pass);
        \$dbReady = true;
        break;
    } catch (Exception \$e) {
        echo 'Intento ' . (\$i + 1) . ': Base de datos no disponible. Reintentando en 3 segundos...\n';
        sleep(3);
    }
}
if (!\$dbReady) {
    echo 'No se pudo conectar a la base de datos. Saliendo...\n';
    exit(1);
}
"

echo "Ejecutando php artisan migrate --force..."
php artisan migrate --force

echo "Arrancando FrankenPHP..."
exec frankenphp run --config /app/Caddyfile
