/**
 * Componente de Alertas de Stock Bajo
 * Muestra materiales con stock bajo o crítico
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import administradorService from '../../services/administradorService.js';

export default function AlertasStock() {
  const [materialesStockBajo, setMaterialesStockBajo] = useState([]);
  const [resumenStock, setResumenStock] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    try {
      setCargando(true);
      const [responseMateriales, responseResumen] = await Promise.all([
        administradorService.obtenerStockBajo(),
        administradorService.obtenerResumenStock()
      ]);

      if (responseMateriales.exito) {
        setMaterialesStockBajo(responseMateriales.datos || []);
      }
      if (responseResumen.exito) {
        setResumenStock(responseResumen.datos);
      }
    } catch (error) {
      // Error al cargar alertas de stock
    } finally {
      setCargando(false);
    }
  };

  const getIconoAlerta = (nivelAlerta) => {
    switch (nivelAlerta) {
      case 'CRITICO':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'MUY_BAJO':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'BAJO':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getColorAlerta = (nivelAlerta) => {
    switch (nivelAlerta) {
      case 'CRITICO':
        return 'border-red-500 bg-red-50';
      case 'MUY_BAJO':
        return 'border-orange-500 bg-orange-50';
      case 'BAJO':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getTextoAlerta = (nivelAlerta) => {
    switch (nivelAlerta) {
      case 'CRITICO':
        return 'Sin Stock';
      case 'MUY_BAJO':
        return 'Stock Muy Bajo';
      case 'BAJO':
        return 'Stock Bajo';
      default:
        return 'Normal';
    }
  };

  if (cargando) {
    return (
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-5 w-5" />
            Alertas de Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Cargando alertas...</p>
        </CardContent>
      </Card>
    );
  }

  if (materialesStockBajo.length === 0) {
    return (
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Stock de Materiales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">Todos los materiales con stock adecuado</p>
          </div>
          {resumenStock && (
            <p className="text-xs text-gray-500 mt-2">
              {resumenStock.total_materiales} materiales en inventario
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Alertas de Stock Bajo
          </CardTitle>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {materialesStockBajo.length} {materialesStockBajo.length === 1 ? 'alerta' : 'alertas'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {resumenStock && (
          <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
            <div className="text-center">
              <div className="font-bold text-red-600">{resumenStock.sin_stock || 0}</div>
              <div className="text-gray-500">Sin Stock</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-600">
                {(resumenStock.con_stock_bajo || 0) - (resumenStock.sin_stock || 0)}
              </div>
              <div className="text-gray-500">Stock Bajo</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-600">{resumenStock.stock_normal || 0}</div>
              <div className="text-gray-500">Normal</div>
            </div>
          </div>
        )}

        {!mostrarDetalle ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setMostrarDetalle(true)}
          >
            Ver Detalle de Materiales
          </Button>
        ) : (
          <>
            <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
              {materialesStockBajo.map((material) => (
                <div
                  key={material.material_id}
                  className={`p-3 rounded-lg border-l-4 ${getColorAlerta(material.nivel_alerta)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      {getIconoAlerta(material.nivel_alerta)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {material.descripcion}
                        </p>
                        <p className="text-xs text-gray-500">Código: {material.codigo}</p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-xs font-semibold text-gray-700">
                        Stock: {material.stock_actual} {material.unidad}
                      </p>
                      <p className="text-xs text-gray-500">
                        Mín: {material.stock_minimo}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        material.nivel_alerta === 'CRITICO'
                          ? 'bg-red-100 text-red-800'
                          : material.nivel_alerta === 'MUY_BAJO'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {getTextoAlerta(material.nivel_alerta)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setMostrarDetalle(false)}
            >
              Ocultar Detalle
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
