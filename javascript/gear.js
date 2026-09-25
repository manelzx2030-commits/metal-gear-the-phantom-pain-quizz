/* =====================================================================
   DIAMOND DOGS TACTICAL SIMULATOR — SCRIPT.JS
   Módulos: Config, Storage, Boot, Screens, CharacterCreation,
   RPGSystem, Dashboard, Nav, Ranking, Achievements, Quiz,
   MotherBaseTasks, Intel, Cassettes, YoutubePlayer, Map, Codec,
   Options, Clock, Init

   CHANGELOG (revisão atual):
   - [BUG CORRIGIDO] normalizeProfile() existia mas nunca era chamada
     ao carregar o perfil salvo — um perfil antigo sem os arrays
     esperados podia quebrar o app inteiro. Agora é chamada logo após
     Storage.loadProfile().
   - [BUG CORRIGIDO] Mapa "esquisito" em monitores grandes: era um
     problema de CSS (sem max-width no conteúdo), não de JS — o SVG em
     si já era gerado corretamente por viewBox.
   - [BUG CORRIGIDO] Letras grandes: também era CSS (h2/h3 sem
     font-size explícito). Veja gear.css.
   - [CONTEÚDO] Player de fitas cassete via YouTube: cada fita abre um
     modal com busca automática no YouTube (e player embutido se um
     youtubeId for preenchido no CONFIG).
   - [CONTEÚDO] Nova fita "Here's to You (Nicola and Bart)", marcada
     como a mais dramática, desbloqueada só após a missão final.
   - [CONTEÚDO] Busca/filtro na aba de Fitas Cassete.
   - [CONTEÚDO] "Fita em destaque do dia" na tela inicial.
   - [MANTIDO] Deduplicação do ranking (dedupeRankingBoard).
   ===================================================================== */
'use strict';

/* ---------------------------------------------------------------
   CONFIG
   --------------------------------------------------------------- */
