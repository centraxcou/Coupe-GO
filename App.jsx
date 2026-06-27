import React, { useState, useRef, useMemo, useEffect } from "react";

/* ============================================================
   CouPe Go! — App de Motorizados (v2)
   Corrige: login, llamar/mapa reales, foto+firma+DNI+pago/no-entregado,
   Recojos separado de Entregas con escáner real (no genera códigos,
   solo lee los que ya vienen en el paquete del cliente),
   + pestaña de Estadísticas (km, gráfica).
   Paleta: naranja #FF6B1A · carbón #1A1A1A · blanco #FAFAFA
   verde #2E7D32 · rojo no-entrega #C13515 · pizarra #5C6470 · línea aduana #C9CDD3
   ============================================================ */

function todayLabel() {
  return new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
}

// ---------------- Seed data ----------------
// Nota: el login está en modo prototipo (acepta cualquier usuario/contraseña).
// Cuando se conecte al backend real, aquí se validará contra la base de usuarios.

const SEED_ENTREGAS = [
  {
    id: "ORD-1042",
    cliente: "Florita Mariana Burgos Lozano",
    telefono: "971288525",
    direccion: "Ah. 25 de Diciembre Mz. A Lt. 8",
    distrito: "Independencia",
    lat: -11.9928,
    lng: -77.0567,
    monto: 86.5,
    metodoPago: "Efectivo",
    tipoEntrega: "Contra entrega",
    notas: "Tocar timbre dos veces. Dejar con vecina si no hay nadie (casa celeste).",
    estado: "pendiente", // pendiente | entregado | no_entregado
    evidencia: null,
  },
  {
    id: "ORD-1043",
    cliente: "Jhordan Salazar Tineo",
    telefono: "987112340",
    direccion: "Jr. Las Magnolias 245",
    distrito: "Comas",
    lat: -11.9456,
    lng: -77.0512,
    monto: 42.0,
    metodoPago: "Yape / Plin",
    tipoEntrega: "Solo envío",
    notas: "Llamar antes de subir, 3er piso sin ascensor.",
    estado: "pendiente",
    evidencia: null,
  },
  {
    id: "ORD-1044",
    cliente: "Rosa Elvira Quispe Mamani",
    telefono: "945778902",
    direccion: "Av. Tupac Amaru 1820, Tienda 14",
    distrito: "San Martín de Porres",
    lat: -12.0089,
    lng: -77.0712,
    monto: 0,
    metodoPago: "Ya pagado",
    tipoEntrega: "Recojo en tienda",
    notas: "Confirmar DNI antes de entregar.",
    estado: "entregado",
    evidencia: { hora: "09:14", metodo: "Ya pagado" },
  },
];

const SEED_RECOJOS = [
  {
    id: "REC-204",
    cliente: "Bazar Importaciones Lima SAC",
    contacto: "Mario Tello",
    telefono: "999004411",
    direccion: "Av. Universitaria 3450, Puesto 22",
    distrito: "Los Olivos",
    estado: "pendiente", // pendiente | completado
    paquetesEsperados: [
      { id: "r1", tracking: "COU0003311NOR", escaneado: false, descartado: false, motivo: "" },
      { id: "r2", tracking: "COU0003312NOR", escaneado: false, descartado: false, motivo: "" },
      { id: "r3", tracking: "COU0003313NOR", escaneado: false, descartado: false, motivo: "" },
    ],
    correoCliente: "bazarimportlima@gmail.com",
  },
  {
    id: "REC-205",
    cliente: "Tienda Accesorios Vivi",
    contacto: "Vivian Cárdenas",
    telefono: "988221190",
    direccion: "Jr. Cahuide 880",
    distrito: "San Martín de Porres",
    estado: "pendiente",
    paquetesEsperados: [
      { id: "r4", tracking: "COU0003320NOR", escaneado: false, descartado: false, motivo: "" },
    ],
    correoCliente: "viviaccesorios@gmail.com",
  },
];

const KM_HISTORY = [
  { dia: "Lun", km: 38 },
  { dia: "Mar", km: 44 },
  { dia: "Mié", km: 29 },
  { dia: "Jue", km: 51 },
  { dia: "Vie", km: 46 },
  { dia: "Sáb", km: 22 },
  { dia: "Hoy", km: 17 },
];

const NO_ENTREGA_MOTIVOS = [
  "Cliente no contesta",
  "Dirección incorrecta",
  "Cliente rechazó el pedido",
  "Nadie en el domicilio",
  "Reprogramado por el cliente",
];

// ---------------- Icons ----------------
const Icon = {
  back: (c = "#FAFAFA") => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  phone: (c = "#1A1A1A") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.7 3.5.8.6.1 1.1.6 1.1 1.2v3.3c0 .6-.5 1.1-1.1 1.1C10.8 21.4 2.6 13.2 2.6 4c0-.6.5-1.1 1.1-1.1h3.3c.6 0 1.1.5 1.2 1.1.1 1.2.4 2.4.8 3.5.1.3 0 .7-.2 1l-2.2 2.2z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  map: (c = "#1A1A1A") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21s7-7.4 7-12a7 7 0 1 0-14 0c0 4.6 7 12 7 12z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.4" stroke={c} strokeWidth="1.8" />
    </svg>
  ),
  camera: (c = "#FAFAFA") => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8h2.2l1.1-1.8A1.6 1.6 0 0 1 8.7 5.4h6.6c.55 0 1.06.3 1.4.78L17.8 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.2" stroke={c} strokeWidth="1.8" />
    </svg>
  ),
  check: (c = "#2E7D32") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill={c} />
      <path d="M7 12.5l3.2 3.2L17 9" stroke="#FAFAFA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  cross: (c = "#C13515") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill={c} />
      <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#FAFAFA" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  home: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 11.5L12 4l8 7.5M6 10v9h12v-9" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  box: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3.5 7.5L12 3l8.5 4.5V16.5L12 21l-8.5-4.5z"
        stroke={c}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" stroke={c} strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  ),
  chart: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  user: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.4" stroke={c} strokeWidth="1.9" />
      <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" stroke={c} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
  barcode: (c = "#FAFAFA") => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path d="M3 5v14M7 5v14M10 5v14M14 5v14M17 5v14M21 5v14" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  edit: (c = "#5C6470") => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
};

