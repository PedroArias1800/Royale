import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getWompiStatusRequest } from "../api/Cart.api";
import { useParfum } from "../context/ParfumContext";

export const WompiResult = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useParfum();
  const [status, setStatus] = useState("verifying"); // "verifying" | "confirmed" | "failed"

  useEffect(() => {
    const wompiId = searchParams.get("id");

    if (!wompiId) { setStatus("failed"); return; }

    getWompiStatusRequest(wompiId)
      .then(res => {
        const txStatus = res.data?.status;
        if (txStatus === "APPROVED") {
          clearCart('¡Pago confirmado!', '--color-dorado', '--color-dorado-hover');
          setStatus("confirmed");
        } else {
          setStatus("failed");
        }
      })
      .catch(() => setStatus("failed"));
  }, []);

  return (
    <div className="yappy-page">
      {status === "verifying" && (
        <div className="yappy-page__box">
          <div className="yappy-spinner" />
          <p className="yappy-page__msg">Verificando tu pago con Wompi…</p>
        </div>
      )}
      {status === "confirmed" && (
        <div className="yappy-page__box">
          <div className="yappy-page__icon yappy-page__icon--ok">✓</div>
          <h2 className="yappy-page__title">¡Pago Confirmado!</h2>
          <p className="yappy-page__msg">
            Tu pago fue procesado correctamente. En breve recibirás confirmación de tu pedido.
          </p>
          <Link to="/" className="yappy-page__btn">Volver al inicio</Link>
        </div>
      )}
      {status === "failed" && (
        <div className="yappy-page__box">
          <div className="yappy-page__icon yappy-page__icon--fail">✕</div>
          <h2 className="yappy-page__title">Algo salió mal</h2>
          <p className="yappy-page__msg">
            No pudimos confirmar tu pago. Si el cobro fue procesado, contáctanos por WhatsApp para resolverlo.
          </p>
          <div className="yappy-page__actions">
            <Link to="/cart" className="yappy-page__btn yappy-page__btn--secondary">Volver al carrito</Link>
            <a
              href="https://wa.me/50765623382"
              target="_blank"
              rel="noreferrer"
              className="yappy-page__btn"
            >Contactar por WhatsApp</a>
          </div>
        </div>
      )}
    </div>
  );
};
