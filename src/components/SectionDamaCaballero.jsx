import { Link } from "react-router-dom"


export const SectionDamaCaballero = () => {
  return (
    <div className="grid-container">
        <section className='grid-item' style={{'background': 'url("./index/Banner-damas.webp")'}}>
            <div style={{'alignItems': 'end'}}>
                <h1 style={{'textAlign': 'right'}}>PERFUMES DE<br/>DAMAS</h1>
                <Link to='/damas'>Ver Más</Link>
            </div>
        </section>
        <section className='grid-item' style={{'background': 'url("./index/Banner-caballeros.webp")'}}>
            <div style={{'alignItems': 'start'}}>
                <h1 style={{'textAlign': 'left'}}>PERFUMES DE<br/>CABALLEROS</h1>
                <Link to='/caballeros'>Ver Más</Link>
            </div>
        </section>
    </div>
  )
}
