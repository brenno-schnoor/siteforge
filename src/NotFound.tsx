import { url } from "./paths";

// Exibida quando o caminho não corresponde a nenhuma rota do site.
export default function NotFound() {
  const lang = navigator.language.toLowerCase().startsWith("pt") ? "pt" : navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
  const copy = {
    pt: { kicker: "erro 404", titleA: "Esta página", titleB: "saiu de cena.", intro: "O endereço que você acessou não existe ou foi movido.", back: "Voltar para o início" },
    en: { kicker: "error 404", titleA: "This page", titleB: "left the scene.", intro: "The address you opened doesn't exist or has moved.", back: "Back to home" },
    es: { kicker: "error 404", titleA: "Esta página", titleB: "salió de escena.", intro: "La dirección que abriste no existe o fue movida.", back: "Volver al inicio" },
  }[lang];

  return (
    <main className="public-main inner-page not-found-page">
      <div className="inner-hero">
        <span className="public-kicker">{copy.kicker}</span>
        <h1>{copy.titleA}<br /><em>{copy.titleB}</em></h1>
        <p>{copy.intro}</p>
        <a className="public-cta" href={url("/")}>{copy.back}</a>
      </div>
    </main>
  );
}
