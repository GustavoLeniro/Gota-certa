/**
 * validacao.js — regras de validação do formulário da Gota Certa.
 *
 * Cada função recebe um valor digitado pelo usuário (sempre texto) e devolve:
 *   - '' (texto vazio) quando o valor está correto;
 *   - uma mensagem curta, em português, quando há erro.
 *
 * As funções não mexem na página (DOM). Assim ficam fáceis de entender e de testar.
 * O arquivo registro.js usa estas funções antes de salvar qualquer dado.
 */
(function (global) {
  'use strict';

  // ---------- Regras (constantes) ----------
  const ATIVIDADES_PERMITIDAS = [
    'Banho', 'Descarga', 'Lavar louça', 'Lavar roupa', 'Cozinhar',
    'Escovar os dentes', 'Limpeza da casa', 'Regar plantas', 'Outro'
  ];
  const LITROS_MIN = 1;
  const LITROS_MAX = 1000;
  const OBSERVACAO_MAX = 80;
  const MORADORES_MIN = 1;
  const MORADORES_MAX = 15;
  const DATA_MINIMA = '2020-01-01';

  // Letras (com acento), números, espaço e pontuação simples. Bloqueia < > " ' { } etc.
  // A flag "u" permite usar \p{L} (qualquer letra) e \p{N} (qualquer número).
  const PADRAO_OBSERVACAO = /^[\p{L}\p{N} .,;:!?()\-_/]*$/u;

  // ---------- Funções de data ----------

  /** Devolve a data de hoje no formato AAAA-MM-DD, no fuso do usuário. */
  function dataDeHoje() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  /** Confere se o texto é uma data real no formato AAAA-MM-DD (ex.: recusa 2026-02-31). */
  function dataExiste(texto) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      return false;
    }
    const [ano, mes, dia] = texto.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  }

  /** Converte AAAA-MM-DD em DD/MM/AAAA para mostrar na tela. */
  function formatarDataBR(texto) {
    const [ano, mes, dia] = texto.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  // ---------- Validações de cada campo ----------

  function validarAtividade(valor) {
    if (!ATIVIDADES_PERMITIDAS.includes(valor)) {
      return 'Escolha uma atividade da lista.';
    }
    return '';
  }

  function validarLitros(valor) {
    const texto = String(valor).trim();
    if (texto === '') {
      return 'Informe quantos litros foram gastos.';
    }
    const numero = Number(texto);
    if (!Number.isFinite(numero)) {
      return 'Use apenas números, sem letras ou símbolos.';
    }
    if (!Number.isInteger(numero)) {
      return 'Use um número inteiro de litros.';
    }
    if (numero < LITROS_MIN || numero > LITROS_MAX) {
      return `Informe um valor entre ${LITROS_MIN} e ${LITROS_MAX} litros.`;
    }
    return '';
  }

  function validarData(valor) {
    const texto = String(valor).trim();
    if (texto === '') {
      return 'Informe a data.';
    }
    if (!dataExiste(texto)) {
      return 'Informe uma data válida.';
    }
    // Datas no formato AAAA-MM-DD podem ser comparadas como texto.
    if (texto > dataDeHoje()) {
      return 'A data não pode estar no futuro.';
    }
    if (texto < DATA_MINIMA) {
      return 'A data é muito antiga. Use 2020 ou depois.';
    }
    return '';
  }

  function validarObservacao(valor) {
    const texto = String(valor).trim();
    if (texto.length > OBSERVACAO_MAX) {
      return `Use no máximo ${OBSERVACAO_MAX} caracteres.`;
    }
    if (!PADRAO_OBSERVACAO.test(texto)) {
      return 'Use apenas letras, números e pontuação simples.';
    }
    return '';
  }

  function validarMoradores(valor) {
    const texto = String(valor).trim();
    const numero = Number(texto);
    if (texto === '' || !Number.isInteger(numero)) {
      return 'Informe um número inteiro de moradores.';
    }
    if (numero < MORADORES_MIN || numero > MORADORES_MAX) {
      return `Informe entre ${MORADORES_MIN} e ${MORADORES_MAX} moradores.`;
    }
    return '';
  }

  // ---------- Validação do registro inteiro ----------

  /**
   * Valida todos os campos de um registro.
   * Entrada: { atividade, litros, data, observacao } (valores em texto).
   * Saída:   { valido, erros, limpo }
   *   - erros: objeto com a mensagem de cada campo que falhou;
   *   - limpo: o registro já convertido e "aparado" (só usar se valido === true).
   */
  function validarRegistro(dados) {
    const erros = {};

    const erroAtividade = validarAtividade(dados.atividade);
    if (erroAtividade) erros.atividade = erroAtividade;

    const erroLitros = validarLitros(dados.litros);
    if (erroLitros) erros.litros = erroLitros;

    const erroData = validarData(dados.data);
    if (erroData) erros.data = erroData;

    const erroObservacao = validarObservacao(dados.observacao);
    if (erroObservacao) erros.observacao = erroObservacao;

    const valido = Object.keys(erros).length === 0;
    const limpo = valido
      ? {
          atividade: dados.atividade,
          litros: Number(String(dados.litros).trim()),
          data: String(dados.data).trim(),
          observacao: String(dados.observacao).trim()
        }
      : null;

    return { valido, erros, limpo };
  }

  // ---------- Exportação ----------
  const api = {
    ATIVIDADES_PERMITIDAS,
    dataDeHoje,
    dataExiste,
    formatarDataBR,
    validarAtividade,
    validarLitros,
    validarData,
    validarObservacao,
    validarMoradores,
    validarRegistro
  };

  // No navegador: window.Validacao. No Node (testes): module.exports.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.Validacao = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
