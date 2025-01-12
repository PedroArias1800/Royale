import { createContext, useContext, useEffect, useState } from "react";
import { postLoginRequest, postRegisterRequest, postLogOutRequest, verifyTokenRequest } from '../api/Login';
import { getParfumsRequest, getTypesRequest, getBodiesRequest, getBrandsRequest, getVersionsRequest, getUsersRequest } from '../api/Admin.api.js'
import Cookies from 'js-cookie'

import { ModalFormParfum } from "../components/ModalFormParfum";
import { ModalFormVersion } from "../components/ModalFormVersion";
import { ModalFormType } from "../components/ModalFormType";
import { ModalFormBrand } from "../components/ModalFormBrand";
import { ModalFormBody } from "../components/ModalFormBody";
import { ModalFormUser } from "../components/ModalFormUser";
import { Alert } from "../components/Alert.jsx";
import { useNavigate } from "react-router-dom";


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

    const signIn = async (user) => {
        try {
            const res = await postLoginRequest(user);
            setUser(res.data)
            setIsAuthenticated(true)
        } catch (error) {
            setErrors(error.response.data)
        }
    }

    const signUp = async (user) => {
        try {
            const res = await postRegisterRequest(user);
            setUser(res)
            setIsAuthenticated(true)
        } catch (error) {
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
            const cookie = Cookies.get()
            if (cookie.token){
                try{
                    const res = await verifyTokenRequest(cookie.token)
                    if (!res.data) return setIsAuthenticated(false)
    
                    setIsAuthenticated(true)
                    setUser(res.data)
                } catch(err) {
                    setIsAuthenticated(false)
                    setUser(null)
                    navigate('/login')
                } 
            } else {
                setIsAuthenticated(false)
                setUser(null)
                navigate('/login')
            }
        }
        checkLogin()
    }, [])

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
    }, [modalData, idNumber]);

    const closeModal = () => {
        setModalVisible(false);  // Cerrar el modal
        setModalContent(null);  // Limpiar el contenido del modal
    };

    const cargarDataTables = async (id, page) => {
        let response = ''
        if (id == 1) {
            response = await getParfumsRequest(page);
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 2){
            response = await getTypesRequest();
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 3){
            response = await getBrandsRequest();
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 4){
            response = await getVersionsRequest();
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 5){
            response = await getBodiesRequest();
            setResponse(Array.isArray(response.data.data) ? response.data.data : []);
        }
        else if (id == 6){
            response = await getUsersRequest();
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


    return <AuthContext.Provider value={{ signIn, signUp, closeSession, user, isAuthenticated, errors, setModalData, setIdNumber, cargarDataTables, response, closeModal, showAlert, pagination }}>
        {children}
        <div className='mostrarAlerta'>
            <Alert message={alertMessage} color={c1} color2={c2} onClose={() => setAlertMessage("")}/>
        </div>
        {modalVisible && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <button onClick={closeModal}>Cerrar</button>
                    {modalContent}
                </div>
            </div>
        )}
    </AuthContext.Provider>

}