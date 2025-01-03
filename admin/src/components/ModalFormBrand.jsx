import { postBrandsRequest, putBrandsRequest, deleteBrandsRequest } from '../api/Brand.api.js';
import { useAuth } from '../context/AuthProvider.jsx';

export const ModalFormBrand = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal } = useAuth();
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
                const res = await putBrandsRequest(modalData._id, modalData);
                if (res.status == 200){
                    console.log('Datos actualizados con éxito');
                    cargarDataTables(4)
                    closeModal()
                }
            } else {
                // Llamar a la API de creación
                const res = await postBrandsRequest(modalData);
                if (res.status == 200){
                    console.log('Datos creados con éxito');
                    cargarDataTables(4)
                    closeModal()
                }
            }
            setModalData(null); // Limpiar los datos del modal
        } catch (error) {
            console.error('Error al enviar los datos:', error);
            console.log('Ocurrió un error. Inténtalo nuevamente.');
        }
    };

    const deleteDatos = async () => {
        await deleteBrandRequest(modalData?._id);
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
                <input type="file" name="img" id="img" />
                {isUpdate ? <input type="button" value="Borrar" onClick={deleteDatos} /> : ''}
                <input type="submit" value={isUpdate ? 'Actualizar' : 'Crear'} />
            </form>
        </div>
    );
};
