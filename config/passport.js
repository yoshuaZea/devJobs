const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuarios');

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
    }, async (email, contrasena, done) => {
        const usuario = await Usuarios.findOne({
            email: email
        });

        //Si no existe el usuario
        if(!usuario) return done(null, false, {
            message: 'El usuario no existe'
        });

        //Si el usuario existe
        const verificarPassword = usuario.compararPassword(contrasena);

        if(!verificarPassword) return done(null, false, {
            message: 'La contraseña es incorrecta'
        });

        //El usuario existe y coincide el password
        return done(null, usuario);
    }
));


passport.serializeUser((usuario, done) => done(null, usuario._id));

passport.deserializeUser(async (id, done) => {
    const usuario = await Usuarios.findById(id).exec();
    return done(null, usuario);
});

module.exports = passport;