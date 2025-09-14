// js/main.js
// Versão otimizada: carrega logo, preserva proporção e gera versões otimizadas (JPEG) antes de embutir no PDF.
// Coloque este arquivo em: js/main.js

(function () {
  // SHORTCUTS
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ELEMENTOS
  const btnAdd = $("#btnAdd");
  const btnAddFull = $("#btnAddFull");
  const btnClearSig = $("#btnClearSig");
  const btnGeneratePdf = $("#btnGeneratePdf");

  const codigoInput = $("#codigoPeca");
  const serialInput = $("#serialProxxi");
  const notaInput = $("#notaFiscal");
  const inputCompleto = $("#inputCompleto");
  const serialTableBody = $("#serialTable tbody");

  const canvas = $("#signatureCanvas");
  const ctx = canvas.getContext("2d");

  // Ajusta canvas para alta densidade de pixels (melhor qualidade na tela)
  function fixCanvasDPI() {
    // canvas client size (CSS px)
    const w = canvas.clientWidth || 600;
    const h = canvas.clientHeight || 300;
    const ratio = window.devicePixelRatio || 1;

    // redimensiona canvas real (pixels)
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);

    // preserva o tamanho CSS
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    // reset transform e aplicar escala para desenhar em CSS coordenadas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
  }

  // inicializa tamanho do canvas
  fixCanvasDPI();

  // Reajusta ao redimensionar a janela (salva e restaura conteúdo)
  window.addEventListener("resize", () => {
    const data = canvas.toDataURL();
    fixCanvasDPI();
    const img = new Image();
    img.onload = () => {
      // desenha ajustando ao tamanho CSS atual
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
    };
    img.src = data;
  });

  // Desenho (mouse + touch)
  let drawing = false;

  function getPos(evt) {
    const rect = canvas.getBoundingClientRect();
    if (evt.touches && evt.touches.length) {
      return {
        x: evt.touches[0].clientX - rect.left,
        y: evt.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top,
      };
    }
  }

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    e.preventDefault();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    e.preventDefault();
  });

  canvas.addEventListener("mouseup", () => {
    drawing = false;
    ctx.closePath();
  });

  canvas.addEventListener("mouseout", () => {
    drawing = false;
    ctx.closePath();
  });

  // touch
  canvas.addEventListener(
    "touchstart",
    (e) => {
      drawing = true;
      const p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      e.preventDefault();
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!drawing) return;
      const p = getPos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      e.preventDefault();
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", () => {
    drawing = false;
    ctx.closePath();
  });

  // Limpar assinatura
  function limparAssinatura() {
    // limpar no sistema de pixels atual (incl. DPI)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // readjust scale
    const ratio = window.devicePixelRatio || 1;
    ctx.scale(ratio, ratio);
  }

  btnClearSig.addEventListener("click", limparAssinatura);

  // Adiciona uma linha simples
  function addRow() {
    if (!codigoInput.value.trim() || !serialInput.value.trim()) {
      alert("Preencha Código e Número de Série (Nota Fiscal é opcional).");
      return;
    }

    const tr = document.createElement("tr");
    const tdCodigo = document.createElement("td");
    const tdSerial = document.createElement("td");
    const tdNota = document.createElement("td");
    const tdActions = document.createElement("td");

    tdCodigo.textContent = codigoInput.value.trim();
    tdSerial.textContent = serialInput.value.trim();
    tdNota.textContent = notaInput.value.trim();

    // botões
    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.textContent = "Editar";
    btnEdit.addEventListener("click", () => editarLinha(tr));

    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.textContent = "Excluir";
    btnDelete.addEventListener("click", () => excluirLinha(tr));

    tdActions.appendChild(btnEdit);
    tdActions.appendChild(btnDelete);

    tr.appendChild(tdCodigo);
    tr.appendChild(tdSerial);
    tr.appendChild(tdNota);
    tr.appendChild(tdActions);

    serialTableBody.appendChild(tr);

    codigoInput.value = "";
    serialInput.value = "";
    notaInput.value = "";
  }

  function addRowFull() {
    const raw = inputCompleto.value.trim();
    if (!raw) return;
    const valores = raw
      .split(/[, .]+/)
      .map((v) => v.trim())
      .filter(Boolean);

    if (valores.length % 3 !== 0) {
      alert(
        "Por favor, insira valores em múltiplos de 3: Código, Serial, Nota Fiscal."
      );
      return;
    }

    for (let i = 0; i < valores.length; i += 3) {
      const tr = document.createElement("tr");
      const tdCodigo = document.createElement("td");
      const tdSerial = document.createElement("td");
      const tdNota = document.createElement("td");
      const tdActions = document.createElement("td");

      tdCodigo.textContent = valores[i];
      tdSerial.textContent = valores[i + 1] || "";
      tdNota.textContent = valores[i + 2] || "";

      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.textContent = "Editar";
      btnEdit.addEventListener("click", () => editarLinha(tr));

      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.textContent = "Excluir";
      btnDelete.addEventListener("click", () => excluirLinha(tr));

      tdActions.appendChild(btnEdit);
      tdActions.appendChild(btnDelete);

      tr.appendChild(tdCodigo);
      tr.appendChild(tdSerial);
      tr.appendChild(tdNota);
      tr.appendChild(tdActions);

      serialTableBody.appendChild(tr);
    }

    inputCompleto.value = "";
  }

  function editarLinha(tr) {
    const tds = tr.querySelectorAll("td");
    if (tds.length >= 3) {
      $("#codigoPeca").value = tds[0].textContent;
      $("#serialProxxi").value = tds[1].textContent;
      $("#notaFiscal").value = tds[2].textContent;
      tr.remove();
    }
  }

  function excluirLinha(tr) {
    tr.remove();
  }

  btnAdd.addEventListener("click", addRow);
  btnAddFull.addEventListener("click", addRowFull);

  // ----------------- PRELOAD LOGO (com aspect ratio e otimização) -----------------
  // Ajuste o caminho se necessário (relativo ao index.html)
  const logoPath = "assets/images/logosmall2.png";
  let PRELOADED_LOGO_DATAURL = null; // original dataURL do arquivo
  let PRELOADED_LOGO_ASPECT = null; // largura / altura
  let PRELOADED_LOGO_OPTIMIZED = null; // dataURL otimizada (JPEG) pronta para o PDF

  // util: converte blob -> dataURL
  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // util: otimiza um dataURL (img) para JPEG com largura máxima
  function optimizeDataUrl(dataUrl, maxWidthPx, mime = "image/jpeg", quality = 0.8) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const aspect = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
        const targetW = Math.min(maxWidthPx, img.naturalWidth || img.width);
        const targetH = Math.round(targetW / aspect) || 1;
        const c = document.createElement("canvas");
        c.width = targetW;
        c.height = targetH;
        const cctx = c.getContext("2d");
        // fundo branco pra evitar problemas com JPEG
        cctx.fillStyle = "#ffffff";
        cctx.fillRect(0, 0, c.width, c.height);
        cctx.drawImage(img, 0, 0, c.width, c.height);
        try {
          const out = c.toDataURL(mime, quality);
          resolve({ dataUrl: out, width: targetW, height: targetH, aspect });
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (e) => reject(e);
      img.src = dataUrl;
    });
  }

  // util: otimiza um canvas existente (assinatura) para JPEG com largura máxima
  function optimizeCanvasToDataUrl(srcCanvas, maxWidthPx, mime = "image/jpeg", quality = 0.9) {
    const sw = srcCanvas.width;
    const sh = srcCanvas.height;
    const aspect = sw / sh || 1;
    const targetW = Math.min(maxWidthPx, sw);
    const targetH = Math.round(targetW / aspect) || 1;
    const c = document.createElement("canvas");
    c.width = targetW;
    c.height = targetH;
    const cctx = c.getContext("2d");
    // white background for JPEG
    cctx.fillStyle = "#ffffff";
    cctx.fillRect(0, 0, c.width, c.height);
    // draw original canvas scaled down
    cctx.drawImage(srcCanvas, 0, 0, c.width, c.height);
    return c.toDataURL(mime, quality);
  }

  async function preloadLogo() {
    console.info("[logo] preload start ->", logoPath);
    try {
      const res = await fetch(logoPath, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const blob = await res.blob();
      // converte para dataURL
      const dataUrl = await blobToDataURL(blob);
      PRELOADED_LOGO_DATAURL = dataUrl;

      // pega dimensões via Image
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataUrl;
      });
      PRELOADED_LOGO_ASPECT = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
      console.info("[logo] carregada (original) aspect:", PRELOADED_LOGO_ASPECT);

      // agora otimiza: reduz largura para algo razoável (ex: 600px) e gera JPEG com qualidade
      try {
        const maxWidthPx = 600; // ajuste aqui se quiser mais/menos pixels
        const optimized = await optimizeDataUrl(PRELOADED_LOGO_DATAURL, maxWidthPx, "image/jpeg", 0.8);
        PRELOADED_LOGO_OPTIMIZED = optimized.dataUrl;
        console.info("[logo] otimizada ->", optimized.width + "x" + optimized.height, "chars:", PRELOADED_LOGO_OPTIMIZED.length);
      } catch (optErr) {
        console.warn("[logo] otimização falhou, usando original:", optErr);
        PRELOADED_LOGO_OPTIMIZED = PRELOADED_LOGO_DATAURL;
      }

      return;
    } catch (err) {
      console.warn("[logo] fetch falhou:", err);
    }

    // fallback por <img> direto (pode taintar se CORS bloquear)
    try {
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const c = document.createElement("canvas");
            c.width = img.naturalWidth || img.width;
            c.height = img.naturalHeight || img.height;
            const cctx = c.getContext("2d");
            cctx.drawImage(img, 0, 0);
            PRELOADED_LOGO_DATAURL = c.toDataURL("image/png");
            PRELOADED_LOGO_ASPECT = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
            resolve();
          } catch (errCanvas) {
            reject(errCanvas);
          }
        };
        img.onerror = (e) => reject(new Error("Imagem fallback erro: " + e));
        img.src = logoPath + "?cb=" + Date.now();
      });

      // otimiza
      try {
        const maxWidthPx = 600;
        const optimized = await optimizeDataUrl(PRELOADED_LOGO_DATAURL, maxWidthPx, "image/jpeg", 0.8);
        PRELOADED_LOGO_OPTIMIZED = optimized.dataUrl;
        console.info("[logo] fallback otimizada ->", optimized.width + "x" + optimized.height);
      } catch (optErr) {
        PRELOADED_LOGO_OPTIMIZED = PRELOADED_LOGO_DATAURL;
      }

      return;
    } catch (err2) {
      console.warn("[logo] fallback <img> falhou:", err2);
    }

    console.warn("[logo] não foi possível carregar o logo — PDF será gerado sem logo.");
  }

  preloadLogo().catch((e) => console.error("[logo] preload erro:", e));

  // Função que tenta múltiplas estratégias (mantida por compatibilidade)
  async function getLogoDataURL(url) {
    // tenta usar já otimizado se disponível
    if (PRELOADED_LOGO_OPTIMIZED) return PRELOADED_LOGO_OPTIMIZED;
    // senão tenta carregar agora (sincrono)
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const blob = await res.blob();
      const dataUrl = await blobToDataURL(blob);
      // otimiza
      const maxWidthPx = 600;
      const opt = await optimizeDataUrl(dataUrl, maxWidthPx, "image/jpeg", 0.8);
      return opt.dataUrl;
    } catch (err) {
      console.warn("getLogoDataURL fetch falhou:", err);
    }

    // fallback image->canvas
    try {
      const img = new Image();
      img.src = url;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });
      const c = document.createElement("canvas");
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      const dataUrl = c.toDataURL("image/png");
      const opt = await optimizeDataUrl(dataUrl, 600, "image/jpeg", 0.8);
      return opt.dataUrl;
    } catch (err2) {
      console.warn("getLogoDataURL fallback image falhou:", err2);
    }

    return null;
  }

  // Extrai MIME (ex: 'PNG' ou 'JPEG') a partir de dataURL
  function getImageFormatFromDataUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== "string") return "PNG";
    const m = dataUrl.match(/^data:image\/(png|jpeg|jpg);/i);
    if (!m) return "PNG";
    const mime = m[1].toLowerCase();
    if (mime === "jpeg" || mime === "jpg") return "JPEG";
    return "PNG";
  }

  // ---------- GERA PDF ----------
  btnGeneratePdf.addEventListener("click", async function gerarPDF() {
    try {
      // usa a versão otimizada pronta (se houver), senão tenta carregar/otimizar agora
      let logoDataUrl = PRELOADED_LOGO_OPTIMIZED || null;
      if (!logoDataUrl && PRELOADED_LOGO_DATAURL) {
        // tenta otimizar a original (segurança)
        try {
          const opt = await optimizeDataUrl(PRELOADED_LOGO_DATAURL, 600, "image/jpeg", 0.8);
          logoDataUrl = opt.dataUrl;
          PRELOADED_LOGO_OPTIMIZED = logoDataUrl;
        } catch (e) {
          console.warn("Erro ao otimizar PRELOADED_LOGO_DATAURL no momento do PDF:", e);
          logoDataUrl = PRELOADED_LOGO_DATAURL;
        }
      }
      if (!logoDataUrl) {
        // última tentativa síncrona
        try {
          logoDataUrl = await getLogoDataURL(logoPath);
        } catch (e) {
          console.warn("Tentativa final de carregar logo falhou:", e);
          logoDataUrl = null;
        }
      }

      // usa jsPDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const maxRowsPerPage = 20;
      const tableColumnNames = ["Código", "Número de Série", "Nota Fiscal"];
      const tableData = [];

      const rows = serialTableBody.rows;
      for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].cells;
        const rowData = [
          cells[0] ? cells[0].textContent : "",
          cells[1] ? cells[1].textContent : "",
          cells[2] ? cells[2].textContent : "",
        ];
        tableData.push(rowData);
      }

      // obtém dados do form
      const formElement = $("#deliveryForm");
      const formData = new FormData(formElement);
      const formDataObject = {};
      formData.forEach((value, key) => (formDataObject[key] = value));

      // data formatada
      let dataFormatadaPDF = "";
      let dataFormatada = "";
      if (formDataObject.data) {
        const parts = formDataObject.data.split("-"); // YYYY-MM-DD
        if (parts.length === 3) {
          dataFormatadaPDF = `${parts[2]}-${parts[1]}-${parts[0]}`;
          const dt = new Date(parts[0], parts[1] - 1, parts[2]);
          dataFormatada = dt.toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        }
      }
      if (!dataFormatada) {
        const now = new Date();
        dataFormatada = now.toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        dataFormatadaPDF = `${String(now.getDate()).padStart(2, "0")}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-${now.getFullYear()}`;
      }

      // função para adicionar cabeçalho e rodapé (usa PRELOADED_LOGO_OPTIMIZED se disponível)
      function addHeaderAndFooter(pageNumber) {
        // Define largura máxima do logo no PDF (em mm).
        const logoMaxWidthMm = 40; // largura máxima em mm
        if (logoDataUrl) {
          try {
            const fmt = getImageFormatFromDataUrl(logoDataUrl); // 'JPEG' ou 'PNG'
            // converter mm->posição correta: jsPDF usa mm, passamos width/height em mm
            // preservando proporção: calculamos height a partir da proporção original PRELOADED_LOGO_ASPECT
            let logoWidth = logoMaxWidthMm;
            let logoHeight = logoWidth / (PRELOADED_LOGO_ASPECT || 1);
            // posicione no canto superior direito (x, y)
            const pageWidth = doc.internal.pageSize.getWidth();
            const x = pageWidth - 15 - logoWidth; // margem 15mm
            const y = 8;
            doc.addImage(logoDataUrl, fmt, x, y, logoWidth, logoHeight);
          } catch (e) {
            console.warn("Erro ao adicionar logo no PDF:", e);
          }
        }

        doc.setFontSize(20);
        doc.setFont(undefined, "bold");
        doc.text("Formulário de Entrega de Peças", 105, 30, { align: "center" });

        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.text("Data:", 20, 44);
        doc.setFont(undefined, "normal");
        doc.text(dataFormatada, 33, 44);

        doc.setFont(undefined, "bold");
        doc.text("Nome do Recebedor:", 20, 54);
        doc.setFont(undefined, "normal");
        doc.text(formDataObject.nomeRecebedor || "", 64, 54);

        doc.setFont(undefined, "bold");
        doc.text("Nome Técnico:", 20, 64);
        doc.setFont(undefined, "normal");
        doc.text(formDataObject.nomeTecnico || "", 52, 64);

        // rodapé
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.text(`Página ${pageNumber}`, 105, 290, { align: "center" });
      }

      // gera tabelas paginadas
      let currentPage = 1;
      let startY = 75;

      // se não houver linhas, ainda queremos um cabeçalho
      if (tableData.length === 0) {
        addHeaderAndFooter(currentPage);
      }

      for (let i = 0; i < tableData.length; i += maxRowsPerPage) {
        if (i !== 0) {
          doc.addPage();
          currentPage++;
        }
        addHeaderAndFooter(currentPage);
        doc.autoTable({
          head: [tableColumnNames],
          body: tableData.slice(i, i + maxRowsPerPage),
          startY: startY,
          styles: { fontSize: 10 },
        });
      }

      // lugar pra assinatura
      let finalY = 0;
      if (
        doc.autoTable &&
        doc.autoTable.previous &&
        typeof doc.autoTable.previous.finalY === "number"
      ) {
        finalY = doc.autoTable.previous.finalY + 10;
      } else {
        finalY = 80;
      }

      // assinatura: pega dataURL do canvas (assinatura) e otimiza (reduz resolução e comprime)
      try {
        // usa otimização para evitar embutir milhões de pixels
        // escolhe largura em px para assinatura (ex: 600px) — diminuirá peso drasticamente
        const assinaturaOptimized = optimizeCanvasToDataUrl(canvas, 600, "image/jpeg", 0.9);
        const fmtSig = getImageFormatFromDataUrl(assinaturaOptimized);
        // define tamanho em mm (aprox)
        const sigWidthMm = 60; // ajuste conforme prefere (em mm)
        const sigHeightMm = 30; // ajuste conforme prefere (em mm)
        doc.addImage(assinaturaOptimized, fmtSig, 15, finalY, sigWidthMm, sigHeightMm);
        doc.line(15, finalY + 35, 100, finalY + 35);
        doc.text(formDataObject.nomeRecebedor || "", 20, finalY + 39);
      } catch (e) {
        console.warn("Erro ao adicionar assinatura no PDF:", e);
      }

      // salvar
      const fileName = `form_entrega_pecas_${dataFormatadaPDF || "sem_data"}.pdf`;
      doc.save(fileName);

      // dica de sucesso
      console.info("PDF gerado:", fileName);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Ocorreu um erro ao gerar o PDF. Veja o console para detalhes.");
    }
  });

  // Se quiser, pode adicionar funções que mostram a câmera e usam Quagga.
  window.iniciarLeituraCodigo = function (idInput) {
    console.warn("iniciarLeituraCodigo(): implemente Quagga ou biblioteca de leitura de código se desejar.");
  };
})();
