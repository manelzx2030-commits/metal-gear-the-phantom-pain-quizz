// Audio System
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    playClick() {
        if (!this.enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }
    playAlert() {
        if (!this.enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.setValueAtTime(800, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }
    playFulton() {
        if (!this.enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }
}
const audioSys = new AudioSystem();

// Game State
let gameState = {
    name: "Venom Snake",
    unit: "Unidade de Combate",
    avatar: "Venom Snake",
    xp: 0,
    level: 1,
    gmp: 150000,
    resources: 5400,
    missionsCompleted: [],
    platforms: {
        combat: { level: 1, name: "Plataforma de Combate" },
        intel: { level: 1, name: "Plataforma de Intel" },
        medical: { level: 1, name: "Plataforma Médica" },
        security: { level: 1, name: "Plataforma de Segurança" },
        rd: { level: 1, name: "Plataforma de P&D" }
    },
    achievementsUnlocked: [],
    theme: "diamond-dogs",
    audioEnabled: true
};

function saveGame() {
    localStorage.setItem('mgsv_idroid_save_ptbr', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('mgsv_idroid_save_ptbr');
    if (saved) {
        try {
            gameState = JSON.parse(saved);
        } catch(e) { console.error("Erro ao carregar save", e); }
    }
}

const ranks = [
    { minLvl: 1, name: "Recruta" },
    { minLvl: 10, name: "Soldado" },
    { minLvl: 20, name: "Operativo" },
    { minLvl: 30, name: "Comandante" },
    { minLvl: 40, name: "Cão de Diamante de Elite" },
    { minLvl: 48, name: "Chefe Lendário" }
];

function getRankName(lvl) {
    let currentRank = ranks[0].name;
    for (let r of ranks) {
        if (lvl >= r.minLvl) currentRank = r.name;
    }
    return currentRank;
}

function addXp(amount) {
    gameState.xp += amount;
    let xpNeeded = gameState.level * 500;
    while (gameState.xp >= xpNeeded && gameState.level < 50) {
        gameState.xp -= xpNeeded;
        gameState.level++;
        xpNeeded = gameState.level * 500;
        showModal("PROMOÇÃO", `Chefe, você foi promovido para o Nível ${gameState.level}! Patente: ${getRankName(gameState.level)}`);
    }
    if (gameState.level >= 50) {
        gameState.xp = Math.min(gameState.xp, xpNeeded);
    }
    updateHud();
    saveGame();
    checkAchievements();
}

function updateHud() {
    document.getElementById('hudName').textContent = gameState.name;
    document.getElementById('hudUnitAndRank').textContent = `${gameState.unit} | ${getRankName(gameState.level)}`;
    document.getElementById('hudLevelText').textContent = `LVL ${gameState.level}`;
    let xpNeeded = gameState.level * 500;
    document.getElementById('hudXpText').textContent = `${gameState.xp} / ${xpNeeded} XP`;
    let xpPercent = Math.min(100, (gameState.xp / xpNeeded) * 100);
    document.getElementById('hudXpBar').style.width = `${xpPercent}%`;
    document.getElementById('hudGmp').textContent = gameState.gmp.toLocaleString('pt-BR');
    document.getElementById('hudResources').textContent = gameState.resources.toLocaleString('pt-BR');

    const avatarIcons = {
        "Venom Snake": "fa-user-ninja",
        "Big Boss": "fa-skull",
        "Quiet": "fa-crosshairs",
        "Kazuhira Miller": "fa-glasses",
        "Ocelot": "fa-hat-cowboy",
        "DD": "fa-dog"
    };
    document.getElementById('hudAvatarIcon').className = `fa-solid ${avatarIcons[gameState.avatar] || 'fa-user-ninja'} fa-2x`;
}

window.addEventListener('DOMContentLoaded', () => {
    loadGame();
    
    document.documentElement.setAttribute('data-theme', gameState.theme);
    document.getElementById('themeSelector').value = gameState.theme;
    document.getElementById('audioToggle').checked = gameState.audioEnabled;
    audioSys.enabled = gameState.audioEnabled;

    let progress = 0;
    const bar = document.getElementById('bootProgressBar');
    const statusText = document.getElementById('bootStatusText');
    const deployContainer = document.getElementById('bootDeployContainer');

    const bootInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(bootInterval);
            statusText.textContent = "TELEMETRIA DA ACC SINCRONIZADA.";
            deployContainer.style.display = 'block';
        }
        bar.style.width = `${progress}%`;
    }, 120);

    document.getElementById('deployMissionBtn').addEventListener('click', () => {
        audioSys.playClick();
        document.getElementById('bootScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('bootScreen').style.display = 'none';
            if (!localStorage.getItem('mgsv_idroid_save_ptbr')) {
                const modal = new bootstrap.Modal(document.getElementById('charSetupModal'));
                modal.show();
            }
            updateHud();
            renderCampaign();
            renderMotherBase();
            renderIntel();
            renderAchievements();
            renderLeaderboard();
            initRadarCanvas();
        }, 800);
    });

    document.querySelectorAll('.avatar-option').forEach(el => {
        el.addEventListener('click', () => {
            audioSys.playClick();
            document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('active', 'border-warning'));
            el.classList.add('active', 'border-warning');
            gameState.avatar = el.getAttribute('data-avatar');
        });
    });

    document.getElementById('charSetupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        audioSys.playClick();
        const nameInput = document.getElementById('setupName').value.trim();
        if (nameInput) gameState.name = nameInput;
        gameState.unit = document.getElementById('setupUnit').value;
        saveGame();
        updateHud();
        const modalEl = document.getElementById('charSetupModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
        showModal("BEM-VINDO AOS DIAMOND DOGS", `Operativo ${gameState.name} designado para a ${gameState.unit}. Chefe, contamos com você.`);
    });

    document.querySelectorAll('.idroid-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            audioSys.playClick();
            document.querySelectorAll('.idroid-nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const viewName = link.getAttribute('data-view');
            switchView(viewName);
            document.querySelector('.idroid-sidebar').classList.remove('mobile-open');
        });
    });

    document.getElementById('sidebarToggle').addEventListener('click', () => {
        audioSys.playClick();
        document.querySelector('.idroid-sidebar').classList.toggle('mobile-open');
    });

    document.getElementById('themeSelector').addEventListener('change', (e) => {
        gameState.theme = e.target.value;
        document.documentElement.setAttribute('data-theme', gameState.theme);
        saveGame();
    });

    document.getElementById('audioToggle').addEventListener('change', (e) => {
        gameState.audioEnabled = e.target.checked;
        audioSys.enabled = gameState.audioEnabled;
        saveGame();
    });

    document.getElementById('hireSoldierBtn').addEventListener('click', () => {
        if (gameState.gmp >= 10000) {
            gameState.gmp -= 10000;
            gameState.resources += 500;
            addXp(150);
            audioSys.playClick();
            showModal("SOLDADO RECRUTADO", "Um soldado voluntário se juntou aos Diamond Dogs via extração Fulton / recrutamento na Mother Base. +150 XP!");
            updateHud();
        } else {
            showModal("FUNDOS INSUFICIENTES", "GMP insuficiente para recrutar novos soldados.");
        }
    });

    document.getElementById('intelSearchInput').addEventListener('input', (e) => {
        renderIntel(e.target.value);
    });
});

