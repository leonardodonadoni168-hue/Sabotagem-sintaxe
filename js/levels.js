// Níveis Lógicos e Pedagógicos do SyntaxError
// S = Início, G = Meta/Gate, # = Parede, . = Vazio, K = Chave, D = Porta Trancada, T = Laser Ativo, B = Interruptor

const LEVELS = [
  {
    id: 1,
    name: "Setor 1: Protocolo de Inicialização",
    description: "Conceito: Sequenciamento. Guie o AlgoBot em linha reta até o terminal de dados para energizar a sala.",
    grid: [
      ['#', '#', '#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', '.', '.', '.', 'G', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '#']
    ],
    startPos: { r: 1, c: 1 },
    startDir: "RIGHT",
    minInstructions: 5,
    maxInstructions: 25,
    allowedBlocks: ["forward", "left", "right"],
    instructionText: "Foco: Sequenciamento básico linear. Mova-se até a saída."
  },
  {
    id: 2,
    name: "Setor 2: Bypass de Resfriadores",
    description: "Conceito: Sequenciamento + Curvas. Desvie dos blocos de processamento físico (#) contornando o labirinto.",
    grid: [
      ['#', '#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', '#', '.', 'G', '#'],
      ['#', '#', '.', '#', '.', '#', '#'],
      ['#', '#', '.', '.', '.', '#', '#'],
      ['#', '#', '#', '#', '#', '#', '#']
    ],
    startPos: { r: 1, c: 1 },
    startDir: "RIGHT",
    minInstructions: 6,
    maxInstructions: 25,
    allowedBlocks: ["forward", "left", "right"],
    instructionText: "Foco: Decomposição de caminhos. Mova-se contornando o processador de dados."
  },
  {
    id: 3,
    name: "Setor 3: Criptografia de Chave Única",
    description: "Conceito: Ações e Estado. O Gate (G) está bloqueado por uma porta de dados (D). Pegue a chave física (K) e use o comando Desbloquear Porta.",
    grid: [
      ['#', '#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', 'D', 'G', '#', '#'],
      ['#', '#', '.', '#', '#', '#', '#'],
      ['#', 'K', '.', '#', '#', '#', '#'],
      ['#', '#', '#', '#', '#', '#', '#']
    ],
    startPos: { r: 1, c: 1 },
    startDir: "RIGHT",
    minInstructions: 6,
    maxInstructions: 25,
    allowedBlocks: ["forward", "left", "right", "collect_key", "open_door"],
    instructionText: "Foco: Gerenciamento de estado. Desça para coletar a chave (K) e abra a porta (D)."
  },
  {
    id: 4,
    name: "Setor 4: O Corredor de Loops",
    description: "Conceito: Estrutura de Repetição (Loops). O terminal está no final de um corredor extenso de fibra óptica. Utilize blocos de repetição.",
    grid: [
      ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', '.', '.', '.', '.', '.', 'G', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#']
    ],
    startPos: { r: 1, c: 1 },
    startDir: "RIGHT",
    minInstructions: 2,
    maxInstructions: 25,
    allowedBlocks: ["forward", "left", "right", "loop_2", "loop_3", "loop_4", "loop_6"],
    instructionText: "Foco: Repetição em loops. Repita o avanço para economizar blocos."
  },
  {
    id: 5,
    name: "Setor 5: O Firewall de Lasers",
    description: "Conceito: Eventos e Interruptores. Um laser de alta potência (T) bloqueia o caminho direto. Mova o robô até o interruptor (B) para desativar o laser antes de avançar.",
    grid: [
      ['#', '#', '#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', 'T', '.', '.', 'G', '#'],
      ['#', '#', '.', '#', '#', '#', '#', '#'],
      ['#', 'B', '.', '#', '#', '#', '#', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '#']
    ],
    startPos: { r: 1, c: 1 },
    startDir: "RIGHT",
    minInstructions: 8,
    maxInstructions: 25,
    allowedBlocks: ["forward", "left", "right", "switch_laser"],
    instructionText: "Foco: Interruptor de evento. Fique sobre B e desligue o laser antes de cruzar T."
  },
  {
    id: 6,
    name: "Setor 6: Sensor de Roteamento (IF)",
    description: "Conceito: Desvio Condicional (IF). O labirinto possui portas automáticas. Use o comando 'Se Frente Livre' (IF) para decidir se deve seguir em frente ou fazer o desvio.",
    grid: [
      ['#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', '.', '#', '#'],
      ['#', '#', '#', '.', '#', '#'],
      ['#', 'G', '.', '.', '#', '#'],
      ['#', '#', '#', '#', '#', '#']
    ],
    startPos: { r: 1, c: 1 },
    startDir: "RIGHT",
    minInstructions: 4,
    maxInstructions: 25,
    allowedBlocks: ["forward", "left", "right", "if_clear_forward"],
    instructionText: "Foco: Estruturas condicionais. Use o sensor IF para escolher o caminho dinamicamente."
  },
  {
    id: 7,
    name: "Setor 7: Execução Modular (Funções)",
    description: "Conceito: Modularização (Sub-rotinas/Funções). Uma sequência idêntica de curvas é necessária para subir as escadas do barramento de dados. Use cartões de Função para reduzir a complexidade.",
    grid: [
      ['#', '#', '#', '#', '#', '#', '#', '#'],
      ['#', '#', '#', '#', '.', '.', 'G', '#'],
      ['#', '#', '.', '.', '.', '#', '#', '#'],
      ['#', 'S', '.', '#', '#', '#', '#', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '#']
    ],
    startPos: { r: 3, c: 1 },
    startDir: "RIGHT",
    minInstructions: 4,
    maxInstructions: 25,
    allowedBlocks: ["forward", "left", "right", "call_func", "loop_2"],
    instructionText: "Foco: Reutilização de código. Crie uma sub-rotina de curva e chame-a repetidamente."
  },
  {
    id: 8,
    name: "Setor 8: HELENA Core (Desafio Final)",
    description: "Conceito: Escopo Geral. Você chegou ao núcleo central da HELENA. Colete a chave de bypass, desarme os firewalls e abra a porta lógica final para salvar o Data Center.",
    grid: [
      ['#', '#', '#', '#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', 'T', 'D', 'G', '#', '#', '#'],
      ['#', '#', '.', '#', '#', '#', '#', '#', '#'],
      ['#', 'B', '.', 'K', '.', '#', '#', '#', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '#', '#']
    ],
    startPos: { r: 1, c: 1 },
    startDir: "RIGHT",
    minInstructions: 9,
    maxInstructions: 25,
    allowedBlocks: ["forward", "left", "right", "collect_key", "open_door", "switch_laser", "loop_2", "if_clear_forward"],
    instructionText: "Foco: Pensamento Computacional integrado. Combine loops, condicionais e chaves para vencer."
  }
];

if (typeof module !== 'undefined') {
  module.exports = LEVELS;
}
