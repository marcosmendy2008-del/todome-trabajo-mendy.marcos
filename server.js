import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Configurar multer para recibir el PDF en memoria temporal
const upload = multer({ storage: multer.memoryStorage() });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltan las credenciales en el archivo .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- NUEVA RUTA: Subida de archivos PDF a Supabase Storage ---
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se envió ningún archivo' });
        }

        const file = req.file;
        // Nombre único para evitar colisiones en Storage
        const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;

        // Subir al Bucket 'archivos_tareas'
        const { data, error } = await supabase.storage
            .from('archivos_tareas')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            console.error("Error en Supabase Storage:", error);
            return res.status(500).json({ error: error.message });
        }

        // Obtener la URL pública del archivo subido
        const { data: publicUrlData } = supabase.storage
            .from('archivos_tareas')
            .getPublicUrl(fileName);

        res.json({ url: publicUrlData.publicUrl });
    } catch (error) {
        console.error("Error interno en /api/upload:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Obtener tareas
app.get('/api/tareas', async (req, res) => {
    const { data, error } = await supabase.from('tareas').select('*');
    if (error) {
        console.error("Error en GET Supabase:", error);
        return res.status(500).json({ error: error.message });
    }
    res.json(data);
});

// POST - Crear tarea
app.post('/api/tareas', async (req, res) => {
    const { nombre, dias, descripcion, archivo } = req.body;
    
    const fechaValidada = dias && typeof dias === 'string' && dias.trim() !== "" ? dias : null;

    const { data, error } = await supabase
        .from('tareas')
        .insert([{ nombre, dias: fechaValidada, descripcion, archivo }])
        .select();

    if (error) {
        console.error("Error en POST Supabase:", error);
        return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data[0]);
});

// PUT - Editar tarea
app.put('/api/tareas/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, dias, descripcion, archivo } = req.body;
    
    const fechaValidada = dias && typeof dias === 'string' && dias.trim() !== "" ? dias : null;

    const { data, error } = await supabase
        .from('tareas')
        .update({ nombre, dias: fechaValidada, descripcion, archivo })
        .eq('id', id)
        .select();

    if (error) {
        console.error("Error en PUT Supabase:", error);
        return res.status(500).json({ error: error.message });
    }
    res.json(data[0]);
});

// DELETE - Eliminar tarea
app.delete('/api/tareas/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('tareas')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error en DELETE Supabase:", error);
        return res.status(500).json({ error: error.message });
    }
    res.json({ mensaje: 'Tarea eliminada correctamente' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 SERVIDOR V2 CON UPLOAD ACTIVO`);
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`=================================`);
});