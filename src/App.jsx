import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Download, Upload } from 'lucide-react';

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
    setIsDrawing(true);
    setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
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
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !currentDraw) return;
    setIsDrawing(false);
    if (Math.abs(currentDraw.width) > 10 && Math.abs(currentDraw.height) > 10) {
      setHotspots([...hotspots, {
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
      }]);
    }
    setCurrentDraw(null);
  };

  const updateHotspot = (id, updates) => {
    setHotspots(hotspots.map(h => h.id === id ? { ...h, ...updates } : h));
    if (selectedHotspot?.id === id) setSelectedHotspot({ ...selectedHotspot, ...updates });
  };

  const deleteHotspot = (id) => {
    setHotspots(hotspots.filter(h => h.id !== id));
    if (selectedHotspot?.id === id) setSelectedHotspot(null);
  };

  const exportJSON = () => {
    const data = { hotspots, version: '1.0.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proyecto.json';
    a.click();
  };

  useEffect(() => {
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
        const x = h.x * scaleX, y = h.y * scaleY, w = h.width * scaleX, he = h.height * scaleY;
        ctx.strokeStyle = selectedHotspot?.id === h.id ? '#2563eb' : 'rgba(37, 99, 235, 0.4)';
        ctx.lineWidth = selectedHotspot?.id === h.id ? 3 : 2;
        ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
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
  }, [hotspots, selectedHotspot, currentDraw, globalPinSize, image]);

  if (!image) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
              🎯 PIN STUDIO
            </h1>
            <p className="text-gray-600 text-lg">Crea imágenes interactivas</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg hover:shadow-xl"
          >
            <Upload size={24} /> Subir imagen
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              🎯 PIN STUDIO
            </h1>
            <p className="text-sm text-gray-500 mt-1">{hotspots.length} hotspots activos</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold transition"
          >
            📸 Cambiar imagen
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex gap-3 mb-6">
              <button 
                onClick={() => setDrawMode(drawMode === 'rect' ? null : 'rect')} 
                className={`px-6 py-3 rounded-lg font-semibold transition ${drawMode === 'rect' ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                ▭ Rectángulo
              </button>
              <button 
                onClick={() => setDrawMode(drawMode === 'circle' ? null : 'circle')} 
                className={`px-6 py-3 rounded-lg font-semibold transition ${drawMode === 'circle' ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                ◯ Círculo
              </button>
              <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                <span>📏 Tamaño:</span>
                <input 
                  type="range" 
                  min="6" 
                  max="24" 
                  value={globalPinSize} 
                  onChange={(e) => setGlobalPinSize(parseInt(e.target.value))} 
                  className="w-24"
                />
                <span className="font-bold">{globalPinSize}px</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden">
              <canvas 
                ref={canvasRef} 
                onMouseDown={handleCanvasMouseDown} 
                onMouseMove={handleCanvasMouseMove} 
                onMouseUp={handleCanvasMouseUp} 
                onMouseLeave={handleCanvasMouseUp} 
                className={`w-full ${drawMode ? 'cursor-crosshair' : 'cursor-default'}`}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">🎯 Hotspots</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {hotspots.length === 0 ? (
                <p className="text-gray-500 text-sm">Dibuja hotspots en la imagen</p>
              ) : (
                hotspots.map((h, idx) => (
                  <div 
                    key={h.id} 
                    onClick={() => setSelectedHotspot(h)} 
                    className={`p-3 rounded-lg cursor-pointer transition border-2 ${
                      selectedHotspot?.id === h.id 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" 
                        style={{ backgroundColor: h.pinColor }}
                      >
                        {idx + 1}
                      </div>
                      <p className="font-semibold text-sm text-gray-800">{h.name}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedHotspot && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800">⚙️ Personalizar</h3>
                <button 
                  onClick={() => deleteHotspot(selectedHotspot.id)} 
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Nombre</label>
                  <input 
                    type="text" 
                    value={selectedHotspot.name} 
                    onChange={(e) => updateHotspot(selectedHotspot.id, { name: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Icono</label>
                  <select 
                    value={selectedHotspot.pinIcon} 
                    onChange={(e) => updateHotspot(selectedHotspot.id, { pinIcon: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(icons).map(([key, emoji]) => (
                      <option key={key} value={key}>{emoji} {key}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Tamaño: {selectedHotspot.pinSize}px
                  </label>
                  <input 
                    type="range" 
                    min="6" 
                    max="24" 
                    value={selectedHotspot.pinSize} 
                    onChange={(e) => updateHotspot(selectedHotspot.id, { pinSize: parseInt(e.target.value) })} 
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Color PIN</label>
                  <input 
                    type="color" 
                    value={selectedHotspot.pinColor} 
                    onChange={(e) => updateHotspot(selectedHotspot.id, { pinColor: e.target.value })} 
                    className="w-full h-10 rounded-lg cursor-pointer border border-gray-300"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Color Número</label>
                  <input 
                    type="color" 
                    value={selectedHotspot.numberColor} 
                    onChange={(e) => updateHotspot(selectedHotspot.id, { numberColor: e.target.value })} 
                    className="w-full h-10 rounded-lg cursor-pointer border border-gray-300"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <button 
              onClick={exportJSON} 
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-lg"
            >
              <Download size={20} /> Exportar JSON
            </button>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
    </div>
  );
}