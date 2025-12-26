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

    // Validar que todos los campos sean números positivos
    if (!width || !depth || !height || !quantity || width <= 0 || depth <= 0 || height <= 0 || quantity <= 0) {
      alert("⚠️ Por favor ingresa valores válidos en todos los campos (mayores a 0)");
      return;
    }

    // Validar que la pieza no exceda las dimensiones del horno
    if (width > kilnDimensions.width || depth > kilnDimensions.depth || height > kilnDimensions.usableHeight) {
      alert(
        `❌ La pieza es demasiado grande para el horno.\n\n` +
        `Dimensiones de la pieza: ${width}×${depth}×${height} cm\n` +
        `Dimensiones máximas del horno: ${kilnDimensions.width}×${kilnDimensions.depth}×${kilnDimensions.usableHeight} cm\n\n` +
        `Reduce el tamaño de la pieza para que quepa en el horno.`
      );
      return;
    }

    const piece = {
      id: `custom_${Date.now()}`,
      name: `${width}×${depth}×${height}`,
      width,
      depth,
      height,
      quantity: 0,
      type: "custom",
    };

    const maxCapacity = calculateMaxPieces(piece);

    // Validar que la pieza pueda entrar en el horno
    if (maxCapacity === 0) {
      alert(
        `❌ Esta pieza no cabe en el horno con las placas actuales.\n\n` +
        `Dimensiones de la pieza: ${width}×${depth}×${height} cm\n` +
        `Dimensiones de las placas: ${plateDimensions.width}×${plateDimensions.depth} cm\n\n` +
        `La pieza es demasiado grande para colocarse en las placas disponibles.`
      );
      return;
    }

    // Validar que la cantidad no exceda la capacidad
    if (quantity > maxCapacity) {
      const userConfirm = window.confirm(
        `⚠️ La cantidad solicitada excede la capacidad calculada.\n\n` +
        `Cantidad solicitada: ${quantity} piezas\n` +
        `Capacidad calculada: ${maxCapacity} piezas\n\n` +
        `¿Ya quemó estas piezas y logró colocarlas todas en el horno?\n\n` +
        `✅ SÍ - Agregar con modo manual activado\n` +
        `❌ NO - Agregar solo ${maxCapacity} piezas (capacidad calculada)`
      );
      
      if (userConfirm) {
        piece.quantity = quantity;
        piece.manualOverride = true;
      } else {
        piece.quantity = maxCapacity;
      }
    } else {
      piece.quantity = quantity;
    }

    setCustomPieces([...customPieces, piece]);
    setNewPiece({ width: "", depth: "", height: "", quantity: "" });
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
    <div className="container">
      <h1 className="main-title">Calculadora de Costos por Quema</h1>

      {/* Parámetros de Costos */}
      <div className="card card-beige">
        <div className="input-grid">
          <div className="input-group">
            <label className="label">Costo por Cilindro</label>
            <input
              type="number"
              value={gasPerCylinder}
              onChange={(e) => setGasPerCylinder(Number(e.target.value))}
              className="input"
            />
          </div>

          <div className="input-group">
            <label className="label">% Mano de Obra</label>
            <input
              type="number"
              value={laborPercentage}
              onChange={(e) => setLaborPercentage(Number(e.target.value))}
              className="input"
            />
          </div>

          <div className="input-group">
            <label className="label">Salario Mínimo Mensual</label>
            <input
              type="number"
              value={minWage}
              onChange={(e) => setMinWage(Number(e.target.value))}
              className="input"
            />
          </div>

          <div className="input-group">
            <label className="label">Costos Indirectos</label>
            <input
              type="number"
              value={indirectCosts}
              onChange={(e) => setIndirectCosts(Number(e.target.value))}
              className="input"
            />
          </div>

          <div className="input-group full-width">
            <label className="label">Horas de Quema</label>
            <input
              type="number"
              value={burningHours}
              onChange={(e) => setBurningHours(Number(e.target.value))}
              className="input"
            />
          </div>
        </div>

        <div className="info-box">
          <p className="info-text">
            Dimensiones del Horno • Área útil: {kilnDimensions.width}cm × {kilnDimensions.depth}cm × {kilnDimensions.usableHeight}cm • Placas: {plateDimensions.width}cm × {plateDimensions.depth}cm ({plateDimensions.count} placas)
          </p>
        </div>
      </div>

      {/* Agregar Pieza */}
      <h2 className="section-title">Agregar Pieza</h2>
      <div className="card card-cream">
        <div className="input-grid">
          <div className="input-group">
            <label className="label">Ancho (cm)</label>
            <input
              type="number"
              step="0.1"
              value={newPiece.width}
              onChange={(e) =>
                setNewPiece({ ...newPiece, width: e.target.value })
              }
              className="input"
            />
          </div>

          <div className="input-group">
            <label className="label">Altura (cm)</label>
            <input
              type="number"
              step="0.1"
              value={newPiece.height}
              onChange={(e) =>
                setNewPiece({ ...newPiece, height: e.target.value })
              }
              className="input"
            />
          </div>

          <div className="input-group">
            <label className="label">Profundidad (cm)</label>
            <input
              type="number"
              step="0.1"
              value={newPiece.depth}
              onChange={(e) =>
                setNewPiece({ ...newPiece, depth: e.target.value })
              }
              className="input"
            />
          </div>

          <div className="input-group">
            <label className="label">Cantidad</label>
            <input
              type="number"
              value={newPiece.quantity}
              onChange={(e) =>
                setNewPiece({ ...newPiece, quantity: e.target.value })
              }
              className="input"
            />
          </div>
        </div>

        <div className="btn-container">
          <button onClick={addCustomPiece} className="btn btn-primary">
            <Plus className="icon" />
            Agregar
          </button>
        </div>
      </div>

      {/* Lista de Piezas */}
      {customPieces.length > 0 && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Dimensiones</th>
                <th className="text-center">Volumen</th>
                <th className="text-center">Cantidad</th>
                <th className="text-center">Capacidad</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customPieces.map((piece) => {
                const maxCap = calculateMaxPieces(piece);
                const volume = piece.width * piece.depth * piece.height;
                return (
                  <tr key={piece.id}>
                    <td className="bold">{piece.name} cm</td>
                    <td className="text-center bold">
                      {volume.toLocaleString()} cm³
                    </td>
                    <td className="text-center">
                      <input
                        type="number"
                        min="0"
                        max={maxCap}
                        value={piece.quantity}
                        onChange={(e) =>
                          updatePieceQuantity(piece.id, e.target.value)
                        }
                        className="input-small"
                      />
                    </td>
                    <td className="text-center">
                      <span
                        className={
                          piece.quantity > maxCap
                            ? "badge badge-danger"
                            : "badge badge-success"
                        }
                      >
                        {maxCap}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => removePiece(piece.id)}
                        className="btn-delete"
                      >
                        <Trash2 className="icon-small" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Resumen de Costos */}
      <h2 className="section-title">Resumen de Costos</h2>
      <div className="card card-mint">
        <div className="cost-summary">
          <div className="cost-item">
            <span className="cost-label">Costo de Gas:</span>
            <span className="cost-value">
              ${calculations.gasCostPerBurning.toLocaleString()}
            </span>
          </div>
          <div className="cost-item">
            <span className="cost-label">Mano de Obra:</span>
            <span className="cost-value">
              ${Math.round(calculations.laborCost).toLocaleString()}
            </span>
          </div>
          <div className="cost-item">
            <span className="cost-label">Indirectos:</span>
            <span className="cost-value">
              ${indirectCosts.toLocaleString()}
            </span>
          </div>
          <div className="cost-item total">
            <span className="cost-label">💰 Total Quema:</span>
            <span className="cost-value">
              ${Math.round(calculations.totalCost).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Total Final */}
      {calculations.totalPieces > 0 ? (
        <>
          <div className="total-container">
            <div className="total-box">
              <span className="total-label">Total:</span>
              <span className="total-value">
                ${calculations.totalRounded.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Tabla de costos por pieza */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Pieza</th>
                  <th className="text-center">Cantidad</th>
                  <th className="text-center">Volumen</th>
                  <th className="text-right">Unitario</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {calculations.pieceCosts.map((piece) => (
                  <tr key={piece.id}>
                    <td className="bold">{piece.name} cm</td>
                    <td className="text-center bold">{piece.quantity}</td>
                    <td className="text-center">
                      {piece.volume.toLocaleString()} cm³
                    </td>
                    <td className="text-right bold">
                      ${piece.costPerPiece.toLocaleString()}
                    </td>
                    <td className="text-right bold">
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
          <p className="empty-state-title">No hay piezas agregadas</p>
          <p className="empty-state-text">
            Agrega piezas para calcular los costos
          </p>
        </div>
      )}
    </div>
  );
};

export default CeramicsKilnCalculator;