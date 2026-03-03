import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Download, Upload, Plus, X, Move, Eye } from 'lucide-react';

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
  const [isMovingPin, setIsMovingPin] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [studentMode, setStudentMode] = useState(false);

  const icons = {
    star: '⭐', diamond: '💎', circle: '●', heart: '❤️', target: '🎯',
    bell: '🔔', flag: '🚩', pin: '📍', spark: '✨', flame: '🔥',
    checkmark: '✓', question: '?', info: 'ℹ️', light: '💡', map: '🗺️', 
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

  const handleCanvasMouseDown = (e) => {
    if (!image || studentMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isMovingPin && selectedHotspot) return;
    if (!drawMode) return;
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
        pinIcon: 'star',
        pinSize: globalPinSize,
        pinColor: '#3B82F6',
        numberColor: '#FFFFFF',
        showBorder: true,
        transparent: false,
        tooltip: '',
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

  const duplicateHotspot = (id) => {
    const original = hotspots.find(h => h.id === id);
    if (original) {
      const newHotspot = { ...original, id: Date.now(), name: original.name + ' (copia)', x: original.x + 30, y: original.y + 30 };
      setHotspots([...hotspots, newHotspot]);
    }
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
    const data = { hotspots, version: '2.1.0', timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pin-studio-proyecto.json';
    a.click();
  };

  const generatePreviewHTML = () => {
    if (!image) return '';
    const hotspotsJSON = JSON.stringify(hotspots);
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PIN STUDIO</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial;background:#f3f4f6;padding:20px}.container{max-width:1200px;margin:0 auto}h1{text-align:center;color:#1f2937}canvas{width:100%;border:2px solid #d1d5db;border-radius:8px}.hotspot-btn{position:absolute;background:#3b82f6;color:white;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;font-weight:bold;display:flex;align-items:center;justify-content:center}.modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center}.modal.active{display:flex}.modal-content{background:white;padding:30px;border-radius:12px;max-width:500px;width:90%}</style></head><body><div class="container"><h1>PIN STUDIO</h1><canvas id="canvas"></canvas></div><div id="modal" class="modal"><div class="modal-content"><h2 id="modalTitle"></h2><div id="modalBody"></div><button onclick="closeModal()" style="margin-top:20px;padding:10px;background:#e5e7eb;border:none;border-radius:6px;cursor:pointer;width:100%">Cerrar</button></div></div><script>const hotspotsData=' + hotspotsJSON + ';const imageData="' + image + '";const icons={star:"⭐",diamond:"💎",circle:"●",heart:"❤️",target:"🎯",bell:"🔔",flag:"🚩",pin:"📍",spark:"✨",flame:"🔥",checkmark:"✓",question:"?",info:"ℹ️",light:"💡",map:"🗺️",book:"📚",smile:"😊",rocket:"🚀",award:"🏆"};function initCanvas(){const canvas=document.getElementById("canvas");const ctx=canvas.getContext("2d");const img=new Image();img.onload=()=>{canvas.width=Math.min(img.width,900);canvas.height=(img.height/img.width)*canvas.width;ctx.drawImage(img,0,0,canvas.width,canvas.height);const scaleX=canvas.width/img.width;const scaleY=canvas.height/img.height;hotspotsData.forEach((h,idx)=>{const x=h.x*scaleX,y=h.y*scaleY,w=h.width*scaleX,he=h.height*scaleY;ctx.fillStyle=h.pinColor;ctx.beginPath();ctx.arc(x+w/2,y+he/2,h.pinSize*1.5,0,2*Math.PI);ctx.fill();ctx.fillStyle=h.numberColor;ctx.font="bold "+(h.pinSize*2)+"px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(icons[h.pinIcon]||"●",x+w/2,y+he/2)});hotspotsData.forEach((h,idx)=>{const x=h.x*scaleX,y=h.y*scaleY,w=h.width*scaleX,he=h.height*scaleY;const btn=document.createElement("button");btn.className="hotspot-btn";btn.textContent=icons[h.pinIcon]||"●";btn.style.left=(x+w/2-20)+"px";btn.style.top=(y+he/2-20)+"px";btn.onclick=()=>showModal(h,idx+1);document.querySelector("body").appendChild(btn)});};img.src=imageData}function showModal(hotspot,number){document.getElementById("modalTitle").textContent=hotspot.name+" (#"+number+")";const body=document.getElementById("modalBody");if(hotspot.content.type==="text")body.innerHTML="<p>"+(hotspot.content.text||"")+"</p>";else if(hotspot.content.type==="url")body.innerHTML="<p><a href=\\""+hotspot.content.url+"\\" target=\\"_blank\\">Abrir →</a></p>";else if(hotspot.content.type==="video")body.innerHTML="<iframe width=\\"100%\\" height=\\"300\\" src=\\"https://www.youtube.com/embed/"+hotspot.content.videoUrl+"\\" allowfullscreen></iframe>";document.getElementById("modal").classList.add("active")}function closeModal(){document.getElementById("modal").classList.remove("active")}window.addEventListener("click",(e)=>{if(e.target.id==="modal")closeModal()});initCanvas()<\/script></body></html>';
  };

  const exportHTML = () => {
    const html = generatePreviewHTML();
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
        ctx.strokeStyle = selectedHotspot?.id === h.id ? '#2563eb' : 'rgba(37, 99, 235, 0.4)';
        ctx.lineWidth = selectedHotspot?.id === h.id ? 3 : 2;
        ctx.fillStyle = selectedHotspot?.id === h.id ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.08)';
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
          ctx.fillStyle = h.numberColor;
          ctx.font = 'bold ' + (h.pinSize * 2) + 'px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(icons[h.pinIcon] || '●', x + w / 2, y + he / 2);
        }
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
          <h1 style={{ fontSize: '48px', fontWeight: 900, backgroundImage: 'linear-gradient(to right, #2563eb, #4f46e5)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' }}>PIN STUDIO PRO</h1>
          <p style={{ color: '#4b5563', fontSize: '18px', marginBottom: '32px' }}>Crea imágenes interactivas</p>
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
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>PIN STUDIO PRO - {hotspots.length} hotspots</h1>
          <button onClick={() => setStudentMode(!studentMode)} style={{ background: studentMode ? '#10b981' : '#e5e7eb', color: studentMode ? 'white' : '#1f2937', padding: '8px 24px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            {studentMode ? 'Ver como Estudiante' : 'Ver como Editor'}
          </button>
        </div>
      </div>

      {!studentMode && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <button onClick={() => setDrawMode(drawMode === 'rect' ? null : 'rect')} style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', background: drawMode === 'rect' ? '#3b82f6' : '#f3f4f6', color: drawMode === 'rect' ? 'white' : '#1f2937' }}>Rectángulo</button>
              <button onClick={() => setDrawMode(drawMode === 'circle' ? null : 'circle')} style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', background: drawMode === 'circle' ? '#3b82f6' : '#f3f4f6', color: drawMode === 'circle' ? 'white' : '#1f2937' }}>Círculo</button>
              <input type="range" min="6" max="24" value={globalPinSize} onChange={(e) => setGlobalPinSize(parseInt(e.target.value))} style={{ marginLeft: 'auto' }} />
            </div>
            <canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} style={{ width: '100%', border: '2px dashed #d1d5db', borderRadius: '12px', cursor: drawMode ? 'crosshair' : 'default', display: 'block', background: '#f9fafb' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Hotspots</h3>
              {hotspots.map((h) => (
                <div key={h.id} onClick={() => setSelectedHotspot(h)} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px', background: selectedHotspot?.id === h.id ? '#eff6ff' : '#f9fafb', border: '2px solid', borderColor: selectedHotspot?.id === h.id ? '#3b82f6' : '#e5e7eb' }}>
                  <p style={{ fontWeight: 600 }}>{h.name}</p>
                </div>
              ))}
            </div>

            {selectedHotspot && (
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
                <button onClick={() => deleteHotspot(selectedHotspot.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '12px' }}>Eliminar</button>
                <input type="text" value={selectedHotspot.name} onChange={(e) => updateHotspot(selectedHotspot.id, { name: e.target.value })} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', marginBottom: '12px' }} />
                <select value={selectedHotspot.pinIcon} onChange={(e) => updateHotspot(selectedHotspot.id, { pinIcon: e.target.value })} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', marginBottom: '12px' }}>
                  {Object.entries(icons).map(([key, emoji]) => (<option key={key} value={key}>{emoji}</option>))}
                </select>
                <input type="color" value={selectedHotspot.pinColor} onChange={(e) => updateHotspot(selectedHotspot.id, { pinColor: e.target.value })} style={{ width: '100%', height: '40px', borderRadius: '6px', marginBottom: '12px', cursor: 'pointer' }} />
                <button onClick={() => duplicateHotspot(selectedHotspot.id)} style={{ background: '#8b5cf6', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer', width: '100%', marginBottom: '12px' }}>Duplicar</button>
                <button onClick={() => setShowContentModal(true)} style={{ background: '#3b82f6', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer', width: '100%' }}>Añadir Contenido</button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowPreview(true)} style={{ flex: 1, background: '#7c3aed', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Vista previa</button>
              <button onClick={exportJSON} style={{ flex: 1, background: '#3b82f6', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>JSON</button>
              <button onClick={exportHTML} style={{ flex: 1, background: '#10b981', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>HTML</button>
            </div>
          </div>
        </div>
      )}

      {studentMode && (
        <div style={{ padding: '32px 24px' }}>
          <iframe srcDoc={generatePreviewHTML()} style={{ width: '100%', height: '800px', border: 'none', borderRadius: '12px' }} title="Modo estudiante" />
        </div>
      )}

      {showContentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%' }}>
            <h2 style={{ marginBottom: '24px' }}>Contenido</h2>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px', marginBottom: '16px' }}>
              <option value="text">Texto</option>
              <option value="url">Enlace</option>
              <option value="video">Video YouTube</option>
              <option value="quiz">Quiz</option>
            </select>
            <textarea value={contentText} onChange={(e) => setContentText(e.target.value)} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px', minHeight: '100px', marginBottom: '24px', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={saveContent} style={{ flex: 1, background: '#3b82f6', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Guardar</button>
              <button onClick={() => setShowContentModal(false)} style={{ flex: 1, background: '#e5e7eb', color: '#1f2937', padding: '12px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '95%', height: '95vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
              <h2>Vista previa</h2>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>✕</button>
            </div>
            <iframe srcDoc={generatePreviewHTML()} style={{ flex: 1, border: 'none' }} title="Vista previa" />
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
    </div>
  );
}