const CONFIG = {
  storageKey: 'dd_soldier_profile',
  themeKey: 'dd_theme_pref',
  rankingKey: 'dd_ranking_board',

  units: [
    { id: 'combat',   label: 'Unidade de Combate' },
    { id: 'support',  label: 'Unidade de Suporte' },
    { id: 'intel',    label: 'Equipe de Inteligência' },
    { id: 'rnd',      label: 'Equipe de P&D' },
    { id: 'security', label: 'Equipe de Segurança' },
    { id: 'medical',  label: 'Equipe Médica' },
  ],

  avatars: [
    { id: 'venom',   label: 'Venom Snake',       initials: 'VS', color: '#5c7a4f' },
    { id: 'bigboss', label: 'Big Boss',          initials: 'BB', color: '#3f5638' },
    { id: 'quiet',   label: 'Quiet',             initials: 'Q',  color: '#8fae6b' },
    { id: 'miller',  label: 'Kazuhira Miller',   initials: 'KM', color: '#7a5c3f' },
    { id: 'ocelot',  label: 'Ocelot',            initials: 'RO', color: '#d9432b' },
    { id: 'dd',      label: 'DD (D-Dog)',        initials: 'DD', color: '#b08a3f' },
  ],

  maxLevel: 50,
  ranks: [
    { min: 1,  max: 5,  label: 'Recruta' },
    { min: 6,  max: 12, label: 'Soldado' },
    { min: 13, max: 22, label: 'Operativo' },
    { min: 23, max: 34, label: 'Comandante' },
    { min: 35, max: 45, label: 'Diamond Dog de Elite' },
    { min: 46, max: 50, label: 'Chefe Lendário' },
  ],

  missions: [
    'Awakening', 'Phantom Limbs', "A Hero's Way", 'C2W', 'Over The Fence',
    'Angel With Broken Wings', 'Code Talker', 'Skull Face', 'Shining Lights, Even In Death',
  ],

  achievements: [
    { id: 'diamond_dog',        icon: '🏆', name: 'Diamond Dog' },
    { id: 'tactical_genius',    icon: '🧠', name: 'Gênio Tático' },
    { id: 'fulton_master',      icon: '🎈', name: 'Mestre do Fulton' },
    { id: 'mb_commander',       icon: '⛁', name: 'Comandante da Mother Base' },
    { id: 'legendary_soldier',  icon: '⭐', name: 'Soldado Lendário' },
    { id: 'phantom_operative',  icon: '👻', name: 'Operativo Fantasma' },
    { id: 'big_boss',           icon: '🐍', name: 'Big Boss' },
    { id: 'mb_master',          icon: '🔧', name: 'Engenheiro-Chefe' },
  ],

  motherBaseTasks: [
    { id: 'platform_rnd',      name: 'Expandir Plataforma de P&D', desc: 'Amplie a capacidade de pesquisa e desenvolvimento da Mother Base.', xp: 30 },
    { id: 'barracks',          name: 'Reformar Alojamentos', desc: 'Melhore as condições de vida da tropa estacionada na base.', xp: 30 },
    { id: 'medbay',            name: 'Atualizar Enfermaria', desc: 'Reduza o tempo de recuperação de soldados feridos em campo.', xp: 30 },
    { id: 'comms_tower',       name: 'Calibrar Torre de Comunicações', desc: 'Aumente o alcance do rádio tático da base.', xp: 30 },
    { id: 'perimeter',         name: 'Reforçar Perímetro de Segurança', desc: 'Fortaleça as defesas contra infiltração inimiga.', xp: 30 },
    { id: 'kennel',            name: 'Construir Canil Tático', desc: 'Prepare instalações para o treinamento de D-Dog e unidades caninas de combate.', xp: 35 },
    { id: 'weapons_platform',  name: 'Expandir Plataforma de Armamento', desc: 'Amplie a produção de armamento pesado e munições especiais.', xp: 35 },
    { id: 'helipad',           name: 'Construir Heliporto Adicional', desc: 'Reduza o tempo de resposta de extrações e reforços aéreos.', xp: 35 },
    { id: 'interrogation',     name: 'Montar Sala de Interrogatório', desc: 'Melhore a extração de inteligência de prisioneiros capturados.', xp: 40 },
    { id: 'intel_unit',        name: 'Formar Unidade de Inteligência de Campo', desc: 'Estabeleça uma rede de informantes para mapear posições inimigas.', xp: 40 },
  ],

  intelFiles: [
    { id: 'venom_snake', title: 'Dossiê 01 — "Venom" Snake', requiresMission: null,
      body: 'Comandante da Diamond Dogs. Sobrevivente de um atentado que o deixou em coma por nove anos, reconhecido pelo chifre de estilhaço na cabeça. Lidera pessoalmente as operações mais delicadas da PMC.' },
    { id: 'kaz_miller', title: 'Dossiê 02 — Kazuhira Miller', requiresMission: 0,
      body: 'Cofundador da Diamond Dogs, responsável pela logística e pelo planejamento estratégico da Mother Base. Perdeu um braço e uma perna no mesmo ataque que vitimou o comandante.' },
    { id: 'ocelot', title: 'Dossiê 03 — Revolver Ocelot', requiresMission: 1,
      body: 'Instrutor de interrogatório e especialista em armas de cano longo. Atua como intermediário entre a Diamond Dogs e agências de inteligência internacionais.' },
    { id: 'quiet', title: 'Dossiê 04 — Quiet', requiresMission: 2,
      body: 'Atiradora de elite capturada durante uma operação de resgate. Comunica-se apenas por gestos e assobios; sua origem exata permanece um mistério para a maior parte da tropa.' },
    { id: 'code_talker', title: 'Dossiê 05 — Code Talker', requiresMission: 4,
      body: 'Ex-linguista e especialista em guerra biológica, resgatado de um centro de pesquisas secreto. Guarda informações críticas sobre a ameaça parasitária por trás da operação.' },
    { id: 'skull_face', title: 'Dossiê 06 — "Skull Face"', requiresMission: 6,
      body: 'Ex-membro da XOF e arquiteto de uma conspiração envolvendo armas de base linguística. Principal alvo de inteligência da Diamond Dogs nesta campanha.' },
    { id: 'mother_base_report', title: 'Relatório — Mother Base', requiresMission: null,
      body: 'Plataforma marítima multifuncional que serve como quartel-general da Diamond Dogs, crescendo conforme novos recrutas e recursos são extraídos em campo via Fulton.' },
    { id: 'diamond_dogs_history', title: 'Histórico — Diamond Dogs', requiresMission: 8,
      body: 'PMC fundada nas Seychelles, formada majoritariamente por soldados recrutados via extração Fulton. Opera sem bandeira nacional, respondendo apenas ao comando de Venom Snake.' },
  ],

  // Fitas cassete — catálogo informativo. Cada fita pode abrir um
  // player de YouTube: se "youtubeId" estiver preenchido, o vídeo é
  // embutido diretamente no modal; caso contrário, o modal mostra um
  // botão que abre a busca correspondente no YouTube em uma nova aba
  // (usando "youtubeQuery", ou o título + artista como padrão).
  // "requiresMission": índice de missão necessário para a fita
  // aparecer desbloqueada; null = disponível desde o início.
  cassetteTapesScore: [
    { id: 'tape_sins', title: 'Sins of the Father', artist: 'Vocal: Donna Burke', foundAt: 'Concedida ao concluir a missão principal 30', requiresMission: null, youtubeId: null, youtubeQuery: 'Sins of the Father Donna Burke Metal Gear Solid V' },
    { id: 'tape_quiet', title: "Quiet's Theme", artist: 'Vocal: Stefanie Joosten', foundAt: 'Encontrada após os rastros da missão 45', requiresMission: 2, youtubeId: null, youtubeQuery: "Quiet's Theme Stefanie Joosten Metal Gear Solid V" },
    { id: 'tape_phantom', title: 'A Phantom Pain', artist: 'Trilha original', foundAt: 'Cabana ao nordeste do Wakh Sind Barracks', requiresMission: 0, youtubeId: null, youtubeQuery: 'A Phantom Pain theme Metal Gear Solid V soundtrack' },
    { id: 'tape_snake_eater', title: 'Snake Eater', artist: 'Vocal: Cynthia Harrell (tema de MGS3)', foundAt: 'Posto de guarda oeste da Munoko ya Nioka Station', requiresMission: 5, youtubeId: null, youtubeQuery: 'Snake Eater Cynthia Harrell Metal Gear Solid' },
    // Fita adicionada nesta revisão — a mais dramática do catálogo.
    { id: 'tape_herestoyou', title: "Here's to You (Nicola and Bart)", artist: 'Joan Baez & Ennio Morricone', foundAt: 'Tocada ao lado do memorial da Mother Base — tributo aos caídos da Diamond Dogs', requiresMission: 8, dramatic: true, youtubeId: null, youtubeQuery: "Joan Baez Ennio Morricone Here's to You Nicola and Bart" },
  ],

  cassetteTapesLicensed: [
    { id: 'tape_takeonme', title: 'Take On Me', artist: 'a-ha', foundAt: 'Yakho Oboo Supply Outpost, ala oeste', requiresMission: null, youtubeId: null, youtubeQuery: 'a-ha Take On Me official video' },
    { id: 'tape_kids', title: 'Kids In America', artist: 'Kim Wilde', foundAt: 'Da Shago Kallai, próximo ao prédio principal', requiresMission: 1, youtubeId: null, youtubeQuery: 'Kim Wilde Kids In America official video' },
    { id: 'tape_maneater', title: 'Maneater', artist: 'Hall & Oates', foundAt: 'Em frente ao Lamar Khaate Palace', requiresMission: 1, youtubeId: null, youtubeQuery: 'Hall & Oates Maneater official video' },
    { id: 'tape_rebelyell', title: 'Rebel Yell', artist: 'Billy Idol', foundAt: 'Oeste da ponte na Mountain Relay Base', requiresMission: 3, youtubeId: null, youtubeQuery: 'Billy Idol Rebel Yell official video' },
    { id: 'tape_friday', title: "Friday I'm In Love", artist: 'The Cure', foundAt: 'Casa grande do Lufwa Valley', requiresMission: 4, youtubeId: null, youtubeQuery: "The Cure Friday I'm In Love official video" },
    { id: 'tape_loveweartus', title: 'Love Will Tear Us Apart', artist: 'Joy Division', foundAt: 'Afghanistan Central Base Camp', requiresMission: 2, youtubeId: null, youtubeQuery: 'Joy Division Love Will Tear Us Apart official video' },
    { id: 'tape_science', title: 'She Blinded Me With Science', artist: 'Thomas Dolby', foundAt: 'Posto de guarda nordeste de Wialo Village', requiresMission: 5, youtubeId: null, youtubeQuery: 'Thomas Dolby She Blinded Me With Science official video' },
    { id: 'tape_onlytime', title: 'Only Time Will Tell', artist: 'Asia', foundAt: 'Eastern Communications Post', requiresMission: 3, youtubeId: null, youtubeQuery: 'Asia Only Time Will Tell official video' },
    { id: 'tape_mansold', title: 'The Man Who Sold the World', artist: 'Midge Ure', foundAt: 'Concedida ao concluir o Prólogo', requiresMission: null, youtubeId: null, youtubeQuery: 'Midge Ure The Man Who Sold the World' },
    { id: 'tape_quietlife', title: 'Quiet Life', artist: 'Japan', foundAt: 'Prédio sudeste do Mfinda Oilfield', requiresMission: 6, youtubeId: null, youtubeQuery: 'Japan Quiet Life official video' },
  ],

  mapRegions: {
    afghanistan: {
      label: 'Afeganistão',
      locations: [
        { name: 'Afghanistan Central Base Camp', x: 50, y: 46, desc: 'Base central de operações inimigas na região.' },
        { name: 'Lamar Khaate Palace', x: 27, y: 62, desc: 'Antigo complexo de um senhor da guerra local.' },
        { name: 'Wakh Sind Barracks', x: 68, y: 30, desc: 'Alojamento fortificado usado por tropas soviéticas.' },
        { name: 'Da Ghwandai Khar', x: 40, y: 20, desc: 'Vila fortificada nas montanhas do norte.' },
        { name: 'Yakho Oboo Supply Outpost', x: 74, y: 58, desc: 'Posto de suprimentos na fronteira leste.' },
        { name: 'Mountain Relay Base', x: 18, y: 34, desc: 'Estação de retransmissão de sinal no alto da serra.' },
        { name: 'Eastern Communications Post', x: 85, y: 40, desc: 'Posto avançado de comunicações inimigo.' },
      ],
    },
    africa: {
      label: 'África Central',
      locations: [
        { name: 'Munoko ya Nioka Station', x: 30, y: 26, desc: 'Estação ferroviária usada como entreposto militar.' },
        { name: 'Nova Braga Airport', x: 60, y: 22, desc: 'Antigo aeroporto colonial reaproveitado por forças locais.' },
        { name: 'Lufwa Valley', x: 45, y: 50, desc: 'Vale agrícola disputado por facções regionais.' },
        { name: 'Bampeve Plantation', x: 66, y: 62, desc: 'Plantação usada como fachada para operações irregulares.' },
        { name: 'Mfinda Oilfield', x: 80, y: 48, desc: 'Campo petrolífero fortemente vigiado.' },
        { name: 'Ditadi Abandoned Village', x: 22, y: 58, desc: 'Vila abandonada após conflitos anteriores na região.' },
        { name: 'Smasei Fort', x: 52, y: 74, desc: 'Antiga fortificação usada como ponto de controle.' },
      ],
    },
  },
};

