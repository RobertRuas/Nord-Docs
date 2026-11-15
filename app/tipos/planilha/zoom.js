/* ============================================================================
   zoom.js - ampliar e reduzir a planilha na tela
   ----------------------------------------------------------------------------
   Recurso do visualizador, nao do documento: nenhuma medida original e
   alterada. Na impressao o zoom e ignorado (ver @media print no planilha.css).

   Como funciona:
     - ".conteudo-zoom" recebe um transform: scale(fator);
     - como o transform NAO muda o espaco ocupado no layout, o elemento
       ".palco" recebe por script a largura e a altura ja multiplicadas pelo
       fator - e assim a moldura branca e as barras de rolagem acompanham.
   ============================================================================ */

/* Niveis percorridos pelos botoes "-" e "+" */
const NIVEIS_ZOOM = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];

/* Limites aceitos (tambem valem para o botao "Ajustar") */
const ZOOM_MINIMO = NIVEIS_ZOOM[0];
const ZOOM_MAXIMO = NIVEIS_ZOOM[NIVEIS_ZOOM.length - 1];

/* Chave usada para lembrar o zoom escolhido entre uma visita e outra */
const CHAVE_ZOOM = 'nord-timesheet-zoom';

/* Fator aplicado no momento */
let zoomAtual = 1;

/**
 * Mantem um numero dentro de um intervalo.
 * @param {number} valor
 * @param {number} minimo
 * @param {number} maximo
 * @returns {number}
 */
function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo);
}

/**
 * Guarda o zoom escolhido no navegador.
 * Envolvido em try/catch porque o armazenamento pode estar bloqueado
 * (janela anonima, por exemplo) - nesse caso o zoom simplesmente nao e
 * lembrado, sem quebrar a pagina.
 * @param {number} fator
 */
function guardarZoom(fator) {
  try {
    window.localStorage.setItem(CHAVE_ZOOM, String(fator));
  } catch (erro) {
    /* sem armazenamento disponivel: nada a fazer */
  }
}

/**
 * Le o zoom guardado anteriormente.
 * @returns {number} fator salvo ou 1 quando nao houver nada valido
 */
function lerZoomGuardado() {
  try {
    const salvo = parseFloat(window.localStorage.getItem(CHAVE_ZOOM));
    if (!isNaN(salvo) && salvo > 0) {
      return limitar(salvo, ZOOM_MINIMO, ZOOM_MAXIMO);
    }
  } catch (erro) {
    /* sem armazenamento disponivel: usa o padrao */
  }
  return 1;
}

/**
 * Aplica um fator de zoom e atualiza a barra de ferramentas.
 * @param {number} fator  1 = tamanho original
 */
export function aplicarZoom(fator) {
  const palco = document.getElementById('palco');
  const conteudo = document.getElementById('conteudo-zoom');
  if (!palco || !conteudo) {
    return;
  }

  zoomAtual = limitar(fator, ZOOM_MINIMO, ZOOM_MAXIMO);

  /* offsetWidth/offsetHeight ignoram o transform, ou seja, devolvem sempre
     o tamanho original da planilha - exatamente o que precisamos aqui. */
  const larguraOriginal = conteudo.offsetWidth;
  const alturaOriginal = conteudo.offsetHeight;

  conteudo.style.setProperty('--zoom', String(zoomAtual));
  palco.style.width = (larguraOriginal * zoomAtual) + 'px';
  palco.style.height = (alturaOriginal * zoomAtual) + 'px';

  atualizarBarraZoom();
  guardarZoom(zoomAtual);
}

/** Reaplica o zoom atual - usado depois de redesenhar a planilha. */
export function recalcularZoom() {
  aplicarZoom(zoomAtual);
}

