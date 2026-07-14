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
    photoInputCamera: document.getElementById("photoInputCamera"),
    photoInputGallery: document.getElementById("photoInputGallery"),
    btnPhotoCamera: document.getElementById("btnPhotoCamera"),
    btnPhotoGallery: document.getElementById("btnPhotoGallery"),
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
        `Faltam preencher:\n\n• ${result.missing.join("\n• ")}`;
      els.btnShare.disabled = false; // keep clickable to surface validation via toast
      els.btnCopy.disabled = false;
    }
  }

  /* =========================================================
     PHOTO UPLOAD
     ========================================================= */
  let currentPhotoFile = null;
  let currentPhotoUrl = null;

  function setPhoto(file) {
    if (!file) return;
    // always replaces whatever photo was there before — only one is ever kept
    if (currentPhotoUrl) URL.revokeObjectURL(currentPhotoUrl);
    currentPhotoFile = file;
    currentPhotoUrl = URL.createObjectURL(file);
    els.photoPreview.src = currentPhotoUrl;
    els.photoPreview.hidden = false;
    els.photoEmptyState.hidden = true;
    els.photoRemove.hidden = false;
  }

  function clearPhoto() {
    if (currentPhotoUrl) URL.revokeObjectURL(currentPhotoUrl);
    currentPhotoFile = null;
    currentPhotoUrl = null;
    els.photoInputCamera.value = "";
    els.photoInputGallery.value = "";
    els.photoPreview.removeAttribute("src");
    els.photoPreview.hidden = true;
    els.photoEmptyState.hidden = false;
    els.photoRemove.hidden = true;
  }

  // Coarse pointer (touch) ~= phone/tablet: the OS camera app (via the file
  // input's capture attribute) gives a better result there than a webpage
  // webcam preview. Desktop/mouse devices get a live camera modal instead,
  // matching the barcode-scan experience.
  function isTouchDevice() {
    return window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  }

  els.btnPhotoCamera.addEventListener("click", () => {
    if (isTouchDevice()) {
      els.photoInputCamera.click();
    } else {
      startPhotoCapture();
    }
  });
  els.btnPhotoGallery.addEventListener("click", () => els.photoInputGallery.click());

  els.photoInputCamera.addEventListener("change", () => {
    const file = els.photoInputCamera.files && els.photoInputCamera.files[0];
    if (file) setPhoto(file);
    els.photoInputGallery.value = ""; // keep the two inputs in sync — single photo only
  });

  els.photoInputGallery.addEventListener("change", () => {
    const file = els.photoInputGallery.files && els.photoInputGallery.files[0];
    if (file) setPhoto(file);
    els.photoInputCamera.value = "";
  });

  els.photoRemove.addEventListener("click", (e) => {
    e.preventDefault();
    clearPhoto();
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
    clearPhoto();
    updateReceipt();
    showToast("Formulário limpo");
  });

  /* =========================================================
     CAMERA BARCODE SCAN (BarcodeDetector nativo + fallback Quagga)
     Adaptado do projeto de referência do usuário.

     IMPORTANTE: os dois motores de leitura NUNCA disputam a mesma
     câmera/elemento de vídeo. O BarcodeDetector usa o <video> próprio
     (getUserMedia controlado por nós); o Quagga usa seu próprio
     container e gerencia sua própria captura de câmera internamente.
     Só um dos dois é ativado por sessão de leitura.
     ========================================================= */
  let cameraActive = false;
  let currentTarget = null;
  let currentStream = null;
  let rafId = null;
  let activeEngine = null; // "detector" | "quagga" | null

  const cameraModal = document.getElementById("cameraPreviewModal");
  const cameraVideo = document.getElementById("cameraVideo");
  const quaggaContainer = document.getElementById("quaggaContainer");
  const cameraHint = document.getElementById("cameraHint");
  const capturePhotoBtn = document.getElementById("capturePhotoBtn");
  const closeCameraBtn = cameraModal.querySelector(".camera-modal__close");

  function showCameraModal(mode) {
    cameraModal.classList.add("show");
    cameraModal.classList.toggle("mode-photo", mode === "photo");
  }
  function hideCameraModal() {
    cameraModal.classList.remove("show", "mode-photo");
  }

  // Checks native BarcodeDetector support against the formats we actually
  // need, so the constructor never throws on browsers with partial support.
  async function getUsableDetector() {
    if (!("BarcodeDetector" in window)) return null;
    const wanted = ["code_128", "ean_13", "ean_8", "code_39", "upc_e", "upc_a", "qr_code"];
    try {
      let formats = wanted;
      if (typeof BarcodeDetector.getSupportedFormats === "function") {
        const supported = await BarcodeDetector.getSupportedFormats();
        formats = wanted.filter((f) => supported.includes(f));
        if (!formats.length) return null;
      }
      return new BarcodeDetector({ formats });
    } catch (e) {
      console.warn("BarcodeDetector indisponível, usando Quagga:", e);
      return null;
    }
  }

  async function startCamera(targetId) {
    if (cameraActive) stopCamera();

    currentTarget = targetId;
    cameraActive = true;
    showCameraModal("scan");
    cameraHint.textContent = "Iniciando câmera…";

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Este navegador não suporta acesso à câmera.");
      stopCamera();
      return;
    }

    const detector = await getUsableDetector();

    if (detector) {
      await startWithDetector(detector);
    } else if (window.Quagga) {
      await startWithQuagga();
    } else {
      showToast("Leitura por câmera não disponível neste navegador.");
      stopCamera();
    }
  }

  async function startWithDetector(detector) {
    activeEngine = "detector";
    cameraVideo.hidden = false;
    quaggaContainer.hidden = true;

    try {
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      cameraVideo.srcObject = currentStream;
      await cameraVideo.play();
    } catch (err) {
      console.error("Erro getUserMedia:", err);
      showToast("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      stopCamera();
      return;
    }

    cameraHint.textContent = "Aponte para o código de barras do equipamento";

    const detectFrame = async () => {
      if (!cameraActive || activeEngine !== "detector") return;
      try {
        const barcodes = await detector.detect(cameraVideo);
        if (barcodes && barcodes.length) {
          const code = barcodes[0].rawValue;
          if (code) {
            handleDetected(code);
            return;
          }
        }
      } catch (err) {
        /* detect() can throw transiently on some frames — ignore and retry */
      }
      rafId = requestAnimationFrame(detectFrame);
    };
    rafId = requestAnimationFrame(detectFrame);
  }

  async function startWithQuagga() {
    activeEngine = "quagga";
    cameraVideo.hidden = true;
    quaggaContainer.hidden = false;
    quaggaContainer.innerHTML = ""; // clear any leftovers from a previous session

    try {
      await new Promise((resolve, reject) => {
        window.Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: quaggaContainer,
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
          (err) => (err ? reject(err) : resolve())
        );
      });

      window.Quagga.start();
      cameraHint.textContent = "Aponte para o código de barras do equipamento";
      window.Quagga.onDetected(handleQuaggaDetected);
    } catch (err) {
      console.error("Erro ao inicializar Quagga:", err);
      showToast("Não foi possível acessar a câmera para leitura do código de barras.");
      stopCamera();
    }
  }

  function handleQuaggaDetected(result) {
    if (activeEngine !== "quagga") return;
    const code = result && result.codeResult && result.codeResult.code;
    if (code) handleDetected(code);
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

  async function startPhotoCapture() {
    if (cameraActive) stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // no webcam API at all — fall back to the regular file picker
      els.photoInputCamera.click();
      return;
    }

    cameraActive = true;
    activeEngine = "photo";
    cameraVideo.hidden = false;
    quaggaContainer.hidden = true;
    showCameraModal("photo");

    try {
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      cameraVideo.srcObject = currentStream;
      await cameraVideo.play();
    } catch (err) {
      console.error("Erro ao acessar webcam:", err);
      showToast("Não foi possível acessar a câmera do computador. Verifique as permissões do navegador.");
      stopCamera();
    }
  }

  capturePhotoBtn.addEventListener("click", () => {
    if (activeEngine !== "photo" || !cameraVideo.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;
    canvas.getContext("2d").drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          showToast("Não foi possível capturar a foto. Tente novamente.");
          return;
        }
        const file = new File([blob], `rollout-pinpad-${Date.now()}.jpg`, { type: "image/jpeg" });
        setPhoto(file);
        stopCamera();
        showToast("Foto capturada ✓");
      },
      "image/jpeg",
      0.92
    );
  });

  function stopCamera() {
    cameraActive = false;
    currentTarget = null;
    const engine = activeEngine;
    activeEngine = null;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    hideCameraModal();

    // stop our own getUserMedia stream (detector path)
    try {
      if (currentStream && currentStream.getTracks) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {}
    currentStream = null;
    cameraVideo.srcObject = null;

    // stop Quagga's own internally-managed stream (quagga path)
    if (engine === "quagga" && window.Quagga) {
      try {
        if (typeof window.Quagga.offDetected === "function") {
          window.Quagga.offDetected(handleQuaggaDetected);
        }
        if (typeof window.Quagga.stop === "function") {
          window.Quagga.stop();
        }
      } catch (e) {}
      quaggaContainer.innerHTML = "";
    }
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
