// Función simple de prueba para verificar que las serverless functions funcionan
export default function handler(req, res) {
  console.log('📝 Request received:', req.method, req.url);
  console.log('🔑 Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasDBURL: !!process.env.DATABASE_URL,
  });
  
  res.status(200).json({ 
    message: 'Vercel API funcionando correctamente ✅',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasDatabase: !!process.env.DATABASE_URL
  });
}
