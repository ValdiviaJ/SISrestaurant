# 🚀 Guía de Inicio Rápido - RestoSuite

Esta guía detalla los pasos sencillos para instalar, configurar y levantar **RestoSuite** (Sistema de Gestión de Restaurantes) en cualquier computadora nueva (desarrollo local).

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu sistema:
1. **Docker Desktop** (con soporte para Docker Compose): [Descargar aquí](https://www.docker.com/products/docker-desktop/)
2. **Node.js** (versión LTS recomendada, 18 o superior): [Descargar aquí](https://nodejs.org/)

---

## 🛠️ Paso a Paso para Levantar el Proyecto

Sigue estos pasos ordenadamente para poner en marcha el sistema:

### Paso 1: Preparar los Archivos de Entorno (`.env`)

Tanto el backend como el frontend requieren archivos de configuración de entorno. Si los archivos `.env` no están presentes en las carpetas correspondientes, debes crearlos a partir de los ejemplos:

* **Backend (`/backend`):**
  Duplica o renombra `/backend/.env.example` como `/backend/.env`
  *(Las credenciales predeterminadas ya vienen listas para conectar con Docker).*

* **Frontend (`/frontend`):**
  Asegúrate de tener un archivo `/frontend/.env` o `/frontend/.env.development` con la siguiente variable que apunta a la API de Docker:
  ```env
  VITE_API_URL=http://localhost:8000/api
  ```

---

### Paso 2: Ajustar el Volumen de la Base de Datos

En el archivo `docker-compose.yml` de la raíz del proyecto, la base de datos está configurada para conectarse a un volumen externo existente en la máquina de desarrollo original. 

Para levantar el proyecto de forma limpia en una computadora nueva, abre el archivo `docker-compose.yml` (en la raíz) con un editor de código, desplázate hasta la última sección y **reemplaza las últimas líneas**:

```yaml
# ❌ CONFIGURACIÓN ORIGINAL (Para máquina anterior):
volumes:
  restosuite-db-data:
    external: true
    name: backend_restosuite-db-data
```

por la siguiente configuración estándar:

```yaml
#  CONFIGURACIÓN PARA COMPUTADORA NUEVA (Crea base de datos nueva):
volumes:
  restosuite-db-data:
    driver: local
```

---

### Paso 3: Encender los Contenedores (Backend, DB y Redis)

Abre una terminal o consola en la **raíz del proyecto** (donde se encuentra el archivo `docker-compose.yml`) y ejecuta el siguiente comando:

```bash
docker compose up -d --build
```

Esto descargará las imágenes necesarias, construirá el contenedor de la API de Laravel y levantará los 5 servicios en segundo plano:
* `restosuite-web` (Nginx - Puerto 8000)
* `restosuite-api` (PHP-FPM)
* `restosuite-db` (PostgreSQL - Puerto 5432)
* `restosuite-redis` (Redis - Puerto 6379)
* `restosuite-queue` (Cola de Trabajo de Laravel)

---

### Paso 4: Inicializar la Base de Datos

Una vez que los contenedores estén corriendo (`Up`), ejecuta las siguientes tareas administrativas dentro del contenedor de la API para crear las tablas y poblar el sistema con datos de prueba (roles, usuarios, platos y mesas preconfiguradas):

1. **Generar la clave de encriptación de la aplicación:**
   ```bash
   docker compose exec app php artisan key:generate
   ```
2. **Crear el enlace simbólico para imágenes de platos:**
   ```bash
   docker compose exec app php artisan storage:link
   ```
3. **Ejecutar migraciones y semilleros iniciales:**
   ```bash
   docker compose exec app php artisan migrate --force
   docker compose exec app php artisan db:seed --force
   ```

---

### Paso 5: Levantar la Aplicación Cliente (Frontend)

El frontend está desarrollado en React con TypeScript y se ejecuta localmente.

1. Abre una nueva terminal y navega a la carpeta `/frontend`:
   ```bash
   cd frontend
   ```
2. Instala los paquetes y dependencias de la aplicación:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```

La terminal te indicará la URL para abrir el sistema en tu navegador (usualmente [http://localhost:5173/](http://localhost:5173/)).

---

## 🔑 Credenciales de Acceso al Sistema

Una vez levantado el sistema, puedes iniciar sesión utilizando las siguientes cuentas de prueba creadas automáticamente por el semillero:

* **Administrador (Acceso total, reportes, gestión de personal):**
  * **Email:** `admin@restosuite.com`
  * **Password:** `password`

* **Mesero / Mozo (Toma de pedidos, salón de mesas):**
  * **Email:** `mozo@restosuite.com`
  * **Password:** `password`

* **Cajero (Cuentas, cobros en efectivo/tarjeta/yape, POS):**
  * **Email:** `cajero@restosuite.com`
  * **Password:** `password`

* **Cocina (Monitor de pedidos, preparación y despacho):**
  * **Email:** `cocina@restosuite.com`
  * **Password:** `password`

> 📄 *Para más detalles sobre los roles de seguridad y buenas prácticas de credenciales, puedes consultar el archivo [credenciales.md].*

---

## 🌐 Enlaces de Acceso Local

* **Frontend App:** [http://localhost:5173/](http://localhost:5173/)
* **Backend API (Estado del Servidor):** [http://localhost:8000/](http://localhost:8000/)
* **Base de Datos PostgreSQL:** Puerto `5432` | User: `restosuite_user` | DB: `restosuite_db` | Pass: `restosuite_password`
