const uidInput = document.getElementById("uid");
const saveBtn = document.getElementById("save");
const savedMsg = document.getElementById("saved");
const activeEl = document.getElementById("active");
const idleEl = document.getElementById("idle");

// ===== EDIT THIS LIST: your team's emails, lowercase =====
const TEAM_EMAILS = [
  "lim.minna@borderless-japan.com",
  "noor.tanjim.bin@borderless-japan.com",
  "muto@borderless-japan.com",
  // add more here...
];
// =========================================================

function fmt(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return min === 0 ? `${sec}s` : `${min}m ${sec}s`;
}

chrome.storage.local.get(["anosupoUserId", "acc"], (data) => {
  if (data.anosupoUserId) uidInput.value = data.anosupoUserId;
  if (data.acc) {
    activeEl.textContent = fmt(data.acc.activeMs || 0);
    idleEl.textContent = fmt(data.acc.idleMs || 0);
  }
});

saveBtn.addEventListener("click", () => {
  const id = uidInput.value.trim().toLowerCase();
  if (!id) {
    savedMsg.style.color = "#dc2626";
    savedMsg.textContent = "Enter your email";
    return;
  }
  if (!TEAM_EMAILS.includes(id)) {
    savedMsg.style.color = "#dc2626";
    savedMsg.textContent = "Not a recognized team email";
    return;
  }
  chrome.storage.local.set({ anosupoUserId: id }, () => {
    savedMsg.style.color = "#16a34a";
    savedMsg.textContent = "Saved ✓";
    setTimeout(() => (savedMsg.textContent = ""), 2000);
  });
});