/* ---------------------------------------------------------------
   QUIZ BANK — 3 perguntas táticas por missão (briefing de campo)
   --------------------------------------------------------------- */
const QUIZ_BANK = [
  [ // 0 Awakening
    { q: 'Qual padrão de camuflagem é indicado para ambientes desérticos?', options: ['Woodland', 'Digital Desert', 'Arctic White', 'Urban Grey'], correct: 1 },
    { q: "No rádio tático, o que significa 'Roger'?", options: ['Repetir', 'Mensagem recebida', 'Negativo', 'Aguardar'], correct: 1 },
    { q: 'Qual faixa de frequência é comum em rádios táticos de esquadrão?', options: ['VHF/UHF', 'Apenas AM', 'Apenas ondas curtas', 'Apenas satélite'], correct: 0 },
  ],
  [ // 1 Phantom Limbs
    { q: 'O sistema de extração Fulton usa o quê para recuperar pessoal/carga?', options: ['Guincho de helicóptero', 'Balão e cabo', 'Paraquedas', 'Tirolesa'], correct: 1 },
    { q: 'Qual é o principal propósito da tinta de camuflagem facial?', options: ['Reduzir brilho e quebrar o contorno do rosto', 'Decoração', 'Proteção solar apenas', 'Identificação de equipe'], correct: 0 },
    { q: 'Qual termo se refere a mover-se sem ser detectado?', options: ['Stealth', 'Assault', 'Recon', 'Extraction'], correct: 0 },
  ],
  [ // 2 A Hero's Way
    { q: "No alfabeto fonético da NATO, o que representa 'Alpha'?", options: ['Letra A', 'Número 1', 'Letra B', 'Uma patente'], correct: 0 },
    { q: "O que é um 'rally point' em operações táticas?", options: ['Um ponto de encontro pré-combinado', 'Um sinal de ataque', 'Um tipo de arma', 'Uma frequência de rádio'], correct: 0 },
    { q: 'Qual equipamento ajuda soldados a enxergar em baixa luminosidade?', options: ['Óculos de visão noturna', 'Binóculos', 'Óculos de sol', 'Bússola'], correct: 0 },
  ],
  [ // 3 C2W
    { q: "O que significa a sigla 'OPSEC'?", options: ['Operations Security', 'Operational Sector', 'Open Security', 'Optical Sector'], correct: 0 },
    { q: "Um 'dead drop' é usado para quê?", options: ['Passar itens/informações de forma secreta', 'Zona de pouso', 'Bloqueio de sinal', 'Armazenar armas'], correct: 0 },
    { q: "Qual é o propósito de uma base avançada estilo 'Mother Base'?", options: ['Hub central de logística e pessoal', 'Alvo inimigo', 'Estrutura-isca', 'Apenas treinamento'], correct: 0 },
  ],
  [ // 4 Over The Fence
    { q: 'Qual termo descreve coletar informações sobre posições inimigas antes de uma operação?', options: ['Reconnaissance', 'Extraction', 'Sabotage', 'Fulton'], correct: 0 },
    { q: "Qual faixa de frequência é usada normalmente em rádio tático ('Codec')?", options: ['HF/VHF', 'Apenas satélite', 'Apenas rádio AM', 'Infravermelho'], correct: 0 },
    { q: "Uma 'formação diamante' no deslocamento de um esquadrão serve para quê?", options: ['Segurança em todas as direções durante o movimento', 'Apenas velocidade', 'Camuflagem furtiva', 'Amplificar sinal'], correct: 0 },
  ],
  [ // 5 Angel With Broken Wings
    { q: "O que significa CQC no treinamento tático?", options: ['Close Quarters Combat', 'Command Quality Control', 'Combat Quiet Communication', 'Coded Quick Call'], correct: 0 },
    { q: 'Por que operativos usam codinomes em vez de nomes reais?', options: ['Para proteger identidade/segurança operacional', 'Apenas tradição', 'Limitação de rádio', 'Exibir patente'], correct: 0 },
    { q: 'Qual a principal vantagem de um supressor em uma arma?', options: ['Reduz a assinatura sonora', 'Aumenta o alcance', 'Aumenta o dano', 'Melhora só a precisão'], correct: 0 },
  ],
  [ // 6 Code Talker
    { q: 'Em um salto HALO, o que significa a sigla?', options: ['High Altitude Low Opening', 'Heavy Aerial Landing Operation', 'Hidden Air Landing Objective', 'High Air Low Observation'], correct: 0 },
    { q: "Para que serve uma 'safe house'?", options: ['Um local seguro para se esconder ou se reagrupar', 'Um depósito de armas', 'Um alvo-isca', 'Uma base inimiga'], correct: 0 },
    { q: "O que melhor descreve uma 'extraction' em missões táticas?", options: ['Remover pessoal/ativos de uma área hostil', 'Plantar um dispositivo', 'Apenas coletar inteligência', 'Armar uma emboscada'], correct: 0 },
  ],
  [ // 7 Skull Face
    { q: "O que significa 'sitrep'?", options: ['Situation report', 'Site repair', 'Silent repeater', 'Signal reply'], correct: 0 },
    { q: 'Qual é o propósito de uma granada de fumaça?', options: ['Obstruir a visão/oferecer cobertura', 'Causar explosões', 'Iluminar a área', 'Sinalizar apenas por som'], correct: 0 },
    { q: "O que descreve um método de 'inserção' encoberta pela água?", options: ['Inserção anfíbia/mergulho', 'Lançamento aéreo', 'Comboio', 'Túnel'], correct: 0 },
  ],
  [ // 8 Shining Lights, Even In Death
    { q: "O que significa 'AWOL'?", options: ['Absent Without Leave', 'Attack Without Location', 'Armed Weapon On Location', 'Alert Warning Operations List'], correct: 0 },
    { q: "Uma unidade 'fantasma' em operações especiais geralmente se refere a quê?", options: ['Um operativo altamente furtivo e difícil de detectar', 'Uma unidade desativada', 'Um drone apenas', 'Um repetidor de rádio'], correct: 0 },
    { q: 'Qual é o principal objetivo de táticas de guerra psicológica?', options: ['Influenciar o moral e as decisões do inimigo', 'Apenas destruição física', 'Apenas negar recursos', 'Apenas expandir território'], correct: 0 },
  ],
];

/* ---------------------------------------------------------------
   CODEC — linhas de ambientação exibidas na Home
   --------------------------------------------------------------- */
