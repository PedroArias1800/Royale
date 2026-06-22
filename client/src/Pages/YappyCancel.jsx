import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { postYappyVerifyRequest } from "../api/Cart.api";

export const YappyCancel = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const orderId       = searchParams.get("orderId");
    const paymentStatus = searchParams.get("status") || "C";
    if (orderId) {
      postYappyVerifyRequest({ orderId, status: paymentStatus }).catch(() => {});
    }
  }, []);

  return (
    <div className="yappy-page">
      <div className="yappy-page__box">
        <div className="yappy-page__icon yappy-page__icon--cancel">↩</div>
        <h2 className="yappy-page__title">Pago Cancelado</h2>
        <p className="yappy-page__msg">
          Cancelaste el pago con Yappy. Tu carrito sigue intacto, puedes intentarlo nuevamente o pagar por WhatsApp.
        </p>
        <div className="yappy-page__actions">
          <Link to="/cart" className="yappy-page__btn">Volver al carrito</Link>
        </div>
      </div>
    </div>
  );
};
