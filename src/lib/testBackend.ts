import api from './axios';
import { AxiosError } from 'axios';

export async function testBackendConnection() {
  try {
    console.log('🔍 Probando conexión con backend...');
    console.log('📍 URL:', process.env.NEXT_PUBLIC_API_URL);
    
    const startTime = Date.now();
    
    // Intentar hacer una petición simple al backend
    const response = await api.get('/');
    
    const duration = Date.now() - startTime;
    
    console.log('✅ Conexión exitosa!');
    console.log('⏱️ Tiempo de respuesta:', duration, 'ms');
    console.log('📦 Respuesta:', response.data);
    
    return {
      success: true,
      duration,
      data: response.data
    };
  } catch (error) {
    const err = error as AxiosError;
    const duration = Date.now();
    
    console.error('❌ Error de conexión:', err.message);
    
    if (err.code === 'ECONNABORTED') {
      console.error('⏱️ Timeout - El servidor tardó demasiado en responder');
    } else if (err.response) {
      console.error('📡 Status:', err.response.status);
      console.error('📦 Data:', err.response.data);
    } else if (err.request) {
      console.error('📡 No se recibió respuesta del servidor');
    }
    
    return {
      success: false,
      error: err.message,
      code: err.code,
      duration
    };
  }
}