const CODEC_LINES = [
  'Command: Perímetro limpo. Prossiga no seu ritmo, Boss.',
  'Ops: Nova intel chegou — confira a aba Deploy.',
  'Support: Fique de olho na barra de XP, promoções liberam novas patentes.',
  'Intel: Dizem que uma conquista lendária espera pelos mais preparados.',
  'Medical: Fique atento aí fora. Fadiga mata missões.',
  'R&D: Ainda estamos calibrando equipamentos para os próximos deployments.',
  'Security: Tudo tranquilo no perímetro. Por enquanto.',
  'Command: Cada missão concluída nos aproxima do status operacional total.',
];

/* ---------------------------------------------------------------
   STORAGE — camada de persistência (LocalStorage)
   --------------------------------------------------------------- */
const Storage = {
  loadProfile() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Falha ao carregar perfil:', e);
      return null;
    }
  },
  saveProfile(p) {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(p)); }
    catch (e) { console.error('Falha ao salvar perfil:', e); }
  },
  clearProfile() { localStorage.removeItem(CONFIG.storageKey); },

  loadTheme() {
    try { return localStorage.getItem(CONFIG.themeKey) || 'diamond'; }
    catch (e) { return 'diamond'; }
  },
  saveTheme(theme) {
    try { localStorage.setItem(CONFIG.themeKey, theme); } catch (e) {}
  },

  /* Carrega o ranking já higienizado (ver dedupeRankingBoard). */
  loadRanking() {
    let raw = [];
    try {
      const stored = localStorage.getItem(CONFIG.rankingKey);
      raw = stored ? JSON.parse(stored) : [];
    } catch (e) { raw = []; }
    const cleaned = dedupeRankingBoard(raw);
    if (JSON.stringify(cleaned) !== JSON.stringify(raw)) {
      this.saveRanking(cleaned);
    }
    return cleaned;
  },
  saveRanking(list) {
    try { localStorage.setItem(CONFIG.rankingKey, JSON.stringify(list)); } catch (e) {}
  },
};

/* ---------------------------------------------------------------
   STATE
   --------------------------------------------------------------- */
let profile = null;
let quizState = null;
let activeMapRegion = 'afghanistan';
let clockStarted = false;
const ALL_TAPES = () => [...CONFIG.cassetteTapesScore, ...CONFIG.cassetteTapesLicensed];

function xpNeededForLevel(level) { return level * 100; }
function rankForLevel(level) {
  const found = CONFIG.ranks.find(r => level >= r.min && level <= r.max);
  return found ? found.label : CONFIG.ranks[0].label;
}
function avatarById(id) { return CONFIG.avatars.find(a => a.id === id) || CONFIG.avatars[0]; }
function unitById(id) { return CONFIG.units.find(u => u.id === id) || CONFIG.units[0]; }

/* [CORRIGIDO] Garante compatibilidade com perfis salvos antes deste
   update — agora efetivamente chamada durante a inicialização. */
function normalizeProfile(p) {
  if (!p) return p;
  if (!Array.isArray(p.missionsCleared)) p.missionsCleared = [];
  if (!Array.isArray(p.perfectMissions)) p.perfectMissions = [];
  if (!Array.isArray(p.achievements)) p.achievements = [];
  if (!Array.isArray(p.motherBaseTasks)) p.motherBaseTasks = [];
  if (typeof p.level !== 'number' || p.level < 1) p.level = 1;
  if (typeof p.xp !== 'number' || p.xp < 0) p.xp = 0;
  return p;
}

function avatarDataUri(avatar) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
    <rect width="120" height="120" fill="#0a0e0a"/>
    <circle cx="60" cy="46" r="26" fill="${avatar.color}"/>
    <rect x="20" y="78" width="80" height="42" fill="${avatar.color}"/>
    <text x="60" y="52" font-family="monospace" font-size="20" fill="#0a0e0a" text-anchor="middle" font-weight="bold">${avatar.initials}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

/* ---------------------------------------------------------------
   SCREENS
   --------------------------------------------------------------- */
function showScreen(id) {
  document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active-screen'));
  document.getElementById(id).classList.add('active-screen');
}

/* ---------------------------------------------------------------
   BOOT SEQUENCE
   --------------------------------------------------------------- */
function runBootSequence(onDone) {
  const fill = document.getElementById('bootBarFill');
  const log = document.getElementById('bootLog');
  const lines = [
    '> INICIALIZANDO SO iDROID...',
    '> ESTABELECENDO LINK DE SATÉLITE...',
    '> CARREGANDO BANCO DE DADOS DIAMOND DOGS...',
    '> SISTEMA PRONTO.',
  ];
  let progress = 0;
  let lineIndex = 0;
  log.textContent = '';
  const interval = setInterval(() => {
    progress += 4;
    fill.style.width = Math.min(progress, 100) + '%';
    const shouldShowLine = Math.floor(progress / 25);
    if (shouldShowLine > lineIndex && lineIndex < lines.length) {
      log.textContent += lines[lineIndex] + '\n';
      lineIndex++;
    }
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(onDone, 350);
    }
  }, 45);
}

/* ---------------------------------------------------------------
   WELCOME
   --------------------------------------------------------------- */
function typeWelcomeMessage() {
  const el = document.getElementById('welcomeMessage');
  const text = 'Bem-vindo de volta, Boss.';
  el.textContent = '';
  let i = 0;
  const caret = document.createElement('span');
  caret.className = 'caret';
  caret.textContent = '\u00A0';
  const interval = setInterval(() => {
    el.textContent = text.slice(0, i + 1);
    el.appendChild(caret);
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 55);
}

/* ---------------------------------------------------------------
   CHARACTER CREATION
   --------------------------------------------------------------- */
let selectedUnit = null;
let selectedAvatar = null;

function buildOptionGrids() {
  const unitGrid = document.getElementById('unitGrid');
  unitGrid.innerHTML = CONFIG.units.map(u =>
    `<button type="button" class="opt-btn" data-unit="${u.id}" role="radio" aria-checked="false">${u.label}</button>`
  ).join('');

  const avatarGrid = document.getElementById('avatarGrid');
  avatarGrid.innerHTML = CONFIG.avatars.map(a =>
    `<button type="button" class="opt-btn" data-avatar="${a.id}" role="radio" aria-checked="false">${a.label}</button>`
  ).join('');

  unitGrid.addEventListener('click', e => {
    const btn = e.target.closest('[data-unit]');
    if (!btn) return;
    selectedUnit = btn.dataset.unit;
    unitGrid.querySelectorAll('.opt-btn').forEach(b => {
      b.classList.toggle('selected', b === btn);
      b.setAttribute('aria-checked', b === btn ? 'true' : 'false');
    });
  });

  avatarGrid.addEventListener('click', e => {
    const btn = e.target.closest('[data-avatar]');
    if (!btn) return;
    selectedAvatar = btn.dataset.avatar;
    avatarGrid.querySelectorAll('.opt-btn').forEach(b => {
      b.classList.toggle('selected', b === btn);
      b.setAttribute('aria-checked', b === btn ? 'true' : 'false');
    });
  });
}

function handleCreateSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('soldierName');
  const name = nameInput.value.trim();
  if (!name) { nameInput.focus(); return; }
  if (!selectedUnit) { alert('Selecione uma unidade.'); return; }
  if (!selectedAvatar) { alert('Selecione um avatar.'); return; }

  profile = normalizeProfile({
    name, unit: selectedUnit, avatar: selectedAvatar,
    level: 1, xp: 0,
    missionsCleared: [], perfectMissions: [], achievements: [], motherBaseTasks: [],
  });
  Storage.saveProfile(profile);
  upsertRanking(profile);
  enterDashboard();
}

