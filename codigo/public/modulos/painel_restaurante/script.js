const API_RESTAURANTES = 'http://localhost:3000/restaurantes';
let usuarioLogado = null;

document.addEventListener('DOMContentLoaded', async () => {
    const respSessao = await fetch('http://localhost:3000/sessao');
    const sessaoArray = await respSessao.json();
    const sessao = sessaoArray[0] || {};
    
    if (!sessao.usuarioId) {
        alert("Acesso negado. Faça login primeiro.");
        window.location.href = '../autenticacao/index.html';
        return;
    }
    
    usuarioLogado = { id: sessao.usuarioId, nome: sessao.nome, tipo: sessao.tipo };

    if (usuarioLogado.tipo !== 'restaurante') {
        alert("Acesso restrito para contas de Restaurante.");
        window.location.href = '../../index.html';
        return;
    }

    document.getElementById('nomeUsuarioLogado').textContent = `Olá, ${usuarioLogado.nome.split(' ')[0]}`;
    await carregarPerfilRestaurante();
});

async function carregarPerfilRestaurante() {
    try {
        const resp = await fetch(`${API_RESTAURANTES}/${usuarioLogado.id}`);
        
        if (!resp.ok) {
            console.error("Restaurante não encontrado no banco de dados.");
            return;
        }

        const rest = await resp.json();

        document.getElementById('restauranteId').value = rest.id;
        document.getElementById('nomeRest').value = rest.nome || '';
        document.getElementById('especialidadeRest').value = rest.tipoCozinha || '';
        document.getElementById('fotoRest').value = rest.foto || '';
        document.getElementById('enderecoRest').value = rest.endereco || '';
        document.getElementById('cidadeRest').value = rest.cidade || '';
        
        document.getElementById('latRest').value = rest.lat !== null ? rest.lat : '';
        document.getElementById('lngRest').value = rest.lng !== null ? rest.lng : '';

        if (rest.checklist) {
            document.getElementById('chkLibras').checked = !!rest.checklist.comunicacao?.libras;
            document.getElementById('chkBraille').checked = !!rest.checklist.comunicacao?.cardapioImagens;
            document.getElementById('chkRampa').checked = !!rest.checklist.tecnologia?.tabletPedidos;
            document.getElementById('chkVisual').checked = !!rest.checklist.inclusao?.ambienteVisual;
        }
        
    } catch (error) {
        console.error("Erro ao carregar dados do restaurante:", error);
    }
}
document.getElementById('btnTabCardapio').addEventListener('click', () => {
    const rId = document.getElementById('restauranteId').value;
    if(rId) {
        window.location.href = `../cadastro_pratos_precos/index.html?restauranteId=${rId}`;
    } else {
        alert("Por favor, guarde o perfil do restaurante na aba 1 e 2 antes de acessar o cardápio.");
    }
});

document.getElementById('btnVerPagina').addEventListener('click', () => {
    const rId = document.getElementById('restauranteId').value;
    if(rId) {
        window.location.href = `../detalhes/index.html?restauranteId=${rId}`;
    } else {
        alert("Você precisa guardar o perfil do restaurante primeiro para gerar a página pública.");
    }
});

document.getElementById('formRestaurante').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nomeRest = document.getElementById('nomeRest').value.trim();
    const BlacklistCozinha = document.getElementById('especialidadeRest').value; // especialidadeRest
    const enderecoRest = document.getElementById('enderecoRest').value.trim();
    const latRest = document.getElementById('latRest').value;
    const lngRest = document.getElementById('lngRest').value;

    if (!nomeRest || !BlacklistCozinha || !enderecoRest) {
        alert("Por favor, certifique-se de que o Nome, Especialidade e Endereço estão preenchidos no Perfil.");
        return; 
    }

    const restId = usuarioLogado.id; 
    const chkLibras = document.getElementById('chkLibras').checked;
    const chkBraille = document.getElementById('chkBraille').checked;
    const chkRampa = document.getElementById('chkRampa').checked;
    const chkVisual = document.getElementById('chkVisual').checked;

    // CORREÇÃO: Removemos o cálculo da variável "nota" e retiramos a linha "pontuacaoAcessibilidade"
    const dadosRestaurante = {
        nome: nomeRest,
        tipoCozinha: BlacklistCozinha,
        endereco: enderecoRest,
        cidade: document.getElementById('cidadeRest').value.trim(),
        foto: document.getElementById('fotoRest').value.trim(),
        lat: latRest ? parseFloat(latRest) : null,
        lng: lngRest ? parseFloat(lngRest) : null,
        checklist: {
            comunicacao: {
                libras: chkLibras,
                cardapioImagens: chkBraille,
                cardapioDigitalAcessivel: false,
                chatTexto: false
            },
            tecnologia: {
                qrCode: false,
                tabletPedidos: chkRampa,
                pedidoVisual: false
            },
            atendimento: {
                chamadaVisual: false,
                funcionariosTreinados: false,
                tempoRespostaRapido: false
            },
            inclusao: {
                ambienteVisual: chkVisual,
                sinalizacao: false
            }
        }
    };

    try {
        const url = `${API_RESTAURANTES}/${restId}`;
        const resp = await fetch(url, {
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosRestaurante)
        });

        if (resp.ok) {
            alert("Alterações salvas com sucesso!");
            await carregarPerfilRestaurante(); 
        }
    } catch (error) {
        console.error("Erro ao atualizar restaurante:", error);
        alert("Ocorreu um erro de conexão ao tentar salvar.");
    }
});

async function fazerLogout() {
    await fetch('http://localhost:3000/sessao/atual', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: "atual", usuarioId: null, nome: null, tipo: null })
    });
    window.location.href = '../../index.html';
}