import { useEffect, useState } from 'react';
import { getParfumsRequest } from '../api/Admin.api';
import { postBodiesRequest, putBodiesRequest, deleteBodiesRequest } from '../api/Body.api';
import { useAuth } from '../context/AuthProvider';
import { Alert } from './Alert';

export const ModalFormBody = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal } = useAuth();
    const [parfums, setParfums] = useState([]);
    const isUpdate = Boolean(modalData?._id);
    const [alertMessage, setAlertMessage] = useState("");

    useEffect(() => {
        async function loadParfums() {
            try {
                const response = await getParfumsRequest();
                setParfums(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Error fetching parfums:', error);
            }
        }
        loadParfums();
    }, []);

    useEffect(() => {
        return () => {
            if (modalData?.img1Preview) {
                URL.revokeObjectURL(modalData.img1Preview);
            }
            if (modalData?.img2Preview) {
                URL.revokeObjectURL(modalData.img2Preview);
            }
        };
    }, [modalData]);

    useEffect(() => {
        if (!modalData?.parfum_id_fk && parfums.length > 0) {
            setModalData((prevData) => ({
                ...prevData,
                parfum_id_fk: parfums[0]._id,
            }));
        }
    }, [parfums, setModalData]);

    useEffect(() => {
        if (modalData?.status === undefined) {
            setModalData((prevData) => ({
                ...prevData,
                status: "1",
            }));
        }
    }, [modalData?.status, setModalData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setModalData((prevData) => ({
            ...prevData,
            [name]: convertType(name, value),
        }));
    };

    const convertType = (name, value) => {
        const integerFields = ['gender', 'status'];
        return integerFields.includes(name) ? parseInt(value, 10) : value;
    };

    const enviarDatos = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', modalData.title);
        formData.append('align', modalData.align);
        formData.append('url', `/parfum?id=${modalData.parfum_id_fk}`);
        formData.append('color', modalData.color);
        formData.append('color2', modalData.color2);
        formData.append('status', modalData.status);
        formData.append('parfum_id_fk', modalData.parfum_id_fk);

        if (modalData.parfum_img) formData.append('img1', modalData.parfum_img);
        if (modalData.back_img) formData.append('img2', modalData.back_img);

        try {
            let res;
            if (isUpdate) {
                res = await putBodiesRequest(modalData._id, formData);
                if (res.status === 200) {
                    console.log('Datos actualizados con éxito');
                    cargarDataTables(5);
                    closeModal();
                }
            } else {
                res = await postBodiesRequest(formData);
                if (res.status === 200) {
                    console.log('Datos creados con éxito');
                    cargarDataTables(5);
                    closeModal();
                }
            }
            setModalData(null);
        } catch (error) {
            console.error('Error al enviar los datos:', error);
            setAlertMessage('Ocurrió un error. Inténtalo más tarde.');
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
                console.log('Datos eliminados con éxito');
            } else {
                console.error('Ocurrió un error al eliminar los datos.');
            }
        } catch (error) {
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
        <div>
            <Alert message={alertMessage} color={'--color-rojo-alert'} color2={'--color-rojo-alert-hover'} onClose={() => setAlertMessage("")} />
            <form onSubmit={enviarDatos} encType="multipart/form-data">
                <input type="hidden" name="_id" value={modalData?._id || ''} />
                <label htmlFor="title">
                    <p>Título</p>
                    <input type="text" name="title" id="title" value={modalData?.title || ''} onChange={handleInputChange} required />
                </label>
                <label htmlFor="align">
                    <p>Alineación</p>
                    <select name="align" id="align" value={modalData?.align || ''} onChange={handleInputChange} required>
                        <option value="auto">Izquierda</option>
                        <option value="0">Derecha</option>
                    </select>
                </label>
                <label htmlFor="img1">
                    <p>Imagen de Perfume</p>
                    <input type="file" name="parfum_img" id="img1" accept="image/*" onChange={handleFileChange} required={!isUpdate} />
                    {modalData?.img1Preview && (
                        <div style={{ marginTop: '10px' }}>
                            <img
                                src={modalData.img1Preview}
                                alt="Vista previa"
                                style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }}
                            />
                        </div>
                    )}
                </label>
                <label htmlFor="img2">
                    <p>Imagen de Fondo</p>
                    <input type="file" name="back_img" id="img2" accept="image/*" onChange={handleFileChange} required={!isUpdate} />
                    {(modalData?.img2Preview || modalData?.back_img) && (
                        <div style={{ marginTop: '10px' }}>
                            <img
                                src={modalData.img2Preview}
                                alt="Vista previa"
                                style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }}
                            />
                        </div>
                    )}
                </label>
                <label htmlFor="color">
                    <p>Color 1</p>
                    <input type="text" name="color" id="color" value={modalData?.color || ''} onChange={handleInputChange} required />
                </label>
                <label htmlFor="color2">
                    <p>Color 2</p>
                    <input type="text" name="color2" id="color2" value={modalData?.color2 || ''} onChange={handleInputChange} required />
                </label>
                <label htmlFor="status">
                    <p>Estado</p>
                    <select name="status" id="status" value={modalData?.status || ''} onChange={handleInputChange} required>
                        <option value="1">Activado</option>
                        <option value="0">Desactivado</option>
                    </select>
                </label>
                <label htmlFor="parfum_id_fk">
                    <p>Perfume</p>
                    <select
                        name="parfum_id_fk"
                        id="parfum_id_fk"
                        value={modalData?.parfum_id_fk || ''}
                        onChange={handleInputChange}
                        required
                    >
                        {parfums.map((parfum) => (
                            <option key={parfum._id} value={parfum._id}>
                                {parfum.title}
                            </option>
                        ))}
                    </select>
                </label>
                {isUpdate && <input type="button" value="Borrar" onClick={deleteDatos} />}
                <input type="submit" value={isUpdate ? 'Actualizar' : 'Crear'} />
            </form>
        </div>
    );
};
