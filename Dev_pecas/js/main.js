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
    console.error(
      "Canvas de assinatura não encontrado (id='signatureCanvas')."
    );
    return;
  }
  const ctx = canvas.getContext("2d");
  let isInitialized = false;

  /* ------------------------ CANVAS / ASSINATURA ------------------------ */
  function fixCanvasDPI() {
    const computedStyle = getComputedStyle(canvas);
    const cssWidth = parseInt(computedStyle.width) || 600;
    const cssHeight = parseInt(computedStyle.height) || 200;

    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);

    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

/*// === fixCanvasDPI preservando desenho e evitando resizes inúteis ===
let __lastCanvasCssW = 0;
let __lastCanvasCssH = 0;
let __lastDeviceRatio = window.devicePixelRatio || 1;

function fixCanvasDPI() {
  const computedStyle = getComputedStyle(canvas);
  const cssWidth = parseInt(computedStyle.width) || 600;
  const cssHeight = parseInt(computedStyle.height) || 200;
  const ratio = window.devicePixelRatio || 1;

  // Se nada mudou em largura/altura CSS nem ratio -> não faz nada.
  // Importante: frequentemente o teclado móvel muda somente a altura do viewport;
  // se a largura CSS do canvas não mudou, evitamos recriar o canvas (preserva assinatura).
  if (cssWidth === __lastCanvasCssW && cssHeight === __lastCanvasCssH && ratio === __lastDeviceRatio) {
    return;
  }

  // Salva conteúdo atual do canvas (em pixels atuais)
  const prevPixelW = canvas.width;
  const prevPixelH = canvas.height;
  const tmp = document.createElement("canvas");
  tmp.width = prevPixelW || 1;
  tmp.height = prevPixelH || 1;
  const tctx = tmp.getContext("2d");
  try {
    tctx.drawImage(canvas, 0, 0);
  } catch (e) {
    // drawing may fail if canvas empty — ignore
  }

  // Redefine tamanho real (pixels físicos) do canvas
  canvas.width = Math.round(cssWidth * ratio);
  canvas.height = Math.round(cssHeight * ratio);

  // Mantém tamanho CSS para layout
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";

  // Ajusta contexto para usar coordenadas em CSS pixels
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";

  // Restaura o conteúdo anterior, escalando para o novo pixel-size
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // desenha com transform identity
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // redimensiona o conteúdo salvo para caber no novo canvas (mantendo visual)
  try {
    ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, 0, 0, canvas.width, canvas.height);
  } catch (e) {
    // se falhar, não quebra; continue
    console.warn("Restaurando imagem do canvas falhou:", e);
  }
  ctx.restore();

  // grava último estado para comparar na próxima chamada
  __lastCanvasCssW = cssWidth;
  __lastCanvasCssH = cssHeight;
  __lastDeviceRatio = ratio;
}*/

  const handleResize = debounce(() => {
    fixCanvasDPI();
  }, 100);

  window.addEventListener("load", () => {
    fixCanvasDPI();
    window.addEventListener("orientationchange", handleResize);
    window.addEventListener("resize", handleResize);

    const dataInput = document.getElementById("data");
    if (dataInput) {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, "0");
      const dia = String(hoje.getDate()).padStart(2, "0");
      dataInput.value = `${ano}-${mes}-${dia}`;
    }
  });

  // DESENHO
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

  ["mouseup", "mouseleave"].forEach((ev) => {
    canvas.addEventListener(ev, () => {
      if (!drawing) return;
      drawing = false;
      try {
        ctx.closePath();
      } catch (e) {}
    });
  });

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

  ["touchend", "touchcancel"].forEach((ev) => {
    canvas.addEventListener(ev, () => {
      drawing = false;
      try {
        ctx.closePath();
      } catch (e) {}
    });
  });

  function limparAssinatura() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  btnClearSig.addEventListener("click", limparAssinatura);

  /* ------------------------ TABELA DINÂMICA (sem alterações) ------------------------ */
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

    tdCodigo.setAttribute("data-label", HEADER_CODIGO);
    tdSerial.setAttribute("data-label", HEADER_SERIAL);
    tdNota.setAttribute("data-label", HEADER_NOTA);
    tdActions.setAttribute("data-label", HEADER_ACOES);

    const btnEdit = makeActionButton("Editar", "edit-btn", () =>
      editarLinha(tr)
    );
    const btnDelete = makeActionButton("Excluir", "delete-btn", () =>
      excluirLinha(tr)
    );

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
      .split(/[,.;\n\r]+|\s{2,}|[ ]+/)
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

      tdCodigo.textContent = valores[i] || "";
      tdSerial.textContent = valores[i + 1] || "";
      tdNota.textContent = valores[i + 2] || "";

      tdCodigo.setAttribute("data-label", HEADER_CODIGO);
      tdSerial.setAttribute("data-label", HEADER_SERIAL);
      tdNota.setAttribute("data-label", HEADER_NOTA);
      tdActions.setAttribute("data-label", HEADER_ACOES);

      const btnEdit = makeActionButton("Editar", "edit-btn", () =>
        editarLinha(tr)
      );
      const btnDelete = makeActionButton("Excluir", "delete-btn", () =>
        excluirLinha(tr)
      );

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
      codigoInput.focus();
    }
  }

  function excluirLinha(tr) {
    tr.remove();
  }

  btnAdd.addEventListener("click", addRow);
  btnAddFull.addEventListener("click", addRowFull);

  /* ------------------------ PRELOAD LOGO e UTILITÁRIOS ------------------------ */
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

  async function optimizeDataUrl(
    dataUrl,
    maxWidthPx,
    mime = "image/jpeg",
    quality = 0.75
  ) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const aspect =
          (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
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

  function optimizeCanvasToDataUrl(
    srcCanvas,
    maxWidthPx,
    mime = "image/jpeg",
    quality = 0.75
  ) {
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
      PRELOADED_LOGO_ASPECT =
        (img.naturalWidth || img.width) / (img.naturalHeight || img.height);

      try {
        // reduzir largura do logo para 300px por padrão e qualidade 0.75
        const maxWidthPx = 300;
        const optimized = await optimizeDataUrl(
          PRELOADED_LOGO_DATAURL,
          maxWidthPx,
          "image/jpeg",
          0.75
        );
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
      const opt = await optimizeDataUrl(dataUrl, 300, "image/jpeg", 0.75);
      return opt.dataUrl;
    } catch (err) {
      console.warn("getLogoDataURL fetch falhou:", err);
    }

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
      const opt = await optimizeDataUrl(dataUrl, 300, "image/jpeg", 0.75);
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

  /* ------------------------ GERA PDF (ajustes na assinatura e logo) ------------------------ */
  btnGeneratePdf.addEventListener("click", async function gerarPDF() {
    try {
      // prefer optimized preloaded logo
      let logoDataUrl =
        PRELOADED_LOGO_OPTIMIZED || PRELOADED_LOGO_DATAURL || null;
      if (!logoDataUrl && PRELOADED_LOGO_DATAURL) {
        try {
          const opt = await optimizeDataUrl(
            PRELOADED_LOGO_DATAURL,
            300,
            "image/jpeg",
            0.75
          );
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
        doc.text("Formulário de Entrega de Peças", 105, 30, {
          align: "center",
        });

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
      if (tableData.length === 0) addHeaderAndFooter(currentPage);

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

      // ----- ASSINATURA: gerar JPEG otimizado (much smaller que PNG) -----
      try {
        const assinaturaOptimized = optimizeCanvasToDataUrl(
          canvas,
          600,
          "image/jpeg",
          0.6
        );
        const fmtSig = getImageFormatFromDataUrl(assinaturaOptimized);
        const sigWidthMm = 60;
        const sigHeightMm = 30;
        doc.addImage(
          assinaturaOptimized,
          fmtSig,
          15,
          finalY,
          sigWidthMm,
          sigHeightMm
        );

        doc.line(15, finalY + 35, 100, finalY + 35);
        doc.text(formDataObject.nomeRecebedor || "", 20, finalY + 39);
      } catch (e) {
        console.warn("Erro ao adicionar assinatura no PDF:", e);
      }

      const fileName = `form_entrega_pecas_${
        dataFormatadaPDF || "sem_data"
      }.pdf`;
      doc.save(fileName);
      console.info("PDF gerado:", fileName);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Ocorreu um erro ao gerar o PDF. Veja o console para detalhes.");
    }
  });

  /* ------------------------ Leitura por Câmera (BarcodeDetector + fallback Quagga) ------------------------ */

  let cameraActive = false;
  let currentTarget = null;
  let currentStream = null;
  let barcodeDetector = null;
  let rafId = null;
  let quaggaActive = false;

  const cameraModal = document.getElementById("cameraPreviewModal");
  const cameraVideo = document.getElementById("cameraVideo");
  const closeCameraBtn = cameraModal ? cameraModal.querySelector(".close-camera") : null;

  function showCameraModal() {
    if (cameraModal) cameraModal.classList.add("show");
    if (cameraVideo) cameraVideo.setAttribute("aria-hidden", "false");
  }
  function hideCameraModal() {
    if (cameraModal) cameraModal.classList.remove("show");
    if (cameraVideo) cameraVideo.setAttribute("aria-hidden", "true");
  }

  async function startCamera(targetId) {
    // se já estiver ativo, reinicia para novo target
    if (cameraActive) {
      stopCamera();
    }

    currentTarget = targetId;
    cameraActive = true;
    showCameraModal();

    // checar suporte getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Navegador não suporta acesso à câmera.");
      stopCamera();
      return;
    }

    try {
      // solicitar câmera traseira preferencialmente
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      // conectar ao video
      if ("srcObject" in cameraVideo) {
        cameraVideo.srcObject = currentStream;
      } else {
        cameraVideo.src = window.URL.createObjectURL(currentStream);
      }
      await cameraVideo.play();
    } catch (err) {
      console.error("Erro getUserMedia:", err);
      alert("Não foi possível acessar a câmera. Verifique permissões.");
      stopCamera();
      return;
    }

    // Tentar usar BarcodeDetector nativo
    if ("BarcodeDetector" in window) {
      try {
        // formatos comuns suportados
        const formats = [
          "code_128",
          "ean_13",
          "ean_8",
          "code_39",
          "upc_e",
          "upc_a",
          "qr_code",
        ];
        barcodeDetector = new BarcodeDetector({ formats });
      } catch (e) {
        console.warn("Construção BarcodeDetector falhou:", e);
        barcodeDetector = null;
      }
    }

    if (barcodeDetector) {
      // loop de detecção com requestAnimationFrame
      const detectFrame = async () => {
        if (!cameraActive) return;
        try {
          const barcodes = await barcodeDetector.detect(cameraVideo);
          if (barcodes && barcodes.length) {
            const bc = barcodes[0];
            const code = bc.rawValue || bc.rawText || (bc?.rawValue);
            if (code) {
              handleDetected(code);
              return;
            }
          }
        } catch (err) {
          // falha em detectar via API nativa (alguns browsers lançam aqui)
          // console.debug("BarcodeDetector detect erro:", err);
        }
        rafId = requestAnimationFrame(detectFrame);
      };
      rafId = requestAnimationFrame(detectFrame);
      return;
    }

    // Se BarcodeDetector não disponível, fallback para Quagga (se existir)
    if (window.Quagga) {
      try {
        quaggaActive = true;
        // parar Quagga anterior se houver
        if (window.Quagga && typeof window.Quagga.stop === "function") {
          try { window.Quagga.stop(); } catch (e) { /* ignore */ }
        }
        window.Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: cameraVideo, // passar elemento video
              constraints: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            decoder: {
              readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader",
                "upc_reader",
              ],
            },
            locate: true,
          },
          function (err) {
            if (err) {
              console.error("Erro ao inicializar Quagga:", err);
              quaggaActive = false;
              alert("Não foi possível inicializar o leitor de códigos (Quagga).");
              stopCamera();
              return;
            }
            try {
              window.Quagga.start();
            } catch (startErr) {
              console.error("Quagga start erro:", startErr);
              quaggaActive = false;
              stopCamera();
            }
          }
        );

        window.Quagga.onDetected(function (result) {
          if (!result) return;
          const code = result.codeResult && result.codeResult.code;
          if (code) {
            handleDetected(code);
          }
        });
      } catch (e) {
        console.error("Quagga fallback erro:", e);
        quaggaActive = false;
        stopCamera();
      }
      return;
    }

    // Se chegamos aqui, não há mecanismos disponíveis
    alert("Leitura por câmera não disponível neste navegador.");
    stopCamera();
  }

  function handleDetected(code) {
    try {
      const el = document.getElementById(currentTarget);
      if (!el) {
        console.warn("Elemento alvo não encontrado para id:", currentTarget);
        stopCamera();
        return;
      }

      // regra especial: inputCompleto -> se vazio define, se já tiver valor, acrescenta (não substitui)
      if (currentTarget === "inputCompleto" || el.id === "inputCompleto") {
        const existing = el.value ? el.value.trim() : "";
        if (!existing) {
          el.value = code;
        } else {
          // evitar duplicatas exatas (opcional)
          const parts = existing.split(/[,]+/).map(s => s.trim()).filter(Boolean);
          if (!parts.includes(code)) {
            el.value = existing + "," + code;
          }
        }
      } else {
        el.value = code;
      }
    } catch (e) {
      console.error("Erro ao aplicar código detectado:", e);
    } finally {
      stopCamera();
    }
  }

  function stopCamera() {
    cameraActive = false;
    currentTarget = null;

    // limpar RAF
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    // parar BarcodeDetector (não precisa de stop), apenas esconder modal
    hideCameraModal();

    // parar stream tracks
    try {
      if (currentStream && currentStream.getTracks) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {
      console.warn("erro ao parar tracks:", e);
    }
    currentStream = null;

    // parar Quagga se ativo
    try {
      if (window.Quagga && typeof window.Quagga.stop === "function") {
        window.Quagga.stop();
      }
    } catch (e) {
      console.warn("erro ao parar Quagga:", e);
    }
    quaggaActive = false;
  }

  // Fechar ao clicar no botão
  if (closeCameraBtn) {
    closeCameraBtn.addEventListener("click", stopCamera);
  }

  // ligar botão câmera nos campos (event delegation)
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".btn-camera").forEach((button) => {
      button.addEventListener("click", function () {
        const target = this.getAttribute("data-target");
        if (target) startCamera(target);
      });
    });
  });

  window.iniciarLeituraCodigo = function (idInput) {
    startCamera(idInput);
  };

  /* ------------------------ FIM Leitura por Câmera ------------------------ */
})();



