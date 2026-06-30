// Interpretador e Motor de Simulação do AlgoBot
// Processa a fila de comandos e gera a linha do tempo (timeline) de execução.

const DIR_VECTORS = {
  UP: { dr: -1, dc: 0, symbol: "▲" },
  RIGHT: { dr: 0, dc: 1, symbol: "▶" },
  DOWN: { dr: 1, dc: 0, symbol: "▼" },
  LEFT: { dr: 0, dc: -1, symbol: "◀" }
};

const DIRS = ["UP", "RIGHT", "DOWN", "LEFT"];

function rotateLeft(dir) {
  let idx = DIRS.indexOf(dir);
  return DIRS[(idx + 3) % 4];
}

function rotateRight(dir) {
  let idx = DIRS.indexOf(dir);
  return DIRS[(idx + 1) % 4];
}

function getNextPosition(pos, dir) {
  const vec = DIR_VECTORS[dir];
  return { r: pos.r + vec.dr, c: pos.c + vec.dc };
}

// Verifica colisão ou tipo de célula
function checkCell(grid, pos) {
  if (pos.r < 0 || pos.r >= grid.length || pos.c < 0 || pos.c >= grid[0].length) {
    return "OUT_OF_BOUNDS";
  }
  return grid[pos.r][pos.c];
}

