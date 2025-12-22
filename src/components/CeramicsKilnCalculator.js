import React, { useState, useMemo } from 'react';
import { Calculator, Flame, Package, AlertCircle, Plus, Trash2 } from 'lucide-react';

const CeramicsKilnCalculator = () => {
  const [gasPerCylinder, setGasPerCylinder] = useState(120000);
  const [minWage, setMinWage] = useState(1423500);
  const [laborPercentage, setLaborPercentage] = useState(15);
  const [indirectCosts, setIndirectCosts] = useState(30000);
  const [burningHours, setBurningHours] = useState(8);
  
  const [customPieces, setCustomPieces] = useState([]);
  const [newPiece, setNewPiece] = useState({
    width: '',
    depth: '',
    height: '',
    quantity: ''
  });

  const kilnDimensions = {
    width: 55,
    depth: 55.5,
    height: 60,
    usableHeight: 55
  };

  const plateDimensions = {
    width: 47.5,
    depth: 24,
    thickness: 2,
    count: 2
  };

  const columnDimensions = {
    height: 21,
    width: 4,
    count: 8
  };

  const calculateMaxPieces = (piece) => {
    const piecesPerPlate1 = Math.floor(plateDimensions.width / piece.width) * 
                            Math.floor(plateDimensions.depth / piece.depth);
    const piecesPerPlate2 = Math.floor(plateDimensions.width / piece.depth) * 
                            Math.floor(plateDimensions.depth / piece.width);
    const piecesPerPlate = Math.max(piecesPerPlate1, piecesPerPlate2);
    
    if (piecesPerPlate === 0) {
      const directInKiln1 = Math.floor(kilnDimensions.width / piece.width) * 
                            Math.floor(kilnDimensions.depth / piece.depth);
      const directInKiln2 = Math.floor(kilnDimensions.width / piece.depth) * 
                            Math.floor(kilnDimensions.depth / piece.width);
      return Math.max(directInKiln1, directInKiln2);
    }
    
    let availableHeight = kilnDimensions.usableHeight;
    let levels = 0;
    
    while (availableHeight > (columnDimensions.height + plateDimensions.thickness + piece.height)) {
      levels++;
      availableHeight -= (columnDimensions.height + plateDimensions.thickness);
    }
    
    levels = Math.min(levels, plateDimensions.count);
    
    return piecesPerPlate * levels;
  };

  const addCustomPiece = () => {
    const width = parseFloat(newPiece.width);
    const depth = parseFloat(newPiece.depth);
    const height = parseFloat(newPiece.height);
    const quantity = parseInt(newPiece.quantity);

    if (width > 0 && depth > 0 && height > 0 && quantity > 0) {
      const piece = {
        id: `custom_${Date.now()}`,
        name: `${width}×${depth}×${height}`,
        width,
        depth,
        height,
        quantity,
        type: 'custom'
      };
      
      setCustomPieces([...customPieces, piece]);
      setNewPiece({ width: '', depth: '', height: '', quantity: '' });
    }
  };

  const removePiece = (id) => {
    setCustomPieces(customPieces.filter(p => p.id !== id));
  };

  const updatePieceQuantity = (id, quantity) => {
    setCustomPieces(customPieces.map(p => 
      p.id === id ? { ...p, quantity: parseInt(quantity) || 0 } : p
    ));
  };

  const roundToNearest = (value, nearest = 50) => {
    return Math.round(value / nearest) * nearest;
  };

  const calculations = useMemo(() => {
    const gasCostPerBurning = (gasPerCylinder * 2) / 4;
    const hourlyWage = minWage / 240;
    const laborCost = (hourlyWage * burningHours * laborPercentage) / 100;
    
    const totalCost = gasCostPerBurning + laborCost + indirectCosts;
    
    const totalPieces = customPieces.reduce((sum, p) => sum + p.quantity, 0);
    
    const pieceDetails = customPieces.map(piece => {
      const maxCapacity = calculateMaxPieces(piece);
      const volume = piece.width * piece.depth * piece.height;
      
      return {
        ...piece,
        maxCapacity,
        volume,
        percentage: totalPieces > 0 ? (piece.quantity / totalPieces) * 100 : 0
      };
    });

    const totalVolume = pieceDetails.reduce((sum, p) => sum + (p.volume * p.quantity), 0);
    
    const pieceCosts = pieceDetails.map(piece => {
      const volumeRatio = (piece.volume * piece.quantity) / totalVolume;
      const calculatedCost = totalVolume > 0 ? (totalCost * volumeRatio) / piece.quantity : 0;
      const costPerPiece = roundToNearest(calculatedCost, 50);
      
      return {
        ...piece,
        costPerPiece,
        totalCostForType: costPerPiece * piece.quantity
      };
    });

    const totalRounded = pieceCosts.reduce((sum, p) => sum + p.totalCostForType, 0);
    const difference = totalCost - totalRounded;

    return {
      gasCostPerBurning,
      laborCost,
      totalCost,
      totalPieces,
      totalVolume,
      pieceCosts,
      totalRounded,
      difference
    };
  }, [gasPerCylinder, minWage, laborPercentage, indirectCosts, burningHours, customPieces]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Flame className="w-8 h-8 text-orange-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Calculadora de Costos por Quema</h1>
          </div>

          {/* Parámetros de Costos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo por Cilindro (COP)
              </label>
              <input
                type="number"
                value={gasPerCylinder}
                onChange={(e) => setGasPerCylinder(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salario Mínimo Mensual (COP)
              </label>
              <input
                type="number"
                value={minWage}
                onChange={(e) => setMinWage(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas de Quema
              </label>
              <input
                type="number"
                value={burningHours}
                onChange={(e) => setBurningHours(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                % Mano de Obra
              </label>
              <input
                type="number"
                value={laborPercentage}
                onChange={(e) => setLaborPercentage(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costos Indirectos (COP)
              </label>
              <input
                type="number"
                value={indirectCosts}
                onChange={(e) => setIndirectCosts(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Info del Horno */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Dimensiones del Horno</p>
                <p>Área útil: {kilnDimensions.width}cm × {kilnDimensions.depth}cm × {kilnDimensions.usableHeight}cm</p>
                <p>Placas: {plateDimensions.width}cm × {plateDimensions.depth}cm ({plateDimensions.count} placas)</p>
                <p className="mt-2 text-xs text-gray-600">Los costos se redondean a múltiplos de $50</p>
              </div>
            </div>
          </div>
        </div>

        {/* Agregar Piezas */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="w-6 h-6 text-orange-600" />
            Agregar Pieza
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ancho (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={newPiece.width}
                onChange={(e) => setNewPiece({...newPiece, width: e.target.value})}
                placeholder="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Profundidad (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={newPiece.depth}
                onChange={(e) => setNewPiece({...newPiece, depth: e.target.value})}
                placeholder="15"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Altura (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={newPiece.height}
                onChange={(e) => setNewPiece({...newPiece, height: e.target.value})}
                placeholder="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                value={newPiece.quantity}
                onChange={(e) => setNewPiece({...newPiece, quantity: e.target.value})}
                placeholder="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={addCustomPiece}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Piezas */}
        {customPieces.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-600" />
              Piezas en esta Quema
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dimensiones</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Volumen (cm³)</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Cantidad</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Máx. Capacidad</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customPieces.map((piece) => {
                    const maxCap = calculateMaxPieces(piece);
                    const volume = piece.width * piece.depth * piece.height;
                    return (
                      <tr key={piece.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-800">{piece.name} cm</div>
                          <div className="text-xs text-gray-500">
                            {piece.width}cm × {piece.depth}cm × {piece.height}cm
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {volume.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={maxCap}
                            value={piece.quantity}
                            onChange={(e) => updatePieceQuantity(piece.id, e.target.value)}
                            className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-medium ${piece.quantity > maxCap ? 'text-red-600' : 'text-gray-600'}`}>
                            {maxCap}
                          </span>
                          {piece.quantity > maxCap && (
                            <div className="text-xs text-red-600 mt-1">¡Excede capacidad!</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removePiece(piece.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Eliminar pieza"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resumen de Costos */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-orange-600" />
            Resumen de Costos
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <p className="text-xs text-gray-600 mb-1">Costo de Gas</p>
              <p className="text-xl md:text-2xl font-bold text-orange-600">
                ${calculations.gasCostPerBurning.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">Mano de Obra</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600">
                ${Math.round(calculations.laborCost).toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <p className="text-xs text-gray-600 mb-1">Costos Indirectos</p>
              <p className="text-xl md:text-2xl font-bold text-purple-600">
                ${indirectCosts.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <p className="text-xs text-gray-600 mb-1">Total Quema</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">
                ${Math.round(calculations.totalCost).toLocaleString()}
              </p>
            </div>
          </div>

          {calculations.totalPieces > 0 ? (
            <>
              <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Total de Piezas</span>
                    <p className="text-2xl font-bold text-gray-800">{calculations.totalPieces}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Volumen Total</span>
                    <p className="text-2xl font-bold text-gray-800">
                      {calculations.totalVolume.toLocaleString()} cm³
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Costo Total Redondeado</span>
                    <p className="text-2xl font-bold text-gray-800">
                      ${calculations.totalRounded.toLocaleString()}
                    </p>
                    {Math.abs(calculations.difference) > 100 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Diferencia: ${Math.round(calculations.difference).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Pieza</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Cantidad</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Volumen (cm³)</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Costo Unitario</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Costo Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {calculations.pieceCosts.map((piece) => (
                      <tr key={piece.id} className="hover:bg-orange-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                          {piece.name} cm
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {piece.quantity}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {piece.volume.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-orange-600">
                          ${piece.costPerPiece.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                          ${piece.totalCostForType.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right text-sm font-bold text-gray-800">
                        TOTAL:
                      </td>
                      <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                        ${calculations.totalRounded.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No hay piezas agregadas</p>
              <p className="text-sm mt-2">Agrega piezas arriba para calcular los costos de esta quema</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CeramicsKilnCalculator;