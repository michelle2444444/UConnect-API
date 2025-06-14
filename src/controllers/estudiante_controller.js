// IMPORTAR EL MODELO
import Estudiante from "../models/Estudiante.js";
import multer from "multer";
import jwt from "jsonwebtoken";
import fs from "fs-extra";
import path from "path";
import { sendMailToEstudiante } from "../config/nodemailer.js";
import cloudinary from "../config/cloudinary.js";

import mongoose from "mongoose";
import generarJWT from "../helpers/crearJWT.js";
import { dirname } from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadDir = path.join(__dirname, "temp_uploads");

// Crear la carpeta automáticamente si no existe
fs.ensureDirSync(uploadDir);

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Formato de archivo no válido. Solo se permiten imágenes (JPEG, PNG)."
      ),
      false
    );
  }
};
// Configuración de multer para manejar la carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.ensureDirSync(uploadDir); // Asegurar que la carpeta existe antes de guardar
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Genera un nombre único para la imagen
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Tamaño máximo: 5MB
  fileFilter,
}).single("fotoPerfil"); // Solo permite una foto de perfil

// Método para el proceso de login
const loginEstudiante = async (req, res) => {
  const { email, password } = req.body;

  // Validar que todos los campos estén llenos
  if (Object.values(req.body).includes("")) {
    return res
      .status(400)
      .json({ msg: "Lo sentimos, debes llenar todos los campos" });
  }

  // Buscar el estudiante en la base de datos por email
  const estudianteBDD = await Estudiante.findOne({ email }).populate(
    "amigos",
    "nombre usuario fotoPerfil"
  );

  // Verificar si el estudiante existe
  if (!estudianteBDD) {
    return res
      .status(404)
      .json({ msg: "Lo sentimos, el usuario no se encuentra registrado" });
  }

  // Verificar el password
  const verificarPassword = await estudianteBDD.matchPassword(password);

  if (!verificarPassword) {
    return res
      .status(401)
      .json({ msg: "Lo sentimos, el password no es correcto" });
  }

  // Generar el token JWT
  const token = generarJWT(estudianteBDD._id, "Estudiante");

  // Desestructurar los datos necesarios del estudiante
  const {
    nombre,
    usuario,
    email: emailEstudiante,
    fotoPerfil,
    universidad,
    _id,
    rol,
    amigos,
    celular,
    carrera,
    bio,
    intereses,
  } = estudianteBDD;

  // Enviar la respuesta con el token y los datos del estudiante
  res.status(200).json({
    token,
    _id,
    nombre,
    usuario,
    email: emailEstudiante,
    fotoPerfil,
    universidad,
    rol,
    amigos,
    celular,
    carrera,
    bio,
    intereses,
  });
};

// Controlador para registrar un estudiante
const registrarEstudiante = async (req, res) => {
  // Desestructurar los campos necesarios
  const { email, usuario, password } = req.body;
  const validDomains = ["@puce.edu.ec", "@epn.edu.ec", "@ups.edu.ec"];
  // Validar que todos los campos estén llenos
  if (Object.values(req.body).includes(null)) {
    return res
      .status(400)
      .json({ msg: "Lo sentimos, debes llenar todos los campos" });
  }

  if (!validDomains.some((domain) => email.endsWith(domain))) {
    return res
      .status(400)
      .json({ msg: "Lo sentimos, debes ingresar un correo válido" });
  }

  // Verificar si el estudiante ya está registrado
  const verificarEmailBDD = await Estudiante.findOne({ email });
  const verificarUsuarioBDD = await Estudiante.findOne({ usuario });

  if (verificarEmailBDD) {
    return res
      .status(400)
      .json({ msg: "Lo sentimos, el email ya está registrado" });
  }

  if (verificarUsuarioBDD) {
    return res
      .status(400)
      .json({ msg: "Lo sentimos, el usuario ya está registrado" });
  }

  // Crear una instancia del estudiante
  const nuevoEstudiante = new Estudiante(req.body);

  // Encriptar el password
  nuevoEstudiante.password = await nuevoEstudiante.encrypPassword(password);

  // Subir la foto de perfil a Cloudinary si se ha proporcionado
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "estudiantes_perfil", // Carpeta en Cloudinary donde se guardarán las fotos
      });
      nuevoEstudiante.fotoPerfil = {
        url: result.secure_url,
        public_id: result.public_id,
      };
      await fs.remove(uploadDir);
    } catch (error) {
      return res
        .status(502)
        .json({ msg: "Error al subir la foto de perfil a Cloudinary" });
    }
  }

  // Enviar el correo electrónico
  await sendMailToEstudiante(email, "estud" + password);

  // Guardar en la base de datos
  await nuevoEstudiante.save();

  // Presentar resultados
  res.status(200).json({ msg: "Registro exitoso y correo enviado" });
};

