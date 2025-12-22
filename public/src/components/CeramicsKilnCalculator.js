import React, { useState, useMemo } from 'react';
import { Calculator, Flame, DollarSign, Package, AlertCircle } from 'lucide-react';

const CeramicsKilnCalculator = () => {
  const [gasPerCylinder, setGasPerCylinder] = useState(120000);
  const [minWage, setMinWage] = useState(1423500);
  const [laborPercentage, setLaborPercentage] = useState(15);
  const [indirectCosts, setIndirectCosts] = useState(30000);
  const [burningHours, setBurningHours] = useState(8);
  
  const [selectedPieces, setSelectedPieces] = useState({});

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

  const pieceTypes = [
    { id: 'p_5x5', name: '5x5', width: 5, depth: 5, height: 0.5, type: 'flat' },
    { id: 'p_10x5', name: '10x5', width: 10, depth: 5, height: 0.5, type: 'flat' },
    { id: 'p_10x10', name: '10x10', width: 10, depth: 10, height: 0.5, type: 'flat' },
    { id: 'p_10x15', name: '10x15', width: 10, depth: 15, height: 0.5, type: 'flat' },
    { id: 'p_10x20', name: '10x20', width: 10, depth: 20, height: 0.5, type: 'flat' },
    { id: 'p_10x25', name: '10x25', width: 10, depth: 25, height: 0.5, type: 'flat' },
    
    { id: 'v10_5x5', name: '5x5x10', width: 5, depth: 5, height: 10, type: 'volume' },
    { id: 'v10_10x5', name: '10x5x10', width: 10, depth: 5, height: 10, type: 'volume' },
    { id: 'v10_10x10', name: '10x10x10', width: 10, depth: 10, height: 10, type: 'volume' },
    { id: 'v10_10x15', name: '10x15x10', width: 10, depth: 15, height: 10, type: 'volume' },
    { id: 'v10_10x20', name: '10x20x10', width: 10, depth: 20, height: 10, type: 'volume' },
    
    { id: 'v20_5x5', name: '5x5x20', width: 5, depth: 5, height: 20, type: 'volume' },
    { id: 'v20_10x5', name: '10x5x20', width: 10, depth: 5, height: 20, type: 'volume' },
    { id: 'v20_10x10', name: '10x10x20', width: 10, depth: 10, height: 20, type: 'volume' },
    { id: 'v20_10x15', name: '10x15x20', width: 10, depth: 15, height: 20, type: 'volume' },
    { id: 'v20_10x20', name: '10x20x20', width: 10, depth: 20, height: 20, type: 'volume' },
  ];

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

  const handlePieceChange = (pieceId, value) => {
    setSelectedPieces(prev => ({
      ...prev,
      [pieceId]: parseInt(value) || 0
    }));
  };

  const roundToNearest = (value, nearest = 50) => {
    return Math.round(value / nearest) * nearest;
  };

  const calculations = useMemo(() => {
    const gasCostPerBurning = (gasPerCylinder * 2) / 4;
    const hourlyWage = minWage / 240;
    const laborCost = (hourlyWage * burningHours * laborPercentage) / 100;
    
    const totalCost = gasCostPerBurning + laborCost + indirectCosts;
    
    const totalPieces = Object.values(selectedPieces).reduce((sum, qty) => sum + qty, 0);
    
    const pieceDetails = pieceTypes.map(piece => {
      const quantity = selectedPieces[piece.id] || 0;
      const maxCapacity = calculateMaxPieces(piece);
      const volume = piece.width * piece.depth * piece.height;
      
      return {
        ...piece,
        quantity,
        maxCapacity,
        volume,
        percentage: totalPieces > 0 ? (quantity / totalPieces) * 100 : 0
      };
    }).filter(p => p.quantity > 0);

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
  }, [gasPerCylinder, minWage, laborPercentage, indirectCosts, burningHours, selectedPieces]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Flame className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-800">Calculadora de Costos por Quema</h1>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Dimensiones del Horno</p>
                <p>Área útil: {kilnDimensions.width}cm × {kilnDimensions.depth}cm × {kilnDimensions.usableHeight}cm</p>
                <p>Placas: {plateDimensions.width}cm × {plateDimensions.depth}cm ({plateDimensions.count} placas)</p>
                <p className="mt-2 text-xs">Los costos se redondean a múltiplos de $50 para facilitar los cobros</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-600" />
              Piezas Planas
            </h2>
            <div className="space-y-3">
              {pieceTypes.filter(p => p.type === 'flat').map(piece => (
                <div key={piece.id} className="flex items-center gap-3">
                  <label className="w-24 text-sm font-medium text-gray-700">
                    {piece.name} cm
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={calculateMaxPieces(piece)}
                    value={selectedPieces[piece.id] || ''}
                    onChange={(e) => handlePieceChange(piece.id, e.target.value)}
                    placeholder="0"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <span className="text-xs text-gray-500 w-20">
                    máx: {calculateMaxPieces(piece)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-600" />
              Piezas con Volumen
            </h2>
            <div className="space-y-3">
              {pieceTypes.filter(p => p.type === 'volume').map(piece => (
                <div key={piece.id} className="flex items-center gap-3">
                  <label className="w-24 text-sm font-medium text-gray-700">
                    {piece.name} cm
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={calculateMaxPieces(piece)}
                    value={selectedPieces[piece.id] || ''}
                    onChange={(e) => handlePieceChange(piece.id, e.target.value)}
                    placeholder="0"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <span className="text-xs text-gray-500 w-20">
                    máx: {calculateMaxPieces(piece)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-orange-600" />
            Resumen de Costos
          </h2>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Costo de Gas</p>
              <p className="text-2xl font-bold text-orange-600">
                ${calculations.gasCostPerBurning.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Mano de Obra</p>
              <p className="text-2xl font-bold text-blue-600">
                ${Math.round(calculations.laborCost).toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Costos Indirectos</p>
              <p className="text-2xl font-bold text-purple-600">
                ${indirectCosts.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Quema</p>
              <p className="text-2xl font-bold text-green-600">
                ${Math.round(calculations.totalCost).toLocaleString()}
              </p>
            </div>
          </div>

          {calculations.totalPieces > 0 ? (
            <>
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <div className="grid md:grid-cols-3 gap-4">
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
                    <span className="text-sm font-medium text-gray-700">Costo Redondeado</span>
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
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pieza</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Cantidad</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Volumen (cm³)</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Costo Unitario</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Costo Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {calculations.pieceCosts.map((piece) => (
                      <tr key={piece.id} className="hover:bg-gray-50">
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
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          ${piece.totalCostForType.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right text-sm font-bold text-gray-800">
                        Total:
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
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Agrega piezas para calcular los costos de esta quema</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CeramicsKilnCalculator;