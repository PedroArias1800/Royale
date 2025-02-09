import { useEffect, useState } from 'react';
import { getAllPromotionsRequest } from '../api/Admin.api';
import { postPromotionsRequest, putPromotionsRequest, deletePromotionsRequest } from '../api/Promotion.api';
import { useAuth } from '../context/AuthProvider';

export const ModalFormPromotion = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal, showAlert, URLServer } = useAuth();
    const [promotions, setPromotion] = useState([]);
    const isUpdate = Boolean(modalData?._id)
    
    useEffect(() => {
        async function loadPromotion() {
            const response = await getAllPromotionsRequest();
            setPromotion(Array.isArray(response.data) ? response.data : []);
        }
        loadPromotion();
    }, []);

    useEffect(() => {
        return () => {
            if (modalData?.mediaPreview) {
                URL.revokeObjectURL(modalData.mediaPreview);
            }
        };
    }, []);
    
    // useEffect(() => {
    //     if (!modalData?.parfum_id_fk?._id && parfums.length > 0) {
    //         setModalData((prevData) => ({
    //             ...prevData,
    //             parfum_id_fk: parfums[0]._id,
    //         }));
    //     }
    // }, [promotions]);
        
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
            const mediaPreview = URL.createObjectURL(file); // Crear una URL de la imagen
            setModalData((prevData) => ({
                ...prevData,
                media: file, // Guarda el archivo en el estado
                mediaPreview, // Guarda la URL de vista previa
            }));
        }
    }

    const enviarDatos = async (e) => {
            e.preventDefault();
            modalData.status =  parseInt(modalData.status, 10)

            const formData = new FormData();
            for (const key in modalData) {
                if (key == 'mediaPreview'){
                    formData.append('media', modalData[key]);
                } else {
                    formData.append(key, modalData[key]);
                }
            }
            
            try {
                if (isUpdate) {
                    // Llamar a la API de actualización
                    const res = await putPromotionsRequest(modalData._id, formData);
                    if (res.status == 200){
                        showAlert('Datos actualizados con éxito', 1);
                        cargarDataTables(8)
                        closeModal()
                    }
                } else {
                    // Llamar a la API de creación
                    const res = await postPromotionsRequest(formData);
                    if (res.status == 200){
                        showAlert('Datos creados con éxito', 1);
                        cargarDataTables(8)
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
            const res = await deletePromotionsRequest(modalData?._id);
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
        cargarDataTables(8)
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
            </div>
            <p>Selecciona una Imagen, Gif o Video</p>
            <div className="form-group3">
                <label htmlFor="media">
                    <input type="file" name="media" id="media" accept="image/*,video/*" onChange={(e) => handleFileChange(e)} required={!isUpdate} />
                </label>
            </div>
            <div>
                {(modalData?.mediaPreview || modalData?.media) && (
                    ((typeof modalData?.media?.name === "string") || (typeof modalData?.media === "string")) &&
                    (
                        (modalData?.media?.name?.endsWith(".mp4") || modalData?.media?.name?.endsWith(".webm") || modalData?.media?.name?.endsWith(".ogg")) ||
                        (modalData?.media?.endsWith?.(".mp4") || modalData?.media?.endsWith?.(".webm") || modalData?.media?.endsWith?.(".ogg"))
                    ) ? (
                        <video
                            src={modalData?.mediaPreview ? modalData?.mediaPreview : `${URLServer}${modalData?.media}`}
                            autoPlay loop
                            style={{ maxWidth: "100%", maxHeight: "200px", border: "1px solid #ccc" }}
                        />
                    ) : (
                        <img
                            src={modalData?.mediaPreview ? modalData?.mediaPreview : `${URLServer}${modalData?.media}`}
                            alt="Vista previa"
                            style={{ maxWidth: "100%", maxHeight: "200px", border: "1px solid #ccc" }}
                        />
                    )
                )}
            </div>


            <div className='btnBorrarCrear' style={{justifyContent: isUpdate ? 'space-between' : 'right'}}>
                {isUpdate && <input type="button" value="Borrar" onClick={deleteDatos} className='btnBorrar' />}
                <input type="submit" value={isUpdate ? 'Actualizar' : 'Crear'} className='btnActualizarCrear' />
            </div>
        </form>
    );
};
