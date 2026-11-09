import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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
  ChevronUp,
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
  Languages,
  Video,
  MapPin,
  Circle,
  Share2,
  Mail,
  ArrowRightLeft,
  Megaphone,
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
type InspectorTab = "design" | "animate" | "seo";
type LayerKind = "scene" | "text" | "button" | "image" | "group" | "language" | "video" | "map" | "shape" | "marquee" | "social" | "form" | "ads";
type Shape3D = "orb" | "cube" | "torus" | "pyramid" | "knot" | "cylinder";
const shapeOptions: Record<Shape3D, string> = { orb: "Esfera", cube: "Cubo", torus: "Anel", pyramid: "Pirâmide", knot: "Nó", cylinder: "Cilindro" };
const siteLanguages: Record<string, string> = { pt: "Português", en: "English", es: "Español", fr: "Français", de: "Deutsch", it: "Italiano", ja: "日本語" };

function AdSlot({ publisher, slot, live }: { publisher: string; slot: string; live: boolean }) {
  const valid = /^ca-pub-\d{10,20}$/.test(publisher) && /^\d{5,20}$/.test(slot);
  useEffect(() => {
    if (!live || !valid) return;
    if (!document.querySelector(`script[data-adsense="${publisher}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisher}`;
      script.dataset.adsense = publisher;
      document.head.appendChild(script);
    }
    try { (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle = (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ?? []; (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle.push({}); } catch { /* bloqueador de anúncios */ }
  }, [live, valid, publisher, slot]);
  if (!live || !valid) return <div className="edit-embed-empty">Anúncio AdSense: informe o ID do editor (ca-pub-…) e o ID do bloco</div>;
  return <ins className="adsbygoogle" style={{ display: "block", width: "100%", height: "100%" }} data-ad-client={publisher} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />;
}

// Gera o .zip sem compressão (formato ZIP padrão) para os arquivos de SEO do projeto.
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
  return table;
})();

function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const byte of bytes) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function buildZip(files: { name: string; content: string }[]): Blob {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true); local.setUint16(10, 0, true); local.setUint16(12, 0x21, true);
    local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true); local.setUint16(28, 0, true);
    parts.push(new Uint8Array(local.buffer), name, data);
    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true); entry.setUint16(4, 20, true); entry.setUint16(6, 20, true); entry.setUint16(8, 0x0800, true);
    entry.setUint16(10, 0, true); entry.setUint16(12, 0, true); entry.setUint16(14, 0x21, true); entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true); entry.setUint32(24, data.length, true); entry.setUint16(28, name.length, true); entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const centralSize = central.reduce((total, chunk) => total + chunk.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)] as BlobPart[], { type: "application/zip" });
}

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");


const socialNetworks: { id: string; name: string; slug: string }[] = [
  { id: "instagram", name: "Instagram", slug: "instagram" },
  { id: "facebook", name: "Facebook", slug: "facebook" },
  { id: "linkedin", name: "LinkedIn", slug: "linkedin" },
  { id: "x", name: "X", slug: "x" },
  { id: "youtube", name: "YouTube", slug: "youtube" },
  { id: "tiktok", name: "TikTok", slug: "tiktok" },
  { id: "github", name: "GitHub", slug: "github" },
  { id: "whatsapp", name: "WhatsApp", slug: "whatsapp" },
];
const socialLogoUrl = (slug: string) => `https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/${slug}.svg`;
const formFieldOptions: [string, string][] = [["name", "Nome"], ["email", "E-mail"], ["phone", "Telefone"], ["message", "Mensagem"]];
const defaultFormFields = ["name", "email", "message"];
const hasFormField = (layer: Layer, key: string) => (layer.formFields ?? defaultFormFields).includes(key);

// Converte um link do YouTube ou Vimeo em endereço de incorporação (somente https).
function embedUrl(input: string): string {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:") return "";
    if (url.hostname === "youtu.be") return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.endsWith("youtube.com")) return `https://www.youtube.com/embed/${url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).pop() ?? ""}`;
    if (url.hostname.endsWith("vimeo.com")) return `https://player.vimeo.com/video/${url.pathname.split("/").filter(Boolean).pop() ?? ""}`;
    return "";
  } catch {
    return "";
  }
}

const elementItems: { kind: LayerKind; name: string; icon: typeof Box; detail: string; extra: Partial<Layer> }[] = [
  { kind: "video", name: "Vídeo", icon: Video, detail: "Vídeo · YouTube ou Vimeo", extra: { src: "", box: { x: 20, y: 30, w: 60, h: 40 } } },
  { kind: "map", name: "Mapa", icon: MapPin, detail: "Mapa · endereço", extra: { src: "", box: { x: 20, y: 30, w: 50, h: 40 } } },
  { kind: "shape", name: "Forma", icon: Circle, detail: "Forma · 2D", extra: { radius: 50, box: { x: 40, y: 40, w: 14, h: 24 } } },
  { kind: "marquee", name: "Texto rolante", icon: ArrowRightLeft, detail: "Texto · rolagem", extra: { text: "Novidade · Promoção · Novidade", box: { x: 0, y: 88, w: 100, h: 6 } } },
  { kind: "social", name: "Redes sociais", icon: Share2, detail: "Links · redes", extra: { text: "Instagram, LinkedIn, X", box: { x: 66, y: 88, w: 32, h: 6 } } },
  { kind: "ads", name: "Anúncio AdSense", icon: Megaphone, detail: "AdSense · bloco", extra: { src: "", text: "", box: { x: 68, y: 72, w: 28, h: 18 } } },
  { kind: "form", name: "Formulário de contato", icon: Mail, detail: "Formulário · contato", extra: { box: { x: 55, y: 30, w: 36, h: 50 } } },
];

// Exporta o site montado no editor como arquivos estáticos (HTML, CSS e JS embutidos em cada página).
type ExportLayers = (pageId: string) => Layer[];

const exportClientScript = [
  "function tr(text,from,to){var k='sf:'+from+':'+to+':'+text;try{var c=localStorage.getItem(k);if(c)return Promise.resolve(c);}catch(e){}",
  "return fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+from+'|'+to).then(function(r){return r.json();}).then(function(j){var t=j&&j.responseData&&j.responseData.translatedText;if(!t||/MYMEMORY WARNING|INVALID|QUERY LENGTH/i.test(t))return text;try{localStorage.setItem(k,t);}catch(e){}return t;});}",
  "function setLang(code){document.documentElement.lang=code;document.querySelectorAll('.tx').forEach(function(el){var on=el.getAttribute('data-lang')===code;el.hidden=!on;if(on&&el.getAttribute('data-auto')==='1'){el.setAttribute('data-auto','0');tr(el.getAttribute('data-base'),el.getAttribute('data-from'),code).then(function(t){el.textContent=t;}).catch(function(){});}});document.querySelectorAll('[data-lang-btn]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-lang-btn')===code);});var s=document.querySelector('select.lang-select');if(s)s.value=code;}",
  "var first=document.querySelector('.tx');if(first){setLang(first.getAttribute('data-from'));}",
  "var motion=[].slice.call(document.querySelectorAll('[data-motion]'));",
  "addEventListener('pointermove',function(e){var x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;motion.forEach(function(el){if(el.getAttribute('data-motion')==='move'){var k=+el.getAttribute('data-intensity')/100;el.style.setProperty('--mx',(x*100*k)+'%');el.style.setProperty('--my',(y*100*k)+'%');}});});",
  "addEventListener('scroll',function(){var p=Math.min(1,Math.max(0,scrollY/Math.max(1,innerHeight*.8)));motion.forEach(function(el){if(el.getAttribute('data-motion')==='scroll'){var k=+el.getAttribute('data-intensity');el.style.setProperty('--sy',((1-p)*k)+'px');el.style.opacity=String(+el.getAttribute('data-op')*Math.max(.15,p));}});},{passive:true});",
  "document.querySelectorAll('[data-lang-btn]').forEach(function(b){b.addEventListener('click',function(){setLang(b.getAttribute('data-lang-btn'));});});",
  "document.querySelectorAll('select.lang-select').forEach(function(s){s.addEventListener('change',function(){setLang(s.value);});});",
].join("\n");

const exportSceneScript = [
  "import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';",
  "function geo(shape){switch(shape){",
  "case 'cube':return new THREE.BoxGeometry(1.7,1.7,1.7);",
  "case 'torus':return new THREE.TorusGeometry(.95,.4,32,96);",
  "case 'pyramid':return new THREE.ConeGeometry(1.25,2.3,4);",
  "case 'knot':return new THREE.TorusKnotGeometry(.8,.28,160,24);",
  "case 'cylinder':return new THREE.CylinderGeometry(.9,.9,2,48);",
  "default:return new THREE.IcosahedronGeometry(1.18,4);}}",
  "document.querySelectorAll('.scene').forEach(function(el){",
  "var r=new THREE.WebGLRenderer({antialias:true,alpha:true});el.appendChild(r.domElement);",
  "var scene=new THREE.Scene();var cam=new THREE.PerspectiveCamera(45,1,.1,100);cam.position.z=5;",
  "var mesh=new THREE.Mesh(geo(el.getAttribute('data-shape')),new THREE.MeshStandardMaterial({color:el.getAttribute('data-color'),roughness:.35,metalness:.2}));scene.add(mesh);",
  "var light=new THREE.DirectionalLight(0xffffff,2);light.position.set(2,3,4);scene.add(light);scene.add(new THREE.AmbientLight(0xffffff,.5));",
  "function resize(){var w=el.clientWidth||1,h=el.clientHeight||1;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}",
  "resize();addEventListener('resize',resize);",
  "(function loop(){mesh.rotation.x+=.004;mesh.rotation.y+=.006;r.render(scene,cam);requestAnimationFrame(loop);})();",
  "});",
].join("\n");

