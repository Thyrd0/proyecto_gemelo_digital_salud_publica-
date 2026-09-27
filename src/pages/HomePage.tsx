import { 
  Sparkles, 
  ArrowRight, 
  Sliders, 
  Database, 
  CheckCircle2, 
  Layers,
  Percent,
  Apple,
  Store,
  Activity,
  Cpu,
  BarChart3,
  Boxes
} from 'lucide-react';
import { NavSection } from '../components/layout/Navbar';
import { useLanguage } from '../context/LanguageContext';

interface HomePageProps {
  onNavigate: (section: NavSection) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { t, language } = useLanguage();

  const futureSources = [
    {
      name: 'USDA Food Environment Atlas',
      category: language === 'es' ? 'Entorno Alimentario' : 'Food Environment',
      purpose: language === 'es' 
        ? 'Indicadores de acceso geográfico a supermercados, tiendas de abarrotes, desiertos alimentarios y disponibilidad de alimentos frescos.'
        : 'Geographic accessibility indicators to supermarkets, grocery stores, food deserts, and fresh food availability.',
      scope: language === 'es' ? 'Capa Geoespacial' : 'Geospatial Layer'
    },
    {
      name: 'CDC PLACES',
      category: language === 'es' ? 'Salud Pública' : 'Public Health',
      purpose: language === 'es'
        ? 'Estimaciones de prevalencia a nivel de tracto censal para diabetes mellitus tipo 2, obesidad, hipertensión y conductas de riesgo.'
        : 'Census tract-level prevalence estimates for type 2 diabetes mellitus, obesity, hypertension, and risk behaviors.',
      scope: language === 'es' ? 'Capa Epidemiológica' : 'Epidemiological Layer'
    },
    {
      name: 'NHANES',
      category: language === 'es' ? 'Nutrición y Salud' : 'Nutrition & Health',
      purpose: language === 'es'
        ? 'Microdatos de consumo nutricional, encuestas dietéticas de recordatorio de 24 horas y patrones de ingesta calórica poblacional.'
        : 'Nutritional consumption microdata, 24-hour dietary recall surveys, and population caloric intake patterns.',
      scope: language === 'es' ? 'Capa Nutricional' : 'Nutritional Layer'
    },
    {
      name: 'American Community Survey (ACS)',
      category: language === 'es' ? 'Demografía y Socioeconomía' : 'Demographics & Socioeconomics',
      purpose: language === 'es'
        ? 'Variables sociodemográficas: ingresos medios por hogar, índice de pobreza, tenencia de vehículos y composición demográfica.'
        : 'Sociodemographic variables: median household income, poverty index, vehicle availability, and demographic makeup.',
      scope: language === 'es' ? 'Capa Sociodemográfica' : 'Sociodemographic Layer'
    },
    {
      name: 'OpenStreetMap (OSM)',
      category: language === 'es' ? 'Infraestructura Urbana' : 'Urban Infrastructure',
      purpose: language === 'es'
        ? 'Georreferenciación de puntos de venta de comida rápida, tiendas de conveniencia, mercados comunitarios y escuelas.'
        : 'Georeferencing of fast food outlets, convenience stores, community markets, and schools.',
      scope: language === 'es' ? 'Capa Comercial' : 'Commercial Layer'
    },
    {
      name: 'U.S. Census TIGER/Line',
      category: language === 'es' ? 'Cartografía Geoespacial' : 'Geospatial Cartography',
      purpose: language === 'es'
        ? 'Límites poligonales vectoriales oficiales de tractos censales para visualizaciones coropléticas territoriales.'
        : 'Official census tract vector boundary shapefiles for territorial choropleth visualizations.',
      scope: language === 'es' ? 'Capa Cartográfica' : 'Cartographic Layer'
    }
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-6 sm:p-10 lg:p-12 shadow-md border border-slate-800 dark:border-slate-800">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('homeHeroBadge')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-['Space_Grotesk'] leading-tight">
            {t('homeHeroTitle')}
          </h1>

          <h2 className="text-lg sm:text-xl text-teal-200 font-medium">
            {t('homeHeroSubtitle')}
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            {t('homeHeroDesc')}
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('simulator3d')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition shadow-md cursor-pointer"
            >
              <Boxes className="w-4 h-4" />
              <span>{t('sim3DTitle')} (3D)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('simulator')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-teal-400" />
              <span>{t('homeCtaSimulate')} (2D)</span>
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition cursor-pointer"
            >
              <Layers className="w-4 h-4 text-teal-400" />
              <span>{t('homeCtaDashboard')}</span>
            </button>
          </div>
        </div>

        {/* Decorative features banner */}
        <div className="mt-8 pt-6 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-400" />
            <span>{t('homeFeatureEngine')}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-teal-300">
            <Activity className="w-4 h-4" />
            <span>{t('homeFeatureHorizons')}</span>
          </div>
        </div>
      </section>

      {/* Scope & Capabilities Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3 transition-colors">
          <div className="flex items-center gap-2.5 text-teal-700 dark:text-teal-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{t('homeCapTitle')}</h3>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-1">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0"></span>
              <span><strong>{t('homeCap1Title')}:</strong> {t('homeCap1Desc')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0"></span>
              <span><strong>{t('homeCap2Title')}:</strong> {t('homeCap2Desc')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0"></span>
              <span><strong>{t('homeCap3Title')}:</strong> {t('homeCap3Desc')}</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3 transition-colors">
          <div className="flex items-center gap-2.5 text-teal-700 dark:text-teal-400">
            <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{t('homeMetricsTitle')}</h3>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-1">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0"></span>
              <span><strong>{t('homeMetric1Title')}:</strong> {t('homeMetric1Desc')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0"></span>
              <span><strong>{t('homeMetric2Title')}:</strong> {t('homeMetric2Desc')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0"></span>
              <span><strong>{t('homeMetric3Title')}:</strong> {t('homeMetric3Desc')}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Simulated Policies Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
              <Sliders className="w-5 h-5" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('homePoliciesTitle')}</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t('homePoliciesSubtitle')}
            </p>
          </div>
          <button
            onClick={() => onNavigate('simulator')}
            className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            {t('simTitle')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Policy A */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold text-xs">
                <Percent className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('homePolicyTaxTitle')}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('homePolicyTaxDesc')}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-teal-700 dark:text-teal-400">
              {t('homePolicyTaxParam')}
            </div>
          </div>

          {/* Policy B */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                <Apple className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('homePolicySubsidyTitle')}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('homePolicySubsidyDesc')}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              {t('homePolicySubsidyParam')}
            </div>
          </div>

          {/* Policy C */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300 flex items-center justify-center font-bold text-xs">
                <Store className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('homePolicyRestrictionTitle')}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('homePolicyRestrictionDesc')}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-orange-700 dark:text-orange-400">
              {t('homePolicyRestrictionParam')}
            </div>
          </div>
        </div>
      </section>

      {/* Integrated Data Layers Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-5 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Database className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="text-lg font-bold">{t('homeDataLayersTitle')}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('homeDataLayersSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {futureSources.map((src, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {src.category}
                </span>
                <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">
                  {src.scope}
                </span>
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{src.name}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{src.purpose}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
