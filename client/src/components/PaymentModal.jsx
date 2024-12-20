import React, { useState, useEffect, useContext } from "react";
import { ParfumContext } from "../context/ParfumContext";

export const PaymentModal = ({ isOpen, onClose, onSubmit }) => {
  const { openModal } = useContext(ParfumContext);

  const [isVisible, setIsVisible] = useState(isOpen);

  // Usamos useEffect para manejar la animación
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300); // Esperar 300ms para animación de cierre
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data);
  };

  return (
    <div className={`modal-overlay2 ${isOpen ? 'open' : 'close'}`}>
      <div className={`modal-content2 ${isOpen ? 'open' : 'close'}`}>
        <div className="modalPaymentTitle">
          <h2>Completa tus datos</h2>
          <button className="close-btn2" onClick={onClose}>X</button>
        </div>
        <form onSubmit={handleSubmit} className="payment-form2">
          <div className="form-group3">
            <div className="form-group2">
              <label htmlFor="name">Nombre y Apellido</label>
              <input type="text" id="name" name="name" placeholder="Omar Sánchez" required autoComplete="name" />
            </div>
            <div className="form-group2">
              <label htmlFor="phone">Teléfono</label>
              <input type="tel" id="phone" name="phone" placeholder="6212-6212" required autoComplete="tel" />
            </div>
          </div>
          <div className="form-group2">
            <label htmlFor="email">Correo</label>
            <input type="email" id="email" name="email" placeholder="correo@gmail.com" required autoComplete="email" />
          </div>
          <div className="form-group2">
            <label htmlFor="address">Dirección</label>
            <input type="text" id="address" name="address" placeholder="Panamá Norte, Las Cumbres, Calle El Bosque" autoComplete="address-line1" />
          </div>
          <div className="form-group2 inputsChecks">
            <input type="checkbox" id="terms" name="terms" required />
            <label htmlFor="terms">
              Acepto los <button type="button" onClick={(e) => { e.preventDefault(); openModal('terms'); }}>
                Términos y Condiciones
              </button>
            </label>
          </div>
          <div className="form-group2 inputsChecks">
            <input type="checkbox" id="privacy" name="privacy" required />
            <label htmlFor="privacy">
              Acepto los <button type="button" onClick={(e) => { e.preventDefault(); openModal('privacy'); }}>
                Privacidad de Datos
              </button>
            </label>
          </div>
          <div className="submit-btn2">
            <button type="submit" className="pagar">Pagar</button>
          </div>
        </form>
      </div>
    </div>
  );
};
