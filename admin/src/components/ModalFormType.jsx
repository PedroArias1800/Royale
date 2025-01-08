import { useEffect, useState } from 'react';
import { getParfumsRequest } from '../api/Admin.api';
import { postTypesRequest, putTypesRequest, deleteTypesRequest } from '../api/Type.api';
import { useAuth } from '../context/AuthProvider';
import { Alert } from './Alert';
const URLServer = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001'

export const ModalFormType = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal, showAlert } = useAuth();
    const [parfums, setParfum] = useState([]);
    const isUpdate = Boolean(modalData?._id);
    const [alertMessage, setAlertMessage] = useState("");    

    useEffect(() => {
        async function loadParfum() {
            const response = await getParfumsRequest();
            setParfum(Array.isArray(response.data) ? response.data : []);
        }
        loadParfum();
    }, []);

    useEffect(() => {
        return () => {
            if (modalData?.imgPreview) {
                URL.revokeObjectURL(modalData.imgPreview);
            }
        };
    }, []);
    
    useEffect(() => {
        if (!modalData?.parfum_id_fk?._id && parfums.length > 0) {
            setModalData((prevData) => ({
                ...prevData,
                parfum_id_fk: parfums[0]._id,
            }));
        }
    }, [parfums]);
        
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setModalData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0]; // Obtén el primer archivo seleccionado
        if (file) {
            const imgPreview = URL.createObjectURL(file); // Crear una URL de la imagen
            setModalData((prevData) => ({
                ...prevData,
                img: file, // Guarda el archivo en el estado
                imgPreview, // Guarda la URL de vista previa
            }));
        }
    }

    const enviarDatos = async (e) => {
            e.preventDefault();
            modalData.status =  parseInt(modalData.status, 10)

            const formData = new FormData();
            for (const key in modalData) {
                if (key == 'imgPreview'){
                    formData.append('img', modalData[key]);
                } else if (key == 'parfum_id_fk' && typeof modalData[key] === 'object'){
                    formData.append('parfum_id_fk', modalData[key]._id);
                } else {
                    formData.append(key, modalData[key]);
                }
            }
            
            try {
                if (isUpdate) {
                    // Llamar a la API de actualización
                    const res = await putTypesRequest(modalData._id, formData);
                    if (res.status == 200){
                        showAlert('Datos actualizados con éxito', 1);
                        cargarDataTables(2)
                        closeModal()
                    }
                } else {
                    // Llamar a la API de creación
                    const res = await postTypesRequest(formData);
                    if (res.status == 200){
                        showAlert('Datos creados con éxito', 1);
                        cargarDataTables(2)
                        closeModal()
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
            const res = await deleteTypesRequest(modalData?._id);
            if (res.status == 200){
                showAlert('Datos eliminados con éxito', 1);
            } else {
                showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
            }
        } catch (error) {
            console.error('Error al enviar los datos:', error);
            showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
        }
        
        closeModal()
        setModalData(null);
        cargarDataTables(2)
    }

    if (!modalData) {
        return <p>Cargando datos...</p>;
    }

    return (
        <div>
            <Alert message={alertMessage} color={'--color-rojo-alert'} color2={'--color-rojo-alert-hover'} onClose={() => setAlertMessage("")}/>
            <form onSubmit={enviarDatos}>
                <input type="hidden" name="_id" value={modalData?._id || ''} onChange={handleInputChange} required={true} />
                <label htmlFor="ml">
                    <p>Mililitros</p>
                    <input type="text" name="ml" id="ml" value={modalData?.ml || ''} onChange={handleInputChange} required={true} />
                </label>
                <label htmlFor="img">
                    <p>Imagen</p>
                    <input type="file" name="img" id="img" accept="image/*" onChange={(e) => handleFileChange(e)} required={!isUpdate} />
                    {(modalData?.imgPreview || modalData?.img) && (
                        <div style={{ marginTop: '10px' }}>
                            <img
                                src={modalData?.imgPreview ? `${modalData?.imgPreview}` : `${URLServer}${modalData?.img}`}
                                alt="Vista previa"
                                style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }}
                            />
                        </div>
                    )}
                </label>
                <label htmlFor="price">
                    <p>Precio de Nosotros</p>
                    <input type="number" name="price" id="price" value={modalData?.price || ''} onChange={handleInputChange} required={true} step="0.01" min="0" />
                </label>
                <label htmlFor="old_price">
                    <p>Precio al Público</p>
                    <input type="number" name="old_price" id="old_price" value={modalData?.old_price || ''} onChange={handleInputChange} required={true} step="0.01" min="0" />
                </label>
                <label htmlFor="status">
                    <p>Estado</p>
                    <select
                        name="status"
                        id="status"
                        value={modalData?.status !== undefined ? modalData?.status : ''}
                        onChange={handleInputChange}
                        required={true}
                    >
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="1">Activado</option>
                        <option value="0">Desactivado</option>
                    </select>
                </label>
                <label htmlFor="parfum_id_fk">
                    <p>Perfume</p>
                    <select
                        name="parfum_id_fk"
                        id="parfum_id_fk"
                        value={modalData?.parfum_id_fk?._id !== undefined ? modalData?.parfum_id_fk?._id : modalData?.parfum_id_fk !== undefined ? modalData?.parfum_id_fk : ''}
                        onChange={handleInputChange}
                        required={true}
                    >
                        <option value="" disabled>Selecciona una opción</option>
                        {parfums.map((parfum) => (
                            <option key={parfum._id} value={parfum._id}>
                                {parfum.title}
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