// (function () {
//   // SHORTCUTS
//   const $ = (sel) => document.querySelector(sel);
//   const $$ = (sel) => document.querySelectorAll(sel);

//   // ELEMENTOS
//   const btnAdd = $("#btnAdd");
//   const btnAddFull = $("#btnAddFull");
//   const btnClearSig = $("#btnClearSig");
//   const btnGeneratePdf = $("#btnGeneratePdf");

//   const codigoInput = $("#codigoPeca");
//   const serialInput = $("#serialProxxi");
//   const notaInput = $("#notaFiscal");
//   const inputCompleto = $("#inputCompleto");
//   const serialTableBody = $("#serialTable tbody");

//   const canvas = $("#signatureCanvas");
//   if (!canvas) {
//     console.error(
//       "Canvas de assinatura não encontrado (id='signatureCanvas')."
//     );
//     return;
//   }
//   const ctx = canvas.getContext("2d");
//   let isInitialized = false;

//   /* ------------------------ CANVAS / ASSINATURA ------------------------ */
//   function fixCanvasDPI() {
//     const computedStyle = getComputedStyle(canvas);
//     const cssWidth = parseInt(computedStyle.width) || 600;
//     const cssHeight = parseInt(computedStyle.height) || 200;

//     const ratio = window.devicePixelRatio || 1;

