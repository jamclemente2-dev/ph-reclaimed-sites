import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

function Lightbox({ photos, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const prev = useCallback(() => {
    setIndex(i => (i - 1 + photos.length) % photos.length);
    resetZoom();
  }, [photos.length, resetZoom]);

  const next = useCallback(() => {
    setIndex(i => (i + 1) % photos.length);
    resetZoom();
  }, [photos.length, resetZoom]);

  const zoomIn = useCallback(() => {
    setScale(s => Math.min(s + 0.5, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(s => Math.max(s - 0.5, 1));
    if (scale <= 1.5) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-' || e.key === '_') zoomOut();
      if (e.key === '0') resetZoom();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, prev, next, zoomIn, zoomOut, resetZoom]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale(s => Math.min(s + 0.2, 5));
    } else {
      setScale(s => {
        const newScale = Math.max(s - 0.2, 1);
        if (newScale === 1) setPosition({ x: 0, y: 0 });
        return newScale;
      });
    }
  }, []);

  // Mouse drag (pan)
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="lightbox-overlay" onClick={handleOverlayClick}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        <X size={26} />
      </button>

      {/* Zoom controls */}
      <div className="lightbox-zoom-controls">
        <button 
          className="zoom-btn" 
          onClick={zoomIn} 
          disabled={scale >= 5}
          aria-label="Zoom in"
          title="Zoom in (+ key)"
        >
          <ZoomIn size={20} />
        </button>
        <span className="zoom-level">{Math.round(scale * 100)}%</span>
        <button 
          className="zoom-btn" 
          onClick={zoomOut} 
          disabled={scale <= 1}
          aria-label="Zoom out"
          title="Zoom out (- key)"
        >
          <ZoomOut size={20} />
        </button>
        {scale > 1 && (
          <button 
            className="zoom-btn reset-zoom" 
            onClick={resetZoom}
            aria-label="Reset zoom"
            title="Reset zoom (0 key)"
          >
            1:1
          </button>
        )}
      </div>

      {photos.length > 1 && (
        <button className="lightbox-nav lightbox-prev" onClick={prev} aria-label="Previous photo">
          <ChevronLeft size={38} />
        </button>
      )}

      <div 
        className="lightbox-img-container"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          overflow: 'hidden'
        }}
      >
        <img
          ref={imgRef}
          src={photos[index]}
          alt={`Photo ${index + 1} of ${photos.length}`}
          className="lightbox-img"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          draggable={false}
        />
      </div>

      {photos.length > 1 && (
        <button className="lightbox-nav lightbox-next" onClick={next} aria-label="Next photo">
          <ChevronRight size={38} />
        </button>
      )}

      {photos.length > 1 && (
        <div className="lightbox-counter">
          {index + 1} / {photos.length}
        </div>
      )}

      {/* Instructions */}
      {scale === 1 && (
        <div className="lightbox-instructions">
          Scroll or use +/- keys to zoom • Drag to pan when zoomed
        </div>
      )}
    </div>
  );
}

export default Lightbox;
