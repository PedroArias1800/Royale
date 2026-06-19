import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import { getParfumsBodyRequest } from '../api/Parfum.api.js';
import { useParfum } from '../context/ParfumContext';

export const BodyInicial = () => {

    const [bodyContent, setBodyContent] = useState([])
    const [hovered, setHovered] = useState(false);
    const { imgSrc } = useParfum();

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
                    style={{'backgroundImage': `url("${imgSrc(element.back_img)}")`}}
                    >
                        <div className="bodyContent" style={{'marginLeft': element.align}}>
                            <img src={imgSrc(element.parfum_img)} alt="" />
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
