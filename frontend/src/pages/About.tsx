import { Github, Linkedin, Globe, BookMarked, Zap, BarChart3, BookOpen, StickyNote, Code2 } from 'lucide-react'

const FEATURES = [
  { icon: BookOpen, label: 'Seguimiento de lecturas', desc: 'Registra qué estás leyendo, pausado, completado o en lista de espera.' },
  { icon: StickyNote, label: 'Notas y highlights', desc: 'Guarda citas, reflexiones, marcadores y highlights directamente en cada libro.' },
  { icon: BarChart3, label: 'Estadísticas personales', desc: 'Racha de lectura, tiempo acumulado, páginas por mes y distribución por género.' },
  { icon: BookMarked, label: 'Lector integrado', desc: 'Pega un enlace de Project Gutenberg o cualquier fuente compatible y lee sin salir de la app.' },
]

const LINKS = [
  {
    href: 'https://github.com/Bryan-Graterol',
    icon: Github,
    label: 'GitHub',
    sub: 'Bryan-Graterol',
  },
  {
    href: 'https://www.linkedin.com/in/bryan-graterol/',
    icon: Linkedin,
    label: 'LinkedIn',
    sub: 'bryan-graterol',
  },
  {
    href: 'https://page-personal.fly.dev/',
    icon: Globe,
    label: 'Sitio personal',
    sub: 'page-personal.fly.dev',
  },
]

export default function About() {
  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Sobre el proyecto</h1>
        <p className="text-zinc-500 text-sm mt-1">Quién lo hizo y por qué existe.</p>
      </div>

      {/* Author card */}
      <div className="bento-card mb-4">
        <div className="flex items-center gap-4 mb-5">
          <img
            src="/bryan.png"
            alt="Bryan Graterol"
            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-surface-border"
          />
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Bryan Graterol</h2>
            <p className="text-sm text-zinc-500">NetDev Automation · Automatizaciones para redes</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            Este proyecto nació de una necesidad concreta: quería un lugar propio donde registrar mis lecturas,
            anotar ideas mientras leo y ver algunas métricas que me resultaran útiles. Nada más, nada menos.
          </p>
          <p>
            Es un proyecto personal, así que evoluciona a mi ritmo. Puede tener algo de latencia en las
            respuestas y algún que otro detalle visual por pulir; el frontend no es mi territorio habitual —
            soy principalmente backend — pero me gusta que sea simple, directo y que resuelva exactamente
            lo que necesito.
          </p>
          <p>
            La idea es seguir sumando herramientas y funciones con el tiempo. Si tienes curiosidad por
            cómo está construido o quieres ver en qué más estoy trabajando, los enlaces están abajo.
          </p>
        </div>
      </div>

      {/* Stack pill */}
      <div className="bento-card mb-4">
        <p className="text-label mb-3">Stack</p>
        <div className="flex flex-wrap gap-2">
          {['FastAPI', 'Python', 'PostgreSQL', 'React', 'TypeScript', 'Tailwind CSS', 'Fly.io', 'Supabase'].map((t) => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-lg bg-surface-hover text-zinc-400 border border-surface-border">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Learning */}
      <div className="bento-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Code2 className="w-4 h-4 text-amber-400" />
          <p className="text-label">Lenguajes que estoy estudiando</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Rust', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
            { name: 'Java', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
            { name: 'Go', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
          ].map(({ name, color }) => (
            <span key={name} className={`text-sm font-medium px-3 py-1.5 rounded-lg border ${color}`}>
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bento-card mb-4">
        <p className="text-label mb-4">¿Qué hace la app?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex gap-3 p-3 rounded-xl bg-surface border border-surface-border">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="bento-card">
        <p className="text-label mb-4">Contacto &amp; redes</p>
        <div className="flex flex-col gap-2">
          {LINKS.map(({ href, icon: Icon, label, sub }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-surface-border hover:border-amber-400/40 hover:bg-amber-400/5 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0 group-hover:bg-amber-400/10 transition-colors">
                <Icon className="w-4 h-4 text-zinc-400 group-hover:text-amber-400 transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200 group-hover:text-amber-400 transition-colors">{label}</p>
                <p className="text-xs text-zinc-500">{sub}</p>
              </div>
              <Zap className="w-3.5 h-3.5 text-zinc-700 group-hover:text-amber-400 ml-auto transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
