import { subirArchivoAPI, guardarTareaAPI } from './api.js';

let tareaIdEnEdicion = null;
let archivosListaModal = [];

function crearInput(type, placeholder = '') {
    const input = document.createElement('input');
    input.type = type;
    if (placeholder) input.placeholder = placeholder;
    return input;
}

function crearBoton(texto, clases, type = 'button') {
    const btn = document.createElement('button');
    btn.textContent = texto;
    btn.type = type;
    btn.classList.add(...clases);
    return btn;
}
function obtenerInfoFecha(fechaStr) {
    if (!fechaStr) return null;

    // 1. Extraer la parte YYYY-MM-DD por si viene con timestamp de Supabase
    const limpia = fechaStr.split('T')[0];
    const [year, month, day] = limpia.split('-').map(Number);

    // 2. Formatear la fecha a texto legible (ej: "20/05/2026")
    const fechaFormateada = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

    // 3. Calcular los días restantes
    const hoy = new Date();
    const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fechaLimite = new Date(year, month - 1, day);

    const diferenciaMs = fechaLimite - fechaHoy;
    const diasRestantes = Math.round(diferenciaMs / (1000 * 60 * 60 * 24));

    return {
        fecha: fechaFormateada,
        dias: diasRestantes
    };
}

const modal = document.getElementById("tareasEditables");

const tituloModal = document.createElement('h2');
tituloModal.classList.add('titulo-modal');

const editTareaNombre = crearInput('text', 'Inserte el nombre de su tarea');
const editTareaDias = crearInput('date');

const editTareaDescripcion = crearInput('text', 'Aquí escribes detalles de tu tarea');

const editTareaArchivo = document.createElement('input');
editTareaArchivo.type = "file";
editTareaArchivo.accept = "application/pdf";
editTareaArchivo.multiple = true;
editTareaArchivo.style.display = "none";

const btnSubirArchivo = crearBoton('Añadir Archivos 📄', ['botonadd'], 'button');
btnSubirArchivo.addEventListener('click', () => editTareaArchivo.click());

const contenedorAdjuntosModal = document.createElement('div');
contenedorAdjuntosModal.classList.add('contenedor-adjuntos-modal');

const modalEliminar = document.createElement('dialog');
modalEliminar.classList.add('modal-eliminar-pop');
document.body.appendChild(modalEliminar);

export function confirmarEliminacion() {
    return new Promise((resolve) => {
        const texto = document.createElement('p');
        texto.classList.add('modal-eliminar-texto');
        texto.textContent = "¿Estás seguro de borrar esta tarea?";

        const contenedorBotones = document.createElement('div');
        contenedorBotones.classList.add('modal-eliminar-botones');

        const btnSi = document.createElement('button');
        btnSi.textContent = "Sí";
        btnSi.classList.add('btn-eliminar-si');

        const btnNo = document.createElement('button');
        btnNo.textContent = "No";
        btnNo.type = "button";
        btnNo.classList.add('btn-eliminar-no');

        btnSi.onclick = () => {
            modalEliminar.close();
            resolve(true);
        };

        btnNo.onclick = () => {
            modalEliminar.close();
            resolve(false);
        };

        contenedorBotones.append(btnSi, btnNo);
        modalEliminar.replaceChildren(texto, contenedorBotones);
        modalEliminar.showModal();
    });
}

editTareaArchivo.addEventListener('change', async () => {
    const files = editTareaArchivo.files;
    if (!files.length) return;

    for (let file of files) {
        try {
            const urlSubida = await subirArchivoAPI(file);
            archivosListaModal.push({
                url: urlSubida,
                nombre: file.name
            });
        } catch (err) {
            alert(`Error al subir ${file.name}: ${err.message}`);
        }
    }

    editTareaArchivo.value = "";
    renderizarAdjuntosModal();
});

const btnGuardar = crearBoton('Guardar 💾', ['button'], 'button');
const btnCancelar = crearBoton('Cancelar 🚫', ['button', 'btn-cancelar'], 'button');
btnCancelar.addEventListener('click', () => modal.close());

const contenedorBotones = document.createElement('div');
contenedorBotones.classList.add('modal-botones');
contenedorBotones.append(btnGuardar, btnCancelar);

modal.replaceChildren(
    tituloModal, 
    editTareaNombre, 
    editTareaDias, 
    editTareaDescripcion, 
    btnSubirArchivo,
    editTareaArchivo, 
    document.createElement('br'),
    contenedorAdjuntosModal, 
    contenedorBotones
);

function renderizarAdjuntosModal() {
    contenedorAdjuntosModal.replaceChildren();

    archivosListaModal.forEach((adj, index) => {
        const chip = document.createElement('div');
        chip.classList.add('chip-adjunto');

        const icono = document.createElement('span');
        icono.textContent = "📄 ";

        const nombre = document.createElement('span');
        nombre.classList.add('nombre-adjunto');
        nombre.textContent = adj.nombre || 'Archivo.pdf';
        nombre.title = adj.nombre;

        const btnEliminar = document.createElement('button');
        btnEliminar.type = "button";
        btnEliminar.classList.add('btn-quitar-adjunto');
        btnEliminar.textContent = "❌";
        btnEliminar.addEventListener('click', () => {
            archivosListaModal.splice(index, 1);
            renderizarAdjuntosModal();
        });

        contenedorAdjuntosModal.appendChild(chip);
        chip.append(icono, nombre, btnEliminar);
    });
}

export function abrirModal(tarea = null, parsearArchivosFn = null) {
    if (tarea) {
        tareaIdEnEdicion = tarea.id;
        
        if (parsearArchivosFn) {
            archivosListaModal = parsearArchivosFn(tarea);
        } else {
            const datos = tarea.archivos || tarea.archivo || [];
            if (typeof datos === 'string') {
                try {
                    archivosListaModal = JSON.parse(datos);
                } catch (e) {
                    archivosListaModal = [];
                }
            } else {
                archivosListaModal = Array.isArray(datos) ? [...datos] : [];
            }
        }

        tituloModal.textContent = "Editar Tarea";
        editTareaNombre.value = tarea.nombre || "";
        // Extraemos solo YYYY-MM-DD en caso de que Supabase devuelva la fecha con timestamp
        editTareaDias.value = tarea.dias ? tarea.dias.split('T')[0] : "";
        editTareaDescripcion.value = tarea.descripcion || "";
    } else {
        tareaIdEnEdicion = null;
        archivosListaModal = [];
        tituloModal.textContent = "Nueva Tarea";
        editTareaNombre.value = "";
        editTareaDias.value = "";
        editTareaDescripcion.value = "";
    }

    editTareaArchivo.value = "";
    renderizarAdjuntosModal();
    modal.showModal();
}

export function inicializarModal(onGuardarExitoso) {
    btnGuardar.onclick = async (e) => {
        if (e) e.preventDefault();

        // Enviamos la fecha seleccionada en formato string ('YYYY-MM-DD') directamente a Supabase
        const payload = {
            nombre: editTareaNombre.value,
            dias: editTareaDias.value || null, 
            descripcion: editTareaDescripcion.value, // o pasarlo a 'archivos' directamente
            archivos: JSON.stringify(archivosListaModal) // 👈 Usás la variable que sí tenés
        };

        try {
            await guardarTareaAPI(payload, tareaIdEnEdicion);
            modal.close();
            if (typeof onGuardarExitoso === 'function') {
                onGuardarExitoso();
            }
        } catch (err) {
            console.error("Error al guardar:", err);
            alert(`Error al guardar: ${err.message}`);
        }
    };
}