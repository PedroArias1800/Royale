import { createContext, useContext, useEffect, useState } from "react";
import { postLoginRequest, postRegisterRequest, postLogOutRequest, verifyTokenRequest } from '../api/Login';
import { getParfumsRequest, getTypesRequest, getBodiesRequest, getBrandsRequest, getVersionsRequest } from '../api/Admin.api.js'
import Cookies from 'js-cookie'

import { ModalFormParfum } from "../components/ModalFormParfum";
import { ModalFormVersion } from "../components/ModalFormVersion";
import { ModalFormType } from "../components/ModalFormType";
import { ModalFormBrand } from "../components/ModalFormBrand";
import { ModalFormBody } from "../components/ModalFormBody";


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
                } 
            } else {
                setIsAuthenticated(false)
                setUser(null)
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
        else {
            console.log(modalData, idNumber)
        }
    }, [modalData, idNumber]);

    const closeModal = () => {
        setModalVisible(false);  // Cerrar el modal
        setModalContent(null);  // Limpiar el contenido del modal
    };

    const cargarDataTables = async (id) => {
        if (id == 1) {
            const response = await getParfumsRequest();
            setResponse(Array.isArray(response.data) ? response.data : []);
        }
        else if (id == 2){
            const response = await getTypesRequest();
            setResponse(Array.isArray(response.data) ? response.data : []);
        }
        else if (id == 3){
            const response = await getBrandsRequest();
            setResponse(Array.isArray(response.data) ? response.data : []);
        }
        else if (id == 4){
            const response = await getVersionsRequest();
            setResponse(Array.isArray(response.data) ? response.data : []);
        }
        else if (id == 5){
            const response = await getBodiesRequest();
            setResponse(Array.isArray(response.data) ? response.data : []);
        }
        else{
            console.log('Error')
        }
    }


    return <AuthContext.Provider value={{ signIn, signUp, closeSession, user, isAuthenticated, errors, setModalData, setIdNumber, cargarDataTables, response, closeModal }}>
        {children}
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