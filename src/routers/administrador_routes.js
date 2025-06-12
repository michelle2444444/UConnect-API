// Importar Router de Express
import {Router} from 'express'

// Crear una instancia de Router() 
const router = Router()

import verificarAutenticacion from '../middlewares/autenticacion.js';
import { actualizarPassword, actualizarPerfil, comprobarTokenPassword, confirmEmail, login, nuevoPassword, perfil, recuperarPassword, registro } from '../controllers/administrador_controller.js';
import { validacionAdministrador } from '../middlewares/validacionAdmin.js';
import { verificarAdmin } from '../middlewares/verificarAdmin.js';

// Rutas publicas
router.post("/login", login);
router.post("/registro" , registro, validacionAdministrador, verificarAutenticacion,verificarAdmin);


router.get("/confirmar/:token", confirmEmail);
router.post("/recuperar-password", recuperarPassword);
router.get("/recuperar-password/:token", comprobarTokenPassword);
router.post("/nuevo-password/:token", nuevoPassword);



// Rutas privadas
router.get("/admin/perfil",verificarAutenticacion , perfil);
router.put('/administrador/actualizarpassword',verificarAutenticacion, actualizarPassword)
router.put("/administrador/:id", verificarAutenticacion, actualizarPerfil);

// Exportar la variable router
export default router