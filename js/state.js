// Gerenciador de Estado do Jogo SyntaxError
// Gerencia os 5 papéis, cartas, turnos e habilidades ativas.

const ROLES = {
  PROGRAMMER: {
    id: "PROGRAMMER",
    name: "Programador(a)",
    description: "Objetivo: Ajudar o AlgoBot a escapar. Habilidade: 'Refatorar Rota' - Pode inverter o sentido de uma curva na fila (Esquerda <-> Direita) sem gastar cartas.",
    color: "#00ff66",
    team: "PROGRAMMERS"
  },
  DEBUGGER: {
    id: "DEBUGGER",
    name: "Debugger",
    description: "Objetivo: Ajudar o AlgoBot a escapar. Habilidade: 'Remover Bug' - Pode remover o último bloco inserido na fila de comandos para corrigir o fluxo.",
    color: "#00f2fe",
    team: "PROGRAMMERS"
  },
  ANALYST: {
    id: "ANALYST",
    name: "Analista",
    description: "Objetivo: Ajudar o AlgoBot a escapar. Habilidade: 'Inspecionar Fila' - Pode pecar e visualizar secretamente o comando de um bloco oculto na fila.",
    color: "#9d4edd",
    team: "PROGRAMMERS"
  },
  CORRUPTED_AI: {
    id: "CORRUPTED_AI",
    name: "IA Corrompida",
    description: "Objetivo: Sabotar o robô fazendo-o colidir, cair em lasers ou estourar a memória. Habilidade: 'Corromper Memória' - Pode trocar a posição de dois comandos adjacentes na fila de forma oculta.",
    color: "#ff0055",
    team: "SABOTEURS"
  },
  HACKER: {
    id: "HACKER",
    name: "Hacker",
    description: "Objetivo: Impedir o sucesso dos programadores. Habilidade: 'Injetar Payload' - Insere um bloco na fila com proteção de criptografia, impedindo que o Analista o inspecione.",
    color: "#fefe33",
    team: "SABOTEURS"
  }
};

const CARD_TYPES = {
  // Comandos Básicos
  FORWARD: { id: "forward", name: "Mover Frente", type: "command", desc: "Avança 1 casa na direção atual", icon: "➡️" },
  LEFT: { id: "left", name: "Virar Esquerda", type: "command", desc: "Gira 90° à esquerda", icon: "↩️" },
  RIGHT: { id: "right", name: "Virar Direita", type: "command", desc: "Gira 90° à direita", icon: "↪️" },
  
  // Comandos Avançados (Grid)
  COLLECT_KEY: { id: "collect_key", name: "Coletar Dados", type: "command", desc: "Pega a chave física (K) sob a posição do robô", icon: "🔑" },
  OPEN_DOOR: { id: "open_door", name: "Desbloquear Porta", type: "command", desc: "Consome uma chave para abrir porta (D) à frente", icon: "🔓" },
  SWITCH_LASER: { id: "switch_laser", name: "Interromper Laser", type: "command", desc: "Pressiona o botão (B) sob o robô, ativando/desativando lasers (T)", icon: "🔘" },
  
  // Comandos de Controle (Loops & IF)
  LOOP_2: { id: "loop_2", name: "Loop For 2x", type: "command", desc: "Repete a instrução seguinte 2 vezes", icon: "🔁x2" },
  LOOP_3: { id: "loop_3", name: "Loop For 3x", type: "command", desc: "Repete a instrução seguinte 3 vezes", icon: "🔁x3" },
  LOOP_4: { id: "loop_4", name: "Loop For 4x", type: "command", desc: "Repete a instrução seguinte 4 vezes", icon: "🔁x4" },
  LOOP_6: { id: "loop_6", name: "Loop For 6x", type: "command", desc: "Repete a instrução seguinte 6 vezes", icon: "🔁x6" },
  IF_CLEAR: { id: "if_clear_forward", name: "Se Frente Livre", type: "command", desc: "Executa a instrução seguinte apenas se a frente estiver limpa", icon: "❓" },
  
  // Cartas de Ações Especiais (Mesa)
  REVEAL: { id: "reveal_card", name: "Scanner de Bloco", type: "action", desc: "Revela publicamente um bloco oculto na fila", icon: "👁️" },
  DELETE: { id: "delete_card", name: "Depurar Linha", type: "action", desc: "Remove um bloco qualquer da fila de comandos", icon: "🗑️" },
  INVERT: { id: "invert_card", name: "Refatorar Curva", type: "action", desc: "Altera uma curva de esquerda para direita ou vice-versa", icon: "🔄" }
};

