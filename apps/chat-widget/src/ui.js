import { injectStyles } from "./styles.js";

function formatTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function isVisitorMessage(message) {
  return message.sender?.kind === "visitor" || message.direction === "inbound";
}

function messageClass(message) {
  if (isVisitorMessage(message)) {
    return "is-visitor";
  }
  if (message.contentType === "system_event") {
    return "is-system";
  }
  return "is-agent";
}

function messageLabel(message) {
  if (isVisitorMessage(message)) {
    return "You";
  }
  if (message.sender?.displayName) {
    return message.sender.displayName;
  }
  if (message.contentType === "system_event") {
    return "System";
  }
  return "Agent";
}

export function createWidgetUi({ theme, siteName, onToggle, onClose, onSend }) {
  injectStyles(theme);

  const root = document.createElement("div");
  root.className = "ongocare-chat-root";
  root.innerHTML = `
    <div class="ongocare-chat-panel" role="dialog" aria-label="Chat">
      <div class="ongocare-chat-header">
        <p class="ongocare-chat-header-title"></p>
        <button type="button" class="ongocare-chat-close" aria-label="Close chat">&times;</button>
      </div>
      <div class="ongocare-chat-messages" aria-live="polite"></div>
      <div class="ongocare-chat-status" hidden></div>
      <form class="ongocare-chat-composer">
        <textarea
          class="ongocare-chat-input"
          rows="1"
          maxlength="4000"
          placeholder="Type your message..."
          aria-label="Message"
        ></textarea>
        <button type="submit" class="ongocare-chat-send">Send</button>
      </form>
    </div>
    <button type="button" class="ongocare-chat-launcher" aria-expanded="false">
      <span class="ongocare-chat-launcher-label"></span>
    </button>
  `;

  const panel = root.querySelector(".ongocare-chat-panel");
  const launcher = root.querySelector(".ongocare-chat-launcher");
  const closeButton = root.querySelector(".ongocare-chat-close");
  const title = root.querySelector(".ongocare-chat-header-title");
  const messagesEl = root.querySelector(".ongocare-chat-messages");
  const statusEl = root.querySelector(".ongocare-chat-status");
  const form = root.querySelector(".ongocare-chat-composer");
  const input = root.querySelector(".ongocare-chat-input");
  const sendButton = root.querySelector(".ongocare-chat-send");

  title.textContent = theme.headerTitle || siteName || "Chat with us";

  let isOpen = false;
  let isSending = false;

  function setOpen(nextOpen) {
    isOpen = nextOpen;
    root.classList.toggle("is-open", isOpen);
    launcher.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      input.focus();
    }
    onToggle(isOpen);
  }

  launcher.addEventListener("click", () => setOpen(!isOpen));
  closeButton.addEventListener("click", () => {
    setOpen(false);
    onClose();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = input.value.trim();
    if (!body || isSending) {
      return;
    }

    isSending = true;
    sendButton.disabled = true;
    input.disabled = true;

    try {
      await onSend(body);
      input.value = "";
    } finally {
      isSending = false;
      sendButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  function setStatus(message) {
    if (!message) {
      statusEl.hidden = true;
      statusEl.textContent = "";
      return;
    }
    statusEl.hidden = false;
    statusEl.textContent = message;
  }

  function renderMessages(messages) {
    messagesEl.innerHTML = "";

    if (!messages.length) {
      const empty = document.createElement("div");
      empty.className = "ongocare-chat-empty";
      empty.textContent = theme.welcomeMessage || "Send us a message and we will reply shortly.";
      messagesEl.appendChild(empty);
      return;
    }

    for (const message of messages) {
      const bubble = document.createElement("div");
      bubble.className = `ongocare-chat-message ${messageClass(message)}`;
      bubble.textContent = message.body || message.preview || "";
      const meta = document.createElement("span");
      meta.className = "ongocare-chat-message-meta";
      meta.textContent = `${messageLabel(message)} · ${formatTime(message.occurredAt)}`;
      bubble.appendChild(meta);
      messagesEl.appendChild(bubble);
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function mount() {
    document.body.appendChild(root);
  }

  function destroy() {
    root.remove();
  }

  return {
    mount,
    destroy,
    setOpen,
    isOpen: () => isOpen,
    renderMessages,
    setStatus,
    setComposerEnabled(enabled) {
      input.disabled = !enabled;
      sendButton.disabled = !enabled;
    },
  };
}
