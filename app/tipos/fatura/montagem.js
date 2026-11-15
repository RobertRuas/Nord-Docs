/* ============================================================================
   montagem.js - desenha uma fatura a partir do objeto de dados
   ----------------------------------------------------------------------------
   Compartilhado pelos modelos invoice-despesas e invoice-horas: os dois sao o mesmo
   documento, com dados e algumas medidas diferentes.

   Este modulo so sabe DESENHAR: recebe os dados e escreve o conteudo nos
   lugares marcados no index.html. Ele nao carrega arquivo, nao edita e nao
   imprime - cada uma dessas tarefas tem seu proprio modulo no nucleo.

   Ao desenhar, cada campo recebe o atributo data-editavel com o caminho do
   seu valor dentro do dados.json (ver js/caminho.js). E isso que permite ao
   modulo de edicao devolver as alteracoes ao lugar certo.
   ============================================================================ */

import { criarCelula, criarLinha, criarCampo, escreverCampo, areaDaLista }
  from '../../js/dom.js';
import { hojeFormatado } from '../../js/datas.js';

/** Secoes que um arquivo importado precisa ter para ser aceito como fatura */
export const SECOES = [
  'titulo', 'emissor', 'pagamento', 'fatura',
  'destinatario', 'projetos', 'custos', 'confirmacao', 'assinatura'
];

/**
 * Numero da fatura, lido do bloco "fatura" do documento.
 * Usado para dar nome ao arquivo exportado e ao PDF.
 * @param {object} dados
 * @returns {string} ex.: '015'
 */
export function numeroDaFatura(dados) {
  const campo = (dados.fatura || []).find(function (item) {
    return item.rotulo.toLowerCase().indexOf('number') !== -1;
  });
  return campo ? campo.valor : '';
}

/**
 * Monta uma tabela de duas colunas (rotulo / valor).
 * Usada nos blocos "emissor", "pagamento" e "fatura".
 * @param {string} nome  valor do atributo data-lista no HTML
 * @param {Array<{rotulo: string, valor: string}>} itens
 */
function montarTabelaInfo(nome, itens) {
  const corpo = areaDaLista(nome);
  if (!corpo) {
    return;
  }
  itens.forEach(function (item, indice) {
    const base = nome + '.' + indice + '.';
    corpo.appendChild(criarLinha([
      criarCelula(item.rotulo, null, { caminho: base + 'rotulo' }),
      criarCelula(item.valor, null, { caminho: base + 'valor' })
    ]));
  });
}

/**
 * Monta o cabecalho cinza de uma tabela em grade.
 * @param {string} nome     valor do atributo data-cabecalho no HTML
 * @param {string} caminho  caminho da lista de colunas no dados.json
 * @param {Array<{chave: string, titulo: string}>} colunas
 */
function montarCabecalho(nome, caminho, colunas) {
  const cabecalho = document.querySelector('[data-cabecalho="' + nome + '"]');
  if (!cabecalho) {
    return;
  }
  cabecalho.textContent = '';
  cabecalho.appendChild(criarLinha(colunas.map(function (coluna, indice) {
    return criarCelula(coluna.titulo, null, {
      caminho: caminho + '.' + indice + '.titulo'
    });
  })));
}

/**
 * Monta o corpo de uma tabela em grade.
 * Cada linha do JSON e um objeto; a ordem das colunas vem da lista "colunas",
 * onde "chave" diz qual campo do objeto entra em cada coluna.
 * @param {string} nome     valor do atributo data-lista no HTML
 * @param {string} caminho  caminho da lista de linhas no dados.json
 * @param {Array<{chave: string, titulo: string}>} colunas
 * @param {Array<object>} linhas
 * @returns {HTMLElement|null} o <tbody> usado
 */
function montarCorpoGrade(nome, caminho, colunas, linhas) {
  const corpo = areaDaLista(nome);
  if (!corpo) {
    return null;
  }

  /* Marca o <tbody> como uma colecao: e isso que habilita os botoes de
     adicionar e remover linha no modo de edicao. */
  corpo.dataset.colecao = caminho;

  linhas.forEach(function (registro, indice) {
    corpo.appendChild(criarLinha(colunas.map(function (coluna) {
      return criarCelula(registro[coluna.chave], null, {
        caminho: caminho + '.' + indice + '.' + coluna.chave
      });
    })));
  });
  return corpo;
}

/**
 * Acrescenta a linha de total da tabela de custos.
 * As celulas da esquerda ficam vazias e sem borda; a penultima recebe o
 * rotulo alinhado a direita e a ultima o valor - as duas em negrito.
 * @param {HTMLElement} corpo         <tbody> da tabela de custos
 * @param {number} totalColunas
 * @param {{rotulo: string, valor: string}} total
 */
