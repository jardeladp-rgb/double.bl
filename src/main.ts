// 1. Função para calcular a "Maré" (Tendência)
function analisarTendencia(historico: any[]) {
  if (historico.length === 0) return { cor: 'Nenhuma', streak: 0 };

  let streak = 1;
  const ultimaCor = historico[0].cor;

  // Conta quantos seguidos temos da última cor
  for (let i = 1; i < historico.length; i++) {
    if (historico[i].cor === ultimaCor) {
      streak++;
    } else {
      break; // Parou de repetir, achamos a sequência
    }
  }

  return { cor: ultimaCor, streak: streak };
}