// ---------------- Small atoms ----------------
function Pill({ children, tone = "default" }) {
  const tones = {
    default: { bg: "#EEF0F2", fg: "#5C6470" },
    orange: { bg: "#FFE8D9", fg: "#C24A00" },
    green: { bg: "#E3F1E4", fg: "#1E5E22" },
    red: { bg: "#FBE4E0", fg: "#A32B14" },
  };
  const t = tones[tone] || tones.default;
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        padding: "4px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function TopBar({ title, subtitle, onBack }) {
  return (
    <div style={S.topbar}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={S.iconBtnDark} aria-label="Volver">
            {Icon.back()}
          </button>
        )}
        <div>
          <div style={S.topbarTitle}>{title}</div>
          {subtitle && <div style={S.topbarSubtitle}>{subtitle}</div>}
        </div>
      </div>
      <div style={S.logoMark}>
        <span style={{ color: "#FF6B1A" }}>COU</span>
        <span style={{ color: "#FAFAFA" }}>Pe</span>
      </div>
    </div>
  );
}

// ================= LOGIN =================
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  function submit() {
    // Modo prototipo: acepta cualquier usuario/contraseña no vacíos.
    // Cuando conectemos el backend real, aquí se valida contra la base de usuarios.
    if (user.trim().length > 0 && pass.length > 0) {
      setError("");
      onLogin();
    } else {
      setError("Ingresa usuario y contraseña.");
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") submit();
  }

  return (
    <div style={{ ...S.screen, justifyContent: "center", padding: "0 28px" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 700, color: "#1A1A1A" }}>
          <span style={{ color: "#FF6B1A" }}>COU</span>Pe <span style={{ fontSize: 20, fontWeight: 500, color: "#5C6470" }}>Go!</span>
        </div>
        <div style={{ fontSize: 13, color: "#5C6470", marginTop: 4 }}>Acceso para motorizados</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={S.fieldLabel}>Usuario</div>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Asignado por administración"
            style={S.input}
            autoComplete="username"
          />
        </div>
        <div>
          <div style={S.fieldLabel}>Contraseña</div>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="••••••••"
            style={S.input}
            autoComplete="current-password"
          />
        </div>
        {error && <div style={{ color: "#C13515", fontSize: 13 }}>{error}</div>}
        <button type="button" onClick={submit} style={{ ...S.primaryBtn, marginTop: 8 }}>
          Iniciar sesión
        </button>
      </div>

      <div style={{ textAlign: "center", fontSize: 12.5, color: "#9AA0AA", marginTop: 22 }}>
        ¿No tienes credenciales? Pídelas al área administrativa de CouPe.
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "#C9CDD3", marginTop: 40 }}>
        Modo prototipo: ingresa cualquier usuario y contraseña para continuar.
      </div>
    </div>
  );
}

// ================= HOME (resumen del día, tabs abajo) =================
function ResumenTab({ entregas, recojos, onOpenEntrega, onOpenRecojo }) {
  const pendientesE = entregas.filter((o) => o.estado === "pendiente");
  const pendientesR = recojos.filter((r) => r.estado === "pendiente");
  const cobroEfectivo = pendientesE.reduce((s, o) => (o.metodoPago === "Efectivo" ? s + o.monto : s), 0);

  return (
    <div style={S.tabContent}>
      <div style={S.summaryRow}>
        <div style={S.summaryCard}>
          <div style={S.summaryNum}>{pendientesE.length}</div>
          <div style={S.summaryLabel}>Entregas hoy</div>
        </div>
        <div style={S.summaryCard}>
          <div style={S.summaryNum}>{pendientesR.length}</div>
          <div style={S.summaryLabel}>Recojos hoy</div>
        </div>
        <div style={S.summaryCard}>
          <div style={{ ...S.summaryNum, color: "#FF6B1A" }}>S/ {cobroEfectivo.toFixed(2)}</div>
          <div style={S.summaryLabel}>Por cobrar</div>
        </div>
      </div>

      <div style={S.sectionLabel}>Próximas entregas</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
        {pendientesE.slice(0, 2).map((o) => (
          <MiniRow key={o.id} title={o.cliente} sub={o.distrito} tag={<Pill tone="orange">{o.id}</Pill>} onClick={() => onOpenEntrega(o.id)} />
        ))}
        {pendientesE.length === 0 && <EmptyHint text="No tienes entregas pendientes. Buen trabajo." />}
      </div>

      <div style={S.sectionLabel}>Próximos recojos</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px 28px" }}>
        {pendientesR.slice(0, 2).map((r) => (
          <MiniRow key={r.id} title={r.cliente} sub={r.distrito} tag={<Pill tone="default">{r.id}</Pill>} onClick={() => onOpenRecojo(r.id)} />
        ))}
        {pendientesR.length === 0 && <EmptyHint text="No tienes recojos pendientes." />}
      </div>
    </div>
  );
}

function MiniRow({ title, sub, tag, onClick }) {
  return (
    <button onClick={onClick} style={S.miniRow}>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "#1A1A1A" }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "#5C6470" }}>{sub}</div>
      </div>
      {tag}
    </button>
  );
}

function EmptyHint({ text }) {
  return (
    <div style={{ background: "#F1F2F4", borderRadius: 14, padding: 20, textAlign: "center", color: "#5C6470", fontSize: 13.5 }}>
      {text}
    </div>
  );
}

