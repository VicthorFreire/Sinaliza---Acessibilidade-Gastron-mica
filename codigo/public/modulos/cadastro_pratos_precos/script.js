const API = 'http://localhost:3000';

// ── Estado da Sessão e Dados ──────────────────────────────────────────
let restauranteLogadoId = null; 
let pratos = [];
let filtroAtivo = 'Todos';

// ── Elementos DOM ─────────────────────────────────────────────────────
const form             = document.getElementById('formPrato');
const inputPratoId     = document.getElementById('pratoId');
const nomePrato        = document.getElementById('nomePrato');
const precoPrato       = document.getElementById('precoPrato');
const categoriaPrato   = document.getElementById('categoriaPrato');
const descricaoPrato   = document.getElementById('descricaoPrato');
const btnGerarDesc     = document.getElementById('btnGerarDescricao');
const imagemPrato      = document.getElementById('imagemPrato');
const listaPratos      = document.getElementById('listaPratos');
const mensagem         = document.getElementById('mensagem');
const filtroBtns       = document.querySelectorAll('.filtro-btn');
const btnSubmit        = document.getElementById('btnSubmit');
const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');

// ── 1. AUTENTICAÇÃO E CARREGAMENTO DO RESTAURANTE ─────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const resposta = await fetch(`${API}/sessao`);
        const sessaoArray = await resposta.json();
        const sessao = sessaoArray[0] || {}; 

        if (!sessao.usuarioId || sessao.tipo !== 'restaurante') {
            alert("Acesso restrito. Faça login como restaurante.");
            window.location.href = '../autenticacao/index.html'; 
            return;
        }
        const respRestaurante = await fetch(`${API}/restaurantes/${sessao.usuarioId}`);
        
        if (!respRestaurante.ok) {
            alert("Erro: Você precisa criar o perfil do seu restaurante antes de cadastrar o cardápio!");
            window.location.href = '../painel_restaurante/index.html';
            return;
        }

        const restaurante = await respRestaurante.json();

        restauranteLogadoId = String(restaurante.id);
        
        document.getElementById('tituloPagina').textContent = 'Cardápio: ' + restaurante.nome;
        
        carregarPratos();

    } catch (erro) {
        console.error("Erro na validação da sessão:", erro);
        alert("Erro no servidor. Verifique se o json-server está rodando.");
    }
});

// ── 2. SALVAR DADOS (POST / PUT) ──────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const idExistente = inputPratoId.value;
    const nome      = nomePrato.value.trim();
    const preco     = parseFloat(precoPrato.value);
    const categoria = categoriaPrato.value;
    const descricao = descricaoPrato.value.trim() || gerarDescricao(nome, categoria);
    const arquivo   = imagemPrato.files[0];

    if (!nome || !(preco > 0) || !categoria) {
        mostrarMensagem('Preencha nome, preço e categoria corretamente.', 'erro');
        return;
    }

    let urlFoto = '';
    if (idExistente && !arquivo) {
        const pratoAtual = pratos.find(p => String(p.id) === String(idExistente));
        urlFoto = pratoAtual ? pratoAtual.urlFoto : '';
    } else if (arquivo) {
        urlFoto = await lerImagemBase64(arquivo);
    }

    const dadosPrato = {
        restauranteId: restauranteLogadoId,
        nome,
        preco,
        categoria,
        descricao,
        urlFoto
    };

    let url = `${API}/cardapio`;
    let metodo = 'POST';

    if (idExistente) {
        url = `${API}/cardapio/${idExistente}`;
        metodo = 'PUT';
    }

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosPrato)
        });

        if (!resposta.ok) throw new Error('Falha na comunicação com a API.');

        mostrarMensagem(idExistente ? '✓ Prato atualizado com sucesso!' : '✓ Prato cadastrado com sucesso!', 'sucesso');
        limparCampos();
        carregarPratos();

    } catch (erro) {
        console.error('Erro ao salvar:', erro);
        mostrarMensagem('Erro ao salvar. Verifique a conexão com o servidor.', 'erro');
    }
});

// ── 3. BUSCAR DADOS (GET) ─────────────────────────────────────────────
async function carregarPratos() {
    try {
        const resposta = await fetch(`${API}/cardapio?restauranteId=${restauranteLogadoId}`);
        if (!resposta.ok) throw new Error('Falha ao buscar o cardápio.');
        
        pratos = await resposta.json();
        renderizarPratos();
    } catch (erro) {
        console.error('Erro ao carregar pratos:', erro);
        mostrarMensagem('Não foi possível carregar seu cardápio.', 'erro');
    }
}

