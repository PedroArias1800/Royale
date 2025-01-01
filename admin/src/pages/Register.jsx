import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form'
import { Alert } from '../components/Alert.jsx'
import { useAuth } from '../context/AuthProvider';
import { Link, useNavigate } from 'react-router-dom';

export const Register = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { signUp, isAuthenticated, errors: RegisterErros } = useAuth();
    const navigate = useNavigate();
    const [alertMessage, setAlertMessage] = useState("");

    useEffect(() => {
        if (isAuthenticated) navigate('/admin')
    }, [isAuthenticated])

    useEffect(() => {
        if (RegisterErros){
            setAlertMessage(RegisterErros[0])
        } 
    }, [RegisterErros])

    const onSubmit = handleSubmit(async (values) => {
        signUp(values)
    })

    return (
        <div>
            <Alert message={alertMessage} color={'--color-rojo-alert'} color2={'--color-rojo-alert-hover'} onClose={() => setAlertMessage("")}/>
            <h2>Register</h2>
            <form onSubmit={onSubmit}>
                <input type="text" {...register("firstname", {required: true})} placeholder='Nombre' autoComplete="firstname"/>
                {errors.firstname && (<p>El nombre es requerido</p>)}
                <input type="text" {...register("lastname", {required: true})} placeholder='Apellido' autoComplete="lastname"/>
                {errors.lastname && (<p>El apellido es requerido</p>)}
                <input type="email" {...register("email", {required: true})} placeholder='Email' autoComplete="email"/>
                {errors.email && (<p>El correo es requerido</p>)}
                <input type="password" {...register("password", {required: true})} placeholder='Contraseña' autoComplete="password"/>
                {errors.password && (<p>La contraseña es requerida</p>)}
                <button type="submit">Sign Up</button>
            </form>
            <div>
                <h3>¿Tienes una cuenta?</h3>
                <Link to="/login">Inicia Sesión</Link>
            </div>
        </div>
    );
};
