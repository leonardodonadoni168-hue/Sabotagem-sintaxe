// Controlador de Interface (UI) Avançado do SyntaxError
// Coordena renderização de múltiplos tracks, habilidades ativas de papéis e relatórios pedagógicos.

let currentTimeline = [];
let currentStepIdx = 0;
let simInterval = null;
let selectedHandCardIdx = null;

// Modos Especiais de Habilidades
let activeSkillMode = null; // null, "REFATORAR", "INSPECIONAR", "CORROMPER_1", "CORROMPER_2", "INJETAR"
let skillTargetId1 = null; // Armazena primeiro alvo do swap da IA Corrompida

// Elementos do DOM
const elements = {
  headerStats: document.getElementById("header-stats"),
  infoRound: document.getElementById("info-round"),
  scoreProg: document.getElementById("score-prog"),
  scoreSab: document.getElementById("score-sab"),
  
  // Telas
  screenLobby: document.getElementById("screen-lobby"),
  screenRoleReveal: document.getElementById("screen-role-reveal"),
  screenPlaying: document.getElementById("screen-playing"),
  screenExecution: document.getElementById("screen-execution"),
  screenDiscussion: document.getElementById("screen-discussion"),
  screenGameOver: document.getElementById("screen-game-over"),
  
  // Lobby
  playerInputs: document.getElementById("player-inputs"),
  btnAddPlayer: document.getElementById("btn-add-player"),
  btnStartGame: document.getElementById("btn-start-game"),
  
  // Cargo Reveal
  roleRevealButtons: document.getElementById("role-reveal-buttons"),
  btnBeginProgramming: document.getElementById("btn-begin-programming"),
  
  // Modal de Privacidade de Cargo
  roleModal: document.getElementById("role-modal"),
  roleModalPrompt: document.getElementById("role-modal-prompt"),
  btnModalReveal: document.getElementById("btn-modal-reveal"),
  modalRoleContent: document.getElementById("modal-role-content"),
  modalRoleBox: document.getElementById("modal-role-box"),
  modalRoleTitle: document.getElementById("modal-role-title"),
  modalRoleDesc: document.getElementById("modal-role-desc"),
  btnModalClose: document.getElementById("btn-modal-close"),
  
  // Jogo / Programação
  currentLevelName: document.getElementById("current-level-name"),
  currentLevelDesc: document.getElementById("current-level-desc"),
  playingMiniMap: document.getElementById("playing-mini-map"),
  playingQueueContainer: document.getElementById("playing-queue-container"),
  playingFuncContainer: document.getElementById("playing-func-container"),
  queueSize: document.getElementById("queue-size"),
  queueMax: document.getElementById("queue-max"),
  
  turnPrivacyScreen: document.getElementById("turn-privacy-screen"),
  privacyPlayerName: document.getElementById("privacy-player-name"),
  btnRevealMyTurn: document.getElementById("btn-reveal-my-turn"),
  
  playerHandInterface: document.getElementById("player-hand-interface"),
  playerTurnPanel: document.getElementById("player-turn-panel"),
  activePlayerName: document.getElementById("active-player-name"),
  playerRoleBadge: document.getElementById("player-role-badge"),
  btnUseClassSkill: document.getElementById("btn-use-class-skill"),
  playerHandContainer: document.getElementById("player-hand-container"),
  
  btnPlayVisible: document.getElementById("btn-play-visible"),
  btnPlayFunc: document.getElementById("btn-play-func"),
  btnPlayHidden: document.getElementById("btn-play-hidden"),
  btnDiscard: document.getElementById("btn-discard"),
  btnTriggerCompile: document.getElementById("btn-trigger-compile"),
  
  // Execução / Depurador
  execLevelName: document.getElementById("exec-level-name"),
  execOutcomeBadge: document.getElementById("exec-outcome-badge"),
  boardGrid: document.getElementById("board-grid"),
  execQueueContainer: document.getElementById("exec-queue-container"),
  execFuncContainer: document.getElementById("exec-func-container"),
  btnDebugPrev: document.getElementById("btn-debug-prev"),
  btnDebugPlay: document.getElementById("btn-debug-play"),
  btnDebugStep: document.getElementById("btn-debug-step"),
  debugSpeed: document.getElementById("debug-speed"),
  terminalBody: document.getElementById("terminal-body"),
  btnFinishExecution: document.getElementById("btn-finish-execution"),
  
  // Discussão / Relatório
  discussionOutcomeText: document.getElementById("discussion-outcome-text"),
  revealedQueueList: document.getElementById("revealed-queue-list"),
  pedagogicalReportContent: document.getElementById("pedagogical-report-content"),
  btnNextRound: document.getElementById("btn-next-round"),
  
  // Game Over
  finalWinnerText: document.getElementById("final-winner-text"),
  finalScoreProg: document.getElementById("final-score-prog"),
  finalScoreSab: document.getElementById("final-score-sab"),
  finalPlayersRolesContainer: document.getElementById("final-players-roles-container"),
  btnRestartGame: document.getElementById("btn-restart-game")
};

// --- NAVEGAÇÃO DE TELAS ---

function showScreen(screen) {
  elements.screenLobby.classList.remove("active");
  elements.screenRoleReveal.classList.remove("active");
  elements.screenPlaying.classList.remove("active");
  elements.screenExecution.classList.remove("active");
  elements.screenDiscussion.classList.remove("active");
  elements.screenGameOver.classList.remove("active");
  
  screen.classList.add("active");
  
  if (gameState.phase === "LOBBY" || gameState.phase === "GAME_OVER") {
    elements.headerStats.style.display = "none";
  } else {
    elements.headerStats.style.display = "flex";
    updateHeaderStats();
  }
}

