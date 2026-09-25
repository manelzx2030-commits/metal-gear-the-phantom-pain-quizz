// ==========================================
// MGSV iDROID TACTICAL SIMULATOR - GEAR.JS
// ==========================================
// --- Sistema de Áudio (Web Audio API) ---
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
        try {
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
        } catch(e) {}
    }
    playAlert() {
        if (!this.enabled) return;
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
            osc.frequency.setValueAtTime(600, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);
        } catch(e) {}
    }
}
const audioSys = new AudioSystem();

// --- Estado do Jogador / LocalStorage ---
let playerData = JSON.parse(localStorage.getItem('mgsv_player_data')) || {
    name: "",
    unit: "Unidade de Combate",
    avatar: "Venom Snake",
    level: 1,
    xp: 0,
    maxXp: 500,
    gmp: 150000,
    resources: 5400,
    missionsCompleted: [],
    platforms: 5,
    achievements: [],
    theme: "diamond-dogs",
    audioEnabled: true
};

function savePlayerData() {
    localStorage.setItem('mgsv_player_data', JSON.stringify(playerData));
}

// --- Dados de Campanhas, Intel e Conquistas ---
const campaignMissions = [
    { id: 1, title: "Missão 1: Despertar", region: "Hospital de Chipre", xp: 500, gmp: 50000, desc: "Escape do hospital em chamas com a ajuda de Ishmael." },
    { id: 2, title: "Missão 2: Membros Fantasmas", region: "Afeganistão", xp: 800, gmp: 80000, desc: "Resgate Kazuhira Miller do acampamento de Wakh Sind." },
    { id: 3, title: "Missão 3: O Caminho do Herói", region: "Afeganistão", xp: 1000, gmp: 100000, desc: "Elimine ou extraia o oficial Spetsnaz." },
    { id: 4, title: "Missão 4: C2W", region: "Afeganistão", xp: 1200, gmp: 120000, desc: "Destrua os equipamentos de comunicação inimigos." },
    { id: 5, title: "Missão 5: Além da Cerca", region: "Afeganistão", xp: 1500, gmp: 150000, desc: "Resgate o engenheiro preso pelas forças soviéticas." },
    { id: 6, title: "Missão 6: Anjo com Asas Quebradas", region: "Afeganistão", xp: 1800, gmp: 180000, desc: "Localize e extraia o prisioneiro Malak." },
    { id: 7, title: "Missão 7: Code Talker", region: "África (Pf)", xp: 2200, gmp: 220000, desc: "Infiltre-se na mansão para extrair o cientista Code Talker." },
    { id: 8, title: "Missão 8: Skull Face", region: "África (Sunset)", xp: 2500, gmp: 250000, desc: "Confronte o líder da XOF na base de Central Base Camp." },
    { id: 9, title: "Missão 9: Luzes Brilhantes, Mesmo na Morte", region: "Mother Base", xp: 3000, gmp: 300000, desc: "Contenha a crise biológica na plataforma de quarentena." }
];

const intelDatabaseData = [
    { title: "Venom Snake (Ahab)", category: "Personagens", desc: "O mercenário lendário, líder e fundador dos Diamond Dogs após a queda da Militaires Sans Frontières (MSF)." },
    { title: "Kazuhira Miller", category: "Personagens", desc: "Co-fundador dos Diamond Dogs, especialista tático e logístico, conhecido como 'Master Miller'." },
    { title: "Revolver Ocelot", category: "Personagens", desc: "Mestre dos interrogatórios e pistolento de elite, responsável pelo treinamento dos recrutas." },
    { title: "Quiet", category: "Companheiros", desc: "Sniper letal que respira através da pele devido a parasitos da Cordyceps. Oferece cobertura tática extrema." },
    { title: "D-Dog (DD)", category: "Companheiros", desc: "Lobo resgatado como filhote no Afeganistão, treinado para marcar inimigos e alvos no campo." },
    { title: "Fulton Recovery System", category: "Equipamentos", desc: "Sistema de balão a ar comprimido usado para extrair soldados, veículos, armas e animais diretamente para a Mother Base." },
    { title: "iDroid", category: "Equipamentos", desc: "Computador de pulso holográfico militar avançado utilizado para gerenciar mapas, missões e Mother Base." },
    { title: "XOF", category: "Organizações", desc: "Unidade secreta de operações encabeçada por Skull Face, antagonista principal ligada à Cipher." }
];

