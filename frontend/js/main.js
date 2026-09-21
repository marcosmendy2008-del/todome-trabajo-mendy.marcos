    import { obtenerTareasAPI, eliminarTareaAPI } from './api.js';
    import { abrirModal, inicializarModal, confirmarEliminacion } from './modal.js';

    const contenedorTareas = document.getElementById("tareas");

function parsearArchivos(tareaData) {
    // Si ya viene como Array directo
    if (Array.isArray(tareaData.archivos)) return tareaData.archivos;
    
    // Si el campo no existe o viene nulo
    if (!tareaData.archivos) return [];

    // Si viene como string JSON desde la base de datos
    if (typeof tareaData.archivos === 'string') {
        try {
            const res = JSON.parse(tareaData.archivos);
            if (Array.isArray(res)) return res;
            return [{ url: tareaData.archivos, nombre: 'Archivo.pdf' }];
        } catch {
            return [{ url: tareaData.archivos, nombre: 'Archivo.pdf' }];
        }
    }

    return [];
}

    async function cargarTareas() {
        contenedorTareas.replaceChildren();

        try {
            const tareas = await obtenerTareasAPI();
            if (!Array.isArray(tareas)) return;

            tareas.forEach(tarea => {
                const nodoTarea = crearTarjetaTarea(tarea);
                contenedorTareas.appendChild(nodoTarea);
            });
        } catch (err) {
            console.error("Error al cargar tareas:", err);
        }
    }

    function crearTarjetaTarea(tarea) {
        const card = document.createElement('div');
        card.classList.add('tareasFuncionales');

        const titulo = document.createElement('h3');
        titulo.textContent = tarea.nombre || 'Sin título';

        const fecha = document.createElement('p');
        fecha.classList.add('fecha-tarea');
        fecha.textContent = tarea.dias ? `Vence pronto🕒: ${tarea.dias}` : '';

        const desc = document.createElement('p');
        desc.classList.add('desc-tarea');
        desc.textContent = tarea.descripcion || '';

        card.append(titulo, fecha, desc);

        const archivos = parsearArchivos(tarea);
        archivos.forEach(adj => {
            const link = document.createElement('a');
            link.href = adj.url;
            link.textContent = `📄 ${adj.nombre || 'Archivo.pdf'}`;
            link.target = "_blank";
            link.classList.add('btn-pdf');
            card.appendChild(link);
        });

        const acciones = document.createElement('div');
        acciones.classList.add('acciones-tarea');

        const btnEditar = document.createElement('button');
        btnEditar.textContent = "Editar 📝";
        btnEditar.classList.add('button');
        btnEditar.addEventListener('click', () => abrirModal(tarea));

        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = "Borrar ❌";
        btnEliminar.classList.add('button');

        btnEliminar.addEventListener('click', async () => {
            const confirmado = await confirmarEliminacion();
            
            if (confirmado) {
                await eliminarTareaAPI(tarea.id);
                cargarTareas();
            }
        });

        acciones.append(btnEditar, btnEliminar);
        card.appendChild(acciones);

        return card;
    }

    // Botón flotante para nueva tarea
    const btnCrearFlotante = document.createElement('button');
    btnCrearFlotante.textContent = "+";
    btnCrearFlotante.classList.add('btn-flotante');
    btnCrearFlotante.addEventListener('click', () => abrirModal());
    document.body.appendChild(btnCrearFlotante);

    // Inicializar la app
    inicializarModal(cargarTareas);
    cargarTareas();
