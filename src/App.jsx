import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Download, Upload, Settings } from 'lucide-react';

export default function PinStudio() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [image, setImage] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(null);
  const [startPos, setStartPos] = useState(null);
  const [currentDraw, setCurrentDraw] = useState(null);
  const [globalPinSize, setGlobalPinSize] = useState(12);

  const icons = {
    star: '⭐', diamond: '💎', circle: '●', heart: '❤️', target: '🎯',
    bell: '🔔', flag: '🚩', pin: '📍', spark: '✨', flame: '🔥',
    checkmark: '✓', question: '?', info: 'ℹ️', light: '💡', map: '🗺️', book: '📚',
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(event.target.result);
        setHotspots([]);
        setSelectedHotspot(null);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasMouseDown = (e) => {
    if (!drawMode || !image) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !startPos) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentDraw({
      x: startPos.x,
      y: startPos.y,
      width: x - startPos.x,
      height: y - startPos.y,
    });
    drawCanvas();
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !currentDraw) return;
    setIsDrawing(false);

    if (Math.abs(currentDraw.width) > 10 && Math.abs(currentDraw.height) > 10) {
      const newHotspot = {
        id: Date.now(),
        type: drawMode,
        x: Math.min(startPos.x, startPos.x + currentDraw.width),
        y: Math.min(startPos.y, startPos.y + currentDraw.height),
        width: Math.abs(currentDraw.width),
        height: Math.abs(currentDraw.height),
        name: `Hotspot ${hotspots.length + 1}`,
        pinIcon: 'star',
        pinSize: globalPinSize,
        pinColor: '#3B82F6',
        numberColor: '#FFFFFF',
        showBorder: true,
      };
      setHotspots([...hotspots, newHotspot]);
    }
    setCurrentDraw(null);
  };

  const updateHotspot = (id, updates) => {
    setHotspots(hotspots.map(h => h.id === id ? { ...h, ...updates } : h));
    if (selectedHotspot?.id === id) {
      setSelectedHotspot({ ...selectedHotspot, ...updates });
    }
  };

  const deleteHotspot = (id) => {
    setHotspots(hotspots.filter(h => h.id !== id));
    if (selectedHotspot?.id === id) setSelectedHotspot(null);
  };

  const exportJSON = () => {
    const data = { hotspots, version: '2.0-pro', timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proyecto.json';
    a.click();
  };

  const drawCanvas = () => {
    if (!canvasRef.current || !image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = Math.min(img.width, 900);
      canvas.height = (img.height / img.width) * canvas.width;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / img.width;
      const scaleY = canvas.height / img.height;

      hotspots.forEach((h, idx) => {
        const x = h.x * scaleX;
        const y = h.y * scaleY;
        const w = h.width * scaleX;
        const he = h.height * scaleY;

        ctx.strokeStyle = selectedHotspot?.id === h.id ? '#3b82f6' : 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = selectedHotspot?.id === h.id ? 3 : 2;
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';

        if (h.type === 'rect') {
          ctx.fillRect(x, y, w, he);
          ctx.strokeRect(x, y, w, he);
        } else {
          ctx.beginPath();
          ctx.arc(x + w / 2, y + he / 2, w / 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = h.pinColor;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + he / 2, h.pinSize * 1.5, 0, 2 * Math.PI);
        ctx.fill();
        if (h.showBorder) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.fillStyle = h.numberColor;
        ctx.font = `bold ${h.pinSize * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(idx + 1, x + w / 2, y + he / 2);
      });

      if (currentDraw) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(currentDraw.x, currentDraw.y, currentDraw.width, currentDraw.height);
        ctx.setLineDash([]);
      }
    };
    img.src = image;
  };

  useEffect(() => {
    drawCanvas();
  }, [hotspots, selectedHotspot, currentDraw, globalPinSize, image]);

  if (!image) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-blue-100">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">🎯 PIN STUDIO PRO</h1>
          <p className="text-gray-600 mb-8">Editor de imágenes interactivas con chinchetas personalizables</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-lg"
          >
            <Upload size={20} /> 📸 Subir imagen
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🎯 PIN STUDIO PRO</h1>
            <p className="text-sm text-gray-600">🎯 {hotspots.length} hotspots | 📍 {globalPinSize}px</p>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold">Cambiar imagen</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded shadow-lg p-6">
            <div className="flex gap-2 mb-4 flex-wrap">
              <button onClick={() => setDrawMode(drawMode === 'rect' ? null : 'rect')}
                className={`px-4 py-2 rounded font-semibold ${drawMode === 'rect' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>▢ Rectángulo</button>
              <button onClick={() => setDrawMode(drawMode === 'circle' ? null : 'circle')}
                className={`px-4 py-2 rounded font-semibold ${drawMode === 'circle' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>◯ Círculo</button>
            </div>
            <div className="bg-gray-100 rounded border-2 border-dashed border-gray-300 overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className={drawMode ? 'cursor-crosshair' : 'cursor-default'}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded shadow-lg p-4">
            <h3 className="font-bold mb-3 text-gray-800">📍 Tamaño PIN</h3>
            <input type="range" min="6" max="24" value={globalPinSize} onChange={(e) => setGlobalPinSize(parseInt(e.target.value))} className="w-full" />
            <p className="text-xs text-gray-600 mt-2">{globalPinSize}px</p>
          </div>

          <div className="bg-white rounded shadow-lg p-4">
            <h3 className="font-bold mb-3 text-gray-800">🎯 Hotspots ({hotspots.length})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {hotspots.map((h, idx) => (
                <div key={h.id} onClick={() => setSelectedHotspot(h)}
                  className={`p-3 rounded cursor-pointer border-2 transition ${selectedHotspot?.id === h.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: h.pinColor }}>{idx + 1}</div>
                    <div><p className="font-semibold text-sm text-gray-800">{h.name}</p>
                      <p className="text-xs text-gray-600">{icons[h.pinIcon]}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedHotspot && (
            <div className="bg-white rounded shadow-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-800">⚙️ Personalizar</h3>
                <button onClick={() => deleteHotspot(selectedHotspot.id)} className="text-red-500"><Trash2 size={18} /></button>
              </div>
              <div className="space-y-3">
                <input type="text" value={selectedHotspot.name} onChange={(e) => updateHotspot(selectedHotspot.id, { name: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm" placeholder="Nombre" />
                <select value={selectedHotspot.pinIcon} onChange={(e) => updateHotspot(selectedHotspot.id, { pinIcon: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm">
                  {Object.entries(icons).map(([key, emoji]) => (<option key={key} value={key}>{emoji} {key}</option>))}
                </select>
                <div>
                  <label className="text-sm font-semibold block mb-1">Tamaño: {selectedHotspot.pinSize}px</label>
                  <input type="range" min="6" max="24" value={selectedHotspot.pinSize} onChange={(e) => updateHotspot(selectedHotspot.id, { pinSize: parseInt(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Color PIN</label>
                  <input type="color" value={selectedHotspot.pinColor} onChange={(e) => updateHotspot(selectedHotspot.id, { pinColor: e.target.value })} className="w-full h-10 rounded cursor-pointer" />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Color Número</label>
                  <input type="color" value={selectedHotspot.numberColor} onChange={(e) => updateHotspot(selectedHotspot.id, { numberColor: e.target.value })} className="w-full h-10 rounded cursor-pointer" />
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedHotspot.showBorder} onChange={(e) => updateHotspot(selectedHotspot.id, { showBorder: e.target.checked })} />
                  <span className="text-sm">Mostrar borde</span>
                </label>
              </div>
            </div>
          )}

          <div className="bg-white rounded shadow-lg p-4">
            <h3 className="font-bold mb-3 text-gray-800">💾 Exportar</h3>
            <button onClick={exportJSON} className="w-full bg-pur