import { postVersionsRequest, putVersionsRequest, deleteVersionsRequest } from '../api/Version.api.js';
import { useAuth } from '../context/AuthProvider';

export const ModalFormUser = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal, showAlert, user } = useAuth();
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
                    cargarDataTables(6)
                    closeModal()
                }
            } else {
                // Llamar a la API de creación
                const res = await postVersionsRequest(modalData);
                if (res.status == 200){
                    showAlert('Datos creados con éxito', 1);
                    cargarDataTables(6)
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
            } else if (res.status == 202) {
                showAlert(res.data.message);
            } else {
                showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
            }
        } catch (error) {
            console.error('Error al eliminar los datos:', error);
            showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
        }
        
        closeModal()
        setModalData(null);
        cargarDataTables(6)
    }

    if (!modalData) {
        return <p>Cargando datos...</p>; // Mostrar algo mientras `modalData` no esté disponible
    }

    return (
        <form onSubmit={enviarDatos}>
            <input type="hidden" name="_id" value={modalData?._id || ''} onChange={handleInputChange} required={true} />
            <div className="form-group3">
                <label htmlFor="firstname">
                    <p>Nombre</p>
                    <input type="text" name="firstname" id="firstname" value={modalData?.firstname || ''} onChange={handleInputChange} required={true} />
                </label>
                <label htmlFor="lastname">
                    <p>Apellido</p>
                    <input type="text" name="lastname" id="lastname" value={modalData?.lastname || ''} onChange={handleInputChange} required={true} />
                </label>
            </div>
            <div className="form-group3">
                <label htmlFor="email">
                    <p>Correo</p>
                    <input type="text" name="email" id="email" value={modalData?.email || ''} onChange={handleInputChange} required={true}  />
                </label>
                <label htmlFor="password">
                    <p>Contraseña</p>
                    <input type="text" name="password" id="password" value={user.rol == 1 ? modalData?.password : ''} onChange={handleInputChange} placeholder='**********' required={true} disabled={user.rol == 1 ? false : true} />
                </label>
            </div>
            <div className="form-group3">
                {
                    (user.rol == 1) && (
                        <label htmlFor="rol">
                            <p>Rol</p>
                            <select
                                name="rol"
                                id="rol"
                                value={modalData?.rol !== undefined ? modalData?.rol : ''}
                                onChange={handleInputChange}
                                required={true}
                            >
                                <option value="" disabled>Selecciona una opción</option>
                                <option value="1">Administrador</option>
                                <option value="2">Vendedor</option>
                            </select>
                        </label>
                    )
                }
                <label htmlFor="status">
                    <p>Estado</p>
                    <select
                        name="status"
                        id="status"
                        value={modalData?.status !== undefined ? modalData?.status : ''}
                        onChange={handleInputChange}
                        required={true}
                        disabled={user.rol != 1}
                    >
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="1">Activado</option>
                        <option value="0">Desactivado</option>
                    </select>
                </label>
            </div>
            <div className='btnBorrarCrear' style={{justifyContent: isUpdate ? 'space-between' : 'right'}}>
                {isUpdate && <input type="button" value="Borrar" onClick={deleteDatos} className='btnBorrar' />}
                <input type="submit" value={isUpdate ? 'Actualizar' : 'Crear'} className='btnActualizarCrear' />
            </div>
        </form>
    );
};
