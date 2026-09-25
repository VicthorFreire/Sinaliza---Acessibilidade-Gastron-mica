const API = 'http://localhost:3000';

// ── Lê parâmetros da URL ──────────────────────────────────────────────
// O link "Gerenciar Cardápio" da página de Detalhes envia ?restauranteId=...
const params = new URLSearchParams(window.location.search);
const restauranteId = params.get('restauranteId') || params.get('id');

// ── Estado ────────────────────────────────────────────────────────────
let pratos = [];
let filtroAtivo = 'Todos';

// ── Elementos ─────────────────────────────────────────────────────────
const form             = document.getElementById('formPrato');
const nomePrato        = document.getElementById('nomePrato');
const precoPrato       = document.getElementById('precoPrato');
const categoriaPrato   = document.getElementById('categoriaPrato');
const descricaoPrato   = document.getElementById('descricaoPrato');
const btnGerarDesc     = document.getElementById('btnGerarDescricao');
const imagemPrato      = document.getElementById('imagemPrato');
const listaPratos      = document.getElementById('listaPratos');
const mensagem         = document.getElementById('mensagem');
const filtroBtns       = document.querySelectorAll('.filtro-btn');

// ── Gerar descrição automática ────────────────────────────────────────
btnGerarDesc.addEventListener('click', () => {
    const nome = nomePrato.value.trim();
    const cat  = categoriaPrato.value;
    if (!nome || !cat) {
        mostrarMensagem('Informe o nome e a categoria para gerar a descrição.', 'erro');
        return;
    }
    descricaoPrato.value = gerarDescricao(nome, cat);
    mostrarMensagem('Descrição gerada! Você pode editar antes de cadastrar.', 'sucesso');
});

// ── Submit do formulário (cadastra direto na API) ──────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!restauranteId) {
        mostrarMensagem('Nenhum restaurante selecionado. Volte e acesse pelo card do restaurante.', 'erro');
        return;
    }

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
    if (arquivo) {
        urlFoto = await lerImagemBase64(arquivo);
    }

    // Mesma estrutura usada na coleção "cardapio" do db.json,
    // para que a página de Detalhes consiga exibir o prato
    // na seção "Cardápio" com o mesmo estilo já existente.
    const novoPrato = {
        restauranteId: isNaN(Number(restauranteId)) ? restauranteId : Number(restauranteId),
        nome,
        preco,
        categoria,
        descricao,
        urlFoto
    };

    try {
        const resposta = await fetch(`${API}/cardapio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoPrato)
        });

        if (!resposta.ok) {
            throw new Error('Falha ao salvar o prato no servidor.');
        }

        const pratoSalvo = await resposta.json();
        pratos.push(pratoSalvo);
        renderizarPratos();
        limparCampos();
        mostrarMensagem('✓ Prato cadastrado com sucesso! Ele já aparece no cardápio do restaurante.', 'sucesso');

    } catch (erro) {
        console.error('Erro ao cadastrar prato:', erro);
        mostrarMensagem('Não foi possível cadastrar o prato. Verifique se o servidor está rodando.', 'erro');
    }
});

// ── Filtros ───────────────────────────────────────────────────────────
filtroBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filtroBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtroAtivo = btn.dataset.cat;
        renderizarPratos();
    });
});

// ── Carregar pratos já cadastrados na API ──────────────────────────────
async function carregarPratos() {
    if (!restauranteId) {
        listaPratos.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Nenhum restaurante selecionado.</p>
                <span>Acesse esta página a partir dos detalhes de um restaurante.</span>
            </div>`;
        return;
    }

    try {
        const resposta = await fetch(`${API}/cardapio?restauranteId=${restauranteId}`);

        if (!resposta.ok) {
            throw new Error('Não foi possível buscar o cardápio.');
        }

        pratos = await resposta.json();

    } catch (erro) {
        console.error('Erro ao carregar pratos:', erro);
        pratos = [];
        mostrarMensagem('Não foi possível carregar o cardápio do servidor.', 'erro');
    }

    renderizarPratos();
}

