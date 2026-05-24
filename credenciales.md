# Credenciales de Acceso - RestoSuite

Este archivo contiene las credenciales de prueba preestablecidas para los diferentes roles de usuario en el sistema, junto con una explicación de sus funciones y cómo usarlos.

---

## 🔑 Cuentas por Defecto

> [!IMPORTANT]
> Para todas las cuentas de prueba creadas por defecto, la contraseña es: **`password`**

| Rol | Correo Electrónico | Contraseña | Vista / Módulo Principal |
| :--- | :--- | :--- | :--- |
| **👑 Administrador** | `admin@restosuite.com` | `password` | `/dashboard` (Dashboard & Configuración) |
| **💵 Cajero (POS)** | `cajero@restosuite.com` | `password` | `/dashboard` (Módulo POS / Caja) |
| **🏃‍♂️ Mozo (Atención)** | `mozo@restosuite.com` | `password` | `/tables` (Vista de Mesas y Pedidos) |
| **🍳 Cocina (KDS)** | `cocina@restosuite.com` | `password` | `/kitchen` (Pantalla de Cocina) |

---

## 📘 Funcionamiento y Uso de Roles

### 1. Administrador (`admin@restosuite.com`)
* **Propósito:** Supervisión general, analítica y configuraciones del restaurante.
* **Qué puede hacer:**
  * **Dashboard:** Visualizar las métricas generales en tiempo real (Ingresos del día, Pedidos activos, Ticket promedio, etc.).
  * **Reportes:** Ver reportes detallados y descargar el PDF de balance de ventas.
  * **Usuarios:** Crear, editar y eliminar usuarios asignándoles roles (Administrador, Mozo, Cajero, Cocina).
  * **Configuración:** Cambiar datos de la empresa (Nombre del restaurante, RUC, Dirección, Teléfono, IGV e incluso el tipo y símbolo de moneda).

### 2. Cajero (`cajero@restosuite.com`)
* **Propósito:** Gestión de la facturación y cobro de pedidos en el punto de venta.
* **Qué puede hacer:**
  * **POS (Punto de Venta):** Visualizar las mesas activas con pedidos pendientes de cobro.
  * **Cobrar:** Registrar el método de pago del cliente (Efectivo, Tarjeta, Yape/Plin, etc.) y emitir el ticket.
  * **Pedidos:** Ver el historial de órdenes del día.

### 3. Mozo (`mozo@restosuite.com`)
* **Propósito:** Servicio al cliente en mesas y registro rápido de comandas.
* **Qué puede hacer:**
  * **Mesas:** Ver el plano del salón con el estado de las mesas en tiempo real (Libre, Ocupada, Esperando comida).
  * **Tomar Pedido:** Seleccionar una mesa, elegir los platos clasificados por categorías (Entradas, Platos de Fondo, Bebidas, etc.) e ingresar notas o especificaciones (ej. *"sin cebolla"*).
  * **Enviar a Cocina:** Una vez confirmado, el pedido se envía automáticamente a la pantalla de cocina.

### 4. Cocina (`cocina@restosuite.com`)
* **Propósito:** Sistema de Exhibición de Cocina (KDS) para agilizar la preparación de platos.
* **Qué puede hacer:**
  * **Cola de Preparación:** Recibir al instante las comandas tomadas por los mozos en forma de tarjetas ordenadas por tiempo de espera.
  * **Estados de Platos:** Marcar un pedido "En preparación" cuando empiece a cocinarse y luego "Listo" cuando esté listo para que el mozo lo lleve a la mesa.

---

## 🔒 Recomendación de Seguridad para Producción
En un entorno real de producción, te sugerimos seguir estos pasos:
1. Iniciar sesión como **Administrador** (`admin@restosuite.com`).
2. Ir a **Configuración** $\rightarrow$ **Usuarios**.
3. Cambiar el correo y la contraseña por defecto de la cuenta del administrador.
4. Crear cuentas personalizadas con contraseñas fuertes para cada empleado del restaurante y desactivar/eliminar las cuentas genéricas de prueba (`mozo@restosuite.com`, etc.).
