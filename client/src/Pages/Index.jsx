import { useEffect, useState } from 'react'

import { BodyInicial } from '../components/BodyInicial'
import { SectionDamaCaballero } from '../components/SectionDamaCaballero'
import { MasBuscados } from '../components/MasBuscados'
import { MasBuscadosHome } from '../components/MasBuscadosHome'
import { BannerPromos } from '../components/BannerPromos'
import { getPromotions } from '../api/Promotions.api.js';
import { getParfumsRequest } from '../api/Parfum.api.js';


const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

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
          setParfumFlash(shuffle(response.data))
        }
        async function loadParfumNormal() {
          const response = await getParfumsRequest(10, 'Normal')
          setParfumNormal(shuffle(response.data))
        }
        loadPromotions();
        loadParfumFlash()
        loadParfumNormal()
    }, []);


  return (
    <>
        <BannerPromos data={promotions} />
        {parfumFlash.length > 0 && (
          <MasBuscados title={'VENTAS FLASH'} typeOfSale={'Flash'} parfum={parfumFlash} />
        )}
        {parfumNormal.length > 0 && (
          <MasBuscadosHome title={'MÁS BUSCADOS'} typeOfSale={'Normal'} parfum={parfumNormal} />
        )}
        <BodyInicial />
        <SectionDamaCaballero />
    </>
  )
}
