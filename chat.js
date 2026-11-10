/* SPLASH chat assistant widget. Talks to /api/chat (netlify/functions/chat.mjs). */
(() => {
  const BOOK = "https://calendly.com/saad-splash/30min";
  const GREETING = "Hey, I'm Sunny from SPLASH 👋 Ask me anything about what we do, or tell me about your business and I'll point you in the right direction.";
  const CHIPS = ["What do you do?", "Do you work with restaurants?", "Can I get a bot like this?", "Book a free call"];
  const KEY = "splash-chat";

  let history = [];
  try { history = JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch {}
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-20))); } catch {} };

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  // Turn plain URLs into links without using innerHTML on model output.
  const renderText = (node, text) => {
    const re = /(https?:\/\/[^\s)]+[^\s).,!?])/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      node.append(text.slice(last, m.index));
      const a = el("a", null, m[1].replace(/^https?:\/\//, ""));
      a.href = m[1]; a.target = "_blank"; a.rel = "noopener";
      node.append(a);
      last = m.index + m[1].length;
    }
    node.append(text.slice(last));
  };

  const root = el("div", "sc-root");
  const bubble = el("button", "sc-bubble");
  bubble.setAttribute("aria-label", "Chat with SPLASH");
  bubble.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
  const teaser = el("div", "sc-teaser", "Hey, I'm Sunny. Questions? 👋");

  const panel = el("section", "sc-panel");
  panel.setAttribute("aria-label", "Chat with Sunny from SPLASH");
  panel.hidden = true;
  const head = el("header", "sc-head");
  const title = el("div", "sc-title");
  title.append(el("strong", null, "Sunny"), el("span", null, "SPLASH · Usually replies in seconds"));
  const close = el("button", "sc-close", "×");
  close.setAttribute("aria-label", "Close chat");
  head.append(title, close);
  const log = el("div", "sc-log");
  log.setAttribute("aria-live", "polite");
  const chips = el("div", "sc-chips");
  const form = el("form", "sc-form");
  const input = el("input");
  input.type = "text"; input.placeholder = "Type a message…"; input.maxLength = 800; input.setAttribute("aria-label", "Message");
  const send = el("button", "sc-send", "Send");
  send.type = "submit";
  form.append(input, send);
  const foot = el("div", "sc-foot");
  const book = el("a", null, "Book a free 30-min call →");
  book.href = BOOK; book.target = "_blank"; book.rel = "noopener";
  foot.append(book);
  panel.append(head, log, chips, form, foot);
  root.append(panel, teaser, bubble);

  const addMsg = (role, text) => {
    const m = el("div", "sc-msg sc-" + role);
    renderText(m, text);
    log.append(m);
    log.scrollTop = log.scrollHeight;
    return m;
  };

  const renderChips = () => {
    chips.replaceChildren();
    if (history.length) return;
    CHIPS.forEach((c) => {
      const b = el("button", "sc-chip", c);
      b.type = "button";
      b.onclick = () => (c === "Book a free call" ? window.open(BOOK, "_blank", "noopener") : ask(c));
      chips.append(b);
    });
  };

  let busy = false;
  async function ask(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true; send.disabled = true;
    history.push({ role: "user", content: text });
    addMsg("user", text);
    renderChips();
    const typing = el("div", "sc-msg sc-assistant sc-typing");
    typing.append(el("i"), el("i"), el("i"));
    log.append(typing); log.scrollTop = log.scrollHeight;
    let reply;
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: history }) });
      reply = (await r.json()).reply;
    } catch {}
    reply = reply || "Sorry, I'm having trouble right now. You can book a free call at " + BOOK + " or email saad@splash.limited.";
    typing.remove();
    history.push({ role: "assistant", content: reply });
    save();
    addMsg("assistant", reply);
    busy = false; send.disabled = false; input.focus();
  }

  const open = (show) => {
    panel.hidden = !show;
    root.classList.toggle("sc-open", show);
    teaser.remove();
    if (show) { log.scrollTop = log.scrollHeight; if (matchMedia("(min-width: 600px)").matches) input.focus(); }
  };

  bubble.onclick = () => open(panel.hidden);
  teaser.onclick = () => open(true);
  close.onclick = () => open(false);
  form.onsubmit = (e) => { e.preventDefault(); const t = input.value; input.value = ""; ask(t); };
  document.querySelectorAll("[data-open-chat]").forEach((n) => n.addEventListener("click", (e) => { e.preventDefault(); open(true); }));

  addMsg("assistant", GREETING);
  history.forEach((m) => addMsg(m.role, m.content));
  renderChips();
  document.body.append(root);
  setTimeout(() => { if (panel.hidden && teaser.isConnected) teaser.classList.add("sc-show"); }, 6000);
})();
