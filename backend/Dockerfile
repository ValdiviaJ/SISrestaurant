FROM dunglas/frankenphp:1.1-php8.2-alpine

# Instalar extensiones de PHP requeridas por Laravel, PostgreSQL y Redis
RUN install-php-extensions pdo_pgsql pgsql redis bcmath xml zip pcntl opcache gd

# Copiar Composer desde la imagen oficial
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Definir el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar el código del backend al contenedor
COPY . /app

# Ajustar variables de entorno para que Composer se ejecute correctamente
ENV COMPOSER_ALLOW_SUPERUSER=1
ENV SERVER_ROOT=public/

# Instalar dependencias de producción de Composer optimizando memoria y descarga
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-progress

# Configurar permisos correctos para Laravel
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache && \
    chmod -R 775 /app/storage /app/bootstrap/cache

# Eliminar privilegios de puertos bajos de frankenphp para evitar error "Operation not permitted" en Render
RUN setcap -r /usr/local/bin/frankenphp

# Puerto expuesto por defecto en la imagen de FrankenPHP
EXPOSE 80
EXPOSE 443
EXPOSE 10000

# Hacer el entrypoint ejecutable
RUN chmod +x /app/entrypoint.sh

# Configurar el comando de inicio ejecutándolo directamente con /bin/sh
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
