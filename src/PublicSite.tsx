import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, ChevronRight, CirclePlay, GitBranch, Layers3, Menu, Moon, Move3d, Palette, Plug, Sparkles, Sun, WandSparkles, X, Zap } from "lucide-react";
import { appPath, url } from "./paths";

type PublicPage = "home" | "work" | "integrations" | "about";
type Theme = "dark" | "light";
type PublicLanguage = "pt" | "en" | "es";

const publicLanguageMeta: Record<PublicLanguage, { flag: string; short: string; name: string }> = {
  pt: { flag: "🇧🇷", short: "PT", name: "Português" },
  en: { flag: "🇺🇸", short: "EN", name: "English" },
  es: { flag: "🇪🇸", short: "ES", name: "Español" },
};

type PublicSiteProps = { page: PublicPage };

type PublicLocale = {
  footer: string;
  home: { kicker: string; titleA: string; titleB: string; intro: string; start: string; work: string; native: string; nativeDetail: string; mouse: string; mouseDetail: string; type: string; typeDetail: string; cardTitle: string; cardMeta: string; built: string; system: string; systemTitleA: string; systemTitleB: string; systemCopy: string; features: [string, string][]; manifestoA: string; manifestoB: string; next: string; nextA: string; nextB: string; open: string };
  workPage: { kicker: string; titleA: string; titleB: string; intro: string; note: string; projects: { title: string; tag: string }[] };
  integrationsPage: { kicker: string; titleA: string; titleB: string; intro: string; explore: string; technical: string; apiA: string; apiB: string; apiCopy: string; open: string };
  about: { kicker: string; titleA: string; titleB: string; intro: string; cta: string; quote: string; principle: string; values: [string, string][] };
};

