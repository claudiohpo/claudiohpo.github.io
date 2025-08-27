# 🌐 claudiohpo.github.io

Repositório que hospeda páginas, protótipos e testes públicos via **GitHub Pages**.  
Este é meu playground para experimentar formulários, geração de PDF, captura de assinaturas e pequenos utilitários front-end.  

---

## 🚀 Demos públicas
- **Recibo** — Formulário com captura de assinatura e geração de PDF.  
  `Recibo/index.html` — Demo: `https://claudiohpo.github.io/Recibo/`  
- **Teste** — Calculadora de notas (FATEC MC).  
  `Teste/index.html` — Demo: `https://claudiohpo.github.io/Teste/`

---

## 🛠 Tecnologias & Badges

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![jsPDF](https://img.shields.io/badge/jsPDF-000000?style=flat)
![SignaturePad](https://img.shields.io/badge/SignaturePad-4A90E2?style=flat)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-181717?style=flat&logo=github&logoColor=white)

> Principais libs detectadas nos arquivos: `jsPDF`, `jspdf-autotable`, `signature_pad`.  
> Páginas escritas em **HTML/CSS/JS** sem ferramenta de build (arquivos estáticos).

---

## 📁 Estrutura resumida (detectada)

```
claudiohpo.github.io/
├── Recibo/
│   ├── index.html          ← Formulário entrega de peças (assinatura + PDF)
│   └── Readme.md
└── Teste/
    ├── index.html         ← Calculadora de notas (Fatec MC)
    ├── styles/
    └── scripts/
```

---

## 🧩 Detalhes dos projetos

### 🔖 Recibo
- Local: `Recibo/index.html`  
- Funcionalidades: formulário com campos de entrega, assinatura via canvas (SignaturePad) e geração de PDF (jsPDF).

### 🧮 Teste (Calculadora de Notas)
- Local: `Teste/index.html`  
- Funcionalidades: adicionar/remover disciplinas, calcular média ponderada (M1*4 + M2*6 / 10), indicar aprovação/reprovação.

---

## 📸 Snapshots

Abaixo estão alguns snapshots (imagens retiradas do repositório) — abrir os arquivos em `snapshots/` para visualizá-los.

![Snapshot](snapshots/snapshot1.jpg)


---

## ▶️ Como testar localmente

1. Clone o repositório:
```bash
git clone https://github.com/claudiohpo/claudiohpo.github.io.git
cd claudiohpo.github.io
```

2. Abra localmente os arquivos:
- `Recibo/index.html` ou `Teste/index.html` em seu navegador (ou use extensão Live Server no VSCode).

---

## ✅ Sugestões rápidas
- Organizar `assets/` para imagens e logos.
- Adicionar `.gitignore` para evitar subir `.idea/` e arquivos temporários.
- Incluir ARIA attributes e melhorar contrastes para aumentar acessibilidade.
- Definir licença (ex: `MIT`) se desejar abrir o código.

---

## ✉️ Contato
Perfil: https://github.com/claudiohpo

---

*README gerado automaticamente pelo assistente. Se quiser ajustes (texto, mais badges, mudar snapshots selecionados ou incluir screenshots novas), diga quais mudanças deseja e eu atualizo o arquivo.*