function updateHeaderStats() {
  elements.infoRound.innerText = `Setor: ${gameState.currentRound}/${LEVELS.length}`;
  elements.scoreProg.innerText = `Programadores: ${gameState.scores.programmers}`;
  elements.scoreSab.innerText = `Sabotadores: ${gameState.scores.saboteurs}`;
}

// --- TELA 1: LOBBY ---

elements.btnAddPlayer.addEventListener("click", () => {
  const count = elements.playerInputs.children.length;
  if (count >= 6) {
    alert("O limite máximo é de 6 jogadores.");
    return;
  }
  
  const row = document.createElement("div");
  row.className = "player-input-row";
  row.innerHTML = `
    <input type="text" class="player-name-input" value="Jogador ${count + 1}" placeholder="Nome do Jogador ${count + 1}">
    <button class="btn-remove-player" title="Remover jogador">❌</button>
  `;
  
  row.querySelector(".btn-remove-player").addEventListener("click", () => {
    row.remove();
    updateLobbyButtons();
  });
  
  elements.playerInputs.appendChild(row);
  updateLobbyButtons();
});

function updateLobbyButtons() {
  const count = elements.playerInputs.children.length;
  if (count < 3) {
    elements.btnStartGame.classList.add("btn-disabled");
  } else {
    elements.btnStartGame.classList.remove("btn-disabled");
  }
}

elements.btnStartGame.addEventListener("click", () => {
  const inputs = document.querySelectorAll(".player-name-input");
  const names = [];
  inputs.forEach(inp => {
    if (inp.value.trim() !== "") {
      names.push(inp.value.trim());
    }
  });
  
  if (names.length < 3) {
    alert("São necessários ao menos 3 jogadores para a simulação.");
    return;
  }
  
  setupGame(names);
  gameState.functionQueue = []; // Garante inicialização
  renderRoleRevealScreen();
});

// --- TELA 2: REVELAÇÃO DE CARGOS ---

function renderRoleRevealScreen() {
  elements.roleRevealButtons.innerHTML = "";
  gameState.revealedRoles = Array(gameState.players.length).fill(false);
  
  gameState.players.forEach((player, idx) => {
    const btn = document.createElement("div");
    btn.className = "role-reveal-card";
    btn.id = `reveal-card-${idx}`;
    btn.innerHTML = `
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">👤</div>
      <div style="font-weight: bold;">${player.name}</div>
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;" id="reveal-status-${idx}">Terminais bloqueados</div>
    `;
    
    btn.addEventListener("click", () => openRoleModal(idx));
    elements.roleRevealButtons.appendChild(btn);
  });
  
  elements.btnBeginProgramming.classList.add("btn-disabled");
  showScreen(elements.screenRoleReveal);
}

let activeModalPlayerIdx = null;

function openRoleModal(playerIdx) {
  activeModalPlayerIdx = playerIdx;
  const player = gameState.players[playerIdx];
  
  elements.roleModalPrompt.innerHTML = `Identificação Biométrica: Apenas o especialista <strong>${player.name}</strong> deve ter contato com a tela agora.`;
  elements.btnModalReveal.style.display = "inline-flex";
  elements.modalRoleContent.style.display = "none";
  elements.roleModal.classList.add("active");
}

elements.btnModalReveal.addEventListener("click", () => {
  const player = gameState.players[activeModalPlayerIdx];
  const roleInfo = ROLES[player.role];
  
  elements.modalRoleTitle.innerText = roleInfo.name.toUpperCase();
  elements.modalRoleTitle.style.color = roleInfo.color;
  elements.modalRoleDesc.innerText = roleInfo.description;
  elements.modalRoleBox.style.borderColor = roleInfo.color;
  elements.modalRoleBox.style.boxShadow = `0 0 15px ${roleInfo.color}33`;
  
  elements.btnModalReveal.style.display = "none";
  elements.modalRoleContent.style.display = "block";
  
  gameState.revealedRoles[activeModalPlayerIdx] = true;
  document.getElementById(`reveal-card-${activeModalPlayerIdx}`).classList.add("checked");
  document.getElementById(`reveal-status-${activeModalPlayerIdx}`).innerText = "✓ Autenticado";
  document.getElementById(`reveal-status-${activeModalPlayerIdx}`).style.color = "var(--neon-green)";
});

elements.btnModalClose.addEventListener("click", () => {
  elements.roleModal.classList.remove("active");
  
  const allChecked = gameState.revealedRoles.every(v => v === true);
  if (allChecked) {
    elements.btnBeginProgramming.classList.remove("btn-disabled");
  }
});

elements.btnBeginProgramming.addEventListener("click", () => {
  gameState.phase = "PLAYING";
  gameState.functionQueue = []; // Reseta fila de funções para nova rodada
  startProgrammingPhase();
});

// --- TELA 3: PROGRAMAÇÃO ---

function startProgrammingPhase() {
  selectedHandCardIdx = null;
  activeSkillMode = null;
  skillTargetId1 = null;
  
  const currentLevel = LEVELS[gameState.currentLevelIndex];
  elements.currentLevelName.innerText = `Setor ${currentLevel.id}: ${currentLevel.name}`;
  elements.currentLevelDesc.innerText = currentLevel.description;
  elements.queueMax.innerText = currentLevel.maxInstructions;
  
  renderMiniMap(currentLevel);
  renderCommandQueue();
  setupActivePlayerTurn();
  
  showScreen(elements.screenPlaying);
}

