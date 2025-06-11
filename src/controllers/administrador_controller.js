// Importar el modelo
import {
  sendMailToUser,
  sendMailToRecoveryPassword,
} from "../config/nodemailer.js";
import generarJWT from "../helpers/crearJWT.js";
import Administrador from "../models/Administrador.js";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import Estudiante from "../models/Estudiante.js";


// Método para el login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (Object.values(req.body).includes(""))
    return res.status(400).json({ msg: "Debes llenar todos los campos" });

  const administradorBDD = await Administrador.findOne({ email }).select(
    "-status -__v -token -updatedAt -createdAt"
  );

  if (administradorBDD?.confirmEmail === false)
    return res.status(403).json({ msg: "Debe verificar su cuenta" });

  if (!administradorBDD)
    return res.status(404).json({ msg: "El usuario no está registrado" });

  const verificarPassword = await administradorBDD.matchPassword(password);

  if (!verificarPassword)
    return res.status(401).json({ msg: "La contraseña no es correcta" });

  const token = generarJWT(administradorBDD._id, "Administrador");

  const { nombre, apellido, telefono, email: adminEmail, _id, rol, direccion,} = administradorBDD;

  res.status(200).json({
    token,
    nombre,
    apellido,
    telefono,
    email: adminEmail,
    _id,
    rol,
    direccion,
  });
};

// Método para mostrar el perfil
const perfil = async (req, res) => {
  const {idToken,rol} = jwt.verify(req.headers.authorization.split(' ')[1],process.env.JWT_SECRET)
  if (rol !== "Administrador")
    return res.status(403).json({ msg: "No tienes permisos para realizar esta acción" });
  const administradorBDD = await Administrador.findById(idToken).select(
    "-status -__v -token -updatedAt -createdAt"
  );
  const token = generarJWT(administradorBDD._id, rol);
  const { nombre, apellido, telefono, email, _id, direccion,} = administradorBDD;

  res.status(200).json({
    nombre,
    apellido,
    telefono,
    email,
    _id,
    rol,
    token,
    direccion,
  });

};

// Método para el registro
const registro = async (req, res) => {
  const { email, password } = req.body;

  if (Object.values(req.body).includes(""))
    return res.status(400).json({ msg: "Debes llenar todos los campos" });

  const verificarEmailBDD = await Administrador.findOne({ email });

  if (verificarEmailBDD)
    return res.status(409).json({ msg: "El email ya está registrado" });

  const nuevoAdministrador = new Administrador(req.body);

  nuevoAdministrador.password = await nuevoAdministrador.encrypPassword(
    password
  );

  const token = nuevoAdministrador.crearToken();

  await sendMailToUser(email, token);

  await nuevoAdministrador.save();

  res
    .status(200).json({ msg: "Revisa tu correo electrónico para confirmar tu cuenta" });
};

// Método para confirmar el token
const confirmEmail = async (req, res) => {
  if (!req.params.token)
    return res.status(400).json({ msg: "No se puede validar la cuenta" });

  const administradorBDD = await Administrador.findOne({
    token: req.params.token,
  });

  if (!administradorBDD?.token)
    return res.status(409).json({ msg: "La cuenta ya ha sido confirmada" });

  administradorBDD.token = null;
  administradorBDD.confirmEmail = true;

  await administradorBDD.save();

  res.status(200).json({ msg: "Token confirmado, ya puedes iniciar sesión" });
};

