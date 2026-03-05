import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Download, Upload, Plus, X, Eye } from 'lucide-react';

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
  const [selectedIcon, setSelectedIcon] = useState('star');
  const [isTransparentMode, setIsTransparentMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [studentMode, setStudentMode] = useState(false);

  const icons = {
    star: '⭐', diamond: '💎', heart: '❤️', target: '🎯',
    bell: '🔔', flag: '🚩', pin: '📍', spark: '✨', flame: '🔥',
    checkmark: '✓', info: 'ℹ️', light: '💡', map: '🗺️', 
    book: '📚', smile: '😊', rocket: '🚀', award: '🏆',
  };

  useEffect(() => {
    const saved = localStorage.getItem('pinStudioProject');
    if (saved) {
      const data = JSON.parse(saved);
      setImage(data.image);
      setHotspots(data.hotspots);
    }
  }, []);

  useEffect(() => {
    if (image || hotspots.length > 0) {
      localStorage.setItem('pinStudioProject', JSON.stringify({ image, hotspots }));
    }
  }, [image, hotspots]);

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

  const clearImage = () => {
    if (window.confirm('¿Descartar imagen y hotspots?')) {
      setImage(null);
      setHotspots([]);
      setSelectedHotspot(null);
    }
  };

  const clearAll = () => {
    if (window.confirm('¿Borrar TODO? No se puede deshacer.')) {
      localStorage.removeItem('pinStudioProject');
      setImage(null);
      setHotspots([]);
      setSelectedHotspot(null);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (!image || studentMode) return;
    if (!drawMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setIsDrawing(true);
    setStartPos({ x: mouseX, y: mouseY });
  };

  const handleCanvasMouseMove = (e) => {
    if (!image || studentMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (!isDrawing || !startPos) return;
    setCurrentDraw({
      x: startPos.x,
      y: startPos.y,
      width: mouseX - startPos.x,
      height: mouseY - startPos.y,
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
        name: 'Hotspot ' + (hotspots.length + 1),
        pinIcon: isTransparentMode ? 'star' : selectedIcon,
        pinSize: 12,
        pinColor: '#F26076',
        transparent: isTransparentMode,
        content: { type: 'text', text: '' }
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
    a.href = url;
    a.download = 'pin-studio.json';
    a.click();
  };

  const exportHTML = () => {
    if (!image) return;
    const hotspotsJSON = JSON.stringify(hotspots);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PIN STUDIO</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial;background:#f3f4f6;padding:20px}.container{max-width:1200px;margin:0 auto}h1{text-align:center;color:#1f2937;margin-bottom:30px}canvas{width:100%;border:2px solid #d1d5db;border-radius:8px;display:block}.hotspot-btn{position:absolute;background:#F26076;color:white;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;font-weight:bold;display:flex;align-items:center;justify-content:center;font-size:18px}.hotspot-btn:hover{transform:scale(1.2);background:#FF9760}.modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center}.modal.active{display:flex}.modal-content{background:white;padding:30px;border-radius:12px;max-width:500px;width:90%}h2{margin-bottom:20px}p{margin-bottom:15px}button{padding:10px 20px;background:#458B73;color:white;border:none;border-radius:6px;cursor:pointer}</style></head><body><div class="container"><h1>PIN STUDIO</h1><canvas id="canvas"></canvas></div><div id="modal" class="modal"><div class="modal-content"><h2 id="modalTitle"></h2><div id="modalBody"></div><button onclick="closeModal()">Cerrar</button></div></div><script>const hotspotsData=${hotspotsJSON};const imageData='${image}';const icons={star:'⭐',diamond:'💎',heart:'❤️',target:'🎯',bell:'🔔',flag:'🚩',pin:'📍',spark:'✨',flame:'🔥',checkmark:'✓',info:'ℹ️',light:'💡',map:'🗺️',book:'📚',smile:'😊',rocket:'🚀',award:'🏆'};function initCanvas(){const canvas=document.getElementById('canvas');const ctx=canvas.getContext('2d');const img=new Image();img.onload=()=>{canvas.width=Math.min(img.width,900);canvas.height=(img.height/img.width)*canvas.width;ctx.drawImage(img,0,0,canvas.width,canvas.height);const scaleX=canvas.width/img.width;const scaleY=canvas.height/img.height;hotspotsData.forEach((h,idx)=>{const x=h.x*scaleX,y=h.y*scaleY,w=h.width*scaleX,he=h.height*scaleY;if(!h.transparent){ctx.fillStyle=h.pinColor;ctx.beginPath();ctx.arc(x+w/2,y+he/2,h.pinSize*1.5,0,2*Math.PI);ctx.fill();ctx.fillStyle='white';ctx.font='bold '+(h.pinSize*2)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(icons[h.pinIcon]||'●',x+w/2,y+he/2)}});hotspotsData.forEach((h,idx)=>{const x=h.x*scaleX,y=h.y*scaleY,w=h.width*scaleX,he=h.height*scaleY;if(h.transparent){const area=document.createElement('div');area.style.position='absolute';area.style.left=x+'px';area.style.top=y+'px';area.style.width=w+'px';area.style.height=he+'px';area.style.cursor='pointer';area.style.borderRadius=h.type==='circle'?'50%':'0';area.onclick=()=>showModal(h,idx+1);document.querySelector('body').appendChild(area)}else{const btn=document.createElement('button');btn.className='hotspot-btn';btn.textContent=icons[h.pinIcon]||'●';btn.style.left=(x+w/2-20)+'px';btn.style.top=(y+he/2-20)+'px';btn.style.position='absolute';btn.onclick=()=>showModal(h,idx+1);document.querySelector('body').appendChild(btn)}});};img.src=imageData}function showModal(hotspot,number){document.getElementById('modalTitle').textContent=hotspot.name+' (#'+number+')';const body=document.getElementById('modalBody');body.innerHTML='<p>'+(hotspot.content.text||'Sin contenido')+'</p>';document.getElementById('modal').classList.add('active')}function closeModal(){document.getElementById('modal').classList.remove('active')}window.addEventListener('click',(e)=>{if(e.target.id==='modal')closeModal()});initCanvas()<\/script></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pin-studio.html';
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
      
      hotspots.forEach((h) => {
        const x = h.x * scaleX, y = h.y * scaleY, w = h.width * scaleX, he = h.height * scaleY;
        ctx.strokeStyle = selectedHotspot?.id === h.id ? '#458B73' : 'rgba(242, 96, 118, 0.3)';
        ctx.lineWidth = selectedHotspot?.id === h.id ? 3 : 2;
        ctx.fillStyle = selectedHotspot?.id === h.id ? 'rgba(242, 96, 118, 0.15)' : 'rgba(242, 96, 118, 0.08)';
        
        if (h.type === 'rect') {
          ctx.fillRect(x, y, w, he);
          ctx.strokeRect(x, y, w, he);
        } else {
          ctx.beginPath();
          ctx.arc(x + w / 2, y + he / 2, Math.abs(w) / 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
        
        if (!h.transparent) {
          ctx.fillStyle = h.pinColor;
          ctx.beginPath();
          ctx.arc(x + w / 2, y + he / 2, h.pinSize * 1.5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.font = 'bold ' + (h.pinSize * 2) + 'px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(icons[h.pinIcon] || '●', x + w / 2, y + he / 2);
        }
      });

      if (currentDraw && !isTransparentMode) {
        ctx.fillStyle = selectedIcon ? icons[selectedIcon] : '⭐';
        ctx.fillStyle = '#F26076';
        ctx.beginPath();
        ctx.arc(currentDraw.x + currentDraw.width / 2, currentDraw.y + currentDraw.height / 2, 12 * 1.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icons[selectedIcon], currentDraw.x + currentDraw.width / 2, currentDraw.y + currentDraw.height / 2);
      }

      if (currentDraw) {
        ctx.strokeStyle = '#FFD150';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(currentDraw.x, currentDraw.y, currentDraw.width, currentDraw.height);
        ctx.setLineDash([]);
      }
    };
    img.src = image;
  }, [hotspots, selectedHotspot, currentDraw, image, selectedIcon, isTransparentMode]);

  if (!image) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F26076 0%, #FF9760 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '48px', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#F26076', marginBottom: '16px' }}>PIN STUDIO PRO</h1>
          <p style={{ color: '#666', fontSize: '18px', marginBottom: '32px' }}>Crea imágenes interactivas con hotspots</p>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: 'linear-gradient(to right, #F26076, #FF9760)', color: 'white', fontWeight: 700, padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%', border: 'none', cursor: 'pointer', fontSize: '16px', marginBottom: '16px' }}>
            <Upload size={24} /> Cargar imagen
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ background: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '20px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>PIN STUDIO PRO</h1>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => fileInputRef.current?.click()} style={{ background: '#e5e7eb', color: '#1f2937', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                📤 Cargar imagen
              </button>
              <button onClick={clearImage} style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                🗑️ Limpiar imagen
              </button>
              <button onClick={clearAll} style={{ background: '#fecaca', color: '#991b1b', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                ⚠️ Borrar todo
              </button>
              <button onClick={() => setStudentMode(!studentMode)} style={{ background: studentMode ? '#d1fae5' : '#e5e7eb', color: studentMode ? '#065f46' : '#1f2937', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                <Eye size={16} style={{ marginRight: '6px' }} /> {studentMode ? 'Modo Estudiante' : 'Modo Editor'}
              </button>
            </div>
          </div>

          {!studentMode && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontWeight: 600, fontSize: '14px' }}>Icono:</label>
                <select value={selectedIcon} onChange={(e) => setSelectedIcon(e.target.value)} disabled={isTransparentMode} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '16px', background: isTransparentMode ? '#f3f4f6' : 'white', cursor: isTransparentMode ? 'not-allowed' : 'pointer' }}>
                  {Object.entries(icons).map(([key, emoji]) => (<option key={key} value={key}>{emoji}</option>))}
                </select>
              </div>

              <button onClick={() => setIsTransparentMode(!isTransparentMode)} style={{ background: isTransparentMode ? '#F26076' : '#e5e7eb', color: isTransparentMode ? 'white' : '#1f2937', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                👻 {isTransparentMode ? 'Zona Transparente (activa)' : 'Zona Transparente'}
              </button>

              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <button onClick={() => setDrawMode(drawMode === 'rect' ? null : 'rect')} style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 600, border: '2px solid', borderColor: drawMode === 'rect' ? '#F26076' : '#d1d5db', background: drawMode === 'rect' ? '#F26076' : 'white', color: drawMode === 'rect' ? 'white' : '#1f2937', cursor: 'pointer' }}>
                  ▭ Rectángulo
                </button>
                <button onClick={() => setDrawMode(drawMode === 'circle' ? null : 'circle')} style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 600, border: '2px solid', borderColor: drawMode === 'circle' ? '#F26076' : '#d1d5db', background: drawMode === 'circle' ? '#F26076' : 'white', color: drawMode === 'circle' ? 'white' : '#1f2937', cursor: 'pointer' }}>
                  ◯ Círculo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!studentMode && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '32px' }}>
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
            {drawMode ? (
              <p style={{ background: '#fef3c7', border: '1px solid #fcd34d', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, color: '#92400e' }}>
                ✏️ {isTransparentMode ? '👻 Dibuja una zona transparente' : `🎯 Dibuja un ${drawMode === 'rect' ? 'rectángulo' : 'círculo'} con ${icons[selectedIcon]}`}
              </p>
            ) : (
              <p style={{ background: '#e0e7ff', border: '1px solid #c7d2fe', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, color: '#3730a3' }}>
                👈 Elige un icono y una forma (Rectángulo o Círculo)
              </p>
            )}
            <canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} style={{ width: '100%', border: '2px solid #d1d5db', borderRadius: '12px', cursor: drawMode ? 'crosshair' : 'default', display: 'block', background: '#f9fafb' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px', color: '#1f2937' }}>🎯 Hotspots ({hotspots.length})</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {hotspots.map((h) => (
                  <div key={h.id} onClick={() => setSelectedHotspot(h)} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px', background: selectedHotspot?.id === h.id ? '#fef3c7' : '#f9fafb', border: '2px solid', borderColor: selectedHotspot?.id === h.id ? '#F26076' : '#e5e7eb' }}>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{h.name}</p>
                    <p style={{ fontSize: '12px', color: '#666' }}>{h.transparent ? '👻 Zona transparente' : icons[h.pinIcon] + ' Punto caliente'}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedHotspot && (
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nombre</label>
                  <input type="text" value={selectedHotspot.name} onChange={(e) => updateHotspot(selectedHotspot.id, { name: e.target.value })} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', fontSize: '13px' }} />
                </div>
                {!selectedHotspot.transparent && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Icono</label>
                    <select value={selectedHotspot.pinIcon} onChange={(e) => updateHotspot(selectedHotspot.id, { pinIcon: e.target.value })} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', fontSize: '13px' }}>
                      {Object.entries(icons).map(([key, emoji]) => (<option key={key} value={key}>{emoji}</option>))}
                    </select>
                  </div>
                )}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Contenido</label>
                  <textarea value={selectedHotspot.content.text} onChange={(e) => updateHotspot(selectedHotspot.id, { content: { ...selectedHotspot.content, text: e.target.value } })} placeholder="Escribe el contenido..." style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', fontSize: '13px', minHeight: '80px', fontFamily: 'inherit' }} />
                </div>
                <button onClick={() => deleteHotspot(selectedHotspot.id)} style={{ width: '100%', background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  🗑️ Eliminar
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowPreview(true)} style={{ flex: 1, background: '#FFD150', color: '#1f2937', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                👁️ Vista previa
              </button>
              <button onClick={exportJSON} style={{ flex: 1, background: '#458B73', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                💾 JSON
              </button>
              <button onClick={exportHTML} style={{ flex: 1, background: '#F26076', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                🌐 HTML
              </button>
            </div>
          </div>
        </div>
      )}

      {studentMode && (
        <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px' }}>
          <iframe srcDoc={exportHTML()} style={{ width: '100%', height: '800px', border: 'none', borderRadius: '12px' }} title="Modo estudiante" />
        </div>
      )}

      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '95%', height: '95vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Vista previa</h2>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>✕</button>
            </div>
            <iframe srcDoc={exportHTML()} style={{ flex: 1, border: 'none' }} title="Vista previa" />
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
    </div>
  );
}