FROM dunglas/frankenphp:1.1-php8.2-alpine

# Instalar extensiones de PHP requeridas por Laravel, PostgreSQL y Redis
RUN install-php-extensions pdo_pgsql pgsql redis bcmath xml zip pcntl opcache gd

# Definir el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar el código del backend al contenedor
COPY . /app

# Ajustar variables de entorno para que Composer se ejecute correctamente
ENV COMPOSER_ALLOW_SUPERUSER=1
ENV SERVER_ROOT=public/

# Instalar dependencias de producción de Composer
RUN composer install --no-dev --optimize-autoloader

# Configurar permisos correctos para Laravel
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache && \
    chmod -R 775 /app/storage /app/bootstrap/cache

# Puerto expuesto por defecto en la imagen de FrankenPHP
EXPOSE 80
EXPOSE 443
EXPOSE 10000
