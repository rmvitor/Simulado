export const officialSources = [
  {
    "name": "TIBAGIPREV · Contador · 2022",
    "url": "https://fafipa.selecao.net.br/informacoes/3794/",
    "keyUrl": "https://anexos.cdn.selecao.net.br/uploads/281/concursos/3794/anexos/E6FcnxfRti1i5aEkd1l0aJDCALNy496sPHLxH9xH.pdf",
    "booklet": "https://arquivos.qconcursos.com/prova/arquivo_prova/88533/fafipa-2022-tibagiprev-pr-contador-prova.pdf"
  },
  {
    "name": "CISPAR · Contador · 2020",
    "url": "https://concursos.fundacaounespar.org.br/informacoes/3694/",
    "keyUrl": "https://anexos.cdn.selecao.net.br/uploads/281/concursos/3694/anexos/0c446ae2d660b5f05ac3edc454a184ca.pdf",
    "booklet": "https://eticaconcursos.com.br/provas/arquivos/prova/fafipa-2020-cispar-pr-contador-prova.pdf"
  }
];

// Número original, página do arquivo PDF, tópico do Anexo II, gabarito definitivo e descrição.
const tibagiItems = [
  [1, 3, "1.1.1", "B", "Interpretação da cena observada pelo narrador na farmácia."],
  [2, 3, "1.1.1", "C", "Hipóteses sobre a caligrafia dos médicos e sua sustentação no texto."],
  [3, 4, "1.1.7", "E", "Sentido de um adjetivo no contexto da crônica."],
  [4, 4, "1.1.8", "A", "Classificação sintática de uma oração em um período composto."],
  [5, 4, "1.1.6", "E", "Classes das palavras destacadas na descrição do atendimento."],
  [10, 5, "2.2.1", "A", "Preço à vista de um veículo após desconto percentual."],
  [11, 5, "1.2.9", "A", "Localização do comando de classificação e filtro no Excel 2016."],
  [12, 5, "1.2.10", "A", "Alcance da privacidade na navegação anônima do Chrome."],
  [13, 5, "1.2.4", "C", "Efeito de uma combinação de teclas durante a edição no Word 2016."],
  [15, 6, "1.2.4", "A", "Atalho de acesso ao Gerenciador de Tarefas no Windows 10."],
  [21, 8, "2.4.22", "E", "Controle de estoque pelo PEPS com movimentação de mercadorias."],
  [22, 8, "2.4.22", "A", "Apuração do custo das saídas pelo custo médio ponderado."],
  [23, 9, "2.4.6", "D", "Lançamento de juros em uma operação de desconto de duplicatas."],
  [24, 9, "2.4.3", "C", "Conversão de demonstrações contábeis e variação cambial segundo o CPC 02."],
  [25, 9, "2.4.14", "D", "Etapas de apuração do resultado na demonstração contábil."],
  [26, 10, "2.4.16", "C", "Efeito conjunto de operações societárias sobre o saldo do patrimônio líquido."],
  [27, 10, "2.4.16", "B", "Apuração da variação patrimonial após reservas e integralização de capital."],
  [28, 11, "2.4.9", "E", "Composição do custo inicial de um bem do imobilizado."],
  [32, 12, "2.4.28", "D", "Tratamento contábil da perda de recuperabilidade de um ativo."],
  [33, 12, "2.4.19", "A", "Confronto entre saldos patrimoniais e índices de liquidez."],
  [34, 13, "2.4.19", "D", "Determinação do estoque a partir de indicadores de liquidez."],
  [35, 13, "2.4.18", "C", "Prazos médios do ciclo operacional de uma indústria moveleira."],
  [36, 14, "2.4.18", "E", "Cálculo do prazo médio de renovação dos estoques industriais."],
  [37, 14, "2.4.17", "B", "Comparação do capital de giro líquido em dois exercícios."],
  [38, 14, "2.10.1", "B", "Funções do orçamento público no planejamento governamental."],
  [39, 15, "2.10.4", "A", "Sequência das fases do ciclo orçamentário."],
  [40, 15, "2.10.3", "C", "Instrumentos constitucionais de planejamento e prazos orçamentários."],
];

