# Sistema de SVG Temável

## Logo

A logo foi extraída de `assets/svg/logo 5x5.svg` e consolidada em um único componente React:
`packages/shared/src/components/Logo.tsx`

O componente usa `fill="currentColor"` e `style={{ color: 'var(--color-primary)' }}`, herdando a cor do tema automaticamente. Os arquivos SVG originais da logo não são importados pelo app.

## Ilustrações grandes (Halftone)

Os arquivos `caveira 16x9.svg` (~4.7MB), `caveira .svg` (~2.5MB) e `efeito 5.svg` (~5MB) são ilustrações estilo halftone com milhares de elementos.

**Decisão do projeto:** Os SVGs serão mantidos como estão, sem compressão. Quando forem usados no app, devem ser aplicados como máscara CSS para preservar o efeito de troca de cor com o tema:

```css
.hero-illustration {
  -webkit-mask-image: url('/illustrations/skull.webp');
  mask-image: url('/illustrations/skull.webp');
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  background-color: var(--color-primary);
}
```

Se no futuro for necessário otimizar o carregamento, converter para WebP:
```bash
rsvg-convert -w 1920 -h 1080 -f png assets/svg/caveira\ 16x9.svg -o assets/svg/caveira.png
cwebp -q 80 assets/svg/caveira.png -o apps/web/public/illustrations/skull.webp
```

## SVGs leves (efeitos)

Os arquivos `efeito 1.svg` (~71KB), `efeito 2.svg` (~15KB), `efeito 3.svg` (~207KB) e `efeito 4.svg` (~94KB) são formas leves e podem ser usados diretamente como SVG.

Ao usar no app, garantir que usam `stroke="currentColor"` ou `fill="currentColor"` em vez de hex fixo, para herdar a cor do tema.

## Regra geral

Todo componente visual deve consumir as variáveis CSS (`var(--color-primary)` etc), nunca hex fixo no código.
