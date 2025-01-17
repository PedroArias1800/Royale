import { useEffect, useState } from 'react';
import { getAllParfumsRequest } from '../api/Admin.api';
import { postTypesRequest, putTypesRequest, deleteTypesRequest } from '../api/Type.api';
import { useAuth } from '../context/AuthProvider';
import { getParfumsIconGallery } from '../api/Img.api.js'
const URLServer = 'http://localhost:4001'

export const ModalFormType = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal, showAlert } = useAuth();
    const [parfums, setParfum] = useState([]);
    const [parfumsGallery, setParfumsGallery] = useState([]);
    const [required, setRequired] = useState(Boolean(modalData?._id))
    const [selectedImage, setSelectedImage] = useState(modalData?.img || '');  
    const [showImgServer, setShowImgServer] = useState(false)
    const isUpdate = Boolean(modalData?._id)
    
    useEffect(() => {
        async function loadParfum() {
            const response = await getAllParfumsRequest();
            setParfum(Array.isArray(response.data) ? response.data : []);
        }
        async function loadParfumGallery() {
            const response = await getParfumsIconGallery();
            setParfumsGallery(Array.isArray(response.data.images) ? response.data.images : []);
        }
        loadParfum();
        loadParfumGallery();
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

    const handleInputNumberChange = (e) => {
        let { name, value } = e.target;
        value = value.replace(',', '.');

        const regex = /^[0-9]*\.?[0-9]{0,2}$/;

        // Si el valor es válido (solo números o un único punto decimal), lo actualizamos
        if (regex.test(value)) {
            setModalData({
                ...modalData,
                [name]: value
            });
        }
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

    const handleImagesChange = (e) => {
        const files = e.target.files;
    
        if (files.length > 3) {
            alert("Solo puedes seleccionar hasta 3 imágenes.");
            e.target.value = "";
            return;
        }
    
        // const selectedFiles = Array.from(files);
    
        // setSelectedImages(selectedFiles);
    };

    const enviarDatos = async (e) => {
            e.preventDefault();
            modalData.status =  parseInt(modalData.status, 10)

            const formData = new FormData();
            for (const key in modalData) {
                if (key == 'imgPreview'){
                    formData.append('img', modalData[key]);
                } else if (key == 'parfum_id_fk' && typeof modalData[key] === 'object'){
                    formData.append('parfum_id_fk', modalData[key]._id);
                } else if (key == 'cost'){
                    formData.append('cost', Number(modalData[key]).toFixed(2));
                } else if (key == 'price'){
                    formData.append('price', Number(modalData[key]).toFixed(2));
                } else if (key == 'old_price'){
                    formData.append('old_price', Number(modalData[key]).toFixed(2));
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
        cargarDataTables(2)
    }

    if (!modalData) {
        return <p>Cargando datos...</p>;
    }

    const handleSelectImage = (image) => {
        setSelectedImage(image);
        setModalData((prevData) => ({
            ...prevData,
            imgServer: image.split("uploads/parfumIcon/")[1], // Guarda solo el nombre de la imagen
            img: null, // Limpiar el input de archivo
            imgPreview: null, // Limpiar la vista previa
        }));
    };

    const handleShowImgServer = () => {
        setShowImgServer(!showImgServer)
        setRequired(true)
    }

    return (
        <form onSubmit={enviarDatos}>
            <input type="hidden" name="_id" value={modalData?._id || ''} onChange={handleInputChange} required={true} />
            <div className="form-group3">
                <label htmlFor="ml">
                    <p>Mililitros</p>
                    <input type="text" name="ml" id="ml" value={modalData?.ml || ''} onChange={handleInputChange} required={true} />
                </label>
                <label htmlFor="cost">
                    <p>Precio Costo</p>
                    <input type="text" name="cost" id="cost" value={modalData?.cost || ''} onChange={handleInputNumberChange} required={true} step="0.01" min="0.00" />
                </label>
            </div>
            <div className="form-group3">
                <label htmlFor="price">
                    <p>Precio de Nosotros</p>
                    <input type="text" name="price" id="price" value={modalData?.price || ''} onChange={handleInputNumberChange} required={true} step="0.01" min="0.00" />
                </label>
                <label htmlFor="old_price">
                    <p>Precio al Público</p>
                    <input type="text" name="old_price" id="old_price" value={modalData?.old_price || ''} onChange={handleInputNumberChange} required={true} step="0.01" min="0.00" />
                </label>
            </div>
            <div className="form-group3">
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
            </div>
            <p>Selecciona una Imagen</p>
            <div className="form-group3">
                <label htmlFor="img" style={{display: !showImgServer ? 'block' : 'none'}}>
                    <input type="file" name="img" id="img" accept="image/*" onChange={(e) => handleFileChange(e)} required={!required}  style={{display: !showImgServer ? 'block' : 'none'}} />
                </label>
                <div onClick={handleShowImgServer}>
                    <p className='mostrarImg' style={{display: !showImgServer ? 'block' : 'none'}}>Desde el Servidor</p>
                    <div style={{ display: showImgServer ? 'flex' : 'none', flexWrap: 'wrap', justifyContent: 'center', width: '100%'}}>
                        {parfumsGallery.map((image, index) => (
                            <div 
                                key={index} 
                                style={{ margin: '10px', cursor: 'pointer', border: selectedImage === `${URLServer}/uploads/parfumIcon/${image}` ? '2px solid blue' : 'none' }}
                                onClick={() => {handleSelectImage(`${URLServer}/uploads/parfumIcon/${image}`); handleShowImgServer()}}
                            >
                                <img
                                    src={`${URLServer}/uploads/parfumIcon/${image}`}
                                    alt={image}
                                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div>
                {(modalData?.imgPreview || modalData?.img) && (
                    <img
                        src={modalData?.imgPreview ? modalData?.imgPreview : `${URLServer}${modalData?.img}`}
                        alt="Vista previa"
                        style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }}
                    />
                )}
                {selectedImage && !modalData?.img && !modalData?.imgPreview && (
                    <img
                        src={selectedImage}
                        alt="Imagen seleccionada"
                        style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }}
                    />
                )}
            </div>


            <div className='btnBorrarCrear' style={{justifyContent: isUpdate ? 'space-between' : 'right'}}>
                {isUpdate && <input type="button" value="Borrar" onClick={deleteDatos} className='btnBorrar' />}
                <input type="submit" value={isUpdate ? 'Actualizar' : 'Crear'} className='btnActualizarCrear' />
            </div>
        </form>
    );
};