// ── Carregar nome do restaurante (para o título da página) ─────────────
async function carregarNomeRestaurante() {
    const titulo = document.getElementById('tituloPagina');

    if (!restauranteId) {
        titulo.textContent = 'Cardápio do Restaurante';
        return;
    }

    try {
        const resposta = await fetch(`${API}/restaurantes/${restauranteId}`);

        if (!resposta.ok) {
            throw new Error('Restaurante não encontrado.');
        }

        const restaurante = await resposta.json();
        titulo.textContent = 'Cardápio: ' + restaurante.nome;
        document.title = 'Cardápio – ' + restaurante.nome + ' | Sinaliza';

    } catch (erro) {
        console.error('Erro ao carregar nome do restaurante:', erro);
        titulo.textContent = 'Cardápio do Restaurante';
    }
}

// ── Renderizar lista de pratos ────────────────────────────────────────
function renderizarPratos() {
    const lista = filtroAtivo === 'Todos'
        ? pratos
        : pratos.filter(p => p.categoria === filtroAtivo);

    listaPratos.innerHTML = '';

    if (lista.length === 0) {
        listaPratos.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-journal-x"></i>
                <p>${filtroAtivo === 'Todos' ? 'Nenhum prato cadastrado ainda.' : 'Nenhum prato nesta categoria.'}</p>
                <span>${filtroAtivo === 'Todos' ? 'Use o formulário ao lado para adicionar o primeiro prato.' : 'Tente outro filtro ou cadastre um prato nesta categoria.'}</span>
            </div>`;
        return;
    }

    lista.forEach(prato => {
        const card = document.createElement('div');
        card.className = 'prato-card';
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', prato.nome);

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
                <button class="prato-remover" onclick="removerPrato('${prato.id}')" aria-label="Remover ${prato.nome}">
                    <i class="bi bi-trash3"></i> Remover
                </button>
            </div>
        `;

        listaPratos.appendChild(card);
    });
}

// ── Remover prato (apaga também na API) ────────────────────────────────
async function removerPrato(id) {
    try {
        const resposta = await fetch(`${API}/cardapio/${id}`, { method: 'DELETE' });

        if (!resposta.ok) {
            throw new Error('Não foi possível remover o prato no servidor.');
        }

        pratos = pratos.filter(p => String(p.id) !== String(id));
        renderizarPratos();
        mostrarMensagem('Prato removido com sucesso.', 'sucesso');

    } catch (erro) {
        console.error('Erro ao remover prato:', erro);
        mostrarMensagem('Não foi possível remover o prato. Verifique o servidor.', 'erro');
    }
}

// ── Utilitários ───────────────────────────────────────────────────────
function limparCampos() {
    nomePrato.value = '';
    precoPrato.value = '';
    categoriaPrato.value = '';
    descricaoPrato.value = '';
    imagemPrato.value = '';
}

function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = 'mensagem-feedback ' + tipo;
    setTimeout(() => {
        mensagem.className = 'mensagem-feedback';
        mensagem.textContent = '';
    }, 4000);
}

function gerarDescricao(nome, categoria) {
    const descricoes = {
        'Entrada': `${nome} é uma opção leve e saborosa para iniciar a refeição, preparada para abrir o apetite com equilíbrio e qualidade.`,
        'Prato Principal': `${nome} é um prato principal completo, pensado para oferecer sabor, boa apresentação e uma experiência marcante ao cliente.`,
        'Sobremesa': `${nome} é uma sobremesa deliciosa, ideal para finalizar a refeição com um toque especial de sabor.`,
        'Bebida': `${nome} é uma bebida refrescante e agradável, perfeita para acompanhar diferentes momentos da refeição.`
    };
    return descricoes[categoria] || `${nome} é uma opção especial do cardápio, preparada para oferecer sabor e qualidade aos clientes.`;
}

function emojiCategoria(cat) {
    const map = { 'Entrada': '🥗', 'Prato Principal': '🍽️', 'Sobremesa': '🍰', 'Bebida': '🥤' };
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

// ── Init ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    carregarNomeRestaurante();
    carregarPratos();
});