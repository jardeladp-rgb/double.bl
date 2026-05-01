import { supabase } from './supabaseClient';
import './style.css'; // Garante que o CSS será carregado

// 1. Tipagem Forte: Isso impede os erros de "undefined" que você estava tendo
interface Jogada {
  id?: string;
  cor: string;
  numero: string;
  criado_em?: string;
}

interface Estatisticas {
  total: number;
  vermelho: number;
  preto: number;
  branco: number;
  sequenciaCor: string;
  sequenciaQtd: number;
  rodadasSemBranco: number;
}

// 2. Elementos da Interface (Buscando no HTML com segurança)
const divEstatisticas = document.querySelector<HTMLDivElement>('#estatisticas');
const divRadar = document.querySelector<HTMLDivElement>('#radar');
const divHistorico = document.querySelector<HTMLDivElement>('#historico-lista');

// 3. Motor de Análise: Calcula probabilidades e tendências
function analisarDados(historico: Jogada[]): Estatisticas {
  const stats: Estatisticas = {
    total: historico.length,
    vermelho: 0,
    preto: 0,
    branco: 0,
    sequenciaCor: 'Nenhuma',
    sequenciaQtd: 0,
    rodadasSemBranco: 0
  };

  if (historico.length === 0) return stats;

  // Contagem geral
  historico.forEach(jogada => {
    const cor = jogada.cor.toLowerCase();
    if (cor === 'vermelho') stats.vermelho++;
    if (cor === 'preto') stats.preto++;
    if (cor === 'branco') stats.branco++;
  });

  // Cálculo da Maré (Sequência atual)
  const ultimaCor = historico[0].cor.toLowerCase();
  stats.sequenciaCor = ultimaCor;
  for (const jogada of historico) {
    if (jogada.cor.toLowerCase() === ultimaCor) {
      stats.sequenciaQtd++;
    } else {
      break;
    }
  }

  // Cálculo de distância do último branco
  for (const jogada of historico) {
    if (jogada.cor.toLowerCase() !== 'branco') {
      stats.rodadasSemBranco++;
    } else {
      break;
    }
  }

  return stats;
}

// 4. Renderização do Painel (Atualiza a tela)
function atualizarPainel(historico: Jogada[]) {
  const stats = analisarDados(historico);

  // Calcula porcentagens de forma segura (evita divisão por zero resultando em NaN%)
  const pct = (valor: number) => stats.total > 0 ? ((valor / stats.total) * 100).toFixed(1) : "0.0";

  // Renderiza Estatísticas
  if (divEstatisticas) {
    divEstatisticas.innerHTML = `
      <div class="card card-vermelho">
        <h3>🔴 Vermelho</h3>
        <h2>${pct(stats.vermelho)}%</h2>
      </div>
      <div class="card card-preto">
        <h3>⚫ Preto</h3>
        <h2>${pct(stats.preto)}%</h2>
      </div>
      <div class="card card-branco">
        <h3>⚪ Branco</h3>
        <h2>${pct(stats.branco)}%</h2>
      </div>
    `;
  }

  // Renderiza Radar de Tendência
  if (divRadar) {
    divRadar.innerHTML = `
      <h3>🔥 Radar de Tendência (Maré)</h3>
      <p>Cor dominante: <strong>${stats.sequenciaCor.toUpperCase()}</strong> (${stats.sequenciaQtd}x seguidas)</p>
      <p>Último Branco: <strong>${stats.rodadasSemBranco} rodadas atrás</strong></p>
    `;
  }

  // Renderiza o Histórico Visual (Bolas com Números)
  if (divHistorico) {
    // Pega as últimas 50 jogadas para não poluir a tela
    const ultimasJogadas = historico.slice(0, 50);
    
    divHistorico.innerHTML = ultimasJogadas.map(jogada => {
      const corSegura = jogada.cor ? jogada.cor.toLowerCase() : 'desconhecida';
      const numeroSeguro = jogada.numero || "-";
      return `<div class="bola-item ${corSegura}">${numeroSeguro}</div>`;
    }).join('');
  }
}

// 5. Comunicação com o Banco de Dados (Supabase)
async function iniciarSistema() {
  console.log("Inicializando Dashboard Analítico...");

  try {
    // Busca o histórico inicial
    const { data, error } = await supabase
      .from('historico_jogadas')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(200);

    if (error) throw error;
    
    // Atualiza a tela com os dados iniciais
    atualizarPainel(data || []);

    // Inscreve-se para atualizações em tempo real (Realtime)
    supabase.channel('mudancas_historico')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'historico_jogadas' },
        (payload) => {
          console.log("Nova jogada recebida do robô!", payload.new);
          // Recarrega os dados completos para garantir precisão
          iniciarSistema();
        }
      )
      .subscribe();

  } catch (erro) {
    console.error("Falha ao carregar dados do Supabase:", erro);
  }
}

// Inicia o programa
iniciarSistema();