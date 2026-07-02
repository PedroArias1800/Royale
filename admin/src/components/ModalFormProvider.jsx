import { postProvidersRequest, putProvidersRequest, deleteProvidersRequest } from '../api/Provider.api.js';
import { useAuth } from '../context/AuthProvider.jsx';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';

export const ModalFormProvider = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal, showAlert } = useAuth();
    const isUpdate = Boolean(modalData?._id);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setModalData((prevData) => ({ ...prevData, [name]: value }));
    };

    const enviarDatos = async (e) => {
        e.preventDefault();
        try {
            if (isUpdate) {
                const res = await putProvidersRequest(modalData._id, modalData);
                if (res.status == 200) {
                    showAlert('Datos actualizados con éxito', 1);
                    cargarDataTables(10);
                    closeModal();
                }
            } else {
                const res = await postProvidersRequest(modalData);
                if (res.status == 200) {
                    showAlert('Datos creados con éxito', 1);
                    cargarDataTables(10);
                    closeModal();
                }
            }
            setModalData(null);
        } catch (error) {
            console.error('Error al enviar los datos:', error);
            showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
        }
    };

    const deleteDatos = async () => {
        try {
            const res = await deleteProvidersRequest(modalData?._id);
            if (res.status == 200) {
                showAlert('Datos eliminados con éxito', 1);
            } else if (res.status == 202) {
                showAlert(res.data.message);
            } else {
                showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
            }
        } catch (error) {
            console.error('Error al enviar los datos:', error);
            showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
        }
        closeModal();
        setModalData(null);
        cargarDataTables(10);
    };

    if (!modalData) return <p>Cargando datos...</p>;

    return (
        <form onSubmit={enviarDatos}>
            <input type="hidden" name="_id" value={modalData?._id || ''} onChange={handleInputChange} />
            <div className='form-group3'>
                <label htmlFor="provider_name">
                    <p>Nombre del Proveedor</p>
                    <input
                        type="text"
                        name="provider_name"
                        id="provider_name"
                        value={modalData?.provider_name || ''}
                        onChange={handleInputChange}
                        required
                    />
                </label>
            </div>
            <div className='btnBorrarCrear' style={{ justifyContent: isUpdate ? 'space-between' : 'right' }}>
                {isUpdate && <ConfirmDeleteButton onConfirm={deleteDatos} />}
                <input type="submit" value={isUpdate ? 'Actualizar' : 'Crear'} className='btnActualizarCrear' />
            </div>
        </form>
    );
};
