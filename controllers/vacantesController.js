//Forma 1 - Importar modelo
// const Vacante = require('../models/Vacantes');

//Forma 2 - Importar modelo
const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const multer = require('multer');
const shortId = require('shortid');


exports.formularioNuevaVacante = (req, res) => {
    res.render('vacantes/nueva-vacante', {
        nombrePagina: 'Nueva vacante',
        tagLine: 'Llena el formulario y publica tu vacante',
        cerrarSesion: true,
        usuario: req.user.nombre,
        imagen: req.user.imagen
    })
}

//Agregar las vacantes a la BD
exports.agregarVacante = async (req, res) => {
    // console.log(req.body);
    const vacante = new Vacante(req.body);

    //Obtener datos de la sesión de usuario
    vacante.autor = req.user._id;

    // console.log(req.user);

    //Crear arreglo de habilidades (skills)
    vacante.skills = req.body.skills.split(','); //Split crea el arrelgo

    //Almacenarlo en la BD
    const nuevaVacante = await vacante.save();

    //Redireccionar
    res.redirect(`/vacante/${nuevaVacante.url}`);
}

//Muestra una vacante
exports.mostrarVacante = async (req, res, next) => {
    const vacante = await Vacante.findOne({ url: req.params.url }).populate('autor');

    console.log(vacante);

    //Si no hay resultados
    if(!vacante) return next();

    res.render('vacantes/vacante',{
        nombrePagina: vacante.titulo,
        vacante,
        barra: true
    });
}

//Editar vacante
exports.formEditarVacante = async (req, res, next) => {

    const vacante = await Vacante.findOne({ url: req.params.url });

    if(!vacante) return next();

    res.render('vacantes/editar-vacante', {
        vacante,
        nombrePagina: `Editar - ${vacante.titulo}`,
        cerrarSesion: true,
        usuario: req.user.nombre,
        imagen: req.user.imagen
    });
}

exports.editarVacante = async (req, res) => {
    const vacanteActualizada = req.body;

    vacanteActualizada.skills = req.body.skills.split(',');

    const vacante = await Vacante.findOneAndUpdate({
        url: req.params.url 
        },
        vacanteActualizada,
        {
            new: true,
            runValidators: true
        }
    );
    
    res.redirect(`/vacante/${vacante.url}`);


    console.log(vacanteActualizada);
}

//Validar y sanitizar los campos de las vacantes
exports.validarVacante = (req, res, next) => {
    //Sanitizar los campos
    req.sanitizeBody('titulo').escape();
    req.sanitizeBody('empresa').escape();
    req.sanitizeBody('ubicacion').escape();
    req.sanitizeBody('salario').escape();
    req.sanitizeBody('contrato').escape();
    req.sanitizeBody('skills').escape();

    //Validaciones
    req.checkBody('titulo', 'Agrega un título para la vacante').notEmpty();
    req.checkBody('empresa', 'Agrega el nombre de la empresa').notEmpty();
    req.checkBody('ubicacion', 'Agrega la ubicación de la vacante').notEmpty();
    req.checkBody('contrato', 'Selecciona un tipo de contrato').notEmpty();
    req.checkBody('skills', 'Agrega algun conocimiento').notEmpty();

    const errores = req.validationErrors();

    if(errores){
        //Recargar la vista con los errores
        req.flash('error', errores.map(err_msj => err_msj.msg));
        res.render('vacantes/nueva-vacante', {
            nombrePagina: 'Nueva vacante',
            tagLine: 'Llena el formulario y publica tu vacante',
            cerrarSesion: true,
            usuario: req.user.nombre,
            mensajes: req.flash()
        });
    }

    next(); //Siguiente middleware
}

//Eliminar vacante
exports.eliminarVacante = async(req, res) => {
    const { id } = req.params;

    const vacante = await Vacante.findById(id);

    // console.log(vacante);
    if(verificarAutor(vacante, req.user)){
        //Todo bien, es el usuario que subió la vacante

        vacante.remove(); //Eliminar de la BD

        res.status(200).send('Vacante eliminada correctamente');
    } else {
        //No permitido
        res.status(403).send('Error');
    }
}

const verificarAutor = (vacante = {}, usuario = {}) => {
    if(vacante.autor.equals(usuario._id))
        return true;
    else 
        return true;
};

/******** Subir archivo en PDF con multer ********/
exports.subirCV = (req, res, next) => {
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
            res.redirect('back');//Regresa a la misma página

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
            callback(null, __dirname + '../../public/uploads/cv');
        },
        filename: (req, file, callback) => {
            //Extrae el formato el archivo
            const extension = file.mimetype.split('/')[1];

            // callback(null, file);
            callback(null, `${shortId.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, callback){ //Filtrar tipos de archivo permitidos
        if(file.mimetype === 'application/pdf'){
            //El callback se ejecuta como true o false : true cuando se acepta la imagen
            callback(null, true);
        } else {
            callback(new Error('Formato no válido, solo archivos PDF'), false);
        }
    }
}

const upload = multer(configuracionMulter).single('cv');

//Almacenar candidatos en la BD
exports.contactar = async (req, res, next) => {

    const vacante = await Vacante.findOne({ url: req.params.url});

    //Si no existe vacante
    if(!vacante) return next();

    //Construir el nuevo objeto
    const nuevoCandidato = {
        nombre: req.body.nombre,
        email: req.body.email,
        cv: req.file.filename
    }

    //Almacenar la vacante
    vacante.candidatos.push(nuevoCandidato);
    await vacante.save();

    req.flash('correcto', 'Se envió el tu CV correctamente');
    res.redirect('/');
}

exports.mostrarCandidatos = async (req, res, next) => {
    const vacante = await Vacante.findById(req.params.id);

    //Validaciones
    if(vacante.autor != req.user._id.toString()) return next();
    if(!vacante) return next();

    res.render('vacantes/candidatos', {
            nombrePagina: `Candidatos de la vacante ${vacante.titulo}`,
            cerrarSesion: true,
            nombre: req.user.nombre,
            imagen: req.user.imagen,
            candidatos: vacante.candidatos
        }
    )
}

exports.buscarVacantes = async (req, res, next) => {
    const vacantes = await Vacante.find({
        $text : {
            $search : req.body.q
        }
    });

    //Mostrar vacante
    res.render('home', {
        nombrePagina: `Resultados para la búsqueda: ${req.body.q}`,
        barra: true,
        vacantes
    });

    console.log(vacante);
};