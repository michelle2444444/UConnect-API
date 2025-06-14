# U-Connect API 📚

API para comunidades universitarias cercanas a la EPN (Escuela Politécnica Nacional). Facilita la conexión entre estudiantes, gestión de comunidades, comentarios y mensajería en tiempo real.

## Tecnologías Utilizadas 🛠️

- **Express.js**: Framework para construir la API REST.
- **JWT (JSON Web Tokens)**: Autenticación y autorización de usuarios.
- **Nodemailer**: Envío de correos electrónicos (confirmación, recuperación de contraseña).
- **MongoDB**: Base de datos NoSQL para almacenamiento de datos.
- **Socket.IO**: Chat en tiempo real entre usuarios.
- **Cloudinary**: Almacenamiento y gestión de imágenes de perfil.

## Instalación 🚀

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/michelle2444444/UConnect-API.git
   cd api-restful-connect.

Estructura del proyecto

![image](https://github.com/user-attachments/assets/1c0ff5a4-261e-4924-a78b-fd374f0c0927)


2. **Instalar dependencias**:
```bash
    npm install
```
3. **Configurar variables de entorno**:
Crea un archivo .env en la raíz del proyecto con las siguientes variables:
```env
    MONGODB_URI=tu_url_de_mongodb
    CLOUDINARY_CLOUD_NAME=tu_cloud_name
    CLOUDINARY_API_KEY=tu_api_key
    CLOUDINARY_API_SECRET=tu_api_secret
    JWT_SECRET=tu_secreto_jwt
    # Configuración de Mailtrap (pruebas de correo)
    HOST_MAILTRAP=smtp.mailtrap.io
    PORT_MAILTRAP=2525
    USER_MAILTRAP=tu_usuario_mailtrap
    PASS_MAILTRAP=tu_contraseña_mailtrap
```
4. **Ejecutar el servidor**:
```bash
    npm start
```
Modo desarrollo (con Nodemon):
```bash
    npm run dev
```
## Rutas de la API 🔌
## Administrador 👨💼
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST   | /api/registro | Registro de administrador. |
| POST   | /api/login | Inicio de sesión. |
| GET    | /api/admin/perfil | Obtener perfil del administrador. |
| PUT    | /api/administrador/:id | Actualizar perfil. |
| PUT    | /api/administrador/actualizarpassword | Actualizar contraseña. |
| POST   | /api/recuperar-password | Recuperar contraseña (envía correo). |
| GET    | /api/confirmar/:token | Confirmar email (vía token). |

## Estudiante 🎓
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST   | /api/estudiante/register | Registro de estudiante. |
| POST   | /api/estudiante/login | Inicio de sesión. |
| GET    | /api/estudiante/perfil | Obtener perfil del estudiante. |
| GET    | /api/estudiantes | Listar todos los estudiantes. |
| GET    | /api/estudiante/:id | Obtener estudiante por ID. |
| PUT    | /api/estudiante/actualizar/:id | Actualizar perfil. |
| DELETE | /api/estudiante/eliminar | Eliminar cuenta. |
| POST   | /api/estudiante/:id/agregar | Agregar amigo. |
| DELETE | /api/estudiante/:id/eliminar | Eliminar amigo. |

## Comunidades 🏛️
| Método | Endpoint                    | Descripción                                  |
| ------ | ----------------------------| -------------------------------------------- |
| POST   | /api/comunidades/           | Crear comunidad (solo administradores).      |
| GET    | /api/comunidades/           | Obtener todas las comunidades.               |
| GET    | /api/comunidades/:id        | Obtener comunidad por ID.                    |
| PUT    | /api/comunidades/:id        | Actualizar comunidad (solo administradores). |
| DELETE | /api/comunidades/:id        | Eliminar comunidad (solo administradores).   |
| POST   | /api/comunidades/:id/unirse | Unirse a una comunidad (solo estudiantes).   |


## Comentarios 💬
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST   | /api/comentario/ | Crear comentario. |
| GET    | /api/publicacion/:publicacionId | Obtener comentarios por ID de publicación. |
| DELETE | /api/comentario/:id_comentario | Eliminar comentario. |


## Mensajes 📩
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET    | /api/mensaje/usuarios | Listar usuarios conectados. |
| GET    | /api/mensaje/:id | Obtener historial de mensajes. |
| POST   | /api/mensaje/enviar/:id | Enviar mensajes. |
| WebSocket | /socket.io/ | Enviar mensajes en tiempo real. |

## 📝 Publicaciones

| Método | Endpoint               | Descripción                              |
| ------ | ---------------------- | ---------------------------------------- |
| POST   | /api/publicacion/      | Crear publicación (con imagen opcional). |
| GET    | /api/obtener           | Obtener publicaciones.                   |
| DELETE | /api/publicaciones/:id | Eliminar publicación.                    |


### Despliegue en Render 🚀

La API está desplegada en Render.
URL de producción: https://api-restful-iul9.onrender.com
**Pasos para despliegue**:

- Conectar repositorio de GitHub a Render.
- Configurar variables de entorno en el dashboard de Render.
- Especificar el comando de inicio: npm start.
- ¡Desplegar!