const publicLocale: Record<PublicLanguage, PublicLocale> = {
  pt: {
    footer: "Crie uma visão própria.",
    home: { kicker: "editor visual web / 01", titleA: "Faça a web", titleB: "se mover.", intro: "O SiteForge é um editor visual para designers que querem que seus sites pareçam lugares — não páginas.", start: "Começar a criar", work: "Ver trabalhos", native: "3D nativo", nativeDetail: "Three.js por baixo", mouse: "Sensível ao mouse", mouseDetail: "Movimento que segue a intenção", type: "Guiado por tipografia", typeDetail: "Sistemas com personalidade", cardTitle: "Interativo por padrão", cardMeta: "O cursor é a entrada", built: "FEITO PARA QUEM NÃO PARA", system: "O sistema", systemTitleA: "Tudo o que você precisa", systemTitleB: "para criar uma sensação.", systemCopy: "Uma caixa de ferramentas para transformar linguagem visual em experiência viva.", features: [["3D sem atrito", "Componha cenas com primitivas, materiais e luzes Three.js sem sair do canvas."], ["Um sistema, não um template", "Controle tipografia, cor, espaçamento e movimento como uma linguagem visual coerente."], ["Movimento com intenção", "Faça cada movimento do cursor, hover e scroll participar da história."]], manifestoA: "Menos dashboard.", manifestoB: "Mais direção.", next: "Sua próxima superfície", nextA: "Comece com uma", nextB: "visão própria.", open: "Abrir SiteForge" },
    workPage: { kicker: "Trabalhos selecionados / 03 direções", titleA: "Bom trabalho tem", titleB: "uma temperatura.", intro: "Três sistemas visuais construídos com a mesma crença: a interface deve carregar uma sensação antes de carregar uma função.", note: "Eles não são templates. São temperaturas para começar.", projects: [{ title: "Aether / som no espaço", tag: "Identidade imersiva" }, { title: "Common / um estúdio para ideias", tag: "Sistema editorial" }, { title: "Nocturne / depois da interface", tag: "Experiência de lançamento" }] },
    integrationsPage: { kicker: "A conexão entre as partes", titleA: "Traga seu stack", titleB: "para a cena.", intro: "O SiteForge foi feito para ficar entre seu pensamento visual e os sistemas que o tornam real.", explore: "Explorar integração", technical: "Para mentes técnicas", apiA: "Uma camada visual", apiB: "com borda aberta.", apiCopy: "Use webhooks, snapshots de projeto e uma API limpa para conectar o canvas ao restante do seu fluxo.", open: "Abrir o editor" },
    about: { kicker: "Sobre / o porquê", titleA: "Interfaces podem", titleB: "ter alma.", intro: "Criamos o SiteForge para quem percebe os detalhes: o peso de uma fonte, o tempo de um hover, o espaço entre duas ideias.", cta: "Construir sua linguagem", quote: "Os melhores sites não pedem atenção. Eles fazem a atenção parecer bem investida.", principle: "O princípio SiteForge", values: [["Ponto de vista", "As ferramentas devem ajudar você a fazer uma escolha, não fazer todas as escolhas por você."], ["Atrito bom", "As restrições certas criam uma linguagem visual que as pessoas conseguem sentir."], ["Movimento importa", "Interação não é decoração. É como uma interface diz olá."]] },
  },
  en: {
    footer: "Build a point of view.",
    home: { kicker: "visual web editor / 01", titleA: "Make the web", titleB: "move.", intro: "SiteForge is a visual editor for designers who want their sites to feel like places — not pages.", start: "Start creating", work: "See the work", native: "3D native", nativeDetail: "Three.js under the hood", mouse: "Mouse-aware", mouseDetail: "Motion that follows intent", type: "Type-led", typeDetail: "Systems with a point of view", cardTitle: "Interactive by default", cardMeta: "Cursor is the input", built: "BUILT FOR THE RESTLESS", system: "The system", systemTitleA: "Everything you need", systemTitleB: "to make a feeling.", systemCopy: "A toolkit for turning a visual language into a living experience.", features: [["3D without the friction", "Compose scenes with Three.js primitives, materials and lighting without leaving the canvas."], ["A system, not a template", "Control type, color, spacing and motion as one coherent visual language."], ["Motion with intention", "Make every cursor move, hover and scroll feel like part of the story."]], manifestoA: "Less dashboard.", manifestoB: "More direction.", next: "Your next surface", nextA: "Start with a blank", nextB: "point of view.", open: "Open SiteForge" },
    workPage: { kicker: "Selected work / 03 directions", titleA: "Good work has", titleB: "a temperature.", intro: "Three visual systems built with the same belief: the interface should carry a feeling before it carries a function.", note: "These are not templates. They are starting temperatures.", projects: [{ title: "Aether / sound in space", tag: "Immersive identity" }, { title: "Common / a studio for ideas", tag: "Editorial system" }, { title: "Nocturne / after the interface", tag: "Launch experience" }] },
    integrationsPage: { kicker: "The connective tissue", titleA: "Bring your stack", titleB: "into the scene.", intro: "SiteForge is designed to sit between your visual thinking and the systems that make it real.", explore: "Explore integration", technical: "For the technical minds", apiA: "A visual layer", apiB: "with an open edge.", apiCopy: "Use webhooks, project snapshots and a clean API surface to connect the canvas to the rest of your workflow.", open: "Open the editor" },
    about: { kicker: "About / the why", titleA: "Interfaces can", titleB: "have a soul.", intro: "We made SiteForge for people who notice the details: the weight of a typeface, the timing of a hover, the space between two ideas.", cta: "Build your language", quote: "The best websites do not ask for attention. They make attention feel well spent.", principle: "The SiteForge principle", values: [["Point of view", "Tools should help you make a choice, not make every choice for you."], ["Good friction", "The right constraints create a visual language people can feel."], ["Motion matters", "Interaction is not decoration. It is how an interface says hello."]] },
  },
  es: {
    footer: "Crea una visión propia.",
    home: { kicker: "editor web visual / 01", titleA: "Haz que la web", titleB: "se mueva.", intro: "SiteForge es un editor visual para diseñadores que quieren que sus sitios se sientan como lugares, no como páginas.", start: "Empezar a crear", work: "Ver trabajos", native: "3D nativo", nativeDetail: "Three.js por debajo", mouse: "Sensible al mouse", mouseDetail: "Movimiento que sigue la intención", type: "Guiado por tipografía", typeDetail: "Sistemas con personalidad", cardTitle: "Interactivo por defecto", cardMeta: "El cursor es la entrada", built: "HECHO PARA QUIENES NO PARAN", system: "El sistema", systemTitleA: "Todo lo que necesitas", systemTitleB: "para crear una sensación.", systemCopy: "Una caja de herramientas para convertir un lenguaje visual en una experiencia viva.", features: [["3D sin fricción", "Compón escenas con primitivas, materiales e iluminación de Three.js sin salir del canvas."], ["Un sistema, no una plantilla", "Controla tipografía, color, espacio y movimiento como un lenguaje visual coherente."], ["Movimiento con intención", "Haz que cada movimiento del cursor, hover y scroll forme parte de la historia."]], manifestoA: "Menos dashboard.", manifestoB: "Más dirección.", next: "Tu próxima superficie", nextA: "Empieza con una", nextB: "visión propia.", open: "Abrir SiteForge" },
    workPage: { kicker: "Trabajos seleccionados / 03 direcciones", titleA: "El buen trabajo tiene", titleB: "una temperatura.", intro: "Tres sistemas visuales construidos con la misma creencia: la interfaz debe transmitir una sensación antes que una función.", note: "No son plantillas. Son temperaturas para comenzar.", projects: [{ title: "Aether / sonido en el espacio", tag: "Identidad inmersiva" }, { title: "Common / un estudio de ideas", tag: "Sistema editorial" }, { title: "Nocturne / después de la interfaz", tag: "Experiencia de lanzamiento" }] },
    integrationsPage: { kicker: "El tejido conectivo", titleA: "Trae tu stack", titleB: "a la escena.", intro: "SiteForge está diseñado para conectar tu pensamiento visual con los sistemas que lo hacen realidad.", explore: "Explorar integración", technical: "Para mentes técnicas", apiA: "Una capa visual", apiB: "con borde abierto.", apiCopy: "Usa webhooks, snapshots de proyecto y una API limpia para conectar el canvas con el resto de tu flujo.", open: "Abrir el editor" },
    about: { kicker: "Sobre / el porqué", titleA: "Las interfaces pueden", titleB: "tener alma.", intro: "Creamos SiteForge para quienes notan los detalles: el peso de una tipografía, el tiempo de un hover, el espacio entre dos ideas.", cta: "Construir tu lenguaje", quote: "Los mejores sitios no piden atención. Hacen que prestar atención parezca tiempo bien invertido.", principle: "El principio SiteForge", values: [["Punto de vista", "Las herramientas deben ayudarte a elegir, no elegirlo todo por ti."], ["Fricción buena", "Las restricciones adecuadas crean un lenguaje visual que se puede sentir."], ["El movimiento importa", "La interacción no es decoración. Es cómo una interfaz dice hola."]] },
  },
};

