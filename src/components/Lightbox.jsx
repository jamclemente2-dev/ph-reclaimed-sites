import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

function Lightbox({ photos, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);

  const prev = useCallback(() => {
    setIndex(i => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const next = useCallback(() => {
    setIndex(i => (i + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, prev, next]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="lightbox-overlay" onClick={handleOverlayClick}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        <X size={26} />
      </button>

      {photos.length > 1 && (
        <button className="lightbox-nav lightbox-prev" onClick={prev} aria-label="Previous photo">
          <ChevronLeft size={38} />
        </button>
      )}

      <img
        src={photos[index]}
        alt={`Photo ${index + 1} of ${photos.length}`}
        className="lightbox-img"
      />

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
    </div>
  );
}

export default Lightbox;
