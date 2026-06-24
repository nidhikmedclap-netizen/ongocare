export const STYLE_ID = "ongocare-chat-widget-styles";

export function injectStyles(theme = {}) {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const primary = theme.primaryColor || "#0f766e";
  const accent = theme.accentColor || "#14b8a6";
  const text = theme.textColor || "#111827";
  const surface = theme.surfaceColor || "#ffffff";
  const launcherLabel = theme.launcherLabel || "Chat";

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .ongocare-chat-root {
      --ongocare-primary: ${primary};
      --ongocare-accent: ${accent};
      --ongocare-text: ${text};
      --ongocare-surface: ${surface};
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2147483000;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ongocare-text);
    }

    .ongocare-chat-launcher {
      border: 0;
      border-radius: 999px;
      background: var(--ongocare-primary);
      color: #fff;
      padding: 12px 18px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
    }

    .ongocare-chat-panel {
      display: none;
      width: min(360px, calc(100vw - 32px));
      height: min(520px, calc(100vh - 120px));
      background: var(--ongocare-surface);
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.28);
      overflow: hidden;
      flex-direction: column;
      margin-bottom: 12px;
    }

    .ongocare-chat-root.is-open .ongocare-chat-panel {
      display: flex;
    }

    .ongocare-chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      background: var(--ongocare-primary);
      color: #fff;
    }

    .ongocare-chat-header-title {
      font-size: 15px;
      font-weight: 600;
      margin: 0;
    }

    .ongocare-chat-close {
      border: 0;
      background: transparent;
      color: inherit;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
    }

    .ongocare-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .ongocare-chat-message {
      max-width: 85%;
      padding: 10px 12px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.45;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .ongocare-chat-message.is-visitor {
      align-self: flex-end;
      background: var(--ongocare-accent);
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    .ongocare-chat-message.is-agent,
    .ongocare-chat-message.is-system {
      align-self: flex-start;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 4px;
    }

    .ongocare-chat-message-meta {
      display: block;
      margin-top: 4px;
      font-size: 11px;
      opacity: 0.75;
    }

    .ongocare-chat-empty {
      margin: auto;
      text-align: center;
      color: #64748b;
      font-size: 14px;
      padding: 0 12px;
    }

    .ongocare-chat-composer {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #e2e8f0;
      background: var(--ongocare-surface);
    }

    .ongocare-chat-input {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px 12px;
      font: inherit;
      resize: none;
      min-height: 42px;
      max-height: 120px;
    }

    .ongocare-chat-send {
      border: 0;
      border-radius: 10px;
      background: var(--ongocare-primary);
      color: #fff;
      padding: 0 14px;
      font-weight: 600;
      cursor: pointer;
    }

    .ongocare-chat-send:disabled,
    .ongocare-chat-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .ongocare-chat-status {
      padding: 8px 12px;
      font-size: 12px;
      color: #b45309;
      background: #fffbeb;
      border-top: 1px solid #fde68a;
    }

    .ongocare-chat-launcher-label::after {
      content: "${launcherLabel.replace(/"/g, '\\"')}";
    }
  `;

  document.head.appendChild(style);
}
