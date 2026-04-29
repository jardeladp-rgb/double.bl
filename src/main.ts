import { supabase } from './supabaseClient';

// 1. Função que salva a jogada no banco
async function registrarJogada(cor: string) {
  const { error } = await supabase
    .from('historico_jogadas')
    .insert([{ cor: cor }]);

  if (error) console.error('Erro ao salvar:', error);
  else renderDashboard(); // Atualiza a tela toda vez que salva
}

// 2. Função que analisa a sequência (Maré)
function analisarTendencia(historico: any[]) {
  if (!historico || historico.length === 0) return { cor: 'Nenhuma', streak: 0, distanciaBranco: 'N/A' };

  const ultima = historico[0].cor;
  let streak = 1;

  for (let i = 1; i < historico.length; i++) {
    if (historico[i].cor === ultima) streak++;
    else break;
  }

  const ultimoBranco = historico.findIndex((h: any) => h.cor === 'Branco');
  
  return {
    cor: ultima,
    streak: streak,
    distanciaBranco: ultimoBranco === -1 ? 'Não saiu recentemente' : `${ultimoBranco} rodadas atrás`
  };
}

// 3. O NOVO Dashboard Turbinado
async function renderDashboard() {
  const { data, error } = await supabase
    .from('historico_jogadas')
    .select('cor, criado_em')
    .order('id', { ascending: false })
    .limit(100); // Puxando as últimas 100 jogadas

  if (error || !data) return;

  const tendencia = analisarTendencia(data);
  const total = data.length;

  // Cálculo de Frequência
  const qtdVermelho = data.filter((d: any) => d.cor === 'Vermelho').length;
  const qtdPreto = data.filter((d: any) => d.cor === 'Preto').length;
  const qtdBranco = data.filter((d: any) => d.cor === 'Branco').length;

  const pctVermelho = ((qtdVermelho / total) * 100).toFixed(1);
  const pctPreto = ((qtdPreto / total) * 100).toFixed(1);
  const pctBranco = ((qtdBranco / total) * 100).toFixed(1);

  const app = document.querySelector<HTMLDivElement>('#app')!;

  // Interface Visual
  app.innerHTML = `
    <div style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: auto;">
      <h2>📊 Double Analytics - Visão em Tempo Real</h2>

      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <div style="flex: 1; background: #ffebee; padding: 15px; border-radius: 8px; text-align: center; border-bottom: 4px solid red;">
          <h3 style="margin: 0 0 10px 0; color: #d32f2f;">🔴 Vermelho</h3>
          <p style="font-size: 28px; font-weight: bold; margin: 0;">${pctVermelho}%</p>
          <small style="color: #666;">Teórico: 46.6%</small>
        </div>
        
        <div style="flex: 1; background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; border-bottom: 4px solid black;">
          <h3 style="margin: 0 0 10px 0; color: #212121;">⚫ Preto</h3>
          <p style="font-size: 28px; font-weight: bold; margin: 0;">${pctPreto}%</p>
          <small style="color: #666;">Teórico: 46.6%</small>
        </div>

        <div style="flex: 1; background: #ffffff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; border-bottom: 4px solid gray;">
          <h3 style="margin: 0 0 10px 0; color: #757575;">⚪ Branco</h3>
          <p style="font-size: 28px; font-weight: bold; margin: 0;">${pctBranco}%</p>
          <small style="color: #666;">Teórico: 6.6%</small>
        </div>
      </div>

      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #2196f3;">
        <h3 style="margin-top: 0; color: #0d47a1;">🔥 Radar de Tendência (Maré)</h3>
        <p style="margin: 5px 0;">Cor dominante: <strong>${tendencia.cor}</strong> (${tendencia.streak}x seguidas)</p>
        <p style="margin: 5px 0;">Último Branco: <strong>${tendencia.distanciaBranco}</strong></p>
      </div>

      <h3>Últimas ${total} Jogadas <small style="font-weight: normal; color: #666;">(Passe o mouse nas bolas para ver a hora)</small></h3>
      <div style="display: flex; gap: 5px; flex-wrap: wrap; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
        ${data.map((d: any) => `
          <div class="bola ${d.cor}" title="Data: ${new Date(d.criado_em).toLocaleDateString('pt-BR')} às ${new Date(d.criado_em).toLocaleTimeString('pt-BR')}">
            ${d.cor[0]}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 4. O Motor (Simulação com as probabilidades reais da Blaze)
setInterval(() => {
  const n = Math.random() * 100;
  let sorteio = '';

  if (n <= 6.67) {
    sorteio = 'Branco';
  } else if (n <= 53.33) {
    sorteio = 'Vermelho';
  } else {
    sorteio = 'Preto';
  }
  
  registrarJogada(sorteio);
}, 5000);

// Inicia a primeira renderização
renderDashboard();