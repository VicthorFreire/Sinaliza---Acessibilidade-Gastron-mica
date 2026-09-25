let restaurantesData = [];
let avaliacoesData = [];
let tagsAtivas = []; // Array que guarda os IDs dos botões clicados
let termoBusca = ""; // Guarda o texto da barra de pesquisa

// MOTOR DE CONFIGURAÇÃO: Mapeia o botão da tela para o boolean correto no db.json
const filtrosDisponiveis = [
    { id: 'libras', label: '🤟 LIBRAS', testaRegra: r => r.checklist?.comunicacao?.libras === true },
    { id: 'cardapioFotos', label: '📸 Cardápio com Imagens', testaRegra: r => r.checklist?.comunicacao?.cardapioImagens === true },
    { id: 'sinalizacao', label: '♿ Sinalização Visual', testaRegra: r => r.checklist?.inclusao?.sinalizacao === true },
    { id: 'tablet', label: '📱 Tablet de Pedidos', testaRegra: r => r.checklist?.tecnologia?.tabletPedidos === true },
    { id: 'equipe', label: '🤝 Equipe Treinada', testaRegra: r => r.checklist?.atendimento?.funcionariosTreinados === true }
];

document.addEventListener('DOMContentLoaded', async () => {
    renderizarFiltros(); // Desenha os botões na tela primeiro
    
    try {
        const [respostaRestaurantes, respostaAvaliacoes] = await Promise.all([
            fetch('http://localhost:3000/restaurantes'),
            fetch('http://localhost:3000/avaliacoes')
        ]);
        restaurantesData = await respostaRestaurantes.json();
        avaliacoesData = await respostaAvaliacoes.json();
        aplicarFiltros(); // Roda a renderização inicial
    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        document.getElementById('lista-restaurantes').innerHTML = '<p style="text-align: center; color: red;">Erro ao carregar restaurantes do servidor.</p>';
    }
});

// Retorna até 3 tags mais frequentes nas avaliações de um restaurante
function obterTagsMaisComuns(restauranteId, limite = 3) {
    const contagem = {};
    avaliacoesData
        .filter(av => String(av.restauranteId) === String(restauranteId))
        .forEach(av => {
            (av.tags || []).forEach(tag => {
                contagem[tag] = (contagem[tag] || 0) + 1;
            });
        });

    return Object.keys(contagem)
        .sort((a, b) => contagem[b] - contagem[a])
        .slice(0, limite);
}
// 1. GERA OS BOTÕES NA TELA
function renderizarFiltros() {
    const container = document.getElementById('filtros-container');
    container.innerHTML = '';

    filtrosDisponiveis.forEach(filtro => {
        const button = document.createElement('button');
        button.className = 'filter-pill';
        button.textContent = filtro.label;
        button.setAttribute('aria-pressed', 'false');
        
        button.onclick = () => toggleFiltro(filtro.id, button);
        container.appendChild(button);
    });
}

// 2. CONTROLA SE O BOTÃO FOI LIGADO OU DESLIGADO
function toggleFiltro(filtroId, buttonElement) {
    const index = tagsAtivas.indexOf(filtroId);
    
    if (index > -1) {
        // Desliga o filtro
        tagsAtivas.splice(index, 1);
        buttonElement.classList.remove('active');
        buttonElement.setAttribute('aria-pressed', 'false');
    } else {
        // Liga o filtro
        tagsAtivas.push(filtroId);
        buttonElement.classList.add('active');
        buttonElement.setAttribute('aria-pressed', 'true');
    }
    
    aplicarFiltros();
}

// 3. CAPTURA A BARRA DE PESQUISA
document.getElementById('inputBusca').addEventListener('input', (e) => {
    termoBusca = e.target.value.toLowerCase();
    aplicarFiltros();
});

// 4. O CÉREBRO: JUNTA BARRA DE TEXTO + BOTÕES COM LÓGICA "AND"
function aplicarFiltros() {
    const restaurantesFiltrados = restaurantesData.filter(restaurante => {
        
        // A. Passa na barra de pesquisa? (Tratamento para evitar erro se faltar dado no json)
        const nome = restaurante.nome ? restaurante.nome.toLowerCase() : '';
        const cidade = restaurante.cidade ? restaurante.cidade.toLowerCase() : '';
        const cozinha = restaurante.tipoCozinha ? restaurante.tipoCozinha.toLowerCase() : '';
        
        const passaBusca = nome.includes(termoBusca) || cidade.includes(termoBusca) || cozinha.includes(termoBusca);
        if (!passaBusca) return false;

        // B. Passa nas Tags (Lógica "E")?
        if (tagsAtivas.length === 0) return true; // Se não tem tag clicada, passa.

        // O every garante que o restaurante atende a TODAS as tags ativas
        return tagsAtivas.every(idAtivo => {
            const regraFiltro = filtrosDisponiveis.find(f => f.id === idAtivo);
            return regraFiltro ? regraFiltro.testaRegra(restaurante) : false;
        });
    });

    renderizarCards(restaurantesFiltrados);
}

// 5. DESENHA OS CARDS OU O AVISO DE "NADA ENCONTRADO"
function renderizarCards(lista) {
    const container = document.getElementById('lista-restaurantes');
    container.innerHTML = ''; 

    if (lista.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-search"></i>
                <h3>Nenhum restaurante encontrado</h3>
                <p>Não encontramos locais com a combinação exata desses filtros. Tente remover algumas opções.</p>
            </div>
        `;
        return;
    }

    lista.forEach(restaurante => {
        if(!restaurante.nome) return; 

        const article = document.createElement('article');
        article.className = 'card';
        article.tabIndex = 0;

    let seloLibras = '';
        if (restaurante.checklist?.comunicacao?.libras) {
            seloLibras = `
                <div class="badge-libras" aria-label="Atendimento em LIBRAS disponível" style="color: var(--primary); font-weight: bold; margin-bottom: 0.5rem;">
                    <span class="icon">🤟</span> LIBRAS
                </div>
            `;
        }

        // Monta até 3 badges com as tags mais comuns nas avaliações do restaurante
        const tagsComuns = obterTagsMaisComuns(restaurante.id);
        let tagsComunsHTML = '';
        if (tagsComuns.length > 0) {
            tagsComunsHTML = `
                <div class="tags-comuns-card">
                    ${tagsComuns.map(tag => `<span class="tag-comum-mini">${tag}</span>`).join('')}
                </div>
            `;
        }

        let fotoUrl = (restaurante.foto && restaurante.foto.length > 15) ? restaurante.foto : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400';

        article.innerHTML = `
            <img src="${fotoUrl}" alt="Fachada do Restaurante ${restaurante.nome}" class="card-image">
            <div class="card-content">
                ${seloLibras}
                <h3 class="card-title">${restaurante.nome}</h3>
                ${tagsComunsHTML}
                <p class="card-description">
                    <strong>${restaurante.tipoCozinha || 'Culinária variada'}</strong> <br>
                    📍 ${restaurante.cidade || 'Belo Horizonte'} <br>
                    ⭐ Nota de Acessibilidade: ${restaurante.pontuacaoAcessibilidade || 'N/A'}/5
                </p>
                <button class="btn-action" aria-label="Ver detalhes do ${restaurante.nome}" onclick="irParaDetalhes('${restaurante.id}')">Ver Detalhes</button>
            </div>
        `;

        container.appendChild(article);
    });
}

function irParaDetalhes(id) {
    window.location.href = "../detalhes/index.html?id=" + id;
}