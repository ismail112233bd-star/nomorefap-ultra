const storageKey = "nomorefap_ultra_pwa_v1";

const quotes = [
  { t: "Control yourself now, so you don’t regret later.", b: "Discipline Rule" },
  { t: "You’re not weak. You’re training your brain.", b: "Mindset" },
  { t: "Your future self will thank you.", b: "Reminder" },
  { t: "Short pleasure, long pain. Choose wisely.", b: "Truth" },
  { t: "Start again, but don’t start from zero.", b: "Keep going" },
  { t: "One day at a time. Win today.", b: "Daily focus" },
  { t: "Your energy is your power. Protect it.", b: "Self mastery" }
];

let state = {
  streak: 0,
  best: 0,
  goal: 30,
  lastMarkedDate: "",
  mood: "",
  note: "",
  cleanDays: [],
  relapseDays: [],
  relapseHistory: [],
  theme: "dark",
  password: ""
};

const pledgeWord = "RELAPSE";
let otpInputs = [];
let lockSeconds = 7;
let lockInterval = null;

function todayStr(){
  const d = new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

function saveState(){
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadState(){
  const raw = localStorage.getItem(storageKey);
  if(raw){
    try{ state = JSON.parse(raw); }catch(e){}
  }

  if(!state.goal) state.goal = 30;
  if(!state.cleanDays) state.cleanDays = [];
  if(!state.relapseDays) state.relapseDays = [];
  if(!state.relapseHistory) state.relapseHistory = [];
  if(!state.theme) state.theme = "dark";
  if(state.password === undefined) state.password = "";

  applyTheme();
  renderAll();
  newQuote();
}

function applyTheme(){
  document.body.classList.toggle("light", state.theme === "light");
}

function toggleTheme(){
  state.theme = (state.theme === "dark") ? "light" : "dark";
  saveState();
  applyTheme();
}

function switchTab(tab){
  document.getElementById("tabHome").classList.remove("active");
  document.getElementById("tabStats").classList.remove("active");
  document.getElementById("tabSettings").classList.remove("active");

  document.getElementById("pageHome").classList.add("hide");
  document.getElementById("pageStats").classList.add("hide");
  document.getElementById("pageSettings").classList.add("hide");

  if(tab === "home"){
    document.getElementById("tabHome").classList.add("active");
    document.getElementById("pageHome").classList.remove("hide");
  }

  if(tab === "stats"){
    document.getElementById("tabStats").classList.add("active");
    document.getElementById("pageStats").classList.remove("hide");
  }

  if(tab === "settings"){
    document.getElementById("tabSettings").classList.add("active");
    document.getElementById("pageSettings").classList.remove("hide");
  }
}

function newQuote(){
  const pick = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById("quoteText").innerText = "“" + pick.t + "”";
  document.getElementById("quoteBy").innerText = "— " + pick.b;
}

function markCleanDay(){
  const today = todayStr();

  if(state.lastMarkedDate === today){
    alert("আজকে already Mark করা আছে ✅");
    return;
  }

  state.streak += 1;
  if(state.streak > state.best) state.best = state.streak;
  state.lastMarkedDate = today;

  if(!state.cleanDays.includes(today)) state.cleanDays.push(today);

  saveState();
  renderAll();
  alert("Clean day marked ✅🔥");
}

function updateProgress(){
  const percent = Math.min(100, Math.round((state.streak / state.goal) * 100));
  document.getElementById("percent").innerText = percent;
  document.getElementById("bar").style.width = percent + "%";
}

function renderCalendar(){
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const monthName = now.toLocaleString("en-US", { month: "long" });
  document.getElementById("calTitle").innerText = `${monthName} ${year}`;

  const heads = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  heads.forEach(h=>{
    const d = document.createElement("div");
    d.className = "day head";
    d.innerText = h;
    cal.appendChild(d);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  for(let i=0;i<firstDay;i++){
    const empty = document.createElement("div");
    empty.className = "day";
    empty.style.opacity = "0.2";
    empty.innerText = "";
    cal.appendChild(empty);
  }

  for(let day=1; day<=daysInMonth; day++){
    const d = document.createElement("div");
    d.className = "day";
    d.innerText = day;

    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

    if(state.cleanDays.includes(dateStr)) d.classList.add("clean");
    if(state.relapseDays.includes(dateStr)) d.classList.add("relapse");

    cal.appendChild(d);
  }
}

function saveDailyLog(){
  state.mood = document.getElementById("mood").value;
  state.note = document.getElementById("note").value;
  saveState();
  alert("Daily log saved ✅");
}

function clearLog(){
  document.getElementById("mood").value = "";
  document.getElementById("note").value = "";
  state.mood = "";
  state.note = "";
  saveState();
}

function renderHistory(){
  const box = document.getElementById("historyList");
  box.innerHTML = "";

  if(state.relapseHistory.length === 0){
    box.innerHTML = `<div class="mini">No relapse history yet ✅ Keep going!</div>`;
    return;
  }

  state.relapseHistory.slice().reverse().forEach(item=>{
    const div = document.createElement("div");
    div.className = "logItem";
    div.innerHTML = `
      <b>${item.date}</b><br/>
      Old Streak: <b>${item.oldStreak}</b> days<br/>
      Mood: <b>${item.mood || "Not set"}</b><br/>
      Note: <b>${(item.note || "No note").slice(0,150)}</b>
    `;
    box.appendChild(div);
  });
}

function clearHistory(){
  const sure = confirm("Relapse history clear করতে চাও?");
  if(!sure) return;
  state.relapseHistory = [];
  state.relapseDays = [];
  saveState();
  renderAll();
}

function quickLock(){
  alert("Quick Lock ✅\n১০ সেকেন্ড ফোন থেকে চোখ সরাও, পানি খাও, deep breath নাও 💧🙂");
}

function openResetFlow(){
  buildOtpInputs();
  openModal();
  startLockCountdown();
}

function openModal(){
  document.getElementById("modalOverlay").style.display = "flex";
  document.getElementById("confirmResetBtn").disabled = true;
  document.getElementById("resetPasswordField").value = "";
  updateLockTimerText(lockSeconds);
  setTimeout(()=>otpInputs[0]?.focus(), 120);
}

function closeModal(){
  stopLockCountdown();
  document.getElementById("modalOverlay").style.display = "none";
}

function buildOtpInputs(){
  const row = document.getElementById("otpRow");
  row.innerHTML = "";
  otpInputs = [];

  for(let i=0; i<pledgeWord.length; i++){
    const inp = document.createElement("input");
    inp.className = "otpBox";
    inp.maxLength = 1;

    inp.addEventListener("input", ()=>{
      inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, "");
      if(inp.value && otpInputs[i+1]) otpInputs[i+1].focus();
      validateReset();
    });

    inp.addEventListener("keydown", (e)=>{
      if(e.key === "Backspace" && !inp.value && otpInputs[i-1]){
        otpInputs[i-1].focus();
      }
    });

    row.appendChild(inp);
    otpInputs.push(inp);
  }
}

function getOtpValue(){
  return otpInputs.map(i=>i.value || "").join("");
}

function startLockCountdown(){
  stopLockCountdown();
  lockSeconds = 7;
  updateLockTimerText(lockSeconds);

  lockInterval = setInterval(()=>{
    lockSeconds -= 1;

    if(lockSeconds <= 0){
      lockSeconds = 0;
      stopLockCountdown();
      updateLockTimerText(lockSeconds);
      validateReset();
    }else{
      updateLockTimerText(lockSeconds);
    }
  }, 1000);
}

function stopLockCountdown(){
  if(lockInterval){
    clearInterval(lockInterval);
    lockInterval = null;
  }
}

function updateLockTimerText(sec){
  document.getElementById("lockTimer").innerText = `Wait: ${String(sec).padStart(2,"0")}s`;
}

function validateReset(){
  const btn = document.getElementById("confirmResetBtn");

  if(lockSeconds > 0){
    btn.disabled = true;
    return;
  }

  const typed = getOtpValue();
  const pass = document.getElementById("resetPasswordField").value;

  if(typed !== pledgeWord){
    btn.disabled = true;
    return;
  }

  if(state.password && pass !== state.password){
    btn.disabled = true;
    return;
  }

  btn.disabled = false;
}

function confirmReset(){
  if(lockSeconds > 0){
    alert("Wait শেষ হওয়া পর্যন্ত অপেক্ষা করো 🙂");
    return;
  }

  const typed = getOtpValue();
  if(typed !== pledgeWord){
    alert("OTP ভুল হয়েছে ❌ (RELAPSE)");
    return;
  }

  if(state.password){
    const pass = document.getElementById("resetPasswordField").value;
    if(pass !== state.password){
      alert("Password ভুল ❌");
      return;
    }
  }

  const date = todayStr();

  state.relapseHistory.push({
    date,
    oldStreak: state.streak,
    mood: state.mood,
    note: state.note
  });

  if(!state.relapseDays.includes(date)) state.relapseDays.push(date);

  state.streak = 0;
  state.lastMarkedDate = "";

  saveState();
  closeModal();
  renderAll();
  alert("Reset done. Start again stronger 💪");
}

function loadGoalToUI(){
  const goalInput = document.getElementById("goalInput");
  const goalShow = document.getElementById("goalShow");

  if(goalInput) goalInput.value = state.goal || 30;
  if(goalShow) goalShow.innerText = state.goal || 30;
}

function saveGoal(){
  const v = parseInt(document.getElementById("goalInput").value || "30", 10);
  if(isNaN(v) || v < 1) return alert("Valid goal দাও ভাই 🙂");
  state.goal = v;
  saveState();
  renderAll();
  alert("Goal saved ✅");
}

function setPassword(){
  const p = document.getElementById("passInput").value.trim();
  if(p.length < 4) return alert("Password minimum 4 characters দাও 🙂");
  state.password = p;
  document.getElementById("passInput").value = "";
  saveState();
  alert("Password set ✅");
}

function removePassword(){
  const sure = confirm("Password remove করতে চাও?");
  if(!sure) return;
  state.password = "";
  saveState();
  alert("Password removed ✅");
}

function renderStats(){
  document.getElementById("totalClean").innerText = state.cleanDays.length;
  document.getElementById("totalRelapse").innerText = state.relapseHistory.length;

  const total = state.cleanDays.length + state.relapseHistory.length;
  const rate = total === 0 ? 0 : Math.round((state.cleanDays.length / total) * 100);
  document.getElementById("successRate").innerText = rate;

  const chart = document.getElementById("weeklyChart");
  chart.innerHTML = "";

  const days = [];
  for(let i=6;i>=0;i--){
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
    days.push(ds);
  }

  days.forEach(ds=>{
    const bar = document.createElement("div");
    bar.className = "barCol";
    const isClean = state.cleanDays.includes(ds);
    bar.style.height = isClean ? "100%" : "25%";
    bar.style.opacity = isClean ? "0.95" : "0.35";
    chart.appendChild(bar);
  });
}

function downloadBackup(){
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "nomorefap-ultra-backup.json";
  a.click();

  URL.revokeObjectURL(url);
}

function importBackup(){
  const fileInput = document.getElementById("importFile");

  if(!fileInput.files || !fileInput.files[0]){
    alert("একটা JSON backup file select করো 🙂");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(){
    try{
      const data = JSON.parse(reader.result);

      state = { ...state, ...data };

      if(!state.cleanDays) state.cleanDays = [];
      if(!state.relapseDays) state.relapseDays = [];
      if(!state.relapseHistory) state.relapseHistory = [];
      if(!state.goal) state.goal = 30;
      if(!state.theme) state.theme = "dark";
      if(state.password === undefined) state.password = "";

      saveState();
      applyTheme();
      renderAll();
      alert("Backup imported ✅");
    }catch(e){
      alert("Invalid JSON backup ❌");
    }
  };

  reader.readAsText(fileInput.files[0]);
}

function factoryReset(){
  const sure = confirm("সবকিছু reset হবে! নিশ্চিত?");
  if(!sure) return;
  localStorage.removeItem(storageKey);
  location.reload();
}

function renderAll(){
  document.getElementById("streak").innerText = state.streak;
  document.getElementById("best").innerText = state.best;
  document.getElementById("goal").innerText = state.goal;

  document.getElementById("mood").value = state.mood || "";
  document.getElementById("note").value = state.note || "";

  loadGoalToUI();
  renderCalendar();
  renderHistory();
  renderStats();
  updateProgress();
}

document.addEventListener("input", (e)=>{
  if(e.target && e.target.id === "resetPasswordField"){
    validateReset();
  }
});

loadState();
