import { createContext, useContext, useEffect, useState } from "react";
import { postLoginRequest, postRegisterRequest, postLogOutRequest, verifyTokenRequest } from '../api/Login';
import { getParfumsRequest, postGetTypesRequest, getBodiesRequest, getBrandsRequest, getVersionsRequest, getUsersRequest, getPromotionsRequest, getCouponsRequest, getCountTransactionsByUserThisMonth } from '../api/Admin.api.js'
import { postFilteredParfumsRequest, postFilteredTypesRequest, postFilteredBodiesRequest, postFilteredBrandsRequest, postFilteredVersionsRequest, postFilteredUsersRequest, postFilteredTransactionsRequest, postFilteredCouponsRequest } from '../api/Filter.api.js'
import { getAllTransactionsRequest } from "../api/Transaction.api.js";

import { ModalFormParfum } from "../components/ModalFormParfum";
import { ModalFormVersion } from "../components/ModalFormVersion";
import { ModalFormType } from "../components/ModalFormType";
import { ModalFormPromotion } from "../components/ModalFormPromotion";
import { ModalFormBrand } from "../components/ModalFormBrand";
import { ModalFormBody } from "../components/ModalFormBody";
import { ModalFormUser } from "../components/ModalFormUser";
import { ModalFormTransaction } from "../components/ModalFormTransaction";
import { Alert } from "../components/Alert.jsx";
import { useNavigate } from "react-router-dom";


// import { io } from 'socket.io-client';
import { ModalFormCoupon } from "../components/ModalFormCoupon.jsx";
const URLServer = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001'
const URLFrontend = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:4173'
const URLAdmin = import.meta.env.VITE_ADMIN_URL || 'http://localhost:4174'
// const socket = io(URLServer, {
//   transports: ['websocket'],  // Forzar WebSocket
// });



export const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext)
    if(!context){
        throw new Error('useAuth está fuera de AuthProvider')
    }
    return context;
}

