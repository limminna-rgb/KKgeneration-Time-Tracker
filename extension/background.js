const SUPABASE_URL = "https://iuexewhfcfchgxxqiahg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_4ombkT4mhUVBbkro4GC6kw_riLva_o7";
const FLUSH_INTERVAL_MIN = 1;
const ACTIVE_INCREMENT_MS = 5000;

let accumulator = { activeMs: 0, idleMs: 0, lastHeartbeatTs: 0, sessionStart: null };

async function getUserId() {
  const { anosupoUserId } = await chrome.storage.local.get("anosupoUserId");
  return anosupoUserId || null;
}
async function loadAccumulator() {
  const { acc } = await chrome.storage.local.get("acc");
  if (acc) accumulator = acc;
}
async function saveAccumulator() {
  await chrome.storage.local.set({ acc: accumulator });
}

function processHeartbeat(payload) {
  const now = payload.ts;
  chrome.idle.queryState(600, (idleState) => {
    const osActive = idleState === "active";
    const isActive = payload.visible && payload.recentlyActive && osActive;
    if (!accumulator.sessionStart) accumulator.sessionStart = now;
    if (isActive) accumulator.activeMs += ACTIVE_INCREMENT_MS;
    else accumulator.idleMs += ACTIVE_INCREMENT_MS;
    accumulator.lastHeartbeatTs = now;
    saveAccumulator();
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "HEARTBEAT") processHeartbeat(msg.payload);
});

chrome.alarms.create("flush", { periodInMinutes: FLUSH_INTERVAL_MIN });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "flush") await flushToSupabase();
});

async function flushToSupabase() {
  const userId = await getUserId();
  if (!userId) return;
  if (accumulator.activeMs < 1000 && accumulator.idleMs < 1000) return;

  const today = new Date().toISOString().slice(0, 10);
  const activeSeconds = Math.round(accumulator.activeMs / 1000);
  const idleSeconds = Math.round(accumulator.idleMs / 1000);

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/add_time`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        p_user_id: userId, p_day: today,
        p_active: activeSeconds, p_idle: idleSeconds,
      }),
    });
    if (res.ok) {
      accumulator.activeMs = 0;
      accumulator.idleMs = 0;
      await saveAccumulator();
    } else {
      console.warn("Flush failed:", res.status, await res.text());
    }
  } catch (e) {
    console.warn("Flush error (will retry next interval):", e);
  }
}

loadAccumulator();