// Simula a fila de comandos no nível atual
// Retorna: { timeline: Array, success: boolean, finalStatus: string }
function runSimulation(level, commandQueue) {
  const grid = level.grid;
  
  let robotPos = { ...level.startPos };
  let robotDir = level.startDir;
  
  // A timeline guarda o estado do robô a cada instante
  // Cada entrada: { step, r, c, dir, activeCardId, status, message, highlightQueueIdxs: [] }
  const timeline = [];
  
  // Estado inicial
  timeline.push({
    step: 0,
    r: robotPos.r,
    c: robotPos.c,
    dir: robotDir,
    activeCardId: null,
    status: "START",
    message: "Iniciando AlgoBot na posição de partida.",
    highlightQueueIdxs: []
  });
  
  let qIdx = 0;
  let stepCounter = 1;
  let currentStatus = "RUNNING"; // RUNNING, SUCCESS, CRASHED, TRAPPED, OUT_OF_COMMANDS
  
  // Função auxiliar para processar uma única instrução atômica
  function executeAtomicCommand(cardId, cardIdx, loopInfo = null, isCond = false) {
    const highlightIdxs = [cardIdx];
    if (loopInfo) highlightIdxs.push(loopInfo.loopIdx);
    if (isCond) highlightIdxs.push(cardIdx - 1); // Destaca a condicional também
    
    if (cardId === "forward") {
      const nextPos = getNextPosition(robotPos, robotDir);
      const cell = checkCell(grid, nextPos);
      
      robotPos = nextPos;
      
      let msg = `Comando: Mover Frente. `;
      if (loopInfo) msg = `[Repetição ${loopInfo.current}/${loopInfo.total}] ` + msg;
      
      if (cell === "#" || cell === "OUT_OF_BOUNDS") {
        currentStatus = "CRASHED";
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          activeCardId: cardId,
          status: currentStatus,
          message: msg + "💥 COLISÃO! O robô bateu na parede.",
          highlightQueueIdxs: highlightIdxs
        });
        return false;
      } else if (cell === "T") {
        currentStatus = "TRAPPED";
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          activeCardId: cardId,
          status: currentStatus,
          message: msg + "⚡ CURTO-CIRCUITO! O robô caiu em uma armadilha de laser.",
          highlightQueueIdxs: highlightIdxs
        });
        return false;
      } else if (cell === "G") {
        currentStatus = "SUCCESS";
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          activeCardId: cardId,
          status: currentStatus,
          message: msg + "🏁 SUCESSO! AlgoBot carregou sua bateria na meta!",
          highlightQueueIdxs: highlightIdxs
        });
        return false;
      } else {
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          activeCardId: cardId,
          status: "RUNNING",
          message: msg + `Robô avançou para linha ${robotPos.r + 1}, coluna ${robotPos.c + 1}.`,
          highlightQueueIdxs: highlightIdxs
        });
        return true;
      }
    } else if (cardId === "left") {
      robotDir = rotateLeft(robotDir);
      let msg = `Comando: Virar Esquerda. `;
      if (loopInfo) msg = `[Repetição ${loopInfo.current}/${loopInfo.total}] ` + msg;
      
      timeline.push({
        step: stepCounter++,
        r: robotPos.r,
        c: robotPos.c,
        dir: robotDir,
        activeCardId: cardId,
        status: "RUNNING",
        message: msg + `Direção alterada para ${DIR_VECTORS[robotDir].symbol} (${robotDir}).`,
        highlightQueueIdxs: highlightIdxs
      });
      return true;
    } else if (cardId === "right") {
      robotDir = rotateRight(robotDir);
      let msg = `Comando: Virar Direita. `;
      if (loopInfo) msg = `[Repetição ${loopInfo.current}/${loopInfo.total}] ` + msg;
      
      timeline.push({
        step: stepCounter++,
        r: robotPos.r,
        c: robotPos.c,
        dir: robotDir,
        activeCardId: cardId,
        status: "RUNNING",
        message: msg + `Direção alterada para ${DIR_VECTORS[robotDir].symbol} (${robotDir}).`,
        highlightQueueIdxs: highlightIdxs
      });
      return true;
    }
    
    return true;
  }
  
  // Loop de simulação principal
  while (qIdx < commandQueue.length && currentStatus === "RUNNING") {
    const item = commandQueue[qIdx];
    const card = item.card;
    
    if (card.id === "forward" || card.id === "left" || card.id === "right") {
      executeAtomicCommand(card.id, qIdx);
      qIdx++;
    } else if (card.id.startsWith("loop")) {
      const repeats = parseInt(card.id.split("_")[1], 10);
      const nextItem = commandQueue[qIdx + 1];
      
      if (!nextItem) {
        // Nada para repetir
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          activeCardId: card.id,
          status: "RUNNING",
          message: `Estrutura Loop [${card.name}] vazia: nenhum comando subsequente.`,
          highlightQueueIdxs: [qIdx]
        });
        qIdx++;
      } else if (nextItem.card.type !== "command" || nextItem.card.id.startsWith("loop") || nextItem.card.id.startsWith("if")) {
        // Regra pedagógica: Loops só repetem movimentos/curvas básicos no nosso interpretador simples
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          activeCardId: card.id,
          status: "RUNNING",
          message: `Aviso de Sintaxe: O Loop só pode repetir comandos básicos de movimento. Bloco ignorado.`,
          highlightQueueIdxs: [qIdx, qIdx + 1]
        });
        qIdx += 2; // Pula o loop e o bloco inválido
      } else {
        // Executa o loop
        let loopContinues = true;
        for (let iter = 1; iter <= repeats && loopContinues && currentStatus === "RUNNING"; iter++) {
          loopContinues = executeAtomicCommand(nextItem.card.id, qIdx + 1, {
            loopIdx: qIdx,
            current: iter,
            total: repeats
          });
        }
        qIdx += 2; // Pula o loop e a instrução que foi repetida
      }
    } else if (card.id === "if_clear_forward") {
      const nextItem = commandQueue[qIdx + 1];
      
      if (!nextItem) {
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          activeCardId: card.id,
          status: "RUNNING",
          message: `Estrutura Condicional vazia: nenhuma instrução a seguir.`,
          highlightQueueIdxs: [qIdx]
        });
        qIdx++;
      } else {
        const checkPos = getNextPosition(robotPos, robotDir);
        const nextCell = checkCell(grid, checkPos);
        const isClear = (nextCell !== "#" && nextCell !== "OUT_OF_BOUNDS");
        
        if (isClear) {
          timeline.push({
            step: stepCounter++,
            r: robotPos.r,
            c: robotPos.c,
            dir: robotDir,
            activeCardId: card.id,
            status: "RUNNING",
            message: `Condicional: Frente livre. Executando o próximo bloco: ${nextItem.card.name}.`,
            highlightQueueIdxs: [qIdx, qIdx + 1]
          });
          executeAtomicCommand(nextItem.card.id, qIdx + 1, null, true);
        } else {
          timeline.push({
            step: stepCounter++,
            r: robotPos.r,
            c: robotPos.c,
            dir: robotDir,
            activeCardId: card.id,
            status: "RUNNING",
            message: `Condicional: Frente obstruída! Pulando o comando: ${nextItem.card.name}.`,
            highlightQueueIdxs: [qIdx, qIdx + 1]
          });
        }
        qIdx += 2;
      }
    }
  }
  
  // Se finalizou a fila sem sucesso ou falhas fatais, verifica se terminou na meta
  if (currentStatus === "RUNNING") {
    const finalCell = grid[robotPos.r][robotPos.c];
    if (finalCell === "G") {
      currentStatus = "SUCCESS";
      timeline.push({
        step: stepCounter++,
        r: robotPos.r,
        c: robotPos.c,
        dir: robotDir,
        status: currentStatus,
        message: "🏁 SUCESSO! O robô parou exatamente na Bateria!",
        highlightQueueIdxs: []
      });
    } else {
      currentStatus = "OUT_OF_COMMANDS";
      timeline.push({
        step: stepCounter++,
        r: robotPos.r,
        c: robotPos.c,
        dir: robotDir,
        status: currentStatus,
        message: "❌ SEM COMANDOS! A fila de execução acabou e o AlgoBot não alcançou a meta.",
        highlightQueueIdxs: []
      });
    }
  }
  
  return {
    timeline: timeline,
    success: currentStatus === "SUCCESS",
    finalStatus: currentStatus
  };
}

if (typeof module !== 'undefined') {
  module.exports = { runSimulation, DIR_VECTORS, DIRS };
}
