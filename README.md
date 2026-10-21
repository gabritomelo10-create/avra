# AVRA Incorporadora — Identidade Visual Interativa

Apresentação interativa do Guia de Identidade Visual v10 da AVRA (Britto Group).

## Como abrir
Site estático, sem build. Abra `index.html` direto no navegador ou sirva a pasta:

```bash
python3 -m http.server 8000   # http://localhost:8000
```

Todas as bibliotecas (Three.js r147, GSAP + ScrollTrigger, Lenis) e fontes (Tenor Sans, Manrope — OFL) estão em `assets/` — funciona offline.

## Seções
- **Hero 3D** — assinatura extrudada (face marfim, laterais em dourado suave) construída por um feixe de luz; arraste para girar; luzes quentes seguem o cursor; partículas com desfoque de profundidade e pattern BR20 em parallax.
- **Nome / Conceito / Posicionamento** — capas com parallax e zoom, αύρα ↔ AVRA, cartões com tilt 3D e brilho.
- **Construção da assinatura** — sequência fixada no scroll: grade, diagonais, arcos, contorno, preenchimento e abertura óptica A/V.
- **Contrastes e proteção** — troca de versões, área de proteção e teste de redução.
- **Tipografia** — peso variável da Manrope, texto editável.
- **Paleta** — amostras expansíveis (clique copia o HEX), combinações e contraste.
- **BR20** — pattern procedural animado e interativo (o cursor desvia a brisa), com temperaturas e ritmo.
- **Estúdio 3D** — mockups refeitos em 3D: crachá (balança), kit (abre), portfólio + envelope (abre), smartphone com story animado, placa de obra (anoitece). Sombra de folhas balançando.
- **Aplicações físicas** — galeria horizontal com parallax e lightbox (12 mockups do guia).
- **Digital** — carrossel 3D arrastável (Instagram, WhatsApp, LinkedIn).
- **Diretrizes** — usos incorretos demonstrados no hover, direção fotográfica, arquivos e produção.

## Notas
- `assets/js/logo-data.js` / `assets/avra-wordmark.svg`: vetorização da assinatura a partir da referência do guia — não substitui a homologação do mestre em curvas.
- Mockups e fotos foram extraídos do PDF do guia e são simulações visuais.
