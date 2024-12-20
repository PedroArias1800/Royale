import React, { useState, useEffect } from 'react';

export const Alert = ({ message, onClose, duration = 6000 }) => {
  const [showAlert, setShowAlert] = useState(false); // Controla la visibilidad completa
  const [isVisible, setIsVisible] = useState(false); // Controla la transición de aparición

  useEffect(() => {
    if (message) {
      setShowAlert(true);

      // Retrasar la aplicación de la clase visible
      const appearanceTimer = setTimeout(() => {
        setIsVisible(true); // Agrega la clase visible para la transición
      }, 10);

      // Ocultar después de la duración especificada
      const disappearanceTimer = setTimeout(() => {
        setIsVisible(false); // Comienza la transición de desaparición
        setTimeout(() => {
          setShowAlert(false); // Elimina completamente el componente
          if (onClose) onClose();
        }, 500); // Coincide con la duración de la transición
      }, duration);

      return () => {
        clearTimeout(appearanceTimer);
        clearTimeout(disappearanceTimer);
      };
    }
  }, [message, duration, onClose]);

  const closeAlert = () => {
    setIsVisible(false); // Inicia la transición de desaparición
    setTimeout(() => {
      setShowAlert(false); // Elimina el componente
      if (onClose) onClose();
    }, 500);
  };

  if (!showAlert) return null;

  return (
    <div className={`alert ${isVisible ? 'visible' : 'hidden'}`}>
      <span className="alert-text">{message}</span>
      <button className="close-btn" onClick={closeAlert}>X</button>
    </div>
  );
};