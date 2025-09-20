
/* =====================================================
   Escape Game Common Script
   - Team param handling
   - Persistent timer across pages
   - Answer dock (fixed bottom) with navigation
   ===================================================== */

// ---------- Team helpers ----------
const QS = new URLSearchParams(location.search);
function getTeamId() {
  const t = (QS.get("team") || "A").toUpperCase();
  return t;
}

function appendTeamParam(url, teamId=getTeamId()) {
  try {
    const u = new URL(url, location.href);
    if (!u.searchParams.get("team")) u.searchParams.set("team", teamId);
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}team=${encodeURIComponent(teamId)}`;
  }
}

// Expose a safe global nav helper
window.__EG_goWithTeam = function(dest) {
  location.href = appendTeamParam(dest);
};

(function setupPersistentTimer(){
  const LS_KEYS = {
    start: (team) => `EG_${team}_TIMER_START_MS`,
    dur:   (team) => `EG_${team}_TIMER_DURATION_SEC`,
    exp:   (team) => `EG_${team}_TIMER_EXPIRE_URL`
  };
  const meta = (name) => {
    const el = document.querySelector(`meta[name="${name}"]`);
    return el ? el.content : null;
  };
  const team = getTeamId();
  const shouldStartHere   = meta("timer-start") === "true";
  const metaDurationSec   = parseInt(meta("timer-duration-sec") || "", 10);
  const metaExpireTarget  = meta("timer-expire-target") || null;

  // ✅ 키를 미리 계산
  const LS_START = LS_KEYS.start(team);
  const LS_DUR   = LS_KEYS.dur(team);
  const LS_EXP   = LS_KEYS.exp(team);

  if (shouldStartHere) {
    // ✅ 이미 시작된 팀이면 다시 덮어쓰지 않음
    const already = localStorage.getItem(LS_START);
    if (!already) {
      const now = Date.now();
      const dur = Number.isFinite(metaDurationSec) ? metaDurationSec : (30 * 60);
      localStorage.setItem(LS_START, String(now));
      localStorage.setItem(LS_DUR, String(dur));
      if (metaExpireTarget) localStorage.setItem(LS_EXP, metaExpireTarget);
    }
  } else {
    // ❗ 타이머가 없으면 시작 페이지로 돌려보내고 종료 (원하면 파일명 변경)
    if (!localStorage.getItem(LS_START) || !localStorage.getItem(LS_DUR)) {
      const startUrl = appendTeamParam("puzzle-2-team-lines.html", team); // ← 시작 페이지 경로로 수정 가능
      location.href = startUrl;
      return;
    }
    if (metaExpireTarget) localStorage.setItem(LS_EXP, metaExpireTarget);
  }

  function injectTimerBar(){
    if (document.querySelector(".timer-bar")) return document.getElementById("egTimer");
    const bar = document.createElement("div");
    bar.className = "timer-bar";
    bar.innerHTML = `
      <div class="timer-bar__label">남은 시간 — 팀 ${team}</div>
      <div class="timer-bar__time" id="egTimer">--:--</div>
    `;
    document.body.appendChild(bar);
    return document.getElementById("egTimer");
  }
  const timerEl = injectTimerBar();

  function getRemainSec(){
    const startMs = parseInt(localStorage.getItem(LS_START) || "0", 10);
    const durSec  = parseInt(localStorage.getItem(LS_DUR) || "0", 10);
    if (!startMs || !durSec) return 0;
    const passed = Math.floor((Date.now() - startMs) / 1000);
    return Math.max(0, durSec - passed);
  }
  function fmt(sec){
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }
  function tick(){
    const remain = getRemainSec();
    if (timerEl) timerEl.textContent = fmt(remain);
    if (remain <= 0){
      const expUrl = localStorage.getItem(LS_EXP) || metaExpireTarget;
      localStorage.removeItem(LS_START); // 종료 시 시작키만 제거
      if (expUrl) location.href = appendTeamParam(expUrl, team);
    }
  }
  tick();
  setInterval(tick, 1000);

  // Dev helper: ?resetTimer=1
  if (QS.get("resetTimer") === "1"){
    localStorage.removeItem(LS_KEYS.start(team));
    localStorage.removeItem(LS_KEYS.dur(team));
  }
})();

// ---------- Answer dock ----------
(function setupAnswerDock(){
  const body = document.body;
  if (!body) return;
  const answersAttr = (body.getAttribute("data-answers") || "").trim();
  const target = body.getAttribute("data-target");

  // if no answers on this page, do not render dock
  if (!answersAttr && !target) return;

  function normalize(s){
    return (s||"")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .normalize("NFC");
  }
  const answerSet = new Set(
    answersAttr.split(",")
      .map(a => a.trim())
      .filter(Boolean)
      .map(normalize)
  );

  const dock = document.createElement("div");
  dock.className = "dock";
  dock.innerHTML = `
    <div class="dock__label">정답 입력</div>
    <input id="dockInput" class="dock__input" type="text" placeholder="여기에 정답을 입력하세요" autocomplete="off" />
    <button id="dockBtn" class="dock__btn">확인</button>
    <div id="dockMsg" class="dock__msg"></div>
  `;
  document.body.appendChild(dock);

  const $input = dock.querySelector("#dockInput");
  const $btn   = dock.querySelector("#dockBtn");
  const $msg   = dock.querySelector("#dockMsg");

  function showOk(m){ $msg.textContent = m; $msg.className = "dock__msg ok"; }
  function showErr(m){ $msg.textContent = m; $msg.className = "dock__msg err"; }

  function checkAnswer() {
    const val = normalize($input.value);
    if (!val) { showErr("정답을 입력하세요"); return; }
    if (answerSet.size > 0 && !answerSet.has(val)) {
      showErr("오답입니다");
      return;
    }
    showOk("정답!");
    if (target) {
      setTimeout(() => { window.__EG_goWithTeam(target); }, 600);
    }
  }

  $btn.addEventListener("click", checkAnswer);
  $input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkAnswer();
  });
})();
(function setupAnswerDock(){
  const body = document.body;
  if (!body) return;
  const answersAttr = (body.getAttribute("data-answers") || "").trim();
  const target = body.getAttribute("data-target");
  if (!answersAttr && !target) return;

  // ... (중략) dock 생성 코드 그대로 유지

  document.body.appendChild(dock);

  // ⬇️ 겹침 방지용 스페이서 주입
  const spacer = document.createElement("div");
  spacer.className = "dock-spacer";
  spacer.setAttribute("aria-hidden", "true");

  // 스크롤 컨테이너로 .main을 우선 사용, 없으면 body에 부착
  const scrollHost = document.querySelector(".main") || document.body;
  scrollHost.appendChild(spacer);

  // ... (중략) 이벤트 리스너 등 기존 로직 그대로
})();

(function showDeviceId(){
  const el = document.getElementById("deviceId");
  if (!el) return;
  const KEY = "EG_DEVICE_ID";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10).toUpperCase();
    localStorage.setItem(KEY, id);
  }
  el.textContent = `Device ID: ${id}`;
})();