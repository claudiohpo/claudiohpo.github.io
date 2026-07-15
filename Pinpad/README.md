# Rollout PinPad

Página estática (HTML/CSS/JS puro, sem build) para padronizar o registro de instalação/rollout de PinPad: foto + texto formatado, prontos para enviar via WhatsApp.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub e envie **todos** os arquivos mantendo a estrutura:
   - `index.html`, `css/`, `js/`
   - `favicon.svg`, `favicon-96x96.png`, `favicon.ico`, `apple-touch-icon.png`
   - `site.webmanifest`
   - `icons/` (ícones usados ao instalar como app no Android)
2. Em **Settings → Pages**, selecione a branch (ex.: `main`) e a pasta raiz (`/`).
3. Acesse a URL gerada (ex.: `https://seuusuario.github.io/rollout-pinpad/`).

## Ícone / instalar como app (Android e iOS)
O projeto já vem com o conjunto completo de ícones para funcionar como um app instalável (PWA):
- `favicon.svg` / `favicon-96x96.png` / `favicon.ico` — ícone da aba do navegador.
- `apple-touch-icon.png` (180×180) — ícone ao adicionar à tela inicial no iPhone/iPad.
- `icons/android-chrome-192x192.png` e `icons/android-chrome-512x512.png` — ícone padrão no Android.
- `icons/maskable-icon-192x192.png` e `icons/maskable-icon-512x512.png` — versão "maskable", com a arte recuada para dentro da área segura, para o Android não cortar o desenho ao aplicar o formato adaptativo (círculo, quadrado arredondado, etc. dependendo do launcher do aparelho).
- `site.webmanifest` — define nome, cor de tema e os ícones acima, permitindo o Chrome no Android oferecer "Instalar app" / "Adicionar à tela inicial", abrindo em modo standalone (sem barra de endereço, como um app nativo).

Se quiser trocar as cores/desenho do ícone, edite `favicon.svg` (é o mesmo desenho usado como base para gerar todos os PNGs).

## Como funciona
- **Foto**: toque no quadro para abrir a câmera ou a galeria (o próprio navegador do celular oferece as duas opções).
- **Mesmo Host / Outro Host**: "Mesmo Host" já vem selecionado. Ao marcar "Outro Host", aparece o campo **Novo hostname** (nº da nova estação).
- **Agência / Posto / Estação**: preenchimento só numérico, completado automaticamente com zeros à esquerda ao sair do campo (posto vazio vira `000`).
- **S/N Antigo / S/N Novo**: digite só os números — os traços da máscara `XXX-XXX-XXX` são aplicados automaticamente. O botão ao lado abre a câmera e lê o código de barras (usa a API nativa `BarcodeDetector`; se o navegador não suportar, usa a biblioteca Quagga como alternativa — a mesma abordagem do seu projeto de devolução de peças).
- **Responsável / Matrícula**: nome livre + matrícula com 7 dígitos.
- O texto é montado **em tempo real** no recibo à direita (ou acima, no celular), no formato:

```
Agência: 9999
Hostname: 9999-999-E999
S/N Novo: 999-999-999
S/N Antigo: 999-999-999
Responsável: Nome
Matrícula: 9999999
```

  ou, com "Outro Host" marcado:

```
Agência: 9999
Hostname: 
De: 9999-999-E999
Para: 9999-999-E999
S/N Novo: 999-999-999
S/N Antigo: 999-999-999
Responsável: Nome
Matrícula: 9999999
```

## Sobre copiar texto + foto juntos
Os navegadores **não** têm suporte confiável para colar texto e imagem numa única ação dentro do campo de mensagem do WhatsApp — cada aplicativo aceita apenas um tipo por vez na área de transferência.

Por isso o botão **"Compartilhar no WhatsApp"** usa a *Web Share API* (`navigator.share`), que é o mecanismo nativo do Android/iOS: ela abre a folha de compartilhamento do sistema já com a foto **e** o texto juntos, prontos para escolher o WhatsApp e enviar como legenda da imagem. Esse caminho funciona bem no Chrome/Safari mobile.

Em navegadores desktop, onde essa API normalmente não está disponível para arquivos, o botão cai automaticamente para o modo alternativo: copia o texto para a área de transferência e baixa a foto, para que você cole o texto e anexe a foto manualmente no WhatsApp Web.

Há também um botão **"Copiar somente texto"**, útil quando não há foto anexada ou quando você só precisa do texto.

## Tema
O botão no canto superior direito alterna entre modo escuro (padrão) e claro. A preferência fica salva no navegador.

## Compatibilidade
- Leitura de código de barras por câmera: melhor em **Chrome/Edge Android** (API `BarcodeDetector` nativa). Em navegadores sem essa API, usa Quagga automaticamente.
- Câmera/galeria e Web Share (foto + texto juntos): funcionam melhor em **navegadores mobile** (Chrome/Safari). Em desktop, o app usa o fallback (copiar texto + baixar foto).
