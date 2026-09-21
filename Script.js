const express = require('express');
const app = express();
app.use(express.json());

// 1. OBTENER / READ (Para llenar la lista y el selector "Seleccionar tarea")
app.get('/api/tareas', (req, res) => {
  // Devuelve todas las tareas creadas
});

// Obtener una sola tarea por su ID (para cargar los datos al seleccionar una en "Editar Tarea")
app.get('/api/tareas/:id', (req, res) => {
  // Devuelve la tarea con ese ID
});

// 2. CREAR / CREATE (Formulario "Crear Tarea" -> Botón "Guardar Cambios")
app.post('/api/tareas', (req, res) => {
  // Recibe: { nombre, fechaFinalizacion, descripcion, archivos }
  // Crea la nueva tarea en la DB y responde confirmando
});

// 3. EDITAR / UPDATE (Formulario "Editar Tarea" -> Botón "Guardar Cambios")
app.put('/api/tareas/:id', (req, res) => {
  // Recibe los datos modificados de la tarea con ese :id
  // Actualiza en la DB y responde confirmando
});

// 4. ELIMINAR / DELETE (Opcional por si agregás botón de borrar)
app.delete('/api/tareas/:id', (req, res) => {
  // Elimina la tarea por :id
});