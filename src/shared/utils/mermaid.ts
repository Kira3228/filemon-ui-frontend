let mermaidLoader: Promise<any> | null = null;

const MERMAID_SRC = "https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js";

const getMermaid = () => (window as any).mermaid;

export const loadMermaid = async () => {
  if (getMermaid()) {
    return getMermaid();
  }

  if (mermaidLoader) {
    return mermaidLoader;
  }

  mermaidLoader = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[data-mermaid-loader="true"]`) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(getMermaid()), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Mermaid failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = MERMAID_SRC;
    script.async = true;
    script.dataset.mermaidLoader = "true";
    script.onload = () => resolve(getMermaid());
    script.onerror = () => reject(new Error("Mermaid failed to load"));
    document.head.appendChild(script);
  });

  return mermaidLoader;
};
