import { useEffect, useState } from 'react';
import { postManualTransactionRequest, deleteManualTransactionRequest } from '../api/Transaction.api.js';
import { useAuth } from '../context/AuthProvider.jsx';
import { getAllParfumsRequest, getTypeByParfumId, getUsersByRoleSeller, getAllUsersRequest } from '../api/Admin.api';
import { getAllCouponsRequest } from '../api/Admin.api';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { putTransactionRequest } from '../api/Transaction.api.js';
import { columnMappings, excludedColumns, excludedColumnsSeller } from "../js/mappings";


export const ModalFormTransaction = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal, showAlert, user } = useAuth();
    const isUpdate = Boolean(modalData?._id); // Identificar si es una actualización

    const [parfums, setParfum] = useState([]);
    const [types, setTypes] = useState([]);
    const [coupons, setCoupon] = useState([]);
    const [datosResumen, setDatosResumen] = useState([]);
    const [datosTabla, setDatosTabla] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [sellType, setSellType] = useState([]);
    const [deliveryUsers, setDeliveryUsers] = useState([]);
    const [datosTransaccion, setDatosTransaccion] = useState({
        "totalQuantity": 0,
        "subTotal": 0.00,
        "total": 0.00
    });


    // Filtramos las columnas excluidas y mapeamos las cabeceras
    const headers = ['Perfume', 'Tipo de Perfume', 'Cantidad', 'Precio']
    
    useEffect(() => {
        async function loadParfum() {
            const response = await getAllParfumsRequest();
            setParfum(Array.isArray(response.data) ? response.data : []);
        }
        async function loadCoupon() {
            const response = await getAllCouponsRequest();
            setCoupon(Array.isArray(response.data) ? response.data : []);
        }
        async function loadSellers() {
            const response = await getUsersByRoleSeller();
            setSellers(Array.isArray(response.data.data) ? response.data.data : []);
        }
        loadParfum();
        loadCoupon();
        loadSellers();
        if (isUpdate) {
            getAllUsersRequest().then(r => {
                const all = r.data?.data || r.data || [];
                setDeliveryUsers(all.filter(u => {
                    const roles = u.roles || [u.rol];
                    return roles.includes(1) || roles.includes(3);
                }));
            }).catch(() => {});
        }
    }, []);

    useEffect(() => {
        async function loadTypes(parfumId) {
            const response = await getTypeByParfumId(parfumId);
            setTypes(Array.isArray(response.data) ? response.data : []);
        }
        if(modalData?.parfum_id_fk?._id != undefined || modalData?.parfum_id_fk != undefined){
            loadTypes(modalData?.parfum_id_fk?._id ?? modalData?.parfum_id_fk)
        } else {
            setTypes([])
            setSellType([])
        }
    },[modalData?.parfum_id_fk?._id, modalData?.parfum_id_fk])

    // Pre-popular tabla de productos al editar una transacción existente
    useEffect(() => {
        if (!isUpdate || !modalData?._id) return;
        const products  = modalData.products      || [];
        const typeIds   = modalData.productsTypes || [];
        const qtys      = modalData.quantities    || [];
        const prices    = modalData.products_prices || [];

        if (!products.length) return;

        const tabla = products.map((p, i) => {
            const displayName = p.split('=')[1] || p;
            const mlMatch = displayName.match(/\b(\d+\s*ml)\b/i);
            const mlStr   = mlMatch ? mlMatch[0] : '';
            const perfumeName = mlStr
                ? displayName.replace(mlStr, '').trim().replace(/\s*-?\s*$/, '')
                : displayName;
            return {
                productsTitle:      perfumeName || displayName,
                productsTypesTitle: mlStr || typeIds[i] || '—',
                quantities:         qtys[i]   ?? 1,
                price:              prices[i] ?? 0,
            };
        });

        const resumen = products.map((p, i) => ({
            products:     p.split('=')[0],
            productsTypes: typeIds[i],
            quantities:   qtys[i]   ?? 1,
            price:        prices[i] ?? 0,
        }));

        const totalQty  = qtys.reduce((s, q) => s + (q ?? 0), 0);
        const subTotal  = products.reduce((s, _, i) => s + ((prices[i] ?? 0) * (qtys[i] ?? 0)), 0);

        setDatosTabla(tabla);
        setDatosResumen(resumen);
        setDatosTransaccion({
            totalQuantity: totalQty,
            subTotal:      parseFloat(subTotal.toFixed(2)),
            total:         parseFloat(subTotal.toFixed(2)),
        });
    }, [modalData?._id]);

    const handleInputChange = async (e) => {
        const { name, value } = e.target;
        
        setModalData((prevData) => ({
            ...prevData,
            [name]: convertType(name, value), // Convertimos según el tipo esperado
        }));

        if (name == 'coupon_id_fk'){
            setDatosTransaccion({
                ...datosTransaccion,
                total: (datosTransaccion?.subTotal-(datosTransaccion?.subTotal*parseInt(value.split('-')[1])/100).toFixed(2)).toFixed(2)
            })
        }
    };
    
    const handleInputChangeSelect = (e) => {
        const { name, value, options, selectedIndex } = e.target;
        const selectedText = options[selectedIndex].text;
        
        setModalData((prevData) => ({
            ...prevData,
            [name]: convertType(name, value), // Convertimos según el tipo esperado
            [`${name}Text`]: selectedText, // Almacenamos el texto seleccionado
        }));

        if (name == "parfum_type_id_fk"){
            types.map(type => {
                if (parseInt(type?.ml) == parseInt(selectedText)){
                    setSellType([
                        {
                            'type': 'Normal',
                            'price': type?.price
                        },
                        {
                            'type': 'Venta Flash',
                            'price': type?.price_flash
                        },
                    ])
                }
            })
        }
    };
    
    const actualizarModelDataExt = (name, value) => {
        setModalData((prevData) => ({
            ...prevData,
            [name]: convertType(name, value), // Convertimos según el tipo esperado
        }));
    }

    const convertType = (name, value) => {
        const integerFields = ['gender', 'status', 'quantityTemp'];
        const floatFields = ['sellType'];
        if(integerFields.includes(name)){
            return parseInt(value, 10)
        } else if (floatFields.includes(name)){
            return parseFloat(value).toFixed(2)
        }

        return value;
    };

    const enviarDatos = async (e) => {
        e.preventDefault();
        try {
            if (isUpdate) {
                const res = await putTransactionRequest(modalData._id, {
                    payment_method: modalData.payment_method || null,
                    delivery_method: modalData.delivery_method || null,
                    channel: modalData.channel || null,
                    label: modalData.label || null,
                    description: modalData.description || null,
                    status: modalData.status,
                    lot_numbers: modalData.lot_numbers || [],
                    ...(modalData.delivery_assigned_to ? (() => {
                        const u = deliveryUsers.find(u => (u.id || u._id) === modalData.delivery_assigned_to);
                        return {
                            delivery_assigned_to: modalData.delivery_assigned_to,
                            ...(u ? { delivery_assigned_name: `${u.firstname} ${u.lastname}` } : {}),
                        };
                    })() : {}),
                    ...(modalData.delivery_date ? { delivery_date: modalData.delivery_date } : {}),
                });
                if (res.status == 200){
                    showAlert('Datos actualizados con éxito', 1);
                    cargarDataTables(7)
                    closeModal()
                }
            } else {
                const payload = {
                    fin_type: 'ingreso',
                    label: modalData.label || 'Venta Directa',
                    total: parseFloat(datosTransaccion.total) || 0,
                    subTotal: parseFloat(datosTransaccion.subTotal) || 0,
                    userName: modalData.userName || '',
                    phone: modalData.phone || '',
                    direction: modalData.direction || '',
                    email: modalData.email || '',
                    payment_method: modalData.payment_method || '',
                    delivery_method: modalData.delivery_method || '',
                    channel: modalData.channel || '',
                    status: modalData.status ?? 1,
                    seller_id_fk: modalData.seller_id_fk || null,
                    products: datosResumen.map(d => d.products),
                    productsTypes: datosResumen.map(d => d.productsTypes),
                    quantities: datosResumen.map(d => d.quantities),
                };
                const res = await postManualTransactionRequest(payload);
                if (res.status == 200){
                    showAlert('Transacción creada con éxito', 1);
                    cargarDataTables(7);
                    closeModal();
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
            const res = await deleteManualTransactionRequest(modalData?._id);
            if (res.status === 200) {
                showAlert('Transacción eliminada con éxito', 1);
            } else {
                showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
            }
        } catch (error) {
            console.error('Error al eliminar la transacción:', error);
            showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
        }
        closeModal();
        setModalData(null);
        cargarDataTables(7);
    }

    if (!modalData) {
        return <p>Cargando datos...</p>; // Mostrar algo mientras `modalData` no esté disponible
    }

    // const transaction = {
    //     userName: data.name,
    //     phone: data.phone,
    //     direction: data.address,
    //     email: data.email,
    //     subTotal: subTotal.toFixed(2),
    //     total: (totalPrice.toFixed(2)-(totalPrice.toFixed(2)*percentage/100).toFixed(2)).toFixed(2),
    //     code: dataCupon._id,
    //     products: productsId,
    //     productsTypes: typesId,
    //     quantities: quantities,
    //   }

    const anadirDatosResumen = () => {
        setDatosTabla([...datosTabla, {
            productsTitle: modalData?.parfum_id_fkText,
            productsTypesTitle: modalData?.parfum_type_id_fkText,
            quantities: modalData?.quantityTemp,
            price: modalData?.sellType
        }])

        setDatosResumen([...datosResumen, {
            products: `${modalData?.parfum_id_fk}=${modalData?.parfum_id_fkText}`,
            productsTypes: modalData?.parfum_type_id_fk,
            quantities: modalData?.quantityTemp,
            price: modalData?.sellType
        }])

        setTypes([])
        const subTotal = parseFloat(datosTransaccion?.subTotal + parseFloat(modalData?.sellType) * modalData?.quantityTemp).toFixed(2)
        setDatosTransaccion({
            ...datosTransaccion,
            totalQuantity: datosTransaccion?.totalQuantity + modalData?.quantityTemp,
            subTotal: parseFloat(subTotal),
            total: modalData?.coupon_id_fk ? (subTotal-(subTotal*parseInt(modalData?.coupon_id_fk.split('-')[1])/100).toFixed(2)).toFixed(2) : subTotal
        })
    }

    const actualizarDataNoRequerida = () => {
        let cantidad = 0;
        datosResumen.map((dato) => {
            cantidad += dato.quantities
        })

        actualizarModelDataExt('quantity', cantidad)
    }

    return (
        <form onSubmit={enviarDatos} className='formTransaction'>
            <h3>Información del Cliente</h3><hr></hr>
            <input type="hidden" name="_id" value={modalData?._id || ''} onChange={handleInputChange} required={true} />
            <div className="form-group3">
                <label htmlFor="userName">
                    <p>Nombre del Cliente</p>
                    <input type="text" name="userName" id="userName" value={modalData?.userName || ''} onChange={handleInputChange} required={true} />
                </label>
                <label htmlFor="phone">
                    <p>Teléfono</p>
                    <input type="text" name="phone" id="phone" value={modalData?.phone || ''} onChange={handleInputChange} required={true} />
                </label>
            </div>
            <div className="form-group3">
                <label htmlFor="email">
                    <p>Correo</p>
                    <input type="text" name="email" id="email" value={modalData?.email || ''} onChange={handleInputChange} required={true}  />
                </label>
                <label htmlFor="direction">
                    <p>Dirección</p>
                    <input type="text" name="direction" id="direction" value={modalData?.direction || ''} onChange={handleInputChange} required={true} />
                </label>
            </div>
            <h3>Información de la Compra</h3><hr></hr>
            <div className="form-group3">
            <label htmlFor="parfum_id_fk">
                    <p>Perfume</p>
                    <select
                        name="parfum_id_fk"
                        id="parfum_id_fk"
                        value={modalData?.parfum_id_fk?._id !== undefined ? modalData?.parfum_id_fk?._id : modalData?.parfum_id_fk !== undefined ? modalData?.parfum_id_fk : ''}
                        onChange={handleInputChangeSelect}
                        required={!isUpdate && datosTabla.length === 0}
                    >
                        <option value="" disabled>Selecciona una opción</option>
                        {parfums.map((parfum) => (
                            <option key={parfum._id} value={parfum._id}>
                                {parfum.title} - {parfum.version_id_fk.version_name}
                            </option>
                        ))}
                    </select>
                </label>
                <label htmlFor="parfum_type_id_fk">
                    <p>Tipo de Perfume</p>
                    <select
                        name="parfum_type_id_fk"
                        id="parfum_type_id_fk"
                        value={modalData?.parfum_type_id_fk?._id !== undefined ? modalData?.parfum_type_id_fk?._id : modalData?.parfum_type_id_fk !== undefined ? modalData?.parfum_type_id_fk : ''}
                        onChange={handleInputChangeSelect}
                        required={!isUpdate && datosTabla.length === 0}
                    >
                        <option value="" disabled>Selecciona una opción</option>
                        {types.map((type) => (
                            <option key={type._id} value={type._id}>
                                {type.ml}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="form-group3">
                <label htmlFor="quantityTemp">
                    <p>Cantidad de Perfumes</p>
                    <input type="number" name="quantityTemp" id="quantityTemp" value={modalData?.quantityTemp || ''} onChange={handleInputChange} required={!isUpdate && datosTabla.length === 0} />
                </label>
                <label htmlFor="sellType">
                    <p>Tipo de Venta</p>
                    <select name="sellType" id="sellType" value={modalData?.sellType || ''} onChange={handleInputChange} required={!isUpdate && datosTabla.length === 0}>
                        <option value="" disabled>Selecciona una opción</option>
                        {sellType.map((sell, id) => (
                            <option key={id} value={sell.price}>
                                {sell.type} - ${sell.price}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="form-group3">
                <label htmlFor="">
                    <div className='btnBorrarCrear'>
                        <section 
                            onClick={() => {anadirDatosResumen(); actualizarDataNoRequerida();}}
                            className='btnActualizarCrear'>Añadir</section>
                    </div>
                </label>
            </div>
            <div className="form-group3" style={{margin: '10px 0'}}>
                <table style={{'display': datosTabla.length > 0 ? 'block' : 'none'}} className='tablaResumen'>
                    <thead>
                        <tr>
                            {headers.map((header, id) => (
                                <th key={id} style={{ padding: "8px", textAlign: "left" }}>
                                    {columnMappings[header] || header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                    {
                        datosTabla.map((row, idx) => (
                            <tr key={idx}>
                                {Object.entries(row).map(([key, value], idx2) => (
                                    <td key={idx2} style={{ padding: "8px" }}>
                                        {value}
                                    </td>
                                ))}
                            </tr>
                        ))
                    }
                    </tbody>
                </table>
            </div>
            <h3>Resumen</h3><hr></hr>
            <div className="form-group3">
                <label htmlFor="seller_id_fk">
                    <p>Vendedor</p>
                    <select
                        name="seller_id_fk"
                        id="seller_id_fk"
                        value={modalData?.seller_id_fk?._id !== undefined ? modalData?.seller_id_fk?._id : modalData?.seller_id_fk !== undefined ? modalData?.seller_id_fk : ''}
                        onChange={handleInputChange}
                        required={true}
                    >
                        <option value="" disabled>Selecciona una opción</option>
                        {sellers.map((seller) => (
                            <option key={seller._id} value={seller._id}>
                                {seller.firstname} {seller.lastname}
                            </option>
                        ))}
                    </select>
                </label>
                <label htmlFor="status">
                    <p>Estado</p>
                    <select name="status" id="status" value={modalData?.status !== undefined ? modalData.status : ''} onChange={handleInputChange} required={true}>
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="1">Pendiente</option>
                        <option value="2">Completado</option>
                        <option value="0">Cancelado</option>
                    </select>
                </label>
            </div>
            <div className="form-group3">
                <label htmlFor="quantity">
                    <p>Cantidad de Perfumes</p>
                    <input type="text" name="quantity" id="quantity" value={datosTransaccion?.totalQuantity ?? 0} required={true} readOnly={true} />
                </label>
                <label htmlFor="coupon_id_fk">
                    <p>Cupón Utilizado</p>
                    <select
                        name="coupon_id_fk"
                        id="coupon_id_fk"
                        value={modalData?.coupon_id_fk?._id !== undefined ? modalData?.coupon_id_fk?._id : modalData?.coupon_id_fk !== undefined ? modalData?.coupon_id_fk : ''}
                        onChange={handleInputChange}
                        required={true}
                    >
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="NoAplica-0">No Aplica</option>
                        {coupons.map((coupon) => (
                            <option key={coupon._id} value={coupon._id+'-'+coupon.percentage}>
                                {coupon.code}: -{coupon.percentage}%
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="form-group3">
                <label htmlFor="subTotal">
                    <p>Sub Total</p>
                    <input type="text" name="subTotal" id="subTotal" value={datosTransaccion?.subTotal || ''} required={true} readOnly={true}/>
                </label>
                <label htmlFor="total">
                    <p>Total</p>
                    <input type="text" name="total" id="total" value={datosTransaccion?.total || ''} required={true} readOnly={true}/>
                </label>
            </div>
            {isUpdate && (
                <>
                    <h3>Número de Lote</h3><hr></hr>
                    <div className="form-group3">
                        <label htmlFor="lot_numbers_str">
                            <p>N° de Lote (separados por coma)</p>
                            <input
                                type="text"
                                name="lot_numbers_str"
                                id="lot_numbers_str"
                                value={(modalData?.lot_numbers || []).join(', ')}
                                onChange={e => setModalData(prev => ({
                                    ...prev,
                                    lot_numbers: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                                }))}
                                placeholder="Ej: L2024-01, L2024-02"
                            />
                        </label>
                    </div>
                    <h3>Delivery</h3><hr></hr>
                    <div className="form-group3">
                        <label htmlFor="delivery_assigned_to">
                            <p>Asignar a (Delivery)</p>
                            <select
                                name="delivery_assigned_to"
                                id="delivery_assigned_to"
                                value={modalData?.delivery_assigned_to || ''}
                                onChange={handleInputChange}
                            >
                                <option value="">Sin asignar</option>
                                {deliveryUsers.map(u => (
                                    <option key={u.id || u._id} value={u.id || u._id}>
                                        {u.firstname} {u.lastname}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label htmlFor="delivery_date">
                            <p>Fecha de Entrega</p>
                            <input
                                type="date"
                                name="delivery_date"
                                id="delivery_date"
                                value={modalData?.delivery_date || ''}
                                onChange={handleInputChange}
                            />
                        </label>
                    </div>
                    <h3>Canales y Métodos</h3><hr></hr>
                    <div className="form-group3">
                        <label htmlFor="label">
                            <p>Etiqueta</p>
                            <select name="label" id="label" value={modalData?.label || ''} onChange={handleInputChange}>
                                <option value="">Sin etiqueta</option>
                                <optgroup label="Ingreso">
                                    <option>Venta Directa</option>
                                    <option>Abono</option>
                                    <option>Devolución recibida</option>
                                    <option>Otro ingreso</option>
                                </optgroup>
                            </select>
                        </label>
                        <label htmlFor="description">
                            <p>Notas</p>
                            <input type="text" name="description" id="description" value={modalData?.description || ''} onChange={handleInputChange} placeholder="Detalles adicionales..." />
                        </label>
                    </div>
                    <div className="form-group3">
                        <label htmlFor="payment_method">
                            <p>Método de Pago</p>
                            <select name="payment_method" id="payment_method" value={modalData?.payment_method || ''} onChange={handleInputChange}>
                                <option value="">Sin especificar</option>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Yappy">Yappy</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </label>
                        <label htmlFor="delivery_method">
                            <p>Método de Entrega</p>
                            <select name="delivery_method" id="delivery_method" value={modalData?.delivery_method || ''} onChange={handleInputChange}>
                                <option value="">Sin especificar</option>
                                <option value="Pickup">Pickup</option>
                                <option value="Delivery propio">Delivery propio</option>
                                <option value="Mensajería">Mensajería</option>
                                <option value="Digital">Digital</option>
                            </select>
                        </label>
                        <label htmlFor="channel">
                            <p>Canal de Acceso</p>
                            <select name="channel" id="channel" value={modalData?.channel || ''} onChange={handleInputChange}>
                                <option value="">Sin especificar</option>
                                <option value="Sitio Web">Sitio Web</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Instagram">Instagram</option>
                                <option value="Vendedor">Vendedor</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </label>
                    </div>
                </>
            )}
            <div className='btnBorrarCrear' style={{justifyContent: isUpdate ? 'space-between' : 'right'}}>
                {isUpdate && <ConfirmDeleteButton onConfirm={deleteDatos} />}
                <input type="submit" value={isUpdate ? 'Actualizar' : 'Crear'} className='btnActualizarCrear' />
            </div>
        </form>
    );
};
