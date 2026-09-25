const API = 'http://localhost:3000';
let todasFrases = [];
let categoriasAtuais = [];
let categoriaSelecionada = 'Todas';

document.addEventListener('DOMContentLoaded', async () => {
    await carregarCategorias();
    await carregarFrases();

    document.getElementById('inputPesquisa').addEventListener('input', filtrarE_Renderizar);
    document.getElementById('btnFecharOverlay').addEventListener('click', fecharOverlay);
    document.getElementById('formFrase').addEventListener('submit', salvarFrase);
    document.getElementById('modalFrase').addEventListener('hidden.bs.modal', resetarFormulario);
});

async function carregarCategorias() {
        try {
            const resp = await fetch(`${API}/categorias_garcom`);
            categoriasAtuais = await resp.json();
            
            categoriasAtuais.push({ id: 'custom', nome: 'Minhas Frases', icone: '💡' });
            const container = document.getElementById('containerCategorias');

            const btnTodas = document.querySelector('[data-categoria="Todas"]');
            if (btnTodas) {
                btnTodas.onclick = () => selecionarCategoria('Todas', btnTodas);
            }
            
            categoriasAtuais.forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-outline-primary rounded-pill px-4 fw-medium text-nowrap flex-shrink-0 btn-categoria bg-white shadow-sm border-0';
                btn.dataset.categoria = cat.nome;
                btn.innerHTML = `${cat.icone} ${cat.nome}`;
                btn.onclick = () => selecionarCategoria(cat.nome, btn);
                
                if (cat.nome === 'Minhas Frases') {
                    btn.classList.add('border-primary', 'text-primary'); 
                }
                
                container.appendChild(btn);
            });
        } catch (erro) {
            console.error("Erro ao carregar categorias", erro);
        }
    }

async function carregarFrases() {
    try {
        const resp = await fetch(`${API}/frases_garcom`);
        todasFrases = await resp.json();
        filtrarE_Renderizar();
    } catch (erro) {
        console.error("Erro ao carregar frases", erro);
    }
}

function selecionarCategoria(nomeCategoria, btnElement) {
    categoriaSelecionada = nomeCategoria;
    document.querySelectorAll('.btn-categoria').forEach(b => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('bg-white', 'text-secondary');
    });
    
    btnElement.classList.remove('bg-white', 'text-secondary');
    btnElement.classList.add('active', 'btn-primary');
    filtrarE_Renderizar();
}

function filtrarE_Renderizar() {
    const termo = document.getElementById('inputPesquisa').value.toLowerCase();
    
    const filtradas = todasFrases.filter(f => {
        const bateCategoria = categoriaSelecionada === 'Todas' || f.categoria === categoriaSelecionada;
        const bateTexto = f.texto.toLowerCase().includes(termo);
        return bateCategoria && bateTexto;
    });

    renderizarGrid(filtradas);
}

function renderizarGrid(lista) {
    const grid = document.getElementById('gridFrases');
    grid.innerHTML = '';

    if (lista.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center text-muted py-5">Nenhuma frase encontrada.</div>`;
        return;
    }

    lista.forEach(f => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        let acoesHTML = '';
        if (f.customizada) {
            acoesHTML = `
                <div class="acoes-card">
                    <button class="btn-acao-card btn-editar" title="Editar" onclick="abrirEdicao(event, '${f.id}')"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn-acao-card btn-excluir" title="Excluir" onclick="excluirFrase(event, '${f.id}')"><i class="bi bi-trash-fill"></i></button>
                </div>
            `;
        }

        col.innerHTML = `
            <div class="card card-frase h-100" onclick="abrirOverlay('${f.icone}', '${f.texto}')">
                ${acoesHTML}
                <div class="icone-grande shadow-sm">${f.icone}</div>
                <h5>${f.texto}</h5>
                <span class="badge bg-light text-secondary border mt-3">${f.categoria}</span>
            </div>
        `;
        grid.appendChild(col);
    });
}

async function salvarFrase(event) {
    event.preventDefault(); 
    
    const id = document.getElementById('fraseId').value;
    const icone = document.getElementById('fraseIcone').value;
    const texto = document.getElementById('fraseTexto').value;

    const novaFrase = {
        icone: icone,
        texto: texto,
        categoria: 'Minhas Frases',
        customizada: true,
        favorita: false
    };

    try {
        let url = `${API}/frases_garcom`;
        let metodo = 'POST'; 

        if (id) { 
            url = `${API}/frases_garcom/${id}`;
            metodo = 'PUT';
        }

        const resp = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaFrase)
        });

        if (resp.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalFrase'));
            modal.hide();
            await carregarFrases(); 
            
            const btnMinhasFrases = Array.from(document.querySelectorAll('.btn-categoria')).find(b => b.dataset.categoria === 'Minhas Frases');
            if (btnMinhasFrases) {
                selecionarCategoria('Minhas Frases', btnMinhasFrases);
            }
        }
    } catch (erro) {
        console.error("Erro ao salvar frase:", erro);
        alert("Ocorreu um erro ao salvar a frase.");
    }
}

function abrirEdicao(event, id) {
    event.stopPropagation(); 
    
    const frase = todasFrases.find(f => f.id == id);
    if (!frase) return;

    document.getElementById('modalFraseLabel').textContent = 'Editar Minha Frase';
    document.getElementById('fraseId').value = frase.id;
    document.getElementById('fraseIcone').value = frase.icone;
    document.getElementById('fraseTexto').value = frase.texto;

    const modal = new bootstrap.Modal(document.getElementById('modalFrase'));
    modal.show();
}

function resetarFormulario() {
    document.getElementById('formFrase').reset();
    document.getElementById('fraseId').value = '';
    document.getElementById('modalFraseLabel').textContent = 'Adicionar Nova Frase';
}

async function excluirFrase(event, id) {
    event.stopPropagation(); 
    
    if (confirm("Tem certeza que deseja apagar esta frase customizada?")) {
        try {
            const resp = await fetch(`${API}/frases_garcom/${id}`, {
                method: 'DELETE'
            });

            if (resp.ok) {
                await carregarFrases(); 
            }
        } catch (erro) {
            console.error("Erro ao excluir:", erro);
            alert("Ocorreu um erro ao tentar excluir.");
        }
    }
}

function abrirOverlay(icone, texto) {
    document.getElementById('overlayIcone').textContent = icone;
    document.getElementById('overlayTexto').textContent = texto;
    
    const overlay = document.getElementById('overlayTelaCheia');
    overlay.classList.remove('overlay-inativo');
    overlay.classList.add('overlay-ativo');
}

function fecharOverlay() {
    const overlay = document.getElementById('overlayTelaCheia');
    overlay.classList.remove('overlay-ativo');
    overlay.classList.add('overlay-inativo');
}