const PublicLocaleContext = createContext<PublicLocale>(publicLocale.pt);
function usePublicLocale() { return useContext(PublicLocaleContext); }
const PublicLanguageContext = createContext<PublicLanguage>("pt");
function usePublicLanguage() { return useContext(PublicLanguageContext); }


const integrations = [
  { name: "GitHub", category: "Workflow", copy: "Keep every page, component and experiment close to the code that ships it.", color: "white", icon: <GitBranch size={19} /> },
  { name: "Notion", category: "Content", copy: "Bring your thinking into the canvas and shape content into a living interface.", color: "orange", icon: <Layers3 size={19} /> },
  { name: "Analytics", category: "Insights", copy: "See which interactions become momentum without leaving your creative workspace.", color: "lime", icon: <Zap size={19} /> }
];

const publicCopy = {
  pt: { work: "Trabalhos", integrations: "Integrações", about: "Sobre", signIn: "Entrar", editor: "Abrir editor" },
  en: { work: "Work", integrations: "Integrations", about: "About", signIn: "Sign in", editor: "Open editor" },
  es: { work: "Trabajos", integrations: "Integraciones", about: "Sobre", signIn: "Entrar", editor: "Abrir editor" },
};

function PublicLanguageSelect({ value, onChange }: { value: PublicLanguage; onChange: (value: PublicLanguage) => void }) {
  return <div className="public-language-select" role="group" aria-label="Language"><div className="language-flag-strip">{(Object.keys(publicLanguageMeta) as PublicLanguage[]).map((language) => <button type="button" className={language === value ? "active" : ""} key={language} aria-label={`${publicLanguageMeta[language].name} (${publicLanguageMeta[language].short})`} aria-pressed={language === value} onClick={() => onChange(language)}>{publicLanguageMeta[language].flag}</button>)}</div></div>;
}

function PublicScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let cleanup = () => undefined;
    import("three").then((THREE) => {
      if (disposed) return;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
      camera.position.set(0, 0.2, 5.7);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);
      const group = new THREE.Group();
      scene.add(group);
      const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 5), new THREE.MeshStandardMaterial({ color: 0xb8ff3d, roughness: 0.22, metalness: 0.3, emissive: 0x18310b, emissiveIntensity: 0.22 }));
      group.add(orb);
      const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 2), new THREE.MeshBasicMaterial({ color: 0x8f9dff, wireframe: true, transparent: true, opacity: 0.32 }));
      group.add(wire);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.012, 10, 128), new THREE.MeshBasicMaterial({ color: 0xb8ff3d, transparent: true, opacity: 0.5 }));
      ring.rotation.x = 1.12;
      group.add(ring);
      const points = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xf0f3e9, size: 0.018, transparent: true, opacity: 0.72 }));
      const positions = new Float32Array(250 * 3);
      for (let i = 0; i < positions.length; i += 3) { positions[i] = (Math.random() - 0.5) * 6.4; positions[i + 1] = (Math.random() - 0.5) * 5.2; positions[i + 2] = (Math.random() - 0.5) * 3.2; }
      points.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      scene.add(points);
      scene.add(new THREE.AmbientLight(0xffffff, 1.8));
      const light = new THREE.PointLight(0xb8ff3d, 9, 9); light.position.set(2, 2, 3); scene.add(light);
      const pointer = { x: 0, y: 0 };
      const onMove = (event: PointerEvent) => { const rect = mount.getBoundingClientRect(); pointer.x = (event.clientX - rect.left) / rect.width - 0.5; pointer.y = (event.clientY - rect.top) / rect.height - 0.5; };
      mount.addEventListener("pointermove", onMove);
      const resize = () => { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); };
      const observer = new ResizeObserver(resize); observer.observe(mount);
      let frame = 0;
      const animate = () => { frame = requestAnimationFrame(animate); group.rotation.y += 0.002 + pointer.x * 0.003; group.rotation.x += (pointer.y * 0.25 - group.rotation.x) * 0.025; wire.rotation.y -= 0.003; ring.rotation.z += 0.004; points.rotation.y += 0.0002; renderer.render(scene, camera); };
      animate();
      cleanup = () => { cancelAnimationFrame(frame); observer.disconnect(); mount.removeEventListener("pointermove", onMove); renderer.dispose(); orb.geometry.dispose(); (orb.material as { dispose: () => void }).dispose(); wire.geometry.dispose(); (wire.material as { dispose: () => void }).dispose(); ring.geometry.dispose(); (ring.material as { dispose: () => void }).dispose(); points.geometry.dispose(); (points.material as { dispose: () => void }).dispose(); if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement); };
    });
    return () => { disposed = true; cleanup(); };
  }, []);
  return <div className="public-scene" ref={mountRef}><div className="scene-orbit-label label-top">pointer-responsive / 01</div><div className="scene-orbit-label label-bottom">three.js canvas <span className="live-dot" /></div><div className="scene-glow" /></div>;
}

