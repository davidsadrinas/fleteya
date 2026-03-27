export type InstitutionalLinkItem = {
  label: string;
  href: string;
  description?: string;
};

export type InstitutionalFooterSection = {
  title: string;
  description: string;
};

export type MarketingStepItem = {
  step: string;
  icon: string;
  title: string;
  desc: string;
  bgClass: string;
  accentClass: string;
};

export type MarketingFeatureItem = {
  icon: string;
  title: string;
  desc: string;
};

export type MarketingReviewItem = {
  name: string;
  role: string;
  text: string;
  rating: number;
};

export type InstitutionalDocContent = {
  title: string;
  subtitle: string;
  body: string[];
};

export type MarketingFaqItem = {
  question: string;
  answer: string;
};

export const INSTITUTIONAL_WEB_RESUME = {
  scope: "Sitio institucional y landing pública",
  objective:
    "Centralizar textos y enlaces institucionales para edición rápida sin tocar componentes.",
  note: "Contenido placeholder para completar con datos reales luego del lanzamiento.",
} as const;

export const MARKETING_NAV_LINKS: readonly InstitutionalLinkItem[] = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#fleteros", label: "Soy fletero" },
  { href: "#precios", label: "Precios" },
] as const;

export const MARKETING_NAV_CTA = {
  href: "/login",
  label: "Ingresar",
} as const;

export const MARKETING_HERO = {
  badge: "Disponible en AMBA",
  titleStart: "Tu flete,",
  titleAccent: "simple",
  titleEnd: "y rápido.",
  description:
    "Marketplace de fletes en AMBA: vos publicás el envío, los fleteros se postulan y FleteYa asigna al mejor candidato según cercanía y reputación. Aprovechá viajes de retorno y tramos encadenados para pagar menos.",
  ctaClient: { href: "/login?role=client", label: "📦 Necesito un flete" },
  ctaDriver: { href: "/login?role=driver", label: "🚛 Soy fletero" },
  highlights: [
    "✓ Publicás sin elegir fletero a mano",
    "✓ Precio y tramos claros antes de pagar",
    "✓ Tracking y pagos por MercadoPago",
  ],
} as const;

export const MARKETING_STATS = [
  {
    value: "Retorno",
    label: "cargas que optimizan el viaje de vuelta",
    colorClass: "text-brand-amber",
  },
  {
    value: "22%",
    label: "comisión transparente por viaje",
    colorClass: "text-brand-teal-light",
  },
  {
    value: "Postulá",
    label: "fleteros compiten; la app asigna",
    colorClass: "text-brand-teal",
  },
  {
    value: "Encadená",
    label: "más tramos, descuentos acumulados",
    colorClass: "text-brand-amber",
  },
] as const;

export const MARKETING_HOW_IT_WORKS = {
  sectionTag: "Así de fácil",
  title: "¿Cómo funciona?",
  intro:
    "No hace falta que elijas conductor en un listado: la plataforma equipara quién está cerca (incluido quien termina un viaje y queda bien ubicado para el siguiente) con quién tiene mejor historial en la app.",
  steps: [
    {
      step: "1",
      icon: "📦",
      title: "Publicás el envío",
      desc: "Ruta, tipo de carga, ventana horaria y necesidades (ayudantes, tipo de vehículo). Podés sumar varios tramos: cuanto más encadenás, mejor suele ser el precio por kilómetro.",
      bgClass: "bg-brand-amber/10",
      accentClass: "bg-brand-amber",
    },
    {
      step: "2",
      icon: "🙋",
      title: "Se postulan fleteros",
      desc: "Conductores verificados muestran interés. En la app vas a ver el estado “esperando asignación” mientras se reúnen postulaciones y se evalúa cercanía.",
      bgClass: "bg-brand-teal-pale",
      accentClass: "bg-brand-teal",
    },
    {
      step: "3",
      icon: "⚖️",
      title: "FleteYa asigna",
      desc: "Asignación on-demand con reglas claras: primero rangos de cercanía al retiro, dentro de cada rango gana la mejor valoración. Si un fletero termina un viaje cerca de tu origen, entra con ventaja para encadenar.",
      bgClass: "bg-brand-amber/10",
      accentClass: "bg-brand-amber",
    },
    {
      step: "4",
      icon: "📍",
      title: "Pagás y seguís",
      desc: "Confirmás con precio cerrado (MercadoPago), tracking GPS durante el servicio y registro del viaje para reseñas.",
      bgClass: "bg-brand-teal-pale",
      accentClass: "bg-brand-teal",
    },
  ] as readonly MarketingStepItem[],
} as const;