function renderMiniMap(level) {
  elements.playingMiniMap.innerHTML = "";
  const grid = level.grid;
  
  elements.playingMiniMap.style.display = "grid";
  elements.playingMiniMap.style.gridTemplateRows = `repeat(${grid.length}, 22px)`;
  elements.playingMiniMap.style.gridTemplateColumns = `repeat(${grid[0].length}, 22px)`;
  elements.playingMiniMap.style.gap = "2px";
  
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      const cell = document.createElement("div");
      cell.style.width = "22px";
      cell.style.height = "22px";
      cell.style.borderRadius = "2px";
      cell.style.display = "flex";
      cell.style.alignItems = "center";
      cell.style.justifyContent = "center";
      cell.style.fontSize = "0.7rem";
      
      const val = grid[r][c];
      if (val === "#") cell.style.background = "#232836";
      else if (val === "S") cell.style.background = "var(--neon-cyan)";
      else if (val === "G") cell.style.background = "var(--neon-green)";
      else if (val === "T") cell.style.background = "var(--neon-pink)";
      else if (val === "K") { cell.style.background = "rgba(254, 254, 51, 0.15)"; cell.innerText = "🔑"; }
      else if (val === "D") { cell.style.background = "rgba(249, 115, 22, 0.15)"; cell.innerText = "🚪"; }
      else if (val === "B") { cell.style.background = "rgba(0, 242, 254, 0.15)"; cell.innerText = "🔘"; }
      else cell.style.background = "rgba(255,255,255,0.03)";
      
      elements.playingMiniMap.appendChild(cell);
    }
  }
}

function renderCommandQueue() {
  renderQueueTrack(gameState.commandQueue, elements.playingQueueContainer, false);
  renderQueueTrack(gameState.functionQueue, elements.playingFuncContainer, true);
  
  elements.queueSize.innerText = gameState.commandQueue.length;
  
  // Habilita ou desabilita botão de Compilar
  if (gameState.commandQueue.length > 0) {
    elements.btnTriggerCompile.classList.remove("btn-disabled");
  } else {
    elements.btnTriggerCompile.classList.add("btn-disabled");
  }
  
  // Regra de limite de capacidade
  const currentLevel = LEVELS[gameState.currentLevelIndex];
  if (gameState.commandQueue.length >= currentLevel.maxInstructions) {
    elements.btnPlayVisible.classList.add("btn-disabled");
    elements.btnPlayFunc.classList.add("btn-disabled");
    elements.btnPlayHidden.classList.add("btn-disabled");
    elements.btnDiscard.classList.add("btn-disabled");
  }
}

function renderQueueTrack(queue, container, isFunc = false) {
  container.innerHTML = "";
  
  queue.forEach((item, idx) => {
    const cardEl = document.createElement("div");
    cardEl.className = "queue-card";
    cardEl.id = isFunc ? `q-func-${item.id}` : `q-card-${item.id}`;
    
    if (item.isHidden && !item.revealed) {
      cardEl.classList.add("hidden-card");
      if (item.isProtected) cardEl.classList.add("is-protected");
    } else {
      cardEl.innerHTML = `
        <span class="card-owner">${item.ownerName}</span>
        <span class="card-icon">${item.card.icon}</span>
        <span class="card-name">${item.card.name}</span>
      `;
      if (item.isHidden) {
        cardEl.style.borderColor = "var(--neon-purple)";
        const label = document.createElement("span");
        label.style.fontSize = "0.5rem";
        label.style.position = "absolute";
        label.style.bottom = "2px";
        label.style.right = "4px";
        label.style.color = "var(--neon-purple)";
        label.innerText = "OCULTO";
        cardEl.appendChild(label);
      }
    }
    
    // Alvo de Habilidades
    if (activeSkillMode === "REFATORAR" && !isFunc && (item.card.id === "left" || item.card.id === "right")) {
      cardEl.classList.add("action-target-mode");
      cardEl.addEventListener("click", () => triggerSkillTargetSelect(item.id));
    }
    else if (activeSkillMode === "INSPECIONAR" && !isFunc && item.isHidden) {
      cardEl.classList.add("action-target-mode");
      cardEl.addEventListener("click", () => triggerSkillTargetSelect(item.id));
    }
    else if (activeSkillMode === "CORRUPTER" && !isFunc) {
      cardEl.classList.add("action-target-mode");
      cardEl.addEventListener("click", () => triggerSkillTargetSelect(item.id));
    }
    // Alvo de Ação de baralho comum
    else if (activeSkillMode === "ACTION_TARGET" && !isFunc) {
      cardEl.classList.add("action-target-mode");
      cardEl.addEventListener("click", () => handleQueueCardTargetClick(item.id));
    }
    
    container.appendChild(cardEl);
  });
}

function setupActivePlayerTurn() {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  
  elements.turnPrivacyScreen.style.display = "block";
  elements.playerHandInterface.style.display = "none";
  elements.privacyPlayerName.innerText = activePlayer.name;
  
  // Reseta classe do contêiner para mudar bordas de acordo com a classe do jogador
  elements.playerTurnPanel.className = "panel player-turn-panel";
  elements.playerTurnPanel.classList.add(`${activePlayer.role.toLowerCase()}-active`);
}

