import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  AlignCenter,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Box,
  BoxSelect,
  ChevronDown,
  ChevronRight,
  Check,
  CircleHelp,
  Copy,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  GitBranch,
  Grid2X2,
  KeyRound,
  LogIn,
  LogOut,
  Image as ImageIcon,
  Layers3,
  Lock,
  Maximize2,
  Menu,
  Moon,
  MousePointer2,
  Move3d,
  Palette,
  PanelLeft,
  Play,
  Plus,
  Plug,
  Redo2,
  Rotate3d,
  Save,
  Search,
  ShieldCheck,
  Settings2,
  Sparkles,
  Square,
  Sun,
  Star,
  Trash2,
  Type,
  Undo2,
  Upload,
  UserRound,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { appPath, url } from "./paths";
import { beginGoogleLogin, getCurrentUser, loadCloudProject, saveCloudProject, signOutCloud } from "./supabase";

type Device = "desktop" | "tablet" | "mobile";
type InspectorTab = "design" | "animate";
type LayerKind = "scene" | "text" | "button" | "image" | "group";
type Theme = "dark" | "light";
type Language = "pt" | "en" | "es";

const languageMeta: Record<Language, { flag: string; short: string; name: string }> = {
  pt: { flag: "🇧🇷", short: "PT", name: "Português" },
  en: { flag: "🇺🇸", short: "EN", name: "English" },
  es: { flag: "🇪🇸", short: "ES", name: "Español" },
};

const uiCopy: Record<Language, { editor: string; projects: string; preview: string; backToEdit: string; publish: string; saving: string; saved: string; pages: string; layers: string; addPage: string; openEditor: string; newProject: string; signOut: string; language: string; workspace: string; cloudSync: string; lastEdited: string; visualSystem: string; blankCanvas: string; backToSite: string; membersOnly: string; buildA: string; buildB: string; loginDescription: string; continueGoogle: string }> = {
  pt: { editor: "Editor", projects: "Projetos", preview: "Pré-visualizar", backToEdit: "Voltar a editar", publish: "Publicar", saving: "Salvando", saved: "Salvo agora", pages: "Páginas", layers: "Camadas", addPage: "Adicionar página", openEditor: "Abrir editor", newProject: "Novo projeto", signOut: "Sair", language: "Idioma", workspace: "espaço de trabalho", cloudSync: "Sincronização na nuvem ativa", lastEdited: "Editado agora", visualSystem: "Sistema visual", blankCanvas: "Comece com uma tela em branco", backToSite: "Voltar ao SiteForge", membersOnly: "Espaço exclusivo para membros", buildA: "Crie a partir de um", buildB: "ponto de vista.", loginDescription: "Entre para montar sites, editar páginas, salvar projetos e conectar ferramentas MCP.", continueGoogle: "Continuar com Google" },
  en: { editor: "Editor", projects: "Projects", preview: "Preview", backToEdit: "Back to edit", publish: "Publish", saving: "Saving", saved: "Saved now", pages: "Pages", layers: "Layers", addPage: "Add page", openEditor: "Open editor", newProject: "New project", signOut: "Sign out", language: "Language", workspace: "workspace", cloudSync: "Cloud sync active", lastEdited: "Last edited just now", visualSystem: "Visual web system", blankCanvas: "Start with a blank canvas", backToSite: "Back to SiteForge", membersOnly: "Members-only workspace", buildA: "Build from a", buildB: "point of view.", loginDescription: "Sign in to build sites, edit pages, save projects and connect MCP tools.", continueGoogle: "Continue with Google" },
  es: { editor: "Editor", projects: "Proyectos", preview: "Vista previa", backToEdit: "Volver a editar", publish: "Publicar", saving: "Guardando", saved: "Guardado ahora", pages: "Páginas", layers: "Capas", addPage: "Añadir página", openEditor: "Abrir editor", newProject: "Nuevo proyecto", signOut: "Cerrar sesión", language: "Idioma", workspace: "espacio de trabajo", cloudSync: "Sincronización en la nube activa", lastEdited: "Editado ahora", visualSystem: "Sistema web visual", blankCanvas: "Empieza con una pantalla en blanco", backToSite: "Volver a SiteForge", membersOnly: "Espacio exclusivo para miembros", buildA: "Construye desde un", buildB: "punto de vista.", loginDescription: "Inicia sesión para crear sitios, editar páginas, guardar proyectos y conectar herramientas MCP.", continueGoogle: "Continuar con Google",  },
};

function LanguageSelect({ value, onChange }: { value: Language; onChange: (value: Language) => void }) {
  return <div className="language-select" role="group" aria-label={uiCopy[value].language}><div className="language-flag-strip">{(Object.keys(languageMeta) as Language[]).map((language) => <button type="button" className={language === value ? "active" : ""} key={language} aria-label={`${languageMeta[language].name} (${languageMeta[language].short})`} aria-pressed={language === value} onClick={() => onChange(language)}>{languageMeta[language].flag}</button>)}</div></div>;
}

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type Integration = {
  id: string;
  name: string;
  category: string;
  status: string;
  description: string;
};

type McpServer = {
  id: string;
  name: string;
  url: string;
  status: "connected" | "ready" | "draft";
  scope: "workspace" | "local";
};

type ProjectPayload = { pages: Page[]; layers: Omit<Layer, "icon">[]; selectedColor: string; font: string };

type Page = {
  id: string;
  name: string;
  path: string;
  accent: string;
  kind: "home" | "work" | "about";
};

type Layer = {
  id: string;
  name: string;
  kind: LayerKind;
  visible: boolean;
  locked: boolean;
  detail: string;
  icon: typeof Box;
};

const starterPages: Page[] = [
  { id: "home", name: "Home", path: "/editor", accent: "#b8ff3d", kind: "home" },
  { id: "work", name: "Work", path: "/editor/work", accent: "#ff7a66", kind: "work" },
  { id: "about", name: "About", path: "/editor/about", accent: "#8f9dff", kind: "about" },
];

