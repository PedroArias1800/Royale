import { useEffect, useState } from 'react'

import { BodyInicial } from '../components/BodyInicial'
import { SectionDamaCaballero } from '../components/SectionDamaCaballero'
import { MasBuscados } from '../components/MasBuscados'
import { BannerPromos } from '../components/BannerPromos'
import { getPromotions } from '../api/Promotions.api.js';


export const Index = () => {

    const [promotions, setPromotions] = useState([]);
    useEffect(() => {
        async function loadPromotions() {
            const response = await getPromotions();
            console.log(response.data);
            setPromotions(response.data);
        }
        loadPromotions();
    }, []);
  
  
  return (
    <>
        <BannerPromos data={promotions} />
        <BodyInicial />
        <MasBuscados />
        <SectionDamaCaballero />
    </>
  )
}
