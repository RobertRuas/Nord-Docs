/* ============================================================================
   montagem.js - desenha a planilha semanal a partir do objeto de dados
   ----------------------------------------------------------------------------
   Este modulo so sabe DESENHAR. Carregar, editar, exportar e imprimir sao
   tarefas do nucleo; ampliar e reduzir e tarefa do zoom.js ao lado.

   A planilha tem um formato muito regular:

       linha  1      titulo + logotipo
       linha  2      vazia
       linhas 3-4    identificacao do trabalho (job, semana, cliente, local)
       linha  5      vazia
       linhas 6-33   SETE blocos de dia; cada bloco =
                       1 linha de cabecalho verde + N linhas de tecnicos
       linhas 34-36  assinaturas
       linhas 37-38  vazias

   Cada campo recebe data-editavel com o caminho do seu valor dentro do
   dados.json, e cada bloco de tecnicos e declarado como uma colecao
   editavel - e o que permite adicionar e remover tecnicos no modo de edicao.
   ============================================================================ */

import { criarCelula, criarLinha, criarCampo } from '../../js/dom.js';
import { hojeFormatado } from '../../js/datas.js';
import { aplicarSemana } from './semana.js';

/** Secoes que um arquivo importado precisa ter para ser aceito */
export const SECOES = [
  'titulo', 'imagens', 'identificacao',
  'colunasTecnico', 'colunaProgresso', 'dias', 'assinaturas'
];

/** Quantidade total de colunas da planilha (A ate M) */
const TOTAL_COLUNAS = 13;

/** Colunas cujo cabecalho aparece girado em 90 graus (H, I e J) */
const CHAVES_GIRADAS = ['standby', 'trabalho', 'viagem'];

/** Colunas cujo valor fica alinhado a esquerda (B e G) */
const CHAVES_A_ESQUERDA = ['nome', 'lamina'];

/** Coluna que hospeda o botao de remover tecnico (L, a ultima nao mesclada) */
const CHAVE_CONTROLE = 'motivoStandby';

/* Rotulo do campo que manda nas datas dos sete dias (ver semana.js).
   Ao sair dele a planilha inteira e redesenhada. */
const ROTULO_SEMANA = 'Week';

/* Resultado da ultima validacao da semana. E guardado aqui porque o modelo
   consulta semanaValida() logo depois do desenho, para decidir se os blocos
   dos dias ficam travados para edicao. */
let estadoDaSemana = { valida: false, numero: null, mensagem: '' };

/** @returns {boolean} true quando a semana informada e valida */
export function semanaValida() {
  return estadoDaSemana.valida;
}

/** @returns {number|null} o numero da semana, quando valido */
export function numeroDaSemana() {
  return estadoDaSemana.numero;
}

/**
 * Mostra ou esconde a faixa de aviso da semana, logo abaixo da barra.
 * @param {{valida: boolean, mensagem: string}} estado
 */
function mostrarAvisoDaSemana(estado) {
  const faixa = document.getElementById('aviso-semana');
  if (!faixa) {
    return;
  }
  faixa.textContent = estado.mensagem;
  faixa.classList.toggle('visivel', !estado.valida);
}

/* ----------------------------------------------------------------------------
   Ajudantes locais
   -------------------------------------------------------------------------- */

/**
 * Cria uma linha (<tr>) com a classe que define sua altura.
 * As alturas ficam em planilha.css, nas classes .linha-*.
 * @param {string} classe  ex.: 'linha-dado'
 * @returns {HTMLTableRowElement}
 */
function linhaVaziaDeClasse(classe) {
  return criarLinha([], classe);
}

/**
 * Acrescenta celulas vazias e sem borda a uma linha.
 * @param {HTMLTableRowElement} linha
 * @param {number} quantidade
 */
function preencherVazias(linha, quantidade) {
  for (let i = 0; i < quantidade; i += 1) {
    linha.appendChild(criarCelula(''));
  }
}

