# 🏎️ BDL Car Viewer - 3D Customizer & Interactive Experience

![Versão](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Svelte](https://img.shields.io/badge/Svelte-5-orange.svg)
![Three.js](https://img.shields.io/badge/Three.js-r182-black.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

O **BDL Car Viewer** é uma plataforma interativa de visualização e customização de veículos em 3D, desenvolvida com as tecnologias mais modernas do ecossistema web. O projeto combina a reatividade do **Svelte 5** com o poder gráfico do **Three.js** para entregar uma experiência imersiva e performática diretamente no navegador.

---

## ✨ Funcionalidades Principais

### 🎨 Customização em Tempo Real
*   **Seleção de Partes:** Clique diretamente no modelo 3D para selecionar componentes específicos (Carroceria, Interior, Rodas).
*   **Paleta Dinâmica:** Altere as cores instantaneamente com feedback visual imediato.

### 🎥 Experiência Cinemática
*   **Modo Auto-Rotate:** Rotação automática inteligente que alterna entre diferentes ângulos de câmera (Frontal, Lateral, Interior, Top-Down).
*   **Cores Automáticas:** Ciclo de cores automático para demonstração de design.
*   **Transições Suaves:** Movimentação de câmera fluida (Lerp) entre pontos de interesse.

### 🧪 Shader Lab
*   Um ambiente experimental integrado para testar shaders customizados e efeitos visuais avançados fora da cena principal do veículo.

### 🎵 Sistema de Áudio Imersivo
*   Player de música integrado com suporte a sequenciamento, sincronizado com a inicialização da experiência ("Start Engine").

### 🌍 Internacionalização (i18n)
*   Suporte completo para **Português**, **Inglês** e **Espanhol**, permitindo uma experiência acessível globalmente.

### 🔒 Carregamento Seguro de Modelos
*   Sistema exclusivo de carregamento de assets criptografados utilizando **AES-256-GCM**, protegendo a propriedade intelectual dos modelos 3D (`.enc`).

---

## 🛠️ Stack Tecnológica

*   **Frontend:** [Svelte 5](https://svelte.dev/) (Runes, Snippets)
*   **3D Engine:** [Three.js](https://threejs.org/)
*   **UI & Styling:** [Skeleton UI v3](https://skeleton.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
*   **Internacionalização:** `svelte-i18n`
*   **Segurança:** Web Crypto API (Decriptografia em tempo real)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Testes:** [Vitest](https://vitest.dev/) (Unitários) e [Playwright](https://playwright.dev/) (E2E)

---

## 📂 Estrutura do Projeto

```text
src/
├── components/          # Componentes Svelte (Viewer, UI, Seletores)
├── lib/
│   ├── locales/         # Dicionários de tradução (PT, EN, ES)
│   └── i18n.ts          # Configuração do sistema de idiomas
├── styles/              # Variáveis CSS globais e temas
├── App.svelte           # Orquestrador principal da aplicação
└── main.ts              # Ponto de entrada
public/                  # Assets estáticos e modelos 3D (.glb, .enc)
scripts/                 # Scripts utilitários (Criptografia de modelos)
```

---

## 🚀 Como Iniciar

### Pré-requisitos
*   Node.js (v20 ou superior)
*   npm ou pnpm

### Instalação
1. Clone o repositório:
   ```bash
   git clone https://github.com/bdlassetto/bdlassetto.github.io.git
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

### Scripts Disponíveis
*   `npm run dev`: Inicia o ambiente de desenvolvimento.
*   `npm run build`: Gera a versão otimizada para produção.
*   `npm run test`: Executa os testes unitários com Vitest.
*   `npm run e2e`: Executa os testes de ponta a ponta com Playwright.
*   `npm run check`: Valida tipos TypeScript e estrutura Svelte.

---

## 🔐 Segurança e Assets

Para proteger os modelos 3D, utilizamos um script de pré-processamento que converte arquivos `.glb` em `.enc` (criptografados).

**Para criptografar um novo modelo:**
1. Coloque seu arquivo `.glb` na pasta `public/`.
2. Execute o script:
   ```bash
   node scripts/encrypt-model.cjs
   ```
3. O arquivo resultante será carregado e decriptografado pela aplicação utilizando a chave configurada no `ThreeViewer.svelte`.

---

## 🧪 Qualidade de Código

O projeto mantém um alto padrão de qualidade com testes automatizados:

*   **Unitários:** Validam a lógica de internacionalização, troca de temas e estados de componentes.
*   **E2E:** Simulam o fluxo do usuário, garantindo que o viewer carregue corretamente e os seletores funcionem em múltiplos navegadores.
*   **Acessibilidade:** Testes integrados para garantir conformidade com padrões ARIA.

---

## 📦 Deploy

O deploy é realizado automaticamente via **GitHub Actions** para o **GitHub Pages** sempre que um push é feito na branch `main`, após a passagem bem-sucedida de todos os testes.

---

## 👥 Founders

O projeto foi idealizado e construído por:

*   **Pace (Patrick Serrano):** Software Engineer + Developer. Responsável pela arquitetura de software, lógica de interface reativa, integração 3D e sistemas de segurança.
*   **Alface (Yamandu Justen):** 3D Modeller. Responsável pela criação, otimização e refinamento estético de todos os modelos tridimensionais da experiência.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---
*Desenvolvido com ❤️ por [BDL](https://github.com/bdlassetto)*
