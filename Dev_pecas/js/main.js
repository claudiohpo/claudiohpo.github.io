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
  if (!canvas) {
    console.error("Canvas de assinatura não encontrado (id='signatureCanvas').");
    return;
  }
  const ctx = canvas.getContext("2d");

  // obtém contêiner pontilhado (.signature-wrap) — usado para calcular tamanho real
  const sigWrap = canvas.closest(".signature-wrap") || canvas.parentElement;

  // ---------- MANIPULAÇÃO DO CANVAS (DPI / REDIMENSIONAMENTO PRESERVANDO CONTEÚDO) ----------
  function fixCanvasDPI() {
    if (!canvas || !ctx || !sigWrap) return;

    // mede o tamanho disponível no contêiner (CSS pixels)
    const rect = sigWrap.getBoundingClientRect();
    const w = Math.max(100, Math.floor(rect.width));
    const h = Math.max(80, Math.floor(rect.height));
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    // tenta salvar o conteúdo atual (se possível)
    let prevData = null;
    try {
      prevData = canvas.toDataURL();
    } catch (err) {
      prevData = null;
    }

    // define tamanho em pixels reais (device pixels)
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);

    // define tamanho CSS para manter layout (em px)
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    // reset transform e aplicar escala para desenhar em coordenadas CSS
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);

    // definições de desenho (em CSS px)
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    // restaurar desenho anterior, escalando para as dimensões CSS atuais
    if (prevData) {
      const img = new Image();
      img.onload = () => {
        try {
          // desenha a imagem no canvas escalada para as dimensões CSS (w x h)
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.scale(ratio, ratio);
          ctx.drawImage(img, 0, 0, w, h);
        } catch (err) {
          // pode falhar por CORS; apenas logamos
          console.warn("Não foi possível restaurar desenho do canvas (possível CORS):", err);
        }
      };
      img.src = prevData;
    } else {
      // sem desenho anterior: limpa
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(ratio, ratio);
    }
  }

  // chama no load (assegura que a árvore DOM e estilos já estejam aplicados)
  window.addEventListener("load", fixCanvasDPI);

  // listeners de resize / orientationchange (debounced)
  let _resizeSigTimeout = null;
  window.addEventListener("resize", () => {
    clearTimeout(_resizeSigTimeout);
    _resizeSigTimeout = setTimeout(() => {
      fixCanvasDPI();
    }, 120);
  });

  window.addEventListener("orientationchange", () => {
    // pequeno delay para o layout se estabilizar após rotação
    setTimeout(fixCanvasDPI, 140);
  });

  // ResizeObserver para detectar mudanças no .signature-wrap (adicionar/remover linhas, teclado, etc.)
  if (window.ResizeObserver && sigWrap) {
    try {
      const ro = new ResizeObserver(() => {
        fixCanvasDPI();
      });
      ro.observe(sigWrap);
    } catch (e) {
      // se algo falhar, fallback para resize/orientationchange já cobre
      console.warn("ResizeObserver não pôde ser inicializado:", e);
    }
  }

  // ---------- DESENHO (mouse + touch) ----------
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

  // eventos do mouse
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

  ["mouseup", "mouseleave"].forEach((ev) => {
    canvas.addEventListener(ev, () => {
      if (!drawing) return;
      drawing = false;
      try {
        ctx.closePath();
      } catch (e) {}
    });
  });

  // eventos touch (passive: false para permitir preventDefault)
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

  ["touchend", "touchcancel"].forEach((ev) =>
    canvas.addEventListener(ev, () => {
      drawing = false;
      try {
        ctx.closePath();
      } catch (e) {}
    })
  );

  // Limpar assinatura (limpa corretamente nos pixels reais)
  function limparAssinatura() {
    // reset transform para limpar no espaço de pixels reais
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // re-aplica escala para continuar desenhando normalmente
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    ctx.scale(ratio, ratio);
  }

  btnClearSig.addEventListener("click", limparAssinatura);

  // ---------- MANIPULAÇÃO DA TABELA (linhas dinâmicas) ----------
  const HEADER_CODIGO = "Código";
  const HEADER_SERIAL = "Número de Série";
  const HEADER_NOTA = "Nota Fiscal";
  const HEADER_ACOES = "Ações";

  function makeActionButton(text, cls, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = text;
    b.addEventListener("click", onClick);
    return b;
  }

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

    // set data-labels para responsivo mobile
    tdCodigo.setAttribute("data-label", HEADER_CODIGO);
    tdSerial.setAttribute("data-label", HEADER_SERIAL);
    tdNota.setAttribute("data-label", HEADER_NOTA);
    tdActions.setAttribute("data-label", HEADER_ACOES);

    const btnEdit = makeActionButton("Editar", "edit-btn", () => editarLinha(tr));
    const btnDelete = makeActionButton("Excluir", "delete-btn", () => excluirLinha(tr));

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

    // chamar ajuste do canvas (layout mudou)
    fixCanvasDPI();
  }

  function addRowFull() {
    const raw = inputCompleto.value.trim();
    if (!raw) return;

    // split em vírgula, ponto, quebra de linha ou múltiplos espaços
    const valores = raw
      .split(/[,.;\n\r]+|\s{2,}|[ ]+/)
      .map((v) => v.trim())
      .filter(Boolean);

    if (valores.length % 3 !== 0) {
      alert("Por favor, insira valores em múltiplos de 3: Código, Serial, Nota Fiscal.");
      return;
    }

    for (let i = 0; i < valores.length; i += 3) {
      const tr = document.createElement("tr");
      const tdCodigo = document.createElement("td");
      const tdSerial = document.createElement("td");
      const tdNota = document.createElement("td");
      const tdActions = document.createElement("td");

      tdCodigo.textContent = valores[i] || "";
      tdSerial.textContent = valores[i + 1] || "";
      tdNota.textContent = valores[i + 2] || "";

      tdCodigo.setAttribute("data-label", HEADER_CODIGO);
      tdSerial.setAttribute("data-label", HEADER_SERIAL);
      tdNota.setAttribute("data-label", HEADER_NOTA);
      tdActions.setAttribute("data-label", HEADER_ACOES);

      const btnEdit = makeActionButton("Editar", "edit-btn", () => editarLinha(tr));
      const btnDelete = makeActionButton("Excluir", "delete-btn", () => excluirLinha(tr));

      tdActions.appendChild(btnEdit);
      tdActions.appendChild(btnDelete);

      tr.appendChild(tdCodigo);
      tr.appendChild(tdSerial);
      tr.appendChild(tdNota);
      tr.appendChild(tdActions);

      serialTableBody.appendChild(tr);
    }

    inputCompleto.value = "";

    // layout mudou: ajusta canvas
    fixCanvasDPI();
  }

  function editarLinha(tr) {
    const tds = tr.querySelectorAll("td");
    if (tds.length >= 3) {
      $("#codigoPeca").value = tds[0].textContent;
      $("#serialProxxi").value = tds[1].textContent;
      $("#notaFiscal").value = tds[2].textContent;
      tr.remove();
      codigoInput.focus();

      // ajuste de layout
      fixCanvasDPI();
    }
  }

  function excluirLinha(tr) {
    tr.remove();
    // ajuste de layout
    fixCanvasDPI();
  }

  btnAdd.addEventListener("click", addRow);
  btnAddFull.addEventListener("click", addRowFull);

  // ---------- PRELOAD LOGO (com aspect ratio e otimização) ----------
  const logoPath = "assets/images/logosmall2.png";
  let PRELOADED_LOGO_DATAURL = null;
  let PRELOADED_LOGO_ASPECT = null;
  let PRELOADED_LOGO_OPTIMIZED = null;

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

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
    cctx.fillStyle = "#ffffff";
    cctx.fillRect(0, 0, c.width, c.height);
    cctx.drawImage(srcCanvas, 0, 0, c.width, c.height);
    return c.toDataURL(mime, quality);
  }

  async function preloadLogo() {
    try {
      const res = await fetch(logoPath, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const blob = await res.blob();
      const dataUrl = await blobToDataURL(blob);
      PRELOADED_LOGO_DATAURL = dataUrl;

      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataUrl;
      });
      PRELOADED_LOGO_ASPECT = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);

      try {
        const maxWidthPx = 600;
        const optimized = await optimizeDataUrl(PRELOADED_LOGO_DATAURL, maxWidthPx, "image/jpeg", 0.8);
        PRELOADED_LOGO_OPTIMIZED = optimized.dataUrl;
      } catch (optErr) {
        PRELOADED_LOGO_OPTIMIZED = PRELOADED_LOGO_DATAURL;
      }
    } catch (err) {
      console.warn("[logo] preload falhou:", err);
      PRELOADED_LOGO_DATAURL = null;
      PRELOADED_LOGO_OPTIMIZED = null;
    }
  }

  preloadLogo().catch((e) => console.error("[logo] preload erro:", e));

  async function getLogoDataURL(url) {
    if (PRELOADED_LOGO_OPTIMIZED) return PRELOADED_LOGO_OPTIMIZED;
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const blob = await res.blob();
      const dataUrl = await blobToDataURL(blob);
      const opt = await optimizeDataUrl(dataUrl, 600, "image/jpeg", 0.8);
      return opt.dataUrl;
    } catch (err) {
      console.warn("getLogoDataURL fetch falhou:", err);
    }

    // fallback
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
      let logoDataUrl = PRELOADED_LOGO_OPTIMIZED || null;
      if (!logoDataUrl && PRELOADED_LOGO_DATAURL) {
        try {
          const opt = await optimizeDataUrl(PRELOADED_LOGO_DATAURL, 600, "image/jpeg", 0.8);
          logoDataUrl = opt.dataUrl;
          PRELOADED_LOGO_OPTIMIZED = logoDataUrl;
        } catch (e) {
          logoDataUrl = PRELOADED_LOGO_DATAURL;
        }
      }
      if (!logoDataUrl) {
        try {
          logoDataUrl = await getLogoDataURL(logoPath);
        } catch (e) {
          logoDataUrl = null;
        }
      }

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

      const formElement = $("#deliveryForm");
      const formData = new FormData(formElement);
      const formDataObject = {};
      formData.forEach((value, key) => (formDataObject[key] = value));

      // data formatada
      let dataFormatadaPDF = "";
      let dataFormatada = "";
      if (formDataObject.data) {
        const parts = formDataObject.data.split("-");
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

      function addHeaderAndFooter(pageNumber) {
        const logoMaxWidthMm = 40;
        if (logoDataUrl) {
          try {
            const fmt = getImageFormatFromDataUrl(logoDataUrl);
            let logoWidth = logoMaxWidthMm;
            let logoHeight = logoWidth / (PRELOADED_LOGO_ASPECT || 1);
            const pageWidth = doc.internal.pageSize.getWidth();
            const x = pageWidth - 15 - logoWidth;
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

        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.text(`Página ${pageNumber}`, 105, 290, { align: "center" });
      }

      let currentPage = 1;
      let startY = 75;

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

      // assinatura: otimizar canvas antes de embutir
      try {
        const assinaturaOptimized = optimizeCanvasToDataUrl(canvas, 600, "image/jpeg", 0.9);
        const fmtSig = getImageFormatFromDataUrl(assinaturaOptimized);
        const sigWidthMm = 60;
        const sigHeightMm = 30;
        doc.addImage(assinaturaOptimized, fmtSig, 15, finalY, sigWidthMm, sigHeightMm);
        doc.line(15, finalY + 35, 100, finalY + 35);
        doc.text(formDataObject.nomeRecebedor || "", 20, finalY + 39);
      } catch (e) {
        console.warn("Erro ao adicionar assinatura no PDF:", e);
      }

      const fileName = `form_entrega_pecas_${dataFormatadaPDF || "sem_data"}.pdf`;
      doc.save(fileName);
      console.info("PDF gerado:", fileName);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Ocorreu um erro ao gerar o PDF. Veja o console para detalhes.");
    }
  });

  // ----------------- Quagga / Câmera -----------------
  let cameraActive = false;
  let currentTarget = null;

  const cameraPreview = document.createElement("div");
  cameraPreview.className = "camera-preview";
  cameraPreview.style.display = "none";
  cameraPreview.innerHTML = `
    <video id="cameraVideo" autoplay playsinline></video>
    <button type="button" class="close-camera">X</button>
  `;
  document.body.appendChild(cameraPreview);

  function startCamera(targetId) {
    if (cameraActive) {
      stopCamera();
      return;
    }

    currentTarget = targetId;
    cameraActive = true;
    cameraPreview.style.display = "block";

    if (!window.Quagga) {
      alert("Quagga não está carregado. Importe a biblioteca Quagga.js para usar a câmera.");
      stopCamera();
      return;
    }

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: cameraPreview.querySelector("video"),
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment",
          },
        },
        decoder: {
          readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "upc_reader"],
        },
      },
      function (err) {
        if (err) {
          console.error("Erro ao inicializar Quagga:", err);
          alert("Não foi possível acessar a câmera.");
          stopCamera();
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onDetected(function (result) {
      const code = result && result.codeResult && result.codeResult.code;
      if (code) {
        const el = document.getElementById(targetId);
        if (el) el.value = code;
        stopCamera();
      }
    });
  }

  function stopCamera() {
    try {
      if (window.Quagga && typeof Quagga.stop === "function") Quagga.stop();
    } catch (e) {}
    cameraPreview.style.display = "none";
    cameraActive = false;
    currentTarget = null;
  }

  cameraPreview.querySelector(".close-camera").addEventListener("click", stopCamera);

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".btn-camera").forEach((button) => {
      button.addEventListener("click", function () {
        const target = this.getAttribute("data-target");
        if (target) startCamera(target);
      });
    });
  });

  // expose helper to global if desired
  window.iniciarLeituraCodigo = function (idInput) {
    startCamera(idInput);
  };

  // fim do IIFE
})();
