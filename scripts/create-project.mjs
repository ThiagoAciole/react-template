#!/usr/bin/env node

import { execSync } from "child_process";
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { createInterface } from "readline";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = resolve(__dirname, "..");

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";

function log(msg) {
  console.log(msg);
}
function success(msg) {
  log(`${GREEN}✔${RESET} ${msg}`);
}
function warn(msg) {
  log(`${YELLOW}⚠${RESET} ${msg}`);
}
function error(msg) {
  log(`${RED}✖${RESET} ${msg}`);
}
function step(msg) {
  log(`\n${BOLD}${msg}${RESET}`);
}

function toKebabCase(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toPascalCase(str) {
  return str
    .replace(/-/g, " ")
    .replace(
      /\w\S*/g,
      (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .replace(/\s/g, "");
}

function isValidName(name) {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name);
}

const IGNORE = ["node_modules", ".git", "dist", ".turbo", "scripts"];

function copyTemplate(src, dest) {
  cpSync(src, dest, {
    recursive: true,
    filter: (source) => {
      const rel = source
        .replace(src, "")
        .replace(/\\/g, "/")
        .replace(/^\//, "");
      return !IGNORE.some(
        (ignored) => rel === ignored || rel.startsWith(ignored + "/")
      );
    },
  });
}

function replaceInFile(filePath, replacements) {
  if (!existsSync(filePath)) return;
  let content = readFileSync(filePath, "utf-8");
  for (const [from, to] of replacements) {
    content = content.replaceAll(from, to);
  }
  writeFileSync(filePath, content, "utf-8");
}

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  log(`\n${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}`);
  log(`${BOLD}${CYAN}║      AcioleUI React Project Creator     ║${RESET}`);
  log(`${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}\n`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  // 1. Pergunta o nome do projeto
  let projectName = "";
  while (!projectName) {
    const raw = await prompt(rl, `${BOLD}Nome do projeto:${RESET} `);
    const name = toKebabCase(raw.trim());

    if (!name) {
      error("Nome não pode ser vazio.");
      continue;
    }
    if (!isValidName(name)) {
      error(
        `Nome inválido: "${name}". Use apenas letras minúsculas, números e hífens.`
      );
      continue;
    }
    projectName = name;
  }

  // 2. Pergunta se quer instalar as dependências
  const installAnswer = await prompt(
    rl,
    `${BOLD}Instalar dependências com npm install? ${DIM}(s/N)${RESET} `
  );
  const shouldInstall = installAnswer.trim().toLowerCase() === "s";

  rl.close();

  const destDir = resolve(TEMPLATE_DIR, "..", projectName);
  const displayName = toPascalCase(projectName);

  if (existsSync(destDir)) {
    error(`O diretório já existe: ${destDir}`);
    process.exit(1);
  }

  log("");

  // Copy template
  step("Copiando template...");
  try {
    copyTemplate(TEMPLATE_DIR, destDir);
    success("Arquivos copiados.");
  } catch (err) {
    error(`Falha ao copiar: ${err.message}`);
    process.exit(1);
  }

  // Update package.json
  step("Configurando package.json...");
  replaceInFile(join(destDir, "package.json"), [
    ['"name": "template"', `"name": "${projectName}"`],
    ['"version": "0.0.0"', '"version": "0.1.0"'],
  ]);
  success("package.json atualizado.");

  // Update index.html
  step("Configurando index.html...");
  replaceInFile(join(destDir, "index.html"), [["Template Web", displayName]]);
  success("index.html atualizado.");

  // Remove .git and package-lock.json from copied project
  step("Limpando arquivos do template...");
  const gitDir = join(destDir, ".git");
  if (existsSync(gitDir)) {
    rmSync(gitDir, { recursive: true, force: true });
  }
  const lockFile = join(destDir, "package-lock.json");
  if (existsSync(lockFile)) {
    rmSync(lockFile);
  }
  success("Arquivos do template removidos.");

  // Generate simple README
  step("Gerando README.md...");
  const readme = `# ${displayName}\n\nProjeto React criado com o template AcioleUI.\n\n## Tecnologias\n\n- React 19\n- TypeScript\n- Vite\n- AcioleUI Components\n\n## Scripts\n\n\`\`\`bash\nnpm start        # inicia o servidor de desenvolvimento\nnpm run build    # build de produção\nnpm run preview  # preview do build\nnpm run lint     # verifica o código\n\`\`\`\n`;
  writeFileSync(join(destDir, "README.md"), readme, "utf-8");
  success("README.md gerado.");

  // Install dependencies (opcional)
  if (shouldInstall) {
    step("Instalando dependências...");
    try {
      execSync("npm install", { cwd: destDir, stdio: "inherit" });
      success("Dependências instaladas.");
    } catch {
      warn("npm install falhou. Execute manualmente no diretório do projeto.");
    }
  }

  // Done
  log(`\n${GREEN}${BOLD}╔══════════════════════════════════════╗${RESET}`);
  log(`${GREEN}${BOLD}║   ✔  Projeto criado com sucesso!     ║${RESET}`);
  log(`${GREEN}${BOLD}╚══════════════════════════════════════╝${RESET}\n`);

  log(`  ${DIM}Acesse o diretório do projeto:${RESET}`);
  log(`    ${CYAN}${BOLD}cd ${destDir}${RESET}\n`);

  if (!shouldInstall) {
    log(`  ${DIM}Instale as dependências:${RESET}`);
    log(`    ${CYAN}${BOLD}npm install${RESET}\n`);
  }

  log(`  ${DIM}Inicie o servidor de desenvolvimento:${RESET}`);
  log(`    ${CYAN}${BOLD}npm start${RESET}\n`);
}

main().catch((err) => {
  error(err.message);
  process.exit(1);
});