const cisparItems = [
  [1, 3, "1.1.1", "A", "Leitura de uma declaração reproduzida em notícia sobre o serviço público."],
  [2, 3, "1.1.8", "D", "Análise de construções sintáticas e morfológicas em uma notícia."],
  [3, 4, "1.1.12", "B", "Recurso expressivo empregado na escolha de palavras de uma reportagem."],
  [5, 4, "1.1.12", "A", "Identificação de obra, autoria e contexto de produção a partir de um fragmento."],
  [6, 5, "2.2.1", "A", "Relação entre custo da mão de obra, jornada e número de trabalhadores."],
  [7, 5, "2.2.2", "C", "Duas aplicações sucessivas a juros simples com prazos e taxas diferentes."],
  [8, 5, "2.2.2", "D", "Evolução de um empréstimo com capitalização semestral."],
  [16, 7, "1.2.9", "A", "Identificação de comandos da guia Fórmulas do Excel 2016."],
  [17, 7, "1.2.8", "A", "Reconhecimento de um grupo de comandos na guia Inserir do Word 2016."],
  [18, 7, "1.2.4", "D", "Atalho de teclado para localizar conteúdo em uma página do Chrome."],
  [20, 7, "1.2.9", "A", "Identificação de um componente da interface de edição do Excel."],
  [21, 8, "2.4.24", "B", "Identificação de um método de custeio a partir da descrição operacional."],
  [22, 8, "2.4.20", "C", "Análise dos efeitos do capital de terceiros sobre o retorno dos proprietários."],
  [23, 8, "2.4.19", "B", "Escolha do indicador de capacidade de pagamento no curto prazo."],
  [24, 8, "2.4.19", "D", "Indicador de liquidez aplicável às disponibilidades financeiras."],
  [25, 8, "2.2.4", "A", "Conversão de uma taxa mensal em taxas efetivas para dois períodos."],
  [26, 8, "2.2.4", "B", "Determinação da taxa mensal a partir da taxa efetiva anual."],
  [27, 9, "2.2.8", "B", "Cálculo da prestação de um empréstimo pela Tabela Price."],
  [28, 9, "2.2.4", "D", "Taxa efetiva anual de um financiamento de veículo."],
  [29, 9, "2.2.8", "B", "Determinação da parcela mensal de um contrato com doze vencimentos."],
  [30, 9, "2.2.8", "C", "Comportamento das parcelas ao longo de um contrato pelo sistema francês."],
  [31, 10, "2.2.9", "A", "Primeira prestação de um empréstimo com amortização constante."],
  [32, 10, "2.2.9", "A", "Total de juros e de prestações de um financiamento de energia solar."],
  [33, 10, "2.2.9", "E", "Saldo para quitação antecipada após seis parcelas de um financiamento."],
  [35, 11, "2.2.8", "D", "Prestação mensal em um financiamento habitacional de longo prazo."],
  [36, 11, "2.2.9", "A", "Evolução dos juros ao longo das prestações mensais pelo SAC."],
  [37, 11, "2.4.5", "E", "Classificação dos saldos apresentados para calcular o ativo total."],
  [38, 11, "2.4.4", "E", "Determinação do imobilizado a partir dos demais saldos patrimoniais."],
  [39, 12, "2.4.19", "C", "Cálculo do patrimônio líquido e da liquidez geral de uma companhia."],
  [40, 12, "2.4.19", "E", "Cálculo comparativo de índices de liquidez no encerramento do exercício."],
];

const options = ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D", "Alternativa E"];

function linkQuestions(source, series, items) {
  return items.map(([number, page, topic, key, prompt]) => {
    const printedNumber = String(number).padStart(2, "0");
    let area = "Conhecimentos Específicos";
    if (topic.startsWith("1.1.")) area = "Língua Portuguesa";
    if (topic.startsWith("1.2.")) area = "Noções de Informática";
    return {
      id: `fafipa-${series}-${printedNumber}`,
      origin: "oficial",
      area,
      topic,
      prompt,
      options: [...options],
      answer: "ABCDE".indexOf(key),
      source: `${source.name} · questão ${printedNumber}`,
      url: `${source.booklet}#page=${page}`,
      keyUrl: source.keyUrl,
      referenceOnly: true,
    };
  });
}

export const officialQuestions = [
  ...linkQuestions(officialSources[0], "tibagiprev-2022", tibagiItems),
  ...linkQuestions(officialSources[1], "cispar-2020", cisparItems),
];
