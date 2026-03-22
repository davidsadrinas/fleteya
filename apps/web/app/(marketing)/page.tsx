import Link from "next/link";

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-fy-border bg-fy-bg/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-2xl font-display font-extrabold text-brand-charcoal">flete</span>
          <span className="text-2xl font-display font-extrabold text-brand-coral">ya</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#como-funciona" className="text-fy-soft hover:text-brand-forest text-sm font-medium font-heading transition-colors">
            Cómo funciona
          </Link>
          <Link href="#fleteros" className="text-fy-soft hover:text-brand-forest text-sm font-medium font-heading transition-colors">
            Soy fletero
          </Link>
          <Link href="#precios" className="text-fy-soft hover:text-brand-forest text-sm font-medium font-heading transition-colors">
            Precios
          </Link>
          <Link href="/login" className="btn-primary text-sm !py-2 !px-5">
            Ingresar
          </Link>
        </div>
        <Link href="/login" className="md:hidden btn-primary text-sm !py-2 !px-4">
          Ingresar
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Soft organic background shapes */}
      <div className="absolute top-20 right-0 w-72 h-72 bg-brand-mint-pale rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-0 left-10 w-56 h-56 bg-brand-sunshine-light rounded-full blur-3xl opacity-30" />
      <div className="absolute top-40 left-1/3 w-40 h-40 bg-brand-coral-light/20 rounded-full blur-2xl" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-mint-pale border border-brand-mint-light/30 text-brand-forest text-sm font-semibold font-heading mb-8">
          <span className="w-2 h-2 rounded-full bg-brand-mint animate-pulse" />
          Disponible en AMBA
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-extrabold mb-6 leading-tight text-brand-charcoal">
          Tu flete,{" "}
          <span className="text-brand-coral">simple</span>
          <br />
          y rápido.
        </h1>
        <p className="text-xl text-fy-soft max-w-2xl mx-auto mb-10 leading-relaxed font-body">
          Conectamos tu envío con fleteros que vuelven vacíos.
          Mismo servicio, hasta <span className="text-brand-coral font-bold">40% menos</span>.
          Mudanzas, mercadería y materiales.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login?role=client" className="btn-primary text-lg !py-4 !px-8">
            📦 Necesito un flete
          </Link>
          <Link href="/login?role=driver" className="btn-secondary text-lg !py-4 !px-8">
            🚛 Soy fletero
          </Link>
        </div>
        <div className="flex items-center justify-center gap-8 mt-12 text-fy-soft text-sm font-heading">
          <span>✓ Sin compromiso</span>
          <span>✓ Precio cerrado</span>
          <span>✓ Seguro incluido</span>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="py-16 px-6 border-y border-fy-border bg-white">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { value: "40%", label: "de fletes vuelven vacíos", color: "text-brand-coral" },
          { value: "~35%", label: "ahorro promedio", color: "text-brand-forest" },
          { value: "22'", label: "tiempo promedio de match", color: "text-brand-mint" },
          { value: "4.8★", label: "rating promedio", color: "text-brand-sunshine" },
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
    <section id="como-funciona" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-tag mb-4 inline-block">Así de fácil</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-charcoal mt-3">
            ¿Cómo funciona?
          </h2>
          <p className="text-fy-soft mt-3 max-w-xl mx-auto">
            En 3 pasos tenés tu flete confirmado con el mejor precio.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "1", icon: "📦", title: "Cargá tu envío", desc: "Indicá qué movés, el origen, destino, y cuándo. Podés sumar tramos para mejor precio.", bg: "bg-brand-coral-light/20", accent: "bg-brand-coral" },
            { step: "2", icon: "🔄", title: "Elegí tu flete", desc: "Compará fleteros verificados. Los que vuelven de otro viaje te ofrecen hasta 40% menos.", bg: "bg-brand-mint-pale", accent: "bg-brand-mint" },
            { step: "3", icon: "📍", title: "Seguilo en vivo", desc: "Tracking GPS en tiempo real, chat con el fletero, y notificaciones de cada etapa.", bg: "bg-brand-sunshine-light", accent: "bg-brand-sunshine" },
          ].map((item) => (
            <div key={item.step} className="card text-center !border-transparent hover:shadow-md transition-shadow">
              <div className={`w-16 h-16 ${item.bg} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4`}>
                {item.icon}
              </div>
              <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${item.accent} text-white text-xs font-bold font-heading mb-3`}>
                {item.step}
              </div>
              <h3 className="text-lg font-display font-bold text-brand-charcoal mb-2">
                {item.title}
              </h3>
              <p className="text-fy-soft text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForDrivers() {
  return (
    <section id="fleteros" className="py-20 px-6 bg-brand-forest relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-mint/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-coral/5 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-brand-mint-light text-xs font-bold font-heading tracking-wide mb-4">
            Para fleteros
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mt-3">
            No vuelvas vacío.
            <br />
            <span className="text-brand-coral">Monetizá cada kilómetro.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: "💰", title: "Más ingresos", desc: "Cada viaje de retorno es ingreso neto. El costo del viaje ya está amortizado." },
            { icon: "📱", title: "Todo en la app", desc: "Agenda, cobros, facturación y estadísticas. Sin papeles ni llamadas." },
            { icon: "⭐", title: "Tu reputación vale", desc: "Acumulá rating y reseñas. Mejor reputación = más viajes y mejor precio." },
            { icon: "🛡️", title: "Seguro incluido", desc: "Cobertura de responsabilidad civil mientras operás con la plataforma." },
          ].map((item) => (
            <div key={item.title} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex gap-4">
              <div className="text-2xl">{item.icon}</div>
              <div>
                <h3 className="font-heading font-bold text-white mb-1">{item.title}</h3>
                <p className="text-brand-mint-light/80 text-sm leading-relaxed">{item.desc}</p>
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
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="section-tag mb-4 inline-block">Testimonios</span>
          <h2 className="text-3xl font-display font-bold text-brand-charcoal mt-3">
            Lo que dicen nuestros usuarios
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Laura P.", role: "Cliente", text: "Mudé mi depto por la mitad de lo que me cotizaron afuera. El fletero llegó puntual y con la app pude seguir todo.", rating: 5 },
            { name: "Carlos M.", role: "Fletero", text: "Antes volvía vacío de zona sur. Ahora siempre tengo algo para el retorno. Facturo un 60% más por mes.", rating: 5 },
            { name: "Martín R.", role: "Cliente", text: "Necesitaba mover materiales de obra. En 15 minutos tenía fletero confirmado con precio cerrado y seguro.", rating: 5 },
          ].map((r) => (
            <div key={r.name} className="card hover:shadow-md transition-shadow">
              <div className="text-brand-sunshine text-sm mb-3">
                {"★".repeat(r.rating)}
              </div>
              <p className="text-sm text-fy-soft leading-relaxed mb-4">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-mint-pale flex items-center justify-center text-brand-forest text-xs font-bold font-heading">
                  {r.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold font-heading text-brand-charcoal">{r.name}</div>
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
    <section id="precios" className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <span className="section-tag mb-4 inline-block">Precios</span>
        <h2 className="text-3xl font-display font-bold text-brand-charcoal mt-3 mb-4">
          Transparente y simple
        </h2>
        <p className="text-fy-soft mb-12">
          Sin suscripción. Sin costos ocultos. Solo pagás cuando usás.
        </p>
        <div className="card max-w-md mx-auto text-left !p-6 border-brand-mint-light/30">
          <div className="text-sm text-brand-forest font-bold font-heading tracking-wide uppercase mb-2">
            Comisión por viaje
          </div>
          <div className="text-5xl font-display font-extrabold text-brand-coral mb-2">
            22%
          </div>
          <div className="text-fy-soft text-sm mb-6">
            sobre el valor del flete. Incluye seguro, tracking, y soporte.
          </div>
          <div className="space-y-3">
            {[
              "Seguro de RC incluido",
              "Tracking GPS en tiempo real",
              "Pagos seguros vía MercadoPago",
              "Soporte 7 días",
              "Descuentos por viaje de retorno",
              "Multi-tramo con precios encadenados",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm">
                <span className="text-brand-mint">✓</span>
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
    <footer className="py-12 px-6 border-t border-fy-border bg-brand-forest text-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-2xl font-display font-extrabold text-white">flete</span>
              <span className="text-2xl font-display font-extrabold text-brand-coral">ya</span>
            </div>
            <p className="text-brand-mint-light/70 text-sm leading-relaxed">
              Tu flete, simple y rápido. Mudanzas, mercadería y materiales en AMBA.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-3 text-brand-mint-light">Producto</h4>
            <div className="space-y-2 text-sm text-white/50">
              <div>Cómo funciona</div><div>Precios</div><div>Para fleteros</div><div>App móvil</div>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-3 text-brand-mint-light">Empresa</h4>
            <div className="space-y-2 text-sm text-white/50">
              <div>Sobre nosotros</div><div>Blog</div><div>Contacto</div><div>Trabaja con nosotros</div>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-3 text-brand-mint-light">Legal</h4>
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
    <main>
      <Navbar />
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
