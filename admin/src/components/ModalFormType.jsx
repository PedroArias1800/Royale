import { useEffect, useState } from 'react';
import { getAllParfumsRequest } from '../api/Admin.api';
import { postTypesRequest, putTypesRequest, deleteTypesRequest } from '../api/Type.api';
import { useAuth } from '../context/AuthProvider';
import { getParfumsIconGallery, getParfumsIconGallery2 } from '../api/Img.api.js'

export const ModalFormType = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal, showAlert, URLServer } = useAuth();
    const [parfums, setParfum] = useState([]);
    const [parfumsGallery, setParfumsGallery] = useState([]);
    const [required, setRequired] = useState(Boolean(modalData?._id))
    const [selectedImage, setSelectedImage] = useState(modalData?.img || '');  
    const [showImgServer, setShowImgServer] = useState(false)
    const isUpdate = Boolean(modalData?._id)
    const [parfumsGallery2, setParfumsGallery2] = useState([]);
    const [selectedImage2, setSelectedImage2] = useState(modalData?.multiImg2 || '');  
    const [showImgServer2, setShowImgServer2] = useState(false)
    const [previews, setPreviews] = useState([]);
    const [files, setFiles] = useState([]);
    
    useEffect(() => {
        async function loadParfum() {
            const response = await getAllParfumsRequest();
            setParfum(Array.isArray(response.data) ? response.data : []);
        }
        async function loadParfumGallery() {
            const response = await getParfumsIconGallery();
            setParfumsGallery(Array.isArray(response.data.images) ? response.data.images : []);
        }
        async function loadParfumGallery2() {
            const response = await getParfumsIconGallery2();
            setParfumsGallery2(Array.isArray(response.data.images) ? response.data.images : []);
        }
        loadParfum();
        loadParfumGallery();
        loadParfumGallery2();
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

        if (name == 'type_of_sale' && value == 'Normal') {
            setModalData((prevData) => ({
                ...prevData,
                ['price_flash']: modalData?.price,
                ['quantity_flash']: 0,
            }));
        }
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

    const handleFileChange2 = (e) => {
        const file = e.target.files[0]; // Obtén el primer archivo seleccionado
        if (file) {
            // const multiImgPreviews = URL.createObjectURL(file); // Crear una URL de la imagen
            setModalData((prevData) => ({
                ...prevData,
                // multiImg2: file, // Guarda el archivo en el estado
                // multiImgPreviews, // Guarda la URL de vista previa
            }));
        }
    };

    const handleImagesChange2 = (e) => {
        const selectedFiles = Array.from(e.target.files);

        if (selectedFiles.length > 4) {
            alert('Solo puedes seleccionar un máximo de 4 archivos.');
            return;
        }

        const imagePreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviews(imagePreviews);
        setFiles(selectedFiles);
    };

    const deletePreviewImages = (srcToDelete, index) => {
        const updatedPreviews = previews.filter(preview => preview !== srcToDelete);
        const updatedFiles = files.filter((_, i) => i !== index);
        URL.revokeObjectURL(srcToDelete);
    
        setPreviews(updatedPreviews);
        setFiles(updatedFiles);
    
        // Actualizar el input de archivos
        const inputElement = document.getElementById('multiImage');
        const dataTransfer = new DataTransfer();
    
        updatedFiles.forEach(file => dataTransfer.items.add(file));
        inputElement.files = dataTransfer.files;
    
        console.log(inputElement.files);
    };
    


    const enviarDatos = async (e) => {
            e.preventDefault();
            modalData.status =  parseInt(modalData.status, 10)

            const formData = new FormData();
            // files.forEach(file => formData.append('multiImages', file));
            files.forEach(file => formData.append('multiImages', URL.createObjectURL(file)));
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
                } else if (key == 'price_flash'){
                    formData.append('price_flash', Number(modalData[key]).toFixed(2));
                } else if (key == 'quantity_flash'){
                    formData.append('quantity_flash', Number(modalData[key]));
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

    // const handleSelectImage2 = (image) => {
    //     setSelectedImage2(image);
    //     setModalData((prevData) => ({
    //         ...prevData,
    //         imgServer2: image.split("uploads/parfumsMultiImages/")[1], // Guarda solo el nombre de la imagen
    //         multiImg2: null, // Limpiar el input de archivo
    //         multiImgPreviews: null, // Limpiar la vista previa
    //     }));
    // };

    const handleShowImgServer2 = () => {
        setShowImgServer2(!showImgServer2)
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
                <label htmlFor="type_of_sale">
                    <p>Tipo de Venta</p>
                    <select
                        name="type_of_sale"
                        id="type_of_sale"
                        value={modalData?.type_of_sale !== undefined ? modalData?.type_of_sale : ''}
                        onChange={handleInputChange}
                        required={true}
                    >
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="Normal">Normal</option>
                        <option value="Flash">Flash</option>
                    </select>
                </label>
                <label htmlFor="price_flash">
                    <p>Precio Flash</p>
                    <input type="text" name="price_flash" id="price_flash" value={modalData?.type_of_sale == 'Normal' ? modalData?.price : modalData?.price_flash || ''} onChange={handleInputNumberChange} required={modalData?.type_of_sale === 'Flash' ? true : false} step="0.01" min="0.00" />
                </label>
            </div>
            <div className="form-group3">
                <label htmlFor="quantity_flash">
                    <p>Cantidad Flash</p>
                    <input type="text" name="quantity_flash" id="quantity_flash" value={modalData?.quantity_flash || ''} onChange={handleInputNumberChange} required={modalData?.type_of_sale === 'Flash' ? true : false} step="1" min="0" />
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
                                {parfum.title} - {parfum.version_id_fk.version_name}
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

            <p>Selecciona Imágenes Demostrativas</p>
            <div className="form-group3">
                <label htmlFor="multiImage" style={{display: !showImgServer2 ? 'block' : 'none'}}>
                    <input type="file" name="multiImage" id="multiImage" accept="image/*" onChange={(e) => {handleFileChange2(e); handleImagesChange2(e)}} required={!required}  style={{display: !showImgServer2 ? 'block' : 'none'}} multiple />
                </label>
                {/* <div onClick={handleShowImgServer2}>
                    <p className='mostrarImg' style={{display: !showImgServer2 ? 'block' : 'none'}}>Desde el Servidor</p>
                    <div style={{ display: showImgServer2 ? 'flex' : 'none', flexWrap: 'wrap', justifyContent: 'center', width: '100%'}}>
                        {parfumsGallery2.map((image, index) => (
                            <div 
                                key={index} 
                                style={{ margin: '10px', cursor: 'pointer', border: selectedImage2 === `${URLServer}/uploads/parfumsMultiImages/${image}` ? '2px solid blue' : 'none' }}
                                onClick={() => {handleSelectImage2(`${URLServer}/uploads/parfumsMultiImages/${image}`); handleShowImgServer2()}}
                            >
                                <img
                                    src={`${URLServer}/uploads/parfumsMultiImages/${image}`}
                                    alt={image}
                                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                />
                            </div>
                        ))}
                    </div>
                </div> */}
            </div>
            <div>
                {(modalData?.multiImgPreviews || modalData?.multiImg2) && (
                    previews.map((src, index) => (
                        <img
                            key={index}
                            src={src}
                            alt={`preview-${index}`}
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                            onClick={(e) => deletePreviewImages(src, index)}
                        />
                    ))                
                )}
                {selectedImage2 && !modalData?.multiImg2 && !modalData?.multiImgPreviews && (
                    previews.map((src, index) => (
                        <img
                            key={index}
                            src={src}
                            alt={`preview-${index}`}
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                    ))
                )}
            </div>


            <div className='btnBorrarCrear' style={{justifyContent: isUpdate ? 'space-between' : 'right'}}>
                {isUpdate && <input type="button" value="Borrar" onClick={deleteDatos} className='btnBorrar' />}
                <input type="submit" value={isUpdate ? 'Actualizar' : 'Crear'} className='btnActualizarCrear' />
            </div>
        </form>
    );
};
