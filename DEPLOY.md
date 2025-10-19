# 🚀 Guía de Despliegue en Vercel - Frontend

## Paso a Paso para Desplegar el Frontend

### 1. Preparar el Repositorio

Asegúrate de que tu código esté en GitHub y que el repositorio sea público o que Vercel tenga acceso.

### 2. Desplegar en Vercel

#### Opción A: Desde la Interfaz Web

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en "Add New Project"
3. Importa tu repositorio del frontend
4. Configura el proyecto:
   - **Framework Preset**: Next.js (se detecta automáticamente)
   - **Root Directory**: `./` (raíz del repositorio)
   - **Build Command**: `npm run build` (por defecto)
   - **Output Directory**: `.next` (por defecto)
   - **Install Command**: `npm install` (por defecto)

#### Opción B: Desde la CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Iniciar sesión
vercel login

# Desplegar
vercel

# Para producción
vercel --prod
```

### 3. Configurar Variables de Entorno

En la configuración del proyecto en Vercel, agrega estas variables:

#### Variables Requeridas:
```
NEXT_PUBLIC_API_URL=https://tu-backend.vercel.app
NODE_ENV=production
```

**Nota**: Las variables que empiezan con `NEXT_PUBLIC_` son accesibles en el navegador.

### 4. Configurar el Archivo de Configuración de Next.js

Asegúrate de que tu `next.config.ts` esté configurado correctamente:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@prisma/client'],
  },
};

export default nextConfig;
```

### 5. Verificar el Despliegue

Una vez desplegado, Vercel te dará una URL como:
`https://tu-frontend-xyz.vercel.app`

Prueba acceder a la URL y verifica que:
- La página carga correctamente
- Las peticiones al backend funcionan
- La autenticación funciona

### 6. Configurar Dominio Personalizado (Opcional)

1. En la configuración del proyecto en Vercel
2. Ve a "Domains"
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar los DNS

## 🔧 Troubleshooting

### Error: "Module not found"
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `npm install` se ejecute correctamente

### Error: "API request failed"
- Verifica que `NEXT_PUBLIC_API_URL` esté correctamente configurada
- Asegúrate de que el backend esté desplegado y funcionando
- Verifica los logs del backend en Vercel

### Error: "CORS policy"
- Verifica que el backend tenga configurada la URL del frontend en CORS
- Asegúrate de que `PRODUCTION_FRONTEND_URL` esté configurada en el backend

### Error de Build
- Revisa los logs de build en Vercel
- Verifica que no haya errores de TypeScript
- Asegúrate de que todas las importaciones sean correctas

## 📝 Notas Importantes

- Next.js en Vercel se optimiza automáticamente
- Las imágenes se optimizan automáticamente si usas `next/image`
- El rendimiento se monitorea automáticamente
- Puedes ver analytics en tiempo real en el dashboard de Vercel

## 🔗 Enlaces Útiles

- [Documentación de Vercel](https://vercel.com/docs)
- [Next.js en Vercel](https://vercel.com/guides/deploying-nextjs-to-vercel)
- [Variables de Entorno en Next.js](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