function exportSite(pages: Page[], layersFor: ExportLayers, color: string, font: string): { name: string; content: string }[] {
  const domain = "https://seu-dominio.com";
  const depthOf = (page: Page) => page.path.split("/").filter(Boolean).length;
  const fileOf = (page: Page) => (page.path === "/" ? "index.html" : `${page.path.replace(/^\//, "")}/index.html`);
  const hrefTo = (from: Page, targetId: string) => {
    const target = pages.find((page) => page.id === targetId);
    if (!target) return "#";
    const prefix = "../".repeat(depthOf(from));
    return target.path === "/" ? (prefix || "./") : `${prefix}${target.path.replace(/^\//, "")}/`;
  };
  const embed = (input: string) => embedUrl(input);
  const files: { name: string; content: string }[] = [];

  for (const page of pages) {
    const layers = layersFor(page.id);
    const languageLayer = layers.find((layer) => layer.kind === "language");
    const codes = languageLayer?.languages ?? [];
    const source = languageLayer?.sourceLanguage ?? "pt";
    const count = layers.length;
    const title = page.seoTitle || page.name;
    const description = page.seoDescription ?? "";

    const body = layers.map((layer, index) => {
      if (layer.visible === false) return "";
      const box = layer.box ?? { x: 0, y: 0, w: 10, h: 10 };
      const motion = layer.follow ? ` data-motion="${layer.trigger ?? "move"}" data-intensity="${layer.intensity ?? 12}" data-op="${(layer.opacity ?? 100) / 100}"` : "";
      const style = `left:${box.x}%;top:${box.y}%;width:${box.w}%;height:${box.h}%;z-index:${count - index};order:${count - index};--r:${layer.rotate ?? 0}deg;--s:${layer.scale ?? 1};opacity:${(layer.opacity ?? 100) / 100};border-radius:${layer.radius ?? 0}${layer.kind === "shape" ? "%" : "px"};${layer.glow ? `box-shadow:0 0 48px ${color}66;` : ""}`;
      const base = layer.text ?? layer.name;
      let inner = "";
      if (layer.kind === "text" || layer.kind === "button") {
        if (codes.length === 0) {
          inner = `<span class="tx">${escapeHtml(base)}</span>`;
        } else {
          inner = codes.map((code) => {
            const manual = layer.translations?.[code];
            const auto = !layer.noTranslate && code !== source && !manual ? "1" : "0";
            const text = manual || base;
            return `<span class="tx" data-lang="${code}" data-from="${source}" data-base="${escapeHtml(base)}" data-auto="${auto}" hidden>${escapeHtml(text)}</span>`;
          }).join("");
        }
      } else if (layer.kind === "image") {
        inner = layer.src ? `<div class="img" role="img" aria-label="${escapeHtml(layer.alt ?? "")}" style="background-image:url('${layer.src.replace(/'/g, "%27")}')"></div>` : "";
      } else if (layer.kind === "video") {
        const url = embed(layer.src ?? "");
        inner = url ? `<iframe src="${url}" title="${escapeHtml(layer.name)}" loading="lazy" allowfullscreen></iframe>` : "";
      } else if (layer.kind === "map") {
        inner = layer.src ? `<iframe src="https://www.google.com/maps?q=${encodeURIComponent(layer.src)}&amp;output=embed" title="${escapeHtml(layer.name)}" loading="lazy"></iframe>` : "";
      } else if (layer.kind === "scene") {
        inner = `<div class="scene" data-shape="${layer.shape ?? "orb"}" data-color="${color}"></div>`;
      } else if (layer.kind === "shape") {
        inner = `<div style="width:100%;height:100%;background:${color}"></div>`;
      } else if (layer.kind === "marquee") {
        inner = `<div class="marquee"><span>${escapeHtml(base)}</span></div>`;
      } else if (layer.kind === "social") {
        inner = `<div class="social">${(layer.socials ?? []).filter((item) => socialNetworks.some((entry) => entry.id === item.id)).map((item) => { const net = socialNetworks.find((entry) => entry.id === item.id)!; return `<a href="${escapeHtml(/^https:\/\//.test(item.url) ? item.url : "#")}" target="_blank" rel="noopener noreferrer" aria-label="${net.name}"><img src="${socialLogoUrl(net.slug)}" alt="${net.name}" width="20" height="20"></a>`; }).join("")}</div>`;
      } else if (layer.kind === "form") {
        const endpoint = /^https:\/\//.test(layer.src ?? "") ? (layer.src as string) : "#";
        inner = `<form class="form" action="${escapeHtml(endpoint)}" method="post">${hasFormField(layer, "name") ? '<input name="name" placeholder="Nome" required>' : ""}${hasFormField(layer, "email") ? '<input name="email" type="email" placeholder="E-mail" required>' : ""}${hasFormField(layer, "phone") ? '<input name="phone" type="tel" placeholder="Telefone">' : ""}${hasFormField(layer, "message") ? '<textarea name="message" placeholder="Mensagem" required></textarea>' : ""}<button type="submit">${escapeHtml(layer.text || "Enviar")}</button></form>`;
      } else if (layer.kind === "ads") {
        const pub = layer.src ?? "";
        const slot = layer.text ?? "";
        inner = /^ca-pub-\d{10,20}$/.test(pub) && /^\d{5,20}$/.test(slot)
          ? `<ins class="adsbygoogle" style="display:block;width:100%;height:100%" data-ad-client="${pub}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pub}" crossorigin="anonymous"></script><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>`
          : "";
      } else if (layer.kind === "language") {
        const list = layer.languages ?? [];
        inner = (layer.languageStyle === "buttons")
          ? `<div class="lang-buttons">${list.map((code) => `<button type="button" data-lang-btn="${code}">${escapeHtml(siteLanguages[code] ?? code)}</button>`).join("")}</div>`
          : `<select class="lang-select">${list.map((code) => `<option value="${code}">${escapeHtml(siteLanguages[code] ?? code)}</option>`).join("")}</select>`;
      }
      if (layer.linkPageId && !["form", "language", "ads"].includes(layer.kind)) {
        inner += `<a class="lk" href="${hrefTo(page, layer.linkPageId)}" aria-label="${escapeHtml(base)}"></a>`;
      }
      return `<div class="l k-${layer.kind}"${motion} style="${style}">${inner}</div>`;
    }).join("\n");

    const scenes = layers.some((layer) => layer.kind === "scene" && layer.visible !== false)
      ? `<script type="module">${exportSceneScript}</script>` : "";
    const css = `*{box-sizing:border-box}[hidden]{display:none!important}html,body{margin:0;background:#0b0c10;color:#eef1eb;font-family:'${font}',system-ui,sans-serif}
.stage{position:relative;width:min(100%,1440px);aspect-ratio:16/9;margin:0 auto;overflow:hidden}
.l{position:absolute;display:flex;align-items:center;justify-content:center;min-width:0;--mx:0%;--my:0%;--sy:0px;transform:translate(calc(var(--mx) + 0px),calc(var(--my) + var(--sy))) rotate(var(--r)) scale(var(--s))}
.l>*{max-width:100%;max-height:100%}
.tx{display:block;font-size:clamp(14px,2.2vw,32px);font-weight:600;line-height:1.1;text-align:center}
.k-button .tx{background:${color};color:#11150e;padding:12px 18px;border-radius:999px}
.k-text .tx{text-align:left;width:100%}
.img{width:100%;height:100%;background-size:cover;background-position:center}
.l iframe{width:100%;height:100%;border:0;border-radius:8px}
.scene{width:100%;height:100%}.scene canvas{width:100%;height:100%;display:block}
.marquee{overflow:hidden;white-space:nowrap;display:flex;align-items:center;width:100%;height:100%;background:rgba(255,255,255,.06)}
.marquee span{display:inline-block;animation:mq 14s linear infinite}@keyframes mq{from{transform:translateX(100%)}to{transform:translateX(-100%)}}
.social{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}.social a{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.06)}.social img{width:20px;height:20px;filter:invert(1)}
.form{display:flex;flex-direction:column;gap:8px;padding:12px;width:100%;height:100%;background:rgba(255,255,255,.04);border-radius:10px}
.form input,.form textarea{background:#0e0f13;color:#eef1eb;border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:9px;font:inherit;min-width:0}
.form textarea{flex:1;resize:none}.form button{background:${color};color:#11150e;border:0;border-radius:6px;padding:10px;font-weight:600;cursor:pointer}
.lang-buttons{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.lang-buttons button{border:1px solid rgba(255,255,255,.3);background:transparent;color:#eef1eb;border-radius:999px;padding:6px 12px;cursor:pointer}.lang-buttons button.active{background:${color};color:#11150e;border-color:${color}}
.lang-select{background:#0e0f13;color:#eef1eb;border:1px solid rgba(255,255,255,.3);border-radius:6px;padding:6px}
.lk{position:absolute;inset:0;z-index:2}
@media (max-width:700px){.stage{aspect-ratio:auto;min-height:100vh;display:flex;flex-direction:column;gap:14px;padding:16px}.l{position:relative!important;left:auto!important;top:auto!important;width:100%!important;height:auto!important;min-height:64px}.l>*{width:100%}}`;

    const html = `<!doctype html>
<html lang="${source}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="keywords" content="${escapeHtml(page.seoKeywords ?? "")}">
<link rel="canonical" href="${domain}${page.path}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${domain}${page.path}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
<body>
<main class="stage">
${body}
</main>
<script>${exportClientScript}</script>
${scenes}
</body>
</html>
`;
    files.push({ name: fileOf(page), content: html });
  }

  const urls = pages.map((page) => `  <url><loc>${domain}${page.path}</loc></url>`).join("\n");
  files.push({ name: "sitemap.xml", content: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
  files.push({ name: "robots.txt", content: `User-agent: *\nAllow: /\n\nSitemap: ${domain}/sitemap.xml\n` });
  files.push({ name: "seo.json", content: JSON.stringify(pages.map((page) => ({ path: page.path, title: page.seoTitle || page.name, description: page.seoDescription ?? "", keywords: page.seoKeywords ?? "" })), null, 2) });
  files.push({ name: "LEIA-ME.txt", content: "Site exportado pelo SiteForge.\n\n1. Troque 'seu-dominio.com' pelo seu domínio nos arquivos (canonical, sitemap.xml e robots.txt).\n2. Envie todos os arquivos para qualquer hospedagem estática (GitHub Pages, Netlify, Hostinger etc.).\n3. Formulários: configure um endereço https de envio (por exemplo, Formspree) no painel do elemento.\n4. Anúncios AdSense só funcionam depois que a conta for aprovada para o domínio.\n" });
  return files;
}

function shapeGeometry(shape: Shape3D, scale: number) {
  switch (shape) {
    case "cube": return new THREE.BoxGeometry(1.7 * scale, 1.7 * scale, 1.7 * scale);
    case "torus": return new THREE.TorusGeometry(0.95 * scale, 0.4 * scale, 32, 96);
    case "pyramid": return new THREE.ConeGeometry(1.25 * scale, 2.3 * scale, 4);
    case "knot": return new THREE.TorusKnotGeometry(0.8 * scale, 0.28 * scale, 160, 24);
    case "cylinder": return new THREE.CylinderGeometry(0.9 * scale, 0.9 * scale, 2 * scale, 48);
    default: return new THREE.IcosahedronGeometry(1.18 * scale, scale === 1 ? 4 : 2);
  }
}
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

async function translateText(text: string, from: string, to: string): Promise<string> {
  const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
  if (!response.ok) throw new Error("translate_failed");
  const data = await response.json();
  const raw: unknown = data?.responseData?.translatedText;
  if (typeof raw !== "string" || !raw || /MYMEMORY WARNING|INVALID|QUERY LENGTH/i.test(raw)) throw new Error("translate_failed");
  return new DOMParser().parseFromString(raw, "text/html").documentElement.textContent ?? raw;
}

function SiteLanguageSwitch({ codes, value, onChange, style }: { codes: string[]; value: string; onChange: (code: string) => void; style: "select" | "buttons" }) {
  const list = codes.length ? codes : ["pt"];
  const current = list.includes(value) ? value : list[0];
  // Impede que o clique no seletor arraste a camada no editor.
  const stop = (event: ReactPointerEvent) => event.stopPropagation();
  if (style === "buttons") {
    return <div className="site-lang-buttons" role="group" aria-label="Idioma" onPointerDown={stop}>{list.map((code) => <button key={code} type="button" className={code === current ? "active" : ""} aria-pressed={code === current} onClick={() => onChange(code)}>{siteLanguages[code]}</button>)}</div>;
  }
  return <select className="site-lang" aria-label="Idioma" value={current} onPointerDown={stop} onChange={(event) => onChange(event.target.value)}>{list.map((code) => <option key={code} value={code}>{siteLanguages[code]}</option>)}</select>;
}

const editorCopy: Record<Language, Record<"untitled" | "saved" | "cloud" | "local" | "structure" | "layersCount" | "select" | "frame" | "type" | "media" | "threeD" | "desktop" | "tablet" | "mobile" | "addNewPage" | "undo" | "redo" | "theme" | "open" | "tip" | "pageNamed" | "back" | "search", string>> = {
  pt: { untitled: "Projeto sem nome", saved: "Salvo há pouco", cloud: "Nuvem", local: "Local", structure: "Estrutura", layersCount: "camadas", select: "Selecionar", frame: "Quadro", type: "Texto", media: "Mídia", threeD: "3D", desktop: "Desktop", tablet: "Tablet", mobile: "Celular", addNewPage: "Adicionar nova página", undo: "Desfazer", redo: "Refazer", theme: "Alternar tema", open: "Abrir", tip: "Dica rápida", pageNamed: "Página", back: "Voltar", search: "Buscar (⌘K)" },
  en: { untitled: "Untitled project", saved: "Saved just now", cloud: "Cloud", local: "Local", structure: "Structure", layersCount: "layers", select: "Select", frame: "Frame", type: "Type", media: "Media", threeD: "3D", desktop: "Desktop", tablet: "Tablet", mobile: "Mobile", addNewPage: "Add new page", undo: "Undo", redo: "Redo", theme: "Toggle theme", open: "Open", tip: "Quick tip", pageNamed: "Page", back: "Back", search: "Search (⌘K)" },
  es: { untitled: "Proyecto sin nombre", saved: "Guardado hace poco", cloud: "Nube", local: "Local", structure: "Estructura", layersCount: "capas", select: "Seleccionar", frame: "Marco", type: "Texto", media: "Medios", threeD: "3D", desktop: "Escritorio", tablet: "Tableta", mobile: "Móvil", addNewPage: "Añadir nueva página", undo: "Deshacer", redo: "Rehacer", theme: "Cambiar tema", open: "Abrir", tip: "Consejo rápido", pageNamed: "Página", back: "Volver", search: "Buscar (⌘K)" }
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

// Código-fonte completo do projeto (TypeScript, HTML, CSS, servidor e configurações) em .zip.

// Lista fixa de integrações disponíveis (antes vinha do servidor, que não roda no Pages).
const availableIntegrations: Integration[] = [
  { id: "github", name: "GitHub", category: "Workflow", status: "available", description: "Sincronize projetos e publique via branches" },
  { id: "notion", name: "Notion", category: "Content", status: "available", description: "Transforme páginas Notion em conteúdo" },
  { id: "analytics", name: "Analytics", category: "Insights", status: "available", description: "Eventos e conversões do seu site" },
];

type McpServer = {
  id: string;
  name: string;
  url: string;
  status: "connected" | "ready" | "draft";
  scope: "workspace" | "local";
};

type ProjectPayload = { name?: string; pages: Page[]; layers: Omit<Layer, "icon">[]; layersByPage?: Record<string, Omit<Layer, "icon">[]>; selectedColor: string; font: string };

type Page = {
  id: string;
  name: string;
  path: string;
  accent: string;
  kind: "home" | "work" | "about";
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

// Posição e tamanho em porcentagem da área do canvas (0 a 100), para funcionar em qualquer zoom e dispositivo.
type LayerBox = { x: number; y: number; w: number; h: number };

type Layer = {
  id: string;
  name: string;
  kind: LayerKind;
  visible: boolean;
  locked: boolean;
  detail: string;
  icon: typeof Box;
  box?: LayerBox;
  text?: string;
  linkPageId?: string;
  src?: string;
  rotate?: number;
  radius?: number;
  opacity?: number;
  follow?: boolean;
  scale?: number;
  glow?: boolean;
  intensity?: number;
  trigger?: "move" | "scroll";
  shape?: Shape3D;
  languages?: string[];
  languageStyle?: "select" | "buttons";
  sourceLanguage?: string;
  noTranslate?: boolean;
  alt?: string;
  socials?: { id: string; url: string }[];
  formFields?: string[];
  translations?: Record<string, string>;
};

const starterPages: Page[] = [
  { id: "home", name: "Home", path: "/editor", accent: "#b8ff3d", kind: "home" },
  { id: "work", name: "Work", path: "/editor/work", accent: "#ff7a66", kind: "work" },
  { id: "about", name: "About", path: "/editor/about", accent: "#8f9dff", kind: "about" },
];

const starterLayers: Layer[] = [
  { id: "noise", name: "Noise texture", kind: "image", visible: true, locked: true, detail: "Image · 12% opacity", icon: ImageIcon, box: { x: 0, y: 0, w: 100, h: 100 } },
  { id: "orb", name: "Orb / interactive", kind: "scene", visible: true, locked: false, detail: "Three.js · mesh", icon: Move3d, box: { x: 43, y: 10, w: 52, h: 74 } },
  { id: "headline", name: "Headline", kind: "text", visible: true, locked: false, detail: "Space Grotesk · 64 px", icon: Type, box: { x: 8.5, y: 19, w: 60, h: 30 } },
  { id: "cta", name: "CTA button", kind: "button", visible: true, locked: false, detail: "Button · primary", icon: Square, box: { x: 8.5, y: 60, w: 16, h: 6 } },
  { id: "hero", name: "Hero section", kind: "group", visible: true, locked: false, detail: "Frame · 1440 × 760", icon: BoxSelect, box: { x: 0, y: 0, w: 100, h: 84 } },
];

const colorSwatches = ["#b8ff3d", "#ff7a66", "#8f9dff", "#f3f4f0", "#17191f"];

function iconForLayerKind(kind: LayerKind) {
  if (kind === "scene") return Move3d;
  if (kind === "text") return Type;
  if (kind === "button") return Square;
  if (kind === "image") return ImageIcon;
  if (kind === "language") return Languages;
  if (kind === "video") return Video;
  if (kind === "map") return MapPin;
  if (kind === "shape") return Circle;
  if (kind === "marquee") return ArrowRightLeft;
  if (kind === "social") return Share2;
  if (kind === "form") return Mail;
  if (kind === "ads") return Megaphone;
  return Box;
}

function hydrateLayers(layers: Layer[]): Layer[] {
  return layers.map((layer) => ({ ...layer, icon: typeof layer.icon === "function" ? layer.icon : iconForLayerKind(layer.kind) }));
}

function serializableLayers(layers: Layer[]) {
  return layers.map(({ icon: _icon, ...layer }) => layer);
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type Template = { id: string; name: string; build: () => Layer[] };

function templateLayer(name: string, kind: LayerKind, icon: typeof Box, box: LayerBox, text?: string): Layer {
  return { id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, kind, visible: true, locked: false, detail: name, icon, box, text };
}

const templates: Template[] = [
  { id: "landing", name: "Landing", build: () => [
    templateLayer("Hero section", "group", BoxSelect, { x: 0, y: 0, w: 100, h: 100 }),
    templateLayer("3D object", "scene", Move3d, { x: 55, y: 12, w: 40, h: 70 }),
    templateLayer("Headline", "text", Type, { x: 8, y: 20, w: 44, h: 30 }, "Seu título aqui"),
    templateLayer("CTA button", "button", Square, { x: 8, y: 58, w: 18, h: 7 }, "Começar"),
  ] },
  { id: "portfolio", name: "Portfólio", build: () => [
    templateLayer("Hero section", "group", BoxSelect, { x: 0, y: 0, w: 100, h: 100 }),
    templateLayer("Headline", "text", Type, { x: 6, y: 8, w: 60, h: 14 }, "Meu trabalho"),
    templateLayer("Image", "image", ImageIcon, { x: 6, y: 30, w: 28, h: 50 }),
    templateLayer("Image", "image", ImageIcon, { x: 36, y: 30, w: 28, h: 50 }),
    templateLayer("Image", "image", ImageIcon, { x: 66, y: 30, w: 28, h: 50 }),
  ] },
  { id: "product", name: "Produto", build: () => [
    templateLayer("Hero section", "group", BoxSelect, { x: 0, y: 0, w: 100, h: 100 }),
    templateLayer("Image", "image", ImageIcon, { x: 56, y: 12, w: 38, h: 72 }),
    templateLayer("Headline", "text", Type, { x: 8, y: 22, w: 42, h: 18 }, "Nome do produto"),
    templateLayer("Description", "text", Type, { x: 8, y: 42, w: 40, h: 14 }, "Descreva o que ele faz em uma frase."),
    templateLayer("Buy button", "button", Square, { x: 8, y: 62, w: 18, h: 7 }, "Comprar"),
  ] },
  { id: "restaurant", name: "Restaurante", build: () => [
    templateLayer("Hero section", "group", BoxSelect, { x: 0, y: 0, w: 100, h: 100 }),
    templateLayer("Headline", "text", Type, { x: 8, y: 20, w: 44, h: 22 }, "Sabor da casa"),
    templateLayer("Description", "text", Type, { x: 8, y: 44, w: 40, h: 12 }, "Pratos feitos na hora, com ingredientes frescos."),
    templateLayer("Reserve button", "button", Square, { x: 8, y: 62, w: 20, h: 7 }, "Reservar mesa"),
    templateLayer("Image", "image", ImageIcon, { x: 56, y: 12, w: 38, h: 72 }),
  ] },
  { id: "store", name: "Loja", build: () => [
    templateLayer("Hero section", "group", BoxSelect, { x: 0, y: 0, w: 100, h: 100 }),
    templateLayer("Headline", "text", Type, { x: 6, y: 8, w: 60, h: 14 }, "Nova coleção"),
    templateLayer("Product", "image", ImageIcon, { x: 6, y: 30, w: 28, h: 50 }),
    templateLayer("Product", "image", ImageIcon, { x: 36, y: 30, w: 28, h: 50 }),
    templateLayer("Product", "image", ImageIcon, { x: 66, y: 30, w: 28, h: 50 }),
    templateLayer("Shop button", "button", Square, { x: 6, y: 84, w: 20, h: 7 }, "Ver produtos"),
  ] },
];

// Distância (em % da área) abaixo da qual a camada "gruda" numa guia.
const SNAP_DISTANCE = 0.6;

function nearestSnap(candidates: number[], targets: number[]): { diff: number; target: number } | null {
  let best: { diff: number; target: number } | null = null;
  for (const candidate of candidates) {
    for (const target of targets) {
      const diff = target - candidate;
      if (Math.abs(diff) <= SNAP_DISTANCE && (!best || Math.abs(diff) < Math.abs(best.diff))) best = { diff, target };
    }
  }
  return best;
}

// Camadas sem posição salva ganham uma caixa padrão, em cascata.
function boxOf(layer: Layer, index: number): LayerBox {
  return layer.box ?? { x: 10 + (index % 6) * 4, y: 10 + (index % 6) * 4, w: 30, h: 12 };
}

function hydrateLayersByPage(map: Record<string, Layer[]>): Record<string, Layer[]> {
  return Object.fromEntries(Object.entries(map).map(([pageId, pageLayers]) => [pageId, hydrateLayers(pageLayers)]));
}

function serializeLayersByPage(map: Record<string, Layer[]>): Record<string, Omit<Layer, "icon">[]> {
  return Object.fromEntries(Object.entries(map).map(([pageId, pageLayers]) => [pageId, serializableLayers(pageLayers)]));
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

function SceneCanvas({ color, active, preview, onSelect, shape }: { color: string; active: boolean; preview: boolean; onSelect: () => void; shape: Shape3D }) {
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
    const orb = new THREE.Mesh(shapeGeometry(shape, 1), material);
    orb.castShadow = true;
    orb.receiveShadow = true;
    group.add(orb);
    materialRef.current = material;

    const wire = new THREE.Mesh(
      shapeGeometry(shape, 1.11),
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
  // Camadas de cada página. A lista visível (layers) é sempre a da página ativa.
  const [layersByPage, setLayersByPage] = useState<Record<string, Layer[]>>({});
  const [undoStack, setUndoStack] = useState<Record<string, Layer[]>[]>([]);
  const [redoStack, setRedoStack] = useState<Record<string, Layer[]>[]>([]);
  const layers = layersByPage[activePageId] ?? starterLayers;

  // Toda alteração de camadas passa por aqui e entra no histórico de desfazer.
  const setLayers = (updater: Layer[] | ((current: Layer[]) => Layer[])) => {
    setUndoStack((stack) => [...stack.slice(-49), layersByPage]);
    setRedoStack([]);
    setLayersByPage((prev) => {
      const current = prev[activePageId] ?? starterLayers;
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [activePageId]: next };
    });
  };

  const undo = () => {
    const previous = undoStack[undoStack.length - 1];
    if (!previous) return notify("Nada para desfazer");
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack, layersByPage]);
    setLayersByPage(previous);
  };

  const redo = () => {
    const next = redoStack[redoStack.length - 1];
    if (!next) return notify("Nada para refazer");
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack, layersByPage]);
    setLayersByPage(next);
  };
  const [selectedLayerId, setSelectedLayerId] = useState("orb");
  const [extraSelected, setExtraSelected] = useState<string[]>([]);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [elementsOpen, setElementsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [activeInspector, setActiveInspector] = useState<InspectorTab>("design");
  const [activeSide, setActiveSide] = useState<"pages" | "layers">("pages");
  const [device, setDevice] = useState<Device>("desktop");
  const [routePath, setRoutePath] = useState(() => appPath() || "/editor");
  const [preview, setPreview] = useState(() => appPath() === "/preview");
  const [selectedColor, setSelectedColor] = useState("#b8ff3d");
  const [projectName, setProjectName] = useState("");
  const [hasSavedProject, setHasSavedProject] = useState(false);
  const [font, setFont] = useState("Space Grotesk");
  const [toast, setToast] = useState("");
  const [zoom, setZoom] = useState(82);
  const [showGrid, setShowGrid] = useState(false);
  const [siteLang, setSiteLang] = useState("pt");
  const siteLanguageCodes = layers.find((layer) => layer.kind === "language")?.languages ?? [];
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

  const siteLanguageLayer = layers.find((layer) => layer.kind === "language");
  const sourceLang = siteLanguageLayer?.sourceLanguage ?? "pt";
  const autoRequested = useRef(new Set<string>());

  // SEO da página: título e descrição aparecem na aba e nos metadados da pré-visualização.
  useEffect(() => {
    if (!preview || !activePage) return;
    document.title = activePage.seoTitle || activePage.name;
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = activePage.seoDescription ?? "";
  }, [preview, activePage?.id, activePage?.name, activePage?.seoTitle, activePage?.seoDescription]);

  // Animação por scroll: progresso de 0 a 1 conforme a página rola (somente na pré-visualização).
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    if (!preview) return;
    const onScroll = () => setScrollProgress(Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight * 0.8))));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [preview]);
  const [autoTranslated, setAutoTranslated] = useState<Record<string, string>>({});
  const baseTextOf = (layer: Layer) => layer.kind === "button"
    ? (layer.text ?? "Explore the system")
    : (layer.id === "headline" && !layer.text ? `${pageContent.first} ${pageContent.second}` : layer.text ?? layer.name);
  const autoKey = (layer: Layer) => `${layer.id}:${siteLang}:${baseTextOf(layer)}`;
  const shownText = (layer: Layer) => {
    if (layer.noTranslate || editingLayerId === layer.id || siteLang === sourceLang) return baseTextOf(layer);
    return layer.translations?.[siteLang] || autoTranslated[autoKey(layer)] || baseTextOf(layer);
  };

  // Tradução automática: traduz sob demanda os textos sem tradução manual para o idioma escolhido.
  useEffect(() => {
    if (siteLang === sourceLang) return;
    layers.forEach((layer) => {
      if ((layer.kind !== "text" && layer.kind !== "button") || layer.noTranslate || layer.translations?.[siteLang]) return;
      const key = autoKey(layer);
      if (autoRequested.current.has(key)) return;
      autoRequested.current.add(key);
      translateText(baseTextOf(layer), sourceLang, siteLang)
        .then((out) => setAutoTranslated((current) => ({ ...current, [key]: out })))
        .catch(() => autoRequested.current.delete(key));
    });
  }, [layers, siteLang, sourceLang]);

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
          if (project?.pages?.length) { setPages(project.pages); setHasSavedProject(true); }
          if (project?.layers?.length) setLayers(hydrateLayers(project.layers as Layer[]));
          if (project?.layersByPage) setLayersByPage(hydrateLayersByPage(project.layersByPage as Record<string, Layer[]>));
          if (project?.selectedColor) setSelectedColor(project.selectedColor);
          if (project?.font) setFont(project.font);
          if (typeof project?.name === "string") setProjectName(project.name);
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
    const payload = nextPayload ?? { name: projectName, pages, layers: serializableLayers(layers), layersByPage: serializeLayersByPage(layersByPage), selectedColor, font };
    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > 3_000_000) notify(`Projeto grande (${(payloadSize / 1_000_000).toFixed(1)} MB): reduza imagens para o site carregar mais rápido`);
    const draftKey = authUser ? `siteforge-project:${authUser.id}` : "siteforge-project:anonymous";
    localStorage.setItem(draftKey, JSON.stringify(payload));
    if (!authUser) {
      notify("Rascunho salvo localmente · entre para sincronizar");
      return;
    }
    setSaving(true);
    try {
      await saveCloudProject(payload);
      setHasSavedProject(true);
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
      const savedByPage = (value as unknown as { layersByPage?: Record<string, Layer[]> }).layersByPage;
      if (savedByPage) setLayersByPage(hydrateLayersByPage(savedByPage));
      if (value.selectedColor) setSelectedColor(value.selectedColor);
      if (value.font) setFont(value.font);
      const savedName = (value as { name?: unknown }).name;
      if (typeof savedName === "string") setProjectName(savedName);
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [authLoading, authUser]);

  const applyTemplate = (template: Template) => {
    setLayers(() => template.build());
    setTemplatesOpen(false);
    setSelectedLayerId("");
    setExtraSelected([]);
    notify(`Template "${template.name}" aplicado nesta página`);
  };

  const renamePage = (pageId: string, name: string) => {
    const clean = name.trim();
    setRenamingPageId(null);
    if (!clean) return;
    setPages((current) => current.map((page) => (page.id === pageId ? { ...page, name: clean } : page)));
  };

  const movePage = (pageId: string, direction: -1 | 1) => {
    setPages((current) => {
      const index = current.findIndex((page) => page.id === pageId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  // Navegação entre páginas na pré-visualização: mantém o modo de pré-visualização.
  const goToPage = (pageId: string) => {
    const page = pages.find((item) => item.id === pageId);
    if (!page) return;
    setActivePageId(page.id);
    window.history.pushState({}, "", url(page.path));
    setRoutePath(page.path);
  };

  const uploadAsset = (file: File) => {
    if (file.size > 2 * 1024 * 1024) return notify("Use uma imagem de até 2 MB");
    const reader = new FileReader();
    reader.onload = () => {
      const layer: Layer = {
        id: `image-${Date.now()}`,
        name: file.name,
        kind: "image",
        visible: true,
        locked: false,
        detail: "Imagem",
        icon: ImageIcon,
        box: { x: 20, y: 20, w: 40, h: 40 },
        src: String(reader.result),
      };
      setLayers((current) => [layer, ...current]);
      setSelectedLayerId(layer.id);
      setActiveSide("layers");
      notify("Imagem adicionada ao canvas");
    };
    reader.readAsDataURL(file);
  };

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
    // Por enquanto só é permitido 1 projeto por conta, para não sobrecarregar o banco de dados.
    if (hasSavedProject) {
      notify("No momento só é possível criar 1 projeto, para não pesar no banco de dados");
      return;
    }
    const nextPayload: ProjectPayload = { pages: starterPages, layers: serializableLayers(starterLayers), selectedColor: "#b8ff3d", font: "Space Grotesk" };
    setPages(starterPages);
    setLayersByPage({});
    setUndoStack([]);
    setRedoStack([]);
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

  const addLayer = (kind: LayerKind, name: string, icon: typeof Box, detail: string, extra?: Partial<Layer>) => {
    const layer: Layer = { id: `${kind}-${Date.now()}`, name, kind, visible: true, locked: false, detail, icon, box: { x: 35, y: 38, w: 30, h: 20 }, ...extra };
    setLayers((current) => [layer, ...current]);
    setSelectedLayerId(layer.id);
    notify(`${name} inserido no canvas`);
  };

  const chosenLayer = layers.find((layer) => layer.id === selectedLayerId);

  // Alinha as camadas selecionadas entre si; com uma só, alinha à área do canvas.
  const alignSelection = (action: "left" | "hcenter" | "right" | "top" | "vcenter" | "bottom") => {
    const ids = [selectedLayerId, ...extraSelected].filter(Boolean);
    const targets = layers.map((item, index) => ({ item, box: boxOf(item, index) })).filter(({ item }) => ids.includes(item.id) && !item.locked);
    if (!targets.length) return notify("Selecione uma camada para alinhar");
    const bounds = targets.length > 1
      ? { minX: Math.min(...targets.map(({ box }) => box.x)), maxX: Math.max(...targets.map(({ box }) => box.x + box.w)), minY: Math.min(...targets.map(({ box }) => box.y)), maxY: Math.max(...targets.map(({ box }) => box.y + box.h)) }
      : { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    const placed = new Map<string, LayerBox>();
    for (const { item, box } of targets) {
      let { x, y } = box;
      if (action === "left") x = bounds.minX;
      if (action === "right") x = bounds.maxX - box.w;
      if (action === "hcenter") x = (bounds.minX + bounds.maxX) / 2 - box.w / 2;
      if (action === "top") y = bounds.minY;
      if (action === "bottom") y = bounds.maxY - box.h;
      if (action === "vcenter") y = (bounds.minY + bounds.maxY) / 2 - box.h / 2;
      placed.set(item.id, { ...box, x, y });
    }
    setLayers((current) => current.map((item, index) => (placed.has(item.id) ? { ...item, box: placed.get(item.id) } : item)));
  };

  // Distribui três ou mais camadas com espaços iguais, na horizontal ou na vertical.
  const distributeSelection = (axis: "x" | "y") => {
    const ids = [selectedLayerId, ...extraSelected].filter(Boolean);
    const targets = layers.map((item, index) => ({ item, box: boxOf(item, index) })).filter(({ item }) => ids.includes(item.id) && !item.locked);
    if (targets.length < 3) return notify("Selecione pelo menos três camadas para distribuir");
    const sorted = [...targets].sort((a, b) => (axis === "x" ? a.box.x - b.box.x : a.box.y - b.box.y));
    const size = (box: LayerBox) => (axis === "x" ? box.w : box.h);
    const start = axis === "x" ? sorted[0].box.x : sorted[0].box.y;
    const last = sorted[sorted.length - 1].box;
    const end = (axis === "x" ? last.x : last.y) + size(last);
    const totalSize = sorted.reduce((sum, { box }) => sum + size(box), 0);
    const gap = (end - start - totalSize) / (sorted.length - 1);
    const placed = new Map<string, number>();
    let cursor = start;
    for (const { item, box } of sorted) {
      placed.set(item.id, cursor);
      cursor += size(box) + gap;
    }
    setLayers((current) => current.map((item, index) => {
      if (!placed.has(item.id)) return item;
      const box = boxOf(item, index);
      return { ...item, box: axis === "x" ? { ...box, x: placed.get(item.id) as number } : { ...box, y: placed.get(item.id) as number } };
    }));
  };

  const finishEditing = (id: string, text: string) => {
    setEditingLayerId(null);
    updateLayer(id, { text: text.trim() ? text : undefined });
  };

  const deleteSelectedLayer = () => {
    if (!chosenLayer) return;
    if (chosenLayer.locked) return notify("Desbloqueie a layer antes de removê-la");
    setLayers((current) => current.filter((layer) => layer.id !== chosenLayer.id));
    setSelectedLayerId("");
    notify("Layer removida");
  };

  const duplicateLayer = () => {
    if (!chosenLayer) return;
    const box = boxOf(chosenLayer, layers.indexOf(chosenLayer));
    const copy: Layer = {
      ...chosenLayer,
      id: `${chosenLayer.kind}-${Date.now()}`,
      name: `${chosenLayer.name} copy`,
      locked: false,
      box: { ...box, x: clamp(box.x + 3, 0, 100 - box.w), y: clamp(box.y + 3, 0, 100 - box.h) },
    };
    setLayers((current) => [copy, ...current]);
    setSelectedLayerId(copy.id);
    notify("Layer duplicada");
  };

  // Arrastar move a camada; a alça do canto redimensiona. O histórico é gravado uma vez por gesto.
  const beginLayerPointer = (event: ReactPointerEvent<HTMLElement>, layer: Layer, index: number, mode: "move" | "resize") => {
    event.stopPropagation();
    if (event.shiftKey && mode === "move") {
      setExtraSelected((list) => (list.includes(layer.id) ? list.filter((id) => id !== layer.id) : [...list, layer.id]));
      return;
    }
    if (!extraSelected.includes(layer.id)) setExtraSelected([]);
    setSelectedLayerId(layer.id);
    if (layer.locked) return;
    const surface = event.currentTarget.closest(".artboard-shell") as HTMLElement | null;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY };
    const origin = boxOf(layer, index);
    const pageId = activePageId;
    const snapshot = layersByPage;
    let committed = false;

    const onMove = (moveEvent: PointerEvent) => {
      if (!committed) {
        committed = true;
        setUndoStack((stack) => [...stack.slice(-49), snapshot]);
        setRedoStack([]);
      }
      const dx = ((moveEvent.clientX - start.x) / rect.width) * 100;
      const dy = ((moveEvent.clientY - start.y) / rect.height) * 100;
      const others = layers.filter((item) => item.id !== layer.id && item.visible).map((item) => boxOf(item, layers.indexOf(item)));
      const xTargets = [0, 50, 100, ...others.flatMap((b) => [b.x, b.x + b.w / 2, b.x + b.w])];
      const yTargets = [0, 50, 100, ...others.flatMap((b) => [b.y, b.y + b.h / 2, b.y + b.h])];
      let next: LayerBox = mode === "move"
        ? { ...origin, x: clamp(origin.x + dx, 0, 100 - origin.w), y: clamp(origin.y + dy, 0, 100 - origin.h) }
        : { ...origin, w: clamp(origin.w + dx, 4, 100 - origin.x), h: clamp(origin.h + dy, 3, 100 - origin.y) };
      const xCandidates = mode === "move" ? [next.x, next.x + next.w / 2, next.x + next.w] : [next.x + next.w];
      const yCandidates = mode === "move" ? [next.y, next.y + next.h / 2, next.y + next.h] : [next.y + next.h];
      const snapX = nearestSnap(xCandidates, xTargets);
      const snapY = nearestSnap(yCandidates, yTargets);
      if (snapX) next = mode === "move" ? { ...next, x: next.x + snapX.diff } : { ...next, w: next.w + snapX.diff };
      if (snapY) next = mode === "move" ? { ...next, y: next.y + snapY.diff } : { ...next, h: next.h + snapY.diff };
      setGuides({ x: snapX ? [snapX.target] : [], y: snapY ? [snapY.target] : [] });
      setLayersByPage((prev) => ({
        ...prev,
        [pageId]: (prev[pageId] ?? starterLayers).map((item) => (item.id === layer.id ? { ...item, box: next } : item)),
      }));
    };
    const onUp = () => {
      setGuides({ x: [], y: [] });
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Atalhos: desfazer, refazer, duplicar e excluir. Ignorados quando o foco está em um campo de texto.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (mod && key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (mod && ((key === "z" && event.shiftKey) || key === "y")) {
        event.preventDefault();
        redo();
      } else if (mod && key === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      } else if (mod && key === "d") {
        event.preventDefault();
        duplicateLayer();
      } else if ((event.key === "Delete" || event.key === "Backspace") && chosenLayer) {
        event.preventDefault();
        deleteSelectedLayer();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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
    setIntegrations(availableIntegrations);
    setIntegrationsOpen(true);
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
  if (projectsRoute) return <>{/* Mensagens da tela de projetos */}<ProjectsScreen user={authUser} pages={pages} language={language} onLanguageChange={setLanguage} onOpenEditor={openEditor} onNewProject={createProject} onLogout={logout} />{toast && <div className="toast"><span className="toast-check">✓</span>{toast}</div>}</>;

  return (
    <main className={`app-shell ${preview ? "preview-mode" : ""}`}>
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><span>S</span><span>F</span></div>
          <div><div className="brand-name">siteforge<span>.</span></div><div className="brand-tag">visual web editor</div></div>
        </div>
        <div className="project-meta"><span className="status-pulse" /> <input className="project-name-input" aria-label="Nome do projeto" value={projectName} placeholder={editorCopy[language].untitled} maxLength={80} onChange={(event) => setProjectName(event.target.value)} onBlur={() => { void saveProject(); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /><span className="meta-divider" /> <span className="muted">{editorCopy[language].saved}</span></div>
        <div className="top-actions">
          <button className="icon-button subtle" aria-label={editorCopy[language].undo} title={editorCopy[language].undo} onClick={undo} disabled={undoStack.length === 0}><Undo2 size={15} /></button>
          <button className="icon-button subtle" aria-label={editorCopy[language].redo} title={editorCopy[language].redo} onClick={redo} disabled={redoStack.length === 0}><Redo2 size={15} /></button>
          <span className="top-divider" />
          <LanguageSelect value={language} onChange={setLanguage} />
          <button className="icon-button subtle" aria-label={editorCopy[language].theme} title={editorCopy[language].theme} onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}</button>
          <button className="secondary-button" onClick={() => setPreview((value) => !value)}><Play size={14} fill="currentColor" /> {preview ? ui.backToEdit : ui.preview}</button>
          <button className="publish-button" onClick={async () => { await saveProject(); const url = URL.createObjectURL(buildZip(exportSite(pages, (pageId) => layersByPage[pageId] ?? starterLayers, selectedColor, font))); const link = document.createElement("a"); link.href = url; link.download = "siteforge-site.zip"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify("Baixando o site exportado em .zip"); }}><Sparkles size={15} /> {saving ? ui.saving : ui.publish}</button>
          <button className={`avatar-button ${authUser ? "signed-in" : ""}`} aria-label={authUser ? "Abrir conta" : "Entrar"} onClick={() => setAuthOpen(true)}>{authUser ? (authUser.name || authUser.email).slice(0, 2).toUpperCase() : <LogIn size={14} />}</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="left-rail">
          <div className="rail-top">
            <button className="rail-icon active" aria-label="Editor"><MousePointer2 size={17} /></button>
            <button className="rail-icon" aria-label={ui.projects} onClick={openProjects}><FolderOpen size={17} /></button>
            <button className="rail-icon" aria-label="Assets" onClick={() => assetInputRef.current?.click()}><Grid2X2 size={17} /></button>
            <input ref={assetInputRef} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadAsset(file); event.target.value = ""; }} />
            <button className="rail-icon" aria-label="MCP" onClick={openMcp}><Plug size={17} /></button>
            <button className="rail-icon" aria-label="Configurações" onClick={openIntegrations}><Settings2 size={17} /></button>
          </div>
          <div className="rail-bottom"><button className="rail-icon" aria-label="Ajuda" onClick={() => notify("Ctrl+Z desfaz · Ctrl+D duplica · Delete exclui · Shift+clique seleciona várias")}><CircleHelp size={17} /></button><div className="rail-line" /><button className="rail-icon"><div className="tiny-avatar">JD</div></button></div>
        </aside>

        <aside className="sidebar left-sidebar">
          <div className="panel-heading"><div><span className="eyebrow">Project</span><h2>{editorCopy[language].structure}</h2></div><button className="icon-button" onClick={() => setShowMenu((value) => !value)}><Menu size={16} /></button></div>
          {showMenu && <div className="quick-menu"><button onClick={() => { void saveProject(); }}><Save size={14} /> Save project</button><button onClick={addPage}><Plus size={14} /> Add page</button><button onClick={openIntegrations}><Plug size={14} /> Integrations</button><button onClick={openMcp}><Plug size={14} /> MCP servers</button><button onClick={() => { setTemplatesOpen(true); setShowMenu(false); }}><WandSparkles size={14} /> Browse templates</button></div>}
          <div className="segmented-tabs"><button className={activeSide === "pages" ? "active" : ""} onClick={() => setActiveSide("pages")}><FileText size={13} /> {ui.pages} <span>{pages.length}</span></button><button className={activeSide === "layers" ? "active" : ""} onClick={() => setActiveSide("layers")}><Layers3 size={13} /> {ui.layers}</button></div>
          {activeSide === "pages" ? (
            <div className="sidebar-scroll page-list">
              <div className="section-label-row"><span>{ui.pages}</span><button onClick={addPage}><Plus size={14} /></button></div>
              {pages.map((page, index) => <div key={page.id} className={`page-card ${page.id === activePageId ? "active" : ""}`} role="button" tabIndex={0} onClick={() => selectPage(page)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") selectPage(page); }}><div className={`page-thumb thumb-${page.kind}`}><div className="thumb-orb" style={{ background: page.accent }} /><span>{String(index + 1).padStart(2, "0")}</span><div className="thumb-lines" /></div><div className="page-card-info">{renamingPageId === page.id ? <input autoFocus defaultValue={page.name} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "Enter") renamePage(page.id, event.currentTarget.value); if (event.key === "Escape") setRenamingPageId(null); }} onBlur={(event) => renamePage(page.id, event.currentTarget.value)} /> : <strong onDoubleClick={(event) => { event.stopPropagation(); setRenamingPageId(page.id); }}>{page.name}</strong>}<span>{page.path}</span></div><button className="page-move" aria-label={`Mover ${page.name} para cima`} onClick={(event) => { event.stopPropagation(); movePage(page.id, -1); }}><ChevronUp size={12} /></button><button className="page-move" aria-label={`Mover ${page.name} para baixo`} onClick={(event) => { event.stopPropagation(); movePage(page.id, 1); }}><ChevronDown size={12} /></button><button className="page-copy" aria-label={`Duplicar ${page.name}`} onClick={(event) => { event.stopPropagation(); selectPage(page); duplicatePage(page); }}><Copy size={12} /></button><button className="page-more" aria-label={`Excluir ${page.name}`} onClick={(event) => { event.stopPropagation(); removePage(page.id); }}><Trash2 size={13} /></button></div>)}
              <button className="add-page-dashed" onClick={addPage}><Plus size={14} /> {editorCopy[language].addNewPage}</button>
              <div className="sidebar-note"><span className="note-icon"><Zap size={13} fill="currentColor" /></span><div><strong>{editorCopy[language].tip}</strong><p>Use <kbd>⌘</kbd><kbd>K</kbd> to search any layer.</p></div></div>
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
          <div className="sidebar-footer"><div className="sync-status"><span className="live-dot" /> {authUser ? editorCopy[language].cloud : editorCopy[language].local} <span className="muted">·</span> {layerCount} {editorCopy[language].layersCount}</div><button className="icon-button" onClick={openIntegrations} aria-label="Abrir integrações"><Upload size={15} /></button></div>
        </aside>

        <section className="editor-stage">
          <div className="stage-toolbar">
            <div className="toolbar-group"><button className="tool-button active" title="Limpar seleção" onClick={() => { setSelectedLayerId(""); setExtraSelected([]); }}><MousePointer2 size={15} /> {editorCopy[language].select}</button><button className="tool-button" title="Inserir frame" onClick={() => addLayer("group", "Frame", BoxSelect, "Frame · auto")}><BoxSelect size={15} /> {editorCopy[language].frame}</button><button className="tool-button" title="Inserir texto" onClick={() => addLayer("text", "Texto", Type, "Texto · 32 px")}><Type size={15} /> {editorCopy[language].type}</button><button className="tool-button" title="Inserir imagem" onClick={() => assetInputRef.current?.click()}><ImageIcon size={15} /> {editorCopy[language].media}</button><button className="tool-button" title="Inserir objeto 3D" onClick={() => addLayer("scene", "Objeto 3D", Move3d, "Esfera · 3D", { shape: "orb" })}><Move3d size={15} /> {editorCopy[language].threeD}</button><button className="tool-button" title="Inserir seletor de idioma" onClick={() => addLayer("language", "Seletor de idioma", Languages, "Idiomas · 2", { languages: ["pt", "en"], box: { x: 74, y: 4, w: 20, h: 6 } })}><Languages size={15} /> Idioma</button><div className="element-menu-wrap"><button className="tool-button" title="Inserir elemento" onClick={() => setElementsOpen((open) => !open)}><Plus size={15} /> Elementos</button>{elementsOpen && <div className="quick-menu element-menu">{elementItems.map((item) => <button key={item.kind} onClick={() => { addLayer(item.kind, item.name, item.icon, item.detail, item.extra); setElementsOpen(false); }}><item.icon size={13} /> {item.name}</button>)}</div>}</div></div>
            <div className="toolbar-center"><button className={`device-button ${device === "desktop" ? "active" : ""}`} onClick={() => setDevice("desktop")}><Maximize2 size={13} /> {editorCopy[language].desktop}</button><button className={`device-button ${device === "tablet" ? "active" : ""}`} onClick={() => setDevice("tablet")}><Square size={12} /> {editorCopy[language].tablet}</button><button className={`device-button ${device === "mobile" ? "active" : ""}`} onClick={() => setDevice("mobile")}><PanelLeft size={12} /> {editorCopy[language].mobile}</button></div>
            <div className="toolbar-group right"><button className="icon-button" aria-label={editorCopy[language].search} title={editorCopy[language].search} onClick={() => setPaletteOpen(true)}><Search size={15} /></button><button className={`icon-button ${showGrid ? "active" : ""}`} aria-label="Mostrar grade" title="Mostrar grade" onClick={() => setShowGrid((value) => !value)}><Grid2X2 size={15} /></button><button className="zoom-button" onClick={() => setZoom((value) => value >= 100 ? 60 : value + 10)}>{zoom}% <ChevronDown size={13} /></button></div>
          </div>
          <div className={`canvas-wrap ${showGrid ? "show-grid" : ""}`}>
            <div className="canvas-topline"><span><span className="canvas-dot" /> {activePage?.name} <span className="muted">/ {activePage?.path}</span></span><span className="canvas-coordinates">x: 0 · y: 0 <span className="muted">·</span> 1440 × 900</span></div>
            <div className="align-bar" role="toolbar" aria-label="Alinhar">
              <button type="button" disabled={!selectedLayerId} onClick={() => alignSelection("left")}>Esquerda</button>
              <button type="button" disabled={!selectedLayerId} onClick={() => alignSelection("hcenter")}>Centro H</button>
              <button type="button" disabled={!selectedLayerId} onClick={() => alignSelection("right")}>Direita</button>
              <button type="button" disabled={!selectedLayerId} onClick={() => alignSelection("top")}>Topo</button>
              <button type="button" disabled={!selectedLayerId} onClick={() => alignSelection("vcenter")}>Meio V</button>
              <button type="button" disabled={!selectedLayerId} onClick={() => alignSelection("bottom")}>Base</button>
              <button type="button" disabled={!selectedLayerId} onClick={() => distributeSelection("x")}>Distribuir H</button>
              <button type="button" disabled={!selectedLayerId} onClick={() => distributeSelection("y")}>Distribuir V</button>
              {chosenLayer && (chosenLayer.kind === "button" || chosenLayer.kind === "text") && (
                <label className="link-picker">Link
                  <select value={chosenLayer.linkPageId ?? ""} onChange={(event) => updateLayer(chosenLayer.id, { linkPageId: event.target.value || undefined })}>
                    <option value="">Sem link</option>
                    {pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
                  </select>
                </label>
              )}
            </div>
            <div className={`artboard-shell device-${device}`} style={{ transform: `scale(${zoom / 100})` }}>
              <div className="artboard-grid" />
              <div className="edit-surface" onPointerDown={() => { if (!preview && editingLayerId === null) { setSelectedLayerId(""); setExtraSelected([]); } }} onPointerMove={(event) => { if (!preview) return; const rect = event.currentTarget.getBoundingClientRect(); setPointer({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 }); }}>
                {layers.map((layer, index) => ({ layer, index })).reverse().map(({ layer, index }) => {
                  const box = boxOf(layer, index);
                  const selected = !preview && (layer.id === selectedLayerId || extraSelected.includes(layer.id));
                  const editing = editingLayerId === layer.id;
                  const follow = preview && !!layer.follow && (layer.trigger ?? "move") === "move";
                  return (
                    <div
                      key={layer.id}
                      className={`edit-layer edit-${layer.kind}${selected ? " is-selected" : ""}${layer.locked ? " is-locked" : ""}${preview ? " is-preview" : ""}${preview && layer.linkPageId ? " is-linked" : ""}`}
                      style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`, zIndex: layers.length - index, display: layer.visible ? undefined : "none", opacity: ((layer.opacity ?? 100) / 100) * (preview && !!layer.follow && layer.trigger === "scroll" ? Math.max(0.15, scrollProgress) : 1), boxShadow: layer.glow ? `0 0 48px ${selectedColor}66` : undefined, borderRadius: layer.radius ?? 0, transform: `rotate(${layer.rotate ?? 0}deg) scale(${layer.scale ?? 1}) translate(${follow ? (pointer.x - 50) * ((layer.intensity ?? 12) / 100) : 0}%, ${follow ? (pointer.y - 50) * ((layer.intensity ?? 12) / 100) : 0}%) translateY(${preview && !!layer.follow && layer.trigger === "scroll" ? (1 - scrollProgress) * (layer.intensity ?? 12) : 0}px)` }}
                      onPointerDown={preview || editing ? undefined : (event) => beginLayerPointer(event, layer, index, "move")}
                      onDoubleClick={preview || layer.locked || (layer.kind !== "text" && layer.kind !== "button") ? undefined : () => setEditingLayerId(layer.id)}
                      onClick={preview && layer.linkPageId ? () => goToPage(layer.linkPageId as string) : undefined}
                    >
                      {layer.kind === "scene" ? (
                        <SceneCanvas key={layer.shape ?? "orb"} shape={layer.shape ?? "orb"} color={selectedColor} active={selected} preview={preview} onSelect={() => setSelectedLayerId(layer.id)} />
                      ) : layer.kind === "text" ? (
                        <p
                          className="edit-text"
                          style={{ fontFamily: font }}
                          contentEditable={editing}
                          suppressContentEditableWarning
                          ref={(el) => { if (el && editing) el.focus(); }}
                          onBlur={editing ? (event) => finishEditing(layer.id, event.currentTarget.innerText) : undefined}
                          onKeyDown={editing ? (event) => { if (event.key === "Escape") event.currentTarget.blur(); } : undefined}
                        >{shownText(layer)}</p>
                      ) : layer.kind === "button" ? (
                        <span
                          className="art-cta"
                          contentEditable={editing}
                          suppressContentEditableWarning
                          ref={(el) => { if (el && editing) el.focus(); }}
                          onBlur={editing ? (event) => finishEditing(layer.id, event.currentTarget.innerText) : undefined}
                          onKeyDown={editing ? (event) => { if (event.key === "Escape") event.currentTarget.blur(); } : undefined}
                        >{shownText(layer)}</span>
                      ) : layer.kind === "language" ? (
                        <SiteLanguageSwitch codes={layer.languages ?? ["pt", "en"]} value={siteLang} onChange={setSiteLang} style={layer.languageStyle ?? "select"} />
                      ) : layer.kind === "video" ? (
                        <div className={`edit-embed${preview ? " is-live" : ""}`}>{embedUrl(layer.src ?? "") ? <iframe src={embedUrl(layer.src ?? "")} title={layer.name} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <span className="edit-embed-empty"><Video size={16} /> Cole um link do YouTube ou Vimeo</span>}</div>
                      ) : layer.kind === "map" ? (
                        <div className={`edit-embed${preview ? " is-live" : ""}`}>{layer.src ? <iframe src={`https://www.google.com/maps?q=${encodeURIComponent(layer.src)}&output=embed`} title={layer.name} loading="lazy" /> : <span className="edit-embed-empty"><MapPin size={16} /> Digite um endereço</span>}</div>
                      ) : layer.kind === "shape" ? (
                        <div className="edit-shape" style={{ background: selectedColor, borderRadius: `${layer.radius ?? 0}%`, opacity: layer.opacity ?? 1 }} />
                      ) : layer.kind === "marquee" ? (
                        <div className="edit-marquee"><span>{shownText(layer)}</span></div>
                      ) : layer.kind === "social" ? (
                        <div className="edit-social">{(layer.socials ?? []).length === 0 ? <span className="edit-embed-empty">Adicione redes no inspetor</span> : (layer.socials ?? []).map((item) => { const net = socialNetworks.find((entry) => entry.id === item.id); return net ? <a key={item.id} className="social-chip" href={item.url || "#"} target="_blank" rel="noopener noreferrer" title={net.name} onClick={(event) => { if (!preview) event.preventDefault(); }}><img src={socialLogoUrl(net.slug)} alt={net.name} /></a> : null; })}</div>
                      ) : layer.kind === "form" ? (
                        <form className={`edit-form${preview ? " is-live" : ""}`} onSubmit={(event) => { event.preventDefault(); if (!preview) return; const endpoint = layer.src ?? ""; if (!/^https:\/\//.test(endpoint)) { notify("Configure um endereço https de envio no painel do formulário"); return; } fetch(endpoint, { method: "POST", body: new FormData(event.currentTarget), headers: { Accept: "application/json" } }).then((response) => notify(response.ok ? "Mensagem enviada" : "Não foi possível enviar a mensagem")).catch(() => notify("Falha de conexão ao enviar")); }}>{hasFormField(layer, "name") && <input name="name" placeholder="Nome" required />}{hasFormField(layer, "email") && <input name="email" placeholder="E-mail" type="email" required />}{hasFormField(layer, "phone") && <input name="phone" placeholder="Telefone" type="tel" />}{hasFormField(layer, "message") && <textarea name="message" placeholder="Mensagem" required />}<button type="submit">{layer.text || "Enviar"}</button></form>
                      ) : layer.kind === "ads" ? (
                        <div className="edit-ads"><AdSlot publisher={layer.src ?? ""} slot={layer.text ?? ""} live={preview} /></div>
                      ) : layer.kind === "image" ? (
                        <div className="edit-image" style={layer.src ? { backgroundImage: `url(${layer.src})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
                      ) : (
                        <span className="edit-frame-label">{preview ? "" : layer.name}</span>
                      )}
                      {selected && !layer.locked && <span className="edit-handle" onPointerDown={(event) => beginLayerPointer(event, layer, index, "resize")} />}
                    </div>
                  );
                })}
                {guides.x.map((x) => <div key={`gx-${x}`} className="snap-guide snap-guide-v" style={{ left: `${x}%` }} />)}
                {guides.y.map((y) => <div key={`gy-${y}`} className="snap-guide snap-guide-h" style={{ top: `${y}%` }} />)}
              </div>
              <div className="art-footer"><span>Scroll to explore</span><span className="footer-line" /><span>01 / 04</span></div>
            </div>
            <div className="canvas-bottomline"><div className="canvas-hint"><span className="key-hint">Space</span> to pan <span className="key-hint">⌘</span><span className="key-hint">+</span><span className="key-hint">K</span> quick actions</div><div className="canvas-info"><span><span className="live-dot" /> Live sync</span><span>Updated just now</span></div></div>
          </div>
        </section>

        <aside className="sidebar right-sidebar">
          <div className="inspector-heading"><div><span className="eyebrow">Inspector</span><h2>{selectedLayer?.name ?? "Layer"}</h2></div><button className="icon-button"><MoreDots /></button></div>
          <div className="inspector-tabs"><button className={activeInspector === "design" ? "active" : ""} onClick={() => setActiveInspector("design")}><Palette size={14} /> Design</button><button className={activeInspector === "animate" ? "active" : ""} onClick={() => setActiveInspector("animate")}><WandSparkles size={14} /> Animate <span className="new-badge">NEW</span></button><button className={activeInspector === "seo" ? "active" : ""} onClick={() => setActiveInspector("seo")}><Search size={14} /> SEO</button></div>
          {activeInspector === "design" ? <div className="inspector-scroll">
            <div className="inspector-section"><div className="inspector-section-title">Layout <ChevronDown size={14} /></div><div className="property-grid">{(["x", "y", "w", "h"] as const).map((key) => (
                <label key={key} className="property-field"><span>{key.toUpperCase()} %</span><input type="number" min={0} max={100} disabled={!chosenLayer || chosenLayer.locked} value={chosenLayer ? Math.round(boxOf(chosenLayer, layers.indexOf(chosenLayer))[key] * 10) / 10 : 0} onChange={(event) => { if (!chosenLayer) return; const box = boxOf(chosenLayer, layers.indexOf(chosenLayer)); updateLayer(chosenLayer.id, { box: { ...box, [key]: Number(event.target.value) } }); }} /></label>
              ))}</div><div className="property-line"><span>Position</span><div className="segmented-mini"><button className="active">Abs</button><button>Rel</button><button>Fix</button></div></div></div>
            <div className="inspector-section"><div className="inspector-section-title">Transform <ChevronDown size={14} /></div><div className="property-grid">{([
                { key: "rotate", label: "Rotate °", min: -180, max: 180, fallback: 0 },
                { key: "radius", label: "Radius px", min: 0, max: 200, fallback: 0 },
                { key: "scale", label: "Scale", min: 0.1, max: 4, fallback: 1 },
                { key: "opacity", label: "Opacity %", min: 0, max: 100, fallback: 100 },
              ] as const).map((field) => (
                <label key={field.key} className="property-field"><span>{field.label}</span><input type="number" min={field.min} max={field.max} disabled={!chosenLayer} value={chosenLayer?.[field.key] ?? field.fallback} onChange={(event) => { if (!chosenLayer) return; const value = Number(event.target.value); updateLayer(chosenLayer.id, field.key === "rotate" ? { rotate: value } : field.key === "radius" ? { radius: value } : field.key === "scale" ? { scale: value } : { opacity: value }); }} /></label>
              ))}</div></div>
            <div className="inspector-section"><div className="inspector-section-title">Appearance <ChevronDown size={14} /></div><div className="color-row"><span>Fill</span><button className="color-control" onClick={() => setSelectedColor(selectedColor === "#b8ff3d" ? "#8f9dff" : "#b8ff3d")}><span style={{ background: selectedColor }} />{selectedColor}<ChevronRight size={13} /></button></div><div className="color-row"><span>Gradient</span><button className="gradient-control"><span />linear · 135° <ChevronRight size={13} /></button></div><div className="swatch-row">{colorSwatches.map((color) => <button key={color} className={`swatch ${selectedColor === color ? "active" : ""}`} style={{ background: color }} onClick={() => setSelectedColor(color)} aria-label={`Selecionar cor ${color}`} />)}<button className="swatch-add"><Plus size={13} /></button></div></div>
            <div className="inspector-section"><div className="inspector-section-title">Typography <ChevronDown size={14} /></div><div className="select-field"><Type size={13} /><select value={font} onChange={(event) => setFont(event.target.value)}><option>Space Grotesk</option><option>DM Sans</option><option>Instrument Serif</option></select><ChevronDown size={13} /></div><div className="property-grid"><Property label="Weight" value="Medium" /><Property label="Size" value="64 px" /><Property label="Line" value="0.95" /><Property label="Track" value="-0.03em" /></div></div>
            {chosenLayer?.kind === "scene" && <div className="inspector-section"><div className="inspector-section-title">Forma 3D <ChevronDown size={14} /></div><div className="shape-grid">{(Object.keys(shapeOptions) as Shape3D[]).map((shape) => <button key={shape} className={chosenLayer.shape === shape || (!chosenLayer.shape && shape === "orb") ? "active" : ""} onClick={() => updateLayer(chosenLayer.id, { shape })}>{shapeOptions[shape]}</button>)}</div></div>}
            {chosenLayer && (chosenLayer.kind === "video" || chosenLayer.kind === "map") && <div className="inspector-section"><div className="inspector-section-title">Conteúdo <ChevronDown size={14} /></div><label className="property-field stacked"><span>{chosenLayer.kind === "video" ? "Link do vídeo (YouTube ou Vimeo, https)" : "Endereço no mapa"}</span><input value={chosenLayer.src ?? ""} onChange={(event) => updateLayer(chosenLayer.id, { src: event.target.value })} /></label></div>}
            {chosenLayer?.kind === "social" && <div className="inspector-section"><div className="inspector-section-title">Redes sociais <ChevronDown size={14} /></div><div className="social-picker">{socialNetworks.map((net) => { const on = (chosenLayer.socials ?? []).some((item) => item.id === net.id); return <button key={net.id} className={on ? "active" : ""} onClick={() => { const current = chosenLayer.socials ?? []; updateLayer(chosenLayer.id, { socials: on ? current.filter((item) => item.id !== net.id) : [...current, { id: net.id, url: "" }] }); }}><img src={socialLogoUrl(net.slug)} alt="" />{net.name}</button>; })}</div>{(chosenLayer.socials ?? []).map((item) => <label key={item.id} className="property-field stacked"><span>{socialNetworks.find((net) => net.id === item.id)?.name} · link</span><input value={item.url} placeholder="https://" onChange={(event) => updateLayer(chosenLayer.id, { socials: (chosenLayer.socials ?? []).map((entry) => entry.id === item.id ? { ...entry, url: event.target.value.trim() } : entry) })} /></label>)}{(chosenLayer.socials ?? []).length === 0 && <p className="translation-hint">Escolha as redes acima para mostrar os logos no site.</p>}</div>}
            {chosenLayer && chosenLayer.kind === "marquee" && <div className="inspector-section"><div className="inspector-section-title">Conteúdo <ChevronDown size={14} /></div><label className="property-field stacked"><span>Texto que rola</span><input value={chosenLayer.text ?? ""} onChange={(event) => updateLayer(chosenLayer.id, { text: event.target.value })} /></label></div>}
            {chosenLayer?.kind === "image" && <div className="inspector-section"><div className="inspector-section-title">Acessibilidade <ChevronDown size={14} /></div><label className="property-field stacked"><span>Texto alternativo</span><input value={chosenLayer.alt ?? ""} placeholder="Descreva a imagem" onChange={(event) => updateLayer(chosenLayer.id, { alt: event.target.value })} /></label>{!chosenLayer.alt && <p className="a11y-warning">Falta texto alternativo: leitores de tela não descrevem esta imagem.</p>}</div>}
            {chosenLayer?.kind === "form" && <div className="inspector-section"><div className="inspector-section-title">Campos do formulário <ChevronDown size={14} /></div><div className="social-picker">{formFieldOptions.map(([key, label]) => { const on = (chosenLayer.formFields ?? defaultFormFields).includes(key); return <button key={key} className={on ? "active" : ""} onClick={() => { const current = chosenLayer.formFields ?? defaultFormFields; updateLayer(chosenLayer.id, { formFields: on ? current.filter((item) => item !== key) : [...current, key] }); }}>{label}</button>; })}</div><label className="property-field stacked"><span>Texto do botão</span><input value={chosenLayer.text ?? ""} placeholder="Enviar" onChange={(event) => updateLayer(chosenLayer.id, { text: event.target.value })} /></label></div>}
            {chosenLayer?.kind === "form" && <div className="inspector-section"><div className="inspector-section-title">Envio do formulário <ChevronDown size={14} /></div><label className="property-field stacked"><span>Endereço de envio (https)</span><input value={chosenLayer.src ?? ""} placeholder="https://formspree.io/f/..." onChange={(event) => updateLayer(chosenLayer.id, { src: event.target.value.trim() })} /></label>{!/^https:\/\//.test(chosenLayer.src ?? "") && <p className="a11y-warning">Sem endereço de envio, as mensagens não são recebidas.</p>}</div>}
            {chosenLayer?.kind === "ads" && <div className="inspector-section"><div className="inspector-section-title">AdSense <ChevronDown size={14} /></div><label className="property-field stacked"><span>ID do editor (ca-pub-…)</span><input value={chosenLayer.src ?? ""} placeholder="ca-pub-0000000000000000" onChange={(event) => updateLayer(chosenLayer.id, { src: event.target.value.trim() })} /></label><label className="property-field stacked"><span>ID do bloco de anúncio</span><input value={chosenLayer.text ?? ""} placeholder="1234567890" onChange={(event) => updateLayer(chosenLayer.id, { text: event.target.value.trim() })} /></label><p className="translation-hint">Os anúncios aparecem só na pré-visualização, depois que sua conta AdSense for aprovada para o domínio.</p></div>}
            {chosenLayer?.kind === "language" && <div className="inspector-section"><div className="inspector-section-title">Idiomas do site <ChevronDown size={14} /></div><label className="property-field stacked translation-field"><span>Idioma original dos textos</span><select value={chosenLayer.sourceLanguage ?? "pt"} onChange={(event) => updateLayer(chosenLayer.id, { sourceLanguage: event.target.value })}>{Object.keys(siteLanguages).map((code) => <option key={code} value={code}>{siteLanguages[code]}</option>)}</select></label><div className="shape-grid lang-style-grid"><button className={(chosenLayer.languageStyle ?? "select") === "select" ? "active" : ""} onClick={() => updateLayer(chosenLayer.id, { languageStyle: "select" })}>Menu</button><button className={chosenLayer.languageStyle === "buttons" ? "active" : ""} onClick={() => updateLayer(chosenLayer.id, { languageStyle: "buttons" })}>Botões</button></div><div className="shape-grid">{Object.keys(siteLanguages).map((code) => { const active = (chosenLayer.languages ?? []).includes(code); return <button key={code} className={active ? "active" : ""} onClick={() => { const current = chosenLayer.languages ?? []; updateLayer(chosenLayer.id, { languages: active ? current.filter((item) => item !== code) : [...current, code] }); }}>{siteLanguages[code]}</button>; })}</div></div>}
            {chosenLayer && (chosenLayer.kind === "text" || chosenLayer.kind === "button") && <div className="inspector-section"><div className="inspector-section-title">Tradução <ChevronDown size={14} /></div><div className="effect-row"><div><strong>Não traduzir</strong><span>Mantém este elemento no idioma original</span></div><button className={`toggle ${chosenLayer.noTranslate ? "active" : ""}`} onClick={() => updateLayer(chosenLayer.id, { noTranslate: !chosenLayer.noTranslate })}><span /></button></div></div>}
            {chosenLayer && (chosenLayer.kind === "text" || chosenLayer.kind === "button") && siteLanguageCodes.length > 0 && !chosenLayer.noTranslate && <div className="inspector-section"><div className="inspector-section-title">Traduções <ChevronDown size={14} /></div><p className="translation-hint">Os textos são traduzidos automaticamente ao escolher um idioma no site. Escreva abaixo se quiser substituir a tradução automática.</p>{siteLanguageCodes.map((code) => <label key={code} className="property-field translation-field"><span>{siteLanguages[code]}</span><input value={chosenLayer.translations?.[code] ?? ""} placeholder={chosenLayer.text ?? ""} onChange={(event) => updateLayer(chosenLayer.id, { translations: { ...(chosenLayer.translations ?? {}), [code]: event.target.value } })} /></label>)}</div>}
            <div className="inspector-section"><div className="inspector-section-title">Effects <ChevronDown size={14} /></div><div className="effect-row"><div className="effect-icon"><Sparkles size={14} /></div><div><strong>Soft glow</strong><span>Screen · 22%</span></div><button className={`toggle ${chosenLayer?.glow ? "active" : ""}`} onClick={() => { if (chosenLayer) updateLayer(chosenLayer.id, { glow: !chosenLayer.glow }); }}><span /></button></div><div className="effect-row"><div className="effect-icon dark"><Box size={14} /></div><div><strong>Noise texture</strong><span>Overlay · 12%</span></div><button className={`toggle ${layers.find((item) => item.id === "noise")?.visible !== false ? "active" : ""}`} onClick={() => { const noise = layers.find((item) => item.id === "noise"); if (noise) updateLayer(noise.id, { visible: !noise.visible }); }}><span /></button></div></div>
          </div> : activeInspector === "seo" && activePage ? <div className="inspector-scroll">
            <div className="inspector-section"><div className="inspector-section-title">SEO da página <ChevronDown size={14} /></div>
              <label className="property-field stacked"><span>Título ({(activePage.seoTitle ?? "").length}/60)</span><input value={activePage.seoTitle ?? ""} maxLength={60} placeholder={activePage.name} onChange={(event) => setPages((current) => current.map((item) => item.id === activePage.id ? { ...item, seoTitle: event.target.value } : item))} onBlur={() => { void saveProject(); }} /></label>
              <label className="property-field stacked"><span>Descrição ({(activePage.seoDescription ?? "").length}/160)</span><textarea className="seo-textarea" value={activePage.seoDescription ?? ""} maxLength={160} placeholder="Resuma o conteúdo desta página em até 160 caracteres." onChange={(event) => setPages((current) => current.map((item) => item.id === activePage.id ? { ...item, seoDescription: event.target.value } : item))} onBlur={() => { void saveProject(); }} /></label>
              <label className="property-field stacked"><span>Palavras-chave</span><input value={activePage.seoKeywords ?? ""} placeholder="design, portfólio, estúdio" onChange={(event) => setPages((current) => current.map((item) => item.id === activePage.id ? { ...item, seoKeywords: event.target.value } : item))} onBlur={() => { void saveProject(); }} /></label>
              <div className="seo-preview"><span className="seo-url">{activePage.path}</span><strong>{activePage.seoTitle || activePage.name}</strong><p>{activePage.seoDescription || "Sem descrição. Buscadores vão mostrar um trecho do texto da página."}</p></div>
              <p className="translation-hint">Esses dados são salvos no projeto e aplicados na pré-visualização (título da aba e descrição).</p>
            </div>
          </div> : <div className="inspector-scroll"><div className="animation-card"><div className="animation-icon"><MousePointer2 size={16} /></div><div><span className="eyebrow">Pointer interaction</span><h3>Follow cursor</h3><p>Object subtly leans toward the pointer position.</p></div><button className={`toggle ${chosenLayer?.follow ? "active" : ""}`} onClick={() => { if (chosenLayer) updateLayer(chosenLayer.id, { follow: !chosenLayer.follow }); }}><span /></button></div><div className="inspector-section"><div className="inspector-section-title">Trigger <ChevronDown size={14} /></div><div className="select-field"><MousePointer2 size={13} /><select value={chosenLayer?.trigger ?? "move"} disabled={!chosenLayer} onChange={(event) => { if (chosenLayer) updateLayer(chosenLayer.id, { trigger: event.target.value as "move" | "scroll" }); }}><option value="move">Ao mover o mouse</option><option value="scroll">Ao rolar a página</option></select><ChevronDown size={13} /></div></div><div className="inspector-section"><div className="inspector-section-title">Motion curve <ChevronDown size={14} /></div><div className="curve-preview"><span /><span /><span /><span /><span /></div><div className="curve-labels"><span>Gentle</span><span>Spring</span></div></div><div className="inspector-section"><div className="inspector-section-title">Response <ChevronDown size={14} /></div><label className="property-field stacked"><span>Intensity %</span><input type="number" min={0} max={100} disabled={!chosenLayer} value={chosenLayer?.intensity ?? 12} onChange={(event) => { if (chosenLayer) updateLayer(chosenLayer.id, { intensity: Number(event.target.value) }); }} /></label><Property label="Duration" value="800 ms" /><Property label="Delay" value="0 ms" /></div></div>}
          <div className="inspector-footer"><button className="delete-button" onClick={deleteSelectedLayer}><Trash2 size={14} /> Delete layer</button><span className="muted">{selectedLayer?.locked ? "Locked" : "Editable"}</span></div>
        </aside>
      </div>

      {templatesOpen && !preview && <div className="template-menu">{templates.map((template) => <button key={template.id} onClick={() => applyTemplate(template)}>{template.name}</button>)}<button onClick={() => setTemplatesOpen(false)}>Fechar</button></div>}
      {!preview && <div className="bottom-dock"><div className="dock-label"><span className="dock-icon"><Plus size={14} /></span><strong>Add to canvas</strong></div><button onClick={() => addLayer("text", "Text block", Type, "Space Grotesk · 24 px")}><Type size={14} /> Text</button><button onClick={() => addLayer("button", "Button", Square, "Button · secondary")}><Square size={14} /> Button</button><button onClick={() => addLayer("image", "Image", ImageIcon, "Image · crop fill")}><ImageIcon size={14} /> Image</button><button onClick={() => addLayer("group", "Container", Box, "Frame · auto layout")}><Box size={14} /> Container</button><button onClick={() => addLayer("scene", "3D object", Move3d, "Three.js · mesh")}><Move3d size={14} /> 3D object</button><span className="dock-spacer" /><button className="dock-more" onClick={() => setTemplatesOpen((open) => !open)}><Plus size={14} /> More</button></div>}
      {preview && <div className="preview-banner"><span><span className="live-dot" /> Preview mode</span><span>Move your cursor over the canvas to feel the scene respond.</span><button onClick={() => setPreview(false)}><X size={14} /> Exit preview</button></div>}
      {paletteOpen && <div className="palette-backdrop" onMouseDown={() => setPaletteOpen(false)}><section className="palette" onMouseDown={(event) => event.stopPropagation()}>
        <input autoFocus placeholder="Buscar páginas e camadas" value={paletteQuery} onChange={(event) => setPaletteQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setPaletteOpen(false); }} />
        <div className="palette-list">
          {pages.filter((page) => page.name.toLowerCase().includes(paletteQuery.toLowerCase())).map((page) => <button key={page.id} onClick={() => { selectPage(page); setPaletteOpen(false); setPaletteQuery(""); }}><span>Página</span>{page.name}</button>)}
          {layers.filter((layer) => layer.name.toLowerCase().includes(paletteQuery.toLowerCase())).map((layer) => <button key={layer.id} onClick={() => { setSelectedLayerId(layer.id); setActiveSide("layers"); setPaletteOpen(false); setPaletteQuery(""); }}><span>Camada</span>{layer.name}</button>)}
        </div>
      </section></div>}
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
  return <label className="property-field stacked"><span>{icon}{label}</span><input value={value} readOnly /></label>;
}

function MoreDots() {
  return <span className="more-dots"><i /><i /><i /></span>;
}

export default App;
