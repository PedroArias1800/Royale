import { useEffect, useState } from 'react';
import { getAllParfumsRequest } from '../api/Admin.api';
import { postBodiesRequest, putBodiesRequest, deleteBodiesRequest } from '../api/Body.api';
import { useAuth } from '../context/AuthProvider';
const URLServer = 'https://api.royalepanama.com';

export const ModalFormBody = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal, showAlert } = useAuth();
    const [parfums, setParfums] = useState([]);
    const isUpdate = Boolean(modalData?._id);

    useEffect(() => {
        return () => {
            if (modalData?.img1Preview) {
                URL.revokeObjectURL(modalData.img1Preview);
            }
            if (modalData?.img2Preview) {
                URL.revokeObjectURL(modalData.img2Preview);
            }
        };
    }, []);

    useEffect(() => {
        async function loadParfums() {
            try {
                const response = await getAllParfumsRequest();
                setParfums(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Error fetching parfums:', error);
            }
        }
        loadParfums();
    }, []);

    useEffect(() => {
        if (isUpdate && (!modalData?.title || !modalData?.color)) {
            setModalData((prevData) => ({
                ...prevData,
                title: prevData.title || '',
                align: prevData.align || 'auto',
                color: prevData.color || '',
                color2: prevData.color2 || '',
                status: prevData.status || '1',
                parfum_id_fk: prevData.parfum_id_fk || parfums.data[0]?._id,
            }));
        }
    }, [isUpdate, parfums]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setModalData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const enviarDatos = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        for (const key in modalData) {
            if (key == 'imgPreview'){
                formData.append('img', modalData[key]);
            } else if (key == 'img2Preview'){
                formData.append('img2', modalData[key]);
            } else if (key == 'parfum_id_fk' && typeof modalData[key] === 'object'){
                formData.append('parfum_id_fk', (modalData[key]._id || modalData[key]));
            } else {
                formData.append(key, modalData[key]);
            }
        }

        try {
            let res;
            if (isUpdate) {
                res = await putBodiesRequest(modalData._id, formData);
                if (res.status === 200) {
                    showAlert('Datos actualizados con éxito', 1);
                    cargarDataTables(5);
                    closeModal();
                }
            } else {
                res = await postBodiesRequest(formData);
                if (res.status === 200) {
                    showAlert('Datos creados con éxito', 1);
                    cargarDataTables(5);
                    closeModal();
                }
            }
            setModalData(null);
        } catch (error) {
            console.error('Error al enviar los datos:', error);
            showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            const imgPreview = URL.createObjectURL(file);
            setModalData((prevData) => ({
                ...prevData,
                [name]: file,
                [`${name}Preview`]: imgPreview,
            }));
        }
    };

    const deleteDatos = async () => {
        try {
            const res = await deleteBodiesRequest(modalData?._id);
            if (res.status === 200) {
                showAlert('Datos eliminados con éxito', 1);
            } else if (res.status == 202) {
                showAlert(res.data.message);
            } else {
                showAlert('Ocurrió un error al eliminar los datos.', 0);
            }
        } catch (error) {
            showAlert('Ocurrió un error al eliminar los datos.', 0);
            console.error('Error al eliminar los datos:', error);
        }

        closeModal();
        setModalData(null);
        cargarDataTables(5);
    };

    if (!modalData) {
        return <p>Cargando datos...</p>;
    }

    return (
        <form onSubmit={enviarDatos} encType="multipart/form-data">
            <input type="hidden" name="_id" value={modalData?._id || ''} />
            <div className='form-group3'>
                <label htmlFor="title">
                    <p>Título</p>
                    <input type="text" name="title" id="title" value={modalData?.title || ''} onChange={handleInputChange} required />
                </label>
                <label htmlFor="align">
                    <p>Alineación</p>
                    <select name="align" id="align" value={modalData?.align !== undefined ? modalData?.align : ''} onChange={handleInputChange} required>
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="0">Izquierda</option>
                        <option value="auto">Derecha</option>
                    </select>
                </label>
            </div>
            <div className='form-group3'>
                <label htmlFor="color">
                    <p>Color 1</p>
                    <input type="text" name="color" id="color" value={modalData?.color || ''} onChange={handleInputChange} required />
                </label>
                <label htmlFor="color2">
                    <p>Color 2</p>
                    <input type="text" name="color2" id="color2" value={modalData?.color2 || ''} onChange={handleInputChange} required />
                </label>
            </div>
            <div className='form-group3'>
                <label htmlFor="status">
                    <p>Estado</p>
                    <select name="status" id="status" value={modalData?.status !== undefined ? modalData?.status : ''} onChange={handleInputChange} required>
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
                        required
                    >
                        <option value="" disabled>Selecciona una opción</option>
                        {parfums.map((parfum) => (
                            <option key={parfum._id} value={parfum._id}>
                                {parfum.title}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <label htmlFor="img1">
                <p>Imagen de Perfume</p>
                <input
                    type="file"
                    name="img1"
                    id="img1"
                    accept="image/*"
                    onChange={handleFileChange}
                    required={!isUpdate}
                />
                {(modalData?.img1Preview || modalData?.parfum_img) && (
                    <div style={{ marginTop: '10px' }}>
                        <img
                            src={modalData?.img1Preview ? modalData.img1Preview : `${URLServer}${modalData?.parfum_img}`}
                            alt="Vista previa"
                            style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }}
                        />
                    </div>
                )}
            </label>

            <label htmlFor="img2">
                <p>Imagen de Fondo</p>
                <input
                    type="file"
                    name="img2"
                    id="img2"
                    accept="image/*"
                    onChange={handleFileChange}
                    required={!isUpdate}
                />
                {(modalData?.img2Preview || modalData?.back_img) && (
                    <div style={{ marginTop: '10px' }}>
                        <img
                            src={modalData?.img2Preview ? modalData.img2Preview : `${URLServer}${modalData?.back_img}`}
                            alt="Vista previa"
                            style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }}
                        />
                    </div>
                )}
            </label>
            <div className='btnBorrarCrear' style={{justifyContent: isUpdate ? 'space-between' : 'right'}}>
                {isUpdate && <input type="button" value="Borrar" onClick={deleteDatos} className='btnBorrar' />}
                <input type="submit" value={isUpdate ? 'Actualizar' : 'Crear'} className='btnActualizarCrear' />
            </div>
        </form>
    );
};
