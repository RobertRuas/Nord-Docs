#!/bin/bash
# =============================================================================
# Abre a pagina de modelos no navegador.
# -----------------------------------------------------------------------------
# Este e o unico atalho do projeto: ele serve a pasta inteira, entao os tres
# modelos ficam acessiveis a partir da pagina central.
#
# Por que um servidor e necessario:
#   As paginas leem o conteudo de arquivos .json com fetch(). Por seguranca,
#   os navegadores bloqueiam fetch() quando a pagina e aberta com duplo
#   clique (endereco file://). Servir por HTTP resolve.
#
# O que este script faz:
#   1. entra na pasta onde ele mesmo esta;
#   2. procura uma porta livre a partir da 8000;
#   3. sobe um servidor local que enxerga somente esta pasta;
#   4. abre a pagina central no navegador padrao.
#
# Para encerrar: feche esta janela do Terminal ou tecle Ctrl+C.
# =============================================================================

cd "$(dirname "$0")" || exit 1

PORTA=8000
while lsof -i ":$PORTA" >/dev/null 2>&1; do
  PORTA=$((PORTA + 1))
done

ENDERECO="http://127.0.0.1:$PORTA/index.html"

echo "Pasta servida : $(pwd)"
echo "Endereco      : $ENDERECO"
echo "Para encerrar : Ctrl+C (ou feche esta janela)"
echo

# "--bind 127.0.0.1" limita o servidor a esta maquina: nada fica exposto na rede
python3 -m http.server "$PORTA" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVIDOR=$!

trap 'kill "$SERVIDOR" 2>/dev/null' EXIT

sleep 1
open "$ENDERECO"

wait "$SERVIDOR"
