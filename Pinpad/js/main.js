(function () {
  "use strict";

  /* =========================================================
     THEME
     ========================================================= */
  const THEME_KEY = "rollout-pinpad-theme";
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
    } else {
      applyTheme("dark"); // default per brief
    }
  })();

  themeToggle.addEventListener("click", function () {
    const current = root.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  /* =========================================================
     TOAST
     ========================================================= */
  const toastEl = document.getElementById("toast");
  let toastTimer = null;
  function showToast(msg, duration) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), duration || 3200);
  }

  /* =========================================================
     ELEMENT REFS
     ========================================================= */
  const els = {
    agencia: document.getElementById("agencia"),
    posto: document.getElementById("posto"),
    estacao: document.getElementById("estacao"),
    novoHostWrap: document.getElementById("novoHostWrap"),
    novoHostname: document.getElementById("novoHostname"),
    serialAntigo: document.getElementById("serialAntigo"),
    serialNovo: document.getElementById("serialNovo"),
    nomeResponsavel: document.getElementById("nomeResponsavel"),
    matricula: document.getElementById("matricula"),
    receiptText: document.getElementById("receiptText"),
    btnShare: document.getElementById("btnShare"),
    btnCopy: document.getElementById("btnCopy"),
    btnClear: document.getElementById("btnClear"),
    shareHint: document.getElementById("shareHint"),
    photoInput: document.getElementById("photoInput"),
    photoDrop: document.getElementById("photoDrop"),
    photoPreview: document.getElementById("photoPreview"),
    photoEmptyState: document.getElementById("photoEmptyState"),
    photoRemove: document.getElementById("photoRemove"),
  };

  const hostRadios = document.querySelectorAll('input[name="hostMode"]');

  /* =========================================================
     HELPERS: digit-only input + left-pad
     ========================================================= */
  function onlyDigits(str) {
    return (str || "").replace(/\D/g, "");
  }

  function bindNumericField(el, maxLen) {
    el.addEventListener("input", () => {
      const digits = onlyDigits(el.value).slice(0, maxLen);
      el.value = digits;
      updateReceipt();
    });
    el.addEventListener("blur", () => {
      if (el.value.length > 0) {
        el.value = el.value.padStart(maxLen, "0");
        updateReceipt();
      }
    });
  }

  bindNumericField(els.agencia, 4);
  bindNumericField(els.posto, 3);
  bindNumericField(els.estacao, 3);
  bindNumericField(els.novoHostname, 3);
  bindNumericField(els.matricula, 7);

  // posto: empty -> default "000" on blur
  els.posto.addEventListener("blur", () => {
    if (els.posto.value.trim() === "") {
      els.posto.value = "000";
      updateReceipt();
    }
  });

  els.nomeResponsavel.addEventListener("input", updateReceipt);

  /* =========================================================
     SERIAL MASK: XXX-XXX-XXX (9 digits, dashes auto-inserted)
     ========================================================= */
  function formatSerial(raw) {
    const digits = onlyDigits(raw).slice(0, 9);
    const parts = [];
    for (let i = 0; i < digits.length; i += 3) parts.push(digits.slice(i, i + 3));
    return parts.join("-");
  }

  function bindSerialField(el) {
    el.addEventListener("input", () => {
      const caretAtEnd = el.selectionEnd === el.value.length;
      el.value = formatSerial(el.value);
      if (caretAtEnd) {
        el.selectionStart = el.selectionEnd = el.value.length;
      }
      updateReceipt();
    });
  }
  bindSerialField(els.serialAntigo);
  bindSerialField(els.serialNovo);

  /* =========================================================
     HOST MODE (Mesmo Host / Outro Host)
     ========================================================= */
  function currentHostMode() {
    const checked = document.querySelector('input[name="hostMode"]:checked');
    return checked ? checked.value : "mesmo";
  }

  hostRadios.forEach((r) => {
    r.addEventListener("change", () => {
      const isOutro = currentHostMode() === "outro";
      els.novoHostWrap.hidden = !isOutro;
      if (!isOutro) els.novoHostname.value = "";
      updateReceipt();
    });
  });

  /* =========================================================
     TEXT GENERATION
     ========================================================= */
  function buildHostname(agencia, posto, estacao) {
    return `${agencia}-${posto}-E${estacao}`;
  }

  function generateText() {
    const agencia = els.agencia.value.trim();
    const posto = els.posto.value.trim() || "000";
    const estacao = els.estacao.value.trim();
    const serialNovo = els.serialNovo.value.trim();
    const serialAntigo = els.serialAntigo.value.trim();
    const nome = els.nomeResponsavel.value.trim();
    const matricula = els.matricula.value.trim();
    const isOutro = currentHostMode() === "outro";
    const novoHost = els.novoHostname.value.trim();

    const missing = [];
    if (agencia.length < 4) missing.push("Agência");
    if (estacao.length < 3) missing.push("Estação");
    if (isOutro && novoHost.length < 3) missing.push("Novo hostname");
    if (!serialAntigo) missing.push("S/N Antigo");
    if (!serialNovo) missing.push("S/N Novo");
    if (!nome) missing.push("Responsável");
    if (matricula.length < 7) missing.push("Matrícula");

    if (missing.length) {
      return { ok: false, missing, text: "" };
    }

    let text;
    if (isOutro) {
      const de = buildHostname(agencia, posto, estacao);
      const para = buildHostname(agencia, posto, novoHost);
      text =
`Agência: ${agencia}
Hostname: 
De: ${de}
Para: ${para}
S/N Novo: ${serialNovo}
S/N Antigo: ${serialAntigo}
Responsável: ${nome}
Matrícula: ${matricula}`;
    } else {
      const hostname = buildHostname(agencia, posto, estacao);
      text =
`Agência: ${agencia}
Hostname: ${hostname}
S/N Novo: ${serialNovo}
S/N Antigo: ${serialAntigo}
Responsável: ${nome}
Matrícula: ${matricula}`;
    }

    return { ok: true, missing: [], text };
  }

  function updateReceipt() {
    const result = generateText();
    if (result.ok) {
      els.receiptText.textContent = result.text;
      els.btnShare.disabled = false;
      els.btnCopy.disabled = false;
    } else {
      els.receiptText.textContent =
        `Preencha os campos abaixo para gerar o texto:\n\n• ${result.missing.join("\n• ")}`;
      els.btnShare.disabled = false; // keep clickable to surface validation via toast
      els.btnCopy.disabled = false;
    }
  }

  /* =========================================================
     PHOTO UPLOAD
     ========================================================= */
  let currentPhotoFile = null;

  els.photoDrop.addEventListener("click", (e) => {
    // label already triggers input via "for", but keep programmatic fallback
  });

  els.photoInput.addEventListener("change", () => {
    const file = els.photoInput.files && els.photoInput.files[0];
    if (!file) return;
    currentPhotoFile = file;
    const url = URL.createObjectURL(file);
    els.photoPreview.src = url;
    els.photoPreview.hidden = false;
    els.photoEmptyState.hidden = true;
    els.photoRemove.hidden = false;
  });

  els.photoRemove.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    currentPhotoFile = null;
    els.photoInput.value = "";
    els.photoPreview.removeAttribute("src");
    els.photoPreview.hidden = true;
    els.photoEmptyState.hidden = false;
    els.photoRemove.hidden = true;
  });

  /* =========================================================
     SHARE / COPY
     ========================================================= */
  function validateOrToast() {
    const result = generateText();
    if (!result.ok) {
      showToast("Preencha: " + result.missing.join(", "), 3800);
      return null;
    }
    return result.text;
  }

  els.btnCopy.addEventListener("click", async () => {
    const text = validateOrToast();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Texto copiado ✓");
    } catch (e) {
      showToast("Não foi possível copiar automaticamente. Selecione e copie manualmente.");
    }
  });

  els.btnShare.addEventListener("click", async () => {
    const text = validateOrToast();
    if (!text) return;

    if (!currentPhotoFile) {
      // no photo — just try to share/copy text
      await shareTextOnly(text);
      return;
    }

    // Try Web Share API Level 2 (files) — best path on Android/mobile
    try {
      if (navigator.canShare && navigator.share) {
        const file = new File([currentPhotoFile], currentPhotoFile.name || "rollout-pinpad.jpg", {
          type: currentPhotoFile.type || "image/jpeg",
        });
        const shareData = { files: [file], text: text, title: "Rollout PinPad" };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          showToast("Compartilhado ✓");
          return;
        }
      }
    } catch (err) {
      if (err && err.name === "AbortError") return; // user cancelled share sheet
      console.warn("Web Share falhou, aplicando fallback:", err);
    }

    // Fallback: copy text + download photo for manual attach
    await fallbackShare(text);
  });

  async function shareTextOnly(text) {
    try {
      if (navigator.share) {
        await navigator.share({ text, title: "Rollout PinPad" });
        showToast("Compartilhado ✓");
        return;
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("Sem foto anexada — texto copiado ✓");
    } catch (e) {
      showToast("Não foi possível compartilhar automaticamente.");
    }
  }

  async function fallbackShare(text) {
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (e) {}

    // trigger download of the photo so the user can attach it manually
    try {
      const url = URL.createObjectURL(currentPhotoFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentPhotoFile.name || "rollout-pinpad.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {}

    showToast(
      copied
        ? "Texto copiado e foto baixada — cole o texto e anexe a foto no WhatsApp"
        : "Foto baixada — copie o texto manualmente e anexe a foto no WhatsApp",
      5200
    );
  }

  els.btnClear.addEventListener("click", () => {
    document.getElementById("pinpadForm").reset();
    els.novoHostWrap.hidden = true;
    currentPhotoFile = null;
    els.photoInput.value = "";
    els.photoPreview.removeAttribute("src");
    els.photoPreview.hidden = true;
    els.photoEmptyState.hidden = false;
    els.photoRemove.hidden = true;
    updateReceipt();
    showToast("Formulário limpo");
  });

  /* =========================================================
     CAMERA BARCODE SCAN (BarcodeDetector nativo + fallback Quagga)
     Adaptado do projeto de referência do usuário.
     ========================================================= */
  let cameraActive = false;
  let currentTarget = null;
  let currentStream = null;
  let barcodeDetector = null;
  let rafId = null;

  const cameraModal = document.getElementById("cameraPreviewModal");
  const cameraVideo = document.getElementById("cameraVideo");
  const closeCameraBtn = cameraModal.querySelector(".camera-modal__close");

  function showCameraModal() {
    cameraModal.classList.add("show");
    cameraVideo.setAttribute("aria-hidden", "false");
  }
  function hideCameraModal() {
    cameraModal.classList.remove("show");
    cameraVideo.setAttribute("aria-hidden", "true");
  }

  async function startCamera(targetId) {
    if (cameraActive) stopCamera();

    currentTarget = targetId;
    cameraActive = true;
    showCameraModal();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Este navegador não suporta acesso à câmera.");
      stopCamera();
      return;
    }

    try {
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if ("srcObject" in cameraVideo) {
        cameraVideo.srcObject = currentStream;
      } else {
        cameraVideo.src = window.URL.createObjectURL(currentStream);
      }
      await cameraVideo.play();
    } catch (err) {
      console.error("Erro getUserMedia:", err);
      showToast("Não foi possível acessar a câmera. Verifique as permissões.");
      stopCamera();
      return;
    }

    if ("BarcodeDetector" in window) {
      try {
        const formats = ["code_128", "ean_13", "ean_8", "code_39", "upc_e", "upc_a", "qr_code"];
        barcodeDetector = new BarcodeDetector({ formats });
      } catch (e) {
        barcodeDetector = null;
      }
    }

    if (barcodeDetector) {
      const detectFrame = async () => {
        if (!cameraActive) return;
        try {
          const barcodes = await barcodeDetector.detect(cameraVideo);
          if (barcodes && barcodes.length) {
            const code = barcodes[0].rawValue;
            if (code) {
              handleDetected(code);
              return;
            }
          }
        } catch (err) {
          /* detect can throw transiently — ignore and retry next frame */
        }
        rafId = requestAnimationFrame(detectFrame);
      };
      rafId = requestAnimationFrame(detectFrame);
      return;
    }

    if (window.Quagga) {
      try {
        if (typeof window.Quagga.stop === "function") {
          try { window.Quagga.stop(); } catch (e) {}
        }
        window.Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: cameraVideo,
              constraints: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            decoder: {
              readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "upc_reader"],
            },
            locate: true,
          },
          function (err) {
            if (err) {
              console.error("Erro ao inicializar Quagga:", err);
              showToast("Não foi possível inicializar o leitor de código de barras.");
              stopCamera();
              return;
            }
            try {
              window.Quagga.start();
            } catch (startErr) {
              console.error("Quagga start erro:", startErr);
              stopCamera();
            }
          }
        );
        window.Quagga.onDetected(function (result) {
          const code = result && result.codeResult && result.codeResult.code;
          if (code) handleDetected(code);
        });
      } catch (e) {
        console.error("Quagga fallback erro:", e);
        stopCamera();
      }
      return;
    }

    showToast("Leitura por câmera não disponível neste navegador.");
    stopCamera();
  }

  function handleDetected(code) {
    try {
      const el = document.getElementById(currentTarget);
      if (!el) {
        stopCamera();
        return;
      }
      // apply the same XXX-XXX-XXX mask used for manual typing
      el.value = formatSerial(code);
      updateReceipt();
    } catch (e) {
      console.error("Erro ao aplicar código detectado:", e);
    } finally {
      stopCamera();
    }
  }

  function stopCamera() {
    cameraActive = false;
    currentTarget = null;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    hideCameraModal();

    try {
      if (currentStream && currentStream.getTracks) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {}
    currentStream = null;

    try {
      if (window.Quagga && typeof window.Quagga.stop === "function") {
        window.Quagga.stop();
      }
    } catch (e) {}
  }

  closeCameraBtn.addEventListener("click", stopCamera);

  document.querySelectorAll(".btn-camera").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-target");
      startCamera(target);
    });
  });

  /* =========================================================
     INIT
     ========================================================= */
  updateReceipt();
})();