const achievementsData = [
    { id: "dog", title: "Diamond Dog", desc: "Complete o seu registro de operativo no ACC.", icon: "fa-dog" },
    { id: "tactical", title: "Tactical Genius", desc: "Alcance o nível 5 de operativo.", icon: "fa-brain" },
    { id: "fulton", title: "Fulton Master", desc: "Execute extrações e colete recursos de combate.", icon: "fa-parachute-box" },
    { id: "commander", title: "Mother Base Commander", desc: "Construa e expanda plataformas da Mother Base.", icon: "fa-building-shield" },
    { id: "soldier", title: "Legendary Soldier", desc: "Conclua missões de campanha com sucesso.", icon: "fa-medal" },
    { id: "phantom", title: "Phantom Operative", desc: "Explore o iDroid e simulações táticas.", icon: "fa-user-secret" },
    { id: "boss", title: "Big Boss", desc: "Atinja patentes de elite e níveis elevados.", icon: "fa-skull" }
];

// --- Inicialização e Boot ---
window.addEventListener('DOMContentLoaded', () => {
    initBootSequence();
    setupEventListeners();
    applyTheme(playerData.theme);
    initRadar();
});

function initBootSequence() {
    const bootProgressBar = document.getElementById('bootProgressBar');
    const bootStatusText = document.getElementById('bootStatusText');
    const bootDeployContainer = document.getElementById('bootDeployContainer');
    const bootScreen = document.getElementById('bootScreen');
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            bootStatusText.innerText = "SISTEMAS OPERACIONAIS ONLINE. PRONTO PARA DEPLOY.";
            bootDeployContainer.style.display = 'block';
            audioSys.playAlert();
        }
        bootProgressBar.style.width = progress + '%';
    }, 150);

    document.getElementById('deployMissionBtn').addEventListener('click', () => {
        audioSys.playClick();
        bootScreen.style.opacity = '0';
        setTimeout(() => {
            bootScreen.style.display = 'none';
            checkPlayerRegistration();
        }, 800);
    });
}

function checkPlayerRegistration() {
    if (!playerData.name || playerData.name.trim() === "") {
        const charModal = new bootstrap.Modal(document.getElementById('charSetupModal'), { backdrop: 'static', keyboard: false });
        charModal.show();
    } else {
        updateHUD();
        renderViews();
    }
}

