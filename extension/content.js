(() => {
  const HEARTBEAT_MS = 5000;        // how often we report status
  const IDLE_THRESHOLD_MS = 600000; // no input for 10 min => treated as idle

  let lastInputTs = Date.now();

  const activityEvents = [
    "mousemove", "mousedown", "keydown",
    "scroll", "wheel", "touchstart", "click",
  ];

  function markInput() {
    lastInputTs = Date.now();
  }

  activityEvents.forEach((evt) =>
    window.addEventListener(evt, markInput, { passive: true, capture: true })
  );

  // OPTIONAL annotation-action signal (best accuracy). Have your platform
  // dispatch this event on box-draw / save / frame-change, then uncomment:
  // window.addEventListener("anosupo:annotation", markInput);

  function sendHeartbeat() {
    const now = Date.now();
    const visible = document.visibilityState === "visible";
    const recentlyActive = now - lastInputTs < IDLE_THRESHOLD_MS;

    chrome.runtime.sendMessage({
      type: "HEARTBEAT",
      payload: { url: location.href, path: location.pathname, visible, recentlyActive, ts: now },
    });
  }

  sendHeartbeat();
  setInterval(sendHeartbeat, HEARTBEAT_MS);
  document.addEventListener("visibilitychange", sendHeartbeat);
})();
