# 🚀 Configuración de Despliegue en Vercel - Frontend

## ✅ Problemas Corregidos

Se han corregido los siguientes problemas que causaban errores de despliegue:

1. ✅ **Eliminadas dependencias incorrectas**: Se removieron las dependencias de NestJS del `package.json` del frontend
2. ✅ **Eliminado directorio Prisma**: El frontend no necesita acceso directo a la base de datos
3. ✅ **Creado archivo `vercel.json`**: Configuración optimizada para Next.js
4. ✅ **Actualizado `env.example`**: Documentación clara de variables de entorno

## 📋 Pasos para Desplegar en Vercel

### 1. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel, ve a tu proyecto y luego a **Settings → Environment Variables**:

#### Variables Requeridas:
```
NEXT_PUBLIC_API_URL=https://tu-backend.vercel.app
NODE_ENV=production
```

**Importante**: 
- Reemplaza `https://tu-backend.vercel.app` con la URL real de tu backend desplegado
- Las variables que empiezan con `NEXT_PUBLIC_` son accesibles en el navegador

### 2. Configurar el Proyecto

En **Settings → General**:

- **Framework Preset**: Next.js (se detecta automáticamente)
- **Root Directory**: `./` (raíz del repositorio)
- **Build Command**: `npm run build` (por defecto)
- **Output Directory**: `.next` (por defecto)
- **Install Command**: `npm install` (por defecto)

### 3. Hacer Commit y Push

```bash
git add .
git commit -m "fix: corregir package.json y configuración de despliegue"
git push origin main
```

Vercel detectará automáticamente el push y comenzará un nuevo despliegue.

### 4. Verificar el Despliegue

Una vez completado el despliegue, verifica que:

- ✅ La página carga correctamente
- ✅ Las peticiones al backend funcionan
- ✅ La autenticación funciona
- ✅ No hay errores en la consola del navegador

## 🔧 Troubleshooting

### Error: "Module not found"
- ✅ **Resuelto**: Se eliminaron las dependencias incorrectas de NestJS

### Error: "API request failed"
- Verifica que `NEXT_PUBLIC_API_URL` esté correctamente configurada en Vercel
- Asegúrate de que el backend esté desplegado y funcionando
- Verifica los logs del backend en Vercel

### Error: "CORS policy"
- Verifica que el backend tenga configurada la URL del frontend en CORS
- Asegúrate de que `PRODUCTION_FRONTEND_URL` esté configurada en el backend

### Error de Build
- Revisa los logs de build en Vercel
- Verifica que no haya errores de TypeScript
- Asegúrate de que todas las importaciones sean correctas

## 📝 Checklist de Despliegue

- [ ] Variables de entorno configuradas en Vercel
- [ ] `NEXT_PUBLIC_API_URL` apunta al backend correcto
- [ ] Backend desplegado y funcionando
- [ ] CORS configurado en el backend
- [ ] Commit y push realizados
- [ ] Despliegue completado sin errores
- [ ] Aplicación funcionando correctamente

## 🔗 Enlaces Útiles

- [Documentación de Vercel](https://vercel.com/docs)
- [Next.js en Vercel](https://vercel.com/guides/deploying-nextjs-to-vercel)
- [Variables de Entorno en Next.js](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

## 📞 Soporte

Si sigues teniendo problemas:

1. Revisa los logs de despliegue en Vercel
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que el backend esté funcionando correctamente
4. Revisa la consola del navegador para errores de JavaScript