// Baralho mestre de distribuição
const BASE_DECK = [
  ...Array(20).fill("FORWARD"),
  ...Array(12).fill("LEFT"),
  ...Array(12).fill("RIGHT"),
  ...Array(4).fill("COLLECT_KEY"),
  ...Array(4).fill("OPEN_DOOR"),
  ...Array(4).fill("SWITCH_LASER"),
  ...Array(3).fill("LOOP_2"),
  ...Array(2).fill("LOOP_3"),
  ...Array(1).fill("LOOP_4"),
  ...Array(1).fill("LOOP_6"),
  ...Array(3).fill("IF_CLEAR"),
  ...Array(2).fill("REVEAL"),
  ...Array(2).fill("DELETE"),
  ...Array(2).fill("INVERT")
];

const gameState = {
  players: [],
  deck: [],
  commandQueue: [], // Array de { id, card, ownerName, ownerId, isHidden, isProtected, revealed }
  functionQueue: [], // Garantia de inicialização global
  currentLevelIndex: 0,
  currentRound: 1,
  activePlayerIndex: 0,
  phase: "LOBBY", // LOBBY, ROLE_REVEAL, PLAYING, EXECUTION, DISCUSSION, GAME_OVER
  actionLog: [],
  roundWinner: null
};

// Gera UUID para os itens na fila
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Embaralhador Fisher-Yates
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

function setupGame(names) {
  gameState.players = names.map((name, index) => ({
    id: index,
    name: name,
    role: null,
    hand: [],
    skillUsed: false, // Controla uso de habilidade por rodada
    hiddenCardsPlayed: 0, // Quantidade de cartas ocultas jogadas na rodada
    score: 0 // Pontuação individual
  }));
  
  gameState.currentLevelIndex = 0;
  gameState.currentRound = 1;
  
  startRound();
}

function startRound() {
  gameState.commandQueue = [];
  gameState.actionLog = [];
  gameState.roundWinner = null;
  gameState.phase = "ROLE_REVEAL";
  gameState.activePlayerIndex = 0;
  
  // 1. Distribuir papéis de acordo com número de jogadores
  const count = gameState.players.length;
  let rolesPool = [];
  
  if (count === 3) {
    rolesPool = ["PROGRAMMER", "DEBUGGER", "CORRUPTED_AI"];
  } else if (count === 4) {
    rolesPool = ["PROGRAMMER", "DEBUGGER", "ANALYST", "CORRUPTED_AI"];
  } else if (count === 5) {
    rolesPool = ["PROGRAMMER", "DEBUGGER", "ANALYST", "CORRUPTED_AI", "HACKER"];
  } else {
    // 6 jogadores
    rolesPool = ["PROGRAMMER", "DEBUGGER", "ANALYST", "PROGRAMMER", "CORRUPTED_AI", "HACKER"];
  }
  
  shuffle(rolesPool);
  
  gameState.players.forEach((player, i) => {
    player.role = rolesPool[i];
    player.hand = [];
    player.skillUsed = false; // Reseta habilidade
    player.hiddenCardsPlayed = 0; // Reseta limite de cartas ocultas
  });
  
  // 2. Filtrar baralho pelas regras do nível atual
  gameState.deck = [];
  const level = LEVELS[gameState.currentLevelIndex];
  
  BASE_DECK.forEach(key => {
    const card = CARD_TYPES[key];
    if (card.type === "command") {
      const isAllowed = level.allowedBlocks.some(b => {
        if (b === card.id) return true;
        if (b.startsWith("loop") && card.id.startsWith("loop")) return true;
        return false;
      });
      if (isAllowed) gameState.deck.push(key);
    } else {
      gameState.deck.push(key);
    }
  });
  
  shuffle(gameState.deck);
  
  // Distribui 5 cartas
  gameState.players.forEach(player => {
    for (let i = 0; i < 5; i++) {
      if (gameState.deck.length > 0) {
        player.hand.push(CARD_TYPES[gameState.deck.pop()]);
      }
    }
  });
  
  logAction(`Setor ${level.id} carregado. Sistema de criptografia ativado.`);
}

