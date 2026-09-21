/*const API_URL = "http://localhost:3000/api/tareas";

const TodasLasTareas = document.getElementById("tareas");
const editTarea = document.getElementById("tareasEditables");

let tareaIdEnEdicion = null;
let urlArchivoExistente = "";

// Función para parsear archivos de Supabase sin romper nada
function parsearArchivos(tareaData) {
    if (Array.isArray(tareaData.archivos)) return tareaData.archivos;
    if (!tareaData.archivo) return [];
    try { 
        const res = JSON.parse(tareaData.archivo);
        return Array.isArray(res) ? res : [{ url: tareaData.archivo, nombre: tareaData.archivo.split('/').pop() }];
    } catch { 
        return [{ url: tareaData.archivo, nombre: tareaData.archivo.split('/').pop() }]; 
    }
}

// Título del modal
const tituloModal = document.createElement('h2');
tituloModal.textContent = "Editar Tarea";
tituloModal.classList.add('titulo-modal');

// Inputs
const editTareaNombre = document.createElement('input');
const editTareaDias = document.createElement('input');
const editTareaDescripcion = document.createElement('input');
const editTareaArchivo = document.createElement('input');

editTareaNombre.type = "text"; 
editTareaNombre.placeholder = "Inserte el nombre de su tarea";

editTareaDias.type = "date"; 

editTareaDescripcion.type = "text";
editTareaDescripcion.placeholder = "Aquí escribes detalles de tu tarea";

editTareaArchivo.type = "file";
editTareaArchivo.accept = "application/pdf"; 

// Botones del modal
const contenedorBotones = document.createElement('div');
contenedorBotones.classList.add('modal-botones');

const btnGuardar = document.createElement('button');
btnGuardar.textContent = "Guardar 💾";
btnGuardar.classList.add('button');

const btnCancelar = document.createElement('button');
btnCancelar.textContent = "Cancelar 🚫";
btnCancelar.type = "button";
btnCancelar.classList.add('button', 'btn-cancelar');

btnCancelar.addEventListener('click', () => {
    editTarea.close();
});

btnGuardar.addEventListener('click', async () => {
    let urlArchivo = urlArchivoExistente;
    let nombreArchivo = "";

    // 1. Subida del archivo si se seleccionó uno
    if (editTareaArchivo.files.length > 0) {
        const formData = new FormData();
        const file = editTareaArchivo.files[0];
        formData.append('pdf', file);
        nombreArchivo = file.name;

        try {
            const resUpload = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData
            });

            const uploadResult = await resUpload.json();

            if (!resUpload.ok) {
                alert("Error al subir el archivo PDF: " + (uploadResult.error || ""));
                return;
            }

            urlArchivo = uploadResult.url;
        } catch (err) {
            console.error("Error en la subida del PDF:", err);
            return;
        }
    }

    const listaArchivos = urlArchivo ? [{ url: urlArchivo, nombre: nombreArchivo || urlArchivo.split('/').pop() }] : [];

    // 2. Payload compatible con Supabase (Texto y Array)
    const payload = {
        nombre: editTareaNombre.value,
        dias: editTareaDias.value || null,
        descripcion: editTareaDescripcion.value,
        archivo: JSON.stringify(listaArchivos),
        archivos: listaArchivos
    };

    try {
        if (tareaIdEnEdicion) {
            await fetch(`${API_URL}/${tareaIdEnEdicion}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        editTarea.close();
        cargarTareas();
    } catch (error) {
        console.error("Error al guardar la tarea:", error);
    }
});

contenedorBotones.appendChild(btnGuardar);
contenedorBotones.appendChild(btnCancelar);

// Botón flotante (+)
const btnCrearFlotante = document.createElement('button');
btnCrearFlotante.textContent = "+";
btnCrearFlotante.classList.add('btn-flotante');

btnCrearFlotante.addEventListener('click', () => {
    tareaIdEnEdicion = null;
    urlArchivoExistente = "";
    tituloModal.textContent = "Nueva Tarea";
    editTareaNombre.value = "";
    editTareaDias.value = "";
    editTareaDescripcion.value = "";
    editTareaArchivo.value = "";
    
    editTarea.showModal();
});

document.body.appendChild(btnCrearFlotante);
editTarea.replaceChildren(tituloModal, editTareaNombre, editTareaDias, editTareaDescripcion, editTareaArchivo, contenedorBotones);

// Eliminar Tarea
async function eliminarTarea(id) {
    if (!confirm("¿Estás seguro de que querés eliminar esta tarea?")) return;

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (respuesta.ok) cargarTareas();
    } catch (error) {
        console.error("Error de conexión al eliminar la tarea:", error);
    }
}

// Cargar y mostrar tareas
async function cargarTareas() {
    TodasLasTareas.replaceChildren();
    
    try {
        const respuesta = await fetch(API_URL);
        const tareas = await respuesta.json();

        if (!respuesta.ok || !Array.isArray(tareas)) return;

        tareas.forEach(tareaData => {
            const tareaNode = document.createElement('div');
            tareaNode.classList.add('tareasFuncionales');
            
            // 1. Título
            const tituloEl = document.createElement('h3');
            tituloEl.textContent = tareaData.nombre || 'Sin título';
            
            // 2. Días
            const fechaEl = document.createElement('p');
            fechaEl.classList.add('fecha-tarea');
            fechaEl.textContent = tareaData.dias ? `🕒${tareaData.dias}` : '';

            // 3. Descripción
            const descEl = document.createElement('p');
            descEl.classList.add('desc-tarea');
            descEl.textContent = tareaData.descripcion || '';

            tareaNode.appendChild(tituloEl);
            tareaNode.appendChild(fechaEl);
            tareaNode.appendChild(descEl);

            // 4. Archivos PDFs
            const listaPDFs = parsearArchivos(tareaData);

            listaPDFs.forEach(adj => {
                const linkPdf = document.createElement('a');
                linkPdf.href = adj.url;
                linkPdf.textContent = `📄 ${adj.nombre || 'Archivo.pdf'}`;
                linkPdf.target = "_blank";
                linkPdf.classList.add('btn-pdf');
                tareaNode.appendChild(linkPdf);
            });
            
            // 5. Botones de acción
            const accionesNode = document.createElement('div');
            accionesNode.classList.add('acciones-tarea');

            const btnEditar = document.createElement('button');
            btnEditar.textContent = "Editar 📝 ";
            btnEditar.classList.add('button');
            btnEditar.addEventListener('click', () => {
                tareaIdEnEdicion = tareaData.id;
                
                const archivos = parsearArchivos(tareaData);
                urlArchivoExistente = archivos.length > 0 ? archivos[0].url : "";
                
                tituloModal.textContent = "Editar Tarea";
                editTareaNombre.value = tareaData.nombre || "";
                editTareaDias.value = tareaData.dias || "";
                editTareaDescripcion.value = tareaData.descripcion || "";
                editTareaArchivo.value = "";
                
                editTarea.showModal();
            });

            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = "Borrar ❌ ";
            btnEliminar.classList.add('button');
            btnEliminar.addEventListener('click', () => {
                eliminarTarea(tareaData.id);
            });

            accionesNode.appendChild(btnEditar);
            accionesNode.appendChild(btnEliminar);

            tareaNode.appendChild(accionesNode);
            TodasLasTareas.appendChild(tareaNode);
        });
    } catch (error) {
        console.error("Error de conexión al cargar las tareas:", error);
    }
}

// Carga inicial
cargarTareas();
*/