const starterLayers: Layer[] = [
  { id: "hero", name: "Hero section", kind: "group", visible: true, locked: false, detail: "Frame · 1440 × 760", icon: BoxSelect },
  { id: "orb", name: "Orb / interactive", kind: "scene", visible: true, locked: false, detail: "Three.js · mesh", icon: Move3d },
  { id: "headline", name: "Headline", kind: "text", visible: true, locked: false, detail: "Space Grotesk · 64 px", icon: Type },
  { id: "cta", name: "CTA button", kind: "button", visible: true, locked: false, detail: "Button · primary", icon: Square },
  { id: "noise", name: "Noise texture", kind: "image", visible: true, locked: true, detail: "Image · 12% opacity", icon: ImageIcon },
];

const colorSwatches = ["#b8ff3d", "#ff7a66", "#8f9dff", "#f3f4f0", "#17191f"];

function iconForLayerKind(kind: LayerKind) {
  if (kind === "scene") return Move3d;
  if (kind === "text") return Type;
  if (kind === "button") return Square;
  if (kind === "image") return ImageIcon;
  return Box;
}

function hydrateLayers(layers: Layer[]): Layer[] {
  return layers.map((layer) => ({ ...layer, icon: typeof layer.icon === "function" ? layer.icon : iconForLayerKind(layer.kind) }));
}

function serializableLayers(layers: Layer[]) {
  return layers.map(({ icon: _icon, ...layer }) => layer);
}

function isProjectDraft(value: unknown): value is { pages: Page[]; layers: Layer[]; selectedColor?: string; font?: string } {
  if (!value || typeof value !== "object") return false;
  const draft = value as { pages?: unknown; layers?: unknown; selectedColor?: unknown; font?: unknown };
  return Array.isArray(draft.pages) && Array.isArray(draft.layers)
    && draft.pages.every((page) => Boolean(page && typeof page === "object" && typeof (page as Page).id === "string" && typeof (page as Page).path === "string"))
    && draft.layers.every((layer) => Boolean(layer && typeof layer === "object" && typeof (layer as Layer).id === "string" && typeof (layer as Layer).name === "string"))
    && (draft.selectedColor === undefined || (typeof draft.selectedColor === "string" && /^#[\da-f]{6}$/i.test(draft.selectedColor)))
    && (draft.font === undefined || (typeof draft.font === "string" && draft.font.length <= 64));
}

function SceneCanvas({ color, active, preview, onSelect }: { color: string; active: boolean; preview: boolean; onSelect: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const onSelectRef = useRef(onSelect);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#11131a");
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.1, 6.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.position.y = 0.12;
    scene.add(group);

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.18,
      metalness: 0.72,
      emissive: color,
      emissiveIntensity: 0.18,
    });
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 4), material);
    orb.castShadow = true;
    orb.receiveShadow = true;
    group.add(orb);
    materialRef.current = material;

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.31, 2),
      new THREE.MeshBasicMaterial({ color: "#e9ffbf", wireframe: true, transparent: true, opacity: 0.12 })
    );
    group.add(wire);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.64, 0.012, 10, 96),
      new THREE.MeshBasicMaterial({ color: "#b8ff3d", transparent: true, opacity: 0.66 })
    );
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 360;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const radius = 2.5 + Math.random() * 3.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi) * 0.7;
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: "#dfffa8", size: 0.018, transparent: true, opacity: 0.76 })
    );
    scene.add(stars);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3.4, 64),
      new THREE.MeshBasicMaterial({ color: "#1a1e26", transparent: true, opacity: 0.44 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.6;
    floor.scale.set(1.2, 0.42, 1);
    scene.add(floor);

    scene.add(new THREE.AmbientLight("#b5c2ff", 1.2));
    const keyLight = new THREE.PointLight("#dfffa8", 9, 10, 2);
    keyLight.position.set(2.7, 3.2, 4.4);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const fillLight = new THREE.PointLight("#777dff", 7, 9, 2);
    fillLight.position.set(-3.8, -1.4, 2.7);
    scene.add(fillLight);

    const resize = () => {
      const width = mount.clientWidth || 640;
      const height = mount.clientHeight || 460;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    };
    const onClick = () => onSelectRef.current();
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("click", onClick);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const pointer = pointerRef.current;
      const factor = preview ? 0.8 : 0.32;
      group.rotation.y += 0.004 + pointer.x * 0.0018;
      group.rotation.x += (pointer.y * factor - group.rotation.x) * 0.035;
      group.position.x += (pointer.x * 0.2 - group.position.x) * 0.022;
      ring.rotation.z += 0.003;
      wire.rotation.y -= 0.002;
      stars.rotation.y += 0.00025;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("click", onClick);
      renderer.dispose();
      material.dispose();
      orb.geometry.dispose();
      wire.material.dispose();
      wire.geometry.dispose();
      ring.material.dispose();
      ring.geometry.dispose();
      starGeometry.dispose();
      (stars.material as THREE.Material).dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [preview]);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.color.set(color);
    materialRef.current.emissive.set(color);
  }, [color]);

  return (
    <div ref={mountRef} className={`scene-canvas ${active ? "is-active" : ""}`} aria-label="Canvas Three.js interativo">
      <div className="scene-crosshair"><span /><span /></div>
      <div className="scene-caption"><span className="live-dot" /> {preview ? "Interação ao vivo" : "Canvas 3D"}</div>
      <div className="scene-axis"><span>Y</span><i /><span>X</span><i className="axis-z" /><span>Z</span></div>
    </div>
  );
}