// Middleware para manejar la subida de fotos
const subirFotoPerfil = upload;
// Método para ver el perfil del estudiante
const perfilEstudiante = async (req, res) => {
  const { idToken, rol } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );
  if (rol !== "Estudiante")
    return res
      .status(403)
      .json({ msg: "No tienes permisos para realizar esta acción" });
  const estudianteBDD = await Estudiante.findById(idToken).populate(
    "amigos",
    "nombre usuario fotoPerfil"
  );
  const token = generarJWT(estudianteBDD._id, rol);
  // Desestructurar los datos necesarios del estudiante
  const {
    nombre,
    usuario,
    email,
    fotoPerfil,
    universidad,
    _id,
    amigos,
    celular,
    carrera,
    bio,
    intereses,
  } = estudianteBDD;

  // Enviar la respuesta con el token y los datos del estudiante
  res.status(200).json({
    token,
    _id,
    nombre,
    usuario,
    email,
    fotoPerfil,
    universidad,
    rol,
    amigos,
    celular,
    carrera,
    bio,
    intereses,
  });
};

// Método para actualizar un estudiante (incluyendo la imagen de perfil)
const actualizarEstudiante = async (req, res) => {
  const { id } = req.params;
  const { body, file } = req;
  const { idToken, rol } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );
  if (Object.values(body).includes(null)) {
    return res
      .status(400)
      .json({ msg: "Lo sentimos, debes llenar todos los campos" });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ msg: `Lo sentimos, no existe el estudiante con ID ${id}` });
  }
  if (body.password) {
    return res.status(400).json({
      msg: `Lo sentimos, no se debe actualizar el password en este formulario`,
    });
  }
  try {
    const estudiante = await Estudiante.findById(id);
    if (!estudiante) {
      return res.status(404).json({ msg: "Estudiante no encontrado" });
    }
    // Verificar si el usuario es el dueño de la cuenta o es un administrador
    if (estudiante._id.toString() !== idToken && rol !== "Administrador") {
      return res
        .status(403)
        .json({ msg: "No tienes permiso para actualizar esta cuenta" });
    }
    // Si hay una imagen nueva, subirla a Cloudinary
    if (file) {
      if (estudiante.fotoPerfil?.public_id) {
        // Eliminar la imagen anterior de Cloudinary
        await cloudinary.v2.uploader.destroy(estudiante.fotoPerfil.public_id);
      }

      // Subir la nueva imagen a Cloudinary
      const resultado = await cloudinary.v2.uploader.upload(file.path, {
        folder: "estudiantes_perfil",
        width: 300,
        crop: "scale",
      });

      body.fotoPerfil = {
        url: resultado.secure_url,
        public_id: resultado.public_id,
      };
      await fs.remove(uploadDir);
    }
    // Actualizar el estudiante con los nuevos datos
    estudiante.nombre = body.nombre || estudiante?.nombre;
    estudiante.usuario = body.usuario || estudiante?.usuario;
    estudiante.email = body.email || estudiante?.email;
    estudiante.celular = body.celular || estudiante?.celular;
    estudiante.intereses = body.intereses
      ? JSON.parse(body.intereses)
      : estudiante?.intereses;
    estudiante.bio = body.bio || estudiante?.bio;

    if (body.intereses !== undefined) {
  if (Array.isArray(body.intereses)) {
    estudiante.intereses = body.intereses;
  } else {
    estudiante.intereses = [body.intereses];
  }
}

    if (typeof body.fotoPerfil === "object" && body.fotoPerfil !== null) {
      estudiante.fotoPerfil = body.fotoPerfil;
    }
    await estudiante.save();
    res.status(200).json({ msg: "Perfil actualizado correctamente" });
  } catch (error) {
    await fs.remove(uploadDir);
    res.status(500).json({ msg: "Hubo un error en el servidor" });
    console.log(error);
  }
};

// Método para eliminar (dar de baja) un estudiante
const eliminarEstudiante = async (req, res) => {
  const { id } = req.params;
  const { idToken, rol } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ msg: `Lo sentimos, no existe el estudiante con ID ${id}` });
  }

  try {
    const estudiante = await Estudiante.findById(id);
    if (!estudiante) {
      return res.status(404).json({ msg: "Estudiante no encontrado" });
    }
    // Verificar si el usuario es el dueño de la cuenta o es un administrador
    if (estudiante._id.toString() !== idToken && rol !== "Administrador") {
      return res
        .status(403)
        .json({ msg: "No tienes permiso para actualizar esta cuenta" });
    }
    // Eliminar la imagen de Cloudinary si existe
    if (estudiante.fotoPerfil?.public_id) {
      await cloudinary.v2.uploader.destroy(estudiante.fotoPerfil.public_id);
    }

    // Dar de baja al estudiante
    estudiante.estado = false;
    await estudiante.save();

    res
      .status(200).json({ msg: "El estudiante ha sido dado de baja exitosamente" });
  } catch (error) {
    res.status(500).json({ msg: "Hubo un error en el servidor" });
  }
};

