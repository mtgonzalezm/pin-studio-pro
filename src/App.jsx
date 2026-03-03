import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Download, Upload, Plus, X } from 'lucide-react';

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
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentType, setContentType] = useState('text');
  const [contentText, setContentText] = useState('');

  const icons = {
    star: '⭐', diamond: '💎', circle: '●', heart: '❤️', target: '🎯',
    bell: '🔔', flag: '🚩', pin: '📍', spark: '✨', flame: '🔥',
    checkmark: '✓', question: '?', info: 'ℹ️', light: '💡', map: '🗺️', 
    book: '📚', smile: '😊', lightbulb: '💡', rocket: '🚀', award: '🏆',
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
        content: { type: 'text', text: '', url: '', videoUrl: '', quiz: '' }
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

  const saveContent = () => {
    if (!selectedHotspot) return;
    const newContent = { ...selectedHotspot.content, type: contentType };
    if (contentType === 'text') newContent.text = contentText;
    else if (contentType === 'url') newContent.url = contentText;
    else if (contentType === 'video') newContent.videoUrl = contentText;
    else if (contentType === 'quiz') newContent.quiz = contentText;
    updateHotspot(selectedHotspot.id, { content: newContent });
    setShowContentModal(false);
    setContentText('');
  };

  const exportJSON = () => {
    const data = { hotspots, version: '2.0.0', timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pin-studio-proyecto.json';
    a.click();
  };

  const exportImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/png');
    link.download = 'pin-studio-imagen.png';
    link.click();
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
          ctx.arc(x + w / 2, y + he / 2, Math.abs(w) / 2, 0, 2 * Math.PI);
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
        ctx.fillText(icons[h.pinIcon] || h.pinIcon, x + w / 2, y + he / 2);
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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '48px', maxWidth: '448px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 900, backgroundImage: 'linear-gradient(to right, #2563eb, #4f46e5)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' }}>🎯 PIN STUDIO PRO</h1>
          <p style={{ color: '#4b5563', fontSize: '18px', marginBottom: '32px' }}>Crea imágenes interactivas con hotspots</p>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: 'linear-gradient(to right, #3b82f6, #4f46e5)', color: 'white', fontWeight: 700, padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
            <Upload size={24} /> Subir imagen
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ background: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '20px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>🎯 PIN STUDIO PRO</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{hotspots.length} hotspots</p>
          </div>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: '#e5e7eb', color: '#1f2937', padding: '8px 24px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            📸 Cambiar imagen
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button onClick={() => setDrawMode(drawMode === 'rect' ? null : 'rect')} style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', background: drawMode === 'rect' ? '#3b82f6' : '#f3f4f6', color: drawMode === 'rect' ? 'white' : '#1f2937' }}>▭ Rectángulo</button>
            <button onClick={() => setDrawMode(drawMode === 'circle' ? null : 'circle')} style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', background: drawMode === 'circle' ? '#3b82f6' : '#f3f4f6', color: drawMode === 'circle' ? 'white' : '#1f2937' }}>◯ Círculo</button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <span>Tamaño:</span>
              <input type="range" min="6" max="24" value={globalPinSize} onChange={(e) => setGlobalPinSize(parseInt(e.target.value))} style={{ width: '80px' }} />
              <span style={{ fontWeight: 'bold', minWidth: '40px' }}>{globalPinSize}px</span>
            </div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '12px', border: '2px dashed #d1d5db', overflow: 'hidden' }}>
            <canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} style={{ width: '100%', cursor: drawMode ? 'crosshair' : 'default', display: 'block' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '16px', color: '#1f2937' }}>🎯 Hotspots ({hotspots.length})</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {hotspots.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '14px' }}>Dibuja hotspots</p> : hotspots.map((h, idx) => (
                <div key={h.id} onClick={() => setSelectedHotspot(h)} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px', background: selectedHotspot?.id === h.id ? '#eff6ff' : '#f9fafb', border: '2px solid', borderColor: selectedHotspot?.id === h.id ? '#3b82f6' : '#e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px', background: h.pinColor }}>{icons[h.pinIcon]}</div>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937' }}>{h.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedHotspot && (
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#1f2937' }}>⚙️ Editar</h3>
                <button onClick={() => deleteHotspot(selectedHotspot.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nombre</label>
                  <input type="text" value={selectedHotspot.name} onChange={(e) => updateHotspot(selectedHotspot.id, { name: e.target.value })} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Icono</label>
                  <select value={selectedHotspot.pinIcon} onChange={(e) => updateHotspot(selectedHotspot.id, { pinIcon: e.target.value })} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px', fontSize: '13px' }}>
                    {Object.entries(icons).map(([key, emoji]) => (<option key={key} value={key}>{emoji} {key}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Color</label>
                  <input type="color" value={selectedHotspot.pinColor} onChange={(e) => updateHotspot(selectedHotspot.id, { pinColor: e.target.value })} style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer' }} />
                </div>
                <button onClick={() => setShowContentModal(true)} style={{ background: '#8b5cf6', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>
                  <Plus size={16} /> Contenido
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={exportJSON} style={{ flex: 1, background: '#3b82f6', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>
              <Download size={16} /> JSON
            </button>
            <button onClick={exportImage} style={{ flex: 1, background: '#10b981', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>
              <Download size={16} /> Imagen
            </button>
          </div>
        </div>
      </div>

      {showContentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Contenido</h2>
              <button onClick={() => setShowContentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}><X size={24} /></button>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Tipo</label>
              <select value={contentType} onChange={(e) => setContentType(e.target.value)} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px', fontSize: '14px' }}>
                <option value="text">📝 Texto</option>
                <option value="url">🔗 Enlace</option>
                <option value="video">🎥 Video</option>
                <option value="quiz">🎓 Quiz</option>
              </select>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <textarea value={contentText} onChange={(e) => setContentText(e.target.value)} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px', fontSize: '14px', minHeight: '100px', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={saveContent} style={{ flex: 1, background: '#3b82f6', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Guardar</button>
              <button onClick={() => setShowContentModal(false)} style={{ flex: 1, background: '#e5e7eb', color: '#1f2937', padding: '12px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
    </div>
  );
}