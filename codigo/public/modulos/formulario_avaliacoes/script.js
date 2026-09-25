const API = 'http://localhost:3000';
const params = new URLSearchParams(window.location.search);

// 🌟 CORREÇÃO 1: Aceita tanto 'restauranteId' quanto 'id' para nunca perder a referência
const restauranteId = params.get('restauranteId') || params.get('id');
let avaliacaoExistenteId = null;
let isProcessing = false;

const tagButtons = document.querySelectorAll('.tag-btn');
const commentTextarea = document.getElementById('comment');

document.addEventListener('DOMContentLoaded', async () => {
    let usuarioLogadoId = null;
    
    // 🌟 CORREÇÃO 2: Garante a escuta do evento de submit travando o refresh nativo do HTML
    const form = document.getElementById('feedbackForm');
    if (form) {
        form.addEventListener('submit', processarEnvioAvaliacao);
    }
    
    try {
        const respSessao = await fetch(`${API}/sessao`);
        const sessaoArray = await respSessao.json();
        const sessao = sessaoArray[0];
        
        if (!sessao || !sessao.usuarioId || sessao.tipo === 'restaurante') {
            const aviso = document.getElementById('message');
            if (aviso) {
                aviso.innerHTML = '⚠️ Você precisa estar logado como cliente para enviar uma avaliação.';
                aviso.className = 'error-msg';
                aviso.classList.remove('hidden');
            }
            if (form) form.style.display = 'none';
            setTimeout(() => {
                window.location.href = `../autenticacao/index.html`;
            }, 2500);
            return;
        }
        usuarioLogadoId = sessao.usuarioId;
    } catch (e) {
        console.warn('Erro ao verificar sessão.', e);
    }

    if (restauranteId) {
        try {
            const resp = await fetch(`${API}/restaurantes/${restauranteId}`);
            if (resp.ok) {
                const restaurante = await resp.json();
                document.getElementById('titulo-pagina').textContent = `Avaliar: ${restaurante.nome}`;
                document.getElementById('subtitulo-pagina').textContent = `${restaurante.tipoCozinha} · ${restaurante.cidade}`;
                
                // Garante que o botão voltar físico da página sempre tenha o ID correto
                const linkVoltar = document.getElementById('link-voltar');
                if (linkVoltar) {
                    linkVoltar.href = `../detalhes/index.html?id=${restauranteId}`;
                }
            }

            if (usuarioLogadoId) {
                const respBusca = await fetch(`${API}/avaliacoes?restauranteId=${Number(restauranteId)}&usuarioId=${usuarioLogadoId}`);
                if (respBusca.ok) {
                    const dadosF = await respBusca.json();
                    if (dadosF.length > 0) {
                        const av = dadosF[0];
                        avaliacaoExistenteId = av.id;
                        
                        const estrela = document.querySelector(`input[name="rating"][value="${av.nota}"]`);
                        if (estrela) estrela.checked = true;
                        
                        commentTextarea.value = av.comentario || '';
                        
                        if (av.tags && Array.isArray(av.tags)) {
                            tagButtons.forEach(btn => {
                                if (av.tags.includes(btn.dataset.tag)) {
                                    btn.classList.add('active');
                                }
                            });
                        }
                        document.getElementById('submitBtn').textContent = 'Atualizar Avaliação';
                    }
                }
            }
        } catch (e) {
            console.warn('Não foi possível carregar os dados prévios do restaurante.');
        }
    } else {
        document.getElementById('subtitulo-pagina').textContent = 'Restaurante não identificado';
    }
});

// Reconstrução da função de clique nas tags que estava cortada
tagButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
        btn.classList.toggle('active');
    });
});

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function processarEnvioAvaliacao(event) {
    event.preventDefault();
    
    if (window.jaEstaEnviandoObanco) return;
    
    const ratingSelected = document.querySelector('input[name="rating"]:checked');
    const commentText = commentTextarea ? commentTextarea.value.trim() : '';
    
    if (!ratingSelected) {
        alert('Por favor, selecione uma nota em estrelas.');
        return;
    }
    
    if (!restauranteId) {
        alert('Erro: ID do restaurante não encontrado na URL.');
        return;
    }
    
    window.jaEstaEnviandoObanco = true;
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processando...';
    }
    
    const activeTags = Array.from(tagButtons)
        .filter(b => b.classList.contains('active'))
        .map(b => b.dataset.tag);

    // CORREÇÃO: Variável usuarioId agora é declarada corretamente
    let usuarioId = null; 
    try {
        const respSessao = await fetch(`${API}/sessao`);
        const sessaoArray = await respSessao.json();
        if (sessaoArray[0] && sessaoArray[0].usuarioId) {
            usuarioId = String(sessaoArray[0].usuarioId);
        } else {
            throw new Error("Usuário não logado");
        }
    } catch (e) {
        console.warn('Não foi possível identificar o usuário da sessão.', e);
        window.jaEstaEnviandoObanco = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Avaliação';
        }
        alert('Erro: Você precisa estar logado para avaliar.');
        return;
    }

    const dadosAvaliacao = {
        restauranteId: Number(restauranteId),
        usuarioId: usuarioId,
        nota: Number(ratingSelected.value),
        comentario: commentText,
        tags: activeTags,
        data: new Date().toLocaleDateString('pt-BR')
    };

    try {
        const respTodas = await fetch(`${API}/avaliacoes`);
        if (!respTodas.ok) throw new Error('Erro ao checar duplicatas');
        const todasAvaliacoes = await respTodas.json();
        
        const avaliacaoExistente = todasAvaliacoes.find(av =>
            av && av.restauranteId && av.usuarioId &&
            String(av.restauranteId) === String(restauranteId) &&
            String(av.usuarioId) === String(usuarioId)
        );

        let urlFetch = `${API}/avaliacoes`;
        let metodo = 'POST';

        if (avaliacaoExistente) {
            urlFetch = `${API}/avaliacoes/${avaliacaoExistente.id}`;
            metodo = 'PUT';
        }

        const resp = await fetch(urlFetch, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAvaliacao)
        });

        if (!resp.ok) throw new Error('Erro ao salvar avaliação');

        try {
            const respRecalculo = await fetch(`${API}/avaliacoes`);
            if (respRecalculo.ok) {
                const listaAtualizada = await respRecalculo.json();
                const filtradas = listaAtualizada.filter(item =>
                    item && item.restauranteId && String(item.restauranteId) === String(restauranteId)
                );
                if (filtradas.length > 0) {
                    const somaNotas = filtradas.reduce((acc, item) => acc + Number(item.nota || 0), 0);
                    const novaMedia = parseFloat((somaNotas / filtradas.length).toFixed(1));
                    await fetch(`${API}/restaurantes/${restauranteId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pontuacaoAcessibilidade: novaMedia })
                    });
                }
            }
        } catch (erroMedia) {
            console.error('Erro ao atualizar média:', erroMedia);
        }

        const messageDiv = document.getElementById('message');
        if (messageDiv) {
            messageDiv.innerHTML = avaliacaoExistente
                ? '✓ Avaliação alterada com sucesso!'
                : '✓ Avaliação criada com sucesso!';
            messageDiv.className = 'success-msg';
            messageDiv.classList.remove('hidden');
        }

        setTimeout(() => {
            window.location.href = `../detalhes/index.html?id=${restauranteId}`;
        }, 1200);

    } catch (e) {
        console.error('Erro geral no envio:', e);
        window.jaEstaEnviandoObanco = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Tentar Novamente';
        }
    }
}