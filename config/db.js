const mongoose = require('mongoose');
require('dotenv').config({path: 'variables.env'});

//Conectar con mongoDB
mongoose.connect(process.env.DATABASE, {
    useNewUrlParser: true
});

mongoose.connection.on('error', (error) => {
    console.log(error);
});


//Importar los modelos a la BD Mongo
require('../models/Vacantes');
require('../models/Usuarios');