elements.btnRevealMyTurn.addEventListener("click", () => {
  elements.turnPrivacyScreen.style.display = "none";
  elements.playerHandInterface.style.display = "block";
  
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  elements.activePlayerName.innerText = activePlayer.name;
  
  const roleInfo = ROLES[activePlayer.role];
  elements.playerRoleBadge.innerText = roleInfo.name;
  elements.playerRoleBadge.className = activePlayer.role === "CORRUPTED_AI" || activePlayer.role === "HACKER" 
    ? "badge badge-sab" : "badge badge-prog";
    
  // Configuração do botão de Habilidade de classe
  elements.btnUseClassSkill.innerText = `⚡ Hab: ${getSkillName(activePlayer.role)}`;
  if (activePlayer.skillUsed) {
    elements.btnUseClassSkill.classList.add("btn-disabled");
    elements.btnUseClassSkill.style.opacity = "0.4";
  } else {
    elements.btnUseClassSkill.classList.remove("btn-disabled");
    elements.btnUseClassSkill.style.opacity = "1";
    elements.btnUseClassSkill.className = "btn " + getRoleBtnClass(activePlayer.role);
  }
  
  renderPlayerHand(activePlayer);
  updatePlayControls();
});

function getSkillName(role) {
  if (role === "PROGRAMMER") return "Refatorar Rota";
  if (role === "DEBUGGER") return "Remover Bug";
  if (role === "ANALYST") return "Inspecionar Fila";
  if (role === "CORRUPTED_AI") return "Corromper Fila";
  if (role === "HACKER") return "Injetar Payload";
  return "Habilidade";
}

function getRoleBtnClass(role) {
  if (role === "PROGRAMMER") return "btn-green";
  if (role === "DEBUGGER") return "btn-cyan";
  if (role === "ANALYST") return "btn-purple";
  if (role === "CORRUPTED_AI") return "btn-pink";
  if (role === "HACKER") return "btn-yellow";
  return "";
}

