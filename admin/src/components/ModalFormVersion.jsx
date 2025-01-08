import { postVersionsRequest, putVersionsRequest, deleteVersionsRequest } from '../api/Version.api.js';
import { useAuth } from '../context/AuthProvider';

export const ModalFormVersion = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal, showAlert } = useAuth();
    const isUpdate = Boolean(modalData?._id); // Identificar si es una actualización

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setModalData((prevData) => ({
            ...prevData,
            [name]: convertType(name, value), // Convertimos según el tipo esperado
        }));
    };

    const convertType = (name, value) => {
        const integerFields = ['gender', 'status'];
        return integerFields.includes(name) ? parseInt(value, 10) : value;
    };

    const enviarDatos = async (e) => {
        e.preventDefault();
        try {
            if (isUpdate) {
                // Llamar a la API de actualización
                const res = await putVersionsRequest(modalData._id, modalData);
                if (res.status == 200){
                    showAlert('Datos actualizados con éxito', 1);
                    cargarDataTables(4)
                    closeModal()
                }
            } else {
                // Llamar a la API de creación
                const res = await postVersionsRequest(modalData);
                if (res.status == 200){
                    showAlert('Datos creados con éxito', 1);
                    cargarDataTables(4)
                    closeModal()
                }
            }
            setModalData(null); // Limpiar los datos del modal
        } catch (error) {
            console.error('Error al enviar los datos:', error);
            showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
        }
    };

    const deleteDatos = async () => {
        try {
            const res = await deleteVersionsRequest(modalData?._id);
            if (res.status == 200){
                showAlert('Datos eliminados con éxito', 1);
            } else {
                showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
            }
        } catch (error) {
            console.error('Error al eliminar los datos:', error);
            showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
        }
        
        closeModal()
        setModalData(null);
        cargarDataTables(4)
    }

    if (!modalData) {
        return <p>Cargando datos...</p>; // Mostrar algo mientras `modalData` no esté disponible
    }

    return (
        <div>
            <form onSubmit={enviarDatos}>
                <input type="hidden" name="_id" value={modalData?._id || ''} onChange={handleInputChange} required={true} />
                <label htmlFor="version_name">
                    <p>Título</p>
                    <input type="text" name="version_name" id="version_name" value={modalData?.version_name || ''} onChange={handleInputChange} required={true} />
                </label>
                <label htmlFor="description">
                    <p>Descripción</p>
                    <input type="text" name="description" id="description" value={modalData?.description || ''} onChange={handleInputChange} required={true} />
                </label>
                {isUpdate ? <input type="button" value="Borrar" onClick={deleteDatos} /> : ''}
                <input type="submit" value={isUpdate ? 'Actualizar' : 'Crear'} />
            </form>
        </div>
    );
};