/** Atualiza a porcentagem exibida e liga/desliga os botoes nos limites. */
function atualizarBarraZoom() {
  const valor = document.getElementById('zoom-valor');
  const botaoMenos = document.getElementById('zoom-menos');
  const botaoMais = document.getElementById('zoom-mais');

  if (valor) {
    valor.textContent = Math.round(zoomAtual * 100) + '%';
  }
  if (botaoMenos) {
    botaoMenos.disabled = zoomAtual <= ZOOM_MINIMO;
  }
  if (botaoMais) {
    botaoMais.disabled = zoomAtual >= ZOOM_MAXIMO;
  }
}

/**
 * Vai para o proximo nivel de zoom acima ou abaixo do atual.
 * @param {number} direcao  +1 para ampliar, -1 para reduzir
 */
function mudarNivelZoom(direcao) {
  let proximo;

  if (direcao > 0) {
    proximo = NIVEIS_ZOOM.find(function (nivel) {
      return nivel > zoomAtual + 0.001;
    });
  } else {
    proximo = NIVEIS_ZOOM.filter(function (nivel) {
      return nivel < zoomAtual - 0.001;
    }).pop();
  }

  if (proximo !== undefined) {
    aplicarZoom(proximo);
  }
}

/** Calcula e aplica o zoom que faz a planilha caber na largura da janela. */
export function ajustarALargura() {
  const conteudo = document.getElementById('conteudo-zoom');
  const moldura = document.querySelector('.moldura');
  if (!conteudo || !moldura) {
    return;
  }

  const estiloCorpo = window.getComputedStyle(document.body);
  const estiloMoldura = window.getComputedStyle(moldura);

  /* Espaco util = largura do corpo menos as folgas do corpo e da moldura */
  const disponivel = document.body.clientWidth
    - parseFloat(estiloCorpo.paddingLeft)
    - parseFloat(estiloCorpo.paddingRight)
    - parseFloat(estiloMoldura.paddingLeft)
    - parseFloat(estiloMoldura.paddingRight);

  const larguraOriginal = conteudo.offsetWidth;
  if (larguraOriginal > 0 && disponivel > 0) {
    /* Math.floor em centesimos evita sobrar 1px e criar rolagem */
    aplicarZoom(Math.floor((disponivel / larguraOriginal) * 100) / 100);
  }
}

/** Liga os botoes, os atalhos de teclado e o Ctrl/Cmd + roda do mouse. */
export function iniciarZoom() {
  const botaoMenos = document.getElementById('zoom-menos');
  const botaoMais = document.getElementById('zoom-mais');
  const botaoOriginal = document.getElementById('zoom-original');
  const botaoLargura = document.getElementById('zoom-largura');

  if (botaoMenos) {
    botaoMenos.addEventListener('click', function () { mudarNivelZoom(-1); });
  }
  if (botaoMais) {
    botaoMais.addEventListener('click', function () { mudarNivelZoom(1); });
  }
  if (botaoOriginal) {
    botaoOriginal.addEventListener('click', function () { aplicarZoom(1); });
  }
  if (botaoLargura) {
    botaoLargura.addEventListener('click', ajustarALargura);
  }

  /* Atalhos: Ctrl/Cmd com "+", "-" ou "0" */
  document.addEventListener('keydown', function (evento) {
    if (!evento.ctrlKey && !evento.metaKey) {
      return;
    }
    if (evento.key === '+' || evento.key === '=') {
      evento.preventDefault();
      mudarNivelZoom(1);
    } else if (evento.key === '-' || evento.key === '_') {
      evento.preventDefault();
      mudarNivelZoom(-1);
    } else if (evento.key === '0') {
      evento.preventDefault();
      aplicarZoom(1);
    }
  });

  /* Ctrl/Cmd + roda do mouse, como em qualquer editor de planilha.
     "passive: false" e necessario para poder cancelar o zoom do navegador. */
  document.addEventListener('wheel', function (evento) {
    if (!evento.ctrlKey && !evento.metaKey) {
      return;
    }
    evento.preventDefault();
    mudarNivelZoom(evento.deltaY < 0 ? 1 : -1);
  }, { passive: false });

  /* Comeca no ultimo zoom usado (ou em 100% na primeira vez) */
  aplicarZoom(lerZoomGuardado());
}
