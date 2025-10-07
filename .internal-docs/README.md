# Documentación Interna - No Entregar

Esta carpeta contiene documentación y notas internas del proyecto que **NO deben incluirse en la entrega académica**.

## Contenido

### Planificación y Roadmap
- **RECOMENDACIONES.md** - Recomendaciones de mejoras futuras para el sistema
- **MEJORAS_PENDIENTES.md** - Lista detallada de TODOs y mejoras pendientes por prioridad

### Documentación de Desarrollo
- **README_SCRIPTS.md** - Documentación detallada de los scripts (redundante con README.md)
- **SCRIPTS.md** - Otra versión de documentación de scripts (redundante)
- **CHANGELOG_SEGURIDAD.md** - Log de cambios de seguridad implementados

### Guías Internas
- **GUIA_ENTREGA_ACADEMICA.md** - Guía de qué archivos incluir en la entrega

## Propósito

Estos archivos son útiles para:
- Desarrollo futuro del proyecto
- Notas personales
- Planificación de mejoras
- Historial de decisiones técnicas

Pero NO son apropiados para entregar en un proyecto académico porque:
- Son notas internas de desarrollo
- Muestran trabajo "incompleto" o "pendiente"
- No aportan al funcionamiento del sistema actual
- Pueden confundir en una evaluación académica

## Para Entrega Académica

Solo se deben entregar los archivos que están en el repositorio Git:

```bash
# Ver archivos a entregar
git ls-files
```

Documentación incluida en la entrega:
- README.md
- docs/API.md
- docs/DATABASE.md
- docs/SEGURIDAD.md

## Nota

Esta carpeta está en `.gitignore`, por lo que:
- NO se sube a GitHub
- NO se incluye en exports con `git archive`
- Solo existe en tu computadora local

Si necesitas estos archivos en el futuro, están aquí respaldados.