/* ---------------------------------------------------------------
   RPG SYSTEM
   --------------------------------------------------------------- */
function grantXP(amount, reason) {
  if (!profile) return;
  profile.xp += amount;
  let needed = xpNeededForLevel(profile.level);
  let leveledUp = false;
  while (profile.xp >= needed && profile.level < CONFIG.maxLevel) {
    profile.xp -= needed;
    profile.level++;
    leveledUp = true;
    needed = xpNeededForLevel(profile.level);
  }
  Storage.saveProfile(profile);
  upsertRanking(profile);
  renderSoldierCard();
  showXPToast(`+${amount} XP${reason ? ' — ' + reason : ''}${leveledUp ? ' · SUBIU DE NÍVEL!' : ''}`);
  checkAchievements();
}

const toastQueue = [];
let toastBusy = false;
function showXPToast(message) {
  toastQueue.push(message);
  processToastQueue();
}
function processToastQueue() {
  if (toastBusy || toastQueue.length === 0) return;
  toastBusy = true;
  const toast = document.getElementById('xpToast');
  toast.textContent = toastQueue.shift();
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toastBusy = false; processToastQueue(); }, 320);
  }, 2200);
}

/* ---------------------------------------------------------------
   ACHIEVEMENTS
   --------------------------------------------------------------- */
function unlockAchievement(id) {
  if (!profile) return;
  if (profile.achievements.includes(id)) return;
  profile.achievements.push(id);
  Storage.saveProfile(profile);
  const def = CONFIG.achievements.find(a => a.id === id);
  showXPToast(`CONQUISTA DESBLOQUEADA: ${def ? def.name : id}`);
  renderAchievements();
  renderSoldierCard();
}

function checkAchievements() {
  if (!profile) return;
  const totalMissions = CONFIG.missions.length;
  const totalMBTasks = CONFIG.motherBaseTasks.length;
  if (profile.missionsCleared.length >= 1) unlockAchievement('diamond_dog');
  if (profile.perfectMissions.length >= 1) unlockAchievement('tactical_genius');
  if (profile.missionsCleared.length >= 3) unlockAchievement('fulton_master');
  if (profile.level >= 5) unlockAchievement('mb_commander');
  if (profile.missionsCleared.length >= 6) unlockAchievement('legendary_soldier');
  if (profile.missionsCleared.length >= totalMissions) unlockAchievement('big_boss');
  if (profile.perfectMissions.length >= totalMissions) unlockAchievement('phantom_operative');
  if (totalMBTasks > 0 && profile.motherBaseTasks.length >= totalMBTasks) unlockAchievement('mb_master');
}

/* ---------------------------------------------------------------
   QUIZ
   --------------------------------------------------------------- */
function missionStatusFor(index) {
  if (!profile) return 'locked';
  if (profile.missionsCleared.includes(index)) return 'cleared';
  if (index === 0 || profile.missionsCleared.includes(index - 1)) return 'available';
  return 'locked';
}

function openQuiz(missionIndex) {
  if (!profile) return;
  if (missionStatusFor(missionIndex) === 'locked') return;
  quizState = { missionIndex, current: 0, correctCount: 0, questions: QUIZ_BANK[missionIndex] || [] };
  document.getElementById('quizMissionLabel').textContent = `BRIEFING DE MISSÃO // ${String(missionIndex + 1).padStart(2, '0')}`;
  document.getElementById('quizMissionTitle').textContent = CONFIG.missions[missionIndex];
  document.getElementById('quizBody').style.display = '';
  document.getElementById('quizResult').style.display = 'none';
  document.getElementById('quizOverlay').classList.add('show');
  document.getElementById('quizOverlay').setAttribute('aria-hidden', 'false');
  renderQuizQuestion();
}

function renderQuizQuestion() {
  if (!quizState) return;
  const q = quizState.questions[quizState.current];
  const total = quizState.questions.length;
  document.getElementById('quizProgress').textContent = `Pergunta ${quizState.current + 1} / ${total}`;
  document.getElementById('quizQuestionText').textContent = q.q;
  const optionsEl = document.getElementById('quizOptions');
  optionsEl.innerHTML = q.options.map((opt, i) =>
    `<button type="button" class="quiz-opt-btn" data-index="${i}">${opt}</button>`
  ).join('');
  optionsEl.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => handleQuizAnswer(parseInt(btn.dataset.index, 10)));
  });
}

function handleQuizAnswer(selectedIndex) {
  if (!quizState) return;
  const q = quizState.questions[quizState.current];
  const optionsEl = document.getElementById('quizOptions');
  const buttons = optionsEl.querySelectorAll('.quiz-opt-btn');
  buttons.forEach(b => b.setAttribute('disabled', 'true'));
  buttons[selectedIndex].classList.add(selectedIndex === q.correct ? 'correct' : 'incorrect');
  if (selectedIndex !== q.correct) buttons[q.correct].classList.add('correct');
  if (selectedIndex === q.correct) quizState.correctCount++;

  setTimeout(() => {
    quizState.current++;
    if (quizState.current < quizState.questions.length) renderQuizQuestion();
    else finishQuiz();
  }, 700);
}

function finishQuiz() {
  if (!quizState || !profile) return;
  const { missionIndex, correctCount, questions } = quizState;
  const total = questions.length;
  const passed = correctCount >= Math.ceil(total / 2);
  const perfect = correctCount === total;
  const alreadyCleared = profile.missionsCleared.includes(missionIndex);
  let xpGain = 0;

  if (passed) {
    if (!alreadyCleared) {
      profile.missionsCleared.push(missionIndex);
      xpGain = 50 + correctCount * 10;
    } else {
      xpGain = correctCount * 5;
    }
    if (perfect && !profile.perfectMissions.includes(missionIndex)) {
      profile.perfectMissions.push(missionIndex);
    }
  }

  Storage.saveProfile(profile);
  upsertRanking(profile);

  const titleEl = document.getElementById('quizResultTitle');
  const detailEl = document.getElementById('quizResultDetail');
  document.getElementById('quizBody').style.display = 'none';
  document.getElementById('quizResult').style.display = '';

  if (passed) {
    titleEl.textContent = perfect ? 'MISSÃO S-RANK' : 'MISSÃO CONCLUÍDA';
    titleEl.className = 'quiz-result-title pass';
    detailEl.textContent = `${correctCount} / ${total} respostas corretas.${xpGain ? ` +${xpGain} XP.` : ''}`;
  } else {
    titleEl.textContent = 'MISSÃO FALHOU';
    titleEl.className = 'quiz-result-title fail';
    detailEl.textContent = `${correctCount} / ${total} respostas corretas. Reforce o briefing e tente novamente.`;
  }

  if (xpGain > 0) {
    grantXP(xpGain, passed && !alreadyCleared ? `${CONFIG.missions[missionIndex]} concluída` : 'Bônus de repetição');
  } else {
    checkAchievements();
  }

  renderMissionList();
  renderAchievements();
  renderIntelFiles();
  renderCassetteTapes();
  renderTapeOfDay();
}

function closeQuiz() {
  quizState = null;
  document.getElementById('quizOverlay').classList.remove('show');
  document.getElementById('quizOverlay').setAttribute('aria-hidden', 'true');
}

