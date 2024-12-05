import { Header } from '../components/Header'
import { BodyInicial } from '../components/BodyInicial'
import { SectionDamaCaballero } from '../components/SectionDamaCaballero'
import { MasBuscados } from '../components/MasBuscados'
import { Footer } from '../components/Footer'

export const Index = () => {
  return (
    <>
        <Header />
        <BodyInicial />
        <MasBuscados />
        <SectionDamaCaballero />
        <Footer />
    </>
  )
}
