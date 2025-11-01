import { useEffect, useState } from 'react';
import splashImage from '../../assets/splash/logo-inicio.png';

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Inicia el fade out después de 1.7 segundos
    const fadeTimeout = setTimeout(() => {
      setFade(true);
    }, 1700);

    // Completa la transición y notifica después de 2 segundos
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-white z-50 transition-opacity duration-300 ${
        fade ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <img
        src={splashImage}
        alt="Splash Screen"
        className="max-w-[80%] max-h-[80vh] object-contain"
      />
    </div>
  );
};

export default SplashScreen;