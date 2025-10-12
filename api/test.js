// Endpoint de prueba simple para verificar que las funciones serverless funcionan
export default function handler(req, res) {
  console.log('🧪 Test endpoint llamado');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  try {
    // Verificar variables de entorno
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasDBURL: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET,
      dbUrlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
    };
    
    console.log('Environment check:', envCheck);
    
    res.status(200).json({
      success: true,
      message: 'Test endpoint funcionando ✅',
      timestamp: new Date().toISOString(),
      environment: envCheck
    });
  } catch (error) {
    console.error('❌ Error en test endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
