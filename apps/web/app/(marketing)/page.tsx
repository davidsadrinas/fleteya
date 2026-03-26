import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing-navbar";

function Hero() {
  return (
    <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Soft organic background shapes */}
      <div className="absolute top-20 right-0 w-72 h-72 bg-brand-mint-pale rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-0 left-10 w-56 h-56 bg-brand-sunshine-light rounded-full blur-3xl opacity-30" />
      <div className="absolute top-40 left-1/3 w-40 h-40 bg-brand-coral-light/20 rounded-full blur-2xl" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-teal-pale border border-brand-teal-light/30 text-brand-teal-light text-sm font-semibold font-heading mb-8">
          <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
          Disponible en AMBA
        </div>
        <h1 className="text-[2.25rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold mb-6 text-fy-text">
          Tu flete,{" "}
          <span className="text-brand-amber">simple</span>
          <br />
          y rápido.
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-fy-soft max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-body">
          Marketplace de fletes en AMBA: vos publicás el envío, los fleteros <strong className="text-fy-text font-semibold">se postulan</strong> y FleteYa <strong className="text-fy-text font-semibold">asigna</strong> al mejor candidato según <strong className="text-fy-text font-semibold">cercanía y reputación</strong>.
          Aprovechá <span className="text-brand-amber font-bold">viajes de retorno</span> y <span className="text-brand-amber font-bold">tramos encadenados</span> para pagar menos.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center max-w-lg sm:max-w-none mx-auto">
          <Link
            href="/login?role=client"
            className="btn-primary text-base sm:text-lg !py-3.5 sm:!py-4 !px-6 sm:!px-8 min-h-[48px] flex items-center justify-center text-center"
          >
            📦 Necesito un flete
          </Link>
          <Link
            href="/login?role=driver"
            className="btn-secondary text-base sm:text-lg !py-3.5 sm:!py-4 !px-6 sm:!px-8 min-h-[48px] flex items-center justify-center text-center"
          >
            🚛 Soy fletero
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-12 text-fy-soft text-sm font-heading">
          <span>✓ Publicás sin elegir fletero a mano</span>
          <span>✓ Precio y tramos claros antes de pagar</span>
          <span>✓ Tracking y pagos por MercadoPago</span>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 border-y border-fy-border bg-fy-bg-warm/40">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { value: "Retorno", label: "cargas que optimizan el viaje de vuelta", color: "text-brand-amber" },
          { value: "22%", label: "comisión transparente por viaje", color: "text-brand-teal-light" },
          { value: "Postulá", label: "fleteros compiten; la app asigna", color: "text-brand-teal" },
          { value: "Encadená", label: "más tramos, descuentos acumulados", color: "text-brand-amber" },
        ].map((s) => (
          <div key={s.label}>
            <div className={`text-3xl md:text-4xl font-display font-extrabold ${s.color}`}>
              {s.value}
            </div>
            <div className="text-fy-soft text-sm mt-1 font-body">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-tag mb-4 inline-block">Así de fácil</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-fy-text mt-3">
            ¿Cómo funciona?
          </h2>
          <p className="text-fy-soft mt-3 max-w-2xl mx-auto">
            No hace falta que elijas conductor en un listado: la plataforma equipara <strong className="text-fy-text">quién está cerca</strong> (incluido quien termina un viaje y queda bien ubicado para el siguiente) con <strong className="text-fy-text">quién tiene mejor historial</strong> en la app.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: "1",
              icon: "📦",
              title: "Publicás el envío",
              desc: "Ruta, tipo de carga, ventana horaria y necesidades (ayudantes, tipo de vehículo). Podés sumar varios tramos: cuanto más encadenás, mejor suele ser el precio por kilómetro.",
              bg: "bg-brand-amber/10",
              accent: "bg-brand-amber",
            },
            {
              step: "2",
              icon: "🙋",
              title: "Se postulan fleteros",
              desc: "Conductores verificados muestran interés. En la app vas a ver el estado “esperando asignación” mientras se reúnen postulaciones y se evalúa cercanía.",
              bg: "bg-brand-teal-pale",
              accent: "bg-brand-teal",
            },
            {
              step: "3",
              icon: "⚖️",
              title: "FleteYa asigna",
              desc: "Asignación on-demand con reglas claras: primero rangos de cercanía al retiro, dentro de cada rango gana la mejor valoración. Si un fletero termina un viaje cerca de tu origen, entra con ventaja para encadenar.",
              bg: "bg-brand-amber/10",
              accent: "bg-brand-amber",
            },
            {
              step: "4",
              icon: "📍",
              title: "Pagás y seguís",
              desc: "Confirmás con precio cerrado (MercadoPago), tracking GPS durante el servicio y registro del viaje para reseñas.",
              bg: "bg-brand-teal-pale",
              accent: "bg-brand-teal",
            },
          ].map((item) => (
            <div key={item.step} className="card text-center !border-transparent hover:shadow-md transition-shadow">
              <div className={`w-16 h-16 ${item.bg} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4`}>
                {item.icon}
              </div>
              <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${item.accent} text-white text-xs font-bold font-heading mb-3`}>
                {item.step}
              </div>
              <h3 className="text-lg font-display font-bold text-fy-text mb-2">
                {item.title}
              </h3>
              <p className="text-fy-soft text-sm leading-relaxed text-left">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForDrivers() {
  return (
    <section id="fleteros" className="py-16 sm:py-20 px-4 sm:px-6 bg-brand-navy relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-amber/10 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-brand-teal-light text-xs font-bold font-heading tracking-wide mb-4">
            Para fleteros
          </span>
          <p className="text-brand-teal-light/90 text-sm max-w-2xl mx-auto mt-4 leading-relaxed">
            No competís a ciegas con listados eternos: <strong className="text-white">postulás</strong> a los envíos que te cierran por ruta y horario. La app prioriza <strong className="text-white">cercanía real</strong> (tu GPS y, si tenés un viaje activo, dónde terminás) y después <strong className="text-white">tu valoración</strong>. Encadenar varios servicios en el día te acerca a los retiros siguientes y mejora tu perfil para seguir viajando con descuento al cliente.
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mt-10">
            No vuelvas vacío.
            <br />
            <span className="text-brand-amber">Monetizá cada kilómetro.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: "🎯",
              title: "Postulaciones claras",
              desc: "Entrás al pool de cargas abiertas, mandás tu ubicación y FleteYa analiza quién encaja mejor para cada envío en el momento.",
            },
            {
              icon: "🔗",
              title: "Encadená el día",
              desc: "Si terminás una entrega cerca del próximo retiro, ganás prioridad en cercanía: más viajes seguidos y menos tiempo muerto.",
            },
            {
              icon: "⭐",
              title: "Tu rating importa",
              desc: "Dentro del mismo radio, gana quien mejor se comporta con clientes en la plataforma. Hacé foco en puntualidad y comunicación.",
            },
            {
              icon: "📱",
              title: "Operación en la app",
              desc: "Solicitudes, estados del viaje, tracking y cobros digitalizados. Documentación de flota según las reglas del marketplace.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex gap-4">
              <div className="text-2xl">{item.icon}</div>
              <div>
                <h3 className="font-heading font-bold text-white mb-1">{item.title}</h3>
                <p className="text-brand-teal-light/80 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/login?role=driver" className="btn-primary text-lg !py-4 !px-8">
            Registrarme como fletero →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="section-tag mb-4 inline-block">Testimonios</span>
          <h2 className="text-3xl font-display font-bold text-fy-text mt-3">
            Lo que dicen nuestros usuarios
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Laura P.", role: "Cliente", text: "Mudé mi depto por la mitad de lo que me cotizaron afuera. El fletero llegó puntual y con la app pude seguir todo.", rating: 5 },
            { name: "Carlos M.", role: "Fletero", text: "Postulo a lo que me queda de camino después de cada entrega. Encadenar dos o tres por día cambió mis números.", rating: 5 },
            { name: "Martín R.", role: "Cliente", text: "Publiqué el flete de materiales, vi el estado de asignación y cuando tocó ya tenía conductor con precio cerrado y tracking.", rating: 5 },
          ].map((r) => (
            <div key={r.name} className="card hover:shadow-md transition-shadow">
              <div className="text-brand-amber text-sm mb-3">
                {"★".repeat(r.rating)}
              </div>
              <p className="text-sm text-fy-soft leading-relaxed mb-4">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-teal-pale flex items-center justify-center text-brand-teal-light text-xs font-bold font-heading">
                  {r.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold font-heading text-fy-text">{r.name}</div>
                  <div className="text-xs text-fy-soft">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="precios" className="py-16 sm:py-20 px-4 sm:px-6 bg-fy-bg-warm/40">
      <div className="max-w-3xl mx-auto text-center">
        <span className="section-tag mb-4 inline-block">Precios</span>
        <h2 className="text-3xl font-display font-bold text-fy-text mt-3 mb-4">
          Transparente y simple
        </h2>
        <p className="text-fy-soft mb-12 max-w-lg mx-auto">
          Sin suscripción para publicar ni para postular. La comisión financia la plataforma, el matching y los pagos; el precio del viaje lo ves cerrado antes de pagar.
        </p>
        <div className="card max-w-md mx-auto text-left !p-6 border-brand-teal-light/30">
          <div className="text-sm text-brand-teal-light font-bold font-heading tracking-wide uppercase mb-2">
            Comisión por viaje
          </div>
          <div className="text-5xl font-display font-extrabold text-brand-amber mb-2">
            22%
          </div>
          <div className="text-fy-soft text-sm mb-6">
            sobre el valor acordado del flete. Cubre uso de la app, asignación, tracking y procesamiento de pagos (MercadoPago).
          </div>
          <div className="space-y-3">
            {[
              "Publicación y “esperando asignación” sin costo extra",
              "Asignación por cercanía + reputación (reglas evolutivas)",
              "Descuentos por retorno y por varios tramos en un mismo pedido",
              "Pagos con split marketplace (comisión descontada del flujo)",
              "Seguimiento del envío desde la app",
              "AMBA: foco inicial, expansión futura",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm">
                <span className="text-brand-teal-light">✓</span>
                <span className="text-fy-soft">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-10 sm:py-12 px-4 sm:px-6 border-t border-fy-border bg-brand-ink text-white pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="max-w-6xl mx-auto min-w-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-10 sm:mb-12">
          <div>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-2xl font-display font-extrabold text-white">flete</span>
              <span className="text-2xl font-display font-extrabold text-brand-amber">ya</span>
            </div>
            <p className="text-brand-teal-light/70 text-sm leading-relaxed">
              Marketplace de fletes con retornos y asignación por la plataforma. Mudanzas, mercadería y más en AMBA.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-3 text-brand-teal-light">Producto</h4>
            <div className="space-y-2 text-sm text-white/50">
              <Link href="/#como-funciona" className="block hover:text-brand-teal-light transition-colors">
                Cómo funciona
              </Link>
              <Link href="/#precios" className="block hover:text-brand-teal-light transition-colors">
                Precios
              </Link>
              <Link href="/#fleteros" className="block hover:text-brand-teal-light transition-colors">
                Para fleteros
              </Link>
              <div className="text-white/40">App móvil (próximamente paridad total)</div>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-3 text-brand-teal-light">Empresa</h4>
            <div className="space-y-2 text-sm text-white/50">
              <div>Sobre nosotros</div><div>Blog</div><div>Contacto</div><div>Trabaja con nosotros</div>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-3 text-brand-teal-light">Legal</h4>
            <div className="space-y-2 text-sm text-white/50">
              <div>Términos y condiciones</div><div>Política de privacidad</div><div>Política de cookies</div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-white/40 text-sm">
            © {new Date().getFullYear()} FleteYa SAS. Todos los derechos reservados.
          </div>
          <div className="flex gap-6 text-white/40 text-sm">
            <span>Instagram</span><span>LinkedIn</span><span>Twitter</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="min-w-0 overflow-x-hidden">
      <MarketingNavbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <ForDrivers />
      <Reviews />
      <Pricing />
      <Footer />
    </main>
  );
}
