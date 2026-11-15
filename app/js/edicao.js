/* ============================================================================
   edicao.js - edicao dos dados direto na pagina
   ----------------------------------------------------------------------------
   Transforma os campos marcados com data-editavel em campos digitaveis e
   devolve cada alteracao ao objeto de dados, no caminho correspondente.

   Dois tipos de alteracao, tratados de formas diferentes:

     1. ALTERACAO DE TEXTO (digitar dentro de um campo)
        O valor e gravado no objeto de dados e nada mais acontece. A pagina
        NAO e redesenhada, para o cursor nao saltar enquanto se digita.

     2. ALTERACAO DE ESTRUTURA (adicionar ou remover uma linha)
        Muda a quantidade de itens de uma lista, o que desloca os indices de
        todos os caminhos seguintes. Nesse caso a pagina e redesenhada
        inteira e o modo de edicao e reaplicado - e por isso que existe o
        retorno de chamada "aoMudarEstrutura".

   Como uma lista vira uma colecao editavel: o elemento que contem as linhas
   recebe data-colecao="caminho.da.lista" no modulo de montagem. Este modulo
   encontra esses elementos e cria os botoes de adicionar e remover.

   Dois recursos opcionais, usados pela planilha:

     CAMPO BLOQUEADO
       A configuracao pode trazer "campoBloqueado(caminho)". Quando ela
       devolve true, aquele campo nao recebe digitacao e a sua linha nao
       ganha os botoes de adicionar e remover. E assim que os blocos dos
       sete dias ficam travados enquanto a semana nao for valida.

     CAMPO QUE RECALCULA
       Um campo marcado com data-recalcular dispara um redesenho completo
       quando perde o foco. E o caso do numero da semana: mudar o numero
       muda as datas de todos os dias, entao a pagina precisa ser refeita.
   ============================================================================ */

import { escreverCaminho, lerCaminho } from './caminho.js';
import { criarBotao } from './dom.js';

/**
 * Descobre se o navegador aceita contenteditable="plaintext-only".
 * Esse modo impede que o campo receba negrito, imagens ou HTML colado.
 * @returns {boolean}
 */
function aceitaTextoPuro() {
  const teste = document.createElement('div');
  teste.setAttribute('contenteditable', 'plaintext-only');
  return teste.contentEditable === 'plaintext-only';
}

/**
 * Cria um item vazio do mesmo formato dos itens que ja existem na lista.
 * - lista de textos  -> devolve ''
 * - lista de objetos -> devolve um objeto com as mesmas chaves, todas vazias
 * @param {Array} lista
 * @returns {string|object|null} null quando nao da para deduzir o formato
 */
function criarItemVazio(lista) {
  if (!Array.isArray(lista) || lista.length === 0) {
    return null;
  }
  const modelo = lista[lista.length - 1];

  if (typeof modelo === 'string') {
    return '';
  }
  if (modelo && typeof modelo === 'object') {
    const novo = {};
    Object.keys(modelo).forEach(function (chave) {
      novo[chave] = '';
    });
    return novo;
  }
  return null;
}

/**
 * Cria o editor inline do documento.
 * @param {{dados: object, raiz: HTMLElement,
 *          aoEditarTexto: function(): void,
 *          aoMudarEstrutura: function(): void,
 *          campoBloqueado?: function(string): boolean}} config
 *        dados            -> objeto que recebe as alteracoes
 *        raiz             -> elemento que contem os campos (o documento)
 *        aoEditarTexto    -> chamado a cada tecla digitada em um campo
 *        aoMudarEstrutura -> chamado ao adicionar, remover ou recalcular
 *        campoBloqueado   -> recebe o caminho e devolve true para travar
 * @returns {{ativar: function, desativar: function, alternar: function,
 *            estaAtivo: function, sincronizar: function,
 *            trocarDados: function}}
 */