function montarLinhaTotal(corpo, totalColunas, total) {
  if (!corpo) {
    return;
  }

  const celulas = [];
  for (let i = 0; i < totalColunas - 2; i += 1) {
    celulas.push(criarCelula(''));
  }
  celulas.push(criarCelula(total.rotulo, 'celula-rotulo-total', {
    caminho: 'custos.total.rotulo'
  }));
  celulas.push(criarCelula(total.valor, 'celula-valor-total', {
    caminho: 'custos.total.valor'
  }));

  /* A linha de total fica FORA da colecao editavel: ela nao e uma linha de
     dados e por isso nao pode ser removida junto com as outras. */
  const linha = criarLinha(celulas, 'linha-total');
  linha.dataset.foraDaColecao = 'sim';
  corpo.appendChild(linha);
}

/**
 * Monta os itens da declaracao final ("I confirm that:").
 * O marcador "•" faz parte do texto, como no documento original.
 * @param {string} nome  valor do atributo data-lista no HTML
 * @param {Array<string>} itens
 */
function montarConfirmacao(nome, itens) {
  const bloco = areaDaLista(nome);
  if (!bloco) {
    return;
  }
  bloco.dataset.colecao = 'confirmacao.itens';

  itens.forEach(function (texto, indice) {
    const paragrafo = document.createElement('p');
    paragrafo.className = 'item-marcador';
    paragrafo.appendChild(criarCampo(texto, 'confirmacao.itens.' + indice));
    bloco.appendChild(paragrafo);
  });
}

/**
 * Escreve no HTML todo o conteudo lido do dados.json.
 * @param {object} dados  conteudo do documento
 */
export function montarFatura(dados) {
  escreverCampo('titulo', dados.titulo, 'titulo');

  /* Os tres blocos de duas colunas do topo */
  montarTabelaInfo('emissor',   dados.emissor);
  montarTabelaInfo('pagamento', dados.pagamento);
  montarTabelaInfo('fatura',    dados.fatura);

  /* Destinatario da fatura */
  escreverCampo('destinatarioTitulo', dados.destinatario.titulo,   'destinatario.titulo');
  escreverCampo('destinatarioLinha1', dados.destinatario.endereco, 'destinatario.endereco');
  escreverCampo('destinatarioLinha2', dados.destinatario.contato,  'destinatario.contato');

  /* Tabela "Projects Details" */
  escreverCampo('projetosTitulo', dados.projetos.titulo, 'projetos.titulo');
  montarCabecalho('projetos', 'projetos.colunas', dados.projetos.colunas);
  montarCorpoGrade('projetos', 'projetos.linhas', dados.projetos.colunas, dados.projetos.linhas);

  /* Tabela "Work & Cost Breakdown" + linha de total */
  escreverCampo('custosTitulo', dados.custos.titulo, 'custos.titulo');
  montarCabecalho('custos', 'custos.colunas', dados.custos.colunas);
  const corpoCustos = montarCorpoGrade('custos', 'custos.linhas',
                                       dados.custos.colunas, dados.custos.linhas);
  montarLinhaTotal(corpoCustos, dados.custos.colunas.length, dados.custos.total);

  /* Declaracao final e assinatura */
  escreverCampo('confirmacaoTitulo', dados.confirmacao.titulo, 'confirmacao.titulo');
  montarConfirmacao('confirmacao', dados.confirmacao.itens);
  escreverCampo('assinaturaLinha', dados.assinatura.linha, 'assinatura.linha');
  montarData(dados.assinatura);
}

/**
 * Linha da data, ao lado da assinatura.
 *
 * O rotulo ("Date:") e texto fixo e a data e um campo editavel ao lado.
 * Quando "dataValor" esta vazio e "dataAutomatica" esta ligado, a data de
 * hoje e exibida; basta digitar por cima para fixar outra data.
 *
 * @param {{dataRotulo: string, dataValor: string, dataAutomatica: boolean}} assinatura
 */
function montarData(assinatura) {
  const paragrafo = document.querySelector('[data-campo="assinaturaData"]');
  if (!paragrafo) {
    return;
  }
  paragrafo.textContent = assinatura.dataRotulo + ' ';

  const texto = assinatura.dataValor ||
                (assinatura.dataAutomatica ? hojeFormatado() : '');

  const campo = criarCampo(texto, 'assinatura.dataValor');
  campo.classList.add('campo-em-linha');
  paragrafo.appendChild(campo);
}
