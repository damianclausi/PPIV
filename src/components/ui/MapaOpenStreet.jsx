import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from './button';
import { Alert, AlertDescription } from './alert';

// Fix para los iconos de Leaflet en Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icono personalizado azul para la ubicación
const iconoUbicacion = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente para recentrar el mapa cuando cambian las coordenadas
function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 16);
    }
  }, [coords, map]);
  return null;
}

/**
 * Componente de mapa usando OpenStreetMap y Leaflet
 * Busca coordenadas desde una dirección usando Nominatim (geocoding gratuito)
 */
export default function MapaOpenStreet({ direccion, altura = '300px' }) {
  const [coordenadas, setCoordenadas] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // Geocoding: Convertir dirección a coordenadas usando Nominatim (OpenStreetMap)
  const buscarCoordenadas = async (direccionBuscar) => {
    setCargando(true);
    setError(null);
    
    try {
      // Agregar contexto de Argentina para mejor precisión
      const query = `${direccionBuscar}, Gobernador Ugarte, Buenos Aires, Argentina`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CooperativaElectricaUgarte/1.0' // Nominatim requiere User-Agent
        }
      });
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setCoordenadas({ lat: parseFloat(lat), lng: parseFloat(lon), nombre: display_name });
        setError(null);
      } else {
        // Si no encuentra, usar coordenadas por defecto de Gobernador Ugarte
        setCoordenadas({
          lat: -35.0419,
          lng: -58.3816,
          nombre: 'Gobernador Ugarte, Buenos Aires (ubicación aproximada)'
        });
        setError('No se encontró la dirección exacta. Mostrando ubicación aproximada de la localidad.');
      }
    } catch (err) {
      console.error('Error al buscar coordenadas:', err);
      // Usar coordenadas por defecto en caso de error
      setCoordenadas({
        lat: -35.0419,
        lng: -58.3816,
        nombre: 'Gobernador Ugarte, Buenos Aires'
      });
      setError('Error al buscar la ubicación. Mostrando centro de la localidad.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (direccion) {
      buscarCoordenadas(direccion);
    }
  }, [direccion]);

  const abrirEnGoogleMaps = () => {
    if (coordenadas) {
      const url = `https://www.google.com/maps/search/?api=1&query=${coordenadas.lat},${coordenadas.lng}`;
      window.open(url, '_blank');
    }
  };

  const abrirEnWaze = () => {
    if (coordenadas) {
      const url = `https://www.waze.com/ul?ll=${coordenadas.lat},${coordenadas.lng}&navigate=yes`;
      window.open(url, '_blank');
    }
  };

  if (cargando) {
    return (
      <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center" style={{ height: altura }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cooperativa-blue mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Buscando ubicación...</p>
        </div>
      </div>
    );
  }

  if (!coordenadas) {
    return (
      <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center p-4" style={{ height: altura }}>
        <div className="text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">No se pudo determinar la ubicación</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription className="text-yellow-800 text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg overflow-hidden border border-gray-300 shadow-md" style={{ height: altura }}>
        <MapContainer
          center={[coordenadas.lat, coordenadas.lng]}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[coordenadas.lat, coordenadas.lng]} icon={iconoUbicacion}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold mb-1">{direccion}</p>
                <p className="text-xs text-gray-600">{coordenadas.nombre}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Lat: {coordenadas.lat.toFixed(6)}, Lng: {coordenadas.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
          <RecenterMap coords={[coordenadas.lat, coordenadas.lng]} />
        </MapContainer>
      </div>

      {/* Botones de navegación */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={abrirEnGoogleMaps}
          className="flex-1 border-cooperativa-blue text-cooperativa-blue hover:bg-cooperativa-blue hover:text-white"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Abrir en Google Maps
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={abrirEnWaze}
          className="flex-1 border-cooperativa-cyan text-cooperativa-cyan hover:bg-cooperativa-cyan hover:text-white"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Abrir en Waze
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        📍 {coordenadas.nombre}
      </p>
    </div>
  );
}
