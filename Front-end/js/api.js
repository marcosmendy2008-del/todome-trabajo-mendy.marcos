import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Configuración de Supabase
const SUPABASE_URL = "https://rysplvmwekfkhjowjhvv.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_dV0oaFiCOaFAa0jlIynTSA_deOD6jHK"; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Obtener todas las tareas
export async function obtenerTareasAPI() {
    const { data, error } = await supabase
        .from('tareas')
        .select('*');

    if (error) throw new Error("Error al obtener tareas: " + error.message);
    return data;
}

// 2. Guardar o Editar Tarea
export async function guardarTareaAPI(payload, id = null) {
    if (id) {
        // Editar
        const { data, error } = await supabase
            .from('tareas')
            .update(payload)
            .eq('id', id);

        if (error) throw new Error("Error al actualizar la tarea: " + error.message);
        return data;
    } else {
        // Crear
        const { data, error } = await supabase
            .from('tareas')
            .insert([payload]);

        if (error) throw new Error("Error al guardar la tarea: " + error.message);
        return data;
    }
}

// 3. Eliminar Tarea
export async function eliminarTareaAPI(id) {
    const { data, error } = await supabase
        .from('tareas')
        .delete()
        .eq('id', id);

    if (error) throw new Error("Error al eliminar la tarea: " + error.message);
    return data;
}

// 4. Subir PDF a Supabase Storage
export async function subirArchivoAPI(archivo) {
    const nombreUnico = `${Date.now()}_${archivo.name}`;

    const { data, error } = await supabase.storage
        .from('adjuntos')
        .upload(nombreUnico, archivo);

    if (error) throw new Error("Error al subir PDF: " + error.message);

    const { data: publicUrlData } = supabase.storage
        .from('adjuntos')
        .getPublicUrl(nombreUnico);

    return publicUrlData.publicUrl;
}