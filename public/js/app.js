import axios from 'axios';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', () => {
    const skills = document.querySelector('.lista-conocimientos');

    //Limpiar alertas
    let alertas = document.querySelector(".alertas");

    if(alertas){
        limpiarAlertas();
    }

    if(skills){
        skills.addEventListener('click', agregarSkills);

        //Una vez que estamos en editar, llamar la función
        skillsSeleccionados();
    }

    const vacantesListado = document.querySelector('.panel-administracion');

    if(vacantesListado){
        vacantesListado.addEventListener('click', accionesListado);
    }
});

//Crear un objeto único
const skills = new Set();

const agregarSkills = (e) => {
    if(e.target.tagName == "LI"){
        if(e.target.classList.contains('activo')){
            skills.delete(e.target.textContent);
            e.target.classList.remove('activo');
        } else {
            //Agregarlo al set y agregar clase
            skills.add(e.target.textContent);
            e.target.classList.add('activo');
        }
        // console.log(skills);
    }

    //Convertir el set a algo fácil de leer, una cadena
    const skillsArray = [...skills];

    //Asignar los skills (set) al input 
    document.querySelector('#skills').value = skillsArray;
}

const skillsSeleccionados = () => {
    //Array.form - convierte a un arragle uno NodeList
    const seleccionadas = Array.from(document.querySelectorAll('.lista-conocimientos .activo'));

    //Iterar en cada elemento del array
    seleccionadas.forEach(seleccionada => {
        skills.add(seleccionada.textContent); 
    });

    //Inyectarlo en el hidden
    const skillsArray = [...skills];
    document.querySelector('#skills').value = skillsArray;


    // console.log(seleccionadas);
}

const limpiarAlertas = () => {
    const alertas = document.querySelector(".alertas");

    const intervalo = setInterval(() => {
        if(alertas.children.length > 0){
            alertas.removeChild(alertas.children[0]);
        } else if(alertas.children.length === 0){
            alertas.parentElement.removeChild(alertas);
            clearInterval(intervalo);
        }
    }, 2000);
}

//Eliminar vacantes
const accionesListado = (e) => {
    e.preventDefault();
    // console.log(e.target);

    if(e.target.dataset.eliminar){
        //Eliminar por medio de axios
        // console.log(e.target.dataset.eliminar);
        Swal.fire({
            title: '¿Deseas eliminar esta vacante?',
            text: "Una vez eliminada, no se puede recuperar!",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, Eliminar',
            cancelButtonText: 'No, Cancelar'
        }).then((result) => {
            if (result.value) {
                //URL para enviar petición
                const url = `${location.origin}/vacante/eliminar/${e.target.dataset.eliminar}`;

                //Axios para eliminar el registro
                axios.delete(url, { params: {url} })
                    .then(function(respuesta){
                        
                        console.log(respuesta); //Imprimir todo array de AXIOS

                        if(respuesta.status === 200){
                            //Para ver todo 

                            Swal.fire(
                                'Eliminado!',
                                respuesta.data,
                                'success'
                            );

                            //TODO: Eliminar del DOM la vacante
                            let elemento = e.target.parentElement.parentElement;
                            elemento.parentElement.removeChild(elemento);

                        }
                    })
                    .catch(() => {
                        Swal.fire({
                            type: 'error',
                            title: 'Hubo un error',
                            text: 'No se pudo eliminar la vacante'
                        });
                    })

            }
          })

    } else if(e.target.tagName === 'A'){ //Igual a un enlace
        // console.log(e.target.href);
        window.location.href = e.target.href;
    }
}

