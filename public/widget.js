/**
 * VoxClinic Booking Widget
 * Lightweight (~3KB) embeddable script for clinic websites.
 *
 * Usage:
 *   <script src="https://app.voxclinic.com/widget.js" data-token="YOUR_TOKEN"></script>
 *
 * Data attributes:
 *   data-token      (required) BookingConfig token
 *   data-color      (default "#14B8A6") Primary color
 *   data-position   (default "bottom-right") bottom-right | bottom-left | inline
 *   data-button-text (default "Agendar") Floating button text
 *   data-width      (default "400") Popup width in px
 *   data-height     (default "620") Popup height in px
 *   data-target     Element ID for inline mode
 */
(function () {
  "use strict";

  // ─── Read config from script tag ───
  var script = document.currentScript;
  if (!script) return;

  var token = script.getAttribute("data-token");
  if (!token) {
    console.warn("[VoxClinic Widget] data-token is required");
    return;
  }

  var color = script.getAttribute("data-color") || "#14B8A6";
  var position = script.getAttribute("data-position") || "bottom-right";
  var buttonText = script.getAttribute("data-button-text") || "Agendar";
  var popupWidth = parseInt(script.getAttribute("data-width") || "400", 10);
  var popupHeight = parseInt(script.getAttribute("data-height") || "620", 10);
  var targetId = script.getAttribute("data-target");

  // Determine base URL from script src
  var baseUrl = "";
  try {
    var srcUrl = new URL(script.src);
    baseUrl = srcUrl.origin;
  } catch (e) {
    baseUrl = window.location.origin;
  }

  var iframeUrl =
    baseUrl +
    "/booking/" +
    token +
    "?mode=compact&color=" +
    encodeURIComponent(color);

  var PREFIX = "vxw-"; // CSS prefix to avoid collisions

  // ─── Inject isolated styles ───
  var styleId = PREFIX + "styles";
  if (!document.getElementById(styleId)) {
    var style = document.createElement("style");
    style.id = styleId;
    style.textContent = [
      // Floating button
      "." + PREFIX + "btn{",
      "  position:fixed;z-index:99998;",
      "  display:flex;align-items:center;gap:8px;",
      "  padding:12px 20px;border:none;border-radius:50px;",
      "  color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;",
      "  font-size:14px;font-weight:600;cursor:pointer;",
      "  box-shadow:0 4px 14px rgba(0,0,0,0.15);",
      "  transition:transform 0.2s,box-shadow 0.2s;",
      "}",
      "." + PREFIX + "btn:hover{transform:scale(1.04);box-shadow:0 6px 20px rgba(0,0,0,0.2);}",
      "." + PREFIX + "btn:active{transform:scale(0.97);}",
      "." + PREFIX + "btn-br{bottom:20px;right:20px;}",
      "." + PREFIX + "btn-bl{bottom:20px;left:20px;}",
      // Calendar icon SVG
      "." + PREFIX + "icon{width:18px;height:18px;flex-shrink:0;}",
      // Backdrop overlay
      "." + PREFIX + "overlay{",
      "  position:fixed;inset:0;z-index:99999;",
      "  background:rgba(0,0,0,0.4);",
      "  display:flex;align-items:center;justify-content:center;",
      "  opacity:0;transition:opacity 0.25s;",
      "}",
      "." + PREFIX + "overlay." + PREFIX + "open{opacity:1;}",
      // Popup container
      "." + PREFIX + "popup{",
      "  background:#fff;border-radius:16px;overflow:hidden;",
      "  box-shadow:0 20px 60px rgba(0,0,0,0.2);",
      "  transition:transform 0.25s,opacity 0.25s;",
      "  transform:translateY(20px);opacity:0;",
      "  max-height:90vh;",
      "}",
      "." + PREFIX + "open ." + PREFIX + "popup{",
      "  transform:translateY(0);opacity:1;",
      "}",
      // Popup header bar
      "." + PREFIX + "header{",
      "  display:flex;align-items:center;justify-content:space-between;",
      "  padding:10px 16px;border-bottom:1px solid #f1f5f9;",
      "  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;",
      "}",
      "." + PREFIX + "header-title{font-size:13px;font-weight:600;color:#334155;}",
      "." + PREFIX + "close{",
      "  background:none;border:none;cursor:pointer;padding:4px;",
      "  color:#94a3b8;font-size:18px;line-height:1;",
      "}",
      "." + PREFIX + "close:hover{color:#475569;}",
      // iframe
      "." + PREFIX + "iframe{",
      "  border:none;width:100%;display:block;",
      "  transition:height 0.2s;",
      "}",
      // Mobile: full-screen popup
      "@media(max-width:480px){",
      "  ." + PREFIX + "popup{",
      "    width:100vw!important;height:100vh!important;max-height:100vh!important;",
      "    border-radius:0;",
      "  }",
      "  ." + PREFIX + "iframe{height:calc(100vh - 42px)!important;}",
      "}",
      // Inline mode
      "." + PREFIX + "inline{",
      "  border-radius:12px;overflow:hidden;",
      "  border:1px solid #e2e8f0;",
      "}",
      "." + PREFIX + "inline ." + PREFIX + "iframe{border-radius:12px;}",
    ].join("\n");
    document.head.appendChild(style);
  }

  // ─── SVG calendar icon ───
  var calendarSvg =
    '<svg class="' +
    PREFIX +
    'icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="3" y="4" width="18" height="18" rx="2"/>' +
    '<line x1="16" y1="2" x2="16" y2="6"/>' +
    '<line x1="8" y1="2" x2="8" y2="6"/>' +
    '<line x1="3" y1="10" x2="21" y2="10"/>' +
    "</svg>";

  // ─── Inline mode ───
  if (position === "inline") {
    var container = targetId ? document.getElementById(targetId) : null;
    if (!container) {
      console.warn("[VoxClinic Widget] data-target element not found: " + targetId);
      return;
    }
    var inlineWrap = document.createElement("div");
    inlineWrap.className = PREFIX + "inline";
    var inlineIframe = document.createElement("iframe");
    inlineIframe.className = PREFIX + "iframe";
    inlineIframe.src = iframeUrl;
    inlineIframe.style.width = "100%";
    inlineIframe.style.height = popupHeight + "px";
    inlineIframe.setAttribute("allow", "clipboard-write");
    inlineIframe.setAttribute("loading", "lazy");
    inlineWrap.appendChild(inlineIframe);
    container.appendChild(inlineWrap);

    // Listen for resize messages
    window.addEventListener("message", function (e) {
      if (e.data && e.data.type === "voxclinic:resize" && e.data.height) {
        inlineIframe.style.height = Math.max(200, e.data.height) + "px";
      }
    });
    return;
  }

  // ─── Floating button mode ───
  var btn = document.createElement("button");
  btn.className = PREFIX + "btn " + PREFIX + "btn-" + (position === "bottom-left" ? "bl" : "br");
  btn.style.backgroundColor = color;
  btn.innerHTML = calendarSvg + " " + buttonText;
  btn.setAttribute("aria-label", buttonText);
  document.body.appendChild(btn);

  var overlay = null;
  var iframe = null;
  var isOpen = false;

  function open() {
    if (isOpen) return;
    isOpen = true;

    // Create overlay
    overlay = document.createElement("div");
    overlay.className = PREFIX + "overlay";

    // Popup container
    var popup = document.createElement("div");
    popup.className = PREFIX + "popup";
    popup.style.width = popupWidth + "px";

    // Header
    var header = document.createElement("div");
    header.className = PREFIX + "header";
    var title = document.createElement("span");
    title.className = PREFIX + "header-title";
    title.textContent = "Agendamento Online";
    var closeBtn = document.createElement("button");
    closeBtn.className = PREFIX + "close";
    closeBtn.innerHTML = "&#10005;";
    closeBtn.setAttribute("aria-label", "Fechar");
    closeBtn.onclick = close;
    header.appendChild(title);
    header.appendChild(closeBtn);
    popup.appendChild(header);

    // iframe
    iframe = document.createElement("iframe");
    iframe.className = PREFIX + "iframe";
    iframe.src = iframeUrl;
    iframe.style.height = popupHeight + "px";
    iframe.setAttribute("allow", "clipboard-write");
    popup.appendChild(iframe);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Click backdrop to close
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    // Animate in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add(PREFIX + "open");
      });
    });

    // Hide button
    btn.style.display = "none";
  }

  function close() {
    if (!isOpen || !overlay) return;
    isOpen = false;
    overlay.classList.remove(PREFIX + "open");
    setTimeout(function () {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      overlay = null;
      iframe = null;
      btn.style.display = "";
    }, 250);
  }

  btn.addEventListener("click", open);

  // ─── Listen for postMessage from iframe ───
  window.addEventListener("message", function (e) {
    if (!e.data || typeof e.data.type !== "string") return;

    switch (e.data.type) {
      case "voxclinic:resize":
        if (iframe && e.data.height) {
          iframe.style.height = Math.max(200, e.data.height) + "px";
        }
        break;

      case "voxclinic:close":
        close();
        break;

      case "voxclinic:booked":
        // Dispatch custom event for host page to listen
        var event;
        try {
          event = new CustomEvent("voxclinic:booked", { detail: e.data.data });
        } catch (err) {
          // IE fallback
          event = document.createEvent("CustomEvent");
          event.initCustomEvent("voxclinic:booked", true, true, e.data.data);
        }
        document.dispatchEvent(event);

        // Auto-close after a short delay
        setTimeout(function () {
          close();
        }, 2000);
        break;

      case "voxclinic:ready":
        // Widget is ready — could trigger resize or animation
        break;
    }
  });

  // Escape key to close
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen) close();
  });
})();