// --- Configuração de Eventos ---
function setupEventListeners() {
    // Seleção de Avatar
    document.querySelectorAll('.avatar-option').forEach(opt => {
        opt.addEventListener('click', () => {
            audioSys.playClick();
            document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('active', 'border-warning'));
            opt.classList.add('active', 'border-warning');
            playerData.avatar = opt.getAttribute('data-avatar');
        });
    });

    // Formulário de Registro
    document.getElementById('charSetupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        audioSys.playClick();
        const nameInput = document.getElementById('setupName').value.trim();
        const unitSelect = document.getElementById('setupUnit').value;
        if (nameInput) {
            playerData.name = nameInput;
            playerData.unit = unitSelect;
            savePlayerData();
            const modalEl = document.getElementById('charSetupModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            unlockAchievement('dog');
            updateHUD();
            renderViews();
            showTacticalModal("BEM-VINDO AO ACC", `Operativo <strong>${playerData.name}</strong> registrado com sucesso na <strong>${playerData.unit}</strong>.`);
        }
    });

    // Navegação Sidebar
    document.querySelectorAll('.idroid-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            audioSys.playClick();
            document.querySelectorAll('.idroid-nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const view = link.getAttribute('data-view');
            switchView(view);
            document.querySelector('.idroid-sidebar').classList.remove('mobile-open');
        });
    });

    // Toggle Sidebar Mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            audioSys.playClick();
            document.querySelector('.idroid-sidebar').classList.toggle('mobile-open');
        });
    }

    // Opções & Tema
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        themeSelector.value = playerData.theme;
        themeSelector.addEventListener('change', (e) => {
            audioSys.playClick();
            playerData.theme = e.target.value;
            savePlayerData();
            applyTheme(playerData.theme);
        });
    }

    const audioToggle = document.getElementById('audioToggle');
    if (audioToggle) {
        audioToggle.checked = playerData.audioEnabled;
        audioToggle.addEventListener('change', (e) => {
            playerData.audioEnabled = e.target.checked;
            audioSys.enabled = playerData.audioEnabled;
            savePlayerData();
        });
    }

    // Contratar soldado na Mother Base
    const hireBtn = document.getElementById('hireSoldierBtn');
    if (hireBtn) {
        hireBtn.addEventListener('click', () => {
            audioSys.playClick();
            if (playerData.gmp >= 10000) {
                playerData.gmp -= 10000;
                playerData.platforms += 1;
                addXP(100);
                savePlayerData();
                updateHUD();
                renderMotherBase();
                showTacticalModal("CONTRATAÇÃO BEM-SUCEDIDA", "Novo soldado integrado à Mother Base! +1 Plataforma expandida, +100 XP.");
            } else {
                showTacticalModal("RECURSOS INSUFICIENTES", "Você precisa de pelo menos 10.000 GMP para contratar novos operativos.");
            }
        });
    }

    // Busca em Intel
    const intelSearch = document.getElementById('intelSearchInput');
    if (intelSearch) {
        intelSearch.addEventListener('input', (e) => {
            renderIntelDatabase(e.target.value);
        });
    }

    // --- CORREÇÃO DEFINITIVA DA TELA PRETA (BACKDROP DO MODAL) ---
    const customModal = document.getElementById('customModal');
    if (customModal) {
        customModal.addEventListener('hidden.bs.modal', function () {
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        });
    }
}

// --- Sistema de Visualizações (Views) ---
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
        target.style.display = 'block';
    }
    if (viewId === 'deploy') renderCampaignMissions();
    if (viewId === 'motherbase') renderMotherBase();
    if (viewId === 'intel') renderIntelDatabase();
    if (viewId === 'ranking') renderLeaderboard();
    if (viewId === 'achievements') renderAchievements();
}

function renderViews() {
    updateHUD();
    renderHomeStats();
}

// --- Atualização do HUD ---
function updateHUD() {
    document.getElementById('hudName').innerText = playerData.name || "VENOM SNAKE";
    document.getElementById('hudUnitAndRank').innerText = `${playerData.unit} | ${getRankName(playerData.level)}`;
    document.getElementById('hudLevelText').innerText = `LVL ${playerData.level}`;
    document.getElementById('hudXpText').innerText = `${playerData.xp} / ${playerData.maxXp} XP`;
    
    const xpPercent = Math.min(100, (playerData.xp / playerData.maxXp) * 100);
    document.getElementById('hudXpBar').style.width = xpPercent + '%';
    document.getElementById('hudGmp').innerText = playerData.gmp.toLocaleString('pt-BR');
    document.getElementById('hudResources').innerText = playerData.resources.toLocaleString('pt-BR');
    const avatarIcon = document.getElementById('hudAvatarIcon');
    if (avatarIcon) {
        avatarIcon.className = getAvatarIconClass(playerData.avatar);
    }
}

function getAvatarIconClass(avatar) {
    switch(avatar) {
        case 'Big Boss': return 'fa-solid fa-skull fa-2x';
        case 'Quiet': return 'fa-solid fa-crosshairs fa-2x';
        case 'Kazuhira Miller': return 'fa-solid fa-glasses fa-2x';
        case 'Ocelot': return 'fa-solid fa-hat-cowboy fa-2x';
        case 'DD': return 'fa-solid fa-dog fa-2x';
        default: return 'fa-solid fa-user-ninja fa-2x';
    }
}

