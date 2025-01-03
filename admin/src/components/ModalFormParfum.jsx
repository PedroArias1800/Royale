import { useEffect, useState } from 'react';
import { getVersionsRequest, getBrandsRequest } from '../api/Admin.api';
import { postParfumsRequest, putParfumsRequest, deleteParfumsRequest } from '../api/Parfum.api';
import { useAuth } from '../context/AuthProvider';
import { Alert } from './Alert';

export const ModalFormParfum = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal } = useAuth();
    const [versions, setVersions] = useState([]);
    const [brands, setBrands] = useState([]);
    const isUpdate = Boolean(modalData?._id);
    const [alertMessage, setAlertMessage] = useState("");    

    useEffect(() => {
        async function loadBrands() {
            const response = await getBrandsRequest();
            setBrands(Array.isArray(response.data) ? response.data : []);
        }
        async function loadVersions() {
            const response = await getVersionsRequest();
            setVersions(Array.isArray(response.data) ? response.data : []);
        }
        loadBrands();
        loadVersions();
    }, []);

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
            console.log(modalData)
            
            try {
                if (isUpdate) {
                    // Llamar a la API de actualización
                    const res = await putParfumsRequest(modalData._id, modalData);
                    if (res.status == 200){
                        console.log('Datos actualizados con éxito');
                        cargarDataTables(1)
                        closeModal()
                    }
                } else {
                    // Llamar a la API de creación
                    const res = await postParfumsRequest(modalData);
                    if (res.status == 200){
                        console.log('Datos creados con éxito');
                        cargarDataTables(1)
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
        await deleteParfumsRequest(modalData?._id)
    }

    if (!modalData) {
        return <p>Cargando datos...</p>; // Mostrar algo mientras `modalData` no esté disponible
    }

    return (
        <div>
            <Alert message={alertMessage} color={'--color-rojo-alert'} color2={'--color-rojo-alert-hover'} onClose={() => setAlertMessage("")}/>
            <form onSubmit={enviarDatos}>
                <input type="hidden" name="_id" value={modalData?._id || ''} onChange={handleInputChange} required={true} />
                <label htmlFor="title">
                    <p>Título</p>
                    <input type="text" name="title" id="title" value={modalData?.title || ''} onChange={handleInputChange} required={true} />
                </label>
                <label htmlFor="description">
                    <p>Descripción</p>
                    <input type="text" name="description" id="description" value={modalData?.description || ''} onChange={handleInputChange} required={true} />
                </label>
                <label htmlFor="gender">
                    <p>Género</p>
                    <select name="gender" id="gender" value={modalData?.gender || 1} onChange={handleInputChange} required={true}>
                        <option value="1">Damas</option>
                        <option value="2">Caballeros</option>
                    </select>
                </label>
                <label htmlFor="status">
                    <p>Estado</p>
                    <select name="status" id="status" value={modalData?.status || ''} onChange={handleInputChange} required={true}>
                        <option value="1">Activado</option>
                        <option value="0">Desactivado</option>
                    </select>
                </label>
                <label htmlFor="brand_id_fk">
                    <p>Marca</p>
                    <select name="brand_id_fk" id="brand_id_fk" value={modalData?.brand_id_fk?._id || ''} onChange={handleInputChange} required={true}>
                        {brands.map((brand) => (
                            <option key={brand._id} value={brand._id}>
                                {brand.brand_name}
                            </option>
                        ))}
                    </select>
                </label>
                <label htmlFor="version_id_fk">
                    <p>Versión</p>
                    <select name="version_id_fk" id="version_id_fk" value={modalData?.version_id_fk?._id || ''} onChange={handleInputChange} required={true}>
                        {versions.map((version) => (
                            <option key={version._id} value={version._id}>
                                {version.version_name}
                            </option>
                        ))}
                    </select>
                </label>
                {isUpdate ? <input type="button" value="Borrar" onClick={deleteDatos} /> : ''}
                <input type="submit" value={isUpdate ? 'Actualizar' : 'Crear'} />
            </form>
        </div>
    );
};
