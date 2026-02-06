// Keep-Alive Service para mantener el backend de Fly.io despierto
// Este servicio hace ping cada 4 minutos al backend (Fly.io suspende después de 5 min de inactividad)

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://consultora-ten-back.fly.dev';
const PING_INTERVAL = 4 * 60 * 1000; // 4 minutos (antes de que Fly.io suspenda la app)

class KeepAliveService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log('⚠️ Keep-alive ya está corriendo');
      return;
    }

    console.log('🚀 Iniciando keep-alive service...');
    this.isRunning = true;

    // Ping inmediato
    this.ping();

    // Ping cada 4 minutos
    this.intervalId = setInterval(() => {
      this.ping();
    }, PING_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🛑 Keep-alive service detenido');
    }
  }

  private async ping() {
    try {
      const startTime = Date.now();
      const response = await fetch(BACKEND_URL, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });

      const elapsed = Date.now() - startTime;
      
      if (response.ok) {
        console.log(`✅ Keep-alive ping exitoso (${elapsed}ms)`);
      } else {
        console.log(`⚠️ Keep-alive ping con código ${response.status} (${elapsed}ms)`);
      }
    } catch (error) {
      console.error('❌ Keep-alive ping falló:', error);
    }
  }

  isActive() {
    return this.isRunning;
  }
}

// Singleton instance
export const keepAliveService = new KeepAliveService();

// Auto-iniciar solo en el browser
if (typeof window !== 'undefined') {
  // Iniciar después de 1 minuto de que la página cargue
  setTimeout(() => {
    keepAliveService.start();
  }, 60000);
}
