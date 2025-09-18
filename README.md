# ✨ Playground Web — Formulários, PDFs & Utils

Repositório com páginas, protótipos e experimentos públicos hospedados via **GitHub Pages**. Aqui ficam projetos rápidos para captura de assinatura, geração de PDF, leitura por câmera (barcode), calculadoras e utilitários front-end — meu laboratório para testes e demos.

---

## 🚀 Demos públicas

> Acesse as demos (quando publicadas via GitHub Pages): `https://claudiohpo.github.io/<PASTA>/`

* **Dev\_pecas** — `Dev_pecas/index.html`
  Formulário de entrega de peças com tabela dinâmica, captura de assinatura (SignaturePad), geração de PDF (jsPDF + AutoTable) e leitura por câmera / barcode (BarcodeDetector + fallback QuaggaJS).
  **Última alteração detectada:** 15/09/2025.

* **Dev\_pecas\_px** — `Dev_pecas_px/index.html`
  Formulário de entrega de peças com tabela dinâmica, captura de assinatura (SignaturePad), geração de PDF (jsPDF + AutoTable) e leitura por câmera / barcode (BarcodeDetector + fallback QuaggaJS).
  **Última alteração detectada:** 15/09/2025.

* **Recibo** — `Recibo/index.html`
  Demo clássica de recibo/entrega com canvas de assinatura e export para PDF. Ideal para testar captura de assinaturas e geração simples de documento.
  **Última alteração detectada:** 21/09/2024 às 01:19.

* **Teste** — `Teste/index.html`
  Calculadora de notas (Fatec Mogi das Cruzes). Interface para adicionar/remover disciplinas e calcular média ponderada (M1*4 + M2*6 / 10) com indicação de aprovado/reprovado.
  **Última alteração detectada:** não informado.

---

## 🧩 Tecnologias e integrações principais

* **HTML5, CSS3, JavaScript** (vanilla)
* **jsPDF** + **jsPDF-AutoTable** — geração e tabela em PDF
* **SignaturePad** — captura e tratamento de assinatura via `<canvas>`
* **BarcodeDetector** (Web API) com fallback **QuaggaJS** — leitura por câmera para preenchimento automático
* Algumas demos incluem otimizações de imagem (pré-load e compressão) para reduzir o tamanho do PDF final


```
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![jsPDF](https://img.shields.io/badge/jsPDF-000000?style=flat)
![SignaturePad](https://img.shields.io/badge/SignaturePad-4A90E2?style=flat)
![QuaggaJS](https://img.shields.io/badge/QuaggaJS-00AEEF?style=flat)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-181717?style=flat&logo=github&logoColor=white)
```

---

## 📁 Estrutura resumida

```
claudiohpo.github.io/ (zip)
├── Dev_pecas/
│   ├── index.html          ← Formulário de Entrega de Peças (assinatura + PDF + camera)
│   ├── css/styles.css
│   └── js/main.js
├── Dev_pecas_px/
│   ├── index.html          ← Variante responsiva / pixel-aware
│   ├── css/
│   └── js/
├── Recibo/
│   └── index.html          ← Recibo: assinatura + PDF (estilos inline)
└── Teste/
    ├── index.html         ← Calculadora de Notas (Fatec MC)
    └── styles/
```

> Observação: cada pasta contém os arquivos principais (`index.html`, `css/`, `js/`) — abra `index.html` para cada demo.

---

## 🧭 Resumo rápido por projeto

### Dev\_pecas

* Formulário com **data**, **nome do recebedor**, **nome técnico** e **tabela dinâmica de itens** (código, número de série, nota fiscal).
* Adição em lote via `textarea` (suporte a separadores `, ; .` e espaços).
* **Leitura por câmera / barcode** (tenta `BarcodeDetector`, se não disponível usa QuaggaJS).
* **Assinatura** (SignaturePad) com tratamento de DPI e otimização para PDF.
* **Geração de PDF**: cabeçalho com logo otimizado, tabela dos itens (AutoTable) e assinatura embutida.

### Dev\_pecas\_px

* Formulário com **data**, **nome do recebedor**, **nome técnico** e **tabela dinâmica de itens** (código, número de série, nota fiscal).
* Adição em lote via `textarea` (suporte a separadores `, ; .` e espaços).
* **Leitura por câmera / barcode** (tenta `BarcodeDetector`, se não disponível usa QuaggaJS).
* **Assinatura** (SignaturePad) com tratamento de DPI e otimização para PDF.
* **Geração de PDF**: cabeçalho com logo otimizado, tabela dos itens (AutoTable) e assinatura embutida.

### Recibo

* Implementação mais enxuta para gerar recibos com assinatura via canvas e export simples para PDF. Boa para testes rápidos.

### Teste (Calculadora de Notas)

* Adicionar/remover disciplinas, calcular média ponderada, exibir situação (aprovado/reprovado).

---

## ▶️ Como testar localmente

1. Clone o repositório:

```bash
git clone https://github.com/claudiohpo/claudiohpo.github.io.git
cd claudiohpo.github.io
```

2. Para testar **recursos que não usam câmera** (assinatura, PDF, cálculo): basta abrir `index.html` no navegador.

3. Para testar **leitura por câmera / BarcodeDetector / Quagga** (recomendado):

   * Rode um servidor local (Live Server do VSCode ou `python -m http.server`) e abra `http://localhost:5500/Dev_pecas/` (ou porta padrão 8000).
   * A API de câmera geralmente exige **contexto seguro**: HTTPS ou `localhost`. Garanta permissão de câmera no navegador.

4. Navegadores recomendados: **Chrome/Edge** (mais consistente com BarcodeDetector e APIs modernas).

---

## 📝 Observações técnicas & dicas

* Se o projeto usar câmera e não abrir a câmera, verifique permissões, contexto seguro (HTTPS/localhost) e se o dispositivo tem suporte a `BarcodeDetector` (ou use fallback com QuaggaJS).
* Otimizações no código tentam reduzir o peso dos PDFs (compressão da assinatura e do logo).
* Caso precise adaptar valores (ex.: valor da hora, configurações), procure nos arquivos `js/main.js` ou nos `input` correspondentes do `index.html`.

---

## ✉️ Contato

* Perfil GitHub: [Cláudio Henrique](https://github.com/claudiohpo)

---

