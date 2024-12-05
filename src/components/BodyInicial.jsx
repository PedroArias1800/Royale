import { useState } from 'react';
import { Link } from 'react-router-dom'
import data from '../json/BodyContent.json'

export const BodyInicial = () => {

    const [hovered, setHovered] = useState(false);

    const handleMouseEnter = () => setHovered(true);
    const handleMouseLeave = () => setHovered(false);

    return (
        <div>
            {
                data.BodyContent.map((element, index) => (
                    <section className='content' key={index}
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
