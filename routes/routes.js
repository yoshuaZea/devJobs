const express = require('express');
const router = express.Router();

//Importar cControladores
const homeController = require('../controllers/homeController');
const vacantesController = require('../controllers/vacantesController');
const usuariosController = require('../controllers/usuariosController');
const authController = require('../controllers/authController');

module.exports = () => {
    /******************************* INICIO *******************************/
    router.get('/', homeController.mostrarTrabajos);


    /******************************* USUARIOS *******************************/
    //Crear cuentas de usuario
    router.get('/crear-cuenta', usuariosController.formCrearCuenta);
    router.post('/crear-cuenta', 
        usuariosController.validarRegistro,
        usuariosController.crearCuenta);

    //Panel de administración
    router.get('/administracion', 
        authController.verificarUsuario,
        authController.mostrarPanel);
    
    //Editar perfil
    router.get('/editar-perfil', 
        authController.verificarUsuario,
        usuariosController.formEditarPerfil);

    router.post('/editar-perfil', 
        authController.verificarUsuario,
        // usuariosController.validarPerfil,
        usuariosController.subirImagen,
        usuariosController.editarPerfil);

    //Cerrar sesión
    router.get('/cerrar-sesion', 
        authController.verificarUsuario,
        authController.cerrarSesion);

    //Resetear password
    router.get('/reestablecer-password', authController.formReestablecerPassword);
    router.post('/reestablecer-password', authController.enviarToken);

    //Resetear password (Almacenar en BD)
    router.get('/reestablecer-password/:token', authController.reestablecerPassword);
    router.post('/reestablecer-password/:token', authController.guardarPassword);

    /******************************* VACANTES *******************************/
    //Autenticar usuarios
    router.get('/iniciar-sesion', usuariosController.formIniciarSesion);
    router.post('/iniciar-sesion', 
        authController.autenticarUsuario,
        usuariosController.formIniciarSesion);

    //Crear vacantes
    router.get('/vacantes/nueva', 
        authController.verificarUsuario,
        vacantesController.formularioNuevaVacante);
    router.post('/vacantes/nueva', 
        authController.verificarUsuario,
        vacantesController.validarVacante,
        vacantesController.agregarVacante);

    //Mostrar vacante (singular)
    router.get('/vacante/:url', vacantesController.mostrarVacante);

    //Editar vacante
    router.get('/vacante/editar/:url', 
        authController.verificarUsuario, 
        vacantesController.formEditarVacante);
    router.post('/vacante/editar/:url', 
        authController.verificarUsuario,
        vacantesController.validarVacante,
        vacantesController.editarVacante);

    router.delete('/vacante/eliminar/:id', vacantesController.eliminarVacante);

    /******************************* RECLUTADORES *******************************/
    router.post('/vacante/:url', 
        vacantesController.subirCV, 
        vacantesController.contactar);

    //Muestra los candidatos por vacante
    router.get('/candidatos/:id',
        authController.verificarUsuario,
        vacantesController.mostrarCandidatos
    );

    //Buscador de vacantes
    router.post('/buscador', vacantesController.buscarVacantes);

    return router;
}