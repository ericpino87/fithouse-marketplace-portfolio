# Publicar FitHouse en GitHub: guía sencilla

1. **No reemplaces ni borres** `Pdomans/grupo_13_TBA` ni tus repositorios antiguos. Guardá el ZIP original como copia de seguridad.
2. Creá un repositorio NUEVO en tu cuenta llamado `fithouse-marketplace-portfolio`, inicialmente **Private**.
3. Descargá y descomprimí el ZIP de FitHouse. Subí **el contenido de la carpeta**, no el archivo ZIP.
4. Si GitHub no te deja subir carpetas: creá cada carpeta con `Add file → Create new file`, escribiendo por ejemplo `docs/.gitkeep`; luego entrá en ella y subí sus archivos. Si tenés Git instalado, usar Git CLI es más rápido para muchos archivos.
5. Verificá que `README.md` esté en la raíz y que `docs/index.html` esté presente.
6. En **Actions**, comprobá que las pruebas de Node terminen correctamente.
7. Verificá los créditos del trabajo grupal y los permisos de publicación, y después cambiá el repositorio a **Public** si corresponde.
8. En `Settings → Pages`, configurá `Deploy from a branch` → `main` → **`/docs`** y guardá.
9. La dirección esperada será `https://ericpino87.github.io/fithouse-marketplace-portfolio/` si creás el repositorio con ese nombre.

**Limitación:** GitHub Pages solo ejecuta `docs/index.html`, no el servidor Express. Para probar login/registro y gestión del catálogo, se necesita instalar dependencias y ejecutar `npm start` en una computadora.
