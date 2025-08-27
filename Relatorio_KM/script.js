const BACKEND_URL = "https://claudiohpo-github-io.vercel.app/"; // ex: https://claudio-km.vercel.app

const form = document.getElementById("kmForm");
const msg = document.getElementById("msg");
const downloadBtn = document.getElementById("downloadCsv");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";

  const data = document.getElementById("data").value;
  const chamado = document.getElementById("chamado").value.trim();
  const local = document.getElementById("local").value.trim();
  const kmSaida = Number(document.getElementById("kmSaida").value);
  const kmChegada = Number(document.getElementById("kmChegada").value);
  const observacoes = document.getElementById("observacoes").value.trim();

  if (!data || !local || isNaN(kmSaida) || isNaN(kmChegada)) {
    msg.style.color = "red";
    msg.textContent = "Preencha os campos obrigatórios corretamente.";
    return;
  }
  if (kmChegada < kmSaida) {
    msg.style.color = "red";
    msg.textContent = "KM chegada não pode ser menor que KM saída.";
    return;
  }

  const payload = {
    data,
    chamado,
    local,
    kmSaida,
    kmChegada,
    observacoes,
    criadoEm: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/km`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Erro ${res.status}`);
    msg.style.color = "green";
    msg.textContent = "Registro salvo com sucesso.";
    form.reset();
  } catch (err) {
    console.error(err);
    msg.style.color = "orange";
    msg.textContent =
      "Falha ao salvar. Registro salvo localmente no navegador.";
    const pending = JSON.parse(localStorage.getItem("km_pending") || "[]");
    pending.push(payload);
    localStorage.setItem("km_pending", JSON.stringify(pending));
  }
});

// Download CSV (tenta backend, senão gera local)
downloadBtn.addEventListener("click", async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/report?format=csv`);
    if (!res.ok) throw new Error();
    const csv = await res.text();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio_km.csv";
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    const stored = JSON.parse(localStorage.getItem("km_pending") || "[]");
    if (stored.length === 0) {
      alert("Nenhum dado disponível para relatório local.");
      return;
    }
    const header = [
      "data",
      "chamado",
      "local",
      "kmSaida",
      "kmChegada",
      "observacoes",
      "criadoEm",
    ];
    const rows = stored.map((r) =>
      header
        .map((h) => `"${(r[h] || "").toString().replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio_km_local.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
});
