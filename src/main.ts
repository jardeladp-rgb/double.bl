import { supabase } from './supabaseClient';

// Configurações
const API_URL = 'https://www.bestblaze.com.br/doubleRodadasDia';
const PROXY = 'https://api.allorigins.win/get?url='; // Para pular o bloqueio de site

// 1. Função para converter número em Cor (Padrão Blaze)
function mapearCor(numero: number): string {
  if (numero === 0) return 'Branco';
  if (numero >= 1 && numero <= 7) return 'Vermelho';
  return 'Preto';
}

// 2. Função que busca no site e salva no Supabase
async function buscarRodadasReais() {
  try {
    const response = await fetch(`${PROXY}${encodeURIComponent(API_URL)}`);
    const json = await response.json();
    const dados = JSON.parse(json.contents); // O proxy entrega dentro de 'contents'

    // Pegamos as últimas 20 rodadas que o site forneceu
    const rodadas = dados.slice(0, 20);

    for (const r of rodadas) {
      const corNome = mapearCor(r.color);
      
      // Tenta inserir. Se o id_externo já existir, o Supabase ignora (evita duplicados)
      await supabase
        .from('historico_jogadas')
        .insert([{ 
          id_externo: r.id || `${r.created_at}_${r.color}`, 
          cor: corNome, 
          numero: r.roll,
          criado_em: r.created_at 
        }]);
    }
    
    renderDashboard();
  } catch (err) {
    console.error("Erro ao buscar dados reais:", err);
  }
}

// 3. Lógica de Análise de Maré
function analisarTendencia(historico: any[]) {
  if (!historico || historico.length === 0) return { cor: '---', streak: 0 };
  const ultima = historico[0].cor;
  let streak = 1;
  for (let i = 1; i < historico.length; i++) {
    if (historico[i].cor === ultima) streak++;
    else break;
  }
  return { cor: ultima, streak: streak };
}

// 4. Renderização do Dashboard
async function renderDashboard() {
  const { data: historico } = await supabase
    .from('historico_jogadas')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(100);

  if (!historico) return;

  const total = historico.length;
  const v = historico.filter(d => d.cor === 'Vermelho').length;
  const p = historico.filter(d => d.cor === 'Preto').length;
  const b = historico.filter(d => d.cor === 'Branco').length;
  const tendencia = analisarTendencia(historico);

  const app = document.querySelector<HTMLDivElement>('#app')!;
  app.innerHTML = `
    <div style="font-family: sans-serif; padding: 20px; max-width: 900px; margin: auto;">
      <h2 style="color: #333;">📡 Monitor Real: BestBlaze -> Supabase</h2>
      
      <div style="display: flex; gap: 15px; margin-bottom: 25px;">
        <div class="card red">🔴 Red: ${((v/total)*100).toFixed(1)}%</div>
        <div class="card black">⚫ Black: ${((p/total)*100).toFixed(1)}%</div>
        <div class="card white">⚪ White: ${((b/total)*100).toFixed(1)}%</div>
      </div>

      <div style="background: #e3f2fd; padding: 20px; border-radius: 12px; border-left: 6px solid #2196f3;">
        <h3 style="margin:0">🔥 Tendência de Maré</h3>
        <p style="font-size: 20px;">A cor <strong>${tendencia.cor}</strong> está saindo há <strong>${tendencia.streak}x</strong> rodadas.</p>
      </div>

      <h3>Histórico Recente (Últimas 100)</h3>
      <div class="grid-bolas">
        ${historico.map(h => `
          <div class="bola ${h.cor}" title="${h.criado_em}">
            ${h.numero}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Execução: Busca novos dados a cada 30 segundos
setInterval(buscarRodadasReais, 30000);
buscarRodadasReais(); // Busca inicial