/**
 * Cria uma imagem posicionada sobre uma celula.
 * @param {{arquivo: string, descricao: string}} imagem
 * @param {string} classe
 * @returns {HTMLImageElement}
 */
function criarImagem(imagem, classe) {
  const elemento = document.createElement('img');
  elemento.src = imagem.arquivo;
  elemento.alt = imagem.descricao;
  elemento.className = classe;
  return elemento;
}

/* ----------------------------------------------------------------------------
   Montagem de cada parte
   -------------------------------------------------------------------------- */

/**
 * Linha 1: titulo mesclado de A1 ate J1, com o logotipo ancorado em A1.
 * @param {object} dados
 */
function montarLinhaTitulo(dados) {
  const linha = linhaVaziaDeClasse('linha-titulo');

  const celula = criarCelula(dados.titulo, 'c-titulo', {
    colunas: 10,
    caminho: 'titulo'
  });
  celula.appendChild(criarImagem(dados.imagens.logotipo, 'logotipo'));
  linha.appendChild(celula);

  preencherVazias(linha, 3);   /* colunas K, L e M */
  return linha;
}

/**
 * Linha totalmente vazia (linhas 2, 5, 37 e 38).
 * @param {string} classe  classe de altura
 */
function montarLinhaVazia(classe) {
  const linha = linhaVaziaDeClasse(classe);
  preencherVazias(linha, TOTAL_COLUNAS);
  return linha;
}

/**
 * Linhas 3 e 4: rotulos verdes e valores da identificacao do trabalho.
 * @param {object} dados
 * @param {boolean} ehRotulo  true -> linha 3 (verde); false -> linha 4
 */
function montarLinhaIdentificacao(dados, ehRotulo) {
  const linha = linhaVaziaDeClasse('linha-identificacao');
  let colunasUsadas = 0;

  dados.identificacao.forEach(function (campo, indice) {
    const classe = ehRotulo
      ? 'c-cab'
      : (campo.valorAEsquerda ? 'c-valor-esq' : 'c-valor');

    const celula = criarCelula(
      ehRotulo ? campo.rotulo : campo.valor,
      classe,
      {
        colunas: campo.colunas,
        caminho: 'identificacao.' + indice + (ehRotulo ? '.rotulo' : '.valor')
      }
    );

    /* O valor da semana manda nas datas dos sete dias: ao sair do campo a
       planilha e redesenhada com as datas novas. */
    if (!ehRotulo && campo.rotulo === ROTULO_SEMANA) {
      celula.querySelector('[data-editavel]').dataset.recalcular = 'sim';
      celula.classList.add('c-obrigatorio');

      /* Enquanto a semana for invalida o destaque fica vermelho */
      celula.classList.toggle('c-preenchido', estadoDaSemana.valida);
    }

    linha.appendChild(celula);
    colunasUsadas += campo.colunas;
  });

  /* Colunas K, L e M nao fazem parte do bloco de identificacao */
  preencherVazias(linha, TOTAL_COLUNAS - colunasUsadas);
  return linha;
}

/**
 * Cabecalho verde de um dia.
 *
 * Sobre o caminho dos titulos das colunas: quando o dia NAO tem um ajuste
 * proprio, o campo aponta para colunasTecnico - ou seja, editar ali muda o
 * titulo em todos os dias, que e o comportamento desejado para um rotulo
 * compartilhado. Quando o dia tem um ajuste, o campo aponta so para ele.
 *
 * @param {object} dados
 * @param {object} dia          item de dados.dias
 * @param {number} indiceDoDia  posicao do dia na lista
 */