function getRankName(lvl) {
    if (lvl >= 40) return "Legendary Boss";
    if (lvl >= 30) return "Elite Diamond Dog";
    if (lvl >= 20) return "Commander";
    if (lvl >= 10) return "Operative";
    if (lvl >= 5) return "Soldier";
    return "Rookie";
}

function addXP(amount) {
    playerData.xp += amount;
    while (playerData.xp >= playerData.maxXp) {
        playerData.xp -= playerData.maxXp;
        playerData.level += 1;
        playerData.maxXp = Math.floor(playerData.maxXp * 1.3);
        showTacticalModal("SUBIU DE NÍVEL!", `Parabéns, Chefe! Você alcançou o nível <strong>${playerData.level}</strong> (${getRankName(playerData.level)}).`);
        if (playerData.level >= 5) unlockAchievement('tactical');
        if (playerData.level >= 25) unlockAchievement('boss');
    }
    savePlayerData();
    updateHUD();
}

// --- Estatísticas Início / Radar ---
function renderHomeStats() {
    document.getElementById('statMissionsCompleted').innerText = `${playerData.missionsCompleted.length}/9`;
    document.getElementById('statPlatformsBuilt').innerText = playerData.platforms;
    document.getElementById('statAchievementsCount').innerText = `${playerData.achievements.length}/7`;
}

function initRadar() {
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 150;
    canvas.height = 150;
    let angle = 0;
    function drawRadar() {
        ctx.clearRect(0, 0, 150, 150);
        
        ctx.strokeStyle = 'rgba(255, 102, 0, 0.3)';
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
        const grad = ctx.createLinearGradient(0, 0, 60, 0);
        grad.addColorStop(0, 'rgba(255, 102, 0, 0.6)');
        grad.addColorStop(1, 'rgba(255, 102, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 60, 0, Math.PI / 4);
        ctx.lineTo(0, 0);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(95, 55, 3, 0, Math.PI * 2);
        ctx.fill();
        angle += 0.03;
        requestAnimationFrame(drawRadar);
    }
    drawRadar();
}

// --- Campanha / Deslocamento ---
function renderCampaignMissions() {
    const grid = document.getElementById('campaignMissionsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    campaignMissions.forEach(m => {
        const isCompleted = playerData.missionsCompleted.includes(m.id);
        const col = document.createElement('div');
        col.className = 'col-md-4';

        col.innerHTML = `
            <div class="mission-card h-100 p-3 ${isCompleted ? 'completed' : ''}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${m.title}</h6>
                        <span class="badge bg-secondary">${m.region}</span>
                    </div>
                    <span class="badge bg-warning text-dark">${m.xp} XP</span>
                </div>
                <p class="small text-muted mt-2">${m.desc}</p>
                <button class="btn btn-outline-warning btn-sm w-100 mt-2" 
                        ${isCompleted ? 'disabled' : `onclick="startMission(${m.id})"`}>
                    ${isCompleted ? '✓ Concluída' : 'Iniciar Missão'}
                </button>
            </div>
        `;
        grid.appendChild(col);
    });
}

// Função para iniciar missão
function startMission(missionId) {
    audioSys.playClick();
    const mission = campaignMissions.find(m => m.id === missionId);
    if (!mission) return;

    playerData.missionsCompleted.push(missionId);
    playerData.xp += mission.xp;
    playerData.gmp += mission.gmp;

    if (missionId % 3 === 0) {
        playerData.gmp += 10000;
        showTacticalModal("RECOMPENSA ESPECIAL!", "+10.000 GMP por missão múltipla!");
    }

    savePlayerData();
    updateHUD();
    renderViews();
    showTacticalModal("MISSÃO CONCLUÍDA!", `${mission.title} - ${mission.xp} XP e ${mission.gmp.toLocaleString('pt-BR')} GMP ganhos!`);
}

