const API_USUARIOS = 'http://localhost:3000/usuarios';
const API_RESTAURANTES = 'http://localhost:3000/restaurantes';

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#cadastro') {
        const tabCadastro = document.getElementById('cadastro-tab');
        if (tabCadastro) tabCadastro.click();
    } else {
        const tabLogin = document.getElementById('login-tab');
        if (tabLogin) tabLogin.click();
    }

    const cnpjInputCadastro = document.getElementById('cadastroCnpj');
    if (cnpjInputCadastro) {
        IMask(cnpjInputCadastro, { mask: '00.000.000/0000-00' });
    }

    const loginInput = document.getElementById('loginIdentificador');
    let mascaraLogin = null;
    if (loginInput) {
        mascaraLogin = IMask(loginInput, { mask: String }); 
    }

    const radiosTipo = document.querySelectorAll('input[name="tipoConta"]');
    const divCnpj = document.getElementById('divCnpj');
    const labelNome = document.getElementById('labelNome');
    const divEmailCadastro = document.getElementById('divEmailCadastro');
    const cadastroCnpj = document.getElementById('cadastroCnpj');
    const cadastroEmail = document.getElementById('cadastroEmail');

    radiosTipo.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'restaurante') {
                divCnpj.classList.remove('d-none');
                divEmailCadastro.classList.add('d-none');
                cadastroCnpj.setAttribute('required', 'true');
                cadastroEmail.removeAttribute('required');
                cadastroEmail.value = '';
                labelNome.textContent = 'Nome do Restaurante';
            }
            else {
                divCnpj.classList.add('d-none');
                divEmailCadastro.classList.remove('d-none');
                cadastroCnpj.removeAttribute('required');
                cadastroEmail.setAttribute('required', 'true');
                labelNome.textContent = 'Nome Completo';
                if(cnpjInputCadastro) cnpjInputCadastro.value = '';
            }
        });
    });

    const radiosLogin = document.querySelectorAll('input[name="tipoLogin"]');
    const labelLogin = document.getElementById('labelLogin');

    radiosLogin.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'restaurante') {
                labelLogin.textContent = 'CNPJ';
                loginInput.placeholder = '00.000.000/0000-00';
                loginInput.value = '';
                if (mascaraLogin) {
                    mascaraLogin.updateOptions({ mask: '00.000.000/0000-00' });
                }
            } 
            else {
                labelLogin.textContent = 'Email';
                loginInput.placeholder = 'exemplo@email.com';
                loginInput.value = '';
                if (mascaraLogin) {
                    mascaraLogin.updateOptions({ mask: String });
                }
            }
        });
    });

    const formCadastro = document.getElementById('formCadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const tipo = document.querySelector('input[name="tipoConta"]:checked').value;
            let dadosCadastro;
            let apiCadastro;
            if (tipo === 'cliente') {
                dadosCadastro = {
                    nome: document.getElementById('cadastroNome').value.trim(),
                    email: document.getElementById('cadastroEmail').value.trim(),
                    senha: document.getElementById('cadastroSenha').value,
                    tipo: 'cliente'
                };

                apiCadastro = API_USUARIOS;
            }
            else {
                // ALTERAÇÃO CRUCIAL AQUI: Monta o esqueleto perfeito seguindo o padrão dos 8 primeiros do db.json
                dadosCadastro = {
                    nome: document.getElementById('cadastroNome').value.trim(),
                    cnpj: document.getElementById('cadastroCnpj').value.trim(),
                    senha: document.getElementById('cadastroSenha').value,
                    tipo: 'restaurante',
                    descricao: "",
                    endereco: "",
                    cidade: "Belo Horizonte",
                    estado: "MG",
                    telefone: "",
                    tipoCozinha: "",
                    horario: "",
                    foto: "",
                    lat: null,
                    lng: null,
                    cardapioDigital: false,
                    qrCodeMesas: false,
                    cardapio: [],
                    checklist: {
                        comunicacao: {
                            libras: false,
                            cardapioImagens: false,
                            cardapioDigitalAcessivel: false,
                            chatTexto: false
                        },
                        tecnologia: {
                            qrCode: false,
                            tabletPedidos: false,
                            pedidoVisual: false
                        },
                        atendimento: {
                            chamadaVisual: false,
                            funcionariosTreinados: false,
                            tempoRespostaRapido: false
                        },
                        inclusao: {
                            ambienteVisual: false,
                            sinalizacao: false
                        }
                    },
                    pontuacaoAcessibilidade: 0
                };

                apiCadastro = API_RESTAURANTES;
            }

            let campoBusca;
            if (tipo === 'cliente') {
                campoBusca = `email=${dadosCadastro.email}`;
            }
            else {
                campoBusca = `cnpj=${dadosCadastro.cnpj}`;
            }

            try {
                const respCheck = await fetch(`${apiCadastro}?${campoBusca}`);
                const existe = await respCheck.json();

                if (existe.length > 0) {
                    if (tipo === 'cliente') {
                        alert("Este email já está cadastrado!");
                    }
                    else {
                        alert("Este CNPJ já está cadastrado!");
                    }
                    return;
                }

                const resp = await fetch(apiCadastro, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosCadastro)
                });

                if (resp.ok) {
                    alert("Conta criada com sucesso! Faça login para continuar.");
                    document.getElementById('login-tab').click();
                    formCadastro.reset();
                    window.location.hash = '#login';
                }
            } catch (error) {
                console.error("Erro ao cadastrar:", error);
                alert("Erro de conexão com o servidor. O JSON Server está a correr?");
            }
        });
    }

    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const tipoLogin = document.querySelector('input[name="tipoLogin"]:checked').value;
            const identificador = document.getElementById('loginIdentificador').value.trim();
            const senhaDigitada = document.getElementById('loginSenha').value;

            let apiLogin;
            let campoBusca;

            if (tipoLogin === 'cliente') {
                apiLogin = API_USUARIOS;
                campoBusca = `email=${encodeURIComponent(identificador)}`;
            }
            else {
                apiLogin = API_RESTAURANTES;
                campoBusca = `cnpj=${encodeURIComponent(identificador)}`;
            }

            try {
                const resp = await fetch(`${apiLogin}?${campoBusca}`);
                const users = await resp.json();

                if (users.length > 0) {
                    const usuarioLogado = users[0];

                    if (String(usuarioLogado.senha) === String(senhaDigitada)) {

                        await fetch('http://localhost:3000/sessao/atual', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: "atual",
                                usuarioId: usuarioLogado.id,
                                nome: usuarioLogado.nome,
                                tipo: usuarioLogado.tipo || tipoLogin
                            })
                        });

                        if (tipoLogin === 'restaurante') {
                            window.location.href = '../painel_restaurante/index.html';
                        }
                        else {
                            window.location.href = '../../index.html';
                        }
                    } else {
                        alert("Dados de acesso incorretos (Senha inválida).");
                    }
                }
                else {
                    alert("Dados de acesso incorretos (Usuário/CNPJ não encontrado).");
                }
            }
            catch (error) {
                console.error("Erro ao fazer login:", error);
                alert("Erro de conexão com o servidor. O JSON Server está rodando?");
            }
        });
    }
});