// ── 4. EDIÇÃO E REMOÇÃO ───────────────────────────────────────────────
window.prepararEdicao = function(id) {
    const prato = pratos.find(p => String(p.id) === String(id));
    if (!prato) return;

    if (String(prato.restauranteId) !== String(restauranteLogadoId)) {
        alert("Operação não autorizada!");
        return;
    }

    inputPratoId.value = prato.id;
    nomePrato.value = prato.nome;
    precoPrato.value = prato.preco;
    categoriaPrato.value = prato.categoria;
    descricaoPrato.value = prato.descricao;

    document.getElementById('tituloFormulario').innerHTML = '<i class="bi bi-pencil-square me-2 text-warning"></i>Editar Prato';
    btnSubmit.innerHTML = '<i class="bi bi-check-circle me-2"></i>Salvar Alterações';
    btnCancelarEdicao.style.display = 'flex';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.removerPrato = async function(id) {
    if(!confirm("Tem certeza que deseja remover este prato?")) return;

    try {
        const resposta = await fetch(`${API}/cardapio/${id}`, { method: 'DELETE' });
        if (!resposta.ok) throw new Error('Falha ao remover o prato.');

        mostrarMensagem('Prato removido com sucesso.', 'sucesso');
        carregarPratos();
    } catch (erro) {
        console.error('Erro ao remover prato:', erro);
        mostrarMensagem('Não foi possível remover o prato.', 'erro');
    }
};

// ── 5. RENDERIZAÇÃO DO LAYOUT ─────────────────────────────────────────
function renderizarPratos() {
    const lista = filtroAtivo === 'Todos' ? pratos : pratos.filter(p => p.categoria === filtroAtivo);
    listaPratos.innerHTML = '';

    if (lista.length === 0) {
        listaPratos.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-journal-x"></i>
                <p>Nenhum prato encontrado.</p>
                <span>Cadastre novos pratos usando o formulário.</span>
            </div>`;
        return;
    }

    lista.forEach(prato => {
        const card = document.createElement('div');
        card.className = 'prato-card';
        card.setAttribute('role', 'article');

        const fotoHtml = (prato.urlFoto && prato.urlFoto.length > 10)
            ? `<img src="${prato.urlFoto}" alt="Foto de ${prato.nome}" class="prato-img">`
            : `<div class="prato-img-placeholder">${emojiCategoria(prato.categoria)}</div>`;

        const preco = Number(prato.preco) || 0;

        card.innerHTML = `
            ${fotoHtml}
            <div class="prato-body">
                <span class="prato-categoria">${prato.categoria}</span>
                <p class="prato-nome">${prato.nome}</p>
                <p class="prato-desc">${prato.descricao}</p>
                <p class="prato-preco">R$ ${preco.toFixed(2)}</p>
                
                <div class="d-flex gap-2 mt-2 border-top pt-3">
                    <button class="prato-editar flex-grow-1" onclick="prepararEdicao('${prato.id}')">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="prato-remover flex-grow-1" onclick="removerPrato('${prato.id}')">
                        <i class="bi bi-trash3"></i> Excluir
                    </button>
                </div>
            </div>
        `;
        listaPratos.appendChild(card);
    });
}

// ── 6. CONTROLADORES DE EVENTO E UTILITÁRIOS ──────────────────────────
filtroBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filtroBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtroAtivo = btn.dataset.cat;
        renderizarPratos();
    });
});

btnGerarDesc.addEventListener('click', () => {
    const nome = nomePrato.value.trim();
    const cat  = categoriaPrato.value;
    if (!nome || !cat) {
        mostrarMensagem('Informe o nome e a categoria para gerar a descrição.', 'erro');
        return;
    }
    descricaoPrato.value = gerarDescricao(nome, cat);
    mostrarMensagem('Descrição gerada! Você pode editar antes de salvar.', 'sucesso');
});

function limparCampos() {
    form.reset();
    inputPratoId.value = '';
    document.getElementById('tituloFormulario').innerHTML = '<i class="bi bi-plus-circle me-2 text-primary"></i>Novo Prato';
    btnSubmit.innerHTML = '<i class="bi bi-check-circle me-2"></i>Cadastrar Prato';
    btnCancelarEdicao.style.display = 'none';
}

function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = 'mensagem-feedback ' + tipo;
    setTimeout(() => { mensagem.className = 'mensagem-feedback'; mensagem.textContent = ''; }, 4000);
}

function gerarDescricao(nome, categoria) {
    const descricoes = {
        'Entrada': `${nome} é uma opção leve e saborosa para iniciar a refeição.`,
        'Prato Principal': `${nome} é um prato principal completo e marcante.`,
        'Sobremesa': `${nome} é uma sobremesa deliciosa para adoçar seu dia.`,
        'Bebida': `${nome} é uma opção refrescante ideal para acompanhar seu prato.`,
    };
    return descricoes[categoria] || `${nome} é uma opção especial do nosso cardápio.`;
}

function emojiCategoria(cat) {
    const map = { 
        'Entrada': '🥗', 'Prato Principal': '🍽️', 'Sobremesa': '🍰', 'Bebida': '🥤'
    };
    return map[cat] || '🍴';
}

function lerImagemBase64(arquivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(arquivo);
    });
}