function logAction(msg) {
  gameState.actionLog.push({
    time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
    message: msg
  });
  if (gameState.actionLog.length > 30) gameState.actionLog.shift();
}

function endTurn() {
  gameState.activePlayerIndex = (gameState.activePlayerIndex + 1) % gameState.players.length;
  
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  while (activePlayer.hand.length < 5 && gameState.deck.length > 0) {
    activePlayer.hand.push(CARD_TYPES[gameState.deck.pop()]);
  }
}

function playCommandCard(playerIndex, cardIndex, isHidden) {
  const player = gameState.players[playerIndex];
  const card = player.hand[cardIndex];
  
  if (!card || card.type !== "command") return false;
  
  player.hand.splice(cardIndex, 1);
  
  if (isHidden) {
    player.hiddenCardsPlayed++;
  }
  
  gameState.commandQueue.push({
    id: generateId(),
    card: card,
    ownerName: player.name,
    ownerId: player.id,
    isHidden: isHidden,
    isProtected: false, // Proteção especial do Hacker
    revealed: !isHidden
  });
  
  logAction(`${player.name} enviou uma instrução ${isHidden ? 'criptografada' : 'aberta (' + card.name + ')'} para a fila.`);
  endTurn();
  return true;
}

function playActionCard(playerIndex, cardIndex, actionData) {
  const player = gameState.players[playerIndex];
  const card = player.hand[cardIndex];
  
  if (!card || card.type !== "action") return false;
  
  let success = false;
  const targetIdx = gameState.commandQueue.findIndex(item => item.id === actionData.targetId);
  if (targetIdx === -1) return false;
  
  const target = gameState.commandQueue[targetIdx];
  
  if (card.id === "reveal_card") {
    if (target.isHidden) {
      target.revealed = true;
      logAction(`${player.name} rodou um Scanner e descriptografou o bloco de ${target.ownerName}: "${target.card.name}".`);
      success = true;
    }
  } else if (card.id === "delete_card") {
    logAction(`${player.name} forçou uma Depuração e removeu o comando "${target.card.name}" na linha ${targetIdx + 1}.`);
    gameState.commandQueue.splice(targetIdx, 1);
    success = true;
  } else if (card.id === "invert_card") {
    if (target.card.id === "left") {
      target.card = CARD_TYPES.RIGHT;
      logAction(`${player.name} alterou a curvatura de ${target.ownerName} para "Virar Direita".`);
      success = true;
    } else if (target.card.id === "right") {
      target.card = CARD_TYPES.LEFT;
      logAction(`${player.name} alterou a curvatura de ${target.ownerName} para "Virar Esquerda".`);
      success = true;
    }
  }
  
  if (success) {
    player.hand.splice(cardIndex, 1);
    endTurn();
    return true;
  }
  return false;
}

function discardCard(playerIndex, cardIndex) {
  const player = gameState.players[playerIndex];
  if (player.hand[cardIndex]) {
    const card = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);
    logAction(`${player.name} limpou cache descartando um card.`);
    endTurn();
    return true;
  }
  return false;
}

