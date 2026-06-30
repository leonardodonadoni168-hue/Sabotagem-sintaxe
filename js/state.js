// Gerenciador de Estado do Jogo AlgoBot
// Controla jogadores, papéis secretos, cartas e fluxo de turnos.

const ROLES = {
  PROGRAMMER: {
    name: "Programador(a)",
    description: "Seu objetivo é guiar o AlgoBot com sucesso até a bateria final (Meta). Cuidado com os sabotadores!",
    color: "#00ff66"
  },
  SABOTEUR: {
    name: "Sabotador(a)",
    description: "Seu objetivo é impedir que o AlgoBot chegue na bateria. Faça-o colidir, cair em lasers ou ficar sem comandos!",
    color: "#ff0055"
  }
};

const CARD_TYPES = {
  // Comandos
  FORWARD: { id: "forward", name: "Mover Frente", type: "command", desc: "Anda 1 casa para frente", icon: "➡️" },
  LEFT: { id: "left", name: "Virar Esquerda", type: "command", desc: "Gira 90° para a esquerda", icon: "↩️" },
  RIGHT: { id: "right", name: "Virar Direita", type: "command", desc: "Gira 90° para a direita", icon: "↪️" },
  LOOP_2: { id: "loop_2", name: "Repetir 2x", type: "command", desc: "Repete o comando seguinte 2 vezes", icon: "🔁x2" },
  LOOP_3: { id: "loop_3", name: "Repetir 3x", type: "command", desc: "Repete o comando seguinte 3 vezes", icon: "🔁x3" },
  IF_CLEAR: { id: "if_clear_forward", name: "Se Frente Livre", type: "command", desc: "Executa o próximo comando se não houver parede à frente", icon: "❓" },
  
  // Ações
  REVEAL: { id: "reveal_card", name: "Scanner de Bloco", type: "action", desc: "Revela um bloco oculto na fila de comandos", icon: "👁️" },
  DELETE: { id: "delete_card", name: "Depurar (Deletar)", type: "action", desc: "Remove um bloco qualquer da fila de comandos", icon: "🗑️" },
  INVERT: { id: "invert_card", name: "Refatorar Rota", type: "action", desc: "Altera uma curva à esquerda para direita ou vice-versa", icon: "🔄" }
};

// Deck inicial genérico que será embaralhado
const BASE_DECK = [
  ...Array(12).fill("FORWARD"),
  ...Array(8).fill("LEFT"),
  ...Array(8).fill("RIGHT"),
  ...Array(4).fill("LOOP_2"),
  ...Array(2).fill("LOOP_3"),
  ...Array(4).fill("IF_CLEAR"),
  ...Array(3).fill("REVEAL"),
  ...Array(3).fill("DELETE"),
  ...Array(2).fill("INVERT")
];

const gameState = {
  players: [],
  roles: [],
  deck: [],
  commandQueue: [], // Array de { card: CARD_TYPE, ownerName: string, isHidden: boolean, id: string }
  currentLevelIndex: 0,
  currentRound: 1,
  activePlayerIndex: 0,
  phase: "LOBBY", // LOBBY, ROLE_REVEAL, PLAYING, EXECUTION, DISCUSSION, GAME_OVER
  scores: { programmers: 0, saboteurs: 0 },
  gameHistory: [],
  actionLog: [], // Eventos da rodada atual para exibir no console do jogo
  revealedRoles: false,
  roundWinner: null
};

// Gera UUID simples para os blocos na fila
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Embaralha array
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Inicializar o jogo com jogadores
function setupGame(names) {
  gameState.players = names.map((name, index) => ({
    id: index,
    name: name,
    role: null,
    hand: []
  }));
  
  gameState.currentLevelIndex = 0;
  gameState.currentRound = 1;
  gameState.scores = { programmers: 0, saboteurs: 0 };
  gameState.gameHistory = [];
  
  startRound();
}

// Inicia uma nova rodada
function startRound() {
  gameState.commandQueue = [];
  gameState.actionLog = [];
  gameState.roundWinner = null;
  gameState.phase = "ROLE_REVEAL";
  gameState.activePlayerIndex = 0;
  gameState.revealedRoles = false;
  
  // 1. Distribuir funções
  const count = gameState.players.length;
  let saboteursCount = 1;
  if (count >= 5) saboteursCount = 2;
  
  const rolesList = [];
  for (let i = 0; i < saboteursCount; i++) rolesList.push("SABOTEUR");
  for (let i = saboteursCount; i < count; i++) rolesList.push("PROGRAMMER");
  
  shuffle(rolesList);
  
  gameState.players.forEach((player, i) => {
    player.role = rolesList[i];
    player.hand = [];
  });
  
  // 2. Preparar baralho
  gameState.deck = [];
  BASE_DECK.forEach(key => {
    // Filtra blocos baseados no nível se necessário
    const card = CARD_TYPES[key];
    const level = LEVELS[gameState.currentLevelIndex];
    if (card.type === "command") {
      // Verifica se o bloco é permitido no nível
      const isAllowed = level.allowedBlocks.some(b => {
        if (b === card.id) return true;
        if (b.startsWith("loop") && card.id.startsWith("loop")) return true;
        return false;
      });
      if (isAllowed) gameState.deck.push(key);
    } else {
      // Cartas de ação sempre permitidas
      gameState.deck.push(key);
    }
  });
  
  shuffle(gameState.deck);
  
  // Distribuir 5 cartas para cada jogador
  gameState.players.forEach(player => {
    for (let i = 0; i < 5; i++) {
      if (gameState.deck.length > 0) {
        player.hand.push(CARD_TYPES[gameState.deck.pop()]);
      }
    }
  });
  
  logAction("Rodada " + gameState.currentRound + " iniciada! Nível: " + LEVELS[gameState.currentLevelIndex].name);
}

