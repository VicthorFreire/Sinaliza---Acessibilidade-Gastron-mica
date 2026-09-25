const API = 'http://localhost:3000';
let sessaoAtual = null; 
let avaliacoesCache = [];
const TAGS_DISPONIVEIS = [
    'Fácil comunicação', 'Rampa de acesso', 'Banheiro adaptado', 'Cardápio em Libras',
    'Sinalização visual', 'Estacionamento acessível', 'Equipe capacitada', 'Piso tátil'
];

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const restauranteId = params.get('id') || params.get('restauranteId');

    if (!restauranteId) {
        document.getElementById('estado-carregando')?.classList.add('hidden');
        document.getElementById('estado-erro')?.classList.remove('hidden');
        return;
    }

    // 1. Busca a sessão atual primeiro
    try {
        const respSessao = await fetch(`${API}/sessao`);
        const sessaoArray = await respSessao.json();
        sessaoAtual = sessaoArray[0] || {};
    } catch(e) {
        console.error("Sessão não encontrada", e);
        sessaoAtual = {};
    }

    // 2. Atualiza o link de avaliação
    const linkAvaliar = document.getElementById('link-avaliar');
    if (linkAvaliar) {
        linkAvaliar.href = `../formulario_avaliacoes/index.html?restauranteId=${restauranteId}`;
    }

    // 3. Executa as buscas em paralelo de forma segura
    await Promise.all([
        carregarDetalhesRestaurante(restauranteId),
        carregarCardapio(restauranteId),
        carregarAvaliacoes(restauranteId)
    ]);
});

// ==========================================
// RESTAURANTE
// ==========================================
async function carregarDetalhesRestaurante(id) {
    try {
        const resposta = await fetch(`${API}/restaurantes/${id}`);
        if (!resposta.ok) throw new Error('Restaurante não encontrado');
        
        const restaurante = await resposta.json();

        // Controle do botão gerenciar
        const btnCardapio = document.getElementById('link-gerenciar-cardapio');
        if (btnCardapio) {
            if (sessaoAtual?.tipo === 'restaurante' && String(restaurante.usuarioId) === String(sessaoAtual.usuarioId)) {
                btnCardapio.style.display = 'inline-flex';
                btnCardapio.href = `../cadastro_pratos_precos/index.html`;
            } else {
                btnCardapio.style.display = 'none';
            }
        }
        
        document.getElementById('estado-carregando')?.classList.add('hidden');
        document.getElementById('conteudo-principal')?.classList.remove('hidden');

        preencherDadosNaTela(restaurante);
    } catch (erro) {
        console.error("Erro na busca do restaurante:", erro);
        document.getElementById('estado-carregando')?.classList.add('hidden');
        document.getElementById('estado-erro')?.classList.remove('hidden');
    }
}

function preencherDadosNaTela(restaurante) {
    document.getElementById('det-nome').textContent = restaurante.nome;
    document.getElementById('det-descricao').textContent = restaurante.descricao || 'Nenhuma descrição cadastrada.';
    document.getElementById('det-endereco').textContent = restaurante.endereco || 'Endereço não cadastrado';
    document.getElementById('det-cidade').textContent = restaurante.cidade || '';
    document.getElementById('det-telefone').textContent = restaurante.telefone || 'Não informado';
    document.getElementById('det-horario').textContent = restaurante.horario || 'Não informado';
    document.getElementById('det-tipo-cozinha').textContent = restaurante.tipoCozinha || 'Culinária Mista';

    let fotoUrl = (restaurante.foto && restaurante.foto.length > 15) ? restaurante.foto : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';
    document.getElementById('det-foto').src = fotoUrl;

    if (restaurante.checklist?.comunicacao?.libras) {
        document.getElementById('det-libras-badge')?.classList.remove('hidden');
    }

    configurarPontuacaoVisual(restaurante.pontuacaoAcessibilidade || 0);
    renderizarChecklist(restaurante.checklist);
}

function configurarPontuacaoVisual(nota) {
    const barraFill = document.getElementById('det-pontuacao-fill');
    const label = document.getElementById('det-pontuacao-label');
    const seloIcon = document.getElementById('det-selo-icon');
    const seloTexto = document.getElementById('det-selo-texto');
    const seloContainer = document.getElementById('det-selo');

    let percentual = (nota / 5) * 100;
    if (barraFill) barraFill.style.width = `${percentual}%`;
    if (label) label.textContent = `Pontuação Geral: ${nota}/5`;

    if (!seloContainer) return;

    if (nota >= 4) {
        if(barraFill) barraFill.style.backgroundColor = '#15803d'; 
        seloContainer.style.backgroundColor = '#dcfce7';
        seloContainer.style.color = '#15803d';
        if(seloIcon) seloIcon.innerHTML = '<i class="bi bi-star-fill"></i>';
        if(seloTexto) seloTexto.textContent = 'ALTA';
    } else if (nota >= 3) {
        if(barraFill) barraFill.style.backgroundColor = '#b45309'; 
        seloContainer.style.backgroundColor = '#fef3c7';
        seloContainer.style.color = '#b45309';
        if(seloIcon) seloIcon.innerHTML = '<i class="bi bi-star-half"></i>';
        if(seloTexto) seloTexto.textContent = 'MÉDIA';
    } else {
        if(barraFill) barraFill.style.backgroundColor = '#b91c1c'; 
        seloContainer.style.backgroundColor = '#fee2e2';
        seloContainer.style.color = '#b91c1c';
        if(seloIcon) seloIcon.innerHTML = '<i class="bi bi-star"></i>';
        if(seloTexto) seloTexto.textContent = 'BAIXA';
    }
}

