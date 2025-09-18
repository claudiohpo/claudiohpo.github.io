
# 📦 Formulário de Entrega de Peças

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![jsPDF](https://img.shields.io/badge/jsPDF-000000?style=flat-square&logo=javascript&logoColor=white)
![jsPDF-AutoTable](https://img.shields.io/badge/jsPDF--AutoTable-2F4F4F?style=flat-square&logo=jsdelivr&logoColor=white)
![QuaggaJS](https://img.shields.io/badge/QuaggaJS-00AEEF?style=flat-square&logo=quagga&logoColor=white)
![SignaturePad](https://img.shields.io/badge/SignaturePad-6f42c1?style=flat-square&logo=signature-pad&logoColor=white)

> Sistema leve em **HTML / CSS / JavaScript** para registrar entregas de peças, capturar assinatura no navegador e gerar PDF com relatório. ✨📄

---

## 🚀 Principais funcionalidades

- Formulário com campos:
  - **Data**, **Nome do Recebedor**, **Nome Técnico**.  
- Tabela dinâmica de itens (cada linha: **Código da Peça**, **Número de Série**, **Nota Fiscal**) com **Editar** e **Excluir**.  
- Inclusão manual (campo individual) ou em **lote** (textarea) — o campo em lote aceita entradas separadas por `, . ;` ou espaços e insere múltiplas linhas.  
- **Leitura por câmera** para preencher os campos (ícone de câmera ao lado dos inputs). Implementa **BarcodeDetector** nativo quando disponível (mais rápido em Chrome Android) e faz **fallback para QuaggaJS** quando necessário. O preview da câmera aparece em um **modal**.  
  - **Regra especial para `inputCompleto`**: a **primeira leitura** define o conteúdo; leituras seguintes **acrescentam** o novo código separado por vírgula (não substituem).  
- **Assinatura digital** via canvas com tratamento de DPI para qualidade em dispositivos móveis.  
- **Geração de PDF** profissional com:
  - Cabeçalho (título, data, nomes) e logo (logo é pré-carregada e otimizada para reduzir o tamanho do PDF).  
  - Tabela com os itens (usa `jsPDF` + `autotable`).  
  - Assinatura embutida (convertida/otimizada para JPEG para reduzir peso).  
- Interface responsiva (desktop e mobile) e layout dos inputs com botão de câmera na mesma linha (sem quebra). ✅

---

## 🧭 Arquivos principais

- `index.html` — estrutura do formulário, inclusão de bibliotecas (jsPDF, jsPDF-Autotable, Signature Pad, QuaggaJS) e modal de câmera.  
- `css/styles.css` — estilos responsáveis pela responsividade, layout das linhas com botão-câmera e pelo modal da câmera.  
- `js/main.js` — lógica completa:
  - manipulação do canvas (ajuste DPI), desenho de assinatura;  
  - adição/edição/exclusão de linhas;  
  - leitura por câmera com **BarcodeDetector** + fallback **QuaggaJS** e comportamento de preenchimento;  
  - pré-load e otimização do logo;  
  - geração do PDF com `jsPDF` + `autotable`.  

---

## ▶️ Como usar (rápido)

1. Abra `index.html` em um navegador moderno (recomendo Chrome).  
2. Preencha **Data** / **Nome do Recebedor** / **Nome Técnico**.  
3. Para adicionar peças:
   - Preencha `Código da Peça`, `Número de Série` (e opcionalmente `Nota Fiscal`) e clique em **Adicionar**; ou  
   - Use o **textarea** (`inputCompleto`) para inserir vários registros (sequência: `Código, Serial, Nota`) e clique em **Adicionar (vários)**.  
4. Para usar a câmera: clique no ícone de câmera ao lado do campo desejado → a câmera abre em modal; aproxime o código e aguarde a detecção. Quando o código é lido, o modal fecha e o campo é preenchido (para `inputCompleto`, valores adicionais são **acrescentados** separados por vírgula).  
5. Faça a assinatura no canvas. Se precisar, use **Limpar Assinatura**.  
6. Clique em **Gerar PDF** → o arquivo será baixado automaticamente (logo otimizado + tabela + assinatura). 🎯

---

## 📝 Observações técnicas

- **BarcodeDetector**: o código tenta usar a API nativa (`BarcodeDetector`) primeiro (mais rápida em navegadores modernos). Caso não exista, inicializa QuaggaJS como fallback. Se nenhum suporte, o usuário recebe aviso.  
- **Modal de câmera**: existe um modal (`#cameraPreviewModal`) com `<video>` para preview (fechar com botão "✕").  
- **Comportamento `inputCompleto`**: o código atual insere `existing + ", " + code` — ou seja, **acrescenta** a nova leitura separada por vírgula (prevenção simples de duplicatas exatas está aplicada).  
- **Otimização do logo**: o script tenta pré-carregar o logo (`assets/images/logosmall2.png`) e otimizar sua largura (ex.: 300px) para reduzir o tamanho do PDF. Caso o preload falhe, há fallback.  
- **Assinatura e DPI**: o canvas é redimensionado com base no `devicePixelRatio` para ficar nítido em telas de alta densidade; depois é otimizada para JPEG antes de embutir no PDF.  

---

## 🛠️ Personalizações fáceis que você pode querer
 
- Ajustar formatos aceitos pelo `BarcodeDetector` ou `readers` do Quagga (para suportar tipos adicionais).  
- Alterar limite de linhas por página no PDF → editar `maxRowsPerPage` na função de geração de PDF (em `main.js`).  
- Ajustar tamanho do ícone de câmera via `.btn-camera svg` no `styles.css`.  

---

## ✅ Testes recomendados

- Chrome Mobile (Android): testar leitura com `BarcodeDetector`.  
- Navegador sem `BarcodeDetector`: verificar fallback Quagga.  
- Gerar PDF com 0, 5 e 50 linhas para validar paginação.  
- Testar assinatura em telas com devicePixelRatio alto (ex.: dispositivos modernos) para checar nitidez.

---

## 👨‍💻 Autor & Contato

- **Cláudio Henrique** — [GitHub](https://github.com/claudiohpo)  
- Última alteração do projeto (arquivos): 15/09/2025.

---

## 📄 Licença

Uso restrito — todos os direitos reservados © 2025.  