function PublicHeader({ page, theme, setTheme, language, setLanguage }: { page: PublicPage; theme: Theme; setTheme: (theme: Theme) => void; language: PublicLanguage; setLanguage: (language: PublicLanguage) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const copy = publicCopy[language];
  const nav = [["work", copy.work], ["integrations", copy.integrations], ["about", copy.about]] as const;
  return <header className="public-header"><a className="public-brand" href={url("/")}><span className="brand-mark"><span>S</span><span>F</span></span><span>siteforge<span>.</span></span></a><nav className={menuOpen ? "open" : ""}>{nav.map(([id, label]) => <a key={id} className={page === id ? "active" : ""} href={url(`/${id}`)}>{label}</a>)}</nav><div className="public-actions"><PublicLanguageSelect value={language} onChange={setLanguage} /><button className="public-theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Alternar tema">{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}</button><a className="public-login" href={url("/editor")}>{copy.signIn}</a><a className="public-cta small" href={url("/editor")}>{copy.editor} <ArrowRight size={14} /></a><button className="public-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button></div></header>;
}

function PublicShell({ page, children }: { page: PublicPage; children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => localStorage.getItem("siteforge-theme") === "light" ? "light" : "dark");
  const [language, setLanguage] = useState<PublicLanguage>(() => (localStorage.getItem("siteforge-language") as PublicLanguage) || "pt");
  const setTheme = (next: Theme) => { setThemeState(next); localStorage.setItem("siteforge-theme", next); document.documentElement.dataset.theme = next; };
  const setPublicLanguage = (next: PublicLanguage) => { setLanguage(next); localStorage.setItem("siteforge-language", next); };
  useEffect(() => { document.body.classList.add("public-body"); document.documentElement.dataset.theme = theme; document.title = `SiteForge — ${page[0].toUpperCase()}${page.slice(1)}`; return () => document.body.classList.remove("public-body"); }, [page, theme]);
  return <PublicLanguageContext.Provider value={language}><PublicLocaleContext.Provider value={publicLocale[language]}><div className="public-site"><PublicHeader page={page} theme={theme} setTheme={setTheme} language={language} setLanguage={setPublicLanguage} />{children}<footer className="public-footer"><div className="public-brand"><span className="brand-mark"><span>S</span><span>F</span></span><span>siteforge<span>.</span></span></div><span>{publicLocale[language].footer}</span><span>© 2026 SiteForge</span></footer></div></PublicLocaleContext.Provider></PublicLanguageContext.Provider>;
}

export default function PublicSite({ page }: PublicSiteProps) {
  if (page === "integrations") return <PublicShell page={page}><IntegrationsPage /></PublicShell>;
  if (page === "about") return <PublicShell page={page}><AboutPage /></PublicShell>;
  if (page === "work") return <PublicShell page={page}><WorkPage /></PublicShell>;
  return <PublicShell page="home"><HomePage /></PublicShell>;
}

function HomePage() {
  const copy = usePublicLocale().home;
  return <main className="public-main home-page"><section className="home-hero"><div className="hero-copy"><span className="public-kicker"><span className="live-dot" /> {copy.kicker}</span><h1>{copy.titleA}<br /><em>{copy.titleB}</em></h1><p>{copy.intro}</p><div className="hero-actions"><a className="public-cta" href={url("/editor")}>{copy.start} <ArrowRight size={15} /></a><a className="text-link" href={url("/work")}><CirclePlay size={15} /> {copy.work}</a></div><div className="hero-meta"><span><strong>{copy.native}</strong><small>{copy.nativeDetail}</small></span><span><strong>{copy.mouse}</strong><small>{copy.mouseDetail}</small></span><span><strong>{copy.type}</strong><small>{copy.typeDetail}</small></span></div></div><div className="hero-visual"><PublicScene /><div className="hero-floating-card"><span>Scene / orb-01</span><strong>{copy.cardTitle}</strong><span className="card-line" /><small><span className="live-dot" /> {copy.cardMeta}</small></div></div></section><section className="logo-strip"><span>{copy.built}</span><div><strong>designers</strong><strong>studios</strong><strong>founders</strong><strong>makers</strong></div></section><section className="feature-section"><div className="section-intro"><span className="public-kicker">{copy.system}</span><h2>{copy.systemTitleA}<br /><em>{copy.systemTitleB}</em></h2><p>{copy.systemCopy}</p></div><div className="feature-grid">{copy.features.map(([title, featureCopy], index) => <FeatureCard key={title} icon={[<Move3d />, <Palette />, <WandSparkles />][index]} index={`0${index + 1}`} title={title} copy={featureCopy} />)}</div></section><section className="manifesto-band"><span className="band-index">02 / 04</span><h2>{copy.manifestoA}<br /><em>{copy.manifestoB}</em></h2><a href={url("/editor")} className="round-arrow"><ArrowRight /></a></section><section className="public-bottom-cta"><span className="public-kicker">{copy.next}</span><h2>{copy.nextA}<br /><em>{copy.nextB}</em></h2><a className="public-cta" href={url("/editor")}>{copy.open} <ArrowRight size={15} /></a></section></main>;
}

function FeatureCard({ icon, index, title, copy }: { icon: React.ReactNode; index: string; title: string; copy: string }) {
  const language = usePublicLanguage();
  return <article className="feature-card"><div className="feature-card-top"><span className="feature-icon">{icon}</span><span>{index}</span></div><h3>{title}</h3><p>{copy}</p><a href={url("/editor")}>{language === "pt" ? "Explorar" : language === "es" ? "Explorar" : "Explore"} <ChevronRight size={14} /></a></article>;
}

function WorkPage() {
  const copy = usePublicLocale().workPage;
  const colors = ["lime", "purple", "orange"];
  return <main className="public-main inner-page work-page"><div className="inner-hero"><span className="public-kicker">{copy.kicker}</span><h1>{copy.titleA}<br /><em>{copy.titleB}</em></h1><p>{copy.intro}</p></div><div className="project-list">{copy.projects.map((project, index) => <a className={`project-card ${colors[index]}`} href={url("/editor")} key={project.title}><span className="project-number">0{index + 1}</span><div className="project-orb" /><div><span>{project.tag}</span><h2>{project.title}</h2></div><ArrowRight className="project-arrow" /></a>)}</div><div className="work-note"><Sparkles size={15} /> {copy.note}</div></main>;
}

function IntegrationsPage() {
  const copy = usePublicLocale().integrationsPage;
  return <main className="public-main inner-page integrations-page"><div className="inner-hero"><span className="public-kicker">{copy.kicker}</span><h1>{copy.titleA}<br /><em>{copy.titleB}</em></h1><p>{copy.intro}</p></div><div className="integration-public-grid">{integrations.map((item) => <article className={`integration-public-card ${item.color}`} key={item.name}><span className="integration-public-icon">{item.icon}</span><span className="integration-category">{item.category}</span><h2>{item.name}</h2><p>{item.copy}</p><a href={url("/editor")}>{copy.explore} <ArrowRight size={14} /></a></article>)}</div><section className="api-band"><div><span className="public-kicker">{copy.technical}</span><h2>{copy.apiA}<br /><em>{copy.apiB}</em></h2></div><p>{copy.apiCopy}</p><a className="public-outline" href={url("/editor")}>{copy.open} <ArrowRight size={14} /></a></section></main>;
}

function AboutPage() {
  const copy = usePublicLocale().about;
  return <main className="public-main inner-page about-page"><div className="about-split"><div className="inner-hero"><span className="public-kicker">{copy.kicker}</span><h1>{copy.titleA}<br /><em>{copy.titleB}</em></h1><p>{copy.intro}</p><a className="public-cta" href={url("/editor")}>{copy.cta} <ArrowRight size={14} /></a></div><div className="about-quote"><span>“</span><p>{copy.quote}</p><small>— {copy.principle}</small></div></div><div className="about-values">{copy.values.map(([title, value], index) => <div key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{value}</p></div>)}</div></main>;
}
