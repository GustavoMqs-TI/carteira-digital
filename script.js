// ===== ELEMENTOS =====
const form = document.getElementById("formGasto");
const lista = document.getElementById("listaGastos");
const descricao = document.getElementById("descricao");
const valor = document.getElementById("valor");
const tipo = document.getElementById("tipo");
const banco = document.getElementById("banco");
const modalidade = document.getElementById("modalidade");
const data = document.getElementById("data");

const totalEntrada = document.getElementById("totalEntrada");
const totalSaida = document.getElementById("totalSaida");
const saldoFinal = document.getElementById("saldoFinal");

const listaFatura = document.getElementById("listaFatura");
const listaBeneficioFiltrado = document.getElementById("listaBeneficioFiltrado");

const modal = document.getElementById("modalEditar");
const formEditar = document.getElementById("formEditar");
const fecharModal = document.querySelector(".fechar-modal");
const btnCancelar = document.querySelector(".btn-cancelar");

let principal = JSON.parse(localStorage.getItem("principal")) || [];
let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
let sistemaInicializado = false;

let configUsuario = { beneficios: [], bancos: [], modalidades: [] };
let beneficioSelecionado = null;
let transacoesOriginais = [];
let bancoSelecionadoFatura = null;
let comprasOriginais = [];

let coresPersonalizadas = {
    entrada: "#00b09b",
    saida: "#ff416c",
    saldo: "#2193b0",
    beneficios: {},
    bancos: {}
};

