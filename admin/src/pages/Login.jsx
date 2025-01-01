import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { useAuth } from '../context/AuthProvider';

export const Login = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { signIn, isAuthenticated, errors: RegisterErros } = useAuth();
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
        signIn(values)
    })

    return (
        <div>
            <Alert message={alertMessage} color={'--color-rojo-alert'} color2={'--color-rojo-alert-hover'} onClose={() => setAlertMessage("")}/>
            <h2>Login</h2>
            <form onSubmit={onSubmit}>
                <input type="email" {...register("email", {required: true})} autoComplete="email" />
                {errors.email && (<p>El correo es requerido</p>)}
                <input type="password" {...register("password", {required: true})} autoComplete="password" />
                {errors.password && (<p>La contraseña es requerida</p>)}
                <button type="submit">Log In</button>
            </form>
            <div>
                <h3>¿Aún no tienes una cuenta?</h3>
                <Link to="/register">Regístrate</Link>
            </div>
        </div>
    );
};
