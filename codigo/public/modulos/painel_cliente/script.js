const API_USUARIOS = 'http://localhost:3000/usuarios';
let usuarioLogado = null;
let dadosCompletos = null;

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

    // 2. BUSCAR DADOS COMPLETOS DO UTILIZADOR
    try {
        const resp = await fetch(`${API_USUARIOS}/${usuarioLogado.id}`);
        dadosCompletos = await resp.json();

        document.getElementById('tituloNome').textContent = `Olá, ${dadosCompletos.nome.split(' ')[0]}`;
        document.getElementById('clienteNome').value = dadosCompletos.nome;
        document.getElementById('clienteEmail').value = dadosCompletos.email;
        
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
});

// 3. ATUALIZAR DADOS (PUT)
document.getElementById('formCliente').addEventListener('submit', async (e) => {
    e.preventDefault();

    const novoNome = document.getElementById('clienteNome').value.trim();
    const novaSenhaDigitada = document.getElementById('clienteSenha').value;

    // Mantém os dados antigos, altera apenas o nome e a senha (se digitada)
    const dadosAtualizados = {
        ...dadosCompletos,
        nome: novoNome,
        senha: novaSenhaDigitada !== '' ? novaSenhaDigitada : dadosCompletos.senha
    };

    try {
        // Primeiro: Atualiza os dados do utilizador na base de dados
        const resp = await fetch(`${API_USUARIOS}/${usuarioLogado.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });

        if (resp.ok) {
            // Segundo: Atualiza o nome na "Sessão" da API (Zero LocalStorage!)
            await fetch('http://localhost:3000/sessao/atual', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: "atual",
                    usuarioId: usuarioLogado.id,
                    nome: novoNome, // O novo nome atualizado
                    tipo: usuarioLogado.tipo
                })
            });
            
            // Atualiza a variável em memória e a interface
            usuarioLogado.nome = novoNome;
            alert("Perfil atualizado com sucesso!");
            document.getElementById('clienteSenha').value = ''; // Limpa o campo de senha
            document.getElementById('tituloNome').textContent = `Olá, ${novoNome.split(' ')[0]}`;
        }
    } catch (error) {
        alert("Erro ao atualizar o perfil.");
        console.error(error);
    }
});

// 4. LÓGICA DE LOGOUT
async function fazerLogout() {
    // Limpa a sessão no JSON Server
    await fetch('http://localhost:3000/sessao/atual', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: "atual", usuarioId: null, nome: null, tipo: null })
    });
    window.location.href = '../../index.html';
}