function renderizarChecklist(checklist) {
    const container = document.getElementById('det-checklist');
    if (!container) return;
    
    container.innerHTML = ''; 

    if (!checklist) {
        container.innerHTML = '<p class="text-muted small">Nenhum recurso de acessibilidade especificado.</p>';
        return;
    }

    const recursos = [];
    if (checklist.comunicacao?.libras) recursos.push({ icone: 'bi-hands', texto: 'Atendimento em LIBRAS' });
    if (checklist.comunicacao?.menuLibras) recursos.push({ icone: 'bi-menu-button-wide-fill', texto: 'Cardápio em LIBRAS' });
    if (checklist.comunicacao?.sinalizacaoVisual) recursos.push({ icone: 'bi-eye-fill', texto: 'Sinalização Visual' });
    if (checklist.fisica?.rampa) recursos.push({ icone: 'bi-triangle-fill', texto: 'Rampa de Acesso' });
    if (checklist.fisica?.banheiro) recursos.push({ icone: 'bi-badge-wc-fill', texto: 'Banheiro Adaptado' });
    if (checklist.fisica?.estacionamento) recursos.push({ icone: 'bi-p-circle-fill', texto: 'Vaga Acessível' });

    if (recursos.length === 0) {
        container.innerHTML = '<p class="text-muted small">Nenhum recurso marcado.</p>';
        return;
    }

    const flexDiv = document.createElement('div');
    flexDiv.className = 'd-flex flex-wrap gap-2';

    recursos.forEach(rec => {
        const span = document.createElement('span');
        span.className = 'badge bg-light text-dark border p-2 fs-6 shadow-sm';
        span.innerHTML = `<i class="bi ${rec.icone} text-primary me-2"></i> ${rec.texto}`;
        flexDiv.appendChild(span);
    });

    container.appendChild(flexDiv);
}