function App() {
  const [pages, setPages] = useState<Page[]>(starterPages);
  const [activePageId, setActivePageId] = useState("home");
  const [layers, setLayers] = useState<Layer[]>(starterLayers);
  const [selectedLayerId, setSelectedLayerId] = useState("orb");
  const [activeInspector, setActiveInspector] = useState<InspectorTab>("design");
  const [activeSide, setActiveSide] = useState<"pages" | "layers">("pages");
  const [device, setDevice] = useState<Device>("desktop");
  const [routePath, setRoutePath] = useState(() => appPath() || "/editor");
  const [preview, setPreview] = useState(() => appPath() === "/preview");
  const [selectedColor, setSelectedColor] = useState("#b8ff3d");
  const [font, setFont] = useState("Space Grotesk");
  const [toast, setToast] = useState("");
  const [zoom, setZoom] = useState(82);
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("siteforge-theme") as Theme) || "dark");
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("siteforge-language") as Language) || "pt");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [mcpServers, setMcpServers] = useState<McpServer[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("siteforge-mcp-servers") || "null");
      if (Array.isArray(saved)) return saved;
    } catch { /* use the safe starter registry */ }
    return [{ id: "manus-tools", name: "Manus Tools", url: "manus://tools", status: "connected", scope: "workspace" }];
  });
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [saving, setSaving] = useState(false);
  const ui = uiCopy[language];
  const projectsRoute = routePath === "/projects";

  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId) ?? layers[1];
  const sceneLayer = layers.find((layer) => layer.id === "orb");
  const layerCount = layers.filter((layer) => layer.visible).length;
  const pageContent = {
    pt: { home: { eyebrow: "Camada selecionada · Orb / interativo", first: "Design", second: "em movimento.", description: "Crie sites que parecem menos páginas\ne mais lugares." }, work: { eyebrow: "Estudo de caso · Canvas selecionado", first: "Cause", second: "impacto.", description: "Transforme ideias fortes em espaços digitais\npara os quais as pessoas querem voltar." }, about: { eyebrow: "Sistema do estúdio · Página sobre", first: "Feito para", second: "a curiosidade.", description: "Construa um ponto de vista com ferramentas\nque se movem na velocidade do pensamento." } },
    en: { home: { eyebrow: "Selected layer · Orb / interactive", first: "Design", second: "in motion.", description: "Build websites that feel less like pages\nand more like places." }, work: { eyebrow: "Case study · Selected canvas", first: "Make", second: "an impact.", description: "Turn bold ideas into digital spaces\npeople want to return to." }, about: { eyebrow: "Studio system · About page", first: "Built for", second: "curiosity.", description: "Shape a point of view with tools\nthat move at the speed of thought." } },
    es: { home: { eyebrow: "Capa seleccionada · Orb / interactivo", first: "Diseño", second: "en movimiento.", description: "Crea sitios que se sientan menos como páginas\ny más como lugares." }, work: { eyebrow: "Caso de estudio · Canvas seleccionado", first: "Causa", second: "impacto.", description: "Convierte ideas fuertes en espacios digitales\na los que la gente quiera volver." }, about: { eyebrow: "Sistema del estudio · Página sobre", first: "Hecho para", second: "la curiosidad.", description: "Construye un punto de vista con herramientas\nque se mueven al ritmo del pensamiento." } },
  }[language][activePage?.kind ?? "home"];

  useEffect(() => {
    const syncRoute = () => {
      const path = appPath();
      setRoutePath(path);
      const page = pages.find((item) => item.path === path);
      if (page) setActivePageId(page.id);
      setPreview(path === "/preview");
    };
    syncRoute();
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, [pages]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("siteforge-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("siteforge-language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("siteforge-mcp-servers", JSON.stringify(mcpServers));
  }, [mcpServers]);

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setAuthUser(user);
          const project = (await loadCloudProject()) as Partial<ProjectPayload> | null;
          if (project?.pages?.length) setPages(project.pages);
          if (project?.layers?.length) setLayers(hydrateLayers(project.layers));
          if (project?.selectedColor) setSelectedColor(project.selectedColor);
          if (project?.font) setFont(project.font);
        }
      } catch {
        // A sessão indisponível mantém o workspace bloqueado até o login real.
      } finally {
        setAuthLoading(false);
      }
    };
    loadAccount();
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authState = params.get("auth");
    if (authState === "success") notify("Conta Google conectada · seu editor está sincronizado");
    if (authState) window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const saveProject = async (nextPayload?: ProjectPayload) => {
    const payload = nextPayload ?? { pages, layers: serializableLayers(layers), selectedColor, font };
    const draftKey = authUser ? `siteforge-project:${authUser.id}` : "siteforge-project:anonymous";
    localStorage.setItem(draftKey, JSON.stringify(payload));
    if (!authUser) {
      notify("Rascunho salvo localmente · entre para sincronizar");
      return;
    }
    setSaving(true);
    try {
      await saveCloudProject(payload);
      notify("Projeto sincronizado com sua conta");
    } catch {
      notify("Salvo localmente · sincronização indisponível");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    const draftKey = authUser ? `siteforge-project:${authUser.id}` : "siteforge-project:anonymous";
    const saved = localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      const value: unknown = JSON.parse(saved);
      if (!isProjectDraft(value)) throw new Error("invalid_local_draft");
      if (value.pages.length) setPages(value.pages);
      if (value.layers.length) setLayers(hydrateLayers(value.layers));
      if (value.selectedColor) setSelectedColor(value.selectedColor);
      if (value.font) setFont(value.font);
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [authLoading, authUser]);

  const addPage = () => {
    const nextNumber = pages.length + 1;
    const page: Page = { id: `page-${Date.now()}`, name: `Page ${nextNumber}`, path: `/editor/page-${nextNumber}`, accent: "#f3f4f0", kind: "about" };
    setPages((current) => [...current, page]);
    setActivePageId(page.id);
    notify("Nova página adicionada");
  };

  const selectPage = (page: Page) => {
    setActivePageId(page.id);
    window.history.pushState({}, "", url(page.path));
    setRoutePath(page.path);
    setPreview(false);
  };

  const openProjects = () => {
    window.history.pushState({}, "", url("/projects"));
    setRoutePath("/projects");
    setPreview(false);
  };

  const openEditor = (path = activePage?.path || "/editor") => {
    window.history.pushState({}, "", url(path));
    setRoutePath(path);
    setPreview(path === "/preview");
  };

  const createProject = () => {
    const nextPayload: ProjectPayload = { pages: starterPages, layers: serializableLayers(starterLayers), selectedColor: "#b8ff3d", font: "Space Grotesk" };
    setPages(starterPages);
    setLayers(starterLayers);
    setSelectedLayerId("orb");
    setSelectedColor("#b8ff3d");
    setFont("Space Grotesk");
    setActivePageId("home");
    openEditor("/editor");
    void saveProject(nextPayload);
    notify(ui.newProject);
  };

  const duplicatePage = (source: Page = activePage) => {
    if (!source) return;
    const sourcePath = source.path.startsWith("/editor/") ? source.path : `/editor${source.path.startsWith("/") ? source.path : `/${source.path}`}`;
    const copy: Page = { ...source, id: `copy-${Date.now()}`, name: `${source.name} copy`, path: `${sourcePath}-copy` };
    setPages((current) => [...current, copy]);
    setActivePageId(copy.id);
    notify("Página duplicada");
  };

  const removePage = (pageId: string) => {
    if (pages.length <= 1) return notify("O projeto precisa ter uma página");
    const remaining = pages.filter((page) => page.id !== pageId);
    setPages(remaining);
    if (activePageId === pageId) setActivePageId(remaining[0].id);
    notify("Página removida");
  };

  const addLayer = (kind: LayerKind, name: string, icon: typeof Box, detail: string) => {
    const layer: Layer = { id: `${kind}-${Date.now()}`, name, kind, visible: true, locked: false, detail, icon };
    setLayers((current) => [layer, ...current]);
    setSelectedLayerId(layer.id);
    notify(`${name} inserido no canvas`);
  };

  const updateLayer = (id: string, changes: Partial<Layer>) => {
    setLayers((current) => current.map((layer) => layer.id === id ? { ...layer, ...changes } : layer));
  };

  const selectedIndex = useMemo(() => Math.max(0, layers.findIndex((layer) => layer.id === selectedLayerId)), [layers, selectedLayerId]);

  const moveSelected = (direction: "up" | "down") => {
    if (selectedLayer?.locked) return notify("Desbloqueie a layer para reordená-la");
    const nextIndex = direction === "up" ? selectedIndex - 1 : selectedIndex + 1;
    if (nextIndex < 0 || nextIndex >= layers.length) return;
    const nextLayers = [...layers];
    [nextLayers[selectedIndex], nextLayers[nextIndex]] = [nextLayers[nextIndex], nextLayers[selectedIndex]];
    setLayers(nextLayers);
  };

  const beginLogin = () => {
    beginGoogleLogin();
  };

  const logout = async () => {
    await signOutCloud();
    setAuthUser(null);
    setAuthOpen(false);
    notify("Sessão encerrada");
  };

  const openIntegrations = async () => {
    if (!authUser) {
      setAuthOpen(true);
      return;
    }
    try {
      const response = await fetch(url("/api/integrations"));
      const data = await response.json();
      setIntegrations(data.integrations || []);
      setIntegrationsOpen(true);
    } catch {
      notify("Não foi possível carregar as integrações");
    }
  };

  const openMcp = () => setMcpOpen(true);

  const addMcpServer = (server: { name: string; url: string }) => {
    const url = server.url.trim();
    if (!server.name.trim() || !/^(https:\/\/|mcp:\/\/|manus:\/\/)/i.test(url)) {
      notify("Use um nome e uma URL MCP válida (https://, mcp:// ou manus://)");
      return;
    }
    setMcpServers((current) => [...current, { id: `mcp-${Date.now()}`, name: server.name.trim(), url, status: "draft", scope: "local" }]);
    notify("Servidor MCP adicionado ao workspace");
  };

  if (authLoading) return <AuthLoadingScreen />;
  if (!authUser) return <LoginRequiredScreen language={language} onLanguageChange={setLanguage} onLogin={beginLogin} />;
  if (projectsRoute) return <ProjectsScreen user={authUser} pages={pages} language={language} onLanguageChange={setLanguage} onOpenEditor={openEditor} onNewProject={createProject} onLogout={logout} />;

  return (
    <main className={`app-shell ${preview ? "preview-mode" : ""}`}>
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><span>S</span><span>F</span></div>
          <div><div className="brand-name">siteforge<span>.</span></div><div className="brand-tag">visual web editor</div></div>
        </div>
        <div className="project-meta"><span className="status-pulse" /> <strong>Untitled project</strong><span className="meta-divider" /> <span className="muted">Saved 2 min ago</span></div>
        <div className="top-actions">
          <button className="icon-button subtle" aria-label="Desfazer"><Undo2 size={15} /></button>
          <button className="icon-button subtle" aria-label="Refazer"><Redo2 size={15} /></button>
          <span className="top-divider" />
          <LanguageSelect value={language} onChange={setLanguage} />
          <button className="icon-button subtle" aria-label="Alternar tema" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}</button>
          <button className="secondary-button" onClick={() => setPreview((value) => !value)}><Play size={14} fill="currentColor" /> {preview ? ui.backToEdit : ui.preview}</button>
          <button className="publish-button" onClick={async () => { await saveProject(); notify(authUser ? "Versão sincronizada e pronta para publicar" : "Versão local pronta para publicar"); }}><Sparkles size={15} /> {saving ? ui.saving : ui.publish}</button>
          <button className={`avatar-button ${authUser ? "signed-in" : ""}`} aria-label={authUser ? "Abrir conta" : "Entrar"} onClick={() => setAuthOpen(true)}>{authUser ? (authUser.name || authUser.email).slice(0, 2).toUpperCase() : <LogIn size={14} />}</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="left-rail">
          <div className="rail-top">
            <button className="rail-icon active" aria-label="Editor"><MousePointer2 size={17} /></button>
            <button className="rail-icon" aria-label={ui.projects} onClick={openProjects}><FolderOpen size={17} /></button>
            <button className="rail-icon" aria-label="Assets"><Grid2X2 size={17} /></button>
            <button className="rail-icon" aria-label="MCP" onClick={openMcp}><Plug size={17} /></button>
            <button className="rail-icon" aria-label="Configurações" onClick={openIntegrations}><Settings2 size={17} /></button>
          </div>
          <div className="rail-bottom"><button className="rail-icon" aria-label="Ajuda"><CircleHelp size={17} /></button><div className="rail-line" /><button className="rail-icon"><div className="tiny-avatar">JD</div></button></div>
        </aside>

        <aside className="sidebar left-sidebar">
          <div className="panel-heading"><div><span className="eyebrow">Project</span><h2>Structure</h2></div><button className="icon-button" onClick={() => setShowMenu((value) => !value)}><Menu size={16} /></button></div>
          {showMenu && <div className="quick-menu"><button onClick={() => { void saveProject(); }}><Save size={14} /> Save project</button><button onClick={addPage}><Plus size={14} /> Add page</button><button onClick={openIntegrations}><Plug size={14} /> Integrations</button><button onClick={openMcp}><Plug size={14} /> MCP servers</button><button onClick={() => notify("Templates estarão disponíveis em breve")}><WandSparkles size={14} /> Browse templates</button></div>}
          <div className="segmented-tabs"><button className={activeSide === "pages" ? "active" : ""} onClick={() => setActiveSide("pages")}><FileText size={13} /> Pages <span>{pages.length}</span></button><button className={activeSide === "layers" ? "active" : ""} onClick={() => setActiveSide("layers")}><Layers3 size={13} /> Layers</button></div>
          {activeSide === "pages" ? (
            <div className="sidebar-scroll page-list">
              <div className="section-label-row"><span>Pages</span><button onClick={addPage}><Plus size={14} /></button></div>
              {pages.map((page, index) => <div key={page.id} className={`page-card ${page.id === activePageId ? "active" : ""}`} role="button" tabIndex={0} onClick={() => selectPage(page)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") selectPage(page); }}><div className={`page-thumb thumb-${page.kind}`}><div className="thumb-orb" style={{ background: page.accent }} /><span>{String(index + 1).padStart(2, "0")}</span><div className="thumb-lines" /></div><div className="page-card-info"><strong>{page.name}</strong><span>{page.path}</span></div><button className="page-copy" aria-label={`Duplicar ${page.name}`} onClick={(event) => { event.stopPropagation(); selectPage(page); duplicatePage(page); }}><Copy size={12} /></button><button className="page-more" aria-label={`Excluir ${page.name}`} onClick={(event) => { event.stopPropagation(); removePage(page.id); }}><Trash2 size={13} /></button></div>)}
              <button className="add-page-dashed" onClick={addPage}><Plus size={14} /> Add new page</button>
              <div className="sidebar-note"><span className="note-icon"><Zap size={13} fill="currentColor" /></span><div><strong>Quick tip</strong><p>Use <kbd>⌘</kbd><kbd>K</kbd> to search any layer.</p></div></div>
            </div>
          ) : (
            <div className="sidebar-scroll layer-list">
              <div className="section-label-row"><span>Home · Layers</span><button onClick={() => addLayer("group", "Container", Box, "Frame · auto")}> <Plus size={14} /></button></div>
              <div className="layer-tree">
                {layers.map((layer) => { const Icon = layer.icon ?? iconForLayerKind(layer.kind); return <div key={layer.id} className={`layer-row ${layer.id === selectedLayerId ? "selected" : ""} ${layer.locked ? "locked" : ""}`} onClick={() => !layer.locked && setSelectedLayerId(layer.id)}><ChevronRight size={13} className="tree-chevron" /><Icon size={14} className={`layer-kind ${layer.kind}`} /><div className="layer-copy"><strong>{layer.name}</strong><span>{layer.detail}</span></div><button className="layer-action" onClick={(event) => { event.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}>{layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}</button><button className="layer-action" onClick={(event) => { event.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); }}>{layer.locked ? <Lock size={12} fill="currentColor" /> : <span className="lock-empty" />}</button></div>; })}
              </div>
              <div className="layer-actions"><button onClick={() => moveSelected("up")}><ArrowUp size={13} /> Bring forward</button><button onClick={() => moveSelected("down")}><ArrowDown size={13} /> Send backward</button></div>
            </div>
          )}
          <div className="sidebar-footer"><div className="sync-status"><span className="live-dot" /> {authUser ? "Cloud project" : "Local project"} <span className="muted">·</span> {layerCount} layers</div><button className="icon-button" onClick={openIntegrations} aria-label="Abrir integrações"><Upload size={15} /></button></div>
        </aside>

        <section className="editor-stage">
          <div className="stage-toolbar">
            <div className="toolbar-group"><button className="tool-button active"><MousePointer2 size={15} /> Select</button><button className="tool-button"><BoxSelect size={15} /> Frame</button><button className="tool-button"><Type size={15} /> Type</button><button className="tool-button"><ImageIcon size={15} /> Media</button><button className="tool-button"><Move3d size={15} /> 3D</button></div>
            <div className="toolbar-center"><button className={`device-button ${device === "desktop" ? "active" : ""}`} onClick={() => setDevice("desktop")}><Maximize2 size={13} /> Desktop</button><button className={`device-button ${device === "tablet" ? "active" : ""}`} onClick={() => setDevice("tablet")}><Square size={12} /> Tablet</button><button className={`device-button ${device === "mobile" ? "active" : ""}`} onClick={() => setDevice("mobile")}><PanelLeft size={12} /> Mobile</button></div>
            <div className="toolbar-group right"><button className="icon-button"><Search size={15} /></button><button className="icon-button"><Grid2X2 size={15} /></button><button className="zoom-button" onClick={() => setZoom((value) => value >= 100 ? 60 : value + 10)}>{zoom}% <ChevronDown size={13} /></button></div>
          </div>
          <div className="canvas-wrap">
            <div className="canvas-topline"><span><span className="canvas-dot" /> {activePage?.name} <span className="muted">/ {activePage?.path}</span></span><span className="canvas-coordinates">x: 0 · y: 0 <span className="muted">·</span> 1440 × 900</span></div>
            <div className={`artboard-shell device-${device}`} style={{ transform: `scale(${zoom / 100})` }}>
              <div className="artboard-grid" />
              <div className="artboard-copy" style={{ fontFamily: font }}><span className="art-eyebrow">{pageContent.eyebrow}</span><h1>{pageContent.first}<br /><em>{pageContent.second}</em></h1><p>{pageContent.description.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</p><button className="art-cta">Explore the system <ArrowRight size={14} /></button></div>
              {sceneLayer?.visible !== false && <SceneCanvas color={selectedColor} active={selectedLayer?.kind === "scene"} preview={preview} onSelect={() => sceneLayer?.locked ? notify("A layer 3D está bloqueada") : setSelectedLayerId("orb")} />}
              <div className="art-footer"><span>Scroll to explore</span><span className="footer-line" /><span>01 / 04</span></div>
              <div className="selection-box selection-box-large"><span className="selection-label">Hero section · frame</span><i /><i /><i /><i /></div>
              <div className="cursor-label cursor-a"><span className="cursor-dot" /> You</div>
              <div className="cursor-label cursor-b"><span className="cursor-dot purple" /> Alex</div>
            </div>
            <div className="canvas-bottomline"><div className="canvas-hint"><span className="key-hint">Space</span> to pan <span className="key-hint">⌘</span><span className="key-hint">+</span><span className="key-hint">K</span> quick actions</div><div className="canvas-info"><span><span className="live-dot" /> Live sync</span><span>Updated just now</span></div></div>
          </div>
        </section>

        <aside className="sidebar right-sidebar">
          <div className="inspector-heading"><div><span className="eyebrow">Inspector</span><h2>{selectedLayer?.name ?? "Layer"}</h2></div><button className="icon-button"><MoreDots /></button></div>
          <div className="inspector-tabs"><button className={activeInspector === "design" ? "active" : ""} onClick={() => setActiveInspector("design")}><Palette size={14} /> Design</button><button className={activeInspector === "animate" ? "active" : ""} onClick={() => setActiveInspector("animate")}><WandSparkles size={14} /> Animate <span className="new-badge">NEW</span></button></div>
          {activeInspector === "design" ? <div className="inspector-scroll">
            <div className="inspector-section"><div className="inspector-section-title">Layout <ChevronDown size={14} /></div><div className="property-grid"><Property label="X" value="420" /><Property label="Y" value="180" /><Property label="W" value="600" /><Property label="H" value="480" /></div><div className="property-line"><span>Position</span><div className="segmented-mini"><button className="active">Abs</button><button>Rel</button><button>Fix</button></div></div></div>
            <div className="inspector-section"><div className="inspector-section-title">Transform <ChevronDown size={14} /></div><div className="property-grid"><Property label="Rotate" value="12°" icon={<Rotate3d size={12} />} /><Property label="Scale" value="1.0" /><Property label="Radius" value="24" /><Property label="Opacity" value="100%" /></div></div>
            <div className="inspector-section"><div className="inspector-section-title">Appearance <ChevronDown size={14} /></div><div className="color-row"><span>Fill</span><button className="color-control" onClick={() => setSelectedColor(selectedColor === "#b8ff3d" ? "#8f9dff" : "#b8ff3d")}><span style={{ background: selectedColor }} />{selectedColor}<ChevronRight size={13} /></button></div><div className="color-row"><span>Gradient</span><button className="gradient-control"><span />linear · 135° <ChevronRight size={13} /></button></div><div className="swatch-row">{colorSwatches.map((color) => <button key={color} className={`swatch ${selectedColor === color ? "active" : ""}`} style={{ background: color }} onClick={() => setSelectedColor(color)} aria-label={`Selecionar cor ${color}`} />)}<button className="swatch-add"><Plus size={13} /></button></div></div>
            <div className="inspector-section"><div className="inspector-section-title">Typography <ChevronDown size={14} /></div><div className="select-field"><Type size={13} /><select value={font} onChange={(event) => setFont(event.target.value)}><option>Space Grotesk</option><option>DM Sans</option><option>Instrument Serif</option></select><ChevronDown size={13} /></div><div className="property-grid"><Property label="Weight" value="Medium" /><Property label="Size" value="64 px" /><Property label="Line" value="0.95" /><Property label="Track" value="-0.03em" /></div></div>
            <div className="inspector-section"><div className="inspector-section-title">Effects <ChevronDown size={14} /></div><div className="effect-row"><div className="effect-icon"><Sparkles size={14} /></div><div><strong>Soft glow</strong><span>Screen · 22%</span></div><button className="toggle active"><span /></button></div><div className="effect-row"><div className="effect-icon dark"><Box size={14} /></div><div><strong>Noise texture</strong><span>Overlay · 12%</span></div><button className="toggle active"><span /></button></div></div>
          </div> : <div className="inspector-scroll"><div className="animation-card"><div className="animation-icon"><MousePointer2 size={16} /></div><div><span className="eyebrow">Pointer interaction</span><h3>Follow cursor</h3><p>Object subtly leans toward the pointer position.</p></div><button className="toggle active"><span /></button></div><div className="inspector-section"><div className="inspector-section-title">Trigger <ChevronDown size={14} /></div><div className="select-field"><MousePointer2 size={13} /><select><option>On mouse move</option><option>On click</option><option>On page enter</option></select><ChevronDown size={13} /></div></div><div className="inspector-section"><div className="inspector-section-title">Motion curve <ChevronDown size={14} /></div><div className="curve-preview"><span /><span /><span /><span /><span /></div><div className="curve-labels"><span>Gentle</span><span>Spring</span></div></div><div className="inspector-section"><div className="inspector-section-title">Response <ChevronDown size={14} /></div><Property label="Intensity" value="32%" /><Property label="Duration" value="800 ms" /><Property label="Delay" value="0 ms" /></div></div>}
          <div className="inspector-footer"><button className="delete-button" onClick={() => { if (selectedLayer?.locked) return notify("Desbloqueie a layer antes de removê-la"); setLayers((current) => current.filter((layer) => layer.id !== selectedLayerId)); setSelectedLayerId("hero"); notify("Layer removida"); }}><Trash2 size={14} /> Delete layer</button><span className="muted">{selectedLayer?.locked ? "Locked" : "Editable"}</span></div>
        </aside>
      </div>

      {!preview && <div className="bottom-dock"><div className="dock-label"><span className="dock-icon"><Plus size={14} /></span><strong>Add to canvas</strong></div><button onClick={() => addLayer("text", "Text block", Type, "Space Grotesk · 24 px")}><Type size={14} /> Text</button><button onClick={() => addLayer("button", "Button", Square, "Button · secondary")}><Square size={14} /> Button</button><button onClick={() => addLayer("image", "Image", ImageIcon, "Image · crop fill")}><ImageIcon size={14} /> Image</button><button onClick={() => addLayer("group", "Container", Box, "Frame · auto layout")}><Box size={14} /> Container</button><button onClick={() => addLayer("scene", "3D object", Move3d, "Three.js · mesh")}><Move3d size={14} /> 3D object</button><span className="dock-spacer" /><button className="dock-more" onClick={() => notify("Mais blocos chegando na próxima versão")}><Plus size={14} /> More</button></div>}
      {preview && <div className="preview-banner"><span><span className="live-dot" /> Preview mode</span><span>Move your cursor over the canvas to feel the scene respond.</span><button onClick={() => setPreview(false)}><X size={14} /> Exit preview</button></div>}
      {authOpen && <AuthModal user={authUser} onClose={() => setAuthOpen(false)} onLogin={beginLogin} onLogout={logout} />}
      {integrationsOpen && <IntegrationsModal integrations={integrations} onClose={() => setIntegrationsOpen(false)} onNotify={notify} />}
      {mcpOpen && <McpModal servers={mcpServers} onClose={() => setMcpOpen(false)} onAdd={addMcpServer} onRemove={(id) => setMcpServers((current) => current.filter((server) => server.id !== id))} />}
      {toast && <div className="toast"><span className="toast-check">✓</span>{toast}</div>}
    </main>
  );
}

function ProjectsScreen({ user, pages, language, onLanguageChange, onOpenEditor, onNewProject, onLogout }: { user: AuthUser; pages: Page[]; language: Language; onLanguageChange: (language: Language) => void; onOpenEditor: (path?: string) => void; onNewProject: () => void; onLogout: () => void }) {
  const ui = uiCopy[language];
  const title = language === "pt" ? "Dê forma às suas ideias." : language === "es" ? "Dale forma a tus ideas." : "Shape your ideas.";
  const intro = language === "pt" ? "Abra um projeto existente ou comece uma nova superfície visual." : language === "es" ? "Abre un proyecto existente o empieza una nueva superficie visual." : "Open an existing project or start a new visual surface.";
  return <main className="projects-screen"><header className="projects-topbar"><a className="brand-lockup" href={url("/")}><div className="brand-mark"><span>S</span><span>F</span></div><div><div className="brand-name">siteforge<span>.</span></div><div className="brand-tag">{ui.workspace}</div></div></a><div className="projects-actions"><LanguageSelect value={language} onChange={onLanguageChange} /><button className="projects-account" onClick={onLogout}><span>{(user.name || user.email).slice(0, 2).toUpperCase()}</span>{user.name || user.email}<LogOut size={14} /></button></div></header><section className="projects-content"><div className="projects-heading"><div><span className="eyebrow">{ui.projects} / {ui.workspace}</span><h1>{title}</h1><p>{intro}</p></div><button className="publish-button" onClick={onNewProject}><Plus size={15} /> {ui.newProject}</button></div><div className="projects-toolbar"><span><FolderOpen size={14} /> {pages.length} {ui.pages.toLowerCase()}</span><span className="projects-cloud"><span className="live-dot" /> {ui.cloudSync}</span></div><div className="projects-grid"><article className="project-tile featured" onClick={() => onOpenEditor("/editor")}><div className="project-preview project-preview-orb"><span className="project-preview-kicker">SITEFORGE / 01</span><div className="project-preview-orb-shape" /><span className="project-preview-caption">Design<br /><em>in motion.</em></span></div><div className="project-tile-copy"><div><span className="eyebrow">{ui.lastEdited}</span><h2>{language === "pt" ? "Projeto sem nome" : language === "es" ? "Proyecto sin nombre" : "Untitled project"}</h2><p>{ui.visualSystem} · {pages.length} {ui.pages.toLowerCase()}</p></div><button className="project-open" onClick={(event) => { event.stopPropagation(); onOpenEditor("/editor"); }}>{ui.openEditor} <ArrowRight size={14} /></button></div></article><button className="project-new-tile" onClick={onNewProject}><span className="project-new-icon"><Plus size={20} /></span><strong>{ui.newProject}</strong><span>{ui.blankCanvas}</span></button></div></section></main>;
}

function AuthLoadingScreen() {
  return <main className="auth-gate"><div className="auth-gate-card loading-card"><div className="brand-mark"><span>S</span><span>F</span></div><span className="eyebrow">Secure workspace</span><h1>Checking your<br /><em>session.</em></h1><p>Estamos preparando seu espaço de criação.</p><span className="auth-spinner" /></div></main>;
}

function LoginRequiredScreen({ language, onLanguageChange, onLogin }: { language: Language; onLanguageChange: (language: Language) => void; onLogin: () => void }) {
  const ui = uiCopy[language];
  return <main className="auth-gate"><div className="auth-language"><LanguageSelect value={language} onChange={onLanguageChange} /></div><div className="auth-gate-card"><a className="auth-back-link" href={url("/")}><ArrowLeft size={14} /> {ui.backToSite}</a><div className="modal-brand"><div className="brand-mark"><span>S</span><span>F</span></div><span>siteforge<span>.</span></span></div><span className="eyebrow">{ui.membersOnly}</span><h1>{ui.buildA}<br /><em>{ui.buildB}</em></h1><p>{ui.loginDescription}</p><div className="security-list"><span><ShieldCheck size={15} /> {language === "pt" ? "Login oficial Google" : language === "es" ? "Inicio oficial Google" : "Official Google login"}</span><span><CloudIcon /> {language === "pt" ? "Edições sincronizadas na nuvem" : language === "es" ? "Ediciones sincronizadas en la nube" : "Edits synced to the cloud"}</span><span><KeyRound size={15} /> {language === "pt" ? "Seu workspace protegido" : language === "es" ? "Tu espacio protegido" : "Your workspace is protected"}</span></div><button className="login-button" onClick={onLogin}><LogIn size={15} /> {ui.continueGoogle} <ArrowRight size={15} /></button><p className="legal-copy">{language === "pt" ? "O editor só fica disponível depois da confirmação da sua sessão." : language === "es" ? "El editor estará disponible después de confirmar tu sesión." : "The editor becomes available after your session is confirmed."}</p></div></main>;
}
function AuthModal({ user, onClose, onLogin, onLogout }: { user: AuthUser | null; onClose: () => void; onLogin: () => void; onLogout: () => void }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal-card auth-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={15} /></button><div className="modal-brand"><div className="brand-mark"><span>S</span><span>F</span></div><span>siteforge<span>.</span></span></div>{user ? <><span className="eyebrow">Account</span><h2 className="modal-title">Good to see you, {user.name || "creator"}.</h2><p className="modal-copy">Sua conta está conectada e seu projeto pode sincronizar com o cloud.</p><div className="account-card"><div className="account-avatar">{(user.name || user.email).slice(0, 2).toUpperCase()}</div><div><strong>{user.name || "Membro Google"}</strong><span>{user.email || "Conta Google"}</span></div></div><div className="modal-actions"><button className="modal-secondary danger" onClick={onLogout}><LogOut size={14} /> Sair</button></div></> : <><span className="eyebrow">Secure access</span><h2 className="modal-title">Your canvas,<br /><em>everywhere.</em></h2><p className="modal-copy">Entre com sua conta Google para sincronizar projetos e publicar experiências.</p><div className="security-list"><span><ShieldCheck size={15} /> OAuth Google seguro</span><span><CloudIcon /> Seus drafts sincronizados no cloud</span><span><KeyRound size={15} /> Workspace protegido</span></div><button className="login-button" onClick={onLogin}><LogIn size={15} /> Continue with Google <ArrowRight size={15} /></button><p className="legal-copy">Ao continuar, você será redirecionado para o provedor Manus.</p></>}</section></div>;
}
function McpModal({ servers, onClose, onAdd, onRemove }: { servers: McpServer[]; onClose: () => void; onAdd: (server: { name: string; url: string }) => void; onRemove: (id: string) => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal-card mcp-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={15} /></button><div className="modal-kicker"><Plug size={14} /> MCP / tools</div><h2 className="modal-title">Bring your tools<br /><em>into the canvas.</em></h2><p className="modal-copy">Conecte servidores Model Context Protocol para trazer conteúdo, automações e contexto para o SiteForge.</p><div className="mcp-security-note"><KeyRound size={14} /><span>Tokens não são armazenados no navegador. Use um conector seguro para autenticar servidores privados.</span></div><div className="mcp-server-list">{servers.map((server) => <div className="mcp-server-row" key={server.id}><div className="mcp-server-icon"><Plug size={15} /></div><div className="mcp-server-copy"><strong>{server.name}</strong><span>{server.url} · {server.scope}</span></div><span className={`mcp-status ${server.status}`}>{server.status === "connected" ? "Connected" : server.status === "ready" ? "Ready" : "Draft"}</span>{server.id !== "manus-tools" && <button className="icon-button" aria-label={`Remover ${server.name}`} onClick={() => onRemove(server.id)}><Trash2 size={13} /></button>}</div>)}</div><div className="mcp-add-form"><span className="eyebrow">Add a server</span><div className="mcp-fields"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Server name" /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://your-mcp-server.com" /></div><button className="login-button" onClick={() => { onAdd({ name, url }); setName(""); setUrl(""); }}><Plus size={15} /> Add MCP server <ArrowRight size={15} /></button></div><p className="legal-copy">Compatível com endpoints https://, mcp:// e manus://. A conexão efetiva depende da autenticação do servidor.</p></section></div>;
}

function IntegrationsModal({ integrations, onClose, onNotify }: { integrations: Integration[]; onClose: () => void; onNotify: (message: string) => void }) {
  const iconFor = (id: string) => id === "github" ? <GitBranch size={16} /> : id === "notion" ? <FileText size={16} /> : <GaugeIcon />;
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal-card integrations-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={15} /></button><div className="modal-kicker"><Plug size={14} /> Integrations</div><h2 className="modal-title">Connect your<br /><em>creative stack.</em></h2><p className="modal-copy">Uma camada de integrações para tirar seu site do canvas e levar para o mundo.</p><div className="integration-list">{integrations.map((integration) => <div className="integration-row" key={integration.id}><div className={`integration-icon ${integration.id}`} >{iconFor(integration.id)}</div><div className="integration-copy"><strong>{integration.name}</strong><span>{integration.category} · {integration.description}</span></div><button className={`integration-status ${integration.status === "connected" ? "connected" : ""}`} onClick={() => integration.status !== "connected" && onNotify(`${integration.name} entra em breve no roadmap de integrações.`)}>{integration.status === "connected" ? <><Check size={12} /> Connected</> : "Coming soon"}</button></div>)}</div><div className="integration-footer"><span><Zap size={13} /> Integrações disponíveis para o workspace.</span><button onClick={onClose}>Done <ArrowRight size={13} /></button></div></section></div>;
}

function CloudIcon() {
  return <span className="mini-cloud">↗</span>;
}

function GaugeIcon() {
  return <span className="mini-gauge">◒</span>;
}

function Property({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <label className="property-field"><span>{icon}{label}</span><input value={value} readOnly /></label>;
}

function MoreDots() {
  return <span className="more-dots"><i /><i /><i /></span>;
}

export default App;