export function criarEditor(config) {
  const modoTexto = aceitaTextoPuro() ? 'plaintext-only' : 'true';
  let dados = config.dados;
  let ativo = false;

  /* ------------------------------------------------------------------ */
  /* Campos de texto                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Diz se um campo esta travado no momento.
   * @param {string} caminho
   * @returns {boolean}
   */
  function estaBloqueado(caminho) {
    return typeof config.campoBloqueado === 'function' &&
           config.campoBloqueado(caminho);
  }

  /** Liga ou desliga a digitacao em todos os campos do documento. */
  function aplicarEstadoDosCampos() {
    config.raiz.querySelectorAll('[data-editavel]').forEach(function (campo) {
      const travado = estaBloqueado(campo.dataset.editavel);

      if (ativo && !travado) {
        campo.setAttribute('contenteditable', modoTexto);
        campo.setAttribute('spellcheck', 'false');
      } else {
        campo.removeAttribute('contenteditable');
        campo.removeAttribute('spellcheck');
      }
      campo.classList.toggle('campo-bloqueado', ativo && travado);
    });
  }

  /**
   * Grava no objeto de dados o texto que acabou de ser digitado.
   * @param {Event} evento
   */
  function aoDigitar(evento) {
    const campo = evento.target.closest('[data-editavel]');
    if (!campo) {
      return;
    }
    escreverCaminho(dados, campo.dataset.editavel, campo.textContent);
    config.aoEditarTexto();
  }

  /**
   * Em campos de uma linha so, a tecla Enter encerra a edicao em vez de
   * inserir uma quebra de linha que o documento nao comporta.
   * @param {KeyboardEvent} evento
   */
  function aoTeclar(evento) {
    if (evento.key !== 'Enter') {
      return;
    }
    const campo = evento.target.closest('[data-editavel]');
    if (campo && campo.dataset.multilinha !== 'sim') {
      evento.preventDefault();
      campo.blur();
    }
  }

  /**
   * Cola sempre como texto puro, mesmo nos navegadores sem suporte a
   * contenteditable="plaintext-only".
   * @param {ClipboardEvent} evento
   */
  function aoColar(evento) {
    const campo = evento.target.closest('[data-editavel]');
    if (!campo || modoTexto === 'plaintext-only') {
      return;
    }
    evento.preventDefault();
    const texto = (evento.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, texto);
  }

  /* ------------------------------------------------------------------ */
  /* Controles de linha (adicionar / remover)                            */
  /* ------------------------------------------------------------------ */

  /** Remove da pagina todos os botoes de adicionar e remover linha. */
  function limparControles() {
    config.raiz.querySelectorAll('.controle-linha, .botao-adicionar')
      .forEach(function (botao) {
        botao.remove();
      });
    document.querySelectorAll('[data-controles]').forEach(function (area) {
      area.textContent = '';
    });
  }

  /**
   * Cria o botao "x" que remove uma linha da colecao.
   * @param {string} caminho  caminho da lista no dados.json
   * @param {number} indice   posicao da linha na lista
   * @returns {HTMLButtonElement}
   */
  function criarBotaoRemover(caminho, indice) {
    return criarBotao('×', 'controle-linha remover-linha', function () {
      const lista = lerCaminho(dados, caminho);

      /* Nunca deixa a lista ficar vazia: sem nenhuma linha restante nao
         haveria como deduzir o formato para adicionar outra depois. */
      if (!Array.isArray(lista) || lista.length <= 1) {
        return;
      }
      lista.splice(indice, 1);
      config.aoMudarEstrutura();
    }, 'Remover esta linha');
  }

  /**
   * Cria o botao "+ linha" que acrescenta uma linha vazia a colecao.
   * @param {string} caminho  caminho da lista no dados.json
   * @returns {HTMLButtonElement}
   */
  function criarBotaoAdicionar(caminho) {
    return criarBotao('+ linha', 'botao-adicionar', function () {
      const lista = lerCaminho(dados, caminho);
      const novo = criarItemVazio(lista);

      if (novo !== null) {
        lista.push(novo);
        config.aoMudarEstrutura();
      }
    }, 'Adicionar uma linha em branco');
  }

  /**
   * Decide em que elemento o botao "x" daquela linha deve ser colocado.
   * O botao nunca pode ficar dentro do campo editavel, senao o seu texto
   * entraria na leitura do valor.
   * @param {HTMLElement} linha
   * @returns {HTMLElement}
   */
  function destinoDoBotao(linha) {
    /* 1. a celula que o modulo de montagem escolheu explicitamente */
    const escolhida = linha.querySelector('[data-celula-controle]');
    if (escolhida) {
      return escolhida;
    }
    /* 2. em uma <tr>, a ultima celula */
    if (linha.tagName === 'TR' && linha.lastElementChild) {
      return linha.lastElementChild;
    }
    /* 3. em um <p>, o proprio paragrafo */
    return linha;
  }

  /**
   * Cria os botoes de todas as colecoes do documento.
   *
   * Uma colecao pode ser declarada de duas formas:
   *
   *   a) NO ELEMENTO QUE CONTEM AS LINHAS (usado nas faturas)
   *      <tbody data-colecao="custos.linhas"> com uma <tr> por item.
   *
   *   b) NA PROPRIA LINHA (usado na planilha, onde as linhas de varios dias
   *      convivem dentro do mesmo <tbody>)
   *      <tr data-colecao="dias.0.tecnicos" data-indice="2">
   *
   * O botao "+ linha" vai para a area marcada com data-controles no
   * index.html ou para a celula marcada com data-adicionar na montagem.
   */
  function montarControles() {
    /* (a) colecoes declaradas no elemento que contem as linhas */
    config.raiz.querySelectorAll('[data-colecao]:not(tr)').forEach(function (colecao) {
      const caminho = colecao.dataset.colecao;

      /* Linhas da colecao: <tr> nas tabelas, <p> nas listas de paragrafos.
         A linha de total e marcada com data-fora-da-colecao e fica de fora. */
      const linhas = Array.from(colecao.children).filter(function (linha) {
        return linha.dataset.foraDaColecao !== 'sim';
      });

      if (estaBloqueado(caminho)) {
        return;
      }
      linhas.forEach(function (linha, indice) {
        destinoDoBotao(linha).appendChild(criarBotaoRemover(caminho, indice));
      });
    });

    /* (b) colecoes declaradas na propria linha */
    config.raiz.querySelectorAll('tr[data-colecao]').forEach(function (linha) {
      if (estaBloqueado(linha.dataset.colecao)) {
        return;
      }
      destinoDoBotao(linha).appendChild(
        criarBotaoRemover(linha.dataset.colecao, Number(linha.dataset.indice))
      );
    });

    /* Botoes "+ linha": nas areas do index.html... */
    document.querySelectorAll('[data-controles]').forEach(function (area) {
      if (!estaBloqueado(area.dataset.controles)) {
        area.appendChild(criarBotaoAdicionar(area.dataset.controles));
      }
    });

    /* ...e nas celulas que a montagem marcou para recebe-los */
    config.raiz.querySelectorAll('[data-adicionar]').forEach(function (celula) {
      if (!estaBloqueado(celula.dataset.adicionar)) {
        celula.appendChild(criarBotaoAdicionar(celula.dataset.adicionar));
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Ciclo de vida                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Ao sair de um campo marcado com data-recalcular, redesenha a pagina
   * inteira: o valor digitado ali manda em outras partes do documento.
   * O redesenho acontece na saida, e nao a cada tecla, para o cursor nao
   * saltar enquanto se digita.
   * @param {FocusEvent} evento
   */
  function aoSairDoCampo(evento) {
    const campo = evento.target.closest('[data-recalcular]');
    if (campo) {
      config.aoMudarEstrutura();
    }
  }

  /* Os ouvintes ficam na raiz e sao instalados uma unica vez: eles so agem
     quando o evento vem de um campo editavel. */
  config.raiz.addEventListener('input', aoDigitar);
  config.raiz.addEventListener('keydown', aoTeclar);
  config.raiz.addEventListener('paste', aoColar);
  config.raiz.addEventListener('focusout', aoSairDoCampo);

  /** Reaplica o estado atual - usado depois de redesenhar a pagina. */
  function sincronizar() {
    limparControles();
    aplicarEstadoDosCampos();
    if (ativo) {
      montarControles();
    }
    document.body.classList.toggle('modo-edicao', ativo);
  }

  return {
    /** Entra no modo de edicao. */
    ativar: function () {
      ativo = true;
      sincronizar();
    },

    /** Sai do modo de edicao. */
    desativar: function () {
      ativo = false;
      sincronizar();
    },

    /** Entra ou sai do modo de edicao. @returns {boolean} novo estado */
    alternar: function () {
      ativo = !ativo;
      sincronizar();
      return ativo;
    },

    /** @returns {boolean} true quando o modo de edicao esta ligado */
    estaAtivo: function () {
      return ativo;
    },

    /** Reaplica o estado atual aos elementos recem-desenhados. */
    sincronizar: sincronizar,

    /**
     * Troca o objeto de dados editado (usado ao descartar alteracoes).
     * @param {object} novosDados
     */
    trocarDados: function (novosDados) {
      dados = novosDados;
    }
  };
}
