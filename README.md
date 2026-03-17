# MediApp - Prototipo Web

Este proyecto es una maqueta (mockup) en HTML5 y CSS3 para **MediApp (Expirapp)**, una plataforma web destinada a conectar personas con tiendas y supermercados para encontrar grandes ofertas en productos cercanos a su fecha de vencimiento.

## Vistas Implementadas

El prototipo consta actualmente de las siguientes pantallas:

1. **[Inicio de Sesión (`index.html`)](index.html):** Pantalla principal de acceso para los usuarios existentes.
2. **[Registro de Usuarios (`registro.html`)](registro.html):** Vista dividida mediante pestañas que permite a los nuevos usuarios registrarse como "Persona" o como "Tienda", mostrando campos específicos para cada rol.
3. **[Página Principal / Home (`home.html`)](home.html):** Tablero principal donde los usuarios pueden buscar, filtrar y encontrar los productos disponibles en oferta. Cuenta con una grilla de tarjetas de productos responsiva.
4. **[Perfil de Persona (`perfil-persona.html`)](perfil-persona.html):** Vista donde un comprador puede gestionar su información personal, dirección de entrega y seguridad de su cuenta.
5. **[Perfil de Tienda (`perfil-tienda.html`)](perfil-tienda.html):** Panel donde los negocios pueden administrar los datos públicos de su tienda y las configuraciones de seguridad.

## Tecnologías Usadas

Para mantener la ligereza y asegurar que el código sea fácil de integrar posteriormente en cualquier framework de JavaScript (React, Vue, Angular), este prototipo fue creado utilizando:

*   **HTML5 Semántico:** Garantizando la accesibilidad y correcta estructura de la información.
*   **CSS3 (Vanilla):** Sin depender de frameworks externos para los estilos.
    *   Uso intensivo de **Flexbox** y **CSS Grid** para la disposición de los elementos.
    *   Diseño **Responsivo** (Mobile First) que adapta la UI a dispositivos móviles, tablets y escritorios mediante Media Queries.
    *   Uso de **Variables CSS** (Custom Properties) para definir la paleta de colores global y facilitar futuros cambios en el tema.
*   **Íconos SVG Inline:** Íconos vectoriales incrustados directamente en el código para evitar peticiones HTTP adicionales y garantizar la máxima nitidez.
*   **Tipografía Moderna:** Integración de la fuente *Inter* de Google Fonts para un aspecto limpio y actual.

## Paleta de Colores Principal

*   **Color Primario (Acento):** `#2de07b` (Verde vibrante)
*   **Texto Principal:** `#111827` (Gris casi negro)
*   **Texto Secundario (Muted):** `#6b7280` (Gris medio)
*   **Fondo Principal:** `#ffffff` (Blanco)
*   **Fondo Secundario (Paneles/Body):** `#f8f9fa` (Gris muy claro)

## Sugerencias de Integración Futura

Esta estructura es ideal como punto de partida visual. Sin embargo, para escalar este proyecto hacia una aplicación dinámica completa, se recomienda:

1.  **Modularización:** Separar componentes de la UI (Navbar, Footer, ProductCard) en componentes reutilizables utilizando el framework elegido para el Frontend.
2.  **Lógica Externa:** Mover el pequeño script de alternancia de roles (Persona/Tienda) incluido en `registro.html` a su propio archivo o incluirlo como estado dinámico (`useState`, `reactive`) de la aplicación real.
3.  **Procesamiento de Estilos:** Dividir las (actualmente extensas) utilidades de `styles.css` en módulos independientes (Ej: `_navbar.css`, `_forms.css`) si el proyecto sigue creciendo en escala sin usar un preprocesador o frameworks como Tailwind.

## Contribuciones

Para probar la interfaz, simplemente clona o descarga el repositorio y abre cualquiera de los archivos `.html` (empezando preferiblemente por `index.html`) en el navegador de tu preferencia. No se requieren instalaciones de librerías ni dependencias para visualizar la maqueta.