// Usuário demo
if (usuarios.length === 0) {
    usuarios.push({ id: 1, nome: "Usuário Demo", email: "demo@financeiro.com", senha: "123456" });
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

// ===== UTILS =====
function formatarMoeda(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getSelecionados(id) {
    return Array.from(document.querySelectorAll(`#${id} input:checked`)).map(el => el.value);
}

// ===== CONFIGURAÇÕES =====
function carregarConfiguracoes(userId) {
    const configSalva = localStorage.getItem(`config_${userId}`);
    if (configSalva) {
        configUsuario = JSON.parse(configSalva);
        return true;
    } else {
        configUsuario = { beneficios: ["VR", "VA", "VT"], bancos: ["Nubank", "Itaú", "Santander", "Bradesco"], modalidades: ["Dinheiro", "Débito", "Crédito", "Pix"] };
        return false;
    }
}

function salvarConfiguracoes(userId) {
    localStorage.setItem(`config_${userId}`, JSON.stringify(configUsuario));
}

function carregarCoresPersonalizadas() {
    const user = JSON.parse(sessionStorage.getItem("usuarioLogado"));
    if(user) {
        const coresSalvas = localStorage.getItem(`cores_${user.id}`);
        if(coresSalvas) {
            coresPersonalizadas = JSON.parse(coresSalvas);
        }
    }
    aplicarCoresSalvas();
}

function salvarCoresPersonalizadas() {
    const user = JSON.parse(sessionStorage.getItem("usuarioLogado"));
    if(user) {
        localStorage.setItem(`cores_${user.id}`, JSON.stringify(coresPersonalizadas));
    }
}

function aplicarCoresSalvas() {
    const cardEntrada = document.querySelector('.card.entrada');
    const cardSaida = document.querySelector('.card.saida');
    const cardSaldo = document.querySelector('.card.saldo');
    
    if(cardEntrada) cardEntrada.style.background = `linear-gradient(135deg, ${coresPersonalizadas.entrada}, ${coresPersonalizadas.entrada})`;
    if(cardSaida) cardSaida.style.background = `linear-gradient(135deg, ${coresPersonalizadas.saida}, ${coresPersonalizadas.saida})`;
    if(cardSaldo) cardSaldo.style.background = `linear-gradient(135deg, ${coresPersonalizadas.saldo}, ${coresPersonalizadas.saldo})`;
    
    document.querySelectorAll('.beneficio-card').forEach(card => {
        const nome = card.querySelector('h3')?.innerText;
        if(nome && coresPersonalizadas.beneficios[nome]) {
            card.style.background = `linear-gradient(135deg, ${coresPersonalizadas.beneficios[nome]}, ${coresPersonalizadas.beneficios[nome]})`;
        }
    });
    
    document.querySelectorAll('.fatura-cards .card').forEach(card => {
        const nome = card.querySelector('h3')?.innerText;
        if(nome && coresPersonalizadas.bancos[nome]) {
            card.style.background = `linear-gradient(135deg, ${coresPersonalizadas.bancos[nome]}, ${coresPersonalizadas.bancos[nome]})`;
        }
    });
}

function aplicarConfiguracoes() {
    const selectsBanco = [banco, document.getElementById("editarBanco")];
  
    selectsBanco.forEach(sel => { 
        if(sel) { 
            sel.innerHTML = '<option value="">Banco</option>'; 
            configUsuario.bancos.forEach(b => sel.innerHTML += `<option>${b}</option>`); 
        } 
    });
 
    
    const filtroBancoDiv = document.getElementById("filtroBanco");
    if(filtroBancoDiv) { 
        filtroBancoDiv.innerHTML = ''; 
        configUsuario.bancos.forEach(b => filtroBancoDiv.innerHTML += `<label><input type="checkbox" value="${b}"> <span>${b}</span></label>`); 
    }
    
    const selectsModalidade = [modalidade, document.getElementById("editarModalidade")];
    selectsModalidade.forEach(sel => { 
        if(sel) { 
            sel.innerHTML = '<option value="">Modalidade</option>'; 
            configUsuario.modalidades.forEach(m => sel.innerHTML += `<option>${m}</option>`); 
        } 
    });
    
    const filtroModalidadeDiv = document.getElementById("filtroModalidade");
    if(filtroModalidadeDiv) { 
        filtroModalidadeDiv.innerHTML = ''; 
        configUsuario.modalidades.forEach(m => filtroModalidadeDiv.innerHTML += `<label><input type="checkbox" value="${m}"> <span>${m}</span></label>`); 
    }
    
    const container = document.getElementById("beneficiosContainer");
    if(container) {
        container.innerHTML = '';
        const cores = ['#00b09b', '#ff416c', '#2193b0', '#6a11cb', '#ff8008', '#1D976C', '#F2994A', '#cb2d3e'];
        configUsuario.beneficios.forEach((b, i) => {
            const cor = coresPersonalizadas.beneficios[b] || cores[i % cores.length];
            container.innerHTML += `<div class="beneficio-card" onclick="filtrarBeneficio('${b}')" style="background: linear-gradient(135deg, ${cor}, ${cor});"><h3>${b}</h3><p>Saldo: <span id="saldo_${b}">R$ 0</span></p><p class="detalhe">👆 Clique para ver transações</p></div>`;
        });
    }
    
    const faturaContainer = document.getElementById("faturaContainer");
    if(faturaContainer) {
        faturaContainer.innerHTML = '';
        const coresFatura = ['#8E2DE2', '#FF8008', '#CB2D3E', '#1D976C', '#F2994A', '#FF6B6B', '#FF7E5F', '#00B4DB'];
        configUsuario.bancos.forEach((b, i) => {
            const cor = coresPersonalizadas.bancos[b] || coresFatura[i % coresFatura.length];
            faturaContainer.innerHTML += `<div class="card" onclick="filtrarBancoCredito('${b}')" style="background: linear-gradient(135deg, ${cor}, ${cor}); cursor: pointer;"><h3>${b}</h3><p>Fatura: <span id="fatura_${b.replace(/\s/g, '_')}">R$ 0</span></p><p class="detalhe">👆 Clique para ver compras</p></div>`;
        });
    }
    
    carregarCoresPersonalizadas();
}

function atualizarBeneficiosDinamico() {
    let saldos = {};
    configUsuario.beneficios.forEach(b => saldos[b] = 0);
    principal.forEach(item => {
        if(configUsuario.beneficios.includes(item.modalidade)) {
            if(item.tipo === "entrada") saldos[item.modalidade] += item.valor;
            else if(item.tipo === "saida") saldos[item.modalidade] -= item.valor;
        }
    });
    configUsuario.beneficios.forEach(b => { let span = document.getElementById(`saldo_${b}`); if(span) span.textContent = formatarMoeda(saldos[b]); });
}

// ===== LOGIN =====
function verificarLogin() {
    const usuarioLogado = sessionStorage.getItem("usuarioLogado");
    if(usuarioLogado) {
        const user = JSON.parse(usuarioLogado);
        document.getElementById("userNome").textContent = user.nome;
        document.getElementById("telaLogin").style.display = "none";
        document.getElementById("telaRegistro").style.display = "none";
        document.getElementById("telaRecuperar").style.display = "none";
        
        const configurado = carregarConfiguracoes(user.id);
        if(!configurado) {
            document.getElementById("telaConfiguracao").style.display = "flex";
            document.getElementById("sistemaPrincipal").style.display = "none";
        } else {
            aplicarConfiguracoes();
            document.getElementById("telaConfiguracao").style.display = "none";
            document.getElementById("sistemaPrincipal").style.display = "block";
            if(!sistemaInicializado) { sistemaInicializado = true; setTimeout(() => atualizarTabela(), 100); }
        }
    } else {
        document.getElementById("telaLogin").style.display = "flex";
        document.getElementById("sistemaPrincipal").style.display = "none";
        sistemaInicializado = false;
    }
}

document.getElementById("formLogin").onsubmit = function(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const senha = document.getElementById("loginSenha").value;
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);
    if(usuario) {
        sessionStorage.setItem("usuarioLogado", JSON.stringify({ id: usuario.id, nome: usuario.nome, email: usuario.email }));
        const chaveDados = `dados_${usuario.id}`;
        let dadosUsuario = JSON.parse(localStorage.getItem(chaveDados));
        principal = dadosUsuario || [];
        localStorage.setItem("principal", JSON.stringify(principal));
        verificarLogin();
    } else alert("❌ E-mail ou senha incorretos!");
};

document.getElementById("formRegistro").onsubmit = function(e) {
    e.preventDefault();
    const nome = document.getElementById("regNome").value;
    const email = document.getElementById("regEmail").value;
    const senha = document.getElementById("regSenha").value;
    const confirmar = document.getElementById("regConfirmarSenha").value;
    if(senha !== confirmar) return alert("As senhas não coincidem!");
    if(senha.length < 6) return alert("Mínimo 6 caracteres!");
    if(usuarios.find(u => u.email === email)) return alert("E-mail já cadastrado!");
    usuarios.push({ id: Date.now(), nome, email, senha });
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    alert("Conta criada! Faça login.");
    mostrarLogin();
};

document.getElementById("formRecuperar").onsubmit = function(e) {
    e.preventDefault();
    const email = document.getElementById("recEmail").value;
    const user = usuarios.find(u => u.email === email);
    alert(user ? `Sua senha é: ${user.senha}` : "E-mail não encontrado!");
};

document.getElementById("formConfiguracao").onsubmit = function(e) {
    e.preventDefault();
    const beneficios = [...document.querySelectorAll("#listaBeneficiosConfig .config-input")].map(i => i.value.trim().toUpperCase()).filter(v => v);
    const bancos = [...document.querySelectorAll("#listaBancosConfig .config-input")].map(i => i.value.trim()).filter(v => v);
    const modalidades = [...document.querySelectorAll("#listaModalidadesConfig .config-input")].map(i => i.value.trim()).filter(v => v);
    if(beneficios.length === 0 || bancos.length === 0 || modalidades.length === 0) return alert("Preencha todos os campos!");
    configUsuario = { beneficios, bancos, modalidades };
    const user = JSON.parse(sessionStorage.getItem("usuarioLogado"));
    if(user) salvarConfiguracoes(user.id);
    aplicarConfiguracoes();
    document.getElementById("telaConfiguracao").style.display = "none";
    document.getElementById("sistemaPrincipal").style.display = "block";
    atualizarTabela();
};

function adicionarItemConfig(listaId) {
    const div = document.createElement("div");
    div.className = "config-item";
    div.innerHTML = `<input type="text" class="config-input"><button type="button" onclick="removerItemConfig(this)" class="btn-remover">✖</button>`;
    document.getElementById(listaId).appendChild(div);
}

function adicionarSugestao(listaId, valor) {
    const lista = document.getElementById(listaId);
    const div = document.createElement("div");
    div.className = "config-item";
    div.innerHTML = `<input type="text" class="config-input" value="${valor}"><button type="button" onclick="removerItemConfig(this)" class="btn-remover">✖</button>`;
    lista.appendChild(div);
}

function removerItemConfig(btn) { btn.parentElement.remove(); }
function mostrarRegistro() { document.getElementById("telaLogin").style.display = "none"; document.getElementById("telaRegistro").style.display = "flex"; }
function mostrarLogin() { document.getElementById("telaLogin").style.display = "flex"; document.getElementById("telaRegistro").style.display = "none"; document.getElementById("telaRecuperar").style.display = "none"; }
function mostrarRecuperarSenha() { document.getElementById("telaLogin").style.display = "none"; document.getElementById("telaRecuperar").style.display = "flex"; }
function logout() { sessionStorage.removeItem("usuarioLogado"); sistemaInicializado = false; verificarLogin(); }
function abrirPerfil() { document.getElementById("sistemaPrincipal").style.display = "none"; document.getElementById("telaPerfil").style.display = "flex"; carregarPerfil(); }
function fecharPerfil() { document.getElementById("telaPerfil").style.display = "none"; document.getElementById("sistemaPrincipal").style.display = "block"; }
function abrirConfiguracoes() { document.getElementById("telaPerfil").style.display = "none"; document.getElementById("telaConfiguracao").style.display = "flex"; }

function carregarPerfil() {
    const user = JSON.parse(sessionStorage.getItem("usuarioLogado"));
    const info = document.getElementById("perfilInfo");
    info.innerHTML = `<h4>📋 Dados</h4><p><strong>Nome:</strong> ${user.nome}</p><p><strong>Email:</strong> ${user.email}</p><h4>🎁 Benefícios</h4><ul>${configUsuario.beneficios.map(b => `<li>${b}</li>`).join('')}</ul><h4>🏦 Bancos</h4><ul>${configUsuario.bancos.map(b => `<li>${b}</li>`).join('')}</ul><h4>💳 Pagamentos</h4><ul>${configUsuario.modalidades.map(m => `<li>${m}</li>`).join('')}</ul>`;
}

// ===== PERSONALIZAÇÃO DE CORES =====
function abrirPersonalizacaoCores() {
    const listaBeneficios = document.getElementById("listaCoresBeneficios");
    if(listaBeneficios) {
        listaBeneficios.innerHTML = '';
        configUsuario.beneficios.forEach(beneficio => {
            const corAtual = coresPersonalizadas.beneficios[beneficio] || '#00b09b';
            listaBeneficios.innerHTML += `
                <div class="item-cor-modern">
                    <span>${beneficio}</span>
                    <input type="color" class="cor-beneficio-input" data-beneficio="${beneficio}" value="${corAtual}">
                </div>
            `;
        });
    }
    
    const listaBancos = document.getElementById("listaCoresBancos");
    if(listaBancos) {
        listaBancos.innerHTML = '';
        configUsuario.bancos.forEach(banco => {
            const corAtual = coresPersonalizadas.bancos[banco] || '#667eea';
            listaBancos.innerHTML += `
                <div class="item-cor-modern">
                    <span>${banco}</span>
                    <input type="color" class="cor-banco-input" data-banco="${banco}" value="${corAtual}">
                </div>
            `;
        });
    }
    
    document.getElementById("corEntrada").value = coresPersonalizadas.entrada;
    document.getElementById("corSaida").value = coresPersonalizadas.saida;
    document.getElementById("corSaldo").value = coresPersonalizadas.saldo;
    
    document.getElementById("sistemaPrincipal").style.display = "none";
    document.getElementById("telaCores").style.display = "flex";
}

function fecharTelaCores() {
    document.getElementById("telaCores").style.display = "none";
    document.getElementById("sistemaPrincipal").style.display = "block";
}

function mostrarFeedback(mensagem) {
    const toast = document.createElement('div');
    toast.textContent = mensagem;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #00b09b, #96c93d);
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: bold;
        z-index: 10000;
        animation: fadeInOut 2s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

const styleToast = document.createElement('style');
styleToast.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(styleToast);

document.getElementById("formCores")?.addEventListener("submit", function(e) {
    e.preventDefault();
    
    coresPersonalizadas.entrada = document.getElementById("corEntrada").value;
    coresPersonalizadas.saida = document.getElementById("corSaida").value;
    coresPersonalizadas.saldo = document.getElementById("corSaldo").value;
    
    document.querySelectorAll('.cor-beneficio-input').forEach(input => {
        const beneficio = input.getAttribute('data-beneficio');
        coresPersonalizadas.beneficios[beneficio] = input.value;
    });
    
    document.querySelectorAll('.cor-banco-input').forEach(input => {
        const banco = input.getAttribute('data-banco');
        coresPersonalizadas.bancos[banco] = input.value;
    });
    
    salvarCoresPersonalizadas();
    aplicarCoresSalvas();
    mostrarFeedback("✅ Cores salvas com sucesso!");
    
    setTimeout(() => {
        fecharTelaCores();
    }, 1000);
});

// ===== FILTROS TOGGLE =====
function toggleFiltros() { toggleFiltro('filtrosContainer', 'iconeFiltro'); }
function toggleFiltrosFatura() { toggleFiltro('filtrosFaturaContent', 'iconeFiltroFatura'); }
function toggleFiltrosBeneficio() { toggleFiltro('filtrosBeneficioContent', 'iconeFiltroBeneficio'); }
function toggleFiltro(containerId, iconeId) {
    const c = document.getElementById(containerId);
    const i = document.getElementById(iconeId);
    if(c && i) { if(c.classList.contains('fechado')) { c.classList.remove('fechado'); i.textContent = '▼'; } else { c.classList.add('fechado'); i.textContent = '▶'; } }
}

// ===== TABELA PRINCIPAL =====
function atualizarTabela() {
    if(!lista) return;
    lista.innerHTML = "";
    let dados = [...principal];
    const bancosSel = getSelecionados("filtroBanco");
    const tiposSel = getSelecionados("filtroTipo");
    const modalidadesSel = getSelecionados("filtroModalidade");
    if(bancosSel.length) dados = dados.filter(i => bancosSel.includes(i.banco));
    if(tiposSel.length) dados = dados.filter(i => tiposSel.includes(i.tipo));
    if(modalidadesSel.length) dados = dados.filter(i => modalidadesSel.includes(i.modalidade));
    dados.sort((a,b) => new Date(b.data) - new Date(a.data));
    document.getElementById("contadorResultados").textContent = `${dados.length} registro(s)`;
    if(!dados.length) { lista.innerHTML = `<tr><td colspan="7">Nenhum registro</td>`; atualizarResumo(); atualizarBeneficiosDinamico(); atualizarFatura(); return; }
    dados.forEach(item => {
        const row = lista.insertRow();
        const cor = item.tipo === 'entrada' ? '#00b09b' : '#ff416c';
        row.innerHTML = `<td>${item.descricao}</td><td>${formatarMoeda(item.valor)}</td><td style="color:${cor};font-weight:bold">${item.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td><td>${item.modalidade}</td><td>${item.banco || "-"}</td><td>${item.data}</td><td class="acao-botoes"><button class="editar-btn" onclick="editarItem(${item.id})">✏️ Editar</button><button class="excluir-btn" onclick="remover(${item.id})">🗑️ Excluir</button></td>`;
    });
    atualizarResumo();
    atualizarBeneficiosDinamico();
    atualizarFatura();
}

// AJUSTE AQUI: Saídas com modalidade "Crédito" NÃO entram no cálculo do saldo
function atualizarResumo() {
    let entrada = 0, saida = 0;
    principal.forEach(i => { 
        // Ignora benefícios e também ignora saídas com modalidade "Crédito" no saldo
        if(!configUsuario.beneficios.includes(i.modalidade)) { 
            if(i.tipo === "entrada") entrada += i.valor; 
            else if(i.tipo === "saida" && i.modalidade !== "Crédito") saida += i.valor; 
        } 
    });
    totalEntrada.textContent = formatarMoeda(entrada);
    totalSaida.textContent = formatarMoeda(saida);
    saldoFinal.textContent = formatarMoeda(entrada - saida);
}

// ===== FILTRAR BENEFÍCIO =====
window.filtrarBeneficio = function(beneficio) {
    beneficioSelecionado = beneficio;
    transacoesOriginais = principal.filter(i => i.modalidade === beneficio).sort((a,b) => new Date(b.data) - new Date(a.data));
    document.getElementById("beneficioFiltroAtivo").innerHTML = `📊 ${beneficio} - ${transacoesOriginais.length} transações`;
    limparFiltrosBeneficio();
    atualizarTabelaBeneficio(transacoesOriginais);
};

function aplicarFiltrosBeneficio() {
    if(!beneficioSelecionado) return alert("Clique em um benefício primeiro!");
    let dados = [...transacoesOriginais];
    const inicio = document.getElementById("filtroBeneficioDataInicio").value;
    if(inicio) dados = dados.filter(i => i.data >= inicio);
    const fim = document.getElementById("filtroBeneficioDataFim").value;
    if(fim) dados = dados.filter(i => i.data <= fim);
    const min = parseFloat(document.getElementById("filtroBeneficioValorMin").value);
    if(min) dados = dados.filter(i => i.valor >= min);
    const max = parseFloat(document.getElementById("filtroBeneficioValorMax").value);
    if(max) dados = dados.filter(i => i.valor <= max);
    const busca = document.getElementById("filtroBeneficioDescricao").value.toLowerCase();
    if(busca) dados = dados.filter(i => i.descricao.toLowerCase().includes(busca));
    const tipoFiltro = document.getElementById("filtroBeneficioTipo").value;
    if(tipoFiltro !== "todos") dados = dados.filter(i => i.tipo === tipoFiltro);
    const ordenar = document.getElementById("filtroBeneficioOrdenar").value;
    if(ordenar === 'data_desc') dados.sort((a,b) => new Date(b.data) - new Date(a.data));
    if(ordenar === 'data_asc') dados.sort((a,b) => new Date(a.data) - new Date(b.data));
    if(ordenar === 'valor_desc') dados.sort((a,b) => b.valor - a.valor);
    if(ordenar === 'valor_asc') dados.sort((a,b) => a.valor - b.valor);
    atualizarTabelaBeneficio(dados);
}

function limparFiltrosBeneficio() {
    document.getElementById("filtroBeneficioDataInicio").value = "";
    document.getElementById("filtroBeneficioDataFim").value = "";
    document.getElementById("filtroBeneficioValorMin").value = "";
    document.getElementById("filtroBeneficioValorMax").value = "";
    document.getElementById("filtroBeneficioDescricao").value = "";
    document.getElementById("filtroBeneficioTipo").value = "todos";
    document.getElementById("filtroBeneficioOrdenar").value = "data_desc";
    if(beneficioSelecionado && transacoesOriginais.length) atualizarTabelaBeneficio(transacoesOriginais);
}

function atualizarTabelaBeneficio(transacoes) {
    if(!listaBeneficioFiltrado) return;
    listaBeneficioFiltrado.innerHTML = "";
    if(!transacoes.length) { listaBeneficioFiltrado.innerHTML = `<tr><td colspan="4">Nenhuma transação</td>`; return; }
    transacoes.forEach(i => {
        const row = listaBeneficioFiltrado.insertRow();
        const cor = i.tipo === 'entrada' ? '#00b09b' : '#ff416c';
        row.innerHTML = `<td>${i.descricao}</td><td>${formatarMoeda(i.valor)}</td><td style="color:${cor}">${i.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td><td>${i.data}</td>`;
    });
}

// ===== FILTRAR BANCO CRÉDITO =====
window.filtrarBancoCredito = function(bancoNome) {
    bancoSelecionadoFatura = bancoNome;
    comprasOriginais = principal.filter(i => i.modalidade === "Crédito" && i.tipo === "saida" && i.banco === bancoNome).sort((a,b) => new Date(b.data) - new Date(a.data));
    document.getElementById("tituloFaturaFiltro").innerHTML = `💳 ${bancoNome}`;
    document.getElementById("filtroBancoAtivo").innerHTML = `📊 ${comprasOriginais.length} compras`;
    limparFiltrosFatura();
    atualizarTabelaFatura(comprasOriginais);
};

function aplicarFiltrosFatura() {
    if(!bancoSelecionadoFatura) return alert("Clique em um banco primeiro!");
    let dados = [...comprasOriginais];
    const inicio = document.getElementById("filtroDataInicio").value;
    if(inicio) dados = dados.filter(i => i.data >= inicio);
    const fim = document.getElementById("filtroDataFim").value;
    if(fim) dados = dados.filter(i => i.data <= fim);
    const min = parseFloat(document.getElementById("filtroValorMin").value);
    if(min) dados = dados.filter(i => i.valor >= min);
    const max = parseFloat(document.getElementById("filtroValorMax").value);
    if(max) dados = dados.filter(i => i.valor <= max);
    const busca = document.getElementById("filtroDescricao").value.toLowerCase();
    if(busca) dados = dados.filter(i => i.descricao.toLowerCase().includes(busca));
    const ordenar = document.getElementById("filtroOrdenar").value;
    if(ordenar === 'data_desc') dados.sort((a,b) => new Date(b.data) - new Date(a.data));
    if(ordenar === 'data_asc') dados.sort((a,b) => new Date(a.data) - new Date(b.data));
    if(ordenar === 'valor_desc') dados.sort((a,b) => b.valor - a.valor);
    if(ordenar === 'valor_asc') dados.sort((a,b) => a.valor - b.valor);
    atualizarTabelaFatura(dados);
}

function limparFiltrosFatura() {
    document.getElementById("filtroDataInicio").value = "";
    document.getElementById("filtroDataFim").value = "";
    document.getElementById("filtroValorMin").value = "";
    document.getElementById("filtroValorMax").value = "";
    document.getElementById("filtroDescricao").value = "";
    document.getElementById("filtroOrdenar").value = "data_desc";
    if(bancoSelecionadoFatura && comprasOriginais.length) atualizarTabelaFatura(comprasOriginais);
}

function atualizarTabelaFatura(compras) {
    if(!listaFatura) return;
    listaFatura.innerHTML = "";
    if(!compras.length) { listaFatura.innerHTML = `<tr><td colspan="5">Nenhuma compra</td>`; return; }
    compras.forEach(i => {
        const row = listaFatura.insertRow();
        row.innerHTML = `<td>${i.descricao}</td><td style="color:#ff416c">${formatarMoeda(i.valor)}</td><td>${i.banco}</td><td>${i.data}</td><td>Crédito</td>`;
    });
}

function atualizarFatura() {
    let totais = {};
    configUsuario.bancos.forEach(b => totais[b] = 0);
    principal.filter(i => i.modalidade === "Crédito" && i.tipo === "saida").forEach(i => { if(totais[i.banco] !== undefined) totais[i.banco] += i.valor; });
    configUsuario.bancos.forEach(b => { let span = document.getElementById(`fatura_${b.replace(/\s/g, '_')}`); if(span) span.textContent = formatarMoeda(totais[b] || 0); });
    if(!bancoSelecionadoFatura) {
        document.getElementById("tituloFaturaFiltro").innerHTML = "Compras no Crédito (pendentes)";
        document.getElementById("filtroBancoAtivo").innerHTML = "";
        const compras = principal.filter(i => i.modalidade === "Crédito" && i.tipo === "saida");
        listaFatura.innerHTML = "";
        if(!compras.length) listaFatura.innerHTML = `<tr><td colspan="5">Nenhuma compra</td>`;
        else compras.forEach(i => { const row = listaFatura.insertRow(); row.innerHTML = `<td>${i.descricao}</td><td style="color:#ff416c">${formatarMoeda(i.valor)}</td><td>${i.banco}</td><td>${i.data}</td><td>Crédito</td>`; });
    }
}

// ===== CRUD =====
form.onsubmit = e => {
    e.preventDefault();
    if(!descricao.value || !valor.value || !tipo.value || !modalidade.value || !data.value) return alert("Preencha todos os campos!");
    principal.push({ id: Date.now(), descricao: descricao.value, valor: parseFloat(valor.value), tipo: tipo.value, modalidade: modalidade.value, banco: banco.value || "", data: data.value });
    localStorage.setItem("principal", JSON.stringify(principal));
    const user = JSON.parse(sessionStorage.getItem("usuarioLogado"));
    if(user) localStorage.setItem(`dados_${user.id}`, JSON.stringify(principal));
    form.reset();
    atualizarTabela();
};

window.editarItem = function(id) { abrirModal(id); };
window.remover = function(id) { if(confirm("Excluir?")) { principal = principal.filter(i => i.id !== id); localStorage.setItem("principal", JSON.stringify(principal)); const user = JSON.parse(sessionStorage.getItem("usuarioLogado")); if(user) localStorage.setItem(`dados_${user.id}`, JSON.stringify(principal)); atualizarTabela(); } };

function abrirModal(id) {
    const item = principal.find(i => i.id === id);
    if(!item) return;
    document.getElementById("editarId").value = item.id;
    document.getElementById("editarDescricao").value = item.descricao;
    document.getElementById("editarValor").value = item.valor;
    document.getElementById("editarTipo").value = item.tipo;
    document.getElementById("editarBanco").value = item.banco || "";
    document.getElementById("editarModalidade").value = item.modalidade;
    document.getElementById("editarData").value = item.data;
    modal.style.display = "block";
}

function fecharModalFunc() { modal.style.display = "none"; formEditar.reset(); }
if(fecharModal) fecharModal.onclick = fecharModalFunc;
if(btnCancelar) btnCancelar.onclick = fecharModalFunc;
window.onclick = function(e) { if(e.target === modal) fecharModalFunc(); };

formEditar.onsubmit = e => {
    e.preventDefault();
    const id = parseInt(document.getElementById("editarId").value);
    const index = principal.findIndex(i => i.id === id);
    if(index !== -1) {
        principal[index] = { id, descricao: document.getElementById("editarDescricao").value, valor: parseFloat(document.getElementById("editarValor").value), tipo: document.getElementById("editarTipo").value, modalidade: document.getElementById("editarModalidade").value, banco: document.getElementById("editarBanco").value || "", data: document.getElementById("editarData").value };
        localStorage.setItem("principal", JSON.stringify(principal));
        const user = JSON.parse(sessionStorage.getItem("usuarioLogado"));
        if(user) localStorage.setItem(`dados_${user.id}`, JSON.stringify(principal));
        atualizarTabela();
        fecharModalFunc();
    }
};

// ===== ABAS =====
window.trocarAba = function(aba) {
    document.querySelectorAll(".aba").forEach(a => a.classList.remove("ativa"));
    document.querySelectorAll(".abas button").forEach(b => b.classList.remove("active"));
    document.getElementById("aba" + aba.charAt(0).toUpperCase() + aba.slice(1)).classList.add("ativa");
    document.getElementById("btn" + aba.charAt(0).toUpperCase() + aba.slice(1)).classList.add("active");
};

// ===== BOTÕES =====
document.getElementById("btnAplicarFiltro").onclick = atualizarTabela;
document.getElementById("btnLimparFiltro").onclick = () => { document.querySelectorAll("#filtroBanco input, #filtroModalidade input, #filtroTipo input").forEach(i => i.checked = false); atualizarTabela(); };
document.getElementById("btnAplicarFiltroBeneficio").onclick = aplicarFiltrosBeneficio;
document.getElementById("btnLimparFiltroBeneficio").onclick = limparFiltrosBeneficio;
document.getElementById("btnAplicarFiltroFatura").onclick = aplicarFiltrosFatura;
document.getElementById("btnLimparFiltroFatura").onclick = limparFiltrosFatura;

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => { verificarLogin(); });