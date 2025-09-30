
# PPIV - El Quinto Elemento

## Descripción del Proyecto

Sistema de gestión para la Cooperativa Eléctrica "Gobernador Ugarte" desarrollado como proyecto final de la tecnicatura. Este sistema cuenta con tres perfiles de usuario: Cliente, Operario y Administrativo, cada uno con funcionalidades específicas para la gestión de servicios eléctricos, facturación, reclamos y operaciones técnicas.

El proyecto está basado en prototipos de Figma que incluyen:
- **Cliente**: Login, dashboard, gestión de facturas, reclamos y pagos
- **Operario**: Gestión de órdenes asignadas, seguimiento de reclamos y carga de insumos
- **Administrativo**: Planificación de itinerarios, ABM de clientes y métricas del sistema

## Tecnologías Utilizadas

### Core Framework
- **React 18.3.1** - Librería principal para la interfaz de usuario
- **TypeScript** - Tipado estático para JavaScript
- **Vite 6.3.5** - Build tool y desarrollo con React SWC

### UI Framework y Componentes
- **Radix UI** - Sistema completo de componentes accesibles:
  - Accordion, Alert Dialog, Avatar, Calendar, Card
  - Checkbox, Dialog, Dropdown Menu, Form, Input
  - Navigation Menu, Popover, Progress, Select
  - Tabs, Tooltip, y más componentes primitivos
- **Tailwind CSS v4.1.3** - Framework de CSS utilitario
- **Shadcn/ui** - Componentes pre-construidos basados en Radix UI

### Librerías de UI Adicionales
- **Lucide React 0.487.0** - Iconografía
- **Class Variance Authority 0.7.1** - Gestión de variantes de componentes
- **clsx & tailwind-merge** - Utilidades para clases CSS
- **Recharts 2.15.2** - Gráficos y visualización de datos (variables CSS preparadas)
- **Sonner 2.0.3** - Sistema de notificaciones toast

### Funcionalidades Especializadas
- **Next Themes 0.4.6** - Preparado para gestión de temas (modo oscuro/claro)

### Componentes UI Disponibles (no utilizados en App principal)
- **React Hook Form 7.55.0** - Gestión de formularios
- **React Day Picker 8.10.1** - Selector de fechas
- **Input OTP 1.4.2** - Campos de entrada para códigos OTP
- **CMDK 1.1.1** - Command palette y búsqueda
- **Embla Carousel React 8.6.0** - Componente de carrusel
- **React Resizable Panels 2.1.7** - Paneles redimensionables
- **Vaul 1.1.2** - Drawer/modal components

### Herramientas de Desarrollo
- **@vitejs/plugin-react-swc** - Plugin de Vite con SWC para mejor performance
- **@types/node** - Tipos de TypeScript para Node.js

## Estructura del Proyecto

- `src/components/ui/` - Componentes de interfaz reutilizables
- `src/components/figma/` - Componentes específicos del diseño de Figma
- `src/styles/` - Estilos globales y configuración de CSS
- `src/guidelines/` - Documentación y guidelines del proyecto

## Instalación y Ejecución

```bash
# Instalar dependencias
npm i

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

## Características del Sistema

- **Multi-perfil**: Interfaz adaptada para Cliente, Operario y Administrativo
- **Diseño Responsive**: Componentes optimizados para desktop y mobile
- **Accesibilidad**: Componentes Radix UI con soporte completo de accesibilidad
- **Theming**: Preparado para modo claro y oscuro (no implementado completamente)
- **Componentes Reutilizables**: Biblioteca completa de componentes UI
- **Gestión de Estado**: React hooks para manejo de estado local
- **Preparado para Visualización**: Variables CSS configuradas para gráficos  