//     // definir dimensões reais do canvas (pixels físicos)
//     canvas.width = Math.round(cssWidth * ratio);
//     canvas.height = Math.round(cssHeight * ratio);

//     // manter tamanho CSS para layout
//     canvas.style.width = cssWidth + "px";
//     canvas.style.height = cssHeight + "px";

//     // aplicar transform para que as coordenadas de desenho possam ser em CSS pixels
//     // (ctx é transformado, portanto não precisamos escalar as coordenadas manualmente)
//     ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

//     // ajustar linha para ficar consistente visualmente (opcional ajustar valor)
//     // Para obter ~2px visíveis em CSS, definimos lineWidth em unidades CSS:
//     ctx.lineWidth = 2; // se ficar muito grosso em alguns dispositivos, ajuste para 1.5 ou 1
//     ctx.lineCap = "round";
//     ctx.strokeStyle = "#000";

//     // limpar corretamente (resetando a transform temporariamente)
//     ctx.save();
//     ctx.setTransform(1, 0, 0, 1, 0, 0);
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.restore();
//   }

//   // Função para lidar com mudanças de orientação e redimensionamento
//   function debounce(func, wait) {
//     let timeout;
//     return function executedFunction(...args) {
//       const later = () => {
//         clearTimeout(timeout);
//         func(...args);
//       };
//       clearTimeout(timeout);
//       timeout = setTimeout(later, wait);
//     };
//   }

