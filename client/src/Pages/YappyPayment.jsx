import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { postYappyVerifyRequest, postPagarRequest, postClientConfirmEmail } from "../api/Cart.api";
import { useParfum } from "../context/ParfumContext";

const POLL_INTERVAL_MS = 30 * 1000;
const POLL_TIMEOUT_MS  = 10 * 60 * 1000;

// Formatea teléfono panameño: "62126212" → "6212-6212"
const fmtPhone = (raw = "") => {
  const digits = raw.replace(/\D/g, "").slice(-8);
  return digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : raw;
};

export const YappyPayment = () => {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const cdnRef      = useRef(false);
  const autoClicked = useRef(false);
  const wrapRef     = useRef(null);

  const { clearCart } = useParfum();

  const [phase, setPhase]         = useState("loading"); // loading | ready | done | timeout
  const [triggered, setTriggered] = useState(false);     // true después del auto-clic
  const [verifying, setVerifying] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [verifyMsg, setVerifyMsg] = useState("");

  const orderId      = state?.orderId      || "";
  const orderNumber  = state?.orderNumber  || "";
  const token        = state?.token        || "";
  const documentName = state?.documentName || "";
  const cdnUrl       = state?.cdnUrl       || "https://bt-cdn-uat.yappycloud.com/v1/cdn/web-component-btn-yappy.js";
  const phone        = state?.phone        || "";
  const total        = state?.total        || "";
  const emailMessage = state?.emailMessage || "";
  const userName     = state?.userName     || "";
  const userEmail    = state?.userEmail    || "";
  const products     = state?.products     || "";

  // Redirige si llegó sin datos válidos
  useEffect(() => {
    if (!orderId || !token) navigate("/cart", { replace: true });
  }, [orderId, token, navigate]);

  // Carga el CDN del web component de Yappy
  useEffect(() => {
    if (!cdnUrl || cdnRef.current) return;
    cdnRef.current = true;

    const existing = document.querySelector(`script[src="${cdnUrl}"]`);
    if (existing) { setPhase("ready"); return; }

    const script = document.createElement("script");
    script.src   = cdnUrl;
    script.async = true;
    script.onload  = () => setPhase("ready");
    script.onerror = () => setPhase("ready");
    document.head.appendChild(script);
  }, [cdnUrl]);

  // Auto-clic en btn-yappy cuando el CDN esté listo
  useEffect(() => {
    if (phase !== "ready" || autoClicked.current) return;
    // Pequeño delay para que el web component termine de renderizar su shadow DOM
    const timer = setTimeout(() => {
      autoClicked.current = true;
      const el = wrapRef.current?.querySelector("btn-yappy") || document.querySelector("btn-yappy");
      if (el) el.click();
      setTriggered(true);
    }, 700);
    return () => clearTimeout(timer);
  }, [phase]);

  // Verifica estado — compartido entre polling y botón manual
  const checkStatus = async () => {
    try {
      const res = await postYappyVerifyRequest({ orderId });
      const status = res.data?.status;
      if (status === 2) {
        setPhase("done");
        // Correo interno admin
        if (emailMessage && userName) {
          postPagarRequest(emailMessage, userName, phone).catch(() => {});
        }
        // Correo confirmación al cliente
        if (userEmail) {
          postClientConfirmEmail({ to_email: userEmail, to_name: userName, order_number: orderNumber || orderId.slice(-8).toUpperCase(), total, products, phone }).catch(() => {});
        }
        clearCart("¡Pago confirmado!", "--color-dorado", "--color-dorado-hover");
        navigate("/pago-exitoso", { replace: true, state: { v2confirmed: true } });
        return true;
      } else if (status === 0) {
        setPhase("done");
        navigate("/pago-cancelado", { replace: true });
        return true;
      }
    } catch { /* ignorar errores de red */ }
    return false;
  };

  // Verificación inmediata cuando el usuario vuelve a la pestaña
  useEffect(() => {
    if (!orderId || phase === "done" || phase === "timeout") return;
    const onVisible = async () => {
      if (document.visibilityState === "visible") {
        setPollCount(n => n + 1);
        await checkStatus();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [orderId, phase]);

  // Polling de respaldo cada 30 segundos con timeout de 10 minutos
  useEffect(() => {
    if (!orderId || phase === "done" || phase === "timeout") return;
    const startTime = Date.now();
    const interval = setInterval(async () => {
      if (Date.now() - startTime >= POLL_TIMEOUT_MS) {
        clearInterval(interval);
        setPhase("timeout");
        return;
      }
      setPollCount(n => n + 1);
      await checkStatus();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [orderId, phase]);

  // Re-clic manual si el usuario no recibió la solicitud
  const handleRetrigger = () => {
    const el = wrapRef.current?.querySelector("btn-yappy") || document.querySelector("btn-yappy");
    if (el) el.click();
  };

  const handleManualVerify = async () => {
    setVerifying(true);
    setVerifyMsg("");
    const confirmed = await checkStatus();
    if (!confirmed) {
      setVerifyMsg("No pudimos confirmar el pago. Si ya pagaste, guarda tu número de confirmación de Yappy y contáctanos por WhatsApp.");
    }
    setVerifying(false);
  };

  const successUrl = `${window.location.origin}/pago-exitoso`;
  const failUrl    = `${window.location.origin}/pago-cancelado`;
  const phoneFormatted = fmtPhone(phone);

  const orderRef = orderNumber || orderId.slice(-8).toUpperCase();

  return (
    <div className="yp-wrapper">
      <div className="yp-card">

        {/* Esquinas decorativas extra (top-right y bottom-left) */}
        <span className="yp-corner yp-corner--tr" aria-hidden="true" />
        <span className="yp-corner yp-corner--bl" aria-hidden="true" />

        {/* Cabecera Yappy */}
        <div className="yp-header">
          <svg className="yp-logo-svg" viewBox="0 0 44 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="14" cy="14" r="14" fill="#1BAEE8" />
            <circle cx="30" cy="14" r="14" fill="#FF6B35" />
          </svg>
          <span className="yp-brand">yappy</span>
        </div>

        {/* Separador ornamental */}
        <div className="yp-ornament" aria-hidden="true">
          <span className="yp-ornament-line" />
          <span className="yp-ornament-diamond">◆</span>
          <span className="yp-ornament-line" />
        </div>

        {/* Estado: cargando CDN */}
        {phase === "loading" && (
          <>
            <p className="yp-instruction">Preparando tu pago…</p>
            <div className="yp-spinner" aria-label="Cargando…" />
          </>
        )}

        {/* Estado: listo */}
        {phase !== "loading" && phase !== "done" && (
          <>
            {/* Teléfono al que se envió la solicitud */}
            {phoneFormatted && (
              <div className="yp-phone-box">
                <span className="yp-phone-label">Solicitud de pago enviada a</span>
                <span className="yp-phone-number">{phoneFormatted}</span>
                {total && (
                  <div className="yp-amount-row">
                    <span className="yp-amount-label">por</span>
                    <span className="yp-amount-value">${total}</span>
                  </div>
                )}
                <button
                  className="yp-phone-wrong"
                  onClick={() => navigate("/cart", { replace: true })}
                  type="button"
                >
                  ¿Número incorrecto? Volver al carrito
                </button>
              </div>
            )}

            {/* Instrucción principal */}
            {triggered && (
              <p className="yp-instruction-main">
                Abre la app Yappy y aprueba el pago
              </p>
            )}

            {/* El web component — oculto visualmente pero activo en el DOM */}
            <div ref={wrapRef} className="yp-component-wrap" aria-hidden="true">
              <btn-yappy
                token={token}
                document-name={documentName}
                success-url={successUrl}
                fail-url={failUrl}
              />
            </div>

            {/* Fallback: si no recibió la solicitud */}
            {triggered && (
              <button className="yp-retrigger-btn" onClick={handleRetrigger} type="button">
                ¿No te llegó la solicitud? Toca aquí para reenviar
              </button>
            )}

            {/* Número de Pedido — destacado */}
            <div className="yp-order-card">
              <span className="yp-order-card-label">Número de Pedido</span>
              <span className="yp-order-card-value">{orderRef}</span>
            </div>

            {/* Mensaje de estado del polling */}
            {phase !== "timeout" && (
              <div className="yp-wait-box">
                <div className="yp-wait-dots" aria-hidden="true">
                  <span /><span /><span />
                </div>
                <p className="yp-wait-msg">
                  {pollCount === 0
                    ? "Esperando confirmación del pago"
                    : `Verificando… (intento ${pollCount})`}
                </p>
                {pollCount > 0 && (
                  <p className="yp-wait-hint">Verificación automática cada 30 segundos.</p>
                )}
              </div>
            )}

            {/* Timeout: verificación manual */}
            {phase === "timeout" && (
              <div className="yp-timeout-box">
                <p className="yp-timeout-msg">
                  No recibimos confirmación automática. Si ya pagaste, presiona el botón para verificar.
                </p>
                <button
                  className="yp-verify-btn"
                  onClick={handleManualVerify}
                  disabled={verifying}
                >
                  {verifying ? "Verificando…" : "Ya pagué — verificar ahora"}
                </button>
                {verifyMsg && <p className="yp-verify-error">{verifyMsg}</p>}
                <p className="yp-timeout-hint">
                  Guarda tu número de pedido y escríbenos por WhatsApp si el problema persiste.
                </p>
              </div>
            )}
          </>
        )}

        <button
          className="yp-cancel-btn"
          onClick={() => navigate("/cart", { replace: true })}
        >
          ← Volver al carrito
        </button>
      </div>

      <style>{`
        /* ── Yappy Payment — Art Deco Noir Luxe ─────────────────────── */

        .yp-wrapper {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080409;
          background-image:
            radial-gradient(ellipse 80% 55% at 50% 0%, rgba(253,208,94,0.055) 0%, transparent 70%),
            radial-gradient(ellipse 50% 30% at 50% 100%, rgba(27,174,232,0.03) 0%, transparent 60%);
          padding: 2rem 1rem;
        }

        /* Tarjeta principal */
        .yp-card {
          background: linear-gradient(160deg, #110d14 0%, #0a0709 100%);
          border: 1px solid rgba(253,208,94,0.22);
          border-radius: 2px;
          padding: 2.4rem 2.4rem 2rem;
          max-width: 440px;
          width: 100%;
          text-align: center;
          box-shadow:
            0 0 0 1px rgba(253,208,94,0.04),
            0 24px 80px rgba(0,0,0,0.8),
            inset 0 1px 0 rgba(253,208,94,0.08);
          position: relative;
        }

        /* 4 esquinas Art Deco (::before/::after = TL/BR, spans = TR/BL) */
        .yp-card::before,
        .yp-card::after,
        .yp-corner {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          border-color: rgba(253,208,94,0.4);
          border-style: solid;
          pointer-events: none;
        }
        .yp-card::before { top: 8px; left: 8px;  border-width: 1px 0 0 1px; }
        .yp-card::after  { bottom: 8px; right: 8px; border-width: 0 1px 1px 0; }
        .yp-corner--tr   { top: 8px; right: 8px;  border-width: 1px 1px 0 0; }
        .yp-corner--bl   { bottom: 8px; left: 8px; border-width: 0 0 1px 1px; }

        /* Cabecera */
        .yp-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 0;
          padding-bottom: 1.2rem;
        }
        .yp-logo-svg { width: 42px; height: 27px; flex-shrink: 0; }
        .yp-brand {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1BAEE8;
          letter-spacing: -0.5px;
          line-height: 1;
        }

        /* Separador ornamental */
        .yp-ornament {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1.4rem;
        }
        .yp-ornament-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(253,208,94,0.3));
        }
        .yp-ornament-line:last-child {
          background: linear-gradient(90deg, rgba(253,208,94,0.3), transparent);
        }
        .yp-ornament-diamond {
          font-size: 0.45rem;
          color: rgba(253,208,94,0.5);
          line-height: 1;
        }

        /* Instrucción de carga */
        .yp-instruction {
          font-family: Raleway, sans-serif;
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(237,232,235,0.45);
          margin: 0.8rem 0 1.2rem;
        }

        /* Instrucción principal */
        .yp-instruction-main {
          font-family: Cinzel, serif;
          font-size: 0.88rem;
          color: #fdd05e;
          margin: 1rem 0 1.2rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* Caja del teléfono */
        .yp-phone-box {
          border: 1px solid rgba(253,208,94,0.18);
          border-radius: 2px;
          padding: 1.3rem 1.6rem 1.1rem;
          margin: 0 0 1.1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          background: rgba(253,208,94,0.022);
          animation: yp-breathe 3.5s ease-in-out infinite;
        }
        @keyframes yp-breathe {
          0%, 100% { border-color: rgba(253,208,94,0.18); box-shadow: none; }
          50%       { border-color: rgba(253,208,94,0.45); box-shadow: 0 0 28px rgba(253,208,94,0.07); }
        }

        .yp-phone-label {
          font-family: Raleway, sans-serif;
          font-size: 0.64rem;
          color: rgba(237,232,235,0.35);
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }
        .yp-phone-number {
          font-family: Cinzel, serif;
          font-size: 2.2rem;
          color: #fdd05e;
          letter-spacing: 0.08em;
          font-weight: 700;
          line-height: 1.1;
          text-shadow: 0 0 32px rgba(253,208,94,0.32);
        }
        .yp-amount-row {
          display: flex;
          align-items: baseline;
          gap: 5px;
          margin-top: 0.15rem;
        }
        .yp-amount-label {
          font-family: Raleway, sans-serif;
          font-size: 0.72rem;
          color: rgba(237,232,235,0.35);
          letter-spacing: 0.06em;
        }
        .yp-amount-value {
          font-family: Cinzel, serif;
          font-size: 1.05rem;
          color: rgba(253,208,94,0.75);
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .yp-phone-wrong {
          background: none;
          border: none;
          color: rgba(237,232,235,0.2);
          font-family: Raleway, sans-serif;
          font-size: 0.64rem;
          cursor: pointer;
          padding: 0.3rem 0 0;
          text-decoration: underline;
          text-underline-offset: 3px;
          letter-spacing: 0.03em;
          transition: color 0.2s;
        }
        .yp-phone-wrong:hover { color: rgba(237,232,235,0.5); }

        /* Spinner dorado */
        .yp-spinner {
          width: 34px; height: 34px;
          border: 2px solid rgba(253,208,94,0.08);
          border-top-color: #fdd05e;
          border-right-color: rgba(253,208,94,0.35);
          border-radius: 50%;
          animation: yp-spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          margin: 1.4rem auto 1.6rem;
        }
        @keyframes yp-spin { to { transform: rotate(360deg); } }

        /* Web component oculto */
        .yp-component-wrap {
          height: 0;
          overflow: hidden;
          pointer-events: none;
          visibility: hidden;
        }

        /* Botón de reenvío */
        .yp-retrigger-btn {
          background: none;
          border: 1px solid rgba(253,208,94,0.15);
          color: rgba(253,208,94,0.5);
          font-family: Raleway, sans-serif;
          font-size: 0.71rem;
          letter-spacing: 0.04em;
          border-radius: 2px;
          padding: 0.45rem 1.2rem;
          cursor: pointer;
          margin-bottom: 1.1rem;
          transition: border-color 0.25s, color 0.25s, background 0.25s;
        }
        .yp-retrigger-btn:hover {
          border-color: rgba(253,208,94,0.38);
          color: rgba(253,208,94,0.85);
          background: rgba(253,208,94,0.04);
        }

        /* ── Número de Pedido destacado ─────────────────────────────── */
        .yp-order-card {
          border: 1px solid rgba(253,208,94,0.28);
          border-radius: 2px;
          background: rgba(253,208,94,0.04);
          padding: 0.85rem 1.4rem 0.9rem;
          margin: 0 0 1.3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          position: relative;
        }
        .yp-order-card::before {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 40px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(253,208,94,0.5), transparent);
        }
        .yp-order-card-label {
          font-family: Raleway, sans-serif;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(253,208,94,0.55);
        }
        .yp-order-card-value {
          font-family: 'Courier New', monospace;
          font-size: 1.05rem;
          font-weight: 700;
          color: #fdd05e;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-shadow: 0 0 18px rgba(253,208,94,0.25);
        }

        /* Estado de espera con dots animados */
        .yp-wait-box {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .yp-wait-dots {
          display: flex;
          gap: 6px;
          align-items: center;
          height: 14px;
        }
        .yp-wait-dots span {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: rgba(253,208,94,0.4);
          animation: yp-dot 1.5s ease-in-out infinite;
        }
        .yp-wait-dots span:nth-child(1) { animation-delay: 0s; }
        .yp-wait-dots span:nth-child(2) { animation-delay: 0.25s; }
        .yp-wait-dots span:nth-child(3) { animation-delay: 0.5s; }
        @keyframes yp-dot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40%            { opacity: 1;    transform: scale(1.15); background: rgba(253,208,94,0.75); }
        }
        .yp-wait-msg {
          font-family: Raleway, sans-serif;
          font-size: 0.75rem;
          color: rgba(237,232,235,0.45);
          margin: 0;
          letter-spacing: 0.04em;
        }
        .yp-wait-hint {
          font-family: Raleway, sans-serif;
          font-size: 0.64rem;
          color: rgba(237,232,235,0.22);
          margin: 0;
          letter-spacing: 0.02em;
        }

        /* Botón volver */
        .yp-cancel-btn {
          background: transparent;
          border: 1px solid rgba(237,232,235,0.1);
          color: rgba(237,232,235,0.3);
          padding: 0.52rem 1.5rem;
          border-radius: 2px;
          font-family: Raleway, sans-serif;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
          margin-top: 0.4rem;
        }
        .yp-cancel-btn:hover {
          border-color: rgba(237,232,235,0.28);
          color: rgba(237,232,235,0.58);
        }

        /* Timeout */
        .yp-timeout-box {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.85rem;
        }
        .yp-timeout-msg {
          font-family: Raleway, sans-serif;
          font-size: 0.83rem;
          color: rgba(237,232,235,0.6);
          line-height: 1.65;
          margin: 0;
        }
        .yp-verify-btn {
          background: #fdd05e;
          color: #080409;
          border: none;
          border-radius: 2px;
          padding: 0.78rem 1.9rem;
          font-family: Cinzel, serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 18px rgba(253,208,94,0.22);
        }
        .yp-verify-btn:hover:not(:disabled) {
          background: #ffe07a;
          box-shadow: 0 4px 28px rgba(253,208,94,0.38);
        }
        .yp-verify-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .yp-verify-error {
          font-family: Raleway, sans-serif;
          font-size: 0.76rem;
          color: #d60a5f;
          margin: 0;
          line-height: 1.6;
          text-align: center;
        }
        .yp-timeout-hint {
          font-family: Raleway, sans-serif;
          font-size: 0.64rem;
          color: rgba(237,232,235,0.28);
          margin: 0;
          line-height: 1.65;
          letter-spacing: 0.02em;
        }

        @media (max-width: 480px) {
          .yp-card { padding: 2rem 1.4rem 1.6rem; }
          .yp-phone-number { font-size: 1.85rem; }
        }
      `}</style>
    </div>
  );
};
