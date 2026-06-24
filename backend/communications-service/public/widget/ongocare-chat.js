var OngoChatBundle=(()=>{function A(t,o){return`${String(t).replace(/\/+$/,"")}${o}`}function E(t){return t.json().catch(()=>({}))}function U({apiBase:t,siteKey:o}){async function i({visitorId:s,pageUrl:c,pageTitle:l,referrer:r,locale:d}){let p=await fetch(A(t,"/api/chat/widget/bootstrap"),{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({siteKey:o,visitorId:s||void 0,pageUrl:c,pageTitle:l,referrer:r,locale:d})}),e=await E(p);if(!p.ok||!e.ok)throw new Error(e.error||`bootstrap_failed_${p.status}`);return e}async function u({visitorId:s,visitorToken:c}){let l=await fetch(A(t,"/api/chat/sessions"),{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${c}`},body:JSON.stringify({siteKey:o,visitorId:s})}),r=await E(l);if(!l.ok||!r.ok)throw new Error(r.error||`session_start_failed_${l.status}`);return r}async function h({sessionId:s,visitorToken:c,body:l,clientMessageId:r}){let d=await fetch(A(t,`/api/chat/sessions/${encodeURIComponent(s)}/messages`),{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${c}`},body:JSON.stringify({body:l,clientMessageId:r})}),p=await E(d);if(!d.ok||!p.ok)throw new Error(p.error||`send_failed_${d.status}`);return p}async function a({sessionId:s,visitorToken:c,since:l}){let r=l?`?since=${encodeURIComponent(l)}`:"",d=await fetch(A(t,`/api/chat/sessions/${encodeURIComponent(s)}/messages${r}`),{method:"GET",headers:{Accept:"application/json",Authorization:`Bearer ${c}`}}),p=await E(d);if(!d.ok||!p.ok)throw new Error(p.error||`poll_failed_${d.status}`);return p}return{bootstrap:i,startSession:u,sendMessage:h,listMessages:a}}function q(t){if(t.apiBase)return String(t.apiBase).replace(/\/+$/,"");let o=document.currentScript;if(o!=null&&o.src)try{let i=new URL(o.src);return`${i.protocol}//${i.host}`}catch(i){}return"https://communications.ongocare.com"}var J="ongocare.chat.";function I(t,o){return`${J}${t}.${o}`}function N(t){try{let o=localStorage.getItem(I(t,"visitorId")),i=localStorage.getItem(I(t,"visitorToken")),u=localStorage.getItem(I(t,"sessionId"));return{visitorId:o,visitorToken:i,sessionId:u}}catch(o){return{visitorId:null,visitorToken:null,sessionId:null}}}function j(t,o){try{o.visitorId&&localStorage.setItem(I(t,"visitorId"),o.visitorId),o.visitorToken&&localStorage.setItem(I(t,"visitorToken"),o.visitorToken),o.sessionId&&localStorage.setItem(I(t,"sessionId"),o.sessionId)}catch(i){}}function z(t){try{localStorage.removeItem(I(t,"sessionId"))}catch(o){}}var D="ongocare-chat-widget-styles";function B(t={}){if(document.getElementById(D))return;let o=t.primaryColor||"#0f766e",i=t.accentColor||"#14b8a6",u=t.textColor||"#111827",h=t.surfaceColor||"#ffffff",a=t.launcherLabel||"Chat",s=document.createElement("style");s.id=D,s.textContent=`
    .ongocare-chat-root {
      --ongocare-primary: ${o};
      --ongocare-accent: ${i};
      --ongocare-text: ${u};
      --ongocare-surface: ${h};
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
      content: "${a.replace(/"/g,'\\"')}";
    }
  `,document.head.appendChild(s)}function Y(t){if(!t)return"";try{return new Date(t).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}catch(o){return""}}function P(t){var o;return((o=t.sender)==null?void 0:o.kind)==="visitor"||t.direction==="inbound"}function H(t){return P(t)?"is-visitor":t.contentType==="system_event"?"is-system":"is-agent"}function W(t){var o;return P(t)?"You":(o=t.sender)!=null&&o.displayName?t.sender.displayName:t.contentType==="system_event"?"System":"Agent"}function R({theme:t,siteName:o,onToggle:i,onClose:u,onSend:h}){B(t);let a=document.createElement("div");a.className="ongocare-chat-root",a.innerHTML=`
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
  `;let s=a.querySelector(".ongocare-chat-panel"),c=a.querySelector(".ongocare-chat-launcher"),l=a.querySelector(".ongocare-chat-close"),r=a.querySelector(".ongocare-chat-header-title"),d=a.querySelector(".ongocare-chat-messages"),p=a.querySelector(".ongocare-chat-status"),e=a.querySelector(".ongocare-chat-composer"),y=a.querySelector(".ongocare-chat-input"),C=a.querySelector(".ongocare-chat-send");r.textContent=t.headerTitle||o||"Chat with us";let x=!1,b=!1;function k(f){x=f,a.classList.toggle("is-open",x),c.setAttribute("aria-expanded",String(x)),x&&y.focus(),i(x)}c.addEventListener("click",()=>k(!x)),l.addEventListener("click",()=>{k(!1),u()}),e.addEventListener("submit",async f=>{f.preventDefault();let n=y.value.trim();if(!(!n||b)){b=!0,C.disabled=!0,y.disabled=!0;try{await h(n),y.value=""}finally{b=!1,C.disabled=!1,y.disabled=!1,y.focus()}}}),y.addEventListener("keydown",f=>{f.key==="Enter"&&!f.shiftKey&&(f.preventDefault(),e.requestSubmit())});function w(f){if(!f){p.hidden=!0,p.textContent="";return}p.hidden=!1,p.textContent=f}function T(f){if(d.innerHTML="",!f.length){let n=document.createElement("div");n.className="ongocare-chat-empty",n.textContent=t.welcomeMessage||"Send us a message and we will reply shortly.",d.appendChild(n);return}for(let n of f){let g=document.createElement("div");g.className=`ongocare-chat-message ${H(n)}`,g.textContent=n.body||n.preview||"";let v=document.createElement("span");v.className="ongocare-chat-message-meta",v.textContent=`${W(n)} \xB7 ${Y(n.occurredAt)}`,g.appendChild(v),d.appendChild(g)}d.scrollTop=d.scrollHeight}function O(){document.body.appendChild(a)}function $(){a.remove()}return{mount:O,destroy:$,setOpen:k,isOpen:()=>x,renderMessages:T,setStatus:w,setComposerEnabled(f){y.disabled=!f,C.disabled=!f}}}var G=3e3;function M(t){return t.communicationId||`${t.occurredAt}:${t.body}`}function L(t,o){let i=new Map;for(let u of t)i.set(M(u),u);for(let u of o)i.set(M(u),u);return Array.from(i.values()).sort((u,h)=>{let a=new Date(u.occurredAt||0).getTime(),s=new Date(h.occurredAt||0).getTime();return a!==s?a-s:M(u).localeCompare(M(h))})}function K(){return typeof crypto!="undefined"&&crypto.randomUUID?crypto.randomUUID():`msg_${Date.now()}_${Math.random().toString(36).slice(2,10)}`}function V(t){let o=String(t.siteKey||"").trim();if(!o)throw new Error("siteKey is required");let i=q(t),u=Number(t.pollIntervalMs||G),h=U({apiBase:i,siteKey:o}),a=null,s=null,c=null,l=null,r=[],d=null,p=!1,e=null;function y(){j(o,{visitorId:a,visitorToken:s,sessionId:c})}async function C(){let n=N(o),g=await h.bootstrap({visitorId:n.visitorId,pageUrl:window.location.href,pageTitle:document.title,referrer:document.referrer||void 0,locale:navigator.language||void 0});return a=g.visitorId,s=g.visitorToken,l=g.site||{},c=n.sessionId,y(),p=!0,g}async function x(){return c||(c=(await h.startSession({visitorId:a,visitorToken:s})).sessionId,y(),c)}async function b(){if(!(!c||!s))try{let n=await h.listMessages({sessionId:c,visitorToken:s});r=L(r,n.messages||[]),e==null||e.renderMessages(r),e==null||e.setStatus("")}catch(n){(n.message==="session_closed"||n.message==="session_not_found")&&(z(o),c=null,r=[],e==null||e.renderMessages(r)),e==null||e.setStatus("Unable to refresh messages. We will retry.")}}function k(){w(),d=window.setInterval(()=>{e!=null&&e.isOpen()&&b()},u)}function w(){d&&(window.clearInterval(d),d=null)}async function T(){e==null||e.setComposerEnabled(!1),e==null||e.setStatus("Connecting...");try{p||await C(),await x(),await b(),e==null||e.setStatus(""),e==null||e.setComposerEnabled(!0),k()}catch(n){e==null||e.setStatus(n.message||"Unable to start chat."),e==null||e.setComposerEnabled(!1)}}async function O(n){await x();let g=K(),v={communicationId:`local:${g}`,body:n,preview:n,direction:"inbound",contentType:"text",occurredAt:new Date().toISOString(),sender:{kind:"visitor",displayName:"You"}};r=L(r,[v]),e==null||e.renderMessages(r);try{let S=await h.sendMessage({sessionId:c,visitorToken:s,body:n,clientMessageId:g});S.communicationId&&(r=L(r.filter(_=>_.communicationId!==v.communicationId),[{communicationId:S.communicationId,body:S.body||n,preview:S.preview||n,direction:"inbound",contentType:"text",occurredAt:new Date().toISOString(),sender:{kind:"visitor",displayName:"You"}}]),e==null||e.renderMessages(r)),await b()}catch(S){throw r=r.filter(_=>_.communicationId!==v.communicationId),e==null||e.renderMessages(r),e==null||e.setStatus(S.message||"Failed to send message."),S}}async function $(){if(e)return;p||await C();let n=(l==null?void 0:l.theme)||{};e=R({theme:n,siteName:(l==null?void 0:l.name)||o,onToggle:g=>{g?T():w()},onClose:()=>w(),onSend:O}),e.mount(),e.renderMessages(r)}function f(){w(),e==null||e.destroy(),e=null}return{init:$,destroy:f,open:async()=>{await $(),e==null||e.setOpen(!0),await T()},close:()=>{e==null||e.setOpen(!1),w()}}}var m=null;function F(t={}){return m&&m.destroy(),m=V(t),m.init(),m}function X(){var o;let t=Array.isArray((o=window.OngoChat)==null?void 0:o.q)?window.OngoChat.q:[];window.OngoChat={init:F,destroy(){m&&(m.destroy(),m=null)},open(){return m==null?void 0:m.open()},close(){m==null||m.close()}};for(let i of t)F(i)}X();})();
