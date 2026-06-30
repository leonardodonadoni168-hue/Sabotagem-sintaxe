// Controlador de Interface (UI) do AlgoBot
// Conecta o DOM com o estado do jogo (state.js) e o simulador (engine.js).

let currentTimeline = [];
let currentStepIdx = 0;
let simInterval = null;
let selectedHandCardIdx = null;
let isActionTargetMode = false;

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
  
  // Revelação de Cargos
  roleRevealButtons: document.getElementById("role-reveal-buttons"),
  btnBeginProgramming: document.getElementById("btn-begin-programming"),
  
  // Modal de Privacidade
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
  queueSize: document.getElementById("queue-size"),
  queueMax: document.getElementById("queue-max"),
  
  turnPrivacyScreen: document.getElementById("turn-privacy-screen"),
  privacyPlayerName: document.getElementById("privacy-player-name"),
  btnRevealMyTurn: document.getElementById("btn-reveal-my-turn"),
  
  playerHandInterface: document.getElementById("player-hand-interface"),
  activePlayerName: document.getElementById("active-player-name"),
  playerRoleBadge: document.getElementById("player-role-badge"),
  playerHandContainer: document.getElementById("player-hand-container"),
  
  btnPlayVisible: document.getElementById("btn-play-visible"),
  btnPlayHidden: document.getElementById("btn-play-hidden"),
  btnPlayAction: document.getElementById("btn-play-action"),
  btnDiscard: document.getElementById("btn-discard"),
  btnTriggerCompile: document.getElementById("btn-trigger-compile"),
  
  // Execução / Depurador
  execLevelName: document.getElementById("exec-level-name"),
  execOutcomeBadge: document.getElementById("exec-outcome-badge"),
  boardGrid: document.getElementById("board-grid"),
  execQueueContainer: document.getElementById("exec-queue-container"),
  btnDebugPrev: document.getElementById("btn-debug-prev"),
  btnDebugPlay: document.getElementById("btn-debug-play"),
  btnDebugStep: document.getElementById("btn-debug-step"),
  debugSpeed: document.getElementById("debug-speed"),
  terminalBody: document.getElementById("terminal-body"),
  btnFinishExecution: document.getElementById("btn-finish-execution"),
  
  // Discussão
  discussionOutcomeText: document.getElementById("discussion-outcome-text"),
  revealedQueueList: document.getElementById("revealed-queue-list"),
  btnNextRound: document.getElementById("btn-next-round"),
  
  // Game Over
  finalWinnerText: document.getElementById("final-winner-text"),
  finalScoreProg: document.getElementById("final-score-prog"),
  finalScoreSab: document.getElementById("final-score-sab"),
  finalPlayersRolesContainer: document.getElementById("final-players-roles-container"),
  btnRestartGame: document.getElementById("btn-restart-game")
};

// --- FUNÇÕES DE NAVEGAÇÃO ---

function showScreen(screen) {
  // Ocultar todas as telas
  elements.screenLobby.classList.remove("active");
  elements.screenRoleReveal.classList.remove("active");
  elements.screenPlaying.classList.remove("active");
  elements.screenExecution.classList.remove("active");
  elements.screenDiscussion.classList.remove("active");
  elements.screenGameOver.classList.remove("active");
  
  // Ativar a tela desejada
  screen.classList.add("active");
  
  // Controlar exibição do cabeçalho de estatísticas
  if (gameState.phase === "LOBBY" || gameState.phase === "GAME_OVER") {
    elements.headerStats.style.display = "none";
  } else {
    elements.headerStats.style.display = "flex";
    updateHeaderStats();
  }
}

function updateHeaderStats() {
  elements.infoRound.innerText = `Rodada: ${gameState.currentRound}/${LEVELS.length}`;
  elements.scoreProg.innerText = `Programadores: ${gameState.scores.programmers}`;
  elements.scoreSab.innerText = `Sabotadores: ${gameState.scores.saboteurs}`;
}

// --- TELA 1: LOBBY ---

// Adiciona linha de jogador
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
  
  // Escuta para remover
  row.querySelector(".btn-remove-player").addEventListener("click", () => {
    row.remove();
    updateLobbyButtons();
  });
  
  elements.playerInputs.appendChild(row);
  updateLobbyButtons();
});

