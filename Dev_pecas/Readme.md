# Formulário de Entrega de Peças

Este projeto é um sistema em **HTML, CSS e JavaScript** para gerenciamento da entrega de peças, incluindo cadastro de informações, assinatura digital e geração de relatórios em PDF.

---

## 🚀 Funcionalidades

- Cadastro de informações principais:
  - Data da entrega
  - Nome do recebedor
  - Nome do técnico responsável
- Registro de peças com:
  - Código da peça
  - Número de série
  - Nota fiscal
- Adição de linhas de forma manual ou em lote (via textarea com separação por vírgula, espaço ou ponto).
- Edição e exclusão de itens já cadastrados.
- Captura de **assinatura digital** diretamente no navegador.
- Geração de **PDF profissional** com todos os dados e logo da empresa.
- Interface responsiva (funciona em **desktop e dispositivos móveis**).
- Estrutura preparada para **leitura de código de barras** (via [QuaggaJS](https://serratus.github.io/quaggaJS/)).

---

## 🛠️ Tecnologias Utilizadas

- **HTML5** → Estrutura da página  
- **CSS3** → Estilização responsiva com media queries  
- **JavaScript (Vanilla)** → Lógica principal  
- **[jsPDF](https://github.com/parallax/jsPDF)** → Geração de PDFs  
- **[jsPDF-Autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)** → Criação de tabelas no PDF  
- **[Signature Pad](https://github.com/szimek/signature_pad)** → Captura da assinatura digital  
- **[QuaggaJS](https://serratus.github.io/quaggaJS/)** (implementação opcional) → Leitura de códigos de barras via câmera  

---

## 📂 Estrutura do Código

- **`<style>` interno**: contém reset de CSS e layout responsivo.  
- **Formulário principal**:
  - Inputs para dados de entrega  
  - Tabela dinâmica para peças  
  - Campos para entrada manual e em lote  
  - Canvas para assinatura  
- **Funções JavaScript**:
  - `addRow()` → Adiciona peça individualmente  
  - `addRowFull()` → Adiciona múltiplas peças via textarea  
  - `editarLinha()` e `excluirLinha()` → Gerenciamento de registros  
  - `limparAssinatura()` → Limpa o canvas de assinatura  
  - `iniciarLeituraCodigo()` → Inicia leitura de código de barras com QuaggaJS  
  - `gerarPDF()` → Exporta PDF com todos os dados formatados  

---

## ▶️ Como Usar

1. Abra o arquivo `index.html` em um navegador moderno (**Chrome recomendado**).  
2. Preencha os campos obrigatórios (data, nomes e peças).  
3. Adicione peças:
   - Usando os campos individuais **Código / Serial / Nota Fiscal**, ou  
   - Usando o campo **texto em lote**, separando cada item por vírgula, espaço ou ponto.  
4. Capture a assinatura no campo de assinatura.  
5. Clique em **"Gerar PDF"** → o arquivo será baixado automaticamente.  

---

## 📱 Responsividade

- Ajuste automático para **celulares (até 375px)**.  
- Suporte para orientação **paisagem** (canvas adaptado).  

---

## 📌 Personalização

- Ajustar limite de linhas por página no PDF → alterar constante `maxRowsPerPage` em `gerarPDF()`.  
- Expandir tipos de código de barras aceitos → configurar `readers` no QuaggaJS.  

---

## 👨‍💻 Autor

- [Cláudio Henrique](https://github.com/claudiohpo)  

📅 Última alteração: **15/09/2025**  

---

## 📄 Licença

Este projeto é de uso **restrito**, todos os direitos reservados © 2025.
"""