// Método para actualizar el perfil
const actualizarPerfil = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ msg: "Debe ser un ID válido" });

  if (Object.values(req.body).includes(""))
    return res.status(400).json({ msg: "Debes llenar todos los campos" });
  if(req.body.password){
    return res
      .status(400)
      .json({ msg: `Lo sentimos, no se debe actualizar el password en este formulario` });
  }
  const administradorBDD = await Administrador.findById(id);

  if (!administradorBDD)
    return res
      .status(404)
      .json({ msg: `No existe el administrador con ID ${id}` });

  if (administradorBDD.email !== req.body.email) {
    const administradorBDDMail = await Administrador.findOne({
      email: req.body.email,
    });
    if (administradorBDDMail)
      return res.status(409).json({ msg: "El email ya está registrado" });
  }

  administradorBDD.nombre = req.body.nombre || administradorBDD?.nombre;
  administradorBDD.apellido = req.body.apellido || administradorBDD?.apellido;
  administradorBDD.email = req.body.email || administradorBDD?.email;
  administradorBDD.telefono = req.body.telefono || administradorBDD?.telefono;
  administradorBDD.direccion = req.body.direccion || administradorBDD?.direccion;

  await administradorBDD.save();

  res.status(200).json({ msg: "Perfil actualizado correctamente" });
};

// Método para actualizar el password
const actualizarPassword = async (req, res) => {
  const { _id, passwordactual, passwordnuevo } = req.body;

  if (!_id || !passwordactual || !passwordnuevo) {
    return res.status(400).json({ msg: "Faltan campos obligatorios" });
  }

  const administradorBDD = await Administrador.findById(_id);
  if (!administradorBDD) {
    return res.status(404).json({ msg: "No existe el administrador" });
  }

  const verificarPassword = await administradorBDD.matchPassword(passwordactual);
  if (!verificarPassword) {
    return res.status(401).json({ msg: "La contraseña actual no es correcta" });
  }

  administradorBDD.password = await administradorBDD.encrypPassword(passwordnuevo);
  await administradorBDD.save();

  res.status(200).json({ msg: "Contraseña actualizada correctamente" });
};

// Método para recuperar el password
const recuperarPassword = async (req, res) => {
  const { email } = req.body;

  if (Object.values(req.body).includes(""))
    return res.status(400).json({ msg: "Debes llenar todos los campos" });

  // Buscar en ambos modelos
  let user = await Administrador.findOne({ email });
  if (!user) user = await Estudiante.findOne({ email });
  
  if (!user)
    return res.status(404).json({ msg: "El usuario no está registrado" });

  // Generar y guardar token
  const token = user.crearToken();
  user.token = token;
  await user.save();

  await sendMailToRecoveryPassword(email, token);

  res
    .status(200).json({ msg: "Revisa tu correo electrónico para restablecer tu cuenta" });
};
// Método para comprobar el token
const comprobarTokenPassword = async (req, res) => {
  const { token } = req.params;
  
  if (!token)
    return res.status(400).json({ msg: "No se puede validar la cuenta" });

  // Buscar en ambos modelos
  let user = await Administrador.findOne({ token });
  if (!user) user = await Estudiante.findOne({ token });

  if (!user || user.token !== token)
    return res.status(401).json({ msg: "Token invalido o expirado" });

  res.status(200).json({ msg: "Token confirmado, ya puedes crear tu nueva contraseña" });
};

// Método para crear el nuevo password
const nuevoPassword = async (req, res) => {
  const { password, confirmpassword } = req.body;
  const { token } = req.params;

  if (Object.values(req.body).includes(""))
    return res.status(400).json({ msg: "Debes llenar todos los campos" });

  if (password !== confirmpassword)
    return res.status(400).json({ msg: "Las contraseñas no coinciden" });

  // Buscar en ambos modelos
  let user = await Administrador.findOne({ token });
  if (!user) user = await Estudiante.findOne({ token });

  if (!user || user.token !== token)
    return res.status(401).json({ msg: "Token inválido o expirado" });

  // Actualizar contraseña y eliminar token
  user.token = null;
  user.password = await user.encrypPassword(password);
  await user.save();

  res.status(200).json({
    msg: "Contraseña actualizada correctamente, ya puedes iniciar sesión",
  });
};

export {
  login,
  perfil,
  registro,
  confirmEmail,
  actualizarPerfil,
  actualizarPassword,
  recuperarPassword,
  comprobarTokenPassword,
  nuevoPassword,
};
