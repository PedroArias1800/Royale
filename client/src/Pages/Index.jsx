import { useEffect, useState } from 'react'

import { BodyInicial } from '../components/BodyInicial'
import { SectionDamaCaballero } from '../components/SectionDamaCaballero'
import { MasBuscados } from '../components/MasBuscados'
import { BannerPromos } from '../components/BannerPromos'
import { getPromotions } from '../api/Promotions.api.js';
import { getParfumsRequest } from '../api/Parfum.api.js';


export const Index = () => {

  const [parfumFlash, setParfumFlash] = useState([])
  const [parfumNormal, setParfumNormal] = useState([])
  const [promotions, setPromotions] = useState([]);

    useEffect(() => {
        async function loadPromotions() {
            const response = await getPromotions();
            setPromotions(response.data);
        }
        async function loadParfumFlash() {
          const response = await getParfumsRequest(10, 'Flash')
          setParfumFlash(response.data)
        }
        async function loadParfumNormal() {
          const response = await getParfumsRequest(10, 'Normal')
          setParfumNormal(response.data)
        }
        loadPromotions();
        loadParfumFlash()
        loadParfumNormal()
    }, []);
  
  
  return (
    <>
        <BannerPromos data={promotions} />
        {
          (parfumFlash.length > 0) && (
            <MasBuscados title={'VENTAS FLASH'} typeOfSale={'Flash'} parfum={parfumFlash} />
          )
        }
        <BodyInicial />
        {
          (parfumNormal.length > 0) && (
            <MasBuscados title={'MÁS BUSCADOS'} typeOfSale={'Normal'} parfum={parfumNormal} />
          )
        }
        <SectionDamaCaballero />
    </>
  )
}
