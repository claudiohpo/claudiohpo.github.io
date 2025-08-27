const BACKEND_URL = ""; // deixar vazio para usar mesmo domínio (/api/*)

const form = document.getElementById("kmForm");
const msg = document.getElementById("msg");
const btnSalvar = document.getElementById("btnSalvar");

// Função para carregar o último registro e preencher KM Saída
async function carregarUltimoRegistro() {
  try {
    const response = await fetch("/api/km?ultimo=true");
    if (!response.ok) {
      throw new Error("Falha ao carregar último registro");
    }
    const ultimoRegistro = await response.json();

    if (ultimoRegistro && ultimoRegistro.kmChegada) {
      document.getElementById("kmSaida").value = ultimoRegistro.kmChegada;
    }
  } catch (error) {
    console.error("Erro ao carregar último registro:", error);
  }
}

// Carregar último registro do kmChegada para o label kmSaida quando a página for carregada
document.addEventListener("DOMContentLoaded", carregarUltimoRegistro);

btnSalvar.addEventListener("click", async (e) => {
  e.preventDefault();
  msg.textContent = "";

  const data = document.getElementById("data").value;
  const chamado = document.getElementById("chamado").value.trim();
  const local = document.getElementById("local").value.trim();
  const kmSaida = Number(document.getElementById("kmSaida").value);
  const kmChegadaInput = document.getElementById("kmChegada").value;

  if (!data || !local || isNaN(kmSaida)) {
    msg.style.color = "red";
    msg.textContent = "Preencha os campos obrigatórios corretamente.";
    return;
  }

  // Verifica se kmChegada foi preenchido
  if (kmChegadaInput !== "") {
    const kmChegadaNum = Number(kmChegadaInput);

    // Só valida kmChegada se for um número válido
    if (!isNaN(kmChegadaNum) && kmChegadaNum < kmSaida) {
      msg.style.color = "red";
      msg.textContent = "KM chegada não pode ser menor que KM saída.";
      return;
    }
  }

  const observacoes = document.getElementById("observacoes").value.trim();
  const kmChegada = kmChegadaInput === "" ? null : Number(kmChegadaInput);

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

    // Recarregar o último KM para o próximo registro
    await carregarUltimoRegistro();
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

const btnManutencao = document.getElementById("btnManutencao");
if (btnManutencao) {
  btnManutencao.addEventListener("click", () => {
    window.location.href = "manutencao.html";
  });
}