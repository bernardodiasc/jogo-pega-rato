/* ============================================================
   JOGO PEGA RATO
   Tabuleiro 5x5: mova o gato e pegue todos os ratos.
   Controles: setas / WASD, clique ou toque na casa vizinha,
   arraste (swipe) no tabuleiro. Espaço reinicia.
   ============================================================ */

// --- Configuração ---
const DIFICULDADE = 3      // a cada quantos movimentos nasce um novo rato
const TOTAL = 25           // total de casas (5x5)
const COLUNAS = 5

// --- Elementos da tela ---
const $pontuacao = document.querySelector('#pontuacao')
const $mensagem = document.querySelector('#mensagem')
const $tabuleiro = document.querySelector('#tabuleiro')
const $reiniciar = document.querySelector('#reiniciar')

// --- Desenhos em ASCII (orelhas pontudas = gato, redondas = rato) ---
const GATO = '<pre id="gato">/\\_/\\\n(o.o)</pre>'
const RATO = '<pre class="rato">()_()\n(o.o)</pre>'

const MENSAGENS = {
  inicio: 'Pegue todos os ratos!',
  vitoria: 'Você pegou todos os ratos! \\o/',
  voltaram: 'Os ratos voltaram... pegue todos de novo!'
}

// --- Estado do jogo ---
let jogadas = 0
let pontos = 0
let venceu = false
let gato // referência ao elemento do gato no DOM

// Converte um número em "01", "02"... (o id de cada casa)
const id = n => String(n).padStart(2, '0')
const casa = n => document.querySelector(`[data-id="${id(n)}"]`)

// Dada a posição atual, calcula a casa vizinha em cada direção.
// Ao chegar na borda, o movimento "dá a volta" para o outro lado.
function vizinho (pos, direcao) {
  if (direcao === 'cima')     return pos > COLUNAS ? pos - COLUNAS : pos + (TOTAL - COLUNAS)
  if (direcao === 'baixo')    return pos <= TOTAL - COLUNAS ? pos + COLUNAS : pos - (TOTAL - COLUNAS)
  if (direcao === 'esquerda') return pos % COLUNAS !== 1 ? pos - 1 : pos + (COLUNAS - 1)
  if (direcao === 'direita')  return pos % COLUNAS !== 0 ? pos + 1 : pos - (COLUNAS - 1)
}

// Monta (ou reinicia) o jogo: preenche o tabuleiro de ratos e coloca o gato.
function montaJogo () {
  jogadas = 0
  pontos = 0
  venceu = false
  $reiniciar.classList.remove('destaque')
  $tabuleiro.innerHTML = ''

  for (let i = 1; i <= TOTAL; i++) {
    const local = document.createElement('div')
    local.className = 'local'
    local.dataset.id = id(i)
    local.innerHTML = RATO
    $tabuleiro.appendChild(local)
  }

  const posGato = Math.floor(Math.random() * TOTAL) + 1 // 1..25 (casa válida)
  casa(posGato).innerHTML = GATO
  gato = document.querySelector('#gato')

  destacaVizinhos(posGato)
  escreveMensagem(MENSAGENS.inicio)
  escrevePontuacao()
}

// Destaca as 4 casas vizinhas e deixa cada uma clicável/tocável.
function destacaVizinhos (pos) {
  document.querySelectorAll('.local').forEach(l => {
    l.classList.remove('mover')
    l.onclick = null
  })
  ;['cima', 'baixo', 'esquerda', 'direita'].forEach(direcao => {
    const alvo = casa(vizinho(pos, direcao))
    alvo.classList.add('mover')
    alvo.onclick = () => mover(direcao)
  })
}

// Move o gato numa direção (usado por teclado, clique e swipe).
function mover (direcao) {
  const atual = Number(gato.parentElement.dataset.id)
  const destino = casa(vizinho(atual, direcao))
  const pegouRato = destino.querySelector('.rato')

  gato.parentElement.innerHTML = '' // esvazia a casa antiga
  destino.innerHTML = ''            // remove o rato (se houver) da casa nova
  destino.appendChild(gato)

  jogadas++
  if (pegouRato) pontos++
  animaGato(pegouRato)

  // A cada DIFICULDADE movimentos, nasce um rato numa casa vazia.
  if (jogadas % DIFICULDADE === 0) nasceRato()

  destacaVizinhos(Number(destino.dataset.id))
  verificaVitoria()
  escrevePontuacao()
}

// Faz nascer um rato em uma casa vazia escolhida ao acaso.
function nasceRato () {
  const vazias = [...document.querySelectorAll('.local')].filter(l => !l.innerHTML.trim())
  if (!vazias.length) return
  vazias[Math.floor(Math.random() * vazias.length)].innerHTML = RATO
}

// Venceu quando não há mais ratos no tabuleiro.
function verificaVitoria () {
  const restantes = document.querySelectorAll('.rato').length
  if (restantes === 0 && !venceu) {
    venceu = true
    escreveMensagem(MENSAGENS.vitoria, true)
    $reiniciar.classList.add('destaque')
  } else if (restantes > 0 && venceu) {
    venceu = false
    escreveMensagem(MENSAGENS.voltaram)
    $reiniciar.classList.remove('destaque')
  }
}

// Reinicia a animação do gato (pulo ao mover, comemoração ao pegar).
function animaGato (pegou) {
  const classe = pegou ? 'comeu' : 'pulo'
  gato.classList.remove('pulo', 'comeu')
  void gato.offsetWidth // força o navegador a "reiniciar" a animação
  gato.classList.add(classe)
}

function escreveMensagem (texto, ehVitoria = false) {
  $mensagem.textContent = texto
  $mensagem.classList.toggle('venceu', ehVitoria)
}

function escrevePontuacao () {
  const restantes = document.querySelectorAll('.rato').length
  const precisao = jogadas ? Math.round(pontos / jogadas * 100) : 0
  $pontuacao.innerHTML = [
    ['Movimentos', jogadas],
    ['Capturados', pontos],
    ['Restantes', restantes],
    ['Precisão', precisao + '%']
  ].map(([rotulo, valor]) => `<div class="stat"><b>${valor}</b><span>${rotulo}</span></div>`).join('')
}

/* ===== Entradas: teclado, botão e toque ===== */

const MAPA_TECLAS = {
  ArrowUp: 'cima', w: 'cima', W: 'cima',
  ArrowDown: 'baixo', s: 'baixo', S: 'baixo',
  ArrowLeft: 'esquerda', a: 'esquerda', A: 'esquerda',
  ArrowRight: 'direita', d: 'direita', D: 'direita'
}

document.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); montaJogo(); return }
  const direcao = MAPA_TECLAS[e.key]
  if (!direcao) return
  e.preventDefault() // evita a página rolar ao usar as setas
  mover(direcao)
})

$reiniciar.addEventListener('click', montaJogo)

// Arrastar (swipe) no tabuleiro — ideal para jogar com uma mão no celular.
let toqueX = 0
let toqueY = 0
$tabuleiro.addEventListener('touchstart', e => {
  toqueX = e.changedTouches[0].clientX
  toqueY = e.changedTouches[0].clientY
}, { passive: true })
$tabuleiro.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - toqueX
  const dy = e.changedTouches[0].clientY - toqueY
  if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return // toque simples: deixa o clique da casa agir
  e.preventDefault() // arrasto: cancela o "clique fantasma" e move pelo swipe
  if (Math.abs(dx) > Math.abs(dy)) mover(dx > 0 ? 'direita' : 'esquerda')
  else mover(dy > 0 ? 'baixo' : 'cima')
}, { passive: false })

// Começa o jogo
montaJogo()