function setupQuizModal() {
  document.getElementById('btnQuizAbort').addEventListener('click', closeQuiz);
  document.getElementById('btnQuizClose').addEventListener('click', closeQuiz);
  document.getElementById('quizOverlay').addEventListener('click', e => {
    if (e.target.id === 'quizOverlay') closeQuiz();
  });
}

function setupMissionList() {
  document.getElementById('missionList').addEventListener('click', e => {
    const row = e.target.closest('.mission-row');
    if (!row || row.classList.contains('locked')) return;
    openQuiz(parseInt(row.dataset.mission, 10));
  });
}

/* ---------------------------------------------------------------
   CODEC
   --------------------------------------------------------------- */
function setRandomCodecLine() {
  const el = document.getElementById('codecLine');
  if (!el) return;
  el.textContent = CODEC_LINES[Math.floor(Math.random() * CODEC_LINES.length)];
}

/* ---------------------------------------------------------------
   DASHBOARD — soldado / painéis
   --------------------------------------------------------------- */
function renderSoldierCard() {
  if (!profile) return;
  const avatar = avatarById(profile.avatar);
  const unit = unitById(profile.unit);
  const atMaxLevel = profile.level >= CONFIG.maxLevel;
  const needed = xpNeededForLevel(profile.level);
  const pct = atMaxLevel ? 100 : Math.min(100, Math.round((profile.xp / needed) * 100));

  document.getElementById('soldierAvatarImg').src = avatarDataUri(avatar);
  document.getElementById('soldierAvatarImg').alt = avatar.label;
  document.getElementById('soldierNameDisplay').textContent = profile.name;
  document.getElementById('soldierUnitDisplay').textContent = unit.label;
  document.getElementById('soldierRankDisplay').textContent = rankForLevel(profile.level);
  document.getElementById('soldierLevelDisplay').textContent = 'LV ' + profile.level;
  document.getElementById('xpBarFill').style.width = pct + '%';
  document.getElementById('xpValueDisplay').textContent = atMaxLevel
    ? `NÍVEL MÁXIMO — ${totalXPEarned(profile)} XP TOTAL`
    : `${profile.xp} / ${needed} XP`;
  document.getElementById('homeSoldierName').textContent = profile.name;
  document.getElementById('statMissions').textContent = `${profile.missionsCleared.length} / ${CONFIG.missions.length}`;
  document.getElementById('statXP').textContent = totalXPEarned(profile);
  document.getElementById('statAch').textContent = `${profile.achievements.length} / ${CONFIG.achievements.length}`;
}

function totalXPEarned(p) {
  let total = p.xp;
  for (let lv = 1; lv < p.level; lv++) total += xpNeededForLevel(lv);
  return total;
}

function renderMissionList() {
  const list = document.getElementById('missionList');
  list.innerHTML = CONFIG.missions.map((name, i) => {
    const status = missionStatusFor(i);
    const cleared = status === 'cleared';
    const locked = status === 'locked';
    const perfect = profile && profile.perfectMissions.includes(i);
    let statusText = 'DISPONÍVEL';
    let statusClass = '';
    if (locked) { statusText = 'BLOQUEADA'; }
    else if (cleared) { statusText = perfect ? 'S-RANK' : 'CONCLUÍDA'; statusClass = perfect ? 'done perfect' : 'done'; }
    return `<div class="mission-row ${locked ? 'locked' : ''}" data-mission="${i}" title="${locked ? 'Complete a missão anterior primeiro' : 'Clique para iniciar o briefing'}">
      <span class="mission-name"><span class="mission-num">${String(i + 1).padStart(2, '0')}</span>${name}</span>
      <span class="mission-status ${statusClass}">${statusText}</span>
    </div>`;
  }).join('');
}

function renderAchievements() {
  const grid = document.getElementById('achievementGrid');
  if (!profile) return;
  grid.innerHTML = CONFIG.achievements.map(a => {
    const unlocked = profile.achievements.includes(a.id);
    return `<div class="achievement-box ${unlocked ? 'unlocked' : ''}">
      <span class="achievement-icon">${a.icon}</span>
      <span class="achievement-name">${a.name}</span>
    </div>`;
  }).join('');
}

/* ---------------------------------------------------------------
   MOTHER BASE
   --------------------------------------------------------------- */
function renderMotherBaseTasks() {
  const list = document.getElementById('motherBaseTaskList');
  if (!list || !profile) return;
  list.innerHTML = CONFIG.motherBaseTasks.map(t => {
    const done = profile.motherBaseTasks.includes(t.id);
    return `<div class="mb-task-row ${done ? 'done' : ''}">
      <div class="mb-task-info">
        <p class="mb-task-name">${t.name}</p>
        <p class="mb-task-desc">${t.desc}</p>
      </div>
      <button type="button" class="btn-tactical mb-task-btn" data-task-btn="${t.id}" ${done ? 'disabled' : ''}>
        ${done ? '✓ CONCLUÍDA' : `+${t.xp} XP`}
      </button>
    </div>`;
  }).join('');
}

function completeMotherBaseTask(taskId) {
  if (!profile) return;
  if (profile.motherBaseTasks.includes(taskId)) return;
  const task = CONFIG.motherBaseTasks.find(t => t.id === taskId);
  if (!task) return;
  profile.motherBaseTasks.push(taskId);
  Storage.saveProfile(profile);
  renderMotherBaseTasks();
  grantXP(task.xp, `${task.name} concluída`);
}

function setupMotherBaseTasks() {
  const list = document.getElementById('motherBaseTaskList');
  if (!list) return;
  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-task-btn]');
    if (!btn || btn.hasAttribute('disabled')) return;
    completeMotherBaseTask(btn.dataset.taskBtn);
  });
}

/* ---------------------------------------------------------------
   INTELIGÊNCIA
   --------------------------------------------------------------- */
function isIntelUnlocked(file) {
  if (file.requiresMission === null || file.requiresMission === undefined) return true;
  return !!profile && profile.missionsCleared.includes(file.requiresMission);
}

function renderIntelFiles() {
  const list = document.getElementById('intelList');
  if (!list) return;
  list.innerHTML = CONFIG.intelFiles.map(file => {
    const unlocked = isIntelUnlocked(file);
    return `<div class="intel-item ${unlocked ? 'unlocked' : 'locked'}" data-intel="${file.id}">
      <button type="button" class="intel-item-header" data-intel-toggle="${file.id}">
        <span>${file.title}</span>
        <span class="intel-item-status">${unlocked ? 'DESCLASSIFICADO' : 'CLASSIFICADO'}</span>
      </button>
      <div class="intel-item-body">${unlocked ? file.body : 'Conclua mais operações de campo para desclassificar este arquivo.'}</div>
    </div>`;
  }).join('');
}

function setupIntel() {
  const list = document.getElementById('intelList');
  if (!list) return;
  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-intel-toggle]');
    if (!btn) return;
    const item = btn.closest('.intel-item');
    if (!item || item.classList.contains('locked')) return;
    const wasOpen = item.classList.contains('open');
    list.querySelectorAll('.intel-item.open').forEach(el => el.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
}

/* ---------------------------------------------------------------
   FITAS CASSETE
   --------------------------------------------------------------- */
function isCassetteUnlocked(tape) {
  if (tape.requiresMission === null || tape.requiresMission === undefined) return true;
  return !!profile && profile.missionsCleared.includes(tape.requiresMission);
}

