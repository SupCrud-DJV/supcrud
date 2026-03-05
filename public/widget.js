(function () {
  // 1. Get the workspace key the customer configured
  const config = window.SupCrudConfig || {};
  const workspaceKey = config.workspaceKey;

  if (!workspaceKey) {
    console.error("SupCrud: missing workspaceKey");
    return;
  }

  // 2. Inject CSS styles into the page
  const style = document.createElement("style");
  style.textContent = `
    #supcrud-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #6b5cff;
      cursor: pointer;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }

    #supcrud-iframe {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 380px;
      height: 520px;
      border: none;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      z-index: 99998;
      display: none;
    }
  `;
  document.head.appendChild(style);

  // 3. Create the chat bubble button
  const bubble = document.createElement("div");
  bubble.id = "supcrud-bubble";
  bubble.innerHTML = "💬";
  document.body.appendChild(bubble);

  // 4. Create the iframe that loads your actual form
  const iframe = document.createElement("iframe");
  iframe.id = "supcrud-iframe";
  //iframe.src = `https://your-app.com/widget-ui?workspaceKey=${workspaceKey}`;
  iframe.src = `/widget-ui.js`; //update route
  document.body.appendChild(iframe);

  // 5. Toggle open/close on bubble click
  let isOpen = false;
  bubble.addEventListener("click", function () {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? "block" : "none";
  });

  // Add this to your widget.js to handle the close message
  window.addEventListener("message", function (e) {
    if (e.data?.type === "SUPCRUD_CLOSE") {
      iframe.style.display = "none";
      isOpen = false;
    }
  });
})();
