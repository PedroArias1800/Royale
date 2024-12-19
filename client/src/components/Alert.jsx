import React, { useState, useEffect } from 'react';

export const Alert = ({ message, onClose, duration = 6000 }) => {
  const [showAlert, setShowAlert] = useState(false);

  // Mostrar alerta cuando el mensaje cambie
  useEffect(() => {
    if (message) {
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
        if (onClose) onClose(); // Llamar la función de cierre, si existe
      }, duration);
    }
  }, [message, duration, onClose]);

  // Función para cerrar la alerta manualmente
  const closeAlert = () => {
    setShowAlert(false);
    if (onClose) onClose();
  };

  return (
    showAlert && (
      <div className="alert">
        <span className="alert-text">{message}</span>
        <button className="close-btn" onClick={closeAlert}>X</button>
      </div>
    )
  );
};
