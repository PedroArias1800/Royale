import { useEffect, useState } from 'react';
import { getAllVersionsRequest, getAllBrandsRequest, getAllProvidersRequest } from '../api/Admin.api';
import { postParfumsRequest, putParfumsRequest, deleteParfumsRequest } from '../api/Parfum.api';
import { useAuth } from '../context/AuthProvider';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';

export const ModalFormParfum = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal, showAlert, pagination } = useAuth();
    const [versions, setVersions] = useState([]);
    const [brands, setBrands] = useState([]);
    const [providers, setProviders] = useState([]);
    const isUpdate = Boolean(modalData?._id);

    useEffect(() => {
        async function loadBrands() {
            const response = await getAllBrandsRequest();
            setBrands(Array.isArray(response.data) ? response.data : []);
        }
        async function loadVersions() {
            const response = await getAllVersionsRequest();
            setVersions(Array.isArray(response.data) ? response.data : []);
        }
        async function loadProviders() {
            const response = await getAllProvidersRequest();
            setProviders(Array.isArray(response.data) ? response.data : []);
        }
        loadBrands();
        loadVersions();
        loadProviders();
    }, []);

    useEffect(() => {
        if (!modalData?.gender) {
            setModalData((prevData) => ({
                ...prevData,
                gender: '', // Valor predeterminado para el select
            }));
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setModalData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const enviarDatos = async (e) => {
            e.preventDefault();

            const payload = {
                title:           modalData.title,
                description:     modalData.description,
                gender:          parseInt(modalData.gender, 10),
                status:          parseInt(modalData.status, 10),
                version_id_fk:   modalData.version_id_fk?._id   ?? modalData.version_id_fk,
                brand_id_fk:     modalData.brand_id_fk?._id     ?? modalData.brand_id_fk,
                provider_id_fk:  modalData.provider_id_fk?._id  ?? modalData.provider_id_fk,
            };

            try {
                if (isUpdate) {
                    const res = await putParfumsRequest(modalData._id, payload);
                    if (res.status == 200){
                        showAlert('Datos actualizados con éxito', 1);
                        cargarDataTables(1, pagination.totalPages)
                        closeModal()
                    }
                } else {
                    const res = await postParfumsRequest(payload);
                    if (res.status == 200){
                        showAlert('Datos creados con éxito', 1);
                        cargarDataTables(1, pagination.totalPages)
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
            const res = await deleteParfumsRequest(modalData?._id);
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
        cargarDataTables(1, pagination.totalPages)
    }

    if (!modalData) {
        return <p>Cargando datos...</p>;
    }

    return (
        <form onSubmit={enviarDatos}>
            <input type="hidden" name="_id" value={modalData?._id || ''} onChange={handleInputChange} required={true} />
            <div className="form-group3">
                <label htmlFor="title">
                    <p>Título</p>
                    <input type="text" name="title" id="title" value={modalData?.title || ''} onChange={handleInputChange} required={true} />
                </label>
                <label htmlFor="description">
                    <p>Descripción</p>
                    <input type="text" name="description" id="description" value={modalData?.description || ''} onChange={handleInputChange} required={true} />
                </label>
            </div>
            <div className="form-group3">
                <label htmlFor="gender">
                    <p>Género</p>
                    <select
                        name="gender"
                        id="gender"
                        value={modalData?.gender !== undefined ? modalData.gender : ''}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="1">Damas</option>
                        <option value="2">Caballeros</option>
                    </select>
                </label>
                <label htmlFor="status">
                    <p>Estado</p>
                    <select name="status" id="status" value={modalData?.status !== undefined ? modalData.status : ''} onChange={handleInputChange} required={true}>
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="1">Activado</option>
                        <option value="0">Desactivado</option>
                    </select>
                </label>
            </div>
            <div className="form-group3">
                <label htmlFor="brand_id_fk">
                    <p>Marca</p>
                    <select name="brand_id_fk" id="brand_id_fk" value={modalData?.brand_id_fk?._id !== undefined ? modalData?.brand_id_fk?._id : modalData?.brand_id_fk !== undefined ? modalData?.brand_id_fk : ''} onChange={handleInputChange} required={true}>
                        <option value="" disabled>Selecciona una opción</option>
                        {brands.map((brand) => (
                            <option key={brand._id} value={brand._id}>
                                {brand.brand_name}
                            </option>
                        ))}
                    </select>
                </label>
                <label htmlFor="version_id_fk">
                    <p>Versión</p>
                    <select name="version_id_fk" id="version_id_fk" value={modalData?.version_id_fk?._id !== undefined ? modalData?.version_id_fk?._id : modalData?.version_id_fk !== undefined ? modalData?.version_id_fk : ''} onChange={handleInputChange} required={true}>
                        <option value="" disabled>Selecciona una opción</option>
                        {versions.map((version) => (
                            <option key={version._id} value={version._id}>
                                {version.version_name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="form-group3">
                <label htmlFor="provider_id_fk">
                    <p>Proveedor</p>
                    <select name="provider_id_fk" id="provider_id_fk" value={modalData?.provider_id_fk?._id !== undefined ? modalData?.provider_id_fk?._id : modalData?.provider_id_fk !== undefined ? modalData?.provider_id_fk : ''} onChange={handleInputChange} required={true}>
                        <option value="" disabled>Selecciona un proveedor</option>
                        {providers.map((provider) => (
                            <option key={provider._id} value={provider._id}>
                                {provider.provider_name}
                            </option>
                        ))}
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