// --- Mother Base ---
function renderMotherBase() {
    const container = document.getElementById('motherBaseContainer');
    if (!container) return;
    container.innerHTML = `
        <div class="motherbase-header text-center">
            <h4>Mother Base - Plataformas: <strong>${playerData.platforms}</strong></h4>
        </div>
        <div class="text-center mt-4">
            <button id="hireSoldierBtn" class="btn btn-warning px-5 py-3 fw-bold">
                <i class="fa-solid fa-hands-holding-diamond"></i> CONTRATAR SOLDADO (10.000 GMP)
            </button>
        </div>
        <div class="text-center mt-4">
            <span class="badge bg-success fs-5">Plataformas Ativas: ${playerData.platforms}</span>
        </div>
    `;
}

// --- Intel Database ---
function renderIntelDatabase(searchTerm = "") {
    const container = document.getElementById('intelDatabaseContainer');
    if (!container) return;
    container.innerHTML = '';

    const filtered = intelDatabaseData.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-center text-muted">Nenhum resultado encontrado.</p>`;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'intel-card p-4 mb-3';
        card.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fa-solid fa-info-circle text-warning me-3 fs-3"></i>
                <div>
                    <h6 class="mb-1">${item.title}</h6>
                    <span class="badge bg-primary">${item.category}</span>
                    <p class="small text-muted mt-2">${item.desc}</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- Leaderboard (simulado) ---
function renderLeaderboard() {
    const container = document.getElementById('leaderboardContainer');
    if (!container) return;
    container.innerHTML = `
        <h5 class="text-center mb-4">Ranking de Operativos</h5>
        <div class="list-group">
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <span><strong>1.</strong> Venom Snake</span>
                <span class="text-warning">Level 99 • 1.2M XP</span>
            </div>
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <span><strong>2.</strong> Big Boss</span>
                <span class="text-warning">Level 88 • 950K XP</span>
            </div>
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <span><strong>3.</strong> Ocelot</span>
                <span class="text-warning">Level 75 • 720K XP</span>
            </div>
        </div>
    `;
}

// --- Achievements ---
function renderAchievements() {
    const container = document.getElementById('achievementsContainer');
    if (!container) return;
    container.innerHTML = '';

    achievementsData.forEach(ach => {
        const achieved = playerData.achievements.includes(ach.id);
        const badge = document.createElement('div');
        badge.className = `achievement-badge ${achieved ? 'achieved' : ''} mb-3`;
        badge.innerHTML = `
            <i class="fa-solid ${ach.icon} achievement-icon"></i>
            <div>
                <h6>${ach.title}</h6>
                <p class="small">${ach.desc}</p>
            </div>
            ${achieved ? `<span class="badge bg-success">Concluído</span>` : ''}
        `;
        container.appendChild(badge);
    });
}

// --- Modal Tático ---
function showTacticalModal(title, message) {
    const modalTitle = document.getElementById('tacticalModalTitle');
    const modalBody = document.getElementById('tacticalModalBody');
    const modal = new bootstrap.Modal(document.getElementById('tacticalModal'));
    
    modalTitle.innerHTML = title;
    modalBody.innerHTML = message;
    modal.show();
}

// --- Conquistas ---
function unlockAchievement(id) {
    if (!playerData.achievements.includes(id)) {
        playerData.achievements.push(id);
        if (id === 'tactical') showTacticalModal("CONQUISTA DESBLOQUEADA!", "Tactical Genius desbloqueado!");
        if (id === 'boss') showTacticalModal("LEGENDÁRIO!", "Big Boss desbloqueado!");
        savePlayerData();
    }
}

// --- Aplicar Tema Diamond Dogs ---
function applyTheme(theme) {
    if (theme === "diamond-dogs") {
        document.body.classList.add('diamond-theme');
        document.body.classList.remove('black-theme');
    }
}

// Inicialização final
function init() {
    // Tudo já está no DOMContentLoaded
}
