// script.js — atualizado com botão para manutenção
const BACKEND_URL = ""; // deixa vazio para usar mesmo domínio (/api/*)

const form = document.getElementById("kmForm");
const msg = document.getElementById("msg");
// const downloadBtn = document.getElementById("downloadCsv");
const btnSalvar = document.getElementById("btnSalvar");

btnSalvar.addEventListener("click", async (e) => {
  e.preventDefault();
  msg.textContent = "";

  const data = document.getElementById("data").value;
  const chamado = document.getElementById("chamado").value.trim();
  const local = document.getElementById("local").value.trim();
  const kmSaida = Number(document.getElementById("kmSaida").value);
  const kmChegada = Number(document.getElementById("kmChegada").value);
  const observacoes = document.getElementById("observacoes").value.trim();

  if (!data || !local || isNaN(kmSaida)) {
    msg.style.color = "red";
    msg.textContent = "Preencha os campos obrigatórios corretamente.";
    return;
  }
  if (isNaN(kmChegada)) {
    return;
  }else if (kmChegada < kmSaida ) {
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
    const res = await fetch("/api/km", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => null);
      throw new Error(`Erro ${res.status} ${text || ""}`);
    }

    msg.style.color = "green";
    msg.textContent = "Registro salvo com sucesso.";
    form.reset();
  } catch (err) {
    console.error("Erro ao salvar:", err);
    msg.style.color = "orange";
    msg.textContent =
      "Falha ao salvar. Registro salvo localmente no navegador.";
    const pending = JSON.parse(localStorage.getItem("km_pending") || "[]");
    pending.push(payload);
    localStorage.setItem("km_pending", JSON.stringify(pending));
  }
});

// downloadBtn.addEventListener("click", async () => {
//   try {
//     const res = await fetch("/api/report?format=csv");
//     if (!res.ok) throw new Error("Erro ao baixar CSV");
//     const csv = await res.text();
//     const blob = new Blob([csv], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "relatorio_km.csv";
//     a.click();
//     URL.revokeObjectURL(url);
//   } catch (e) {
//     console.warn("Fallback CSV local", e);
//     const stored = JSON.parse(localStorage.getItem("km_pending") || "[]");
//     if (stored.length === 0) {
//       alert("Nenhum dado disponível para relatório local.");
//       return;
//     }
//     const header = [
//       "data",
//       "chamado",
//       "local",
//       "kmSaida",
//       "kmChegada",
//       "observacoes",
//       "criadoEm",
//     ];
//     const rows = stored.map((r) =>
//       header
//         .map((h) => `"${(r[h] || "").toString().replace(/"/g, '""')}"`)
//         .join(",")
//     );
//     const csv = [header.join(","), ...rows].join("\n");
//     const blob = new Blob([csv], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "relatorio_km_local.csv";
//     a.click();
//     URL.revokeObjectURL(url);
//   }
// });

// Novo código para o botão de manutenção
const btnManutencao = document.getElementById("btnManutencao");
if (btnManutencao) {
  btnManutencao.addEventListener("click", () => {
    window.location.href = "manutencao.html";
  });
}