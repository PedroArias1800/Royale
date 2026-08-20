import { useEffect, useState } from 'react'

import { BodyInicial } from '../components/BodyInicial'
import { SectionDamaCaballero } from '../components/SectionDamaCaballero'
import { MasBuscados } from '../components/MasBuscados'
import { MasBuscadosHome } from '../components/MasBuscadosHome'
import { BannerPromos } from '../components/BannerPromos'
import { Testimonials } from '../components/Testimonials'
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

const CarouselSkeleton = () => (
  <div className="carousel-skeleton">
    <div className="skeleton carousel-skeleton__title" />
    <div className="carousel-skeleton__cards">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton carousel-skeleton__card" />
      ))}
    </div>
  </div>
);

export const Index = () => {

  const [parfumFlash, setParfumFlash] = useState([])
  const [parfumNormal, setParfumNormal] = useState([])
  const [promotions, setPromotions] = useState([]);
  const [loadingBanner, setLoadingBanner] = useState(true);
  const [loadingFlash, setLoadingFlash] = useState(true);
  const [loadingNormal, setLoadingNormal] = useState(true);

  useEffect(() => {
    document.title = 'Royale Panama — Perfumes de Lujo en Panamá';
  }, []);

    useEffect(() => {
        async function loadPromotions() {
            try {
              const response = await getPromotions();
              setPromotions(response.data);
            } catch {}
            finally { setLoadingBanner(false); }
        }
        async function loadParfumFlash() {
          try {
            const response = await getParfumsRequest(10, 'Flash')
            setParfumFlash(shuffle(response.data))
          } catch {}
          finally { setLoadingFlash(false); }
        }
        async function loadParfumNormal() {
          try {
            const response = await getParfumsRequest(10, 'Normal')
            setParfumNormal(shuffle(response.data))
          } catch {}
          finally { setLoadingNormal(false); }
        }
        loadPromotions();
        loadParfumFlash()
        loadParfumNormal()
    }, []);


  return (
    <>
        {loadingBanner
          ? <div className="skeleton banner-skeleton" />
          : <BannerPromos data={promotions} />
        }
        {loadingFlash
          ? <CarouselSkeleton />
          : parfumFlash.length > 0 && (
              <MasBuscados title={'VENTAS FLASH'} typeOfSale={'Flash'} parfum={parfumFlash} />
            )
        }
        {loadingNormal
          ? <CarouselSkeleton />
          : parfumNormal.length > 0 && (
              <MasBuscadosHome title={'MÁS BUSCADOS'} typeOfSale={'Normal'} parfum={parfumNormal} />
            )
        }
        <BodyInicial />
        <SectionDamaCaballero />
        <Testimonials />
    </>
  )
}
