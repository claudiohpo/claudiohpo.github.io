// CONFIG: coloque aqui a URL do seu backend (sem barra no final)
const BACKEND_URL = "claudiohpo-github-8dcscm5hl-claudio-henriques-projects-f25502a5.vercel.app"; // exemplo: https://meuapp.vercel.app

const form = document.getElementById('kmForm');
const msg = document.getElementById('msg');
const downloadBtn = document.getElementById('downloadCsv');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = "";

  const data = document.getElementById('data').value;
  const chamado = document.getElementById('chamado').value.trim();
  const local = document.getElementById('local').value.trim();
  const kmSaida = Number(document.getElementById('kmSaida').value);
  const kmChegada = Number(document.getElementById('kmChegada').value);
  const observacoes = document.getElementById('observacoes').value.trim();

  // validação básica
  if (!data || !local || isNaN(kmSaida) || isNaN(kmChegada)) {
    msg.style.color = 'red';
    msg.textContent = 'Preencha os campos obrigatórios corretamente.';
    return;
  }
  if (kmChegada < kmSaida) {
    msg.style.color = 'red';
    msg.textContent = 'KM chegada não pode ser menor que KM saída.';
    return;
  }

  const payload = {
    data, chamado, local, kmSaida, kmChegada, observacoes,
    criadoEm: new Date().toISOString()
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/km`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const body = await res.json();
    msg.style.color = 'green';
    msg.textContent = 'Registro salvo com sucesso.';
    form.reset();
  } catch (err) {
    console.error(err);
    msg.style.color = 'orange';
    msg.textContent = 'Falha ao salvar. Registro salvo localmente no navegador.';
    // fallback: salvar no localStorage para sincronizar depois
    const pending = JSON.parse(localStorage.getItem('km_pending') || '[]');
    pending.push(payload);
    localStorage.setItem('km_pending', JSON.stringify(pending));
  }
});

// botão para baixar CSV via backend OR montar CSV local
downloadBtn.addEventListener('click', async () => {
  try {
    // tenta baixar CSV do backend
    const res = await fetch(`${BACKEND_URL}/api/report?format=csv`);
    if (!res.ok) throw new Error();
    const csv = await res.text();
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio_km.csv';
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    // fallback: gerar CSV do localStorage
    const stored = JSON.parse(localStorage.getItem('km_pending') || '[]');
    if (stored.length === 0) {
      alert('Nenhum dado disponível para relatório local.');
      return;
    }
    const header = ['data','chamado','local','kmSaida','kmChegada','observacoes','criadoEm'];
    const rows = stored.map(r => header.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio_km_local.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
});
