import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import { getParfumsBodyRequest } from '../api/Parfum.api.js';

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
                    <section className='content' key={element.body_id}
                    style={{'backgroundImage': `url("/index/${element.img}")`}} 
                    >
                        <div className="bodyContent" style={{'marginLeft': element.align}}>
                            <h1 dangerouslySetInnerHTML={{ __html: element.title }}></h1>
                            <Link to={element.url}
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