// ==========================================
// CARDÁPIO
// ==========================================
async function carregarCardapio(id) {
    const container = document.getElementById('lista-cardapio');
    if (!container) return;
    
    try {
        const resposta = await fetch(`${API}/cardapio?restauranteId=${id}`);
        if (!resposta.ok) throw new Error('Falha ao buscar cardápio');

        const pratos = await resposta.json();
        container.innerHTML = '';

        if (!Array.isArray(pratos) || pratos.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-muted">Nenhum prato cadastrado no momento.</p></div>';
            return;
        }

        pratos.forEach(prato => {
            let fotoPrato = (prato.urlFoto && prato.urlFoto.length > 10) 
                ? prato.urlFoto 
                : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';

            let precoFormatado = parseFloat(prato.preco || 0).toFixed(2).replace('.', ',');

            const div = document.createElement('div');
            div.className = 'col-md-6 col-lg-4';
            div.innerHTML = `
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden" style="transition: transform 0.3s; cursor: pointer;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <img src="${fotoPrato}" alt="${prato.nome}" class="card-img-top" style="height: 200px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold text-dark mb-2">${prato.nome}</h5>
                        <p class="card-text text-secondary small flex-grow-1">${prato.descricao || ''}</p>
                        <div class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                            <span class="text-muted small fw-bold text-uppercase">${prato.categoria || 'Prato'}</span>
                            <span class="fw-black text-primary fs-5">R$ ${precoFormatado}</span>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (erro) {
        console.error("Erro ao carregar cardápio:", erro);
        container.innerHTML = '<div class="col-12"><p class="text-secondary">O cardápio ainda não foi configurado no servidor.</p></div>';
    }
}

// ==========================================
// AVALIAÇÕES
// ==========================================
async function carregarAvaliacoes(id) {
    const container = document.getElementById('lista-avaliacoes');
    const resumo = document.getElementById('resumo-avaliacoes');
    if (!container || !resumo) return;

    try {
        const resposta = await fetch(`${API}/avaliacoes?restauranteId=${id}`);
        const todasAvaliacoes = await resposta.json();
        
        // Correção do bug de mutação: Apenas filtramos direto para o cache
        avaliacoesCache = todasAvaliacoes.filter(av => !av.removida);
        container.innerHTML = '';

        renderizarTagsComuns(avaliacoesCache);

        if (avaliacoesCache.length === 0) {
            resumo.innerHTML = '<p class="text-muted">Ainda não há avaliações para este local. Seja o primeiro a avaliar!</p>';
            return;
        }

        const somaNotas = avaliacoesCache.reduce((acc, av) => acc + Number(av.nota), 0);
        const media = (somaNotas / avaliacoesCache.length).toFixed(1);
        
        resumo.innerHTML = `
            <div class="d-flex align-items-center gap-3 bg-light p-3 rounded-4 border">
                <h2 class="display-4 fw-black text-dark mb-0">${media}<span class="fs-4 text-muted">/5</span></h2>
                <div>
                    <div class="text-warning fs-5">
                        ${'<i class="bi bi-star-fill"></i>'.repeat(Math.round(media))}
                    </div>
                    <span class="text-secondary small fw-medium">Baseado em ${avaliacoesCache.length} avaliação(ões)</span>
                </div>
            </div>
        `;

        avaliacoesCache.forEach(av => {
            const div = document.createElement('div');
            div.className = 'card border border-light shadow-sm rounded-4 p-4 mb-3';
            div.id = `avaliacao-card-${av.id}`;

            let estrelasHTML = '<i class="bi bi-star-fill text-warning me-1"></i>'.repeat(Number(av.nota));
            let tagsHTML = (av.tags || []).map(t => `<span class="badge bg-primary-subtle text-primary border border-primary-subtle me-2 rounded-pill">${t}</span>`).join('');

            const ehAutor = sessaoAtual?.usuarioId && sessaoAtual.tipo !== 'restaurante' && String(av.usuarioId) === String(sessaoAtual.usuarioId);
            const ehAdmin = sessaoAtual?.tipo === 'admin';

            let acoesHTML = '';
            if (ehAutor) {
                acoesHTML = `
                    <div class="acoes-avaliacao mt-3">
                        <button type="button" class="btn btn-sm btn-outline-primary me-2" onclick="iniciarEdicaoAvaliacao('${av.id}')"><i class="bi bi-pencil-fill"></i> Editar</button>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="excluirAvaliacao('${av.id}', '${av.restauranteId}')"><i class="bi bi-trash-fill"></i> Excluir</button>
                    </div>
                `;
            } else if (ehAdmin) {
                acoesHTML = `
                    <div class="acoes-avaliacao mt-3">
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="excluirAvaliacao('${av.id}', '${av.restauranteId}')"><i class="bi bi-trash-fill"></i> Excluir</button>
                    </div>
                `;
            }

            div.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>${estrelasHTML}</div>
                    <span class="badge bg-dark text-white rounded-pill"><i class="bi bi-person-fill"></i> Usuário</span>
                </div>
                <p class="mb-3 text-secondary fw-medium">"${av.comentario}"</p>
                <div class="mb-2">${tagsHTML}</div>
                ${acoesHTML}
            `;
            container.appendChild(div);
        });

    } catch (erro) {
        console.error("Erro ao carregar avaliações:", erro);
        container.innerHTML = '<p class="text-danger">Não foi possível carregar os depoimentos.</p>';
    }
}

function renderizarTagsComuns(avaliacoes) {
    const wrapper = document.getElementById('det-tags-comuns');
    const lista = document.getElementById('det-tags-comuns-lista');
    if (!wrapper || !lista) return;

    const contagem = {};
    avaliacoes.forEach(av => {
        (av.tags || []).forEach(tag => {
            contagem[tag] = (contagem[tag] || 0) + 1;
        });
    });

    const tagsOrdenadas = Object.keys(contagem);
    // Correção do bug do Math.max em array vazio:
    if (tagsOrdenadas.length === 0) {
        wrapper.classList.add('hidden');
        lista.innerHTML = '';
        return;
    }

    const maiorContagem = Math.max(...tagsOrdenadas.map(t => contagem[t]));
    const tagsMaisComuns = tagsOrdenadas.filter(t => contagem[t] === maiorContagem);

    lista.innerHTML = tagsMaisComuns.map(tag => `
        <span class="tag-comum-badge"><i class="bi bi-chat-square-quote-fill"></i> ${tag}</span>
    `).join('');
    wrapper.classList.remove('hidden');
}

