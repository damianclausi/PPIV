// Endpoint de prueba simple para verificar que las funciones serverless funcionan
export default async (req, res) => {
  try {
    // Retornar info básica
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: req.headers
    };
    
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasDB: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET
    };
    
    res.json({
      ...response,
      environment: envCheck
    });
  } catch (error) {
    console.error('Error en test endpoint:', error.message);
    res.status(500).json({ error: error.message });
  }
};
