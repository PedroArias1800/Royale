import { useEffect } from 'react';
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export const Login = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { signIn, isAuthenticated, closeModal } = useAuth();

    useEffect(() => {
        if (isAuthenticated) navigate('/admin')
    }, [isAuthenticated])

    useEffect(() => {
        closeModal()
    }, [])
    
    const onSubmit = handleSubmit(async (values) => {
        signIn(values)
    })

    return (
        <div className='login'>
            <div className="login-card">
                <h2>Royale Admin</h2>
                <form onSubmit={onSubmit}>
                    <input type="email" {...register("email", {required: true})} autoComplete="email" placeholder='correo@royale.com' />
                    <input type="password" {...register("password", {required: true})} autoComplete="current-password" placeholder='Contraseña' />
                    <input type="submit" value='Ingresar' />
                </form>
            </div>
        </div>
    );
};
