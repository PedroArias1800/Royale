import { useContext } from 'react';
import { ParfumContext } from '../context/ParfumContext';

export const PrivacyTermModal = () => {
    const { isModalOpen, modalContent, closeModal } = useContext(ParfumContext);

    if (!isModalOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{modalContent.title}</h2>
                <p dangerouslySetInnerHTML={{ __html: modalContent.text }}></p>
                <button onClick={closeModal} className="accept-button">
                    Aceptar
                </button>
            </div>
        </div>
    );
};
