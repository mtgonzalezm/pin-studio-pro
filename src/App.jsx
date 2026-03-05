import React, { useState, useRef, useEffect } from 'react';
import { Eye } from 'lucide-react';

export default function PinStudio() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [image, setImage] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [drawMode, setDrawMode] = useState(null);
  const [startPos, setStartPos] = useState(null);
  const [currentDraw, setCurrentDraw] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState('star');
  const [isTransparentMode, setIsTransparentMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [studentMode, setStudentMode] = useState(false);

  const icons = { star: '⭐', diamond: '💎', heart: '❤️', target: '🎯', bell: '🔔', flag: '🚩', pin: '📍', spark: '✨', flame: '🔥', checkmark: '✓', info: 'ℹ️', light: '💡', map: '🗺️', book: '📚', smile: '😊', rocket: '🚀', award: '🏆' };

  useEffect(() => {
    const saved = localStorage.getItem('pinStudioProject');
    if (saved) { const data = JSON.parse(saved); setImage(data.image); setHotspots(data.hotspots); }
  }, []);

  useEffect(() => {
    if (image || hotspots.length > 0) localStorage.setItem('pinStudioProject', JSON.stringify({ image, hotspots }));
  }, [image, hotspots]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => { setImage(event.target.result); setHotspots([]); setSelectedHotspot(null); };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const clearHotspots = () => { if (window.confirm('Borrar hotspots?')) { setHotspots([]); setSelectedHotspot(null); } };
  const clearAll = () => { if (window.confirm('Borrar TODO?')) { localStorage.removeItem('pinStudioProject'); setImage(null); setHotspots([]); setSelectedHotspot(null); } };

  const handleCanvasMouseDown = (e) => {
    if (!image || studentMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
    if (selectedHotspot) {
      const h = selectedHotspot;
      if (mouseX >= h.x && mouseX <= h.x + h.width && mouseY >= h.y && mouseY <= h.y + h.height) {
        setIsMoving(true);
        setStartPos({ x: mouseX - h.x, y: mouseY - h.y });
        return;
      }
    }
    if (!drawMode) return;
    setIsDrawing(true);
    setStartPos({ x: mouseX, y: mouseY });
  };

  const handleCanvasMouseMove = (e) => {
    if (!image || studentMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
    if (isMoving && selectedHotspot && startPos) {
      updateHotspot(selectedHotspot.id, { x: mouseX - startPos.x, y: mouseY - startPos.y });
      return;
    }
    if (!isDrawing || !startPos) return;
    setCurrentDraw({ x: startPos.x, y: startPos.y, width: mouseX - startPos.x, height: mouseY - startPos.y });
  };

  const handleCanvasMouseUp = () => {
    if (isMoving) { setIsMoving(false); setStartPos(null); return; }
    if (!isDrawing || !currentDraw) return;
    setIsDrawing(false);
    if (Math.abs(currentDraw.width) > 10 && Math.abs(currentDraw.height) > 10) {
      setHotspots([...hotspots, {
        id: Date.now(), type: drawMode,
        x: Math.min(startPos.x, startPos.x + currentDraw.width),
        y: Math.min(startPos.y, startPos.y + currentDraw.height),
        width: Math.abs(currentDraw.width), height: Math.abs(currentDraw.height),
        name: 'Hotspot ' + (hotspots.length + 1), pinIcon: selectedIcon, pinSize: 12, pinColor: '#00BDAA',
        transparent: isTransparentMode, content: { text: '' }
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
    const data = { hotspots, version: '3.0.0', timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pin-studio.json'; a.click();
  };

  const exportHTML = () => {
    if (!image) return;
    const hotspotsJSON = JSON.stringify(hotspots);
    const html = '<!DOCTYPE html><html><head><meta charset=UTF-8><title>PIN STUDIO</title><style>*{margin:0;padding:0}body{font-family:Arial;background:#EAEAEA;padding:20px}canvas{width:100%;border:2px solid #ddd}</style></head><body><h1>PIN STUDIO</h1><canvas id=c></canvas><script>const h=' + hotspotsJSON + ';const i={star:"⭐",diamond:"💎",heart:"❤️",target:"🎯",bell:"🔔",flag:"🚩",pin:"📍",spark:"✨",flame:"🔥",checkmark:"✓",info:"ℹ️",light:"💡",map:"🗺️",book:"📚",smile:"😊",rocket:"🚀",award:"🏆"};const c=document.getElementById("c");const x=c.getContext("2d");const img=new Image();img.onload=()=>{c.width=Math.min(img.width,900);c.height=img.height*(c.width/img.width);x.drawImage(img,0,0,c.width,c.height);const sx=c.width/img.width;const sy=c.height/img.height;h.forEach(a=>{const px=a.x*sx,py=a.y*sy,pw=a.width*sx,ph=a.height*sy;if(!a.transparent){x.fillStyle=a.pinColor;x.beginPath();x.arc(px+pw/2,py+ph/2,a.pinSize*1.5,0,2*Math.PI);x.fill();x.fillStyle="white";x.font="bold "+(a.pinSize*2)+"px Arial";x.textAlign="center";x.textBaseline="middle";x.fillText(i[a.pinIcon]||"●",px+pw/2,py+ph/2)}});};img.src="' + image + '"<\/script></body></html>';
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pin-studio.html'; a.click();
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
      const scaleX = canvas.width / img.width, scaleY = canvas.height / img.height;
      hotspots.forEach((h) => {
        const x = h.x * scaleX, y = h.y * scaleY, w = h.width * scaleX, he = h.height * scaleY;
        ctx.strokeStyle = selectedHotspot?.id === h.id ? '#00BDAA' : 'rgba(0, 189, 170, 0.3)';
        ctx.lineWidth = selectedHotspot?.id === h.id ? 3 : 2;
        ctx.fillStyle = selectedHotspot?.id === h.id ? 'rgba(0, 189, 170, 0.15)' : 'rgba(0, 189, 170, 0.08)';
        if (h.type === 'rect') { ctx.fillRect(x, y, w, he); ctx.strokeRect(x, y, w, he); }
        else { ctx.beginPath(); ctx.arc(x + w / 2, y + he / 2, Math.abs(w) / 2, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }
        if (!h.transparent) {
          ctx.fillStyle = h.pinColor;
          ctx.beginPath();
          ctx.arc(x + w / 2, y + he / 2, h.pinSize * 1.5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = 'white'; ctx.font = 'bold ' + (h.pinSize * 2) + 'px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(icons[h.pinIcon] || '●', x + w / 2, y + he / 2);
        }
      });
      if (currentDraw) { ctx.strokeStyle = '#A1DD70'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.strokeRect(currentDraw.x, currentDraw.y, currentDraw.width, currentDraw.height); ctx.setLineDash([]); }
    };
    img.src = image;
  }, [hotspots, selectedHotspot, currentDraw, image]);

  if (!image) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #00BDAA, #A1DD70)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '30px', padding: '48px', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#00BDAA', marginBottom: '16px' }}>PIN STUDIO PRO</h1>
        <p style={{ color: '#666', fontSize: '18px', marginBottom: '32px' }}>Crea imágenes interactivas</p>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: 'linear-gradient(to right, #00BDAA, #A1DD70)', color: 'white', fontWeight: 700, padding: '16px', borderRadius: '12px', width: '100%', border: 'none', cursor: 'pointer', fontSize: '16px' }}>Cargar imagen</button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ background: 'white', padding: '20px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#333' }}>PIN STUDIO PRO</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => fileInputRef.current?.click()} style={{ background: '#EAEAEA', color: '#333', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>📤 Cargar</button>
            <button onClick={clearHotspots} style={{ background: '#fde2e4', color: '#C41E3A', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>🗑️ Limpiar</button>
            <button onClick={clearAll} style={{ background: '#ff6b6b', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>⚠️ Borrar</button>
            <button onClick={() => setStudentMode(!studentMode)} style={{ background: studentMode ? '#d1fae5' : '#EAEAEA', color: studentMode ? '#065f46' : '#333', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}><Eye size={16} /> {studentMode ? 'Est' : 'Ed'}</button>
          </div>
        </div>
      </div>

      {!studentMode && (
        <div style={{ maxWidth: '1400px', margin: '32px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '32px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <select value={selectedIcon} onChange={(e) => setSelectedIcon(e.target.value)} disabled={isTransparentMode} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}>
                {Object.entries(icons).map(([k, e]) => (<option key={k} value={k}>{e}</option>))}
              </select>
              <button onClick={() => setIsTransparentMode(!isTransparentMode)} style={{ background: isTransparentMode ? '#00BDAA' : '#EAEAEA', color: isTransparentMode ? 'white' : '#333', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>👻</button>
              <button onClick={() => setDrawMode(drawMode === 'rect' ? null : 'rect')} style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 600, border: '2px solid', borderColor: drawMode === 'rect' ? '#00BDAA' : '#ddd', background: drawMode === 'rect' ? '#00BDAA' : 'white', color: drawMode === 'rect' ? 'white' : '#333', cursor: 'pointer' }}>▭</button>
              <button onClick={() => setDrawMode(drawMode === 'circle' ? null : 'circle')} style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 600, border: '2px solid', borderColor: drawMode === 'circle' ? '#00BDAA' : '#ddd', background: drawMode === 'circle' ? '#00BDAA' : 'white', color: drawMode === 'circle' ? 'white' : '#333', cursor: 'pointer' }}>◯</button>
            </div>
            <canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} style={{ width: '100%', border: '2px solid #ddd', borderRadius: '12px', cursor: isMoving ? 'grabbing' : drawMode ? 'crosshair' : 'default', display: 'block' }} />
          </div>

          <div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Hotspots ({hotspots.length})</h3>
              {hotspots.map((h) => (
                <div key={h.id} onClick={() => setSelectedHotspot(h)} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px', background: selectedHotspot?.id === h.id ? '#e0f2f1' : '#fafafa', border: '2px solid', borderColor: selectedHotspot?.id === h.id ? '#00BDAA' : '#ddd' }}>
                  <p style={{ fontWeight: 600, fontSize: '14px' }}>{h.name}</p>
                </div>
              ))}
            </div>

            {selectedHotspot && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                <input type="text" value={selectedHotspot.name} onChange={(e) => updateHotspot(selectedHotspot.id, { name: e.target.value })} style={{ width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '8px', marginBottom: '12px', fontSize: '13px' }} />
                {!selectedHotspot.transparent && (
                  <select value={selectedHotspot.pinIcon} onChange={(e) => updateHotspot(selectedHotspot.id, { pinIcon: e.target.value })} style={{ width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '8px', marginBottom: '12px', fontSize: '13px' }}>
                    {Object.entries(icons).map(([k, e]) => (<option key={k} value={k}>{e}</option>))}
                  </select>
                )}
                <textarea value={selectedHotspot.content.text} onChange={(e) => updateHotspot(selectedHotspot.id, { content: { text: e.target.value } })} placeholder="Contenido..." style={{ width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '8px', minHeight: '80px', marginBottom: '12px', fontFamily: 'inherit', fontSize: '13px' }} />
                <button onClick={() => deleteHotspot(selectedHotspot.id)} style={{ width: '100%', background: '#ffe0e0', color: '#C41E3A', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Eliminar</button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowPreview(true)} style={{ flex: 1, background: '#8559A5', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Preview</button>
              <button onClick={exportJSON} style={{ flex: 1, background: '#A1DD70', color: '#333', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>JSON</button>
              <button onClick={exportHTML} style={{ flex: 1, background: '#00BDAA', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>HTML</button>
            </div>
          </div>
        </div>
      )}

      {studentMode && (
        <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px' }}>
          <canvas ref={canvasRef} style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
        </div>
      )}

      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '95%', height: '95vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Vista previa</h2>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>X</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px', background: '#EAEAEA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowPreview(false)} style={{ background: '#EAEAEA', color: '#333', padding: '10px 24px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cerrar</button>
              <button onClick={exportHTML} style={{ background: '#00BDAA', color: 'white', padding: '10px 24px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Descargar</button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
    </div>
  );
}