function iniciarEdicaoAvaliacao(avaliacaoId) {
    const av = avaliacoesCache.find(a => String(a.id) === String(avaliacaoId));
    if (!av) return;

    const card = document.getElementById(`avaliacao-card-${avaliacaoId}`);
    if (!card) return;

    const tagsHTML = TAGS_DISPONIVEIS.map(tag => {
        const ativa = (av.tags || []).includes(tag) ? 'active' : '';
        return `<span class="edicao-tag-chip ${ativa}" data-tag="${tag}" onclick="this.classList.toggle('active')">${tag}</span>`;
    }).join('');

    card.innerHTML = `
        <div class="edicao-avaliacao-form">
            <label class="fw-bold mb-1" for="edicao-nota-${avaliacaoId}">Nota</label>
            <select id="edicao-nota-${avaliacaoId}" class="form-select mb-3" style="max-width: 160px;">
                ${[5,4,3,2,1].map(n => `<option value="${n}" ${Number(av.nota) === n ? 'selected' : ''}>${n} estrela(s)</option>`).join('')}
            </select>

            <label class="fw-bold mb-1" for="edicao-comentario-${avaliacaoId}">Comentário</label>
            <textarea id="edicao-comentario-${avaliacaoId}" class="form-control mb-3" rows="3">${av.comentario || ''}</textarea>

            <label class="fw-bold mb-1">Tags de Acessibilidade</label>
            <div id="edicao-tags-${avaliacaoId}" class="d-flex flex-wrap gap-2 mb-3">${tagsHTML}</div>

            <div class="acoes-avaliacao">
                <button type="button" class="btn btn-sm btn-primary me-2" onclick="salvarEdicaoAvaliacao('${avaliacaoId}', '${av.restauranteId}')"><i class="bi bi-check-lg"></i> Salvar</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="carregarAvaliacoes('${av.restauranteId}')"><i class="bi bi-x-lg"></i> Cancelar</button>
            </div>
        </div>
    `;
}

async function salvarEdicaoAvaliacao(avaliacaoId, restauranteId) {
    const novaNota = Number(document.getElementById(`edicao-nota-${avaliacaoId}`).value);
    const novoComentario = document.getElementById(`edicao-comentario-${avaliacaoId}`).value.trim();
    const novasTags = Array.from(document.querySelectorAll(`#edicao-tags-${avaliacaoId} .edicao-tag-chip.active`))
        .map(chip => chip.dataset.tag);

    try {
        const resp = await fetch(`${API}/avaliacoes/${avaliacaoId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nota: novaNota, comentario: novoComentario, tags: novasTags })
        });

        if (!resp.ok) throw new Error('Erro ao salvar avaliação');
        await atualizarMediaRestaurante(restauranteId, avaliacaoId, novaNota, false);
        await carregarAvaliacoes(restauranteId);
    } catch (erro) {
        console.error('Erro ao salvar edição da avaliação:', erro);
        alert('Não foi possível salvar as alterações. Tente novamente.');
    }
}

async function excluirAvaliacao(avaliacaoId, restauranteId) {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;

    try {
        const resp = await fetch(`${API}/avaliacoes/${avaliacaoId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ removida: true })
        });
        if (!resp.ok) throw new Error('Erro ao excluir avaliação');
        await atualizarMediaRestaurante(restauranteId, avaliacaoId, 0, true);
        await carregarAvaliacoes(restauranteId);
    } catch (erro) {
        console.error('Erro ao excluir avaliação:', erro);
        alert('Não foi possível excluir a avaliação. Tente novamente.');
    }
}

async function atualizarMediaRestaurante(restauranteId, avaliacaoId, novaNota, ehExclusao) {
    try {
        // Busca todas as avaliações direto do servidor para calcular com dados reais
        const respAvaliacoes = await fetch(`${API}/avaliacoes?restauranteId=${restauranteId}`);
        const todas = await respAvaliacoes.json();
        
        // Filtra tirando as removidas e aplicando a alteração caso ela ainda não tenha sido processada no GET
        const validas = todas.filter(av => {
            if (String(av.id) === String(avaliacaoId)) {
                return !ehExclusao; // Se for exclusão, remove ela do cálculo
            }
            return !av.removida;
        });

        let novaMedia = 0;
        if (validas.length > 0) {
            const soma = validas.reduce((acc, av) => {
                // Se for a avaliação atual sendo editada, usa a nova nota informada
                const nota = String(av.id) === String(avaliacaoId) ? novaNota : Number(av.nota);
                return acc + nota;
            }, 0);
            // Salva a média arredondada com 1 casa decimal (ex: 4.5)
            novaMedia = Number((soma / validas.length).toFixed(1));
        }

        // Faz o PATCH no endpoint do restaurante para persistir a nota geral no seu db.json
        const respRestaurante = await fetch(`${API}/restaurantes/${restauranteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pontuacaoAcessibilidade: novaMedia })
        });

        if (respRestaurante.ok) {
            // Atualiza imediatamente os elementos visuais do topo da tela
            configurarPontuacaoVisual(novaMedia);
        }
    } catch (erro) {
        console.error("Erro ao atualizar a média do restaurante no banco de dados:", erro);
    }
}