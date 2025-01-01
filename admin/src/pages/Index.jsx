import React, { useEffect } from 'react'
import { useAuth } from '../context/AuthProvider.jsx'
import { useNavigate } from 'react-router-dom';

export const Index = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) navigate('/login')
    }, [isAuthenticated])

  return (
    <div>Index</div>
  )
}