function updateLobbyButtons() {
  const count = elements.playerInputs.children.length;
  // Saboteur precisa de pelo menos 3 jogadores
  if (count < 3) {
    elements.btnStartGame.classList.add("btn-disabled");
  } else {
    elements.btnStartGame.classList.remove("btn-disabled");
  }
}

// Inicia o jogo
elements.btnStartGame.addEventListener("click", () => {
  const inputs = document.querySelectorAll(".player-name-input");
  const names = [];
  inputs.forEach(inp => {
    if (inp.value.trim() !== "") {
      names.push(inp.value.trim());
    }
  });
  
  if (names.length < 3) {
    alert("Precisamos de pelo menos 3 jogadores para jogar!");
    return;
  }
  
  setupGame(names);
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
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;" id="reveal-status-${idx}">Não verificado</div>
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
  
  elements.roleModalPrompt.innerHTML = `Certifique-se de que apenas <strong>${player.name}</strong> está olhando para a tela agora.`;
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
  
  // Marca como verificado
  gameState.revealedRoles[activeModalPlayerIdx] = true;
  document.getElementById(`reveal-card-${activeModalPlayerIdx}`).classList.add("checked");
  document.getElementById(`reveal-status-${activeModalPlayerIdx}`).innerText = "✓ Verificado";
  document.getElementById(`reveal-status-${activeModalPlayerIdx}`).style.color = "var(--neon-green)";
});

elements.btnModalClose.addEventListener("click", () => {
  elements.roleModal.classList.remove("active");
  
  // Se todos verificaram, habilita botão de programar
  const allChecked = gameState.revealedRoles.every(v => v === true);
  if (allChecked) {
    elements.btnBeginProgramming.classList.remove("btn-disabled");
  }
});

elements.btnBeginProgramming.addEventListener("click", () => {
  gameState.phase = "PLAYING";
  startProgrammingPhase();
});

// --- TELA 3: PROGRAMAÇÃO ---

function startProgrammingPhase() {
  selectedHandCardIdx = null;
  isActionTargetMode = false;
  
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
  
  // Configura grid CSS
  elements.playingMiniMap.style.display = "grid";
  elements.playingMiniMap.style.gridTemplateRows = `repeat(${grid.length}, 20px)`;
  elements.playingMiniMap.style.gridTemplateColumns = `repeat(${grid[0].length}, 20px)`;
  elements.playingMiniMap.style.gap = "2px";
  
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      const cell = document.createElement("div");
      cell.style.width = "20px";
      cell.style.height = "20px";
      cell.style.borderRadius = "2px";
      
      const val = grid[r][c];
      if (val === "#") cell.style.background = "#2a3142";
      else if (val === "S") cell.style.background = "var(--neon-cyan)";
      else if (val === "G") cell.style.background = "var(--neon-green)";
      else if (val === "T") cell.style.background = "var(--neon-pink)";
      else cell.style.background = "rgba(255,255,255,0.05)";
      
      elements.playingMiniMap.appendChild(cell);
    }
  }
}

function renderCommandQueue() {
  elements.playingQueueContainer.innerHTML = "";
  const currentLevel = LEVELS[gameState.currentLevelIndex];
  
  elements.queueSize.innerText = gameState.commandQueue.length;
  
  gameState.commandQueue.forEach((item, idx) => {
    const cardEl = document.createElement("div");
    cardEl.className = "queue-card";
    cardEl.id = `q-card-${item.id}`;
    
    if (item.isHidden && !item.revealed) {
      cardEl.classList.add("hidden-card");
    } else {
      cardEl.innerHTML = `
        <span class="card-owner">${item.ownerName}</span>
        <span class="card-icon">${item.card.icon}</span>
        <span class="card-name">${item.card.name}</span>
      `;
      if (item.isHidden) {
        cardEl.style.borderColor = "var(--neon-purple)";
        // Pequena etiqueta mostrando que é secreto
        const label = document.createElement("span");
        label.style.fontSize = "0.55rem";
        label.style.position = "absolute";
        label.style.bottom = "2px";
        label.style.right = "4px";
        label.style.color = "var(--neon-purple)";
        label.innerText = "OCULTO";
        cardEl.appendChild(label);
      }
    }
    
    // Se estiver no modo de selecionar alvo para Ação
    if (isActionTargetMode) {
      cardEl.classList.add("action-target-mode");
      cardEl.addEventListener("click", () => handleQueueCardTargetClick(item.id));
    }
    
    elements.playingQueueContainer.appendChild(cardEl);
  });
  
  // Habilita ou desabilita botão de Compilar
  if (gameState.commandQueue.length > 0) {
    elements.btnTriggerCompile.classList.remove("btn-disabled");
  } else {
    elements.btnTriggerCompile.classList.add("btn-disabled");
  }
  
  // Se a fila atingir o limite, obriga a compilação
  if (gameState.commandQueue.length >= currentLevel.maxInstructions) {
    elements.btnPlayVisible.classList.add("btn-disabled");
    elements.btnPlayHidden.classList.add("btn-disabled");
    elements.btnPlayAction.classList.add("btn-disabled");
    elements.btnDiscard.classList.add("btn-disabled");
  }
}