function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.style.display = 'block';
    
    if (viewName === 'home') {
        document.getElementById('statMissionsCompleted').textContent = `${gameState.missionsCompleted.length}/9`;
        document.getElementById('statAchievementsCount').textContent = `${gameState.achievementsUnlocked.length}/7`;
    }
}

function showModal(title, text) {
    audioSys.playClick();
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBodyText').textContent = text;
    const modal = new bootstrap.Modal(document.getElementById('customModal'));
    modal.show();
}

function initRadarCanvas() {
    const canvas = document.getElementById('radarCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 150;
    canvas.height = 150;
    let angle = 0;

    function drawRadar() {
        ctx.clearRect(0, 0, 150, 150);
        ctx.strokeStyle = 'rgba(255, 102, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(75, 75, 60, 0, Math.PI * 2);
        ctx.arc(75, 75, 35, 0, Math.PI * 2);
        ctx.arc(75, 75, 15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(75, 15); ctx.lineTo(75, 135);
        ctx.moveTo(15, 75); ctx.lineTo(135, 75);
        ctx.stroke();

        ctx.save();
        ctx.translate(75, 75);
        ctx.rotate(angle);
        const gradient = ctx.createLinearGradient(0, 0, 60, 0);
        gradient.addColorStop(0, 'rgba(255, 102, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 102, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 60, -0.2, 0);
        ctx.lineTo(0, 0);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(95, 45, 4, 4);
        ctx.fillRect(45, 100, 4, 4);

        angle += 0.03;
        requestAnimationFrame(drawRadar);
    }
    drawRadar();
}

// Campaign Missions
const campaignMissions = [
    { id: 1, name: "Missão 1: Despertar", region: "Hospital de Chipre", desc: "Escape do cerco ao hospital com Ishmael e evite os esquadrões de assassinos XOF.", rewardXp: 500, rewardGmp: 50000 },
    { id: 2, name: "Missão 2: Membros Fantasmas", region: "Afeganistão", desc: "Infiltre-se no Quartel Wakh Sind e resgate Kazuhira Miller.", rewardXp: 800, rewardGmp: 80000 },
    { id: 3, name: "Missão 3: O Caminho do Herói", region: "Afeganistão", desc: "Elimine o comandante Spetsnaz Vasily Lipanovich.", rewardXp: 1000, rewardGmp: 100000 },
    { id: 4, name: "Missão 4: C2W", region: "Afeganistão", desc: "Destrua os equipamentos de comunicação no Radar de Comunicações Oriental.", rewardXp: 1200, rewardGmp: 120000 },
    { id: 5, name: "Missão 5: Além da Cerca", region: "Afeganistão", desc: "Extraia o engenheiro prisioneiro na Mina Bheung.", rewardXp: 1500, rewardGmp: 150000 },
    { id: 6, name: "Missão 6: Anjo com Asas Quebradas", region: "Afeganistão", desc: "Localize e extraia o contato da CIA Code Talker / Malak.", rewardXp: 1800, rewardGmp: 180000 },
    { id: 7, name: "Missão 7: Code Talker", region: "África (Campo PF)", desc: "Infiltre-se no Aeroporto Nova Braga e extraia Code Talker da mansão.", rewardXp: 2200, rewardGmp: 220000 },
    { id: 8, name: "Missão 8: Skull Face", region: "África (Smasei)", desc: "Enfronte Skull Face no OKB Zero e testemunhe a ativação do Sahelanthropus.", rewardXp: 3000, rewardGmp: 300000 },
    { id: 9, name: "Missão 9: Luzes Brilhantes, Mesmo na Morte", region: "Mother Base", desc: "Contenha o surto de parasita das cordas vocais na Instalação de Quarentena.", rewardXp: 5000, rewardGmp: 500000 }
];

function renderCampaign() {
    const grid = document.getElementById('campaignMissionsGrid');
    grid.innerHTML = "";
    campaignMissions.forEach(m => {
        const completed = gameState.missionsCompleted.includes(m.id);
        const col = document.createElement('div');
        col.className = "col-md-4";
        col.innerHTML = `
            <div class="holo-panel p-4 h-100 d-flex flex-column justify-content-between ${completed ? 'border-success' : ''}">
                <div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-dark text-warning border border-warning">${m.region}</span>
                        ${completed ? '<span class="badge bg-success"><i class="fa-solid fa-check me-1"></i> CONCLUÍDA</span>' : '<span class="badge bg-secondary">PENDENTE</span>'}
                    </div>
                    <h4 class="text-white">${m.name}</h4>
                    <p class="text-muted small">${m.desc}</p>
                </div>
                <div>
                    <div class="text-warning small mb-3">Recompensa: +${m.rewardXp} XP | +${m.rewardGmp.toLocaleString('pt-BR')} GMP</div>
                    <button class="btn btn-tactical w-100 ${completed ? 'btn-outline-success text-success' : ''}" onclick="playMission(${m.id})">
                        ${completed ? 'REPETIR OPERAÇÃO' : 'DESLOCAR PARA OPERAÇÃO'}
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
}

function playMission(id) {
    audioSys.playClick();
    const mission = campaignMissions.find(m => m.id === id);
    if (!gameState.missionsCompleted.includes(id)) {
        gameState.missionsCompleted.push(id);
        addXp(mission.rewardXp);
        gameState.gmp += mission.rewardGmp;
        showModal("MISSÃO BEM-SUCEDIDA", `Operação ${mission.name} concluída com sucesso! Adquiriu +${mission.rewardXp} XP e +${mission.rewardGmp.toLocaleString('pt-BR')} GMP.`);
    } else {
        addXp(Math.floor(mission.rewardXp / 3));
        showModal("OPERAÇÃO REPETIDA", `Replay bem-sucedido. Bônus tático concedido: +${Math.floor(mission.rewardXp / 3)} XP.`);
    }
    saveGame();
    renderCampaign();
    checkAchievements();
}

function renderMotherBase() {
    const grid = document.getElementById('motherBasePlatformsGrid');
    grid.innerHTML = "";
    Object.keys(gameState.platforms).forEach(key => {
        const p = gameState.platforms[key];
        const upgradeCost = p.level * 25000;
        const col = document.createElement('div');
        col.className = "col-md-4";
        col.innerHTML = `
            <div class="holo-panel p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-warning text-dark">PLATAFORMA</span>
                        <span class="text-warning">LVL ${p.level} / 10</span>
                    </div>
                    <h4 class="text-white">${p.name}</h4>
                    <p class="text-muted small">Gera GMP, recursos e aumenta a prontidão operacional dos Diamond Dogs.</p>
                </div>
                <div>
                    <div class="text-muted small mb-2">Custo de Upgrade: ${upgradeCost.toLocaleString('pt-BR')} GMP</div>
                    <button class="btn btn-tactical w-100" onclick="upgradePlatform('${key}')">MELHORAR PLATAFORMA</button>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
}

function upgradePlatform(key) {
    audioSys.playClick();
    const p = gameState.platforms[key];
    const cost = p.level * 25000;
    if (p.level >= 10) {
        showModal("NÍVEL MÁXIMO", "Esta plataforma da Mother Base atingiu o nível operacional máximo.");
        return;
    }
    if (gameState.gmp >= cost) {
        gameState.gmp -= cost;
        p.level++;
        addXp(300);
        saveGame();
        renderMotherBase();
        updateHud();
        showModal("PLATAFORMA MELHORADA", `${p.name} melhorada para o Nível ${p.level}! +300 XP.`);
        checkAchievements();
    } else {
        showModal("GMP INSUFICIENTE", `GMP necessário para o upgrade: ${cost.toLocaleString('pt-BR')}`);
    }
}

let activeGameType = null;

function openMiniGame(type) {
    audioSys.playClick();
    activeGameType = type;
    document.getElementById('miniGameArena').style.display = 'block';
    const content = document.getElementById('miniGameContent');
    const title = document.getElementById('activeGameTitle');

    if (type === 'quiz') {
        title.textContent = "QUIZ TÁTICO MGSV";
        initQuizGame(content);
    } else if (type === 'stealth') {
        title.textContent = "SIMULAÇÃO DE INFILTRAÇÃO STEALTH";
        initStealthGame(content);
    } else if (type === 'fulton') {
        title.textContent = "RECUPERAÇÃO FULTON";
        initFultonGame(content);
    } else if (type === 'memory') {
        title.textContent = "JOGO DA MEMÓRIA DOS DIAMOND DOGS";
        initMemoryGame(content);
    } else if (type === 'charid') {
        title.textContent = "IDENTIFICAÇÃO DE PERSONAGEM";
        initCharIdGame(content);
    } else if (type === 'wordsearch') {
        title.textContent = "CAÇA-PALAVRAS TÁTICO";
        initWordSearchGame(content);
    }
    document.getElementById('miniGameArena').scrollIntoView({ behavior: 'smooth' });
}

function closeMiniGame() {
    audioSys.playClick();
    document.getElementById('miniGameArena').style.display = 'none';
    activeGameType = null;
}

const quizQuestions = [ /* ... all 28 questions ... */ /* (same as original, omitted for brevity) */ ];
let currentQuizIndex = 0;
let quizScore = 0;

function initQuizGame(container) { /* ... */ }
function renderQuizQuestion(container) { /* ... */ }
function answerQuiz(selectedIdx) { /* ... */ }

function initStealthGame(container) { /* ... */ }

let fultonScore = 0;
let fultonCombo = 0;
let fultonTimer = 30;
function initFultonGame(container) { /* ... */ }
function startFultonAction() { /* ... */ }

function initMemoryGame(container) { /* ... */ }

const charIdList = [ /* ... */ ];
let charIdIndex = 0;
let charIdScore = 0;
function initCharIdGame(container) { /* ... */ }
function renderCharIdQuestion(container) { /* ... */ }
function answerCharId(selected, correct) { /* ... */ }

function initWordSearchGame(container) { /* ... */ }

const intelDatabase = [ /* ... */ ];
function renderIntel(filter = "") { /* ... */ }

const achievementsList = [ /* ... */ ];
function renderAchievements() { /* ... */ }
function checkAchievements() { /* ... */ }

function renderLeaderboard() { /* ... */ }

function resetSaveData() {
    if (confirm("Tem certeza de que deseja apagar todos os dados salvos dos Diamond Dogs e reiniciar?")) {
        localStorage.removeItem('mgsv_idroid_save_ptbr');
        location.reload();
    }
}