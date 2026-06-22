import { postCouponsRequest, putCouponsRequest, deleteCouponsRequest } from '../api/Coupon.api.js';
import { useAuth } from '../context/AuthProvider.jsx';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';

export const ModalFormCoupon = ({ modalData }) => {
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
        const integerFields = ['status', 'productsThatApply'];
        return integerFields.includes(name) ? parseInt(value, 10) : value;
    };

    const enviarDatos = async (e) => {
        e.preventDefault();
        try {
            if (isUpdate) {
                // Llamar a la API de actualización
                const res = await putCouponsRequest(modalData._id, modalData);
                if (res.status == 200){
                    showAlert('Datos actualizados con éxito', 1);
                    cargarDataTables(9)
                    closeModal()
                }
            } else {
                // Llamar a la API de creación
                const res = await postCouponsRequest(modalData);
                if (res.status == 200){
                    showAlert('Datos creados con éxito', 1);
                    cargarDataTables(9)
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
            const res = await deleteCouponsRequest(modalData?._id);
            if (res.status == 200){
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
        
        closeModal()
        setModalData(null);
        cargarDataTables(9)
    }

    if (!modalData) {
        return <p>Cargando datos...</p>; // Mostrar algo mientras `modalData` no esté disponible
    }

    return (
        <form onSubmit={enviarDatos}>
            <input type="hidden" name="_id" value={modalData?._id || ''} onChange={handleInputChange} required={true} />
            <div className='form-group3'>
                <label htmlFor="title">
                    <p>Título</p>
                    <input type="text" name="title" id="title" value={modalData?.title || ''} onChange={handleInputChange} required={true} />
                </label>
                <label htmlFor="code">
                    <p>Código</p>
                    <input type="text" name="code" id="code" value={modalData?.code || ''} onChange={handleInputChange} required={true} />
                </label>
            </div>
            <div className='form-group3'>
                <label htmlFor="percentage">
                    <p>Porcentaje</p>
                    <input type="text" name="percentage" id="percentage" value={modalData?.percentage || ''} onChange={handleInputChange} required={true} />
                </label>
                <label htmlFor="status">
                    <p>Estado</p>
                    <select name="status" id="status" value={modalData?.status !== undefined ? modalData?.status : ''} onChange={handleInputChange} required>
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="1">Activado</option>
                        <option value="0">Desactivado</option>
                    </select>
                </label>
            </div>
            <div className='form-group3'>
                <label htmlFor="productsThatApply">
                    <p>Productos que Aplican</p>
                    <select name="productsThatApply" id="productsThatApply" value={modalData?.productsThatApply !== undefined ? modalData?.productsThatApply : ''} onChange={handleInputChange} required>
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="0">Todos</option>
                        <option value="1">Damas</option>
                        <option value="2">Caballeros</option>
                    </select>
                </label>
            </div>
            <div className='btnBorrarCrear' style={{justifyContent: isUpdate ? 'space-between' : 'right'}}>
                {isUpdate && <ConfirmDeleteButton onConfirm={deleteDatos} />}
                <input type="submit" value={isUpdate ? 'Actualizar' : 'Crear'} className='btnActualizarCrear' />
            </div>
        </form>
    );
};
