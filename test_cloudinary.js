import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import mongoose from 'mongoose';
import Ticket from './src/models/mongo/Tickets.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUpload() {
  try {
    console.log('1. Conectando a MongoDB local...');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('2. Creando un ticket falso temporal en MongoDB...');
    const ticket = await Ticket.create({
      workspace_id: '1234',
      reference_code: `TEST-${Date.now()}`,
      email: 'test@example.com',
      subject: 'Problema de prueba',
      description: 'Esto es para probar Cloudinary',
      type: 'P',
    });
    console.log(`✅ Ticket creado exitosamente con ID: ${ticket._id}`);

    console.log('3. Preparando archivo para subir (el propio test_cloudinary.js como prueba)...');
    const filePath = path.join(__dirname, 'test_cloudinary.js');
    const fileStream = fs.createReadStream(filePath);
    
    const form = new FormData();
    form.append('file', fileStream);

    console.log('4. Enviando archivo al endpoint local de tickets...');
    const API_URL = `http://localhost:3000/api/tickets/${ticket._id}/attachments`;
    
    const response = await fetch(API_URL, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('\n🎉 ¡SUBIDA DE CLOUDINARY EXITOSA! 🎉');
      console.log('-> URL de Cloudinary:', data.ticket.attachments[0].url);
      console.log('-> Peso original:', data.ticket.attachments[0].size, 'bytes');
      console.log('-> Metadatos guardados en la BD de Tickets:', JSON.stringify(data.ticket.attachments, null, 2));
    } else {
      console.log('\n❌ Falló la subida:', data.message);
      console.log('🔍 Error detallado de Cloudinary:', data.error);
    }
    
  } catch (error) {
    console.error('Error durante el test:', error);
  } finally {
    process.exit(0);
  }
}

testUpload();