// Método para listar todos los estudiantes
const listarEstudiantes = async (req, res) => {
  const estudiantes = await Estudiante.find({ estado: true }).select(
    "-password -__v -createdAt -updatedAt"
  );
  res.status(200).json(estudiantes);
};

// Método para listar todos los estudiantes
const listarEstudiantesDesactivados = async (req, res) => {
  const estudiantes = await Estudiante.find({ estado: false }).select(
    "-password -__v -createdAt -updatedAt"
  );
  res.status(200).json(estudiantes);
};

// Método para obtener un estudiante específico por ID
const obtenerEstudiante = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ msg: `Lo sentimos, no existe el estudiante con ID ${id}` });
  }

  const estudiante = await Estudiante.findById(id).select(
    "-password -__v -createdAt -updatedAt"
  );

  if (!estudiante) {
    return res.status(404).json({ msg: "Estudiante no encontrado" });
  }

  res.status(200).json(estudiante);
};

// Método para reactivar un estudiante
const reactivarEstudiante = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ msg: `Lo sentimos, no existe el estudiante con ID ${id}` });
  }

  await Estudiante.findByIdAndUpdate(id, { estado: true });

  res
    .status(200)
    .json({ msg: "El estudiante ha sido reactivado exitosamente" });
};
const agregarAmigo = async (req, res) => {
  try {
    const amigoId = req.params.id; // ID del amigo a agregar
    const estudianteId = req.body._id; // ID del estudiante que envía la solicitud

    if (!estudianteId) {
      return res
        .status(400)
        .json({ mensaje: "No se ha enviado el ID del estudiante" });
    }

    if (estudianteId === amigoId) {
      return res
        .status(400)
        .json({ mensaje: "No puedes agregarte a ti mismo como amigo" });
    }

    // Buscar a ambos estudiantes
    const estudiante = await Estudiante.findById(estudianteId);
    const amigo = await Estudiante.findById(amigoId);

    if (!estudiante || !amigo) {
      return res
        .status(404)
        .json({ mensaje: "Uno o ambos estudiantes no existen" });
    }

    // Verificar si ya son amigos
    if (estudiante.amigos.includes(amigoId)) {
      return res.status(400).json({ mensaje: "Este usuario ya es tu amigo" });
    }

    // Agregar el amigo a ambos perfiles
    estudiante.amigos.push(amigoId);
    amigo.amigos.push(estudianteId);

    // Guardar cambios
    await estudiante.save();
    await amigo.save();

    res.status(200).json({ mensaje: "Amigo agregado exitosamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Hubo un error al agregar amigo", error });
  }
};

const eliminarAmigo = async (req, res) => {
  try {
    const amigoId = req.params.id; // ID del amigo a eliminar
    const estudianteId = req.body._id; // ID del estudiante que hace la solicitud

    if (!estudianteId) {
      return res
        .status(400)
        .json({ mensaje: "No se ha enviado el ID del estudiante" });
    }

    // Buscar a ambos estudiantes
    const estudiante = await Estudiante.findById(estudianteId);
    const amigo = await Estudiante.findById(amigoId);

    if (!estudiante || !amigo) {
      return res
        .status(404)
        .json({ mensaje: "Uno o ambos estudiantes no existen" });
    }

    // Verificar si realmente son amigos
    if (!estudiante.amigos.includes(amigoId)) {
      return res.status(400).json({ mensaje: "Este usuario no es tu amigo" });
    }

    // Eliminar la amistad en ambos perfiles
    estudiante.amigos = estudiante.amigos.filter(
      (id) => id.toString() !== amigoId
    );
    amigo.amigos = amigo.amigos.filter((id) => id.toString() !== estudianteId);

    // Guardar cambios
    await estudiante.save();
    await amigo.save();

    res.status(200).json({ mensaje: "Amigo eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Hubo un error al eliminar amigo", error });
  }
};
// Método para actualizar el password
const actualizarPassword = async (req, res) => {
  const estudianteBDD = await Estudiante.findById(req.body._id);

  if (!estudianteBDD)
    return res.status(404).json({ msg: "No existe el estudiante" });

  const verificarPassword = await estudianteBDD.matchPassword(
    req.body.passwordactual
  );

  if (!verificarPassword)
    return res.status(404).json({ msg: "La contraseña actual no es correcta" });

  estudianteBDD.password = await estudianteBDD.encrypPassword(
    req.body.passwordnuevo
  );

  await estudianteBDD.save();

  res.status(200).json({ msg: "Contraseña actualizada correctamente" });
};
export {
  loginEstudiante,
  perfilEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
  listarEstudiantes,
  obtenerEstudiante,
  reactivarEstudiante,
  registrarEstudiante,
  subirFotoPerfil,
  agregarAmigo,
  eliminarAmigo,
  listarEstudiantesDesactivados,
  actualizarPassword,
};