function cassetteIconSvg() {
  return `<svg viewBox="0 0 34 22" xmlns="http://www.w3.org/2000/svg">
    <rect class="cassette-body" x="1" y="1" width="32" height="20" rx="1.5"/>
    <circle class="cassette-reel" cx="11" cy="11" r="4"/>
    <circle class="cassette-reel" cx="23" cy="11" r="4"/>
  </svg>`;
}

function renderCassetteGroup(containerId, tapes) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = tapes.map(tape => {
    const unlocked = isCassetteUnlocked(tape);
    const playable = unlocked && (tape.youtubeId || tape.youtubeQuery || tape.title);
    return `<div class="cassette-item ${unlocked ? 'unlocked' : 'locked'} ${tape.dramatic ? 'dramatic' : ''}" data-cassette="${tape.id}">
      <span class="cassette-icon">${cassetteIconSvg()}</span>
      <div class="cassette-info">
        <p class="cassette-title">${tape.title}${tape.dramatic ? '<span class="dramatic-tag">MAIS DRAMÁTICA</span>' : ''}</p>
        <p class="cassette-artist">${tape.artist}</p>
        <p class="cassette-found">${unlocked ? tape.foundAt : 'Localização ainda não revelada'}</p>
      </div>
      <span class="cassette-waveform" hidden><span></span><span></span><span></span><span></span><span></span></span>
      <span class="cassette-badge">${unlocked ? (playable ? '▶ TOCAR' : 'NO ARQUIVO') : 'BLOQUEADA'}</span>
    </div>`;
  }).join('');
}

function renderCassetteTapes() {
  renderCassetteGroup('cassetteListScore', CONFIG.cassetteTapesScore);
  renderCassetteGroup('cassetteListLicensed', CONFIG.cassetteTapesLicensed);
}

function setupCassettes() {
  document.querySelectorAll('#panel-cassettes .cassette-list').forEach(list => {
    list.addEventListener('click', e => {
      const item = e.target.closest('.cassette-item');
      if (!item || item.classList.contains('locked')) return;
      const tape = ALL_TAPES().find(t => t.id === item.dataset.cassette);
      if (!tape) return;

      document.querySelectorAll('.cassette-item.playing').forEach(el => {
        el.classList.remove('playing');
        const wf = el.querySelector('.cassette-waveform');
        if (wf) wf.setAttribute('hidden', '');
      });
      item.classList.add('playing');
      const wf = item.querySelector('.cassette-waveform');
      if (wf) wf.removeAttribute('hidden');

      openYoutubePlayer(tape);
    });
  });
}

function setupCassetteFilter() {
  const input = document.getElementById('cassetteFilter');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    document.querySelectorAll('#panel-cassettes .cassette-item').forEach(item => {
      const matches = item.textContent.toLowerCase().includes(q);
      item.style.display = matches ? '' : 'none';
    });
    document.querySelectorAll('#panel-cassettes .cassette-subhead').forEach(heading => {
      const list = heading.nextElementSibling;
      if (!list) return;
      const anyVisible = Array.from(list.children).some(c => c.style.display !== 'none');
      heading.style.display = anyVisible ? '' : 'none';
    });
  });
}

/* Fita em destaque na Home — muda conforme o dia, só entre as
   desbloqueadas no momento. */
function renderTapeOfDay() {
  const el = document.getElementById('tapeOfDay');
  if (!el) return;
  const unlocked = ALL_TAPES().filter(isCassetteUnlocked);
  if (!unlocked.length) { el.innerHTML = '<p class="tod-label">Nenhuma fita desbloqueada ainda — avance nas missões.</p>'; return; }
  const dayIndex = new Date().getDate() % unlocked.length;
  const tape = unlocked[dayIndex];
  el.innerHTML = `<p class="tod-label">FITA EM DESTAQUE HOJE${tape.dramatic ? ' · MOMENTO MARCANTE' : ''}</p>
    <p class="tod-title">${tape.title}</p>
    <p class="tod-artist">${tape.artist}</p>
    <button type="button" class="btn-tactical" id="tapeOfDayBtn"><span class="btn-tactical-icon">▶</span>OUVIR</button>`;
  document.getElementById('tapeOfDayBtn').addEventListener('click', () => openYoutubePlayer(tape));
}

/* ---------------------------------------------------------------
   PLAYER DE YOUTUBE — modal de reprodução das fitas cassete
   Se a fita tiver "youtubeId" preenchido no CONFIG, o vídeo é
   embutido diretamente. Caso contrário, mostramos um player
   indisponível + botão que abre a busca correta no YouTube em uma
   nova aba (sempre funcional, mesmo sem o ID exato do vídeo).
   --------------------------------------------------------------- */