// ================= ENTREGAS TAB =================
function EntregasTab({ entregas, onOpen }) {
  const pendientes = entregas.filter((o) => o.estado === "pendiente");
  const hechas = entregas.filter((o) => o.estado !== "pendiente");
  return (
    <div style={S.tabContent}>
      <div style={S.sectionLabel}>Pendientes ({pendientes.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
        {pendientes.map((o) => (
          <EntregaCard key={o.id} order={o} onClick={() => onOpen(o.id)} />
        ))}
        {pendientes.length === 0 && <EmptyHint text="No tienes entregas pendientes." />}
      </div>

      {hechas.length > 0 && (
        <>
          <div style={S.sectionLabel}>Realizadas hoy</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px 24px" }}>
            {hechas.map((o) => (
              <EntregaCard key={o.id} order={o} onClick={() => onOpen(o.id)} done />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EntregaCard({ order, onClick, done }) {
  return (
    <button onClick={onClick} style={{ ...S.card, opacity: done ? 0.65 : 1, textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={S.cardId}>{order.id}</div>
          <div style={S.cardTitle}>{order.cliente}</div>
          <div style={S.cardSub}>
            {Icon.map("#FF6B1A")} <span style={{ marginLeft: 4 }}>{order.distrito}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          {order.estado === "entregado" && <Pill tone="green">Entregado</Pill>}
          {order.estado === "no_entregado" && <Pill tone="red">No entregado</Pill>}
          {order.estado === "pendiente" && <Pill tone="orange">{order.tipoEntrega}</Pill>}
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {order.metodoPago === "Ya pagado" ? "Pagado" : `S/ ${order.monto.toFixed(2)}`}
          </div>
        </div>
      </div>
    </button>
  );
}

function EntregaDetailScreen({ order, onBack, onSave }) {
  const [showActions, setShowActions] = useState(null); // null | 'entregar' | 'no_entregar'
  const [foto, setFoto] = useState(order.evidencia?.foto || null);
  const [firmaImg, setFirmaImg] = useState(order.evidencia?.firmaImg || null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [dni, setDni] = useState(order.evidencia?.dni || "");
  const [metodoFinal, setMetodoFinal] = useState(order.metodoPago === "Ya pagado" ? "Efectivo" : order.metodoPago);
  const [montoFinal, setMontoFinal] = useState(order.monto);
  const [motivoNoEntrega, setMotivoNoEntrega] = useState(NO_ENTREGA_MOTIVOS[0]);
  const [paqueteEscaneado, setPaqueteEscaneado] = useState(order.evidencia?.paqueteEscaneado || null);
  const [showScanner, setShowScanner] = useState(false);
  const [formError, setFormError] = useState("");
  const fileRef = useRef(null);

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFoto(url);
  }

  function confirmarEntrega() {
    if (!foto) {
      setFormError("Toma una foto de la entrega antes de confirmar.");
      return;
    }
    if (!dni.trim()) {
      setFormError("Completa el DNI de quien recibe.");
      return;
    }
    if (!montoFinal || isNaN(montoFinal)) {
      setFormError("Ingresa el monto cobrado.");
      return;
    }
    setFormError("");
    onSave({
      ...order,
      estado: "entregado",
      metodoPago: metodoFinal,
      monto: parseFloat(montoFinal),
      evidencia: {
        foto,
        firmaImg,
        dni,
        metodo: metodoFinal,
        montoCobrado: parseFloat(montoFinal),
        paqueteEscaneado,
        hora: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
      },
    });
  }

  function confirmarNoEntrega() {
    onSave({
      ...order,
      estado: "no_entregado",
      evidencia: { motivo: motivoNoEntrega, hora: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) },
    });
  }

  const telLink = `tel:${order.telefono}`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${order.lat},${order.lng}`;

  return (
    <div style={S.screen}>
      <TopBar title={order.id} subtitle={order.distrito} onBack={onBack} />

      <div style={{ flex: 1, padding: "0 20px 160px", overflowY: "auto" }}>
        <Section title="Cliente">
          <InfoRow label="Nombre" value={order.cliente} />
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <a href={telLink} target="_top" rel="noopener noreferrer" style={S.actionBtnSecondary}>
              {Icon.phone("#1A1A1A")} <span style={{ marginLeft: 6 }}>Llamar</span>
            </a>
            <a href={mapLink} target="_top" rel="noopener noreferrer" style={S.actionBtnSecondary}>
              {Icon.map("#1A1A1A")} <span style={{ marginLeft: 6 }}>Abrir mapa</span>
            </a>
          </div>
          <div style={{ fontSize: 13.5, color: "#5C6470", marginTop: 10 }}>{order.direccion}, {order.distrito}</div>
        </Section>

        <Section title="Cobro">
          <div style={S.paymentBox}>
            <div>
              <div style={{ fontSize: 13, color: "#5C6470", fontWeight: 600 }}>{order.tipoEntrega}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A" }}>
                {order.metodoPago === "Ya pagado" ? "S/ 0.00" : `S/ ${order.monto.toFixed(2)}`}
              </div>
              <div style={{ fontSize: 11.5, color: "#5C6470", marginTop: 2 }}>Monto asignado por administración</div>
            </div>
            <Pill tone={order.metodoPago === "Ya pagado" ? "green" : "orange"}>{order.metodoPago}</Pill>
          </div>
        </Section>

        {order.notas && (
          <Section title="Información adicional">
            <div style={S.notesBox}>{order.notas}</div>
          </Section>
        )}

        {order.estado === "pendiente" && (
          <Section title="Registrar resultado">
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowActions(showActions === "entregar" ? null : "entregar")}
                style={{ ...S.toggleBtn, ...(showActions === "entregar" ? S.toggleBtnActiveGreen : {}) }}
              >
                Entregado
              </button>
              <button
                onClick={() => setShowActions(showActions === "no_entregar" ? null : "no_entregar")}
                style={{ ...S.toggleBtn, ...(showActions === "no_entregar" ? S.toggleBtnActiveRed : {}) }}
              >
                No entregado
              </button>
            </div>

            {showActions === "entregar" && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={S.fieldLabel}>Paquete (opcional)</div>
                  {paqueteEscaneado ? (
                    <div style={S.scanRowLight}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#1A1A1A" }}>{paqueteEscaneado}</span>
                      <button onClick={() => setShowScanner(true)} style={{ ...S.miniActionGreen, background: "#5C6470" }}>
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setShowScanner(true)} style={S.scanInlineCta}>
                      {Icon.barcode("#5C6470")}
                      <span style={{ fontSize: 13, color: "#5C6470", marginLeft: 8 }}>Escanear paquete (informativo)</span>
                    </button>
                  )}
                </div>

                <div>
                  <div style={S.fieldLabel}>Foto de la entrega</div>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />
                  {foto ? (
                    <div style={{ position: "relative" }}>
                      <img src={foto} alt="Evidencia de entrega" style={S.photoPreview} />
                      <button onClick={() => fileRef.current.click()} style={S.retakeBtn}>
                        Retomar foto
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current.click()} style={S.photoCta}>
                      {Icon.camera("#5C6470")}
                      <span style={{ fontSize: 13, color: "#5C6470", marginTop: 6 }}>Tomar foto</span>
                    </button>
                  )}
                </div>

                <div>
                  <div style={S.fieldLabel}>Firma del cliente (opcional)</div>
                  {firmaImg ? (
                    <div style={{ position: "relative" }}>
                      <img src={firmaImg} alt="Firma del cliente" style={S.signaturePreview} />
                      <button onClick={() => setShowSignaturePad(true)} style={S.retakeBtn}>
                        Rehacer firma
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setShowSignaturePad(true)} style={S.photoCta}>
                      {Icon.edit("#5C6470")}
                      <span style={{ fontSize: 13, color: "#5C6470", marginTop: 6 }}>Firmar en pantalla</span>
                    </button>
                  )}
                </div>

                <div>
                  <div style={S.fieldLabel}>DNI de quien recibe</div>
                  <input value={dni} onChange={(e) => setDni(e.target.value)} placeholder="Ej. 70123456" style={S.input} inputMode="numeric" />
                </div>

                <div>
                  <div style={S.fieldLabel}>Forma de pago</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["Efectivo", "Yape / Plin", "POS"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMetodoFinal(m)}
                        style={{ ...S.choiceChip, ...(metodoFinal === m ? S.choiceChipActive : {}) }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={S.fieldLabel}>Monto cobrado (S/)</div>
                  <input
                    value={montoFinal}
                    onChange={(e) => setMontoFinal(e.target.value)}
                    placeholder="0.00"
                    style={S.input}
                    inputMode="decimal"
                  />
                  <div style={{ fontSize: 11.5, color: "#9AA0AA", marginTop: 4 }}>
                    Editable si cobraste un monto distinto al asignado por administración.
                  </div>
                </div>

                {formError && <div style={{ color: "#C13515", fontSize: 13 }}>{formError}</div>}
                <button style={{ ...S.primaryBtn, background: "#2E7D32" }} onClick={confirmarEntrega}>
                  Confirmar entrega
                </button>
              </div>
            )}

            {showActions === "no_entregar" && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={S.fieldLabel}>Motivo</div>
                  <select value={motivoNoEntrega} onChange={(e) => setMotivoNoEntrega(e.target.value)} style={S.input}>
                    {NO_ENTREGA_MOTIVOS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <button style={{ ...S.primaryBtn, background: "#C13515" }} onClick={confirmarNoEntrega}>
                  Confirmar no entregado
                </button>
              </div>
            )}
          </Section>
        )}

        {order.estado !== "pendiente" && (
          <Section title="Resultado registrado">
            <div style={S.notesBox}>
              {order.estado === "entregado" ? (
                <>
                  Entregado a las {order.evidencia?.hora} · DNI: {order.evidencia?.dni} · Pago: {order.evidencia?.metodo} · Monto: S/{" "}
                  {order.evidencia?.montoCobrado?.toFixed(2)}
                </>
              ) : (
                <>
                  No entregado a las {order.evidencia?.hora} · Motivo: {order.evidencia?.motivo}
                </>
              )}
            </div>
          </Section>
        )}
      </div>

      {showSignaturePad && (
        <SignaturePad
          onClose={() => setShowSignaturePad(false)}
          onSave={(dataUrl) => {
            setFirmaImg(dataUrl);
            setShowSignaturePad(false);
          }}
        />
      )}

      {showScanner && (
        <ScannerModal
          title="Escanear paquete del cliente"
          onClose={() => setShowScanner(false)}
          onConfirm={(code) => {
            setPaqueteEscaneado(code);
            setShowScanner(false);
          }}
        />
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ ...S.sectionLabel, padding: "0 0 8px" }}>{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#5C6470", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 15, color: "#1A1A1A", marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ---------------- Scanner modal (camera-style overlay + manual code entry) ----------------
function ScannerModal({ onClose, onConfirm, title = "Escanear paquete", errorMessage }) {
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualVal, setManualVal] = useState("");
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  function fakeScan() {
    setScanning(true);
    timeoutRef.current = setTimeout(() => {
      setScanning(false);
      // En producción esto vendría del lector real de cámara (ej. librería ZXing).
      // Aquí simulamos la lectura pidiendo confirmación del código detectado.
      setManualMode(true);
    }, 1100);
  }

  function confirm() {
    if (!manualVal.trim()) return;
    onConfirm(manualVal.trim());
  }

  return (
    <div style={S.modalOverlay}>
      <div style={{ ...S.modalCard, background: "#101114" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#FAFAFA", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "#9AA0AA", marginBottom: 10 }}>
          Apunta la cámara al código de barras del paquete o escríbelo manualmente.
        </div>

        <div style={S.scanFrame}>
          {scanning ? (
            <div style={S.scanLineAnim} />
          ) : (
            <button onClick={fakeScan} style={S.scanCta}>
              {Icon.barcode()}
              <span style={{ color: "#FAFAFA", fontSize: 12.5, marginTop: 6 }}>Tocar para escanear</span>
            </button>
          )}
        </div>

        <button onClick={() => setManualMode((v) => !v)} style={S.manualLink}>
          {manualMode ? "Ocultar entrada manual" : "Escribir el código manualmente"}
        </button>

        {manualMode && (
          <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input
              value={manualVal}
              onChange={(e) => setManualVal(e.target.value)}
              placeholder="Ej. MLAPE0005605668TEM"
              style={{ ...S.input, background: "#1F2024", color: "#FAFAFA", border: "1px solid #3A3D42" }}
              autoFocus
            />
          </div>
        )}

        {errorMessage && <div style={{ color: "#FF8A6B", fontSize: 12.5, marginBottom: 8 }}>{errorMessage}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button onClick={onClose} style={{ ...S.actionBtnSecondary, flex: 1, background: "#1F2024", color: "#FAFAFA" }}>
            Cancelar
          </button>
          <button onClick={confirm} disabled={!manualVal.trim()} style={{ ...S.primaryBtn, flex: 1, padding: "11px 0", opacity: manualVal.trim() ? 1 : 0.5 }}>
            Confirmar código
          </button>
        </div>
      </div>
    </div>
  );
}
function SignaturePad({ onSave, onClose }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function start(e) {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1A1A1A";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.stroke();
    hasDrawn.current = true;
  }
  function end(e) {
    e.preventDefault();
    drawing.current = false;
  }
  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
  }
  function save() {
    if (!hasDrawn.current) {
      onClose();
      return;
    }
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSave(dataUrl);
  }

  return (
    <div style={S.modalOverlay}>
      <div style={S.modalCard}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1A1A", marginBottom: 4 }}>Firma del cliente</div>
        <div style={{ fontSize: 12.5, color: "#5C6470", marginBottom: 10 }}>Pide al cliente que firme con el dedo dentro del recuadro.</div>
        <canvas
          ref={canvasRef}
          width={320}
          height={180}
          style={S.signatureCanvas}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={clear} style={{ ...S.actionBtnSecondary, flex: 1 }}>
            Limpiar
          </button>
          <button onClick={onClose} style={{ ...S.actionBtnSecondary, flex: 1 }}>
            Cancelar
          </button>
          <button onClick={save} style={{ ...S.primaryBtn, flex: 1, padding: "11px 0" }}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= RECOJOS TAB =================
function RecojosTab({ recojos, onOpen }) {
  const pendientes = recojos.filter((r) => r.estado === "pendiente");
  const hechos = recojos.filter((r) => r.estado === "completado");
  return (
    <div style={S.tabContent}>
      <div style={S.sectionLabel}>Pendientes ({pendientes.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
        {pendientes.map((r) => {
          const total = r.paquetesEsperados.length;
          const procesados = r.paquetesEsperados.filter((p) => p.escaneado || p.descartado).length;
          return (
            <button key={r.id} onClick={() => onOpen(r.id)} style={{ ...S.card, textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={S.cardId}>{r.id}</div>
                  <div style={S.cardTitle}>{r.cliente}</div>
                  <div style={S.cardSub}>
                    {Icon.map("#FF6B1A")} <span style={{ marginLeft: 4 }}>{r.distrito}</span>
                  </div>
                </div>
                <Pill tone={procesados === total ? "green" : "default"}>
                  {procesados}/{total} paquetes
                </Pill>
              </div>
            </button>
          );
        })}
        {pendientes.length === 0 && <EmptyHint text="No tienes recojos pendientes." />}
      </div>

      {hechos.length > 0 && (
        <>
          <div style={S.sectionLabel}>Completados</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px 24px" }}>
            {hechos.map((r) => (
              <div key={r.id} style={{ ...S.card, opacity: 0.65 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={S.cardId}>{r.id}</div>
                    <div style={S.cardTitle}>{r.cliente}</div>
                  </div>
                  <Pill tone="green">Completado</Pill>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RecojoDetailScreen({ recojo, onBack, onToggleScan, onToggleDescarte, onFinish }) {
  const total = recojo.paquetesEsperados.length;
  const escaneados = recojo.paquetesEsperados.filter((p) => p.escaneado).length;
  const descartados = recojo.paquetesEsperados.filter((p) => p.descartado).length;
  const allResolved = escaneados + descartados === total;
  const telLink = `tel:${recojo.telefono}`;
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState("");

  function handleScanConfirm(code) {
    const normalized = code.trim().toUpperCase();
    const match = recojo.paquetesEsperados.find(
      (p) => p.tracking.toUpperCase() === normalized && !p.escaneado && !p.descartado
    );
    if (match) {
      onToggleScan(match.id);
      setScanError("");
      setShowScanner(false);
    } else {
      setScanError("Ese código no coincide con ningún paquete pendiente de este recojo.");
    }
  }

  return (
    <div style={S.screen}>
      <TopBar title={recojo.id} subtitle={recojo.distrito} onBack={onBack} />

      <div style={{ flex: 1, padding: "0 20px 120px", overflowY: "auto" }}>
        <Section title="Cliente que envía">
          <InfoRow label="Negocio / Contacto" value={`${recojo.cliente} · ${recojo.contacto}`} />
          <a href={telLink} target="_top" rel="noopener noreferrer" style={{ ...S.actionBtnSecondary, marginTop: 10, display: "inline-flex" }}>
            {Icon.phone("#1A1A1A")} <span style={{ marginLeft: 6 }}>Llamar</span>
          </a>
          <div style={{ fontSize: 13.5, color: "#5C6470", marginTop: 10 }}>{recojo.direccion}, {recojo.distrito}</div>
        </Section>

        <Section title={`Control de carga (${escaneados + descartados}/${total} resueltos)`}>
          <div style={{ fontSize: 12.5, color: "#5C6470", marginBottom: 10 }}>
            Escanea cada paquete al recibirlo. Si el cliente no entrega alguno de los que confirmó, presiona{" "}
            <b>"No recibido"</b> para marcarlo como pendiente de ese recojo.
          </div>

          <button onClick={() => setShowScanner(true)} style={{ ...S.scanInlineCta, marginBottom: 12 }}>
            {Icon.barcode("#5C6470")}
            <span style={{ fontSize: 13.5, color: "#5C6470", marginLeft: 8, fontWeight: 600 }}>Escanear paquete</span>
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recojo.paquetesEsperados.map((p) => (
              <div key={p.id} style={S.scanRowLight}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: p.descartado ? "#A32B14" : "#1A1A1A" }}>{p.tracking}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {p.escaneado ? (
                    <Pill tone="green">Escaneado</Pill>
                  ) : p.descartado ? (
                    <Pill tone="red">No recibido</Pill>
                  ) : (
                    <button onClick={() => onToggleDescarte(p.id)} style={S.miniActionRed}>
                      No recibido
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {showScanner && (
        <ScannerModal
          title="Escanear paquete del recojo"
          onClose={() => {
            setShowScanner(false);
            setScanError("");
          }}
          onConfirm={handleScanConfirm}
          errorMessage={scanError}
        />
      )}

      <div style={S.bottomBar}>
        <button
          disabled={!allResolved}
          onClick={onFinish}
          style={{
            ...S.primaryBtn,
            background: allResolved ? "#FF6B1A" : "#EEF0F2",
            color: allResolved ? "#1A1A1A" : "#9AA0AA",
          }}
        >
          {allResolved ? "Finalizar recojo y generar boleta" : `Faltan ${total - escaneados - descartados} por resolver`}
        </button>
      </div>
    </div>
  );
}

function BoletaRecojoScreen({ recojo, onBack, onDone }) {
  const escaneados = recojo.paquetesEsperados.filter((p) => p.escaneado);
  const descartados = recojo.paquetesEsperados.filter((p) => p.descartado);
  const hora = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  const fecha = new Date().toLocaleDateString("es-PE");

  return (
    <div style={S.screen}>
      <TopBar title="Boleta de recojo" subtitle={recojo.id} onBack={onBack} />
      <div style={{ flex: 1, padding: "12px 20px 24px", overflowY: "auto" }}>
        <div style={S.labelCard}>
          <div style={S.labelTopRow}>
            <span style={S.labelService}>Boleta de recojo · {recojo.id}</span>
            <div style={S.labelPostage}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1A1A1A" }}>{fecha}</div>
              <div style={{ fontSize: 10, color: "#5C6470" }}>{hora}</div>
            </div>
          </div>

          <InfoRow label="Cliente" value={recojo.cliente} />
          <div style={{ height: 10 }} />
          <InfoRow label="Paquetes recibidos" value={`${escaneados.length} de ${recojo.paquetesEsperados.length}`} />

          {escaneados.length > 0 && (
            <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 12, color: "#1A1A1A" }}>
              {escaneados.map((p) => (
                <div key={p.id}>✓ {p.tracking}</div>
              ))}
            </div>
          )}
          {descartados.length > 0 && (
            <div style={{ marginTop: 8, fontFamily: FONT_MONO, fontSize: 12, color: "#A32B14" }}>
              {descartados.map((p) => (
                <div key={p.id}>✕ {p.tracking} — no recibido</div>
              ))}
            </div>
          )}

          <div style={S.labelDivider} />
          <div style={{ fontSize: 11.5, color: "#5C6470" }}>
            Se enviará una copia de esta boleta a <b>{recojo.correoCliente}</b> con la hora y el detalle del recojo.
          </div>
        </div>
      </div>
      <div style={{ padding: "0 20px 28px" }}>
        <button style={{ ...S.primaryBtn, width: "100%" }} onClick={onDone}>
          Enviar boleta por correo y finalizar
        </button>
      </div>
    </div>
  );
}

// ================= ESTADÍSTICAS TAB =================
function EstadisticasTab({ entregas }) {
  const entregados = entregas.filter((o) => o.estado === "entregado").length;
  const noEntregados = entregas.filter((o) => o.estado === "no_entregado").length;
  const kmHoy = KM_HISTORY[KM_HISTORY.length - 1].km;
  const maxKm = Math.max(...KM_HISTORY.map((d) => d.km));

  return (
    <div style={S.tabContent}>
      <div style={S.summaryRow}>
        <div style={S.summaryCard}>
          <div style={S.summaryNum}>{entregados}</div>
          <div style={S.summaryLabel}>Entregadas</div>
        </div>
        <div style={S.summaryCard}>
          <div style={{ ...S.summaryNum, color: "#C13515" }}>{noEntregados}</div>
          <div style={S.summaryLabel}>No entregadas</div>
        </div>
        <div style={S.summaryCard}>
          <div style={S.summaryNum}>{kmHoy} km</div>
          <div style={S.summaryLabel}>Recorridos hoy</div>
        </div>
      </div>

      <div style={S.sectionLabel}>Kilómetros recorridos · últimos 7 días</div>
      <div style={{ padding: "4px 20px 28px" }}>
        <div style={S.chartCard}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
            {KM_HISTORY.map((d, i) => {
              const h = (d.km / maxKm) * 110;
              const isToday = i === KM_HISTORY.length - 1;
              return (
                <div key={d.dia} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 10.5, color: "#5C6470", fontWeight: 700 }}>{d.km}</div>
                  <div
                    style={{
                      width: "100%",
                      height: h,
                      background: isToday ? "#FF6B1A" : "#1A1A1A",
                      borderRadius: 6,
                    }}
                  />
                  <div style={{ fontSize: 11, color: isToday ? "#FF6B1A" : "#5C6470", fontWeight: isToday ? 700 : 500 }}>{d.dia}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= PERFIL TAB =================
function PerfilTab({ onLogout }) {
  return (
    <div style={S.tabContent}>
      <div style={{ padding: "8px 20px" }}>
        <div style={S.card}>
          <div style={{ fontSize: 12, color: "#5C6470", fontWeight: 700, textTransform: "uppercase" }}>Usuario</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A", marginTop: 4 }}>motorizado1</div>
          <div style={{ fontSize: 13, color: "#5C6470", marginTop: 2 }}>Zona asignada: Lima Norte</div>
        </div>
        <button onClick={onLogout} style={{ ...S.primaryBtn, background: "#1A1A1A", marginTop: 16 }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ================= App shell =================
const TABS = [
  { key: "resumen", label: "Hoy", icon: Icon.home },
  { key: "entregas", label: "Entregas", icon: Icon.box },
  { key: "recojos", label: "Recojos", icon: Icon.map },
  { key: "stats", label: "Estadísticas", icon: Icon.chart },
  { key: "perfil", label: "Perfil", icon: Icon.user },
];

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("resumen");
  const [entregas, setEntregas] = useState(SEED_ENTREGAS);
  const [recojos, setRecojos] = useState(SEED_RECOJOS);
  const [view, setView] = useState({ name: "tabs" }); // tabs | entrega-detail | recojo-detail | recojo-boleta

  function openEntrega(id) {
    setView({ name: "entrega-detail", id });
  }
  function openRecojo(id) {
    setView({ name: "recojo-detail", id });
  }
  function saveEntrega(updated) {
    setEntregas((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setView({ name: "tabs" });
    setTab("entregas");
  }
  function toggleScan(recojoId, pkgId) {
    setRecojos((prev) =>
      prev.map((r) =>
        r.id !== recojoId
          ? r
          : { ...r, paquetesEsperados: r.paquetesEsperados.map((p) => (p.id === pkgId ? { ...p, escaneado: true, descartado: false } : p)) }
      )
    );
  }
  function toggleDescarte(recojoId, pkgId) {
    setRecojos((prev) =>
      prev.map((r) =>
        r.id !== recojoId
          ? r
          : { ...r, paquetesEsperados: r.paquetesEsperados.map((p) => (p.id === pkgId ? { ...p, descartado: true, escaneado: false } : p)) }
      )
    );
  }
  function finishRecojo(recojoId) {
    setView({ name: "recojo-boleta", id: recojoId });
  }
  function completeRecojo(recojoId) {
    setRecojos((prev) => prev.map((r) => (r.id === recojoId ? { ...r, estado: "completado" } : r)));
    setView({ name: "tabs" });
    setTab("recojos");
  }

  const currentEntrega = entregas.find((o) => o.id === view.id);
  const currentRecojo = recojos.find((r) => r.id === view.id);

  if (!authed) return <div className="coupe-app" style={S.app}><div className="coupe-phone-frame" style={S.phoneFrame}><LoginScreen onLogin={() => setAuthed(true)} /></div></div>;

  return (
    <div className="coupe-app" style={S.app}>
      <div className="coupe-phone-frame" style={S.phoneFrame}>
        {view.name === "tabs" && (
          <div style={S.screen}>
            <TopBar title={TABS.find((t) => t.key === tab).label} subtitle={tab === "resumen" ? todayLabel() : undefined} />
            <div style={{ flex: 1, overflowY: "auto" }}>
              {tab === "resumen" && (
                <ResumenTab entregas={entregas} recojos={recojos} onOpenEntrega={openEntrega} onOpenRecojo={openRecojo} />
              )}
              {tab === "entregas" && <EntregasTab entregas={entregas} onOpen={openEntrega} />}
              {tab === "recojos" && <RecojosTab recojos={recojos} onOpen={openRecojo} />}
              {tab === "stats" && <EstadisticasTab entregas={entregas} />}
              {tab === "perfil" && <PerfilTab onLogout={() => setAuthed(false)} />}
            </div>
            <div style={S.tabBar}>
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)} style={S.tabBtn}>
                  {t.icon(tab === t.key ? "#FF6B1A" : "#9AA0AA")}
                  <span style={{ fontSize: 10.5, color: tab === t.key ? "#FF6B1A" : "#9AA0AA", fontWeight: tab === t.key ? 700 : 500, marginTop: 2 }}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {view.name === "entrega-detail" && currentEntrega && (
          <EntregaDetailScreen order={currentEntrega} onBack={() => setView({ name: "tabs" })} onSave={saveEntrega} />
        )}

        {view.name === "recojo-detail" && currentRecojo && (
          <RecojoDetailScreen
            recojo={currentRecojo}
            onBack={() => setView({ name: "tabs" })}
            onToggleScan={(pkgId) => toggleScan(currentRecojo.id, pkgId)}
            onToggleDescarte={(pkgId) => toggleDescarte(currentRecojo.id, pkgId)}
            onFinish={() => finishRecojo(currentRecojo.id)}
          />
        )}

        {view.name === "recojo-boleta" && currentRecojo && (
          <BoletaRecojoScreen recojo={currentRecojo} onBack={() => setView({ name: "recojo-detail", id: currentRecojo.id })} onDone={() => completeRecojo(currentRecojo.id)} />
        )}
      </div>
    </div>
  );
}

// ---------------- Styles ----------------
const FONT_DISPLAY = "'Oswald', 'Arial Narrow', sans-serif";
const FONT_BODY = "'Inter', 'Helvetica Neue', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

const S = {
  app: { minHeight: "100vh", background: "#E7E9EC", display: "flex", justifyContent: "center", padding: "20px 0", fontFamily: FONT_BODY },
  phoneFrame: {
    width: 390,
    height: 780,
    background: "#FAFAFA",
    borderRadius: 28,
    overflow: "hidden",
    boxShadow: "0 30px 60px -20px rgba(0,0,0,0.35)",
    border: "1px solid #D8DBDF",
    display: "flex",
    flexDirection: "column",
  },
  screen: { flex: 1, background: "#FAFAFA", display: "flex", flexDirection: "column", position: "relative", minHeight: 0, overflow: "hidden" },
  topbar: { background: "#1A1A1A", padding: "20px 20px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  topbarTitle: { color: "#FAFAFA", fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 600 },
  topbarSubtitle: { color: "#9AA0AA", fontSize: 12.5, marginTop: 2, textTransform: "capitalize" },
  logoMark: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15 },
  iconBtnDark: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  tabContent: { paddingBottom: 12 },
  summaryRow: { display: "flex", gap: 10, padding: "16px 20px 4px" },
  summaryCard: { flex: 1, background: "#F1F2F4", borderRadius: 14, padding: "12px 10px", textAlign: "center" },
  summaryNum: { fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 700, color: "#1A1A1A" },
  summaryLabel: { fontSize: 10.5, color: "#5C6470", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.03em" },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: "#5C6470", textTransform: "uppercase", letterSpacing: "0.05em", padding: "18px 20px 8px" },
  miniRow: { width: "100%", background: "#FFFFFF", border: "1px solid #ECEDEF", borderRadius: 14, padding: "13px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" },
  card: { background: "#FFFFFF", border: "1px solid #ECEDEF", borderRadius: 16, padding: 16, cursor: "pointer", width: "100%" },
  cardId: { fontFamily: FONT_MONO, fontSize: 11.5, color: "#FF6B1A", fontWeight: 700, marginBottom: 4 },
  cardTitle: { fontSize: 15.5, fontWeight: 700, color: "#1A1A1A" },
  cardSub: { display: "flex", alignItems: "center", fontSize: 12.5, color: "#5C6470", marginTop: 4 },
  fieldLabel: { fontSize: 11.5, fontWeight: 700, color: "#5C6470", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #DDE0E3", borderRadius: 12, padding: "12px 14px", fontSize: 14.5, fontFamily: FONT_BODY, background: "#FFFFFF" },
  primaryBtn: { background: "#FF6B1A", color: "#1A1A1A", border: "none", borderRadius: 14, padding: "15px 0", fontSize: 15.5, fontWeight: 700, cursor: "pointer", width: "100%" },
  actionBtnSecondary: { flex: 1, background: "#F1F2F4", border: "1px solid #E2E4E7", borderRadius: 12, padding: "11px 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13.5, fontWeight: 700, color: "#1A1A1A", textDecoration: "none" },
  paymentBox: { background: "#FFF6EF", border: "1px solid #FFE0C7", borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  notesBox: { background: "#F1F2F4", borderRadius: 14, padding: "14px 16px", fontSize: 13.5, color: "#3A3D42", lineHeight: 1.5 },
  toggleBtn: { flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #DDE0E3", background: "#FFFFFF", fontWeight: 700, fontSize: 13.5, color: "#5C6470", cursor: "pointer" },
  toggleBtnActiveGreen: { borderColor: "#2E7D32", color: "#2E7D32", background: "#E3F1E4" },
  toggleBtnActiveRed: { borderColor: "#C13515", color: "#C13515", background: "#FBE4E0" },
  photoCta: { width: "100%", border: "1.5px dashed #C9CDD3", borderRadius: 14, padding: "26px 0", background: "#F8F9FA", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" },
  photoPreview: { width: "100%", borderRadius: 14, display: "block", maxHeight: 220, objectFit: "cover" },
  retakeBtn: { position: "absolute", bottom: 10, right: 10, background: "rgba(26,26,26,0.75)", color: "#FAFAFA", border: "none", borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  choiceChip: { flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid #DDE0E3", background: "#FFFFFF", fontSize: 12, fontWeight: 700, color: "#5C6470", cursor: "pointer" },
  choiceChipActive: { borderColor: "#FF6B1A", color: "#C24A00", background: "#FFE8D9" },
  bottomBar: { flexShrink: 0, background: "#FAFAFA", borderTop: "1px solid #ECEDEF", padding: "14px 20px 20px" },
  scanRowLight: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8F9FA", borderRadius: 10, padding: "10px 12px" },
  miniActionGreen: { background: "#2E7D32", color: "#FAFAFA", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" },
  miniActionRed: { background: "#FBE4E0", color: "#A32B14", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" },
  labelCard: { background: "#FFFFFF", border: "1px solid #C9CDD3", borderRadius: 4, padding: 16, boxShadow: "0 6px 18px rgba(0,0,0,0.08)" },
  labelTopRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #C9CDD3", paddingBottom: 10, marginBottom: 10 },
  labelService: { fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 600, fontStyle: "italic", color: "#1A1A1A" },
  labelPostage: { border: "1px solid #C9CDD3", borderRadius: 4, padding: "4px 8px", textAlign: "center" },
  labelDivider: { height: 1, background: "#C9CDD3", margin: "12px 0" },
  chartCard: { background: "#FFFFFF", border: "1px solid #ECEDEF", borderRadius: 16, padding: "20px 16px" },
  tabBar: { display: "flex", borderTop: "1px solid #ECEDEF", background: "#FFFFFF", padding: "8px 4px 14px" },
  tabBtn: { flex: 1, background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", padding: "4px 0" },

  // Modal genérico (firma / escáner)
  modalOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: 20,
  },
  modalCard: {
    background: "#FAFAFA",
    borderRadius: 18,
    padding: 18,
    width: "100%",
    maxWidth: 340,
    boxShadow: "0 24px 50px rgba(0,0,0,0.35)",
  },

  // Firma
  signatureCanvas: {
    width: "100%",
    background: "#FFFFFF",
    border: "1.5px dashed #C9CDD3",
    borderRadius: 12,
    touchAction: "none",
    display: "block",
  },
  signaturePreview: { width: "100%", borderRadius: 14, display: "block", background: "#FFFFFF", border: "1px solid #ECEDEF" },

  // Escáner inline (dentro del detalle, no modal)
  scanInlineCta: {
    width: "100%",
    border: "1.5px dashed #C9CDD3",
    borderRadius: 12,
    padding: "12px 14px",
    background: "#F8F9FA",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },

  // Escáner dentro del modal (estilo cámara oscura)
  scanFrame: {
    width: "100%",
    height: 180,
    border: "2px solid #FAFAFA",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    background: "rgba(255,255,255,0.04)",
    marginBottom: 10,
  },
  scanCta: { background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" },
  scanLineAnim: {
    position: "absolute",
    left: 10,
    right: 10,
    top: "48%",
    height: 2,
    background: "#2ED957",
    boxShadow: "0 0 10px #2ED957",
    animation: "coupeScanMove 1.1s linear infinite",
  },
  manualLink: { background: "transparent", border: "none", color: "#FAFAFA", textDecoration: "underline", fontSize: 12.5, cursor: "pointer", padding: "4px 0 10px", textAlign: "left" },
};

// keyframes injection (animación de la línea de escaneo)
if (typeof document !== "undefined" && !document.getElementById("coupe-keyframes")) {
  const styleTag = document.createElement("style");
  styleTag.id = "coupe-keyframes";
  styleTag.innerHTML = `
@keyframes coupeScanMove {
  0% { top: 12%; }
  50% { top: 84%; }
  100% { top: 12%; }
}
`;
  document.head.appendChild(styleTag);
}
