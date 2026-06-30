// Níveis do Jogo AlgoBot
// S = Início, G = Meta/Bateria, # = Parede/Obstáculo, . = Caminho Livre, T = Armadilha/Laser

const LEVELS = [
  {
    id: 1,
    name: "Sequenciamento Básico",
    description: "Guie o AlgoBot até a Bateria. Evite colidir com as paredes de metal.",
    grid: [
      ['#', '#', '#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', '.', '.', '.', 'G', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '#']
    ],
    startPos: { r: 1, c: 1 },
    startDir: "RIGHT",
    maxInstructions: 8,
    allowedBlocks: ["forward", "left", "right"],
    instructionText: "Objetivo: Andar em linha reta para a direita."
  },
  {
    id: 2,
    name: "Desvio de Obstáculos",
    description: "Desvie dos escombros e leve o AlgoBot em segurança até a meta.",
    grid: [
      ['#', '#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', '#', '.', 'G', '#'],
      ['#', '#', '.', '#', '.', '#', '#'],
      ['#', '#', '.', '.', '.', '#', '#'],
      ['#', '#', '#', '#', '#', '#', '#']
    ],
    startPos: { r: 1, c: 1 },
    startDir: "RIGHT",
    maxInstructions: 10,
    allowedBlocks: ["forward", "left", "right"],
    instructionText: "Objetivo: Contorne o obstáculo no centro deslizando para baixo e subindo."
  },
  {
    id: 3,
    name: "O Corredor de Lasers",
    description: "Atenção! Armadilhas de laser ('T') foram ativadas no setor. Mova-se com cuidado.",
    grid: [
      ['#', '#', '#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', '.', 'T', '.', 'G', '#'],
      ['#', '#', '#', '.', '#', '.', '#', '#'],
      ['#', '#', '#', '.', '.', '.', '#', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '#']
    ],
    startPos: { r: 1, c: 1 },
    startDir: "RIGHT",
    maxInstructions: 12,
    allowedBlocks: ["forward", "left", "right"],
    instructionText: "Objetivo: Contorne a armadilha de laser (T) pelo caminho de baixo."
  },
  {
    id: 4,
    name: "Desafio dos Repetidores",
    description: "Use estruturas de repetição (Loops) para otimizar o algoritmo em corredores longos.",
    grid: [
      ['#', '#', '#', '#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', '.', '.', '.', '.', '.', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '.', '#'],
      ['#', 'G', '.', '.', '.', '.', '.', '.', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '#', '#']
    ],
    startPos: { r: 1, c: 1 },
    startDir: "RIGHT",
    maxInstructions: 8, // Limite baixo força o uso de loops!
    allowedBlocks: ["forward", "left", "right", "loop_2", "loop_3", "loop_4"],
    instructionText: "Objetivo: Vá até o final do corredor, desça, e volte pelo corredor inferior."
  },
  {
    id: 5,
    name: "Sensores Ativos (Condicionais)",
    description: "Ensine o robô a tomar decisões dinâmicas baseadas nos sensores integrados.",
    grid: [
      ['#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', '.', '.', '#'],
      ['#', '#', '#', '#', '.', '#'],
      ['#', 'G', '.', '.', '.', '#'],
      ['#', '#', '#', '#', '#', '#']
    ],
    startPos: { r: 1, c: 1 },
    startDir: "RIGHT",
    maxInstructions: 6,
    allowedBlocks: ["forward", "left", "right", "if_clear_forward"],
    instructionText: "Use condicionais para detectar obstáculos e fazer curvas automáticas."
  }
];

if (typeof module !== 'undefined') {
  module.exports = LEVELS;
}
