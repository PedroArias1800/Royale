import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import { getParfumsBodyRequest } from '../api/Parfum.api.js';
const URLServer = import.meta.env.VITE_SERVER_URL || 'https://api.royalepanama.com'
const URLFrontend = import.meta.env.VITE_FRONTEND_URL || 'http://93.188.162.15:5173'

export const BodyInicial = () => {

    const [bodyContent, setBodyContent] = useState([])

    const [hovered, setHovered] = useState(false);

    const handleMouseEnter = () => setHovered(true);
    const handleMouseLeave = () => setHovered(false);

    useEffect(() => {

        async function loadBody() {
            const response = await getParfumsBodyRequest()
            setBodyContent(response.data)
        }
        loadBody()
      }, []);

    return (
        <div>
            {
                bodyContent.map(element => (
                    
                    <section className='content' key={element._id}
                    style={{'backgroundImage': `url("${URLServer}${element.back_img}")`}} 
                    >
                        <div className="bodyContent" style={{'marginLeft': element.align}}>
                            <img src={`${URLServer}${element.parfum_img}`} alt="" />
                            <h1 dangerouslySetInnerHTML={{ __html: element.title }}></h1>
                            <Link to={`/parfum?id=${element.parfum_id_fk._id}`}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                style={{
                                    'background': hovered ? element.color : element.color2
                                }}>Ver Más</Link>
                        </div>
                    </section>
                ))
            }
        </div>
    );
};
