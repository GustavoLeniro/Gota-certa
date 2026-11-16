/**
 * registro.js — lógica da página "Registrar consumo".
 *
 * O que este arquivo faz:
 *   1. Adicionar, listar, editar e remover registros de consumo de água
 *   2. Mostrar o resumo do dia (total, média por pessoa e comparação com 110 L)
 *   3. Manter o painel de atividades (data/hora, ação e resultado)
 *   4. Guardar os dados no localStorage (opcional: se falhar, o site continua funcionando).
 *
 * Segurança: todo texto vai para a tela com textContent (nunca innerHTML),
 * e toda entrada passa por Validacao (validacao.js) antes de ser usada.
 */
(function () {
  'use strict'

  // ---------- Constantes ----------
  const CHAVE_REGISTROS = 'gotacerta:registros';
  const CHAVE_MORADORES = 'gotacerta:moradores';
  const META_LITROS_POR_PESSOA = 110;
  const MAX_ENTRADAS_LOG = 50;
  const MAX_REGISTROS = 500;

  // Mensagens para o usuário: nunca mostram detalhes técnicos do erro.
  const MSG_ERRO_CARREGAR = 'Não foi possível carregar os dados. Tente novamente.';
  const MSG_ERRO_SALVAR = 'Não foi possível salvar os dados. Tente novamente.';
  const MSG_ERRO_GERAL = 'Algo deu errado. Tente novamente.';

  // ---------- Estado da página ----------
  const estado = {
    registros: [],     // lista de { id, atividade, litros, data, observacao }
    moradores: 1,
    idEmEdicao: null,  // id do registro que está sendo editado (ou null)
    log: []            // lista de { momento, acao, resultado }
  };

  const el = {}; // referências aos elementos da página (preenchido em buscarElementos)

  // =====================================================================
  // 1. ELEMENTOS DA PÁGINA
  // =====================================================================

  function buscarElementos() {
    el.form = document.getElementById('form-registro');
    el.tituloForm = document.getElementById('titulo-form');
    el.btnSalvar = document.getElementById('btn-salvar');
    el.btnCancelar = document.getElementById('btn-cancelar');
    el.alerta = document.getElementById('alerta');
    el.listaRegistros = document.getElementById('lista-registros');
    el.listaVazia = document.getElementById('lista-vazia');
    el.tabelaRegistros = document.getElementById('tabela-registros');
    el.listaLog = document.getElementById('lista-log');
    el.resumoTotal = document.getElementById('resumo-total');
    el.resumoMedia = document.getElementById('resumo-media');
    el.resumoStatus = document.getElementById('resumo-status');
    el.moradores = document.getElementById('campo-moradores');
    el.erroMoradores = document.getElementById('erro-moradores');
    el.campos = {
      atividade: document.getElementById('campo-atividade'),
      litros: document.getElementById('campo-litros'),
      data: document.getElementById('campo-data'),
      observacao: document.getElementById('campo-observacao')
    };
    el.erros = {
      atividade: document.getElementById('erro-atividade'),
      litros: document.getElementById('erro-litros'),
      data: document.getElementById('erro-data'),
      observacao: document.getElementById('erro-observacao')
    };
  }

  // =====================================================================
  // 2. MENSAGENS E PAINEL DE ATIVIDADES (LOG)
  // =====================================================================

  /** Mostra uma mensagem no topo da página. tipo: success, warning, danger ou info. */
  function mostrarMensagem(tipo, texto) {
    el.alerta.className = `alert alert-${tipo}`;
    el.alerta.textContent = texto;
  }

  /** Formata a data e hora atuais como DD/MM/AAAA HH:MM. */
  function agoraFormatado() {
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${agora.getFullYear()} ${hora}:${minuto}`;
  }

  /** Guarda uma entrada no painel de atividades e redesenha o painel. */
  function registrarLog(acao, resultado) {
    estado.log.unshift({ momento: agoraFormatado(), acao, resultado });
    estado.log = estado.log.slice(0, MAX_ENTRADAS_LOG);
    renderizarLog();
  }

  function criarCelula(texto) {
    const celula = document.createElement('td');
    celula.textContent = texto; // textContent: o texto nunca é interpretado como HTML
    return celula;
  }

  function renderizarLog() {
    el.listaLog.replaceChildren();
    estado.log.forEach(function (entrada) {
      const linha = document.createElement('tr');
      linha.append(criarCelula(entrada.momento), criarCelula(entrada.acao), criarCelula(entrada.resultado));
      el.listaLog.append(linha);
    });
  }

  // =====================================================================
  // 3. PERSISTÊNCIA (localStorage)
  // =====================================================================

  /** Confere se um item lido do localStorage tem o formato esperado (os dados podem ter sido alterados). */
  function registroSalvoEhValido(item) {
    if (!item || typeof item !== 'object') return false;
    if (typeof item.id !== 'string' || !/^[a-z0-9]{6,30}$/.test(item.id)) return false;
    const resultado = Validacao.validarRegistro({
      atividade: item.atividade,
      litros: String(item.litros),
      data: item.data,
      observacao: typeof item.observacao === 'string' ? item.observacao : ''
    });
    return resultado.valido;
  }

  function carregarRegistros() {
    try {
      const bruto = localStorage.getItem(CHAVE_REGISTROS);
      if (bruto === null) return [];
      const lista = JSON.parse(bruto);
      if (!Array.isArray(lista)) throw new Error('formato inesperado');
      return lista.filter(registroSalvoEhValido).slice(0, MAX_REGISTROS);
    } catch (erro) {
      mostrarMensagem('danger', MSG_ERRO_CARREGAR);
      registrarLog('Carregar', 'Falha ao carregar os dados.');
      return [];
    }
  }

  function carregarMoradores() {
    try {
      const salvo = localStorage.getItem(CHAVE_MORADORES);
      if (salvo !== null && Validacao.validarMoradores(salvo) === '') {
        return Number(salvo);
      }
    } catch (erro) {
      // Sem acesso ao armazenamento: segue com o valor padrão (1 morador).
    }
    return 1;
  }

  /** Salva os registros. Devolve true se deu certo e false se falhou. */
  function salvarRegistros() {
    try {
      localStorage.setItem(CHAVE_REGISTROS, JSON.stringify(estado.registros));
      return true;
    } catch (erro) {
      mostrarMensagem('danger', MSG_ERRO_SALVAR);
      registrarLog('Salvar', 'Falha ao salvar os dados.');
      return false;
    }
  }

  function salvarMoradores() {
    try {
      localStorage.setItem(CHAVE_MORADORES, String(estado.moradores));
    } catch (erro) {
      // Não é crítico: o número só vale para esta visita.
    }
  }

  // =====================================================================
  // 4. OPERAÇÕES SOBRE OS DADOS (adicionar, editar, remover)
  // =====================================================================

  function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function adicionarRegistro(dados) {
    const novo = { id: gerarId(), ...dados };
    estado.registros.push(novo);
    return novo;
  }

  /** Troca os dados de um registro existente. Devolve false se o id não existir. */
  function editarRegistro(id, dados) {
    const posicao = estado.registros.findIndex(function (r) { return r.id === id; });
    if (posicao === -1) return false;
    estado.registros[posicao] = { id, ...dados };
    return true;
  }

  /** Apaga um registro. Devolve false se o id não existir. */
  function removerRegistro(id) {
    const antes = estado.registros.length;
    estado.registros = estado.registros.filter(function (r) { return r.id !== id; });
    return estado.registros.length < antes;
  }

  // =====================================================================
  // 5. FORMULÁRIO: leitura, validação e mensagens de erro nos campos
  // =====================================================================

  function lerCampos() {
    return {
      atividade: el.campos.atividade.value,
      litros: el.campos.litros.value,
      data: el.campos.data.value,
      observacao: el.campos.observacao.value
    };
  }

  function limparErrosDosCampos() {
    Object.keys(el.campos).forEach(function (nome) {
      el.campos[nome].classList.remove('is-invalid');
      el.erros[nome].textContent = '';
    });
  }

  function mostrarErrosNosCampos(erros) {
    limparErrosDosCampos();
    Object.keys(erros).forEach(function (nome) {
      el.campos[nome].classList.add('is-invalid');
      el.erros[nome].textContent = erros[nome];
    });
    const primeiroComErro = Object.keys(erros)[0];
    if (primeiroComErro) el.campos[primeiroComErro].focus();
  }

  function validarFormulario() {
    const resultado = Validacao.validarRegistro(lerCampos());
    mostrarErrosNosCampos(resultado.erros);
    return resultado;
  }

  /** Volta o formulário ao estado de "novo registro". */
  function limparFormulario() {
    el.form.reset();
    el.campos.data.value = Validacao.dataDeHoje();
    el.campos.data.max = Validacao.dataDeHoje();
    limparErrosDosCampos();
    estado.idEmEdicao = null;
    el.tituloForm.textContent = 'Novo registro';
    el.btnSalvar.textContent = 'Adicionar registro';
    el.btnCancelar.classList.add('d-none');
  }

  // =====================================================================
  // 6. TELA: lista de registros e resumo do dia
  // =====================================================================

  function criarBotaoDeAcao(texto, acao, id, classe) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = `btn btn-sm ${classe}`;
    botao.textContent = texto;
    botao.dataset.acao = acao;
    botao.dataset.id = id;
    return botao;
  }

  function criarLinhaDoRegistro(registro) {
    const linha = document.createElement('tr');
    // Os botões ficam dentro de uma <div> (Flexbox); o <td> continua sendo uma célula de tabela normal.
    const grupoBotoes = document.createElement('div');
    grupoBotoes.className = 'celula-acoes';
    grupoBotoes.append(
      criarBotaoDeAcao('Editar', 'editar', registro.id, 'btn-outline-primary'),
      criarBotaoDeAcao('Remover', 'remover', registro.id, 'btn-outline-danger')
    );
    const celulaAcoes = document.createElement('td');
    celulaAcoes.append(grupoBotoes);
    linha.append(
      criarCelula(Validacao.formatarDataBR(registro.data)),
      criarCelula(registro.atividade),
      criarCelula(String(registro.litros)),
      criarCelula(registro.observacao === '' ? '—' : registro.observacao),
      celulaAcoes
    );
    return linha;
  }

  /** Desenha a lista (da data mais recente para a mais antiga). */
  function renderizarLista() {
    el.listaRegistros.replaceChildren();
    const ordenados = estado.registros.slice().sort(function (a, b) {
      return b.data.localeCompare(a.data);
    });
    ordenados.forEach(function (registro) {
      el.listaRegistros.append(criarLinhaDoRegistro(registro));
    });
    const vazia = estado.registros.length === 0;
    el.listaVazia.classList.toggle('d-none', !vazia);
    el.tabelaRegistros.classList.toggle('d-none', vazia);
  }

  function totalDeHoje() {
    const hoje = Validacao.dataDeHoje();
    return estado.registros
      .filter(function (r) { return r.data === hoje; })
      .reduce(function (soma, r) { return soma + r.litros; }, 0);
  }

  function renderizarResumo() {
    const total = totalDeHoje();
    const media = Math.round(total / estado.moradores);
    el.resumoTotal.textContent = String(total);
    el.resumoMedia.textContent = String(media);
    el.moradores.value = String(estado.moradores);

    if (total === 0) {
      el.resumoStatus.textContent = 'Nenhum registro hoje.';
      el.resumoStatus.className = 'cartao-status';
    } else if (media <= META_LITROS_POR_PESSOA) {
      el.resumoStatus.textContent = 'Dentro da referência de 110 litros por pessoa.';
      el.resumoStatus.className = 'cartao-status status-ok';
    } else {
      el.resumoStatus.textContent = `Acima da referência em ${media - META_LITROS_POR_PESSOA} litros por pessoa.`;
      el.resumoStatus.className = 'cartao-status status-alerta';
    }
  }

  function renderizarTudo() {
    renderizarLista();
    renderizarResumo();
  }

  // =====================================================================
  // 7. AÇÕES DO USUÁRIO (eventos)
  // =====================================================================

  function concluirAdicao(dados) {
    const novo = adicionarRegistro(dados);
    if (!salvarRegistros()) return;
    renderizarTudo();
    limparFormulario();
    mostrarMensagem('success', 'Registro adicionado com sucesso.');
    registrarLog('Adicionar', `Sucesso: ${novo.atividade}, ${novo.litros} L.`);
  }

  function concluirEdicao(dados) {
    const idEditado = estado.idEmEdicao;
    if (!editarRegistro(idEditado, dados)) {
      mostrarMensagem('danger', MSG_ERRO_GERAL);
      registrarLog('Editar', 'Falha: registro não encontrado.');
      limparFormulario();
      return;
    }
    if (!salvarRegistros()) return;
    renderizarTudo();
    limparFormulario();
    mostrarMensagem('success', 'Registro atualizado com sucesso.');
    registrarLog('Editar', `Sucesso: ${dados.atividade}, ${dados.litros} L.`);
  }

  function tratarEnvio(evento) {
    evento.preventDefault();
    const acao = estado.idEmEdicao ? 'Editar' : 'Adicionar';
    try {
      const resultado = validarFormulario();
      if (!resultado.valido) {
        mostrarMensagem('warning', 'Corrija os campos destacados e tente novamente.');
        registrarLog(acao, 'Não realizado: dados inválidos.');
        return;
      }
      if (estado.idEmEdicao) {
        concluirEdicao(resultado.limpo);
      } else {
        concluirAdicao(resultado.limpo);
      }
    } catch (erro) {
      mostrarMensagem('danger', MSG_ERRO_GERAL);
      registrarLog(acao, 'Falha inesperada.');
    }
  }

  function iniciarEdicao(id) {
    const registro = estado.registros.find(function (r) { return r.id === id; });
    if (!registro) {
      mostrarMensagem('danger', MSG_ERRO_GERAL);
      registrarLog('Editar', 'Falha: registro não encontrado.');
      return;
    }
    limparErrosDosCampos();
    el.campos.atividade.value = registro.atividade;
    el.campos.litros.value = String(registro.litros);
    el.campos.data.value = registro.data;
    el.campos.observacao.value = registro.observacao;
    estado.idEmEdicao = id;
    el.tituloForm.textContent = 'Editar registro';
    el.btnSalvar.textContent = 'Salvar alteração';
    el.btnCancelar.classList.remove('d-none');
    mostrarMensagem('info', 'Altere os campos e clique em “Salvar alteração”.');
    el.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.campos.litros.focus();
  }

  function cancelarEdicao() {
    limparFormulario();
    mostrarMensagem('info', 'Edição cancelada.');
    registrarLog('Editar', 'Cancelado pelo usuário.');
  }

  function confirmarRemocao(id) {
    const registro = estado.registros.find(function (r) { return r.id === id; });
    if (!registro) {
      mostrarMensagem('danger', MSG_ERRO_GERAL);
      registrarLog('Remover', 'Falha: registro não encontrado.');
      return;
    }
    if (!window.confirm(`Remover o registro de ${registro.atividade} (${registro.litros} L)?`)) {
      registrarLog('Remover', 'Cancelado pelo usuário.');
      return;
    }
    removerRegistro(id);
    if (estado.idEmEdicao === id) limparFormulario();
    if (!salvarRegistros()) return;
    renderizarTudo();
    mostrarMensagem('success', 'Registro removido com sucesso.');
    registrarLog('Remover', `Sucesso: ${registro.atividade}, ${registro.litros} L.`);
  }

  /** Um único "ouvinte" na tabela atende todos os botões Editar e Remover (delegação de eventos). */
  function tratarCliqueNaLista(evento) {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) return;
    try {
      if (botao.dataset.acao === 'editar') iniciarEdicao(botao.dataset.id);
      if (botao.dataset.acao === 'remover') confirmarRemocao(botao.dataset.id);
    } catch (erro) {
      mostrarMensagem('danger', MSG_ERRO_GERAL);
      registrarLog('Lista', 'Falha inesperada.');
    }
  }

  function tratarMudancaDeMoradores() {
    const mensagem = Validacao.validarMoradores(el.moradores.value);
    if (mensagem) {
      el.moradores.classList.add('is-invalid');
      el.erroMoradores.textContent = mensagem;
      return;
    }
    el.moradores.classList.remove('is-invalid');
    el.erroMoradores.textContent = '';
    estado.moradores = Number(el.moradores.value);
    salvarMoradores();
    renderizarResumo();
    registrarLog('Moradores', `Atualizado para ${estado.moradores}.`);
  }

  // =====================================================================
  // 8. INICIALIZAÇÃO
  // =====================================================================

  function iniciar() {
    buscarElementos();
    estado.registros = carregarRegistros();
    estado.moradores = carregarMoradores();
    limparFormulario();
    renderizarTudo();
    registrarLog('Listar', `${estado.registros.length} registro(s) exibido(s).`);

    el.form.addEventListener('submit', tratarEnvio);
    el.btnCancelar.addEventListener('click', cancelarEdicao);
    el.listaRegistros.addEventListener('click', tratarCliqueNaLista);
    el.moradores.addEventListener('change', tratarMudancaDeMoradores);
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