//   const handleResize = debounce(() => {
//     fixCanvasDPI();
//   }, 100);

//   window.addEventListener("load", () => {
//     fixCanvasDPI();
//     window.addEventListener("orientationchange", handleResize);
//     window.addEventListener("resize", handleResize);

//     // Preencher campo de data com a data de hoje
//     const dataInput = document.getElementById("data");
//     if (dataInput) {
//       const hoje = new Date();
//       const ano = hoje.getFullYear();
//       const mes = String(hoje.getMonth() + 1).padStart(2, "0");
//       const dia = String(hoje.getDate()).padStart(2, "0");
//       dataInput.value = `${ano}-${mes}-${dia}`;
//     }
//   });

//   // DESENHO
//   let drawing = false;
//   function getPos(evt) {
//     const rect = canvas.getBoundingClientRect();

//     if (evt.touches && evt.touches.length) {
//       return {
//         x: evt.touches[0].clientX - rect.left,
//         y: evt.touches[0].clientY - rect.top,
//       };
//     } else {
//       return {
//         x: evt.clientX - rect.left,
//         y: evt.clientY - rect.top,
//       };
//     }
//   }

//   canvas.addEventListener("mousedown", (e) => {
//     drawing = true;
//     const p = getPos(e);
//     ctx.beginPath();
//     ctx.moveTo(p.x, p.y);
//     e.preventDefault();
//   });

//   canvas.addEventListener("mousemove", (e) => {
//     if (!drawing) return;
//     const p = getPos(e);
//     ctx.lineTo(p.x, p.y);
//     ctx.stroke();
//     e.preventDefault();
//   });

//   ["mouseup", "mouseleave"].forEach((ev) => {
//     canvas.addEventListener(ev, () => {
//       if (!drawing) return;
//       drawing = false;
//       try {
//         ctx.closePath();
//       } catch (e) {}
//     });
//   });

//   canvas.addEventListener(
//     "touchstart",
//     (e) => {
//       drawing = true;
//       const p = getPos(e);
//       ctx.beginPath();
//       ctx.moveTo(p.x, p.y);
//       e.preventDefault();
//     },
//     { passive: false }
//   );

//   canvas.addEventListener(
//     "touchmove",
//     (e) => {
//       if (!drawing) return;
//       const p = getPos(e);
//       ctx.lineTo(p.x, p.y);
//       ctx.stroke();
//       e.preventDefault();
//     },
//     { passive: false }
//   );

