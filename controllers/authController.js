const passport = require('passport');
const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const Usuarios = mongoose.model('Usuarios');
const crypto = require('crypto');
const enviarEmail = require('../handlers/email');

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'El campo usuario y contraseña son obligatorios'
});

//Revisar si está autenticado el usuario
exports.verificarUsuario = (req, res, next) => {
    //Revisar usuario
    if(req.isAuthenticated()){
        return next();
    } else {
        res.redirect('/iniciar-sesion');
    }
}

exports.cerrarSesion = (req, res) => {
    // Forma 1
    // req.session.destroy(() => {
    //     req.flash('correcto', 'Se ha cerrado la sesión correctamente');
    //     res.redirect('/iniciar-sesion');
    // });

    //Forma 2
    req.logout();
    req.flash('correcto', 'Se ha cerrado la sesión correctamente');
    res.redirect('/iniciar-sesion');
};

exports.mostrarPanel = async (req, res) => {
    //Consultar vacaciones del usuario autenticado
    const vacantes = await Vacante.find({ autor: req.user._id });

    console.log(vacantes);

    res.render('usuarios/administracion', {
        nombrePagina: 'Panel de Administración',
        tagLine: 'Crea y administra tus vacantes aquí',
        cerrarSesion: true,
        usuario: req.user.nombre,
        imagen: req.user.imagen,
        vacantes
    });
}

//Formulario para reiniciar el password
exports.formReestablecerPassword = (req, res) => {
    res.render('usuarios/reesteblacer-password', {
        nombrePagina: 'Reestablece tu contraseña',
        tagLine: 'Si ya tienes una cuenta pero olvidaste tu password, coloca tu correo electrónico'
    })
}

//Genera el token en la tabla de usuario
exports.enviarToken = async (req, res) => {
    const usuario = await Usuarios.findOne({ email: req.body.email });

    //Si no existe
    if(!usuario){
        req.flash('error', 'No existe la cuenta');
        res.redirect('/reestablecer-password');
        return;
    }

    ///EL usuario existe, se genera el token
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000;
    
    //Guardar datos
    await usuario.save();

    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;
    // console.log(req);
    // console.log(resetUrl);
    
    //Enviar notificación por email
    const mail = await enviarEmail.enviar({
        usuario,
        subject: 'Reestablecer contraseña',
        resetUrl,
        archivo: 'reset'
    });

    // console.log(mail);

    req.flash('correcto', 'Revisa tu correo para las indicaciones');
    res.redirect('/iniciar-sesion');
}

//validar si el token es válido y el usuario existe, muestra la vista
exports.reestablecerPassword = async(req, res) => {
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now()
        }
    });

    if(!usuario){
        req.flash('error', 'No es válido el proceso para reestablecer contraseña');
        res.redirect('/reestablecer-password');
    }

    //Todo bien muestra el formulario
    res.render('usuarios/nuevo-password', {
        nombrePagina: 'Nuevo password',
        tagLine: 'Ingresa tu nueva contraseña para recuperar tu cuenta'
    });
}

//Almacena el nuevo password en la BD
exports.guardarPassword = async (req, res) => {
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now()
        }
    });

    if(!usuario){
        req.flash('error', 'No es válido el proceso para reestablecer contraseña');
        res.redirect('/reestablecer-password');
        return;
    }

    //Guardar en la base de datos con nuevo pass y limpiar datos
    usuario.password = req.body.password;
    usuario.token = undefined;
    usuario.expira = undefined;

    //Guardar datos
    await usuario.save();

    //Redireccionar
    req.flash('correcto', 'Contraseña actualizada correctamente');
    res.redirect('/iniciar-sesion');
}