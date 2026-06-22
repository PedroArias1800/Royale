import { useState } from 'react';

export const ConfirmDeleteButton = ({ onConfirm }) => {
    const [confirming, setConfirming] = useState(false);

    if (confirming) {
        return (
            <div className="confirm-delete-inline">
                <span className="confirm-delete-text">¿Eliminar este registro?</span>
                <button type="button" className="btnBorrar confirm-yes" onClick={onConfirm}>
                    Sí, borrar
                </button>
                <button type="button" className="confirm-cancel" onClick={() => setConfirming(false)}>
                    Cancelar
                </button>
            </div>
        );
    }

    return (
        <input
            type="button"
            value="Borrar"
            className="btnBorrar"
            onClick={() => setConfirming(true)}
        />
    );
};
