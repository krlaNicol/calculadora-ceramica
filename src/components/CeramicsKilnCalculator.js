import React, { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";

const CeramicsKilnCalculator = () => {
  const [gasPerCylinder, setGasPerCylinder] = useState(120000);
  const [minWage, setMinWage] = useState(1423500);
  const [laborPercentage, setLaborPercentage] = useState(15);
  const [indirectCosts, setIndirectCosts] = useState(30000);
  const [burningHours, setBurningHours] = useState(8);

  const [customPieces, setCustomPieces] = useState([]);
  const [newPiece, setNewPiece] = useState({
    width: "",
    depth: "",
    height: "",
    quantity: "",
  });

  const kilnDimensions = {
    width: 55,
    depth: 55.5,
    height: 60,
    usableHeight: 55,
  };

  const plateDimensions = {
    width: 47.5,
    depth: 24,
    thickness: 2,
    count: 2,
  };

  const columnDimensions = {
    height: 21,
    width: 4,
    count: 8,
  };

  const calculateMaxPieces = (piece) => {
    const piecesPerPlate1 =
      Math.floor(plateDimensions.width / piece.width) *
      Math.floor(plateDimensions.depth / piece.depth);
    const piecesPerPlate2 =
      Math.floor(plateDimensions.width / piece.depth) *
      Math.floor(plateDimensions.depth / piece.width);
    const piecesPerPlate = Math.max(piecesPerPlate1, piecesPerPlate2);

    if (piecesPerPlate === 0) {
      const directInKiln1 =
        Math.floor(kilnDimensions.width / piece.width) *
        Math.floor(kilnDimensions.depth / piece.depth);
      const directInKiln2 =
        Math.floor(kilnDimensions.width / piece.depth) *
        Math.floor(kilnDimensions.depth / piece.width);
      return Math.max(directInKiln1, directInKiln2);
    }

    let availableHeight = kilnDimensions.usableHeight;
    let levels = 0;

    while (
      availableHeight >
      columnDimensions.height + plateDimensions.thickness + piece.height
    ) {
      levels++;
      availableHeight -= columnDimensions.height + plateDimensions.thickness;
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
        type: "custom",
      };

      setCustomPieces([...customPieces, piece]);
      setNewPiece({ width: "", depth: "", height: "", quantity: "" });
    }
  };

  const removePiece = (id) => {
    setCustomPieces(customPieces.filter((p) => p.id !== id));
  };

  const updatePieceQuantity = (id, quantity) => {
    setCustomPieces(
      customPieces.map((p) =>
        p.id === id ? { ...p, quantity: parseInt(quantity) || 0 } : p
      )
    );
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

    const pieceDetails = customPieces.map((piece) => {
      const maxCapacity = calculateMaxPieces(piece);
      const volume = piece.width * piece.depth * piece.height;

      return {
        ...piece,
        maxCapacity,
        volume,
        percentage: totalPieces > 0 ? (piece.quantity / totalPieces) * 100 : 0,
      };
    });

    const totalVolume = pieceDetails.reduce(
      (sum, p) => sum + p.volume * p.quantity,
      0
    );

    const pieceCosts = pieceDetails.map((piece) => {
      const volumeRatio = (piece.volume * piece.quantity) / totalVolume;
      const calculatedCost =
        totalVolume > 0 ? (totalCost * volumeRatio) / piece.quantity : 0;
      const costPerPiece = roundToNearest(calculatedCost, 50);

      return {
        ...piece,
        costPerPiece,
        totalCostForType: costPerPiece * piece.quantity,
      };
    });

    const totalRounded = pieceCosts.reduce(
      (sum, p) => sum + p.totalCostForType,
      0
    );
    const difference = totalCost - totalRounded;

    return {
      gasCostPerBurning,
      laborCost,
      totalCost,
      totalPieces,
      totalVolume,
      pieceCosts,
      totalRounded,
      difference,
    };
  }, [
    gasPerCylinder,
    minWage,
    laborPercentage,
    indirectCosts,
    burningHours,
    customPieces,
  ]);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="responsive-container">
        {/* Título Principal */}
        <h1 className="section-title mb-8">
          Calculadora de Costos por Quema
        </h1>

        {/* Parámetros de Costos */}
        <div className="card-gradient mb-6">
          <div className="input-grid mb-4">
            <div>
              <label className="input-label">Costo por Cilindro</label>
              <input
                type="number"
                value={gasPerCylinder}
                onChange={(e) => setGasPerCylinder(Number(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="input-label">% Mano de Obra</label>
              <input
                type="number"
                value={laborPercentage}
                onChange={(e) => setLaborPercentage(Number(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="input-label">Salario Mínimo Mensual</label>
              <input
                type="number"
                value={minWage}
                onChange={(e) => setMinWage(Number(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="input-label">Costos Indirectos</label>
              <input
                type="number"
                value={indirectCosts}
                onChange={(e) => setIndirectCosts(Number(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="input-label">Horas de Quema</label>
              <input
                type="number"
                value={burningHours}
                onChange={(e) => setBurningHours(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>

          {/* Info del Horno */}
          <div className="info-box">
            <p className="text-sm font-bold text-gray-700 mb-1">
              <strong>Dimensiones del Horno</strong>
            </p>
            <p className="text-sm text-gray-600">
              • Área útil: {kilnDimensions.width}cm × {kilnDimensions.depth}cm × {kilnDimensions.usableHeight}cm
            </p>
            <p className="text-sm text-gray-600">
              • Placas: {plateDimensions.width}cm × {plateDimensions.depth}cm ({plateDimensions.count} placas)
            </p>
          </div>
        </div>

        {/* Agregar Pieza */}
        <h2 className="section-title mb-6">Agregar Pieza</h2>
        <div className="card-beige mb-6">
          <div className="pieces-grid mb-4">
            <div>
              <label className="input-label">Ancho (cm)</label>
              <input
                type="number"
                step="0.1"
                value={newPiece.width}
                onChange={(e) =>
                  setNewPiece({ ...newPiece, width: e.target.value })
                }
                className="input-field-small"
              />
            </div>

            <div>
              <label className="input-label">Profundidad (cm)</label>
              <input
                type="number"
                step="0.1"
                value={newPiece.depth}
                onChange={(e) =>
                  setNewPiece({ ...newPiece, depth: e.target.value })
                }
                className="input-field-small"
              />
            </div>

            <div>
              <label className="input-label">Altura (cm)</label>
              <input
                type="number"
                step="0.1"
                value={newPiece.height}
                onChange={(e) =>
                  setNewPiece({ ...newPiece, height: e.target.value })
                }
                className="input-field-small"
              />
            </div>

            <div>
              <label className="input-label">Cantidad</label>
              <input
                type="number"
                value={newPiece.quantity}
                onChange={(e) =>
                  setNewPiece({ ...newPiece, quantity: e.target.value })
                }
                className="input-field-small"
              />
            </div>
          </div>

          <div className="text-center">
            <button onClick={addCustomPiece} className="btn-secondary">
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>

        {/* Lista de Piezas */}
        {customPieces.length > 0 && (
          <div className="mb-6">
            <div className="table-responsive">
              <table className="w-full border-collapse min-w-[600px]">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm">Dimensiones</th>
                    <th className="px-4 py-3 text-center text-sm">Volumen</th>
                    <th className="px-4 py-3 text-center text-sm">Cantidad</th>
                    <th className="px-4 py-3 text-center text-sm">Capacidad</th>
                    <th className="px-4 py-3 text-center text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {customPieces.map((piece) => {
                    const maxCap = calculateMaxPieces(piece);
                    const volume = piece.width * piece.depth * piece.height;
                    return (
                      <tr key={piece.id} className="table-row">
                        <td className="px-4 py-3">
                          <div className="text-sm font-bold text-gray-800">
                            {piece.name} cm
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-gray-700">
                            {volume.toLocaleString()} cm³
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={maxCap}
                            value={piece.quantity}
                            onChange={(e) =>
                              updatePieceQuantity(piece.id, e.target.value)
                            }
                            className="w-20 px-2 py-1 text-center text-sm font-bold border-2 border-gray-400 rounded-lg focus:border-gray-600"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={
                              piece.quantity > maxCap
                                ? "capacity-badge-danger"
                                : "capacity-badge-success"
                            }
                          >
                            {maxCap}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removePiece(piece.id)}
                            className="btn-delete"
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
        <h2 className="section-title mb-6">Resumen de Costos</h2>
        <div className="card-mint mb-6">
          <div className="space-y-2">
            <div className="stat-item">
              <span className="stat-label">Costo de Gas:</span>
              <span className="stat-value">
                ${calculations.gasCostPerBurning.toLocaleString()}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Mano de Obra:</span>
              <span className="stat-value">
                ${Math.round(calculations.laborCost).toLocaleString()}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Indirectos:</span>
              <span className="stat-value">
                ${indirectCosts.toLocaleString()}
              </span>
            </div>
            <div className="stat-item border-t-2 border-gray-400 pt-2 mt-2">
              <span className="stat-label text-base">💰 Total Quema:</span>
              <span className="stat-value text-lg">
                ${Math.round(calculations.totalCost).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Total Final */}
        {calculations.totalPieces > 0 ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="total-box">
                <span className="total-label">Total:</span>
                <span className="total-value">
                  ${calculations.totalRounded.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Tabla de costos por pieza */}
            <div className="table-responsive">
              <table className="w-full border-collapse min-w-[600px]">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm">Pieza</th>
                    <th className="px-4 py-3 text-center text-sm">Cantidad</th>
                    <th className="px-4 py-3 text-center text-sm">Volumen</th>
                    <th className="px-4 py-3 text-right text-sm">Unitario</th>
                    <th className="px-4 py-3 text-right text-sm">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {calculations.pieceCosts.map((piece) => (
                    <tr key={piece.id} className="table-row">
                      <td className="px-4 py-3 text-sm font-bold">
                        {piece.name} cm
                      </td>
                      <td className="px-4 py-3 text-center text-base font-bold">
                        {piece.quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {piece.volume.toLocaleString()} cm³
                      </td>
                      <td className="px-4 py-3 text-right text-base font-bold">
                        ${piece.costPerPiece.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-base font-bold">
                        ${piece.totalCostForType.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p className="text-lg font-bold text-gray-600 mb-2">
              No hay piezas agregadas
            </p>
            <p className="text-sm text-gray-500">
              Agrega piezas para calcular los costos
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CeramicsKilnCalculator;