function renderPlayerHand(player) {
  elements.playerHandContainer.innerHTML = "";
  selectedHandCardIdx = null;
  activeSkillMode = null;
  
  player.hand.forEach((card, idx) => {
    const cardEl = document.createElement("div");
    cardEl.className = "game-card";
    if (card.type === "action") cardEl.classList.add("action-card");
    
    cardEl.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.7rem; font-weight:700;">${card.type === 'action' ? 'AÇÃO' : 'BLOCO'}</span>
          <span>${card.icon}</span>
        </div>
        <div style="font-weight:800; font-size:0.8rem; margin-top:0.25rem;">${card.name}</div>
      </div>
      <div class="card-desc">${card.desc}</div>
    `;
    
    cardEl.addEventListener("click", () => selectHandCard(idx, cardEl));
    elements.playerHandContainer.appendChild(cardEl);
  });
}

function selectHandCard(idx, cardEl) {
  const cards = elements.playerHandContainer.children;
  for (let i = 0; i < cards.length; i++) {
    cards[i].classList.remove("selected");
  }
  
  if (activeSkillMode) {
    activeSkillMode = null;
    renderCommandQueue();
  }
  
  selectedHandCardIdx = idx;
  cardEl.classList.add("selected");
  
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const card = activePlayer.hand[idx];
  if (card && card.type === "action") {
    activeSkillMode = "ACTION_TARGET";
    alert("Selecione um bloco no Algoritmo Principal acima para aplicar a carta de ação.");
    renderCommandQueue();
  }
  
  updatePlayControls();
}

function updatePlayControls() {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const currentLevel = LEVELS[gameState.currentLevelIndex];
  
  if (gameState.commandQueue.length >= currentLevel.maxInstructions) {
    elements.btnPlayVisible.classList.add("btn-disabled");
    elements.btnPlayFunc.classList.add("btn-disabled");
    elements.btnPlayHidden.classList.add("btn-disabled");
    elements.btnDiscard.classList.add("btn-disabled");
    return;
  }
  
  if (selectedHandCardIdx === null) {
    elements.btnPlayVisible.classList.add("btn-disabled");
    elements.btnPlayFunc.classList.add("btn-disabled");
    elements.btnPlayHidden.classList.add("btn-disabled");
    elements.btnDiscard.classList.add("btn-disabled");
    return;
  }
  
  const card = activePlayer.hand[selectedHandCardIdx];
  elements.btnDiscard.classList.remove("btn-disabled");
  
  if (card.type === "command") {
    elements.btnPlayVisible.classList.remove("btn-disabled");
    elements.btnPlayHidden.classList.remove("btn-disabled");
    
    // Só permite adicionar na função se o nível tiver a sub-rotina habilitada
    const hasFunc = currentLevel.allowedBlocks.includes("call_func");
    if (hasFunc) {
      elements.btnPlayFunc.classList.remove("btn-disabled");
    } else {
      elements.btnPlayFunc.classList.add("btn-disabled");
    }
  } else if (card.type === "action") {
    elements.btnPlayVisible.classList.add("btn-disabled");
    elements.btnPlayHidden.classList.add("btn-disabled");
    elements.btnPlayFunc.classList.add("btn-disabled");
  }
}

// BOTOES DE ROTINA
elements.btnPlayVisible.addEventListener("click", () => {
  if (selectedHandCardIdx === null) return;
  playCommandCard(gameState.activePlayerIndex, selectedHandCardIdx, false);
  refreshAfterPlay();
});

elements.btnPlayHidden.addEventListener("click", () => {
  if (selectedHandCardIdx === null) return;
  playCommandCard(gameState.activePlayerIndex, selectedHandCardIdx, true);
  refreshAfterPlay();
});

elements.btnPlayFunc.addEventListener("click", () => {
  if (selectedHandCardIdx === null) return;
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const card = activePlayer.hand[selectedHandCardIdx];
  
  // Insere na fila de função
  activePlayer.hand.splice(selectedHandCardIdx, 1);
  gameState.functionQueue.push({
    id: generateId(),
    card: card,
    ownerName: activePlayer.name,
    ownerId: activePlayer.id,
    isHidden: false,
    revealed: true
  });
  
  logAction(`${activePlayer.name} adicionou o comando "${card.name}" na Sub-rotina (Função).`);
  endTurn();
  refreshAfterPlay();
});

elements.btnDiscard.addEventListener("click", () => {
  if (selectedHandCardIdx === null) return;
  discardCard(gameState.activePlayerIndex, selectedHandCardIdx);
  refreshAfterPlay();
});

// AÇÃO DE CARTA DE MESA (TIPO SCANNER, INVERT, DELETE)
function handleQueueCardTargetClick(queueCardId) {
  if (activeSkillMode !== "ACTION_TARGET" || selectedHandCardIdx === null) return;
  
  const success = playActionCard(gameState.activePlayerIndex, selectedHandCardIdx, { targetId: queueCardId });
  if (success) {
    refreshAfterPlay();
  } else {
    alert("Operação inadequada para o bloco de dados.");
    activeSkillMode = null;
    renderCommandQueue();
  }
}

// --- ATIVAÇÃO DE HABILIDADE ESPECIAL ---

elements.btnUseClassSkill.addEventListener("click", () => {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  if (activePlayer.skillUsed) return;
  
  const role = activePlayer.role;
  
  if (role === "PROGRAMMER") {
    activeSkillMode = "REFATORAR";
    alert("Habilidade Programador: Clique em um comando de curva (↩️ ou ↪️) no Algoritmo Principal para invertê-lo.");
    renderCommandQueue();
  } 
  
  else if (role === "DEBUGGER") {
    // Ação direta sem alvo manual
    const res = useClassSkill(gameState.activePlayerIndex, null);
    if (res.success) {
      alert(res.msg);
      startProgrammingPhase();
    } else {
      alert(res.msg);
    }
  } 
  
  else if (role === "ANALYST") {
    activeSkillMode = "INSPECIONAR";
    alert("Habilidade Analista: Clique em um comando oculto (🔒) no Algoritmo Principal para inspecioná-lo.");
    renderCommandQueue();
  } 
  
  else if (role === "CORRUPTED_AI") {
    activeSkillMode = "CORRUPTER";
    skillTargetId1 = null;
    alert("Habilidade HELENA: Selecione um comando no Algoritmo Principal, depois selecione o comando adjacente (vizinho) para embaralhá-los.");
    renderCommandQueue();
  } 
  
  else if (role === "HACKER") {
    if (selectedHandCardIdx === null) {
      alert("Habilidade Hacker: Selecione primeiro uma carta de comando da sua mão.");
      return;
    }
    const res = useClassSkill(gameState.activePlayerIndex, { handCardIdx: selectedHandCardIdx });
    if (res.success) {
      alert(res.msg);
      startProgrammingPhase();
    } else {
      alert(res.msg);
    }
  }
});

function triggerSkillTargetSelect(clickedId) {
  const activePlayerIdx = gameState.activePlayerIndex;
  const role = gameState.players[activePlayerIdx].role;
  
  if (role === "PROGRAMMER") {
    const res = useClassSkill(activePlayerIdx, { targetId: clickedId });
    if (res.success) {
      alert(res.msg);
      startProgrammingPhase();
    } else {
      alert(res.msg);
    }
  } 
  
  else if (role === "ANALYST") {
    const res = useClassSkill(activePlayerIdx, { targetId: clickedId });
    if (res.success) {
      // Exibe mensagem confidencial
      alert(`[CONCEITO CONFIDENCIAL]\n${res.secretMsg}`);
      startProgrammingPhase();
    } else {
      alert(res.msg);
    }
  } 
  
  else if (role === "CORRUPTED_AI") {
    if (skillTargetId1 === null) {
      skillTargetId1 = clickedId;
      // Destaca o primeiro selecionado
      const cardEl = document.getElementById(`q-card-${clickedId}`);
      if (cardEl) {
        cardEl.style.borderColor = "var(--neon-pink)";
        cardEl.style.boxShadow = "var(--glow-pink)";
      }
      alert("Selecione agora a instrução vizinha para concluir o swap.");
    } else {
      const id2 = clickedId;
      const res = useClassSkill(activePlayerIdx, { targetId1: skillTargetId1, targetId2: id2 });
      if (res.success) {
        alert(res.msg);
        startProgrammingPhase();
      } else {
        alert(res.msg);
        // Reseta seleção
        skillTargetId1 = null;
        renderCommandQueue();
      }
    }
  }
}

function refreshAfterPlay() {
  const currentLevel = LEVELS[gameState.currentLevelIndex];
  if (gameState.commandQueue.length >= currentLevel.maxInstructions) {
    alert("Escopo de capacidade máxima atingido. Compilando automaticamente...");
    triggerSimulationCompile();
  } else {
    startProgrammingPhase();
  }
}

elements.btnTriggerCompile.addEventListener("click", () => {
  if (gameState.commandQueue.length === 0) return;
  triggerSimulationCompile();
});

function triggerSimulationCompile() {
  gameState.phase = "EXECUTION";
  startExecutionPhase();
}

// --- TELA 4: EXECUÇÃO & DEPURADOR ---

function startExecutionPhase() {
  const currentLevel = LEVELS[gameState.currentLevelIndex];
  elements.execLevelName.innerText = `Setor ${currentLevel.id}: ${currentLevel.name}`;
  
  // Revela tudo na compilação
  gameState.commandQueue.forEach(item => item.revealed = true);
  
  const result = runSimulation(currentLevel, gameState.commandQueue, gameState.functionQueue);
  currentTimeline = result.timeline;
  currentStepIdx = 0;
  
  if (simInterval) clearInterval(simInterval);
  simInterval = null;
  
  elements.btnFinishExecution.classList.add("btn-disabled");
  elements.btnDebugPlay.innerText = "▶";
  elements.btnDebugPlay.classList.add("btn-green");
  
  renderExecQueues();
  
  elements.terminalBody.innerHTML = "";
  logTerminal("COMPILAÇÃO INICIADA: SyntaxError Loader v2...", "sys");
  logTerminal(`Verificando escopo lógico da sala: ${currentLevel.name}...`, "info");
  logTerminal(`Fila Principal: ${gameState.commandQueue.length} bloco(s). Função: ${gameState.functionQueue.length} bloco(s).`, "info");
  
  renderSimulationStep();
  showScreen(elements.screenExecution);
  
  // Auto-play simulation immediately after screen transition
  setTimeout(() => {
    elements.btnDebugPlay.click();
  }, 100);
}

function logTerminal(msg, type = "info") {
  const line = document.createElement("div");
  line.className = `terminal-line ${type}`;
  line.innerText = `[${new Date().toLocaleTimeString('pt-BR', { hour12: false })}] ${msg}`;
  elements.terminalBody.appendChild(line);
  elements.terminalBody.scrollTop = elements.terminalBody.scrollHeight;
}

function renderExecQueues() {
  renderQueueTrack(gameState.commandQueue, elements.execQueueContainer, false);
  renderQueueTrack(gameState.functionQueue, elements.execFuncContainer, true);
}

function renderSimulationStep() {
  const step = currentTimeline[currentStepIdx];
  const currentLevel = LEVELS[gameState.currentLevelIndex];
  
  // 1. Destacar card na fila principal
  const mainCards = elements.execQueueContainer.children;
  for (let i = 0; i < mainCards.length; i++) {
    mainCards[i].classList.remove("active-execution");
  }
  if (step.highlightQueueIdxs && step.highlightQueueIdxs.length > 0) {
    step.highlightQueueIdxs.forEach(idx => {
      if (mainCards[idx]) {
        mainCards[idx].classList.add("active-execution");
        mainCards[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }
  
  // 2. Destacar card na fila da função
  const funcCards = elements.execFuncContainer.children;
  for (let i = 0; i < funcCards.length; i++) {
    funcCards[i].classList.remove("active-execution");
  }
  if (step.highlightFuncIdxs && step.highlightFuncIdxs.length > 0) {
    step.highlightFuncIdxs.forEach(idx => {
      if (funcCards[idx]) {
        funcCards[idx].classList.add("active-execution");
        funcCards[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }
  
  // 3. Desenhar tabuleiro com base no estado do grid do passo atual
  drawExecutionBoard(step.gridState, step);
  
  // 4. Console log
  if (step.step === 0) {
    logTerminal(step.message, "sys");
    elements.execOutcomeBadge.style.display = "inline-block";
    elements.execOutcomeBadge.className = "badge";
    elements.execOutcomeBadge.innerText = "COMPILANDO";
    elements.execOutcomeBadge.style.background = "rgba(0, 242, 254, 0.15)";
    elements.execOutcomeBadge.style.color = "var(--neon-cyan)";
    elements.execOutcomeBadge.style.borderColor = "var(--neon-cyan)";
  } else {
    let logType = "info";
    if (step.status === "SUCCESS") logType = "success";
    else if (step.status === "CRASHED" || step.status === "TRAPPED" || step.status === "OUT_OF_COMMANDS") logType = "error";
    
    logTerminal(step.message, logType);
    
    if (step.status !== "RUNNING") {
      elements.execOutcomeBadge.style.display = "inline-block";
      if (step.status === "SUCCESS") {
        elements.execOutcomeBadge.className = "badge badge-prog";
        elements.execOutcomeBadge.innerText = "SUCESSO";
      } else {
        elements.execOutcomeBadge.className = "badge badge-sab";
        elements.execOutcomeBadge.innerText = "ERRO LÓGICO";
      }
    }
  }
  
  if (currentStepIdx === currentTimeline.length - 1) {
    elements.btnFinishExecution.classList.remove("btn-disabled");
    elements.btnDebugPlay.innerText = "▶";
    elements.btnDebugPlay.classList.remove("btn-pink");
    elements.btnDebugPlay.classList.add("btn-green");
    if (simInterval) clearInterval(simInterval);
  }
}

function drawExecutionBoard(grid, step) {
  elements.boardGrid.innerHTML = "";
  elements.boardGrid.style.gridTemplateRows = `repeat(${grid.length}, 46px)`;
  elements.boardGrid.style.gridTemplateColumns = `repeat(${grid[0].length}, 46px)`;
  
  const trail = [];
  for (let i = 0; i <= currentStepIdx; i++) {
    const s = currentTimeline[i];
    trail.push(`${s.r},${s.c}`);
  }
  
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      
      const val = grid[r][c];
      if (val === "#") cell.classList.add("cell-wall");
      else if (val === "S") cell.classList.add("cell-start");
      else if (val === "G") {
        cell.classList.add("cell-goal");
        cell.innerText = "🔋";
      } else if (val === "K") {
        cell.classList.add("cell-key");
        cell.innerText = "🔑";
      } else if (val === "D") {
        cell.classList.add("cell-door");
        cell.innerText = "🚪";
      } else if (val === "B") {
        cell.classList.add("cell-button");
        cell.innerText = "🔘";
      } else if (val === "T") {
        // Mostra laser ativo apenas se lasers não estiverem desativados
        if (!step.lasersDisabled) {
          cell.classList.add("cell-trap");
          cell.innerText = "⚡";
        } else {
          cell.style.background = "rgba(57, 255, 20, 0.05)";
          cell.innerText = "✓";
        }
      }
      
      if (val !== "#" && val !== "S" && trail.includes(`${r},${c}`)) {
        cell.style.background = "rgba(0, 242, 254, 0.12)";
        cell.style.boxShadow = "inset 0 0 4px rgba(0, 242, 254, 0.25)";
      }
      
      if (r === step.r && c === step.c) {
        const rob = document.createElement("span");
        rob.className = `robot-sprite dir-${step.dir}`;
        if (step.status === "CRASHED" || step.status === "TRAPPED") {
          rob.innerText = "💥";
        } else if (step.status === "SUCCESS") {
          rob.innerText = "🤖⚡";
        } else {
          rob.innerText = "🤖";
        }
        cell.appendChild(rob);
      }
      
      elements.boardGrid.appendChild(cell);
    }
  }
}

// Depurador controles

elements.btnDebugPlay.addEventListener("click", () => {
  if (currentStepIdx >= currentTimeline.length - 1) {
    currentStepIdx = 0;
    renderSimulationStep();
  }
  
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
    elements.btnDebugPlay.innerText = "▶";
    elements.btnDebugPlay.classList.remove("btn-pink");
    elements.btnDebugPlay.classList.add("btn-green");
    logTerminal("Execução pausada pelo usuário.", "info");
  } else {
    elements.btnDebugPlay.innerText = "⏸";
    elements.btnDebugPlay.classList.remove("btn-green");
    elements.btnDebugPlay.classList.add("btn-pink");
    logTerminal("Iniciando varredura automatizada passo a passo...", "sys");
    runPlayTimer();
  }
});

function runPlayTimer() {
  if (simInterval) clearInterval(simInterval);
  const speed = parseInt(elements.debugSpeed.value, 10);
  simInterval = setInterval(() => {
    if (currentStepIdx < currentTimeline.length - 1) {
      currentStepIdx++;
      renderSimulationStep();
    } else {
      clearInterval(simInterval);
      simInterval = null;
    }
  }, speed);
}

elements.debugSpeed.addEventListener("input", () => {
  if (simInterval) runPlayTimer();
});

elements.btnDebugStep.addEventListener("click", () => {
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
    elements.btnDebugPlay.innerText = "▶";
    elements.btnDebugPlay.classList.remove("btn-pink");
    elements.btnDebugPlay.classList.add("btn-green");
  }
  
  if (currentStepIdx < currentTimeline.length - 1) {
    currentStepIdx++;
    renderSimulationStep();
  }
});

elements.btnDebugPrev.addEventListener("click", () => {
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
    elements.btnDebugPlay.innerText = "▶";
    elements.btnDebugPlay.classList.remove("btn-pink");
    elements.btnDebugPlay.classList.add("btn-green");
  }
  currentStepIdx = 0;
  elements.terminalBody.innerHTML = "";
  logTerminal("Fluxo restaurado ao Passo 0.", "sys");
  renderSimulationStep();
});

elements.btnFinishExecution.addEventListener("click", () => {
  if (currentStepIdx < currentTimeline.length - 1) return;
  const finalState = currentTimeline[currentTimeline.length - 1];
  
  if (finalState.status === "SUCCESS") {
    declareRoundWinner("PROGRAMMERS");
  } else {
    declareRoundWinner("SABOTEURS");
  }
  
  startDiscussionPhase();
});

// --- TELA 5: DEBATE & FEEDBACK PEDAGÓGICO ---

function startDiscussionPhase() {
  const isSuccess = gameState.roundWinner === "PROGRAMMERS";
  
  elements.discussionOutcomeText.innerText = isSuccess 
    ? "TERMINAL DE FUGA DESBLOQUEADO: RODADA CONCLUÍDA" 
    : "SISTEMA BLOQUEADO: FALHA LOGICA DETECTADA (BUG)";
    
  elements.discussionOutcomeText.className = isSuccess 
    ? "discussion-outcome success" 
    : "discussion-outcome failure";
    
  // 1. Mostrar autores e cargos
  elements.revealedQueueList.innerHTML = "";
  gameState.commandQueue.forEach(item => {
    const itemEl = document.createElement("div");
    itemEl.className = "revealed-queue-item";
    
    const author = gameState.players.find(p => p.id === item.ownerId);
    const isProg = author.role === "PROGRAMMER" || author.role === "DEBUGGER" || author.role === "ANALYST";
    
    itemEl.classList.add(isProg ? "by-programmer" : "by-saboteur");
    itemEl.innerHTML = `
      <div style="font-size: 1.5rem; margin-bottom: 0.2rem;">${item.card.icon}</div>
      <div style="font-weight: 700; font-size: 0.75rem;">${item.card.name}</div>
      <div style="font-size: 0.6rem; color: var(--text-muted); margin-top: 0.3rem;">Autor:</div>
      <div class="item-owner">${author.name}</div>
      <span class="badge ${isProg ? 'badge-prog' : 'badge-sab'}" style="font-size: 0.55rem; padding: 0.1rem 0.3rem; margin-top: 0.2rem;">
        ${ROLES[author.role].name}
      </span>
    `;
    elements.revealedQueueList.appendChild(itemEl);
  });
  
  // 2. Relatório Pedagógico Didático
  generatePedagogicalReport();
  
  const isLastRound = gameState.currentRound >= LEVELS.length;
  elements.btnNextRound.innerText = isLastRound ? "Desligar HELENA (Resultado Final) 🏁" : "Ir para o Próximo Setor ➡️";
  
  showScreen(elements.screenDiscussion);
}

function generatePedagogicalReport() {
  const currentLevel = LEVELS[gameState.currentLevelIndex];
  const finalState = currentTimeline[currentTimeline.length - 1];
  
  let html = `<p style="margin-bottom: 0.8rem;"><strong>Setor Analisado:</strong> ${currentLevel.name}</p>`;
  
  // Identifica o conceito focado no nível
  let concepts = "";
  if (currentLevel.id === 1) concepts = "Sequência Lógica de Algoritmos.";
  else if (currentLevel.id === 2) concepts = "Decomposição de Percurso e Sequenciamento de Obstáculos.";
  else if (currentLevel.id === 3) concepts = "Comutação de Estado (Chaves) e Ações Condicionais de Execução (Abrir Portas).";
  else if (currentLevel.id === 4) concepts = "Estruturas de Repetição (Loop For/Corredores).";
  else if (currentLevel.id === 5) concepts = "Manipulação de Variáveis Globais de Ambiente (Interruptor/Bypass de Lasers).";
  else if (currentLevel.id === 6) concepts = "Desvios de Fluxo com Estruturas Condicionais (Sensores IF).";
  else if (currentLevel.id === 7) concepts = "Abstração e Modularização de Código (Funções/Sub-rotinas).";
  else if (currentLevel.id === 8) concepts = "Pensamento Computacional Geral Integrado.";
  
  html += `<p style="margin-bottom: 0.8rem;">💡 <strong>Conceito Pedagógico Focado:</strong> ${concepts}</p>`;
  
  if (gameState.roundWinner === "PROGRAMMERS") {
    html += `
      <p style="color: var(--neon-green); font-weight: 700; margin-bottom: 0.8rem;">
        ✓ Execução Perfeita! O algoritmo construído atendeu a todos os requisitos lógicos definidos para este setor.
      </p>
      <p>
        <strong>Feedback Pedagógico:</strong> A equipe compreendeu e estruturou com êxito a lógica computacional proposta. Analisem o histórico de autoria para validar quem contribuiu com comandos cruciais de movimentação ou estruturas de controle.
      </p>
    `;
  } else {
    html += `
      <p style="color: var(--neon-pink); font-weight: 700; margin-bottom: 0.8rem;">
        ⚠️ Falha Lógica Detectada no Algoritmo.
      </p>
      <p style="margin-bottom: 0.8rem;">
        <strong>Log do Interpretador:</strong> "${finalState.message}"
      </p>
    `;
    
    // Dicas didáticas específicas de acordo com o tipo de erro
    let tip = "";
    if (finalState.status === "CRASHED") {
      if (finalState.message.includes("porta")) {
        tip = "Para cruzar uma porta lógica (D), o AlgoBot precisa executar a instrução 'Desbloquear Porta' estando de frente para ela e possuindo ao menos uma chave no inventário.";
      } else {
        tip = "O robô colidiu com uma barreira fixa. Certifique-se de que a quantidade de instruções 'Mover Frente' esteja alinhada com as coordenadas do tabuleiro e que as rotações de direção ocorram nas células livres corretas.";
      }
    } else if (finalState.status === "TRAPPED") {
      tip = "O robô colidiu com lasers ativos (T). Para contornar, você deve programar o AlgoBot para ficar sobre o interruptor (B) e acionar a instrução 'Interromper Laser' ANTES do robô cruzar o caminho do firewall.";
    } else if (finalState.status === "OUT_OF_COMMANDS") {
      tip = "O AlgoBot encerrou todos os comandos da fila sem colidir, mas não alcançou o Gate de saída. O tamanho do algoritmo foi insuficiente ou a sequência lógica terminou antes do planejado. Otimize usando loops ou analise o sequenciamento.";
    }
    
    html += `<p><strong>Dica de Depuração (Debug):</strong> ${tip}</p>`;
  }
  
  elements.pedagogicalReportContent.innerHTML = html;
}

// --- TELA 6: GAME OVER ---

function renderGameOverScreen() {
  const progWins = gameState.scores.programmers > gameState.scores.saboteurs;
  const isDraw = gameState.scores.programmers === gameState.scores.saboteurs;
  
  if (isDraw) {
    elements.finalWinnerText.innerText = "EMPATE NO CONTROLE DO CORE!";
    elements.finalWinnerText.className = "discussion-outcome text-yellow";
  } else if (progWins) {
    elements.finalWinnerText.innerText = "VITÓRIA DOS PROGRAMADORES! HELENA DESATIVADA.";
    elements.finalWinnerText.className = "discussion-outcome text-green";
  } else {
    elements.finalWinnerText.innerText = "VITÓRIA DOS SABOTADORES! HELENA CONTROLOU O DATA CENTER.";
    elements.finalWinnerText.className = "discussion-outcome text-pink";
  }
  
  elements.finalScoreProg.innerText = gameState.scores.programmers;
  elements.finalScoreSab.innerText = gameState.scores.saboteurs;
  
  elements.finalPlayersRolesContainer.innerHTML = "";
  gameState.players.forEach(player => {
    const row = document.createElement("div");
    row.className = "final-role-item";
    const isProg = player.role === "PROGRAMMER" || player.role === "DEBUGGER" || player.role === "ANALYST";
    
    row.innerHTML = `
      <span style="font-weight: 700;">${player.name}</span>
      <span class="badge ${isProg ? 'badge-prog' : 'badge-sab'}">${ROLES[player.role].name}</span>
    `;
    elements.finalPlayersRolesContainer.appendChild(row);
  });
  
  showScreen(elements.screenGameOver);
}

elements.btnRestartGame.addEventListener("click", () => {
  gameState.phase = "LOBBY";
  showScreen(elements.screenLobby);
});

// Inicialização dos botões do Lobby
updateLobbyButtons();
