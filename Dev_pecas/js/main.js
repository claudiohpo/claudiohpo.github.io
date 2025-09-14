// js/main.js
// Versão melhorada: carrega logo com fetch->blob->dataURL (mais confiável), fallback via Image+canvas.
// Coloque este arquivo em: js/main.js

(function () {
    // SHORTCUTS
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ELEMENTOS
    const btnAdd = $('#btnAdd');
    const btnAddFull = $('#btnAddFull');
    const btnClearSig = $('#btnClearSig');
    const btnGeneratePdf = $('#btnGeneratePdf');

    const codigoInput = $('#codigoPeca');
    const serialInput = $('#serialProxxi');
    const notaInput = $('#notaFiscal');
    const inputCompleto = $('#inputCompleto');
    const serialTableBody = $('#serialTable tbody');

    const canvas = $('#signatureCanvas');
    const ctx = canvas.getContext('2d');

    // Ajusta canvas para alta densidade de pixels (melhor qualidade na exportação)
    function fixCanvasDPI() {
        // canvas client size (CSS px)
        const w = canvas.clientWidth || 600;
        const h = canvas.clientHeight || 300;
        const ratio = window.devicePixelRatio || 1;

        // redimensiona canvas de verdade para guardar mais pixels
        canvas.width = Math.round(w * ratio);
        canvas.height = Math.round(h * ratio);

        // preserva o tamanho CSS
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        // reset transform e aplicar escala para desenhar em CSS coordinate system
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
    }

    // inicializa tamanho do canvas
    fixCanvasDPI();

    // Reajusta ao redimensionar a janela (salva e restaura conteúdo)
    window.addEventListener('resize', () => {
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
                x: (evt.touches[0].clientX - rect.left),
                y: (evt.touches[0].clientY - rect.top),
            };
        } else {
            return {
                x: (evt.clientX - rect.left),
                y: (evt.clientY - rect.top),
            };
        }
    }

    canvas.addEventListener('mousedown', (e) => {
        drawing = true;
        const p = getPos(e);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        e.preventDefault();
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        const p = getPos(e);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        e.preventDefault();
    });

    canvas.addEventListener('mouseup', () => {
        drawing = false;
        ctx.closePath();
    });

    canvas.addEventListener('mouseout', () => {
        drawing = false;
        ctx.closePath();
    });

    // touch
    canvas.addEventListener('touchstart', (e) => {
        drawing = true;
        const p = getPos(e);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (!drawing) return;
        const p = getPos(e);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
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

    btnClearSig.addEventListener('click', limparAssinatura);

    // Adiciona uma linha simples
    function addRow() {
        if (!codigoInput.value.trim() || !serialInput.value.trim()) {
            alert('Preencha Código e Número de Série (Nota Fiscal é opcional).');
            return;
        }

        const tr = document.createElement('tr');
        const tdCodigo = document.createElement('td');
        const tdSerial = document.createElement('td');
        const tdNota = document.createElement('td');
        const tdActions = document.createElement('td');

        tdCodigo.textContent = codigoInput.value.trim();
        tdSerial.textContent = serialInput.value.trim();
        tdNota.textContent = notaInput.value.trim();

        // botões
        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.textContent = 'Editar';
        btnEdit.addEventListener('click', () => editarLinha(tr));

        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.textContent = 'Excluir';
        btnDelete.addEventListener('click', () => excluirLinha(tr));

        tdActions.appendChild(btnEdit);
        tdActions.appendChild(btnDelete);

        tr.appendChild(tdCodigo);
        tr.appendChild(tdSerial);
        tr.appendChild(tdNota);
        tr.appendChild(tdActions);

        serialTableBody.appendChild(tr);

        codigoInput.value = '';
        serialInput.value = '';
        notaInput.value = '';
    }

    function addRowFull() {
        const raw = inputCompleto.value.trim();
        if (!raw) return;
        const valores = raw.split(/[, .]+/).map(v => v.trim()).filter(Boolean);

        if (valores.length % 3 !== 0) {
            alert('Por favor, insira valores em múltiplos de 3: Código, Serial, Nota Fiscal.');
            return;
        }

        for (let i = 0; i < valores.length; i += 3) {
            const tr = document.createElement('tr');
            const tdCodigo = document.createElement('td');
            const tdSerial = document.createElement('td');
            const tdNota = document.createElement('td');
            const tdActions = document.createElement('td');

            tdCodigo.textContent = valores[i];
            tdSerial.textContent = valores[i + 1] || '';
            tdNota.textContent = valores[i + 2] || '';

            const btnEdit = document.createElement('button');
            btnEdit.type = 'button';
            btnEdit.textContent = 'Editar';
            btnEdit.addEventListener('click', () => editarLinha(tr));

            const btnDelete = document.createElement('button');
            btnDelete.type = 'button';
            btnDelete.textContent = 'Excluir';
            btnDelete.addEventListener('click', () => excluirLinha(tr));

            tdActions.appendChild(btnEdit);
            tdActions.appendChild(btnDelete);

            tr.appendChild(tdCodigo);
            tr.appendChild(tdSerial);
            tr.appendChild(tdNota);
            tr.appendChild(tdActions);

            serialTableBody.appendChild(tr);
        }

        inputCompleto.value = '';
    }

    function editarLinha(tr) {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 3) {
            $('#codigoPeca').value = tds[0].textContent;
            $('#serialProxxi').value = tds[1].textContent;
            $('#notaFiscal').value = tds[2].textContent;
            tr.remove();
        }
    }

    function excluirLinha(tr) {
        tr.remove();
    }

    btnAdd.addEventListener('click', addRow);
    btnAddFull.addEventListener('click', addRowFull);

    // ---------- IMAGEM: carregamento confiável para embutir no PDF ----------
    // Caminho relativo recomendado (sem "/" inicial) — ajuste se necessário.
    // Se index.html estiver em Dev_pecas/, use: 'assets/images/logosmall.png'
    const logoPath = 'assets/images/logosmall.png';

    // Converte Blob -> dataURL
    function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Tenta obter dataURL via fetch (preferível quando servido por HTTP(S))
    async function fetchImageAsDataURL(url) {
        try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (!res.ok) throw new Error('fetch error: ' + res.status);
            const blob = await res.blob();
            const dataUrl = await blobToDataURL(blob);
            return dataUrl;
        } catch (err) {
            // rethrow para o fallback tratar
            throw err;
        }
    }

    // Fallback: cria Image e desenha em canvas (pode taintar se CORS bloquear)
    function imageToDataUrlFallback(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            // não setar crossOrigin aqui se servidor não permitir; primeiro tenta sem
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                const cctx = c.getContext('2d');
                try {
                    cctx.drawImage(img, 0, 0);
                    const dataURL = c.toDataURL('image/png');
                    resolve(dataURL);
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = (e) => reject(new Error('image fallback error: ' + e));
            img.src = url;
        });
    }

    // Função principal que tenta múltiplas estratégias e retorna dataURL ou null
    async function getLogoDataURL(url) {
        // 1) Tenta fetch -> blob -> dataURL
        try {
            const dataUrl = await fetchImageAsDataURL(url);
            console.info('Logo carregada via fetch:', url);
            return dataUrl;
        } catch (err) {
            console.warn('fetch falhou para logo:', url, err);
        }

        // 2) Tenta fallback por Image + canvas (pode taintar em ambientes com CORS)
        try {
            const dataUrl = await imageToDataUrlFallback(url);
            console.info('Logo carregada via Image fallback:', url);
            return dataUrl;
        } catch (err) {
            console.warn('fallback por Image falhou para logo:', url, err);
        }

        // 3) Sem logo
        console.warn('Não foi possível carregar o logo. O PDF será gerado sem logo.');
        return null;
    }

    // Extrai MIME (ex: 'PNG' ou 'JPEG') a partir de dataURL
    function getImageFormatFromDataUrl(dataUrl) {
        if (!dataUrl || typeof dataUrl !== 'string') return 'PNG';
        // data:image/png;base64,...
        const m = dataUrl.match(/^data:image\/(png|jpeg|jpg);/i);
        if (!m) return 'PNG';
        const mime = m[1].toLowerCase();
        if (mime === 'jpeg' || mime === 'jpg') return 'JPEG';
        return 'PNG';
    }

    // ---------- GERA PDF ----------
    btnGeneratePdf.addEventListener('click', async function gerarPDF() {
        try {
            // Tenta obter logoDataUrl (pode falhar por CORS/file://)
            let logoDataUrl = null;
            try {
                logoDataUrl = await getLogoDataURL(logoPath);
            } catch (err) {
                console.warn('Erro ao obter logoDataUrl:', err);
                logoDataUrl = null;
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
                    cells[0] ? cells[0].textContent : '',
                    cells[1] ? cells[1].textContent : '',
                    cells[2] ? cells[2].textContent : ''
                ];
                tableData.push(rowData);
            }

            // obtém dados do form
            const formElement = $('#deliveryForm');
            const formData = new FormData(formElement);
            const formDataObject = {};
            formData.forEach((value, key) => formDataObject[key] = value);

            // data formatada
            let dataFormatadaPDF = '';
            let dataFormatada = '';
            if (formDataObject.data) {
                const parts = formDataObject.data.split('-'); // YYYY-MM-DD
                if (parts.length === 3) {
                    dataFormatadaPDF = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
                    dataFormatada = dt.toLocaleDateString('pt-BR', { day:'numeric', month:'long', year:'numeric' });
                }
            }
            if (!dataFormatada) {
                const now = new Date();
                dataFormatada = now.toLocaleDateString('pt-BR', { day:'numeric', month:'long', year:'numeric' });
                dataFormatadaPDF = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;
            }

            // função para adicionar cabeçalho e rodapé
            function addHeaderAndFooter(pageNumber, logoData) {
                if (logoData) {
                    try {
                        const fmt = getImageFormatFromDataUrl(logoData); // 'PNG' ou 'JPEG'
                        // posicionamento do logo (ajuste conforme necessário)
                        doc.addImage(logoData, fmt, 165, 6, 40, 21.4);
                    } catch (e) {
                        console.warn('Erro ao adicionar logo no PDF:', e);
                    }
                }
                doc.setFontSize(20);
                doc.setFont(undefined, 'bold');
                doc.text('Formulário de Entrega de Peças', 105, 30, { align: 'center' });

                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Data:', 20, 44);
                doc.setFont(undefined, 'normal');
                doc.text(dataFormatada, 33, 44);

                doc.setFont(undefined, 'bold');
                doc.text('Nome do Recebedor:', 20, 54);
                doc.setFont(undefined, 'normal');
                doc.text(formDataObject.nomeRecebedor || '', 64, 54);

                doc.setFont(undefined, 'bold');
                doc.text('Nome Técnico:', 20, 64);
                doc.setFont(undefined, 'normal');
                doc.text(formDataObject.nomeTecnico || '', 52, 64);

                // rodapé
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.text(`Página ${pageNumber}`, 105, 290, { align: 'center' });
            }

            // gera tabelas paginadas
            let currentPage = 1;
            let startY = 75;

            // se não houver linhas, ainda queremos um cabeçalho
            if (tableData.length === 0) {
                addHeaderAndFooter(currentPage, logoDataUrl);
            }

            for (let i = 0; i < tableData.length; i += maxRowsPerPage) {
                if (i !== 0) {
                    doc.addPage();
                    currentPage++;
                }
                addHeaderAndFooter(currentPage, logoDataUrl);
                doc.autoTable({
                    head: [tableColumnNames],
                    body: tableData.slice(i, i + maxRowsPerPage),
                    startY: startY,
                    styles: { fontSize: 10 }
                });
            }

            // lugar pra assinatura
            let finalY = 0;
            if (doc.autoTable && doc.autoTable.previous && typeof doc.autoTable.previous.finalY === 'number') {
                finalY = doc.autoTable.previous.finalY + 10;
            } else {
                finalY = 80;
            }

            // assinatura: pega dataURL do canvas (assinatura)
            try {
                // usa canvas "real" (que já está em alta resolução)
                const assinaturaDataUrl = canvas.toDataURL('image/png');
                const fmtSig = getImageFormatFromDataUrl(assinaturaDataUrl);
                // tamanho adequado em mm (aprox)
                doc.addImage(assinaturaDataUrl, fmtSig, 15, finalY, 60, 30);
                doc.line(15, finalY + 35, 100, finalY + 35);
                doc.text(formDataObject.nomeRecebedor || '', 20, finalY + 39);
            } catch (e) {
                console.warn('Erro ao adicionar assinatura no PDF:', e);
            }

            // salvar
            const fileName = `form_entrega_pecas_${dataFormatadaPDF || 'sem_data'}.pdf`;
            doc.save(fileName);

            // dica de sucesso
            console.info('PDF gerado:', fileName);
        } catch (err) {
            console.error('Erro ao gerar PDF:', err);
            alert('Ocorreu um erro ao gerar o PDF. Veja o console para detalhes.');
        }
    });

    // Se quiser, pode adicionar funções que mostram a câmera e usam Quagga.
    window.iniciarLeituraCodigo = function (idInput) {
        console.warn('iniciarLeituraCodigo(): implemente Quagga ou biblioteca de leitura de código se desejar.');
    };

})();