export const AuthProvider = ({ children }) => {
    
    const [user, setUser] = useState(null)
    const [countSell, setCountSell] = useState(0);
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [errors, setErrors] = useState([])
    const [modalVisible, setModalVisible] = useState(false);  // Estado para controlar la visibilidad del modal
    const [modalContent, setModalContent] = useState(null);  // Estado para almacenar el contenido del modal  
    const [modalData, setModalData] = useState({});
    const [idNumber, setIdNumber] = useState(0) 
    const [response, setResponse] = useState([])
    const [alertMessage, setAlertMessage] = useState("");
    const [c1, setC1] = useState();
    const [c2, setC2] = useState();
    const navigate = useNavigate();
    const [pagination, setPagination] = useState({});
    // const [notifications, setNotifications] = useState([]);
    const [transaction, setTransaction] = useState([])

    // useEffect(() => {
    //     // Escuchar nuevas transacciones
    //     socket.on('newTransaction', (transaction) => {
    //         setNotifications((prev) => [...prev, transaction]);
    //         // Opcional: mostrar notificación en el navegador
    //         if (Notification.permission === 'granted') {
    //             new Notification(`Nueva Transacción por $${transaction.total}`, {
    //             body: `Descripción: ${transaction.userName}, ${transaction.quantities.reduce((acc, num) => acc + num, 0)} artículos en total.`,
    //             });
    //         }
    //         async function loadTransaction() {
    //             const response = await getTransactionsRequest()
    //             setTransaction(response.data)
    //         }
    //         loadTransaction()
          
    //     });

    //     return () => {
    //     socket.off('newTransaction');
    //     };
    // }, []);

    // useEffect(() => {
    //     // Pedir permiso para notificaciones del navegador
    //     if (Notification.permission !== 'granted') {
    //     Notification.requestPermission();
    //     }
    // }, []);

    const signIn = async (user) => {
        try {
            const res = await postLoginRequest(user);
            setUser(res.data)
            setIsAuthenticated(true)
        } catch (error) {
            showAlert('Ha ocurrido un error al iniciar sesión', 0)
            setErrors(error.response.data)
        }
    }

    const signUp = async (user) => {
        try {
            const res = await postRegisterRequest(user);
            setUser(res)
            setIsAuthenticated(true)
        } catch (error) {
            showAlert('Ha ocurrido un error al registrar al usuario', 0)
            setErrors(error.response.data)
        }
    }

    const closeSession = async () => {
        try {
            await postLogOutRequest();
            setUser(null)
            setIsAuthenticated(false)
        } catch (error) {
            setErrors(error.response.data)
        }
    }

    useEffect(() => {
        async function checkLogin () {
            try{
                const res = await verifyTokenRequest()
                if (!res.data) return setIsAuthenticated(false)
                setIsAuthenticated(true)
                setUser(res.data)
            } catch(err) {
                console.log(err)
                setIsAuthenticated(false)
                setUser(null)
                navigate('/login')
            } 
        }
        checkLogin()
    }, [])

    useEffect(() => {
        async function loadTransactions() {
            if (!user || !user.id) {
              return;
            }
            const response = await getCountTransactionsByUserThisMonth(user.id);
            setCountSell(response.data.totalQuantitiesThisMonth)
        }
        loadTransactions();
    }, [user])

    useEffect(() => {
        if (modalData && idNumber === 1) {
            setModalContent(<ModalFormParfum modalData={modalData} />);
            setModalVisible(true);
        }
        else if (modalData && idNumber === 2) {
            setModalContent(<ModalFormType modalData={modalData} />);
            setModalVisible(true);
        }
        else if (modalData && idNumber === 3) {
            setModalContent(<ModalFormBrand modalData={modalData} />);
            setModalVisible(true);
        }
        else if (modalData && idNumber === 4) {
            setModalContent(<ModalFormVersion modalData={modalData} />);
            setModalVisible(true);
        }
        else if (modalData && idNumber === 5) {
            setModalContent(<ModalFormBody modalData={modalData} />);
            setModalVisible(true);
        }
        else if (modalData && idNumber === 6) {
            setModalContent(<ModalFormUser modalData={modalData} />);
            setModalVisible(true);
        }
        else if (modalData && idNumber === 7) {
            setModalContent(<ModalFormTransaction modalData={modalData} />);
            setModalVisible(true);
        }
        else if (modalData && idNumber === 8) {
            setModalContent(<ModalFormPromotion modalData={modalData} />);
            setModalVisible(true);
        }
        else if (modalData && idNumber === 9) {
            setModalContent(<ModalFormCoupon modalData={modalData} />);
            setModalVisible(true);
        }
    }, [modalData, idNumber]);

    const closeModal = () => {
        setModalVisible(false);  // Cerrar el modal
        setModalContent(null);  // Limpiar el contenido del modal
        setIdNumber(0)
    };

    const cargarDataTables = async (id, page) => {
        let response = ''
        if (id == 1) {
            response = await getParfumsRequest(page);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 2){
            response = await postGetTypesRequest(countSell, page);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 3){
            response = await getBrandsRequest(page);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 4){
            response = await getVersionsRequest(page);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 5){
            response = await getBodiesRequest(page);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 6){
            response = await getUsersRequest(page);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 7){
            response = await getAllTransactionsRequest(page);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 8){
            response = await getPromotionsRequest(page);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 9){
            response = await getCouponsRequest(page);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else{
            console.log('Error')
        }
        setPagination(response.data.pagination)
    }

    const showAlert = (message, type) => {
        if (type == 1){
            setC1('--color-dorado')
            setC2('--color-dorado-hover')
        } else {
            setC1('--color-rojo-alert')
            setC2('--color-rojo-alert-hover')
        }
        
        setAlertMessage(message)
    }

    const filtrarData = async (id, page, filter) => {
        let response = ''
        if (id == 1) {
            response = await postFilteredParfumsRequest(page, filter);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 2){
            response = await postFilteredTypesRequest(page, filter);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 3){
            response = await postFilteredBrandsRequest(page, filter);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 4){
            response = await postFilteredVersionsRequest(page, filter);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 5){
            response = await postFilteredBodiesRequest(page, filter);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 6){
            response = await postFilteredUsersRequest(page, filter);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 7){
            response = await postFilteredTransactionsRequest(page, filter);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 9){
            response = await postFilteredCouponsRequest(page, filter);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        setPagination(response.data.pagination)
    }


    const imgSrc = (path) => (!path || path.startsWith('http')) ? path : `${URLServer}${path}`;
    return <AuthContext.Provider value={{ signIn, signUp, closeSession, user, isAuthenticated, errors, setModalData, setIdNumber, cargarDataTables, response, closeModal, showAlert, pagination, transaction, setTransaction, filtrarData, URLServer, URLFrontend, URLAdmin, setCountSell, countSell, imgSrc }}>
        {children}
        <div className='mostrarAlerta'>
            <Alert message={alertMessage} color={c1} color2={c2} onClose={() => setAlertMessage("")}/>
        </div>
        {modalVisible && (
            <div className="modal">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2>Añadir Nuevo Registro</h2>
                        <h2 onClick={closeModal} className="btnX">X</h2>
                    </div>
                    {modalContent}
                </div>
            </div>
        )}
    </AuthContext.Provider>

}