//   ["touchend", "touchcancel"].forEach((ev) => {
//     canvas.addEventListener(ev, () => {
//       drawing = false;
//       try {
//         ctx.closePath();
//       } catch (e) {}
//     });
//   });

//   // limpar assinatura respeitando transform
//   function limparAssinatura() {
//     ctx.save();
//     ctx.setTransform(1, 0, 0, 1, 0, 0);
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.restore();
//   }

//   btnClearSig.addEventListener("click", limparAssinatura);

//   /* ------------------------ TABELA DINÂMICA (sem alterações) ------------------------ */
//   const HEADER_CODIGO = "Código";
//   const HEADER_SERIAL = "Número de Série";
//   const HEADER_NOTA = "Nota Fiscal";
//   const HEADER_ACOES = "Ações";

//   function makeActionButton(text, cls, onClick) {
//     const b = document.createElement("button");
//     b.type = "button";
//     b.className = cls;
//     b.textContent = text;
//     b.addEventListener("click", onClick);
//     return b;
//   }

//   function addRow() {
//     if (!codigoInput.value.trim() || !serialInput.value.trim()) {
//       alert("Preencha Código e Número de Série (Nota Fiscal é opcional).");
//       return;
//     }
//     const tr = document.createElement("tr");
//     const tdCodigo = document.createElement("td");
//     const tdSerial = document.createElement("td");
//     const tdNota = document.createElement("td");
//     const tdActions = document.createElement("td");

//     tdCodigo.textContent = codigoInput.value.trim();
//     tdSerial.textContent = serialInput.value.trim();
//     tdNota.textContent = notaInput.value.trim();

//     tdCodigo.setAttribute("data-label", HEADER_CODIGO);
//     tdSerial.setAttribute("data-label", HEADER_SERIAL);
//     tdNota.setAttribute("data-label", HEADER_NOTA);
//     tdActions.setAttribute("data-label", HEADER_ACOES);

//     const btnEdit = makeActionButton("Editar", "edit-btn", () =>
//       editarLinha(tr)
//     );
//     const btnDelete = makeActionButton("Excluir", "delete-btn", () =>
//       excluirLinha(tr)
//     );

//     tdActions.appendChild(btnEdit);
//     tdActions.appendChild(btnDelete);

//     tr.appendChild(tdCodigo);
//     tr.appendChild(tdSerial);
//     tr.appendChild(tdNota);
//     tr.appendChild(tdActions);

//     serialTableBody.appendChild(tr);

//     codigoInput.value = "";
//     serialInput.value = "";
//     notaInput.value = "";
//   }

//   function addRowFull() {
//     const raw = inputCompleto.value.trim();
//     if (!raw) return;
//     const valores = raw
//       .split(/[,.;\n\r]+|\s{2,}|[ ]+/)
//       .map((v) => v.trim())
//       .filter(Boolean);

//     if (valores.length % 3 !== 0) {
//       alert(
//         "Por favor, insira valores em múltiplos de 3: Código, Serial, Nota Fiscal."
//       );
//       return;
//     }

//     for (let i = 0; i < valores.length; i += 3) {
//       const tr = document.createElement("tr");
//       const tdCodigo = document.createElement("td");
//       const tdSerial = document.createElement("td");
//       const tdNota = document.createElement("td");
//       const tdActions = document.createElement("td");

//       tdCodigo.textContent = valores[i] || "";
//       tdSerial.textContent = valores[i + 1] || "";
//       tdNota.textContent = valores[i + 2] || "";

//       tdCodigo.setAttribute("data-label", HEADER_CODIGO);
//       tdSerial.setAttribute("data-label", HEADER_SERIAL);
//       tdNota.setAttribute("data-label", HEADER_NOTA);
//       tdActions.setAttribute("data-label", HEADER_ACOES);

//       const btnEdit = makeActionButton("Editar", "edit-btn", () =>
//         editarLinha(tr)
//       );
//       const btnDelete = makeActionButton("Excluir", "delete-btn", () =>
//         excluirLinha(tr)
//       );

//       tdActions.appendChild(btnEdit);
//       tdActions.appendChild(btnDelete);

//       tr.appendChild(tdCodigo);
//       tr.appendChild(tdSerial);
//       tr.appendChild(tdNota);
//       tr.appendChild(tdActions);

//       serialTableBody.appendChild(tr);
//     }
//     inputCompleto.value = "";
//   }

//   function editarLinha(tr) {
//     const tds = tr.querySelectorAll("td");
//     if (tds.length >= 3) {
//       $("#codigoPeca").value = tds[0].textContent;
//       $("#serialProxxi").value = tds[1].textContent;
//       $("#notaFiscal").value = tds[2].textContent;
//       tr.remove();
//       codigoInput.focus();
//     }
//   }

//   function excluirLinha(tr) {
//     tr.remove();
//   }

//   btnAdd.addEventListener("click", addRow);
//   btnAddFull.addEventListener("click", addRowFull);

