// Interpretador e Motor de Simulação Avançado do SyntaxError
// Executa o compilador, interpretando laços, condicionais, chaves, portas e funções.

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

function checkCell(grid, pos) {
  if (pos.r < 0 || pos.r >= grid.length || pos.c < 0 || pos.c >= grid[0].length) {
    return "OUT_OF_BOUNDS";
  }
  return grid[pos.r][pos.c];
}

// Simulação estendida do SyntaxError
function runSimulation(level, commandQueue, functionQueue = []) {
  // Clona o grid original para poder alterá-lo (pegar chaves, abrir portas)
  const grid = level.grid.map(row => [...row]);
  
  let robotPos = { ...level.startPos };
  let robotDir = level.startDir;
  let keysCollected = 0;
  let lasersDisabled = false;
  
  const timeline = [];
  let stepCounter = 0;
  let currentStatus = "RUNNING"; // RUNNING, SUCCESS, CRASHED, TRAPPED, OUT_OF_COMMANDS
  
  // Estado Inicial (Passo 0)
  timeline.push({
    step: stepCounter++,
    r: robotPos.r,
    c: robotPos.c,
    dir: robotDir,
    keysCollected: keysCollected,
    lasersDisabled: lasersDisabled,
    activeCardId: null,
    status: "START",
    message: "Iniciando compilação de rotina do AlgoBot.",
    highlightQueueIdxs: [],
    highlightFuncIdxs: [],
    gridState: grid.map(row => [...row])
  });
  
  // Executa uma instrução básica
  // Retorna true se a execução continua, false se houve colisão ou falha crítica.
  function executeAtomicCommand(cardId, cardIdx, isFunc = false, funcIdx = null, loopInfo = null, isCond = false) {
    const highlightQueue = isFunc ? [] : [cardIdx];
    const highlightFunc = isFunc ? [funcIdx] : [];
    
    if (loopInfo) {
      if (loopInfo.isFunc) highlightFunc.push(loopInfo.loopIdx);
      else highlightQueue.push(loopInfo.loopIdx);
    }
    if (isCond) {
      if (isFunc) highlightFunc.push(funcIdx - 1);
      else highlightQueue.push(cardIdx - 1);
    }
    
    let label = isFunc ? `[Função] ` : "";
    if (loopInfo) label += `[Loop ${loopInfo.current}/${loopInfo.total}] `;
    
    if (cardId === "forward") {
      const nextPos = getNextPosition(robotPos, robotDir);
      const cell = checkCell(grid, nextPos);
      
      robotPos = nextPos;
      
      // Se for laser, verifica se está ativo
      if (cell === "T" && !lasersDisabled) {
        currentStatus = "TRAPPED";
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          keysCollected: keysCollected,
          lasersDisabled: lasersDisabled,
          activeCardId: cardId,
          status: currentStatus,
          message: label + "💥 RUNTIME ERROR: Circuito queimado! O robô colidiu com um Laser ativo (T).",
          highlightQueueIdxs: highlightQueue,
          highlightFuncIdxs: highlightFunc,
          gridState: grid.map(row => [...row])
        });
        return false;
      }
      
      // Se for porta trancada ou parede ou fora do grid
      if (cell === "#" || cell === "OUT_OF_BOUNDS" || cell === "D") {
        currentStatus = "CRASHED";
        let errorMsg = "💥 BUG DE COLISÃO: O robô tentou mover-se contra uma parede de metal (#).";
        if (cell === "D") {
          errorMsg = "💥 ACESSO NEGADO: Porta trancada (D) bloqueou o robô. É necessário desbloqueá-la primeiro.";
        }
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          keysCollected: keysCollected,
          lasersDisabled: lasersDisabled,
          activeCardId: cardId,
          status: currentStatus,
          message: label + errorMsg,
          highlightQueueIdxs: highlightQueue,
          highlightFuncIdxs: highlightFunc,
          gridState: grid.map(row => [...row])
        });
        return false;
      }
      
      // Se atingir a saída (Gate)
      if (cell === "G") {
        currentStatus = "SUCCESS";
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          keysCollected: keysCollected,
          lasersDisabled: lasersDisabled,
          activeCardId: cardId,
          status: currentStatus,
          message: label + "🏁 SUCESSO: AlgoBot alcançou a Saída e abriu o terminal da sala!",
          highlightQueueIdxs: highlightQueue,
          highlightFuncIdxs: highlightFunc,
          gridState: grid.map(row => [...row])
        });
        return false;
      }
      
      // Movimento comum livre
      timeline.push({
        step: stepCounter++,
        r: robotPos.r,
        c: robotPos.c,
        dir: robotDir,
        keysCollected: keysCollected,
        lasersDisabled: lasersDisabled,
        activeCardId: cardId,
        status: "RUNNING",
        message: label + `Avançou para coordenada (${robotPos.r}, ${robotPos.c}).`,
        highlightQueueIdxs: highlightQueue,
        highlightFuncIdxs: highlightFunc,
        gridState: grid.map(row => [...row])
      });
      return true;
    } 
    
    else if (cardId === "left") {
      robotDir = rotateLeft(robotDir);
      timeline.push({
        step: stepCounter++,
        r: robotPos.r,
        c: robotPos.c,
        dir: robotDir,
        keysCollected: keysCollected,
        lasersDisabled: lasersDisabled,
        activeCardId: cardId,
        status: "RUNNING",
        message: label + `Gira 90° à esquerda. Nova orientação: ${DIR_VECTORS[robotDir].symbol} (${robotDir}).`,
        highlightQueueIdxs: highlightQueue,
        highlightFuncIdxs: highlightFunc,
        gridState: grid.map(row => [...row])
      });
      return true;
    } 
    
    else if (cardId === "right") {
      robotDir = rotateRight(robotDir);
      timeline.push({
        step: stepCounter++,
        r: robotPos.r,
        c: robotPos.c,
        dir: robotDir,
        keysCollected: keysCollected,
        lasersDisabled: lasersDisabled,
        activeCardId: cardId,
        status: "RUNNING",
        message: label + `Gira 90° à direita. Nova orientação: ${DIR_VECTORS[robotDir].symbol} (${robotDir}).`,
        highlightQueueIdxs: highlightQueue,
        highlightFuncIdxs: highlightFunc,
        gridState: grid.map(row => [...row])
      });
      return true;
    } 
    
    else if (cardId === "collect_key") {
      const currentCell = grid[robotPos.r][robotPos.c];
      if (currentCell === "K") {
        keysCollected++;
        grid[robotPos.r][robotPos.c] = "."; // Remove do mapa
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          keysCollected: keysCollected,
          lasersDisabled: lasersDisabled,
          activeCardId: cardId,
          status: "RUNNING",
          message: label + `🔑 CHAVE COLETADA! Chaves no inventário: ${keysCollected}.`,
          highlightQueueIdxs: highlightQueue,
          highlightFuncIdxs: highlightFunc,
          gridState: grid.map(row => [...row])
        });
      } else {
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          keysCollected: keysCollected,
          lasersDisabled: lasersDisabled,
          activeCardId: cardId,
          status: "RUNNING",
          message: label + `Aviso: Nenhuma chave física (K) encontrada sob a posição atual do robô.`,
          highlightQueueIdxs: highlightQueue,
          highlightFuncIdxs: highlightFunc,
          gridState: grid.map(row => [...row])
        });
      }
      return true;
    } 
    
    else if (cardId === "open_door") {
      const nextPos = getNextPosition(robotPos, robotDir);
      const targetCell = checkCell(grid, nextPos);
      
      if (targetCell === "D") {
        if (keysCollected > 0) {
          keysCollected--;
          grid[nextPos.r][nextPos.c] = "."; // Destranca a porta
          timeline.push({
            step: stepCounter++,
            r: robotPos.r,
            c: robotPos.c,
            dir: robotDir,
            keysCollected: keysCollected,
            lasersDisabled: lasersDisabled,
            activeCardId: cardId,
            status: "RUNNING",
            message: label + `🔓 PORTA DESBLOQUEADA! Um canal de dados foi liberado à frente. Chaves restantes: ${keysCollected}.`,
            highlightQueueIdxs: highlightQueue,
            highlightFuncIdxs: highlightFunc,
            gridState: grid.map(row => [...row])
          });
        } else {
          currentStatus = "CRASHED";
          timeline.push({
            step: stepCounter++,
            r: robotPos.r,
            c: robotPos.c,
            dir: robotDir,
            keysCollected: keysCollected,
            lasersDisabled: lasersDisabled,
            activeCardId: cardId,
            status: currentStatus,
            message: label + "💥 ERRO DE AUTENTICAÇÃO: Tentativa de abrir porta (D) sem possuir chaves no inventário.",
            highlightQueueIdxs: highlightQueue,
            highlightFuncIdxs: highlightFunc,
            gridState: grid.map(row => [...row])
          });
          return false;
        }
      } else {
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          keysCollected: keysCollected,
          lasersDisabled: lasersDisabled,
          activeCardId: cardId,
          status: "RUNNING",
          message: label + `Aviso: Nenhuma porta trancada (D) à frente para desbloquear.`,
          highlightQueueIdxs: highlightQueue,
          highlightFuncIdxs: highlightFunc,
          gridState: grid.map(row => [...row])
        });
      }
      return true;
    } 
    
    else if (cardId === "switch_laser") {
      const currentCell = grid[robotPos.r][robotPos.c];
      if (currentCell === "B") {
        lasersDisabled = !lasersDisabled;
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          keysCollected: keysCollected,
          lasersDisabled: lasersDisabled,
          activeCardId: cardId,
          status: "RUNNING",
          message: label + `🔘 INTERRUPTOR DE SEGURANÇA! Lasers estão agora ` + (lasersDisabled ? "DESATIVADOS." : "REATIVADOS."),
          highlightQueueIdxs: highlightQueue,
          highlightFuncIdxs: highlightFunc,
          gridState: grid.map(row => [...row])
        });
      } else {
        timeline.push({
          step: stepCounter++,
          r: robotPos.r,
          c: robotPos.c,
          dir: robotDir,
          keysCollected: keysCollected,
          lasersDisabled: lasersDisabled,
          activeCardId: cardId,
          status: "RUNNING",
          message: label + `Aviso: O AlgoBot deve estar posicionado sobre o interruptor (B) para disparar esta instrução.`,
          highlightQueueIdxs: highlightQueue,
          highlightFuncIdxs: highlightFunc,
          gridState: grid.map(row => [...row])
        });
      }
      return true;
    }
    
    return true;
  }
  
  // Executa uma lista linear de cartões (usado tanto para a fila principal quanto funções)
  function executeInstructionsList(list, isFunc = false) {
    let listIdx = 0;
    while (listIdx < list.length && currentStatus === "RUNNING") {
      const item = list[listIdx];
      const card = item.card;
      
      const cardIdx = isFunc ? null : listIdx;
      const funcIdx = isFunc ? listIdx : null;
      
      // COMANDOS BÁSICOS
      if (card.id === "forward" || card.id === "left" || card.id === "right" || 
          card.id === "collect_key" || card.id === "open_door" || card.id === "switch_laser") {
        executeAtomicCommand(card.id, cardIdx, isFunc, funcIdx);
        listIdx++;
      } 
      
      // LAÇOS DE REPETIÇÃO
      else if (card.id.startsWith("loop")) {
        const repeats = parseInt(card.id.split("_")[1], 10);
        const nextItem = list[listIdx + 1];
        
        if (!nextItem) {
          timeline.push({
            step: stepCounter++,
            r: robotPos.r,
            c: robotPos.c,
            dir: robotDir,
            keysCollected: keysCollected,
            lasersDisabled: lasersDisabled,
            activeCardId: card.id,
            status: "RUNNING",
            message: `Sintaxe Vazia: Laço [${card.name}] sem nenhuma instrução subsequente.`,
            highlightQueueIdxs: isFunc ? [] : [listIdx],
            highlightFuncIdxs: isFunc ? [listIdx] : [],
            gridState: grid.map(row => [...row])
          });
          listIdx++;
        } else if (nextItem.card.type !== "command" || nextItem.card.id.startsWith("loop") || nextItem.card.id.startsWith("if")) {
          // Apenas comandos atômicos podem ser repetidos no loop simples
          timeline.push({
            step: stepCounter++,
            r: robotPos.r,
            c: robotPos.c,
            dir: robotDir,
            keysCollected: keysCollected,
            lasersDisabled: lasersDisabled,
            activeCardId: card.id,
            status: "RUNNING",
            message: `Erro de Compilação: Estruturas complexas (Loops/IF) não podem ser encadeadas dentro de um Loop simples.`,
            highlightQueueIdxs: isFunc ? [] : [listIdx, listIdx + 1],
            highlightFuncIdxs: isFunc ? [listIdx, listIdx + 1] : [],
            gridState: grid.map(row => [...row])
          });
          listIdx += 2;
        } else {
          // Executa a repetição
          let loopContinues = true;
          for (let iter = 1; iter <= repeats && loopContinues && currentStatus === "RUNNING"; iter++) {
            loopContinues = executeAtomicCommand(nextItem.card.id, isFunc ? null : (listIdx + 1), isFunc, isFunc ? (listIdx + 1) : null, {
              loopIdx: listIdx,
              isFunc: isFunc,
              current: iter,
              total: repeats
            });
          }
          listIdx += 2;
        }
      } 
      
      // CONDICIONAIS (IF)
      else if (card.id === "if_clear_forward") {
        const nextItem = list[listIdx + 1];
        
        if (!nextItem) {
          timeline.push({
            step: stepCounter++,
            r: robotPos.r,
            c: robotPos.c,
            dir: robotDir,
            keysCollected: keysCollected,
            lasersDisabled: lasersDisabled,
            activeCardId: card.id,
            status: "RUNNING",
            message: `Sintaxe Vazia: Condicional [${card.name}] sem instrução a executar.`,
            highlightQueueIdxs: isFunc ? [] : [listIdx],
            highlightFuncIdxs: isFunc ? [listIdx] : [],
            gridState: grid.map(row => [...row])
          });
          listIdx++;
        } else {
          const checkPos = getNextPosition(robotPos, robotDir);
          const nextCell = checkCell(grid, checkPos);
          const isClear = (nextCell !== "#" && nextCell !== "OUT_OF_BOUNDS" && nextCell !== "D");
          
          if (isClear) {
            timeline.push({
              step: stepCounter++,
              r: robotPos.r,
              c: robotPos.c,
              dir: robotDir,
              keysCollected: keysCollected,
              lasersDisabled: lasersDisabled,
              activeCardId: card.id,
              status: "RUNNING",
              message: `Condicional: Frente Livre. Executando o bloco: ${nextItem.card.name}.`,
              highlightQueueIdxs: isFunc ? [] : [listIdx, listIdx + 1],
              highlightFuncIdxs: isFunc ? [listIdx, listIdx + 1] : [],
              gridState: grid.map(row => [...row])
            });
            executeAtomicCommand(nextItem.card.id, isFunc ? null : (listIdx + 1), isFunc, isFunc ? (listIdx + 1) : null, null, true);
          } else {
            timeline.push({
              step: stepCounter++,
              r: robotPos.r,
              c: robotPos.c,
              dir: robotDir,
              keysCollected: keysCollected,
              lasersDisabled: lasersDisabled,
              activeCardId: card.id,
              status: "RUNNING",
              message: `Condicional: Frente Obstruída! Pulando comando: ${nextItem.card.name}.`,
              highlightQueueIdxs: isFunc ? [] : [listIdx, listIdx + 1],
              highlightFuncIdxs: isFunc ? [listIdx, listIdx + 1] : [],
              gridState: grid.map(row => [...row])
            });
          }
          listIdx += 2;
        }
      } 
      
      // CHAMADA DE FUNÇÃO (SUB-ROTINA)
      else if (card.id === "call_func") {
        if (isFunc) {
          // Previne recursão infinita
          timeline.push({
            step: stepCounter++,
            r: robotPos.r,
            c: robotPos.c,
            dir: robotDir,
            keysCollected: keysCollected,
            lasersDisabled: lasersDisabled,
            activeCardId: card.id,
            status: "RUNNING",
            message: `Aviso Lógico: Recursão impedida. Uma função não pode chamar a si mesma.`,
            highlightQueueIdxs: [],
            highlightFuncIdxs: [listIdx],
            gridState: grid.map(row => [...row])
          });
          listIdx++;
        } else {
          if (functionQueue.length === 0) {
            timeline.push({
              step: stepCounter++,
              r: robotPos.r,
              c: robotPos.c,
              dir: robotDir,
              keysCollected: keysCollected,
              lasersDisabled: lasersDisabled,
              activeCardId: card.id,
              status: "RUNNING",
              message: `Chamada Nula: A sub-rotina (Função) está vazia. Nenhum comando a executar.`,
              highlightQueueIdxs: [listIdx],
              highlightFuncIdxs: [],
              gridState: grid.map(row => [...row])
            });
            listIdx++;
          } else {
            timeline.push({
              step: stepCounter++,
              r: robotPos.r,
              c: robotPos.c,
              dir: robotDir,
              keysCollected: keysCollected,
              lasersDisabled: lasersDisabled,
              activeCardId: card.id,
              status: "RUNNING",
              message: `Desviando execução: Chamando sub-rotina encapsulada (Função).`,
              highlightQueueIdxs: [listIdx],
              highlightFuncIdxs: [],
              gridState: grid.map(row => [...row])
            });
            
            // Executa a fila da sub-rotina
            executeInstructionsList(functionQueue, true);
            
            if (currentStatus === "RUNNING") {
              timeline.push({
                step: stepCounter++,
                r: robotPos.r,
                c: robotPos.c,
                dir: robotDir,
                keysCollected: keysCollected,
                lasersDisabled: lasersDisabled,
                activeCardId: card.id,
                status: "RUNNING",
                message: `Sub-rotina finalizada. Retornando ao fluxo principal.`,
                highlightQueueIdxs: [listIdx],
                highlightFuncIdxs: [],
                gridState: grid.map(row => [...row])
              });
            }
            listIdx++;
          }
        }
      }
    }
  }
  
  // Roda a fila principal
  executeInstructionsList(commandQueue, false);
  
  // Se finalizou com status RUNNING, avalia o destino final
  if (currentStatus === "RUNNING") {
    const finalCell = grid[robotPos.r][robotPos.c];
    if (finalCell === "G") {
      currentStatus = "SUCCESS";
      timeline.push({
        step: stepCounter++,
        r: robotPos.r,
        c: robotPos.c,
        dir: robotDir,
        keysCollected: keysCollected,
        lasersDisabled: lasersDisabled,
        status: currentStatus,
        message: "🏁 SUCESSO: Algoritmo compilado e executado com 100% de êxito!",
        highlightQueueIdxs: [],
        highlightFuncIdxs: [],
        gridState: grid.map(row => [...row])
      });
    } else {
      currentStatus = "OUT_OF_COMMANDS";
      timeline.push({
        step: stepCounter++,
        r: robotPos.r,
        c: robotPos.c,
        dir: robotDir,
        keysCollected: keysCollected,
        lasersDisabled: lasersDisabled,
        status: currentStatus,
        message: "❌ ERRO DE LÓGICA (Sem comandos): A rotina encerrou mas o robô não atingiu o Gate final.",
        highlightQueueIdxs: [],
        highlightFuncIdxs: [],
        gridState: grid.map(row => [...row])
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