// EXECUÇÃO DAS HABILIDADES DE PAPEL
function useClassSkill(playerIndex, skillData) {
  const player = gameState.players[playerIndex];
  if (player.skillUsed) return { success: false, msg: "Sua habilidade especial já foi utilizada nesta rodada." };
  
  const roleId = player.role;
  let success = false;
  let msg = "";
  
  if (roleId === "PROGRAMMER") {
    // Inverter rota de um comando de curva na fila
    const target = gameState.commandQueue.find(item => item.id === skillData.targetId);
    if (target && (target.card.id === "left" || target.card.id === "right")) {
      target.card = target.card.id === "left" ? CARD_TYPES.RIGHT : CARD_TYPES.LEFT;
      msg = `${player.name} (Programador) usou Refatorar Rota e inverteu a curva de ${target.ownerName}.`;
      success = true;
    } else {
      return { success: false, msg: "Selecione uma instrução de curva (Esquerda ou Direita) na fila." };
    }
  } 
  
  else if (roleId === "DEBUGGER") {
    // Remover qualquer bloco selecionado na fila
    const target = gameState.commandQueue.find(item => item.id === skillData.targetId);
    if (target) {
      if (target.isProtected) {
        return { success: false, msg: "Acesso Negado! Esse bloco está sob proteção criptográfica do Hacker." };
      }
      const idx = gameState.commandQueue.indexOf(target);
      gameState.commandQueue.splice(idx, 1);
      msg = `${player.name} (Debugger) usou Remover Bug e deletou o comando "${target.card.name}" na linha ${idx + 1}.`;
      success = true;
    } else {
      return { success: false, msg: "Selecione uma instrução da fila para depurar." };
    }
  } 
  
  else if (roleId === "ANALYST") {
    // Inspecionar secretamente um bloco oculto na fila
    const target = gameState.commandQueue.find(item => item.id === skillData.targetId);
    if (target && target.isHidden) {
      if (target.isProtected) {
        return { success: false, msg: "Acesso Negado! Esse bloco está sob proteção criptográfica avançada (Payload Hacker)." };
      }
      msg = `INSPEÇÃO (Secreta): O bloco oculto contém "${target.card.name}".`;
      // Registra no log do Analista, mas não publica no log público geral com o valor do card
      logAction(`${player.name} (Analista) inspecionou um bloco oculto na fila.`);
      success = true;
      player.skillUsed = true;
      return { success: true, secretMsg: msg };
    } else {
      return { success: false, msg: "Selecione um bloco oculto na fila." };
    }
  } 
  
  else if (roleId === "CORRUPTED_AI") {
    // Trocar posição de dois comandos adjacentes na fila
    const idx1 = gameState.commandQueue.findIndex(item => item.id === skillData.targetId1);
    const idx2 = gameState.commandQueue.findIndex(item => item.id === skillData.targetId2);
    if (idx1 !== -1 && idx2 !== -1 && Math.abs(idx1 - idx2) === 1) {
      const temp = gameState.commandQueue[idx1];
      gameState.commandQueue[idx1] = gameState.commandQueue[idx2];
      gameState.commandQueue[idx2] = temp;
      msg = `HELENA IA Corrompida reorganizou os registradores da fila de execução.`;
      logAction(msg);
      success = true;
    } else {
      return { success: false, msg: "Selecione dois comandos adjacentes (vizinhos)." };
    }
  } 
  
  else if (roleId === "HACKER") {
    // Injetar payload: Insere um comando oculto e protegido da mão
    const cardIdx = skillData.handCardIdx;
    const card = player.hand[cardIdx];
    if (card && card.type === "command") {
      player.hand.splice(cardIdx, 1);
      gameState.commandQueue.push({
        id: generateId(),
        card: card,
        ownerName: player.name,
        ownerId: player.id,
        isHidden: true,
        isProtected: true, // Protege contra inspeção do analista
        revealed: false
      });
      msg = `${player.name} (Hacker) injetou um Payload criptografado na fila.`;
      logAction(msg);
      success = true;
      endTurn();
    } else {
      return { success: false, msg: "Selecione uma carta de comando válida na sua mão." };
    }
  }
  
  if (success) {
    player.skillUsed = true;
    return { success: true, msg: msg };
  }
  
  return { success: false, msg: "Falha ao ativar habilidade especial." };
}

function declareRoundWinner(winnerGroup) {
  gameState.roundWinner = winnerGroup;
  
  if (winnerGroup === "PROGRAMMERS") {
    logAction("Terminal de Fuga Desbloqueado! Ponto para os Programadores.");
    gameState.players.forEach(player => {
      const isProg = player.role === "PROGRAMMER" || player.role === "DEBUGGER" || player.role === "ANALYST";
      if (isProg) {
        player.score = (player.score || 0) + 1;
      }
    });
  } else {
    logAction("Conexão corrompida. Ponto para a IA HELENA / Sabotadores.");
    gameState.players.forEach(player => {
      const isSab = player.role === "CORRUPTED_AI" || player.role === "HACKER";
      if (isSab) {
        player.score = (player.score || 0) + 1;
      }
    });
  }
  gameState.phase = "DISCUSSION";
}

function advanceLevel() {
  if (gameState.currentLevelIndex < LEVELS.length - 1) {
    gameState.currentLevelIndex++;
    gameState.currentRound++;
    startRound();
  } else {
    gameState.phase = "GAME_OVER";
    logAction("Fuga concluída! O destino do Data Center foi decidido.");
  }
}

if (typeof module !== 'undefined') {
  module.exports = { gameState, setupGame, startRound, playCommandCard, playActionCard, discardCard, useClassSkill, declareRoundWinner, advanceLevel, ROLES, CARD_TYPES };
}
