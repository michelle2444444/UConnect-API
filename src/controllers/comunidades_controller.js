// Importar los módulos necesarios
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import fs from "fs-extra";
import path from "path"
import mongoose from "mongoose";
import Comunidad from "../models/Comunidad.js";
import { dirname } from "path";
import Estudiante from '../models/Estudiante.js';  
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadDir = path.join(__dirname, "temp_uploads");

// Crear la carpeta automáticamente si no existe
fs.ensureDirSync(uploadDir);
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
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Tamaño máximo: 5MB
  fileFilter,
}).single("logo"); // Solo permite un archivo llamado "logo"

// Controlador para crear una comunidad
const crearComunidad = async (req, res) => {
  // Validar que todos los campos estén llenos
  if (Object.values(req.body).includes(null)) {
    return res
      .status(400)
      .json({ msg: "Lo sentimos, debes llenar todos los campos" });
  }
  // Convertir el campo "interesesRelacionados" a un array si es una cadena
  if (typeof req.body.interesesRelacionados === "string") {
    try {
      req.body.interesesRelacionados = JSON.parse(
        req.body.interesesRelacionados
      );
    } catch (error) {
      return res.status(400).json({
        msg: "Error al procesar los intereses relacionados. Formato incorrecto.",
      });
    }
  }
  const { nombre } = req.body;
  // Verificar si la comunidad ya existe
  const verificarComunidadBDD = await Comunidad.findOne({ nombre });

  if (verificarComunidadBDD) {
    return res
      .status(400)
      .json({ msg: "Lo sentimos, ya existe una comunidad con ese nombre" });
  }

  // Crear una nueva comunidad sin logo inicialmente
  const nuevaComunidad = new Comunidad(req.body);

  // Subir el logo a Cloudinary si se proporcionó
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "logos_comunidades",
      });
      nuevaComunidad.logo = {
        url: result.secure_url,
        public_id: result.public_id,
      };

      // Eliminar el archivo temporal
      await fs.remove(uploadDir);
    } catch (error) {
      if (req.file) await fs.remove(uploadDir);
      return res
        .status(500)
        .json({ msg: "Error al subir el logo a Cloudinary", error });
    }
  }

  // Guardar la comunidad en la base de datos
  await nuevaComunidad.save();
  res.status(201).json({
    msg: "Comunidad creada exitosamente",
    comunidad: nuevaComunidad,
  });
};

const subirLogo = upload;

// Unirse a una comunidad (Los estudiantes pueden unirse)
// En tu función unirseComunidad:
const unirseComunidad = async (req, res) => {
  try {
    const comunidadId = req.params.id;
    const estudianteId = req.body._id;

    if (!estudianteId) {
      return res.status(400).json({ mensaje: "No se ha enviado el ID del estudiante" });
    }

    const comunidad = await Comunidad.findById(comunidadId);
    const estudiante = await Estudiante.findById(estudianteId);

    if (!comunidad || !estudiante) {
      return res.status(404).json({ mensaje: "Comunidad o estudiante no encontrado" });
    }

    if (comunidad.estudiantes.includes(estudianteId)) {
      return res.status(409).json({ mensaje: "Ya eres miembro de esta comunidad" });
    }

    // Agregar al estudiante en la comunidad
    comunidad.estudiantes.push(estudianteId);
    await comunidad.save();

    // Agregar la comunidad al estudiante
    if (!estudiante.comunidades.includes(comunidadId)) {
      estudiante.comunidades.push(comunidadId);
      await estudiante.save();
    }

    res.status(200).json({ mensaje: "Te has unido a la comunidad", comunidad });
  } catch (error) {
  console.error("Error unirse a comunidad:", error);
  res.status(500).json({ mensaje: "Hubo un error al unirse a la comunidad", error: error.message || error });
}

};


// Obtener información de una comunidad (Los estudiantes pueden verla)
const verComunidad = async (req, res) => {
  try {
    const comunidadId = req.params.id;

    const comunidad = await Comunidad.findById(comunidadId)
      .populate("estudiantes", "nombre usuario fotoPerfil")
      .populate("administrador", "nombre apellido email");
    if (!comunidad) {
      return res.status(404).json({ mensaje: "Comunidad no encontrada" });
    }
    res.status(200).json(comunidad);
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Hubo un error al obtener la comunidad", error });
  }
};
const obtenerComunidades = async (req, res) => {
  try {
    const comunidades = await Comunidad.find({ estado: true });
    res.status(200).json(comunidades);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener comunidades", error });
  }
};
const actualizarComunidad = async (req, res) => {
  const { id } = req.params;
  const { body, file } = req;

  if (Object.values(body).includes(null)) {
    return res
      .status(400)
      .json({ msg: "Lo sentimos, debes llenar todos los campos" });
  }
  if (typeof req.body.interesesRelacionados === "string") {
    try {
      req.body.interesesRelacionados = JSON.parse(
        req.body.interesesRelacionados
      );
    } catch (error) {
      return res.status(400).json({
        msg: "Error al procesar los intereses relacionados. Formato incorrecto.",
      });
    }
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404).json({ msg: `Lo sentimos, no existe la comunidad con ID ${id}` });
  }
  try {
    const comunidad = await Comunidad.findById(id);
    if (!comunidad) {
      return res.status(404).json({ msg: "Comunidad no encontrada" });
    }
    // Si hay una imagen nueva, subirla a Cloudinary
    if (file) {
      if (comunidad.logo?.public_id) {
        // Eliminar la imagen anterior de Cloudinary
        await cloudinary.v2.uploader.destroy(comunidad.logo.public_id);
      }

      // Subir la nueva imagen a Cloudinary
      const resultado = await cloudinary.v2.uploader.upload(file.path, {
        folder: "logos_comunidades",
        width: 300,
        crop: "scale",
      });

      body.logo = {
        url: resultado.secure_url,
        public_id: resultado.public_id,
      };
      await fs.remove(uploadDir);
    }
    const comunidadActualizada = await Comunidad.findByIdAndUpdate(id, body, {
      new: true,
    });
    res.status(200).json(comunidadActualizada);
  } catch (error) {
    await fs.remove(uploadDir);
    res.status(500).json({ msg: "Error al actualizar la comunidad", error });
  }
};
// Eliminar una comunidad (Solo el administrador puede hacerlo)
const eliminarComunidad = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ msg: `Lo sentimos, no existe la comunidad con ID ${id}` });
  }
  try {
    const comunidad = await Comunidad.findById(id);
    if (!comunidad) {
      return res.status(404).json({ msg: "Comunidad no encontrada" });
    }

    // Eliminar la imagen de Cloudinary si existe
    if (comunidad.logo?.public_id) {
      await cloudinary.v2.uploader.destroy(comunidad.logo.public_id);
    }

    // Dar de baja al estudiante
    comunidad.estado = false;
    await comunidad.save();
    res
      .status(200)
      .json({ msg: "La comunidad ha sido dado de baja exitosamente" });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Hubo un error al eliminar la comunidad", error });
  }
};

export {
  crearComunidad,
  subirLogo,
  unirseComunidad,
  verComunidad,
  obtenerComunidades,
  actualizarComunidad,
  eliminarComunidad,
};
