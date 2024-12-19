import { createContext, useContext } from "react";


export const ParfumContext = createContext();

export const useParfum = () => {
    const context = useContext(ParfumContext)
    if(!context){
        throw new Error('useParfum está fuera de ParfumContextProvider')
    }
    return context;
}

export const ParfumContextProvider = ({ children }) => {

    return <ParfumContext.Provider value={{ }}>
        {children}
    </ParfumContext.Provider>

}