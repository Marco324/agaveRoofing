# Revisión de interfaz — AgaveAlerta

Esta copia usa **agaveRoofing-main nueva.zip** como base. El avance visual anterior se integró sobre las interfaces actuales; la API y los modelos, servicios y presenters de las apps se conservaron. La comprobación de 55 archivos funcionales contra el ZIP está en `verificacion-base.json`.

## Cambios

- Panel: navegación más legible, visitas en filas con horario y cliente en primer plano, bandeja de atención desplegable, indicadores agrupados y formularios con etiquetas visibles.
- Cliente: fecha y horario como referencia principal, mapa real conservado, acciones de confirmación y presencia según el estado de la visita, historial y formularios más uniformes.
- Inspector: tarjetas centradas en la siguiente acción, contacto y referencias desplegables, calendario semanal conservado, acceso a mapas, resultado, ausencia y modo demo.
- Identidad: logo y colores esmeralda, turquesa y pizarra conservados. Superficies claras, bordes suaves y colores de alerta reservados para situaciones que requieren atención.
- Pulido final: botones secundarios discretos, etiquetas breves, estados y avisos legibles, diálogos y reportes uniformes, selector con fecha y hora completas y evidencia fotográfica más sobria. Se mantiene la distribución de las pantallas y sus acciones.
- Accesibilidad: controles de al menos 40 px en el panel y 44–48 px en Flutter, foco visible, navegación entre pestañas con flechas y foco contenido en los diálogos.

## Ejecutar

Desde la carpeta principal:

```powershell
npm install
npm run build:ui
npm run preview
```

La vista previa usa la base independiente `data/vista-previa.db` y fija el día de negocio en **12 de noviembre de 2026**, para poder recorrer las citas de demostración. Si la base no existe, la crea con las cuentas y citas de la demo. No vuelve a sembrar una base existente.

- Panel: http://localhost:3010/?api=http://localhost:4010/api
- Cliente: http://localhost:3011/
- Inspector: http://localhost:3012/

Para actualizar las vistas web de las apps, ejecutar en cada carpeta:

```powershell
flutter pub get
flutter build web --no-pub --release --dart-define=API_URL=http://localhost:4010/api
```

En esta computadora, Flutter está en `C:\Users\jesus\flutter\bin`. Windows informa que los plugins de escritorio necesitan enlaces simbólicos; las compilaciones web se generaron usando `--no-pub` después de resolver las dependencias. No se cambiaron los ajustes de Windows.

Las cuentas son las documentadas en el README principal. Para revisar rápidamente: administrador `marco.admin@agaveroofing.com`, cliente `2105550455` e inspector `carlos.garza@agaveroofing.com`; contraseña de demostración `Agave2026`.

## Verificación

```powershell
npm test
npm run test:ui
cd app-cliente
flutter analyze --no-pub
flutter test --no-pub
cd ../app-inspector
flutter analyze --no-pub
flutter test --no-pub
```

Las siete suites de la API usan una base temporal. Las pruebas del panel también arrancan una API y una base independientes. Las pruebas Flutter cubren acciones por estado, acceso, visitas pendientes de cierre y calendario a 320, 375 y 430 px. Las compilaciones web permiten revisar los mismos widgets de las apps en el navegador; la cámara y la ubicación física requieren una prueba en dispositivo.

Las capturas de revisión están en `capturas/`. Las del panel se pueden regenerar con `node scripts/capture-review.mjs` mientras la vista previa está funcionando. Las de las apps se tomaron en las compilaciones Flutter web.
