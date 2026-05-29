# Torneo del Respeto - Portal de Estadísticas

Este es un portal web estático y responsivo para el registro, visualización y análisis de estadísticas de un torneo semanal de juegos de peleas. Funciona completamente en el navegador (costo de mantenimiento de $0) y se alimenta de archivos JSON locales.

## Características Principales

*   **Resumen**: Panel principal con métricas rápidas del torneo (total de ediciones, total de participantes, combates realizados, líder histórico) y desglose de la última edición.
*   **Clasificación**: Tabla de posiciones acumulada con soporte para filtrado por juego (por defecto Dragon Ball FighterZ), barra de búsqueda de jugadores y ordenamiento dinámico por columnas.
*   **Head-to-Head (H2H)**: Calculadora de enfrentamientos directos entre cualquier par de jugadores. Muestra el porcentaje de victorias, rounds ganados, personajes favoritos de cada uno y el historial completo de sus combates.
*   **Torneos**: Selector lateral cronológico de ediciones con detalle del juego, fecha, modalidad, lista de participantes, podio de ganadores y el registro de combates por rondas.
*   **Palmarés**: Salón de la fama que muestra a los jugadores ordenados por cantidad de podios obtenidos (1º, 2º y 3º lugar) y una línea de tiempo cronológica de campeones.
*   **Administrador**: Panel de herramientas para generar nuevos reportes de torneos de forma visual. Permite registrar participantes, combates con sus respectivos marcadores y personajes, y configurar los ganadores del podio para luego exportar el archivo JSON final.

## Arquitectura del Proyecto

La aplicación utiliza tecnologías web estándar modernas sin dependencias externas:

*   **HTML5**: Estructura semántica completa.
*   **CSS3**: Estilizado avanzado organizado mediante Cascade Layers (`@layer reset, base, layout, components, utilities`), uso del espacio de color `oklch()` de alta gama para contraste óptimo y un diseño visual con efectos de Glassmorphism (diseño elegante basado en tonos carbón y dorado).
*   **JavaScript (ES6 Modules)**: Código desacoplado en módulos especializados para facilitar su mantenimiento:
    *   `app.js`: Punto de entrada de la aplicación. Inicializa los módulos y arranca la carga asíncrona de datos en el evento `DOMContentLoaded`.
    *   `state.js`: Gestiona el estado global de la aplicación y la descarga concurrente de los archivos JSON de datos.
    *   `theme.js`: Sincroniza y alterna el tema de color entre modo claro, oscuro y el predeterminado del sistema.
    *   `stats.js`: Motor de cálculos estadísticos (puntos de liga, métricas de victorias/derrotas, H2H y palmarés).
    *   `ui.js`: Controla el enrutamiento de pestañas, el menú responsivo lateral y el renderizado dinámico de los datos en el DOM.
    *   `admin.js`: Controla la interfaz y validaciones del formulario generador de JSON.

## Estructura de Datos (JSON)

Los datos se dividen en dos niveles dentro del directorio `/data`:

1.  **Índice de Torneos (`/data/tournaments.json`)**:
    Contiene un arreglo con los metadatos básicos de cada torneo realizado. Sirve como registro de carga para la aplicación.
    ```json
    [
      {
        "id": "torneo_1",
        "filename": "torneo_1.json",
        "name": "Torneo Respeto #1",
        "date": "2026-05-15",
        "mode": "Equipos Fijos",
        "game": "Dragon Ball FighterZ"
      }
    ]
    ```

2.  **Detalles de Edición (`/data/tournaments/torneo_X.json`)**:
    Contiene la información detallada de los combates, participantes y standings del torneo específico.
    ```json
    {
      "id": "torneo_1",
      "name": "Torneo Respeto #1",
      "date": "2026-05-15",
      "mode": "Equipos Fijos",
      "game": "Dragon Ball FighterZ",
      "participants": ["Diego", "Darlyn", "Pedro"],
      "matches": [
        {
          "round": "Final",
          "p1": "Diego",
          "p2": "Darlyn",
          "score1": 3,
          "score2": 1,
          "chars1": "UI Goku, Vegito Blue, Bardock",
          "chars2": "Cooler, Janemba, Zamasu Fusion"
        }
      ],
      "standings": [
        {"rank": 1, "player": "Diego"},
        {"rank": 2, "player": "Darlyn"},
        {"rank": 3, "player": "Pedro"}
      ]
    }
    ```

## Cómo Ejecutar el Proyecto en Local

Debido a que la aplicación carga datos dinámicamente mediante peticiones `fetch()`, las políticas de seguridad de los navegadores (CORS) impedirán su correcto funcionamiento si el archivo `index.html` se abre directamente haciendo doble clic (con el protocolo `file://`).

Es necesario servir los archivos a través de un servidor HTTP local. Puedes usar cualquiera de las siguientes opciones desde la terminal en el directorio raíz del proyecto:

### Opción 1: Python (Recomendado si ya está instalado)
```bash
python3 -m http.server 8000
```
Luego abre `http://localhost:8000` en tu navegador.

### Opción 2: Node.js (npx)
```bash
npx http-server -p 8000
```
Luego abre `http://localhost:8000` en tu navegador.

## Cómo Agregar un Nuevo Torneo

1.  Accede a la pestaña **Administrador** en el portal web.
2.  Ingresa los datos generales del torneo (ID, Nombre, Fecha, Modalidad y Juego).
3.  Escribe el nombre de los participantes y agrégalos uno a uno en la sección de la lista.
4.  Registra los combates seleccionando a los peleadores, ingresando sus marcadores y los personajes que usaron.
5.  En la lista de podio, selecciona los jugadores que ocuparon el 1º, 2º y 3º puesto. Las posiciones del 4º puesto en adelante se calculan automáticamente sin necesidad de registro explícito.
6.  Presiona el botón de **Generar JSON**.
7.  Usa el botón de descargar para obtener el archivo (por ejemplo, `torneo_3.json`) y guárdalo dentro de la carpeta `/data/tournaments/`.
8.  Copia el fragmento de metadatos generado en el cuadro de texto inferior y pégalo como un nuevo elemento dentro del archivo `/data/tournaments.json`.
9.  Recarga el portal web y las estadísticas globales se actualizarán de forma inmediata.
