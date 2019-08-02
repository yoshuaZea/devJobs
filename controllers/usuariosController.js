//Forma 2 - Importar modelo
const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuarios');
const multer = require('multer');
const shortId = require('shortid');


/**** Método para subir imagen ******/
exports.subirImagen = (req, res, next) => {
    upload(req, res, function(error){
        // console.log(error); //Imprimir errores
        if(error){
            if(error instanceof multer.MulterError){ //Error de multer
                if(error.code === 'LIMIT_FILE_SIZE'){
                    req.flash('error', 'El archivo es muy grande, máximo 500Kb');
                } else {
                    req.flash('error', error.message);
                }
            } else { //Errores de validaciones
                // console.log(error.message);
                req.flash('error', error.message);
            }
            res.redirect('/administracion');
            return; //Detiene la ejecución de los middleware si hay error de formato

        } else {
            return next();
        }
    });

}

const configuracionMulter = {
    //Donde se van a almacenar los archivos
    limits : { 
        fileSize : 500000  //Tamaño en bytes - Limitar tamaño del archivo
    }, 
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, callback) => { //Donde se alojaran los archivos subidos
            callback(null, __dirname + '../../public/uploads/perfiles');
        },
        filename: (req, file, callback) => {
            //Extrae el formato el archivo
            const extension = file.mimetype.split('/')[1];

            // callback(null, file);
            callback(null, `${shortId.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, callback){ //Filtrar tipos de archivo permitidos
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg'){
            //El callback se ejecuta como true o false : true cuando se acepta la imagen
            callback(null, true);
        } else {
            callback(new Error('Formato no válido'), false);
        }
    }
}

const upload = multer(configuracionMulter).single('imagen');

/**** Fin Método para subir imagen ******/

//Crear una cuenta de usuario
exports.formCrearCuenta = (req, res) => {
    res.render('usuarios/crear-cuenta', {
        nombrePagina: 'Crear tu cuenta en devJobs',
        tagLine: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta ¡Ya!'
    });
}

//Validar registros
exports.validarRegistro = (req, res, next) => {
    //Sanitizar los campos
    req.sanitizeBody('nombre').escape();
    req.sanitizeBody('email').escape();
    req.sanitizeBody('password').escape();
    req.sanitizeBody('confirmar').escape();

    // console.log(req.body); //Imprimir lo que viene del formulario

    //Validaciones
    req.checkBody('nombre', 'El nombre es obligatorio').notEmpty();
    req.checkBody('email', 'El email debe ser válido').notEmpty().isEmail();
    req.checkBody('password', 'El campo contraseña no puede ser vacío').notEmpty();
    req.checkBody('confirmar', 'El campo confirmar contraseña no puede ser vacío').notEmpty();
    req.checkBody('password', 'El password no coincide, vuelve a intentarlo').equals(req.body.confirmar);

    const errores = req.validationErrors();
    // console.log(errores);

    if(errores){
        req.flash('error', errores.map(err_msj => err_msj.msg));
        res.render('usuarios/crear-cuenta', {
            nombrePagina: 'Crear tu cuenta en devJobs',
            tagLine: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta ¡Ya!',
            mensajes: req.flash()
        });
    }

    //Si la validación es correcta
    next();
}

//Crear la cuenta en la BD
exports.crearCuenta = async (req, res) => {
    const usuario = new Usuarios(req.body);
    // console.log(usuario);

    try{
        await usuario.save();
        res.redirect('/iniciar-sesion');
    } catch(error){
        req.flash('error', error);
        res.redirect('/crear-cuenta');
    }

}

//Formulario para iniciar sesión
exports.formIniciarSesion = (req, res) => {
    res.render('usuarios/iniciar-sesion', {
        nombrePagina: 'Iniciar sesión devJobs'
    })
}

//Formulario para editar perfil
exports.formEditarPerfil =(req, res) =>{
    res.render('usuarios/editar-perfil', {
        nombrePagina: 'Edita tu perfil en devJobs',
        datos_usr: req.user,
        cerrarSesion: true,
        usuario: req.user.nombre,
        imagen: req.user.imagen
    })
}

exports.editarPerfil = async (req, res) => {
    const usuario = await Usuarios.findById(req.user._id);
    
    // console.log(req.body);

    usuario.nombre = req.body.nombre;
    usuario.email = req.body.email;

    if(req.body.password){
        usuario.password = req.body.password;
    }

    //con MULTER req.file para obtener los archivos enviados desde el form 
    // console.log(req.file);
    
    if(req.file){
        usuario.imagen = req.file.filename;
    }

    await usuario.save();

    req.flash('correcto', 'Se actualizó el usuario correctamente');
    res.redirect('/administracion');

}

//Validar y sanitizar los campos de las vacantes
exports.validarPerfil = (req, res, next) => {
    //Sanitizar los campos
    req.sanitizeBody('nombre').escape();
    req.sanitizeBody('email').escape();
    if(req.body.password){
        req.sanitizeBody('password').escape();
    }

    //Validaciones
    req.checkBody('nombre', 'El nombre no puede ir vacío').notEmpty();
    req.checkBody('email', 'El correo no puede ir vacío').notEmpty();

    const errores = req.validationErrors();

    if(errores){
        //Recargar la vista con los errores
        req.flash('error', errores.map(err_msj => err_msj.msg));
        res.render('usuarios/editar-perfil', {
            nombrePagina: 'Edita tu perfil en devJobs',
            datos_usr: req.user,
            cerrarSesion: true,
            usuario: req.user.nombre,
            mensajes: req.flash(),
            imagen: req.user.imagen
        });
    }

    next(); //Siguiente middleware
}