export const MARKETING_FOR_DRIVERS = {
  tag: "Para fleteros",
  intro:
    "No competís a ciegas con listados eternos: postulás a los envíos que te cierran por ruta y horario. La app prioriza cercanía real (tu GPS y, si tenés un viaje activo, dónde terminás) y después tu valoración. Encadenar varios servicios en el día te acerca a los retiros siguientes y mejora tu perfil para seguir viajando con descuento al cliente.",
  titleLine1: "No vuelvas vacío.",
  titleLine2: "Monetizá cada kilómetro.",
  features: [
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
  ] as readonly MarketingFeatureItem[],
  cta: { href: "/login?role=driver", label: "Registrarme como fletero →" },
} as const;

export const MARKETING_REVIEWS = {
  sectionTag: "Testimonios",
  title: "Lo que dicen nuestros usuarios",
  items: [
    {
      name: "Laura P.",
      role: "Cliente",
      text: "Mudé mi depto por la mitad de lo que me cotizaron afuera. El fletero llegó puntual y con la app pude seguir todo.",
      rating: 5,
    },
    {
      name: "Carlos M.",
      role: "Fletero",
      text: "Postulo a lo que me queda de camino después de cada entrega. Encadenar dos o tres por día cambió mis números.",
      rating: 5,
    },
    {
      name: "Martín R.",
      role: "Cliente",
      text: "Publiqué el flete de materiales, vi el estado de asignación y cuando tocó ya tenía conductor con precio cerrado y tracking.",
      rating: 5,
    },
  ] as readonly MarketingReviewItem[],
} as const;

export const MARKETING_PRICING = {
  sectionTag: "Precios",
  title: "Transparente y simple",
  intro:
    "Sin suscripción para publicar ni para postular. La comisión financia la plataforma, el matching y los pagos; el precio del viaje lo ves cerrado antes de pagar.",
  cardTitle: "Comisión por viaje",
  cardRate: "22%",
  cardDescription:
    "sobre el valor acordado del flete. Cubre uso de la app, asignación, tracking y procesamiento de pagos (MercadoPago).",
  bullets: [
    "Publicación y “esperando asignación” sin costo extra",
    "Asignación por cercanía + reputación (reglas evolutivas)",
    "Descuentos por retorno y por varios tramos en un mismo pedido",
    "Pagos con split marketplace (comisión descontada del flujo)",
    "Seguimiento del envío desde la app",
    "AMBA: foco inicial, expansión futura",
  ],
} as const;

export const MARKETING_FAQ = {
  sectionTag: "Preguntas frecuentes",
  title: "Lo más buscado antes de publicar",
  items: [
    {
      question: "¿Cómo se asigna el fletero?",
      answer:
        "FleteYa aplica un modelo de asignación on-demand: primero evalúa cercanía por bandas y luego reputación dentro de cada banda.",
    },
    {
      question: "¿Puedo publicar un envío con varios tramos?",
      answer:
        "Sí. Podés encadenar tramos en un mismo pedido y acceder a descuentos por retorno o backhaul cuando aplica.",
    },
    {
      question: "¿Qué zona cubre FleteYa hoy?",
      answer:
        "La operación inicial está enfocada en AMBA, con expansión prevista a nuevas zonas en etapas.",
    },
    {
      question: "¿Qué necesito para ser fletero?",
      answer:
        "DNI verificado, licencia, seguro y VTV/RTO vigente, además de completar onboarding y documentación en la app.",
    },
  ] as readonly MarketingFaqItem[],
} as const;

export const FOOTER_PRODUCT_LINKS: readonly InstitutionalLinkItem[] = [
  {
    href: "/#como-funciona",
    label: "Cómo funciona",
  },
  {
    href: "/#precios",
    label: "Precios",
  },
  {
    href: "/#fleteros",
    label: "Para fleteros",
  },
  {
    href: "/",
    label: "App móvil (próximamente paridad total)",
  },
] as const;

export const FOOTER_SECTIONS: Record<
  "company" | "legal" | "social",
  InstitutionalFooterSection
> = {
  company: {
    title: "Empresa",
    description: "Información institucional y canales de contacto del negocio.",
  },
  legal: {
    title: "Legal",
    description: "Documentos legales y políticas que regulan el uso de la plataforma.",
  },
  social: {
    title: "Redes sociales",
    description: "Perfiles públicos para comunidad, novedades y soporte social.",
  },
};

export const FOOTER_COMPANY_LINKS: readonly InstitutionalLinkItem[] = [
  {
    label: "Sobre FleteYa (placeholder)",
    href: "/empresa/sobre-fletaya",
    description: "Resumen de la historia, propósito y visión de la empresa.",
  },
  {
    label: "Nuestro equipo (placeholder)",
    href: "/empresa/equipo",
    description: "Presentación de founders, líderes y áreas principales.",
  },
  {
    label: "Prensa y novedades (placeholder)",
    href: "/empresa/prensa",
    description: "Comunicados, lanzamientos y menciones en medios.",
  },
  {
    label: "Contacto: hola@fletaya-demo.com",
    href: "/empresa/contacto",
    description: "Canales de contacto comercial, soporte y alianzas.",
  },
  {
    label: "Trabajá con nosotros (placeholder)",
    href: "/empresa/trabaja-con-nosotros",
    description: "Búsquedas abiertas, cultura y proceso de selección.",
  },
] as const;