function montarCabecalhoDia(dados, dia, indiceDoDia) {
  const linha = linhaVaziaDeClasse('linha-cabecalho-dia');
  const ajustes = dia.ajustesCabecalho || {};

  /* Coluna A - rotulo do dia, em negrito */
  linha.appendChild(criarCelula(dia.rotulo, 'c-cab negrito', {
    caminho: 'dias.' + indiceDoDia + '.rotulo'
  }));

  /* Colunas B ate L */
  dados.colunasTecnico.forEach(function (coluna, indiceDaColuna) {
    const temAjuste = Object.prototype.hasOwnProperty.call(ajustes, coluna.chave);
    const texto = temAjuste ? ajustes[coluna.chave] : coluna.titulo;
    const caminho = temAjuste
      ? 'dias.' + indiceDoDia + '.ajustesCabecalho.' + coluna.chave
      : 'colunasTecnico.' + indiceDaColuna + '.titulo';

    /* Colunas H, I e J tem o texto girado em 90 graus. O proprio involucro
       da rotacao e o campo editavel. */
    if (CHAVES_GIRADAS.indexOf(coluna.chave) !== -1) {
      const celula = criarCelula('', 'c-cab-girado');
      celula.appendChild(criarCampo(texto, caminho));
      linha.appendChild(celula);
      return;
    }

    linha.appendChild(criarCelula(texto, 'c-cab', { caminho: caminho }));
  });

  /* Coluna M - texto alinhado a esquerda, em varias linhas */
  linha.appendChild(criarCelula(dados.colunaProgresso.titulo, 'c-cab-esq', {
    caminho: 'colunaProgresso.titulo',
    multilinha: true
  }));
  return linha;
}

/**
 * As linhas de tecnicos de um dia.
 * A coluna A (data) e a coluna M (progresso) sao mescladas em todas as
 * linhas do dia, por isso so aparecem na primeira.
 * @param {object} dados
 * @param {object} dia          item de dados.dias
 * @param {number} indiceDoDia  posicao do dia na lista
 * @returns {Array<HTMLTableRowElement>}
 */
function montarLinhasDoDia(dados, dia, indiceDoDia) {
  const total = dia.tecnicos.length;
  const base = 'dias.' + indiceDoDia;

  return dia.tecnicos.map(function (tecnico, posicao) {
    const linha = linhaVaziaDeClasse('linha-dado');

    /* Declara a linha como item de uma colecao editavel: e isso que cria
       os botoes de remover tecnico no modo de edicao. */
    linha.dataset.colecao = base + '.tecnicos';
    linha.dataset.indice = String(posicao);

    /* Coluna A - data, mesclada verticalmente.
       Ela tambem hospeda o botao de adicionar um tecnico ao dia. */
    if (posicao === 0) {
      /* dia.data e preenchido por semana.js antes de cada desenho; fica
         vazio enquanto a semana informada nao for valida. */
      const celulaData = criarCelula(dia.data || '', 'c-data', {
        linhas: total,
        caminho: base + '.data'
      });
      celulaData.dataset.adicionar = base + '.tecnicos';
      linha.appendChild(celulaData);
    }

    /* Colunas B ate L, na ordem declarada em colunasTecnico */
    dados.colunasTecnico.forEach(function (coluna) {
      let classe = CHAVES_A_ESQUERDA.indexOf(coluna.chave) !== -1
        ? 'c-valor-esq'
        : 'c-valor';

      /* A coluna de stand-by aparece em italico em alguns dias */
      if (coluna.chave === 'standby' && dia.standbyEmItalico) {
        classe += ' italico';
      }

      const celula = criarCelula(tecnico[coluna.chave], classe, {
        caminho: base + '.tecnicos.' + posicao + '.' + coluna.chave
      });

      /* A ultima coluna nao mesclada hospeda o botao de remover a linha */
      if (coluna.chave === CHAVE_CONTROLE) {
        celula.dataset.celulaControle = 'sim';
      }
      linha.appendChild(celula);
    });

    /* Coluna M - progresso diario, mesclado verticalmente */
    if (posicao === 0) {
      linha.appendChild(criarCelula(dia.progresso, 'c-progresso', {
        linhas: total,
        caminho: base + '.progresso',
        multilinha: true
      }));
    }

    return linha;
  });
}

/**
 * Uma das tres linhas do bloco de assinaturas (34, 35 e 36).
 * @param {object} dados
 * @param {number} indice  posicao da linha em dados.assinaturas.linhas
 * @param {string} classe  classe de altura da linha
 */