//   /* ------------------------ PRELOAD LOGO e UTILITÁRIOS ------------------------ */
//   const logoPath = "assets/images/logosmall2.png";
//   let PRELOADED_LOGO_DATAURL = null;
//   let PRELOADED_LOGO_ASPECT = null;
//   let PRELOADED_LOGO_OPTIMIZED = null;

//   function blobToDataURL(blob) {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onloadend = () => resolve(reader.result);
//       reader.onerror = reject;
//       reader.readAsDataURL(blob);
//     });
//   }

//   async function optimizeDataUrl(
//     dataUrl,
//     maxWidthPx,
//     mime = "image/jpeg",
//     quality = 0.75
//   ) {
//     return new Promise((resolve, reject) => {
//       const img = new Image();
//       img.onload = () => {
//         const aspect =
//           (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
//         const targetW = Math.min(maxWidthPx, img.naturalWidth || img.width);
//         const targetH = Math.round(targetW / aspect) || 1;
//         const c = document.createElement("canvas");
//         c.width = targetW;
//         c.height = targetH;
//         const cctx = c.getContext("2d");
//         cctx.fillStyle = "#ffffff";
//         cctx.fillRect(0, 0, c.width, c.height);
//         cctx.drawImage(img, 0, 0, c.width, c.height);
//         try {
//           const out = c.toDataURL(mime, quality);
//           resolve({ dataUrl: out, width: targetW, height: targetH, aspect });
//         } catch (err) {
//           reject(err);
//         }
//       };
//       img.onerror = (e) => reject(e);
//       img.src = dataUrl;
//     });
//   }

//   function optimizeCanvasToDataUrl(
//     srcCanvas,
//     maxWidthPx,
//     mime = "image/jpeg",
//     quality = 0.75
//   ) {
//     const sw = srcCanvas.width;
//     const sh = srcCanvas.height;
//     const aspect = sw / sh || 1;
//     const targetW = Math.min(maxWidthPx, sw);
//     const targetH = Math.round(targetW / aspect) || 1;
//     const c = document.createElement("canvas");
//     c.width = targetW;
//     c.height = targetH;
//     const cctx = c.getContext("2d");
//     cctx.fillStyle = "#ffffff";
//     cctx.fillRect(0, 0, c.width, c.height);
//     // drawImage with device pixel canvas as source
//     cctx.drawImage(srcCanvas, 0, 0, c.width, c.height);
//     return c.toDataURL(mime, quality);
//   }

//   async function preloadLogo() {
//     try {
//       const res = await fetch(logoPath, { cache: "no-cache" });
//       if (!res.ok) throw new Error("HTTP " + res.status);
//       const blob = await res.blob();
//       const dataUrl = await blobToDataURL(blob);
//       PRELOADED_LOGO_DATAURL = dataUrl;

//       const img = await new Promise((resolve, reject) => {
//         const i = new Image();
//         i.onload = () => resolve(i);
//         i.onerror = reject;
//         i.src = dataUrl;
//       });
//       PRELOADED_LOGO_ASPECT =
//         (img.naturalWidth || img.width) / (img.naturalHeight || img.height);

//       try {
//         // reduzir largura do logo para 300px por padrão e qualidade 0.75
//         const maxWidthPx = 300;
//         const optimized = await optimizeDataUrl(
//           PRELOADED_LOGO_DATAURL,
//           maxWidthPx,
//           "image/jpeg",
//           0.75
//         );
//         PRELOADED_LOGO_OPTIMIZED = optimized.dataUrl;
//       } catch (optErr) {
//         PRELOADED_LOGO_OPTIMIZED = PRELOADED_LOGO_DATAURL;
//       }
//     } catch (err) {
//       console.warn("[logo] preload falhou:", err);
//       PRELOADED_LOGO_DATAURL = null;
//       PRELOADED_LOGO_OPTIMIZED = null;
//     }
//   }
//   preloadLogo().catch((e) => console.error("[logo] preload erro:", e));

//   async function getLogoDataURL(url) {
//     if (PRELOADED_LOGO_OPTIMIZED) return PRELOADED_LOGO_OPTIMIZED;
//     try {
//       const res = await fetch(url, { cache: "no-cache" });
//       if (!res.ok) throw new Error("HTTP " + res.status);
//       const blob = await res.blob();
//       const dataUrl = await blobToDataURL(blob);
//       const opt = await optimizeDataUrl(dataUrl, 300, "image/jpeg", 0.75);
//       return opt.dataUrl;
//     } catch (err) {
//       console.warn("getLogoDataURL fetch falhou:", err);
//     }

//     // fallback: try to draw and optimize
//     try {
//       const img = new Image();
//       img.src = url;
//       await new Promise((res, rej) => {
//         img.onload = res;
//         img.onerror = rej;
//       });
//       const c = document.createElement("canvas");
//       c.width = img.naturalWidth || img.width;
//       c.height = img.naturalHeight || img.height;
//       c.getContext("2d").drawImage(img, 0, 0);
//       const dataUrl = c.toDataURL("image/png");
//       const opt = await optimizeDataUrl(dataUrl, 300, "image/jpeg", 0.75);
//       return opt.dataUrl;
//     } catch (err2) {
//       console.warn("getLogoDataURL fallback image falhou:", err2);
//     }
//     return null;
//   }