export const FOOTER_LEGAL_LINKS: readonly InstitutionalLinkItem[] = [
  {
    label: "Términos y condiciones (placeholder)",
    href: "/legal/terminos-y-condiciones",
    description: "Reglas generales para clientes, fleteros y uso de la app.",
  },
  {
    label: "Política de privacidad (placeholder)",
    href: "/legal/politica-de-privacidad",
    description: "Qué datos se recolectan, por qué y cómo se protegen.",
  },
  {
    label: "Política de cookies (placeholder)",
    href: "/legal/politica-de-cookies",
    description: "Uso de cookies, preferencias y gestión de consentimiento.",
  },
  {
    label: "Defensa del consumidor (placeholder)",
    href: "/legal/defensa-consumidor",
    description: "Información de reclamos, jurisdicción y canales oficiales.",
  },
  {
    label: "Términos para fleteros (placeholder)",
    href: "/legal/terminos-fleteros",
    description: "Condiciones específicas para conductores y documentación.",
  },
] as const;

export const FOOTER_SOCIAL_LINKS: readonly InstitutionalLinkItem[] = [
  {
    label: "Instagram",
    href: "https://instagram.com/fletaya_demo",
    description: "Novedades visuales, campañas y contenido de comunidad.",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/fletaya-demo",
    description: "Actualizaciones corporativas, hiring y alianzas.",
  },
  {
    label: "X / Twitter",
    href: "https://x.com/fletaya_demo",
    description: "Comunicados rápidos, estado de servicio y anuncios.",
  },
  {
    label: "Facebook",
    href: "https://facebook.com/fletaya.demo",
    description: "Comunidad extendida, soporte social y publicaciones.",
  },
] as const;

export const INSTITUTIONAL_COMPANY_DOCS: Record<string, InstitutionalDocContent> = {
  "sobre-fletaya": {
    title: "Sobre FleteYa",
    subtitle: "Placeholder institucional",
    body: [
      "Esta sección describe la historia de la empresa, su misión y visión de largo plazo.",
      "Completá aquí propósito de marca, hitos relevantes y propuesta de valor diferencial.",
    ],
  },
  equipo: {
    title: "Nuestro equipo",
    subtitle: "Placeholder institucional",
    body: [
      "Esta sección presenta founders, liderazgo y áreas principales del equipo.",
      "Completá aquí perfiles clave, experiencia y responsabilidades.",
    ],
  },
  prensa: {
    title: "Prensa y novedades",
    subtitle: "Placeholder institucional",
    body: [
      "Esta sección se usa para comunicados, lanzamientos y presencia en medios.",
      "Completá aquí notas de prensa, kits de marca y contacto para periodistas.",
    ],
  },
  contacto: {
    title: "Contacto",
    subtitle: "Placeholder institucional",
    body: [
      "Canales para consultas comerciales, soporte y alianzas.",
      "Completá aquí email real, teléfono y horarios de respuesta.",
    ],
  },
  "trabaja-con-nosotros": {
    title: "Trabajá con nosotros",
    subtitle: "Placeholder institucional",
    body: [
      "Esta sección centraliza búsquedas abiertas y cultura organizacional.",
      "Completá aquí puestos, modalidad de trabajo y proceso de selección.",
    ],
  },
};

export const INSTITUTIONAL_LEGAL_DOCS: Record<string, InstitutionalDocContent> = {
  "terminos-y-condiciones": {
    title: "Términos y condiciones",
    subtitle: "Placeholder legal",
    body: [
      "Documento principal con reglas de uso para clientes y fleteros.",
      "Completá aquí alcance del servicio, responsabilidades y limitaciones.",
    ],
  },
  "politica-de-privacidad": {
    title: "Política de privacidad",
    subtitle: "Placeholder legal",
    body: [
      "Documento sobre datos personales recolectados, finalidades y conservación.",
      "Completá aquí bases legales, derechos de titulares y contacto DPO.",
    ],
  },
  "politica-de-cookies": {
    title: "Política de cookies",
    subtitle: "Placeholder legal",
    body: [
      "Documento de tipos de cookies, uso y gestión de consentimiento.",
      "Completá aquí herramientas, duraciones y panel de preferencias.",
    ],
  },
  "defensa-consumidor": {
    title: "Defensa del consumidor",
    subtitle: "Placeholder legal",
    body: [
      "Información para reclamos y canales de autoridad competente.",
      "Completá aquí jurisdicción, organismos y mecanismos de mediación.",
    ],
  },
  "terminos-fleteros": {
    title: "Términos para fleteros",
    subtitle: "Placeholder legal",
    body: [
      "Condiciones específicas para conductores registrados en la plataforma.",
      "Completá aquí requisitos documentales, compliance y penalidades.",
    ],
  },
};
