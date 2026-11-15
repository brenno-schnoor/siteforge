import { Component, type ErrorInfo, type ReactNode } from "react";

// Se o editor quebrar, mostra a mensagem do erro em vez de deixar a tela preta.
type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("SiteForge: erro na tela", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="error-screen">
        <div className="error-card">
          <span className="eyebrow">Erro na tela</span>
          <h1>O editor parou nesta visualização</h1>
          <p>Envie a mensagem abaixo para correção. Seus projetos locais continuam salvos neste dispositivo.</p>
          <pre className="error-message">{`${error.name}: ${error.message}\n${(error.stack ?? "").split("\n").slice(1, 5).join("\n")}`}</pre>
          <div className="error-actions">
            <button onClick={() => window.location.reload()}>Recarregar</button>
            <button className="ghost" onClick={() => { try { localStorage.removeItem("siteforge-accent"); } catch { /* ignorado */ } this.setState({ error: null }); }}>Tentar de novo</button>
          </div>
        </div>
      </main>
    );
  }
}