//   function getImageFormatFromDataUrl(dataUrl) {
//     if (!dataUrl || typeof dataUrl !== "string") return "PNG";
//     const m = dataUrl.match(/^data:image\/(png|jpeg|jpg);/i);
//     if (!m) return "PNG";
//     const mime = m[1].toLowerCase();
//     if (mime === "jpeg" || mime === "jpg") return "JPEG";
//     return "PNG";
//   }

//   /* ------------------------ GERA PDF (ajustes na assinatura e logo) ------------------------ */
//   btnGeneratePdf.addEventListener("click", async function gerarPDF() {
//     try {
//       // prefer optimized preloaded logo
//       let logoDataUrl =
//         PRELOADED_LOGO_OPTIMIZED || PRELOADED_LOGO_DATAURL || null;
//       if (!logoDataUrl && PRELOADED_LOGO_DATAURL) {
//         try {
//           const opt = await optimizeDataUrl(
//             PRELOADED_LOGO_DATAURL,
//             300,
//             "image/jpeg",
//             0.75
//           );
//           logoDataUrl = opt.dataUrl;
//           PRELOADED_LOGO_OPTIMIZED = logoDataUrl;
//         } catch (e) {
//           logoDataUrl = PRELOADED_LOGO_DATAURL;
//         }
//       }
//       if (!logoDataUrl) {
//         try {
//           logoDataUrl = await getLogoDataURL(logoPath);
//         } catch (e) {
//           logoDataUrl = null;
//         }
//       }

//       const { jsPDF } = window.jspdf;
//       const doc = new jsPDF();

//       const maxRowsPerPage = 20;
//       const tableColumnNames = ["Código", "Número de Série", "Nota Fiscal"];
//       const tableData = [];

//       const rows = serialTableBody.rows;
//       for (let i = 0; i < rows.length; i++) {
//         const cells = rows[i].cells;
//         const rowData = [
//           cells[0] ? cells[0].textContent : "",
//           cells[1] ? cells[1].textContent : "",
//           cells[2] ? cells[2].textContent : "",
//         ];
//         tableData.push(rowData);
//       }

//       const formElement = $("#deliveryForm");
//       const formData = new FormData(formElement);
//       const formDataObject = {};
//       formData.forEach((value, key) => (formDataObject[key] = value));

//       let dataFormatadaPDF = "";
//       let dataFormatada = "";
//       if (formDataObject.data) {
//         const parts = formDataObject.data.split("-");
//         if (parts.length === 3) {
//           dataFormatadaPDF = `${parts[2]}-${parts[1]}-${parts[0]}`;
//           const dt = new Date(parts[0], parts[1] - 1, parts[2]);
//           dataFormatada = dt.toLocaleDateString("pt-BR", {
//             day: "numeric",
//             month: "long",
//             year: "numeric",
//           });
//         }
//       }
//       if (!dataFormatada) {
//         const now = new Date();
//         dataFormatada = now.toLocaleDateString("pt-BR", {
//           day: "numeric",
//           month: "long",
//           year: "numeric",
//         });
//         dataFormatadaPDF = `${String(now.getDate()).padStart(2, "0")}-${String(
//           now.getMonth() + 1
//         ).padStart(2, "0")}-${now.getFullYear()}`;
//       }

//       function addHeaderAndFooter(pageNumber) {
//         const logoMaxWidthMm = 40;
//         if (logoDataUrl) {
//           try {
//             const fmt = getImageFormatFromDataUrl(logoDataUrl);
//             let logoWidth = logoMaxWidthMm;
//             let logoHeight = logoWidth / (PRELOADED_LOGO_ASPECT || 1);
//             const pageWidth = doc.internal.pageSize.getWidth();
//             const x = pageWidth - 15 - logoWidth;
//             const y = 8;
//             doc.addImage(logoDataUrl, fmt, x, y, logoWidth, logoHeight);
//           } catch (e) {
//             console.warn("Erro ao adicionar logo no PDF:", e);
//           }
//         }

//         doc.setFontSize(20);
//         doc.setFont(undefined, "bold");
//         doc.text("Formulário de Entrega de Peças", 105, 30, {
//           align: "center",
//         });

//         doc.setFontSize(12);
//         doc.setFont(undefined, "bold");
//         doc.text("Data:", 20, 44);
//         doc.setFont(undefined, "normal");
//         doc.text(dataFormatada, 33, 44);

//         doc.setFont(undefined, "bold");
//         doc.text("Nome do Recebedor:", 20, 54);
//         doc.setFont(undefined, "normal");
//         doc.text(formDataObject.nomeRecebedor || "", 64, 54);

//         doc.setFont(undefined, "bold");
//         doc.text("Nome Técnico:", 20, 64);
//         doc.setFont(undefined, "normal");
//         doc.text(formDataObject.nomeTecnico || "", 52, 64);

