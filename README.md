# Sistema de Gestión de Unidades de Autobús

Una aplicación web moderna para gestionar el estado de mantenimiento de unidades de autobús.

## Características

- ✅ Gestión de unidades de autobús con componentes mecánicos
- ✅ Estados: Listo (verde) / Taller (rojo)
- ✅ Eliminación solo disponible cuando todos los componentes están listos
- ✅ Persistencia de datos en archivo JSON
- ✅ Interfaz responsive para móvil y escritorio
- ✅ Exportación a CSV
- ✅ Búsqueda y filtrado

## Componentes Monitoreados

- MOT (Motor)
- TRAN (Transmisión)
- ELE (Eléctrico)
- AA (Aire Acondicionado)
- FRE (Frenos)
- SUS (Suspensión)
- DIR (Dirección)
- HOJ (Hojalatería)
- TEL (Telecomunicaciones)

## Instalación

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Iniciar la aplicación: `npm run dev`

## Persistencia de Datos

Los datos se almacenan automáticamente en `data/busUnits.json` y persisten entre reinicios de la aplicación.

## Despliegue en GitHub

1. Hacer commit de todos los cambios
2. Push al repositorio de GitHub
3. Los datos se mantendrán en el archivo JSON incluido en el repositorio

## Estructura de Datos

```json
{
  "units": [
    {
      "id": 1,
      "unitNumber": 3500,
      "MOT": "listo",
      "TRAN": "listo",
      "ELE": "taller",
      ...
    }
  ],
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```