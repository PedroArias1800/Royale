import { useEffect, useRef, useState } from 'react';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Valentina M.',
    city: 'Panamá',
    product: 'Chanel No. 5',
    quote: 'Llegó en perfectas condiciones, sellado y original. El aroma exactamente igual al que compré en París. Definitivamente mi tienda de confianza.',
    stars: 5,
  },
  {
    id: 2,
    name: 'Carlos R.',
    city: 'David, Chiriquí',
    product: 'Dior Sauvage',
    quote: 'Hice el pedido un martes y el jueves ya lo tenía en casa. La presentación del empaque es impecable, ideal para regalo.',
    stars: 5,
  },
  {
    id: 3,
    name: 'Andrea L.',
    city: 'Chorrera',
    product: 'YSL Black Opium',
    quote: 'Ya es mi tercer pedido y siempre quedo satisfecha. Los precios son mucho mejores que en centros comerciales y el servicio es excelente.',
    stars: 5,
  },
  {
    id: 4,
    name: 'Roberto S.',
    city: 'San Miguelito',
    product: 'Versace Eros',
    quote: 'Le pregunté por WhatsApp si tenían una presentación específica y me respondieron al instante. Eso marca la diferencia.',
    stars: 5,
  },
  {
    id: 5,
    name: 'Luciana P.',
    city: 'Coronado',
    product: 'Lancôme La Vie Est Belle',
    quote: 'Compré para el cumpleaños de mi mamá. Llegó con un empaque hermoso y ella quedó encantada. 100% recomendado.',
    stars: 5,
  },
  {
    id: 6,
    name: 'Miguel A.',
    city: 'Ciudad de Panamá',
    product: 'Tom Ford Black Orchid',
    quote: 'La calidad es impecable y los precios son realmente competitivos. Lo mejor es que puedes pagar con Yappy sin ningún problema.',
    stars: 5,
  },
];

const Star = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 1L8.8 5.2L13.4 5.6L10.1 8.5L11.1 13L7 10.6L2.9 13L3.9 8.5L0.6 5.6L5.2 5.2L7 1Z"
      fill="#fdd05e" />
  </svg>
);

export const Testimonials = () => {
  const trackRef = useRef(null);
  const intervalRef = useRef(null);
  const [active, setActive] = useState(0);
  const total = TESTIMONIALS.length;

  const scrollTo = (track, index) => {
    const card = track.children[index];
    if (!card) return;
    const trackW = track.offsetWidth;
    const cardW = card.offsetWidth;
    track.scrollTo({ left: card.offsetLeft - (trackW - cardW) / 2, behavior: 'smooth' });
  };

  const goTo = (index) => {
    const next = (index + total) % total;
    setActive(next);
    const track = trackRef.current;
    if (track) scrollTo(track, next);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % total;
        const track = trackRef.current;
        if (track) scrollTo(track, next);
        return next;
      });
    }, 4500);
    return () => clearInterval(intervalRef.current);
  }, [total]);

  return (
    <section className="testimonials" aria-label="Testimonios de clientes">
      <div className="testimonials__header">
        <div className="testimonials__ornament">
          <span className="testimonials__line" />
          <span className="testimonials__gem">◆</span>
          <span className="testimonials__line" />
        </div>
        <h2 className="testimonials__title">Lo que dicen nuestros clientes</h2>
        <p className="testimonials__subtitle">Más de 500 pedidos entregados en toda Panamá</p>
      </div>

      <div className="testimonials__track-wrap">
        <div className="testimonials__track" ref={trackRef}>
          {TESTIMONIALS.map((t, i) => (
            <article
              key={t.id}
              className={`testimonials__card${i === active ? ' testimonials__card--active' : ''}`}
              onClick={() => goTo(i)}
            >
              <div className="testimonials__stars" aria-label={`${t.stars} estrellas`}>
                {Array.from({ length: t.stars }).map((_, si) => <Star key={si} />)}
              </div>
              <blockquote className="testimonials__quote">"{t.quote}"</blockquote>
              <footer className="testimonials__footer">
                <span className="testimonials__name">{t.name}</span>
                <span className="testimonials__sep">·</span>
                <span className="testimonials__city">{t.city}</span>
                <span className="testimonials__product">{t.product}</span>
              </footer>
            </article>
          ))}
        </div>
      </div>

      <div className="testimonials__dots" role="tablist" aria-label="Testimonios">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            aria-label={`Testimonio ${i + 1}`}
            className={`testimonials__dot${i === active ? ' testimonials__dot--active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </section>
  );
};