// Registra logs
function logAction(msg) {
  gameState.actionLog.push({
    time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
    message: msg
  });
  if (gameState.actionLog.length > 40) gameState.actionLog.shift();
}

// Avança o turno
function endTurn() {
  gameState.activePlayerIndex = (gameState.activePlayerIndex + 1) % gameState.players.length;
  
  // Garante que o jogador compre carta até ter 5, se houver deck
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  while (activePlayer.hand.length < 5 && gameState.deck.length > 0) {
    activePlayer.hand.push(CARD_TYPES[gameState.deck.pop()]);
  }
}

// Joga comando
function playCommandCard(playerIndex, cardIndex, isHidden) {
  const player = gameState.players[playerIndex];
  const card = player.hand[cardIndex];
  
  if (!card || card.type !== "command") return false;
  
  // Remove da mão
  player.hand.splice(cardIndex, 1);
  
  // Adiciona na fila
  gameState.commandQueue.push({
    id: generateId(),
    card: card,
    ownerName: player.name,
    ownerId: player.id,
    isHidden: isHidden,
    revealed: !isHidden
  });
  
  logAction(`${player.name} inseriu um comando na fila (${isHidden ? "Oculto" : card.name}).`);
  
  endTurn();
  return true;
}

// Joga ação
function playActionCard(playerIndex, cardIndex, actionData) {
  const player = gameState.players[playerIndex];
  const card = player.hand[cardIndex];
  
  if (!card || card.type !== "action") return false;
  
  let success = false;
  
  if (card.id === "reveal_card") {
    // actionData.targetId é o ID do comando na fila
    const target = gameState.commandQueue.find(item => item.id === actionData.targetId);
    if (target && target.isHidden) {
      target.revealed = true;
      logAction(`${player.name} usou Scanner e revelou que o bloco de ${target.ownerName} é "${target.card.name}".`);
      success = true;
    }
  } else if (card.id === "delete_card") {
    // Remove o comando com o ID fornecido
    const idx = gameState.commandQueue.findIndex(item => item.id === actionData.targetId);
    if (idx !== -1) {
      const removed = gameState.commandQueue[idx];
      logAction(`${player.name} usou Depurar e deletou o bloco de ${removed.ownerName} na posição ${idx + 1}.`);
      gameState.commandQueue.splice(idx, 1);
      success = true;
    }
  } else if (card.id === "invert_card") {
    // Converte esquerda <-> direita
    const target = gameState.commandQueue.find(item => item.id === actionData.targetId);
    if (target) {
      if (target.card.id === "left") {
        target.card = CARD_TYPES.RIGHT;
        logAction(`${player.name} inverteu o comando de ${target.ownerName} para "Virar Direita".`);
        success = true;
      } else if (target.card.id === "right") {
        target.card = CARD_TYPES.LEFT;
        logAction(`${player.name} inverteu o comando de ${target.ownerName} para "Virar Esquerda".`);
        success = true;
      }
    }
  }
  
  if (success) {
    // Remove da mão e finaliza o turno
    player.hand.splice(cardIndex, 1);
    endTurn();
    return true;
  }
  return false;
}

// Descarta uma carta e encerra o turno
function discardCard(playerIndex, cardIndex) {
  const player = gameState.players[playerIndex];
  if (player.hand[cardIndex]) {
    const card = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);
    logAction(`${player.name} descartou uma carta.`);
    endTurn();
    return true;
  }
  return false;
}

// Completa a rodada com a vitória de um grupo
function declareRoundWinner(winnerGroup) {
  gameState.roundWinner = winnerGroup;
  if (winnerGroup === "PROGRAMMERS") {
    gameState.scores.programmers++;
    logAction("FIM DA RODADA: O AlgoBot alcançou a Bateria! Ponto para os Programadores.");
  } else {
    gameState.scores.saboteurs++;
    logAction("FIM DA RODADA: O AlgoBot falhou na execução! Ponto para os Sabotadores.");
  }
  
  gameState.phase = "DISCUSSION";
}

// Configura o próximo nível ou encerra o jogo
function advanceLevel() {
  if (gameState.currentLevelIndex < LEVELS.length - 1) {
    gameState.currentLevelIndex++;
    gameState.currentRound++;
    startRound();
  } else {
    gameState.phase = "GAME_OVER";
    logAction("O JOGO TERMINOU! O robô passou por todos os setores de teste.");
  }
}

if (typeof module !== 'undefined') {
  module.exports = { gameState, setupGame, startRound, playCommandCard, playActionCard, discardCard, declareRoundWinner, advanceLevel, ROLES, CARD_TYPES };
}
