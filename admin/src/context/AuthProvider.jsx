import { createContext, useContext, useEffect, useState } from "react";
import { postLoginRequest, postRegisterRequest, postLogOutRequest, verifyTokenRequest } from '../api/Login';
import Cookies from 'js-cookie'

export const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext)
    if(!context){
        throw new Error('useAuth está fuera de AuthProviver')
    }
    return context;
}

export const AuthProvider = ({ children }) => {
    
    const [user, setUser] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [errors, setErrors] = useState([])
    

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

    return <AuthContext.Provider value={{ signIn, signUp, closeSession, user, isAuthenticated, errors }}>
        {children}
    </AuthContext.Provider>

}