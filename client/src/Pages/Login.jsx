import React from 'react';
import { postLoginRequest } from '../api/Login';
import { useNavigate } from 'react-router-dom'; // Necesitas 'react-router-dom' para redirigir.

export const Login = () => {
    const navigate = useNavigate(); // Usamos 'useNavigate' para navegar programáticamente.

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const login = await postLoginRequest(data);
            if (login.status === 200) {
                // Si el login es exitoso (status 200), redirige a la ruta "/admin"
                navigate('/admin');
            } else {
                // Manejar el caso de error (puedes agregar una alerta o mensaje aquí)
                console.log('Login failed', login.message); // Aquí puedes personalizar el mensaje de error.
            }        } catch (error) {
            console.error('Error during login:', error);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Username:</label>
                    <input
                        type="text"
                        id="email"
                        name="email" // Necesario para que FormData pueda capturarlo
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                    />
                </div>
                <button type="submit">Log in</button>
            </form>
        </div>
    );
};