//         doc.setFontSize(10);
//         doc.setFont(undefined, "normal");
//         doc.text(`Página ${pageNumber}`, 105, 290, { align: "center" });
//       }

//       let currentPage = 1;
//       let startY = 75;
//       if (tableData.length === 0) addHeaderAndFooter(currentPage);

//       for (let i = 0; i < tableData.length; i += maxRowsPerPage) {
//         if (i !== 0) {
//           doc.addPage();
//           currentPage++;
//         }
//         addHeaderAndFooter(currentPage);
//         doc.autoTable({
//           head: [tableColumnNames],
//           body: tableData.slice(i, i + maxRowsPerPage),
//           startY: startY,
//           styles: { fontSize: 10 },
//         });
//       }

//       let finalY = 0;
//       if (
//         doc.autoTable &&
//         doc.autoTable.previous &&
//         typeof doc.autoTable.previous.finalY === "number"
//       ) {
//         finalY = doc.autoTable.previous.finalY + 10;
//       } else {
//         finalY = 80;
//       }

//       // ----- ASSINATURA: gerar JPEG otimizado (much smaller que PNG) -----
//       try {
//         // Ajuste aqui: maxWidthPx e qualidade. Diminuir qualidade => menor arquivo.
//         const assinaturaOptimized = optimizeCanvasToDataUrl(
//           canvas,
//           600,
//           "image/jpeg",
//           0.6
//         );
//         const fmtSig = getImageFormatFromDataUrl(assinaturaOptimized);
//         const sigWidthMm = 60;
//         const sigHeightMm = 30;
//         doc.addImage(
//           assinaturaOptimized,
//           fmtSig,
//           15,
//           finalY,
//           sigWidthMm,
//           sigHeightMm
//         );

//         doc.line(15, finalY + 35, 100, finalY + 35);
//         doc.text(formDataObject.nomeRecebedor || "", 20, finalY + 39);
//       } catch (e) {
//         console.warn("Erro ao adicionar assinatura no PDF:", e);
//       }

//       const fileName = `form_entrega_pecas_${
//         dataFormatadaPDF || "sem_data"
//       }.pdf`;
//       doc.save(fileName);
//       console.info("PDF gerado:", fileName);
//     } catch (err) {
//       console.error("Erro ao gerar PDF:", err);
//       alert("Ocorreu um erro ao gerar o PDF. Veja o console para detalhes.");
//     }
//   });

//   /* ------------------------ Quagga / Câmera (sem alteração) ------------------------ */
//   let cameraActive = false;
//   let currentTarget = null;

//   const cameraPreview = document.createElement("div");
//   cameraPreview.className = "camera-preview";
//   cameraPreview.style.display = "none";
//   cameraPreview.innerHTML = `
//     <video id="cameraVideo" autoplay playsinline></video>
//     <button type="button" class="close-camera">X</button>
//   `;
//   document.body.appendChild(cameraPreview);

//   function startCamera(targetId) {
//     if (cameraActive) {
//       stopCamera();
//       return;
//     }
//     currentTarget = targetId;
//     cameraActive = true;
//     cameraPreview.style.display = "block";

//     if (!window.Quagga) {
//       alert(
//         "Quagga não está carregado. Importe a biblioteca Quagga.js para usar a câmera."
//       );
//       stopCamera();
//       return;
//     }

//     Quagga.init(
//       {
//         inputStream: {
//           name: "Live",
//           type: "LiveStream",
//           target: cameraPreview.querySelector("video"),
//           constraints: { width: 640, height: 480, facingMode: "environment" },
//         },
//         decoder: {
//           readers: [
//             "code_128_reader",
//             "ean_reader",
//             "ean_8_reader",
//             "code_39_reader",
//             "upc_reader",
//           ],
//         },
//       },
//       function (err) {
//         if (err) {
//           console.error("Erro ao inicializar Quagga:", err);
//           alert("Não foi possível acessar a câmera.");
//           stopCamera();
//           return;
//         }
//         Quagga.start();
//       }
//     );

//     Quagga.onDetected(function (result) {
//       const code = result && result.codeResult && result.codeResult.code;
//       if (code) {
//         const el = document.getElementById(targetId);
//         if (el) el.value = code;
//         stopCamera();
//       }
//     });
//   }

//   function stopCamera() {
//     try {
//       if (window.Quagga && typeof Quagga.stop === "function") Quagga.stop();
//     } catch (e) {}
//     cameraPreview.style.display = "none";
//     cameraActive = false;
//     currentTarget = null;
//   }

//   cameraPreview
//     .querySelector(".close-camera")
//     .addEventListener("click", stopCamera);

//   document.addEventListener("DOMContentLoaded", function () {
//     document.querySelectorAll(".btn-camera").forEach((button) => {
//       button.addEventListener("click", function () {
//         const target = this.getAttribute("data-target");
//         if (target) startCamera(target);
//       });
//     });
//   });

//   window.iniciarLeituraCodigo = function (idInput) {
//     startCamera(idInput);
//   };
// })();
