import {Router} from 'express'
const router = Router()


import verificarAutenticacion from "../middlewares/autenticacion.js";
import { actualizarEstudiante, actualizarPassword, agregarAmigo, eliminarAmigo, eliminarEstudiante, listarEstudiantes, listarEstudiantesDesactivados, loginEstudiante, obtenerEstudiante, perfilEstudiante, reactivarEstudiante, registrarEstudiante, subirFotoPerfil } from '../controllers/estudiante_controller.js';
import { verificarAdmin } from '../middlewares/verificarAdmin.js';
import { comprobarTokenPassword, nuevoPassword, recuperarPassword } from '../controllers/administrador_controller.js';


router.post('/estudiante/login',loginEstudiante)

router.get('/estudiante/perfil',verificarAutenticacion,perfilEstudiante)
router.get("/estudiantes",verificarAutenticacion,verificarAdmin,listarEstudiantes);
router.get("/estudiante/:id",verificarAutenticacion, obtenerEstudiante);
router.post("/estudiante/registro", subirFotoPerfil, registrarEstudiante);
router.put("/estudiante/actualizar/:id", verificarAutenticacion,subirFotoPerfil,actualizarEstudiante);
router.delete("/estudiante/eliminar/:id", verificarAutenticacion,eliminarEstudiante);
//Requiere permisos de Administrador reactivar a un estudiante
router.get("/estudiantes/desactivado/", verificarAutenticacion,verificarAdmin,listarEstudiantesDesactivados);
router.put("/estudiante/reactivar/:id", verificarAutenticacion,verificarAdmin,reactivarEstudiante);
router.post("/recuperar-password-estudiante", recuperarPassword);
router.get("/recuperar-password-estudiante/:token", comprobarTokenPassword);
router.post("/nuevo-password-estudiante/:token", nuevoPassword);
router.put('/estudiante/actualizarpassword',verificarAutenticacion, actualizarPassword)
router.post('/estudiante/:id/agregar', verificarAutenticacion, agregarAmigo);
router.post('/estudiante/:id/eliminar', verificarAutenticacion, eliminarAmigo);

export default router