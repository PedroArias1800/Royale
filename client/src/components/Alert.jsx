import { useState, useEffect } from 'react';

export const Alert = ({ message, color, color2, onClose, onClick, duration = 6000 }) => {
  const [showAlert, setShowAlert] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (message) {
      setShowAlert(true);
      setProgress(100);

      const appearTimer = setTimeout(() => setIsVisible(true), 10);

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.max(0, prev - (100 / (duration / 100))));
      }, 100);

      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        clearInterval(progressInterval);
        setTimeout(() => {
          setShowAlert(false);
          if (onClose) onClose();
        }, 450);
      }, duration);

      return () => {
        clearTimeout(appearTimer);
        clearTimeout(hideTimer);
        clearInterval(progressInterval);
      };
    }
  }, [message, duration, onClose]);

  const closeAlert = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowAlert(false);
      if (onClose) onClose();
    }, 450);
  };

  if (!showAlert) return null;

  const handleClick = onClick
    ? () => { closeAlert(); onClick(); }
    : undefined;

  return (
    <div
      className={`alert ${isVisible ? 'visible' : 'hidden'}${onClick ? ' alert--clickable' : ''}`}
      style={{ '--accent': `var(${color})` }}
      onClick={handleClick}
    >
      <div className="alert__progress" style={{ width: `${progress}%` }} />
      <span className="alert-text">{message}</span>
      <button className="close-btn" onClick={closeAlert} aria-label="Cerrar">✕</button>
    </div>
  );
};