function setupActivePlayerTurn() {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  
  // Esconde o painel do jogador e mostra tela de privacidade
  elements.turnPrivacyScreen.style.display = "block";
  elements.playerHandInterface.style.display = "none";
  
  elements.privacyPlayerName.innerText = activePlayer.name;
}

// Botão para revelar o turno
elements.btnRevealMyTurn.addEventListener("click", () => {
  elements.turnPrivacyScreen.style.display = "none";
  elements.playerHandInterface.style.display = "block";
  
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  elements.activePlayerName.innerText = activePlayer.name;
  
  const roleInfo = ROLES[activePlayer.role];
  elements.playerRoleBadge.innerText = roleInfo.name;
  elements.playerRoleBadge.className = activePlayer.role === "PROGRAMMER" ? "badge badge-prog" : "badge badge-sab";
  
  renderPlayerHand(activePlayer);
  updatePlayControls();
});

function renderPlayerHand(player) {
  elements.playerHandContainer.innerHTML = "";
  selectedHandCardIdx = null;
  isActionTargetMode = false;
  
  player.hand.forEach((card, idx) => {
    const cardEl = document.createElement("div");
    cardEl.className = "game-card";
    if (card.type === "action") cardEl.classList.add("action-card");
    
    cardEl.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.75rem; font-weight:700;">${card.type === 'action' ? 'AÇÃO' : 'BLOCO'}</span>
          <span>${card.icon}</span>
        </div>
        <div style="font-weight:800; font-size:0.85rem; margin-top:0.3rem;">${card.name}</div>
      </div>
      <div class="card-desc">${card.desc}</div>
    `;
    
    cardEl.addEventListener("click", () => selectHandCard(idx, cardEl));
    elements.playerHandContainer.appendChild(cardEl);
  });
}

function selectHandCard(idx, cardEl) {
  // Desmarcar anterior
  const cards = elements.playerHandContainer.children;
  for (let i = 0; i < cards.length; i++) {
    cards[i].classList.remove("selected");
  }
  
  // Desativa modo de ação se estava ativo
  if (isActionTargetMode) {
    isActionTargetMode = false;
    renderCommandQueue();
  }
  
  selectedHandCardIdx = idx;
  cardEl.classList.add("selected");
  
  updatePlayControls();
}

function updatePlayControls() {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const currentLevel = LEVELS[gameState.currentLevelIndex];
  
  // Se fila já atingiu o máximo, impede jogadas
  if (gameState.commandQueue.length >= currentLevel.maxInstructions) {
    elements.btnPlayVisible.classList.add("btn-disabled");
    elements.btnPlayHidden.classList.add("btn-disabled");
    elements.btnPlayAction.classList.add("btn-disabled");
    elements.btnDiscard.classList.add("btn-disabled");
    return;
  }
  
  if (selectedHandCardIdx === null) {
    elements.btnPlayVisible.classList.add("btn-disabled");
    elements.btnPlayHidden.classList.add("btn-disabled");
    elements.btnPlayAction.classList.add("btn-disabled");
    elements.btnDiscard.classList.add("btn-disabled");
    return;
  }
  
  const card = activePlayer.hand[selectedHandCardIdx];
  elements.btnDiscard.classList.remove("btn-disabled");
  
  if (card.type === "command") {
    elements.btnPlayVisible.classList.remove("btn-disabled");
    elements.btnPlayHidden.classList.remove("btn-disabled");
    elements.btnPlayAction.classList.add("btn-disabled");
  } else if (card.type === "action") {
    elements.btnPlayVisible.classList.add("btn-disabled");
    elements.btnPlayHidden.classList.add("btn-disabled");
    
    // Só habilita usar ação se a fila tiver comandos alvos válidos
    if (gameState.commandQueue.length > 0) {
      elements.btnPlayAction.classList.remove("btn-disabled");
    } else {
      elements.btnPlayAction.classList.add("btn-disabled");
    }
  }
}

// Botões de Ação de Jogada
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

elements.btnDiscard.addEventListener("click", () => {
  if (selectedHandCardIdx === null) return;
  discardCard(gameState.activePlayerIndex, selectedHandCardIdx);
  refreshAfterPlay();
});

elements.btnPlayAction.addEventListener("click", () => {
  if (selectedHandCardIdx === null) return;
  
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const card = activePlayer.hand[selectedHandCardIdx];
  
  // Ativa o modo de seleção de alvo na fila
  isActionTargetMode = true;
  alert(`Modo Ação: Selecione um bloco na fila de comandos acima para aplicar a carta "${card.name}".`);
  renderCommandQueue();
});

function handleQueueCardTargetClick(queueCardId) {
  if (!isActionTargetMode || selectedHandCardIdx === null) return;
  
  const success = playActionCard(gameState.activePlayerIndex, selectedHandCardIdx, { targetId: queueCardId });
  if (success) {
    refreshAfterPlay();
  } else {
    alert("Operação inválida para o bloco selecionado. Verifique os requisitos do card.");
    isActionTargetMode = false;
    renderCommandQueue();
  }
}

function refreshAfterPlay() {
  const currentLevel = LEVELS[gameState.currentLevelIndex];
  
  // Se atingiu o máximo de instruções após a jogada, vai direto para a compilação
  if (gameState.commandQueue.length >= currentLevel.maxInstructions) {
    alert("O limite máximo de comandos para este nível foi atingido! Compilação iniciada automaticamente.");
    triggerSimulationCompile();
  } else {
    // Caso contrário, próximo turno
    startProgrammingPhase();
  }
}

// Gatilho de Compilação
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
  
  // Garante que todas as cartas na fila são reveladas no depurador para todos poderem depurar
  gameState.commandQueue.forEach(item => item.revealed = true);
  
  // Executa a simulação gerando o histórico detalhado (timeline)
  const result = runSimulation(currentLevel, gameState.commandQueue);
  currentTimeline = result.timeline;
  currentStepIdx = 0;
  
  if (simInterval) clearInterval(simInterval);
  simInterval = null;
  
  // Interface
  elements.btnFinishExecution.classList.add("btn-disabled");
  elements.btnDebugPlay.innerText = "▶";
  elements.btnDebugPlay.classList.add("btn-green");
  
  renderExecQueue();
  
  // Limpar e preencher console de terminal
  elements.terminalBody.innerHTML = "";
  logTerminal("COMPILADOR INICIALIZADO...", "sys");
  logTerminal(`Carregando mapa: ${currentLevel.name}... OK`, "info");
  logTerminal(`Fila de comandos compilada: ${gameState.commandQueue.length} bloco(s) carregados.`, "info");
  
  renderSimulationStep();
  showScreen(elements.screenExecution);
}

function logTerminal(msg, type = "info") {
  const line = document.createElement("div");
  line.className = `terminal-line ${type}`;
  line.innerText = `[${new Date().toLocaleTimeString('pt-BR', { hour12: false })}] ${msg}`;
  elements.terminalBody.appendChild(line);
  elements.terminalBody.scrollTop = elements.terminalBody.scrollHeight;
}

function renderExecQueue() {
  elements.execQueueContainer.innerHTML = "";
  
  gameState.commandQueue.forEach((item, idx) => {
    const cardEl = document.createElement("div");
    cardEl.className = "queue-card";
    cardEl.id = `exec-card-${idx}`;
    cardEl.innerHTML = `
      <span class="card-owner">${item.ownerName}</span>
      <span class="card-icon">${item.card.icon}</span>
      <span class="card-name">${item.card.name}</span>
    `;
    
    // Se o autor original era sabotador e estamos na discussão, destacaremos de cor diferente
    // Mas no depurador, mantemos neutro
    elements.execQueueContainer.appendChild(cardEl);
  });
}

function renderSimulationStep() {
  const step = currentTimeline[currentStepIdx];
  const currentLevel = LEVELS[gameState.currentLevelIndex];
  
  // 1. Destacar card na fila de execução
  const execCards = elements.execQueueContainer.children;
  for (let i = 0; i < execCards.length; i++) {
    execCards[i].classList.remove("active-execution");
  }
  
  if (step.highlightQueueIdxs && step.highlightQueueIdxs.length > 0) {
    step.highlightQueueIdxs.forEach(idx => {
      if (execCards[idx]) {
        execCards[idx].classList.add("active-execution");
        // Scroll suave para garantir visibilidade do bloco ativo
        execCards[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }
  
  // 2. Renderizar o grid com o robô
  drawExecutionBoard(currentLevel.grid, step);
  
  // 3. Registrar log no console
  if (step.step === 0) {
    logTerminal(step.message, "sys");
    elements.execOutcomeBadge.style.display = "inline-block";
    elements.execOutcomeBadge.className = "badge";
    elements.execOutcomeBadge.innerText = "INICIANDO";
    elements.execOutcomeBadge.style.background = "rgba(0, 242, 254, 0.2)";
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
        elements.execOutcomeBadge.innerText = "FALHA / BUG";
      }
    }
  }
  
  // Habilita avançar quando atingir o fim da timeline
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
  
  // Configura grid CSS
  elements.boardGrid.style.gridTemplateRows = `repeat(${grid.length}, 50px)`;
  elements.boardGrid.style.gridTemplateColumns = `repeat(${grid[0].length}, 50px)`;
  
  // Rastreia o rastro do robô
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
      } else if (val === "T") {
        cell.classList.add("cell-trap");
        cell.innerText = "💥";
      }
      
      // Desenha o rastro do robô se a célula foi visitada (exceto parede e início)
      if (val !== "#" && val !== "S" && trail.includes(`${r},${c}`)) {
        cell.style.background = "rgba(0, 242, 254, 0.15)";
        cell.style.boxShadow = "inset 0 0 5px rgba(0, 242, 254, 0.3)";
      }
      
      // Desenha o robô na posição atual
      if (r === step.r && c === step.c) {
        const rob = document.createElement("span");
        rob.className = `robot-sprite dir-${step.dir}`;
        
        // Altera sprite caso exploda
        if (step.status === "CRASHED" || step.status === "TRAPPED") {
          rob.innerText = "💥";
        } else if (step.status === "SUCCESS") {
          rob.innerText = "🤖✨";
          rob.style.fontSize = "1.8rem";
        } else {
          rob.innerText = "🤖";
        }
        
        cell.appendChild(rob);
      }
      
      elements.boardGrid.appendChild(cell);
    }
  }
}

// Depurador: Controles de Reprodução

elements.btnDebugPlay.addEventListener("click", () => {
  if (currentStepIdx >= currentTimeline.length - 1) {
    // Reinicia se já estava no fim
    currentStepIdx = 0;
    renderSimulationStep();
  }
  
  if (simInterval) {
    // Pausar
    clearInterval(simInterval);
    simInterval = null;
    elements.btnDebugPlay.innerText = "▶";
    elements.btnDebugPlay.classList.remove("btn-pink");
    elements.btnDebugPlay.classList.add("btn-green");
    logTerminal("Simulação pausada no depurador.", "info");
  } else {
    // Tocar
    elements.btnDebugPlay.innerText = "⏸";
    elements.btnDebugPlay.classList.remove("btn-green");
    elements.btnDebugPlay.classList.add("btn-pink");
    logTerminal("Iniciando reprodução automática dos passos...", "sys");
    
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

// Velocidade mudada dinamicamente
elements.debugSpeed.addEventListener("input", () => {
  if (simInterval) {
    runPlayTimer();
  }
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
    logTerminal(`Avançando 1 comando (Passo ${currentStepIdx}).`, "sys");
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
  logTerminal("DEBUGGER REINICIADO. Estado restaurado.", "sys");
  renderSimulationStep();
});

// Finaliza depuração e abre debate
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

// --- TELA 5: DEBATE & VOTAÇÃO ---

function startDiscussionPhase() {
  const isSuccess = gameState.roundWinner === "PROGRAMMERS";
  
  elements.discussionOutcomeText.innerText = isSuccess 
    ? "BATERIA RECARREGADA: SUCESSO NO ALGORITMO" 
    : "SISTEMA CORROMPIDO: FALHA NO ALGORITMO (BUG)";
    
  elements.discussionOutcomeText.className = isSuccess 
    ? "discussion-outcome success" 
    : "discussion-outcome failure";
    
  // Preenche a lista revelada com autores dos blocos
  elements.revealedQueueList.innerHTML = "";
  
  gameState.commandQueue.forEach((item) => {
    const itemEl = document.createElement("div");
    itemEl.className = "revealed-queue-item";
    
    // Descobre papel secreto do autor para destacar na discussão
    const author = gameState.players.find(p => p.id === item.ownerId);
    const isAuthorProg = author.role === "PROGRAMMER";
    
    itemEl.classList.add(isAuthorProg ? "by-programmer" : "by-saboteur");
    
    itemEl.innerHTML = `
      <div style="font-size: 1.5rem; margin-bottom: 0.3rem;">${item.card.icon}</div>
      <div style="font-weight: 700; font-size: 0.8rem;">${item.card.name}</div>
      <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 0.4rem;">Inserido por:</div>
      <div class="item-owner">${author.name}</div>
      <span class="badge ${isAuthorProg ? 'badge-prog' : 'badge-sab'}" style="font-size: 0.55rem; padding: 0.1rem 0.3rem; margin-top: 0.3rem;">
        ${isAuthorProg ? 'Programador' : 'Sabotador'}
      </span>
    `;
    
    elements.revealedQueueList.appendChild(itemEl);
  });
  
  // Botão para avançar
  const isLastRound = gameState.currentRound >= LEVELS.length;
  elements.btnNextRound.innerText = isLastRound ? "Ver Resultados Finais 🏁" : "Ir para o Próximo Setor ➡️";
  
  showScreen(elements.screenDiscussion);
}

// Botão de Próxima Rodada
elements.btnNextRound.addEventListener("click", () => {
  advanceLevel();
  if (gameState.phase === "ROLE_REVEAL") {
    renderRoleRevealScreen();
  } else if (gameState.phase === "GAME_OVER") {
    renderGameOverScreen();
  }
});

// --- TELA 6: GAME OVER ---

function renderGameOverScreen() {
  const progWins = gameState.scores.programmers > gameState.scores.saboteurs;
  const isDraw = gameState.scores.programmers === gameState.scores.saboteurs;
  
  if (isDraw) {
    elements.finalWinnerText.innerText = "EMPATE NO PROCESSO DE COMPILAÇÃO!";
    elements.finalWinnerText.className = "discussion-outcome text-yellow";
  } else if (progWins) {
    elements.finalWinnerText.innerText = "VITÓRIA DOS PROGRAMADORES!";
    elements.finalWinnerText.className = "discussion-outcome text-green";
  } else {
    elements.finalWinnerText.innerText = "VITÓRIA DOS SABOTADORES!";
    elements.finalWinnerText.className = "discussion-outcome text-pink";
  }
  
  elements.finalScoreProg.innerText = gameState.scores.programmers;
  elements.finalScoreSab.innerText = gameState.scores.saboteurs;
  
  // Mostra identidades secretas
  elements.finalPlayersRolesContainer.innerHTML = "";
  
  gameState.players.forEach(player => {
    const row = document.createElement("div");
    row.className = "final-role-item";
    
    const isProg = player.role === "PROGRAMMER";
    
    row.innerHTML = `
      <span style="font-weight: 700;">${player.name}</span>
      <span class="badge ${isProg ? 'badge-prog' : 'badge-sab'}">${isProg ? 'Programador(a)' : 'Sabotador(a)'}</span>
    `;
    
    elements.finalPlayersRolesContainer.appendChild(row);
  });
  
  showScreen(elements.screenGameOver);
}

elements.btnRestartGame.addEventListener("click", () => {
  gameState.phase = "LOBBY";
  showScreen(elements.screenLobby);
});

// Inicialização do botão do Lobby
updateLobbyButtons();