function openYoutubePlayer(tape) {
  document.getElementById('ytTitle').textContent = tape.title;
  document.getElementById('ytArtist').textContent = tape.artist;

  const wrap = document.getElementById('ytPlayerWrap');
  const query = tape.youtubeQuery || `${tape.title} ${tape.artist}`;
  const searchUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);

  if (tape.youtubeId) {
    wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${tape.youtubeId}?autoplay=1&rel=0"
      title="${tape.title}" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen></iframe>`;
  } else {
    wrap.innerHTML = `<div class="yt-noembed">Vídeo direto ainda não configurado para esta fita.<br>
      Toque em "ABRIR NO YOUTUBE" abaixo para ouvir.</div>`;
  }

  const link = document.getElementById('ytSearchLink');
  link.href = searchUrl;

  document.getElementById('ytOverlay').classList.add('show');
  document.getElementById('ytOverlay').setAttribute('aria-hidden', 'false');
}

function closeYoutubePlayer() {
  document.getElementById('ytPlayerWrap').innerHTML = '';
  document.getElementById('ytOverlay').classList.remove('show');
  document.getElementById('ytOverlay').setAttribute('aria-hidden', 'true');
  document.querySelectorAll('.cassette-item.playing').forEach(el => {
    el.classList.remove('playing');
    const wf = el.querySelector('.cassette-waveform');
    if (wf) wf.setAttribute('hidden', '');
  });
}

function setupYoutubeModal() {
  document.getElementById('btnYtClose').addEventListener('click', closeYoutubePlayer);
  document.getElementById('ytOverlay').addEventListener('click', e => {
    if (e.target.id === 'ytOverlay') closeYoutubePlayer();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (document.getElementById('ytOverlay').classList.contains('show')) closeYoutubePlayer();
      if (document.getElementById('quizOverlay').classList.contains('show')) closeQuiz();
    }
  });
}

/* ---------------------------------------------------------------
   MAPA
   --------------------------------------------------------------- */
function buildMapSvg(region) {
  const data = CONFIG.mapRegions[region];
  const markers = data.locations.map(loc => `
    <g>
      <circle class="map-marker-ring" cx="${loc.x}" cy="${loc.y}" r="3.2"><title>${loc.name}</title></circle>
      <circle class="map-marker-dot" cx="${loc.x}" cy="${loc.y}" r="1.1"><title>${loc.name}</title></circle>
      <text class="map-marker-label" x="${loc.x + 2.2}" y="${loc.y + 1}">${loc.name}</text>
    </g>`).join('');

  const terrain = region === 'afghanistan'
    ? `<path d="M5,55 C10,30 30,10 55,12 C75,14 90,25 92,45 C94,65 78,80 55,82 C30,84 8,78 5,55 Z" fill="var(--dd-green-dim)" opacity="0.28"/>
       <path d="M15,50 C20,35 38,22 55,24 C70,26 80,35 82,48 C84,62 70,72 52,73 C34,74 12,66 15,50 Z" fill="none" stroke="var(--dd-green-dim)" stroke-width="0.4"/>`
    : `<path d="M8,20 C25,8 55,8 72,18 C90,28 95,48 85,65 C75,82 50,90 30,80 C10,70 3,45 8,20 Z" fill="var(--dd-green-dim)" opacity="0.28"/>
       <path d="M18,25 C32,16 55,15 68,24 C82,33 85,50 76,62 C67,74 45,80 30,72 C15,64 10,42 18,25 Z" fill="none" stroke="var(--dd-green-dim)" stroke-width="0.4"/>`;

  return `<svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="100" height="90" fill="transparent"/>
    <g opacity="0.5">
      ${Array.from({ length: 9 }).map((_, i) => `<line x1="${i * 11}" y1="0" x2="${i * 11}" y2="90" stroke="var(--dd-border)" stroke-width="0.2"/>`).join('')}
      ${Array.from({ length: 8 }).map((_, i) => `<line x1="0" y1="${i * 11.5}" x2="100" y2="${i * 11.5}" stroke="var(--dd-border)" stroke-width="0.2"/>`).join('')}
    </g>
    ${terrain}
    ${markers}
  </svg>`;
}

function renderMap(region) {
  activeMapRegion = region;
  const data = CONFIG.mapRegions[region];
  document.getElementById('mapStage').innerHTML = buildMapSvg(region);
  document.getElementById('mapRegionCaption').textContent = `Região selecionada: ${data.label}`;
  document.getElementById('mapLegend').innerHTML = data.locations.map(loc =>
    `<div class="map-legend-item">
      <p class="map-legend-name">${loc.name}</p>
      <p class="map-legend-desc">${loc.desc}</p>
    </div>`
  ).join('');
  document.querySelectorAll('.map-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.region === region);
  });
}

function setupMapTabs() {
  const tabs = document.getElementById('mapTabs');
  if (!tabs) return;
  tabs.addEventListener('click', e => {
    const btn = e.target.closest('.map-tab-btn');
    if (!btn) return;
    renderMap(btn.dataset.region);
  });
}

/* ---------------------------------------------------------------
   NAV
   --------------------------------------------------------------- */
function setupNav() {
  const nav = document.getElementById('idroidNav');
  nav.addEventListener('click', e => {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;
    nav.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active-panel'));
    document.getElementById(btn.dataset.target).classList.add('active-panel');
    if (btn.dataset.target === 'panel-home') { setRandomCodecLine(); renderTapeOfDay(); }
  });
}

/* ---------------------------------------------------------------
   RANKING — placar local (top 10 exibidos, até 50 guardados)
   --------------------------------------------------------------- */
function snapshotForRanking(p) {
  return {
    name: p.name,
    unitId: p.unit,
    level: p.level,
    rank: rankForLevel(p.level),
    xp: totalXPEarned(p),
  };
}

function rankingEntryUnitId(entry) {
  if (entry.unitId) return entry.unitId;
  if (entry.unit) {
    const match = CONFIG.units.find(u => u.label === entry.unit);
    if (match) return match.id;
  }
  return null;
}

/* Chave canônica usada para agrupar/deduplicar entradas do ranking:
   nome normalizado (trim + minúsculas) + unidade resolvida (ou
   string vazia quando não é possível resolver). */
function rankingEntryKey(entry) {
  const name = (entry.name || '').trim().toLowerCase();
  const unitId = rankingEntryUnitId(entry) || '';
  return name + '::' + unitId;
}

function dedupeRankingBoard(list) {
  if (!Array.isArray(list)) return [];
  const byKey = new Map();
  list.forEach(entry => {
    if (!entry || !entry.name) return;
    const key = rankingEntryKey(entry);
    const existing = byKey.get(key);
    if (!existing || (entry.xp || 0) > (existing.xp || 0)) byKey.set(key, entry);
  });
  return Array.from(byKey.values())
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 50);
}

function upsertRanking(p) {
  const list = Storage.loadRanking();
  const snap = snapshotForRanking(p);
  const key = rankingEntryKey(snap);
  const idx = list.findIndex(e => rankingEntryKey(e) === key);
  if (idx >= 0) list[idx] = snap; else list.push(snap);
  const cleaned = dedupeRankingBoard(list);
  Storage.saveRanking(cleaned);
  renderRanking();
}

function renderRanking() {
  const tbody = document.getElementById('rankingBody');
  if (!tbody) return;
  const list = Storage.loadRanking();
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="locked-msg">Nenhum operativo registrado ainda.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.slice(0, 10).map((entry, i) => {
    const unit = unitById(rankingEntryUnitId(entry));
    return `<tr>
      <td>${i + 1}</td>
      <td>${entry.name}</td>
      <td>${unit.label}</td>
      <td>${entry.level}</td>
      <td>${entry.rank}</td>
      <td>${entry.xp}</td>
    </tr>`;
  }).join('');
}

/* ---------------------------------------------------------------
   OPTIONS — tema e reset de progresso
   --------------------------------------------------------------- */
function applyTheme(theme) {
  if (theme === 'night') document.documentElement.setAttribute('data-theme', 'night');
  else document.documentElement.removeAttribute('data-theme');
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
}

function setupOptions() {
  const toggle = document.getElementById('themeToggle');
  toggle.addEventListener('click', e => {
    const btn = e.target.closest('.theme-btn');
    if (!btn) return;
    applyTheme(btn.dataset.theme);
    Storage.saveTheme(btn.dataset.theme);
  });

  document.getElementById('btnResetProgress').addEventListener('click', () => {
    const ok = confirm('Tem certeza que deseja reiniciar todo o progresso? Esta ação não pode ser desfeita.');
    if (!ok) return;
    Storage.clearProfile();
    location.reload();
  });
}

/* ---------------------------------------------------------------
   CLOCK
   --------------------------------------------------------------- */
function updateClock() {
  const el = document.getElementById('clockDisplay');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString('pt-BR', { hour12: false });
}
function setupClock() {
  if (clockStarted) return;
  clockStarted = true;
  updateClock();
  setInterval(updateClock, 1000);
}

/* ---------------------------------------------------------------
   DASHBOARD ENTRY
   --------------------------------------------------------------- */
function enterDashboard() {
  showScreen('screen-dashboard');
  renderSoldierCard();
  renderMissionList();
  renderMotherBaseTasks();
  renderIntelFiles();
  renderCassetteTapes();
  renderTapeOfDay();
  renderMap(activeMapRegion);
  renderAchievements();
  renderRanking();
  setRandomCodecLine();
  setupClock();
}

/* ---------------------------------------------------------------
   INIT
   --------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  profile = normalizeProfile(Storage.loadProfile());
  applyTheme(Storage.loadTheme());

  buildOptionGrids();
  document.getElementById('formCreateSoldier').addEventListener('submit', handleCreateSubmit);

  setupQuizModal();
  setupMissionList();
  setupMotherBaseTasks();
  setupIntel();
  setupCassettes();
  setupCassetteFilter();
  setupYoutubeModal();
  setupMapTabs();
  setupNav();
  setupOptions();

  document.getElementById('btnDeploy').addEventListener('click', () => {
    if (profile) enterDashboard();
    else showScreen('screen-create');
  });

  runBootSequence(() => {
    showScreen('screen-welcome');
    typeWelcomeMessage();
  });
});