function montarLinhaAssinatura(dados, indice, classe) {
  const dadosLinha = dados.assinaturas.linhas[indice];
  const linha = linhaVaziaDeClasse(classe);
  const classeCampo = dadosLinha.comLinha ? 'c-campo-linha' : 'c-campo';
  const base = 'assinaturas.linhas.' + indice;

  /* O comentario do arquivo original so existe na linha da assinatura */
  const nota = dadosLinha.comNota ? dados.assinaturas.nota : undefined;

  /* A linha da data mostra a data de hoje enquanto nada for digitado */
  const valorEsquerda = dadosLinha.valorEsquerda ||
    (dadosLinha.dataAutomatica ? hojeFormatado() : '');

  /* Coluna A - rotulo da esquerda */
  linha.appendChild(criarCelula(dadosLinha.rotuloEsquerda, 'c-rotulo-assinatura', {
    caminho: base + '.rotuloEsquerda',
    nota: nota
  }));

  /* Colunas B:C - campo da esquerda, deixado em branco para assinar no PDF */
  linha.appendChild(criarCelula(valorEsquerda, classeCampo, {
    colunas: 2,
    caminho: base + '.valorEsquerda'
  }));

  /* Coluna D - rotulo da direita */
  linha.appendChild(criarCelula(dadosLinha.rotuloDireita, 'c-rotulo-assinatura', {
    caminho: base + '.rotuloDireita',
    nota: nota
  }));

  /* Colunas E:G - campo da direita */
  linha.appendChild(criarCelula(dadosLinha.valorDireita, classeCampo, {
    colunas: 3,
    caminho: base + '.valorDireita'
  }));

  /* Colunas H ate M permanecem vazias */
  preencherVazias(linha, 6);
  return linha;
}

/* ----------------------------------------------------------------------------
   Montagem completa
   -------------------------------------------------------------------------- */

/**
 * Desenha a planilha inteira dentro do <tbody> do index.html.
 * @param {object} dados  conteudo da planilha
 */
export function montarPlanilha(dados) {
  const corpo = document.getElementById('corpo-planilha');
  if (!corpo) {
    return;
  }

  /* Primeiro a semana: quando ela e valida, as datas dos sete dias sao
     recalculadas e gravadas nos dados antes de qualquer celula ser criada. */
  estadoDaSemana = aplicarSemana(dados);
  mostrarAvisoDaSemana(estadoDaSemana);

  corpo.textContent = '';

  /* Linha 1 - titulo */
  corpo.appendChild(montarLinhaTitulo(dados));

  /* Linha 2 - vazia */
  corpo.appendChild(montarLinhaVazia('linha-vazia'));

  /* Linhas 3 e 4 - identificacao do trabalho */
  corpo.appendChild(montarLinhaIdentificacao(dados, true));
  corpo.appendChild(montarLinhaIdentificacao(dados, false));

  /* Linha 5 - separadora */
  corpo.appendChild(montarLinhaVazia('linha-separadora'));

  /* Linhas 6 a 33 - os sete blocos de dia */
  dados.dias.forEach(function (dia, indice) {
    corpo.appendChild(montarCabecalhoDia(dados, dia, indice));
    montarLinhasDoDia(dados, dia, indice).forEach(function (linha) {
      corpo.appendChild(linha);
    });
  });

  /* Linhas 34 a 36 - assinaturas (a primeira e mais alta que as outras) */
  dados.assinaturas.linhas.forEach(function (_linha, indice) {
    corpo.appendChild(montarLinhaAssinatura(
      dados,
      indice,
      indice === 0 ? 'linha-assinatura' : 'linha-assinatura-texto'
    ));
  });

  /* Linhas 37 e 38 - vazias */
  corpo.appendChild(montarLinhaVazia('linha-rodape'));
  corpo.appendChild(montarLinhaVazia('linha-rodape'));
}
