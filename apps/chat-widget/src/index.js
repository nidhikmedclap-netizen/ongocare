import { createWidget } from "./widget.js";

let activeWidget = null;

function initWidget(config = {}) {
  if (activeWidget) {
    activeWidget.destroy();
  }
  activeWidget = createWidget(config);
  activeWidget.init();
  return activeWidget;
}

function exposeApi() {
  const pending = Array.isArray(window.OngoChat?.q) ? window.OngoChat.q : [];

  window.OngoChat = {
    init: initWidget,
    destroy() {
      if (activeWidget) {
        activeWidget.destroy();
        activeWidget = null;
      }
    },
    open() {
      return activeWidget?.open();
    },
    close() {
      activeWidget?.close();
    },
  };

  for (const config of pending) {
    initWidget(config);
  }
}

exposeApi();
