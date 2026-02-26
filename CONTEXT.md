# CONTEXT.md — Escalas IBSC

## Visão Geral

**Escalas IBSC** é um sistema de gerenciamento de escalas musicais para igrejas, construído como uma aplicação web full-stack. O sistema permite cadastrar membros (músicos/ministros), criar e gerenciar escalas de culto atribuindo membros a instrumentos específicos, e visualizar/exportar essas escalas.

---

## Stack Tecnológica

| Camada          | Tecnologia                                   |
| --------------- | -------------------------------------------- |
| **Framework**   | Next.js 16 (App Router)                      |
| **Linguagem**   | TypeScript 5                                 |
| **UI**          | React 19, Radix UI (shadcn/ui), Lucide Icons |
| **Estilização** | Tailwind CSS 4, tailwindcss-animate          |
| **ORM**         | Prisma 7 (com `@prisma/adapter-pg`)          |
| **Banco**       | PostgreSQL 15 (via Docker)                   |
| **PDF**         | jsPDF + jspdf-autotable                      |
| **Datas**       | date-fns (locale pt-BR)                      |
| **Tema**        | next-themes (dark/light mode)                |
| **Deploy**      | Vercel                                       |

---

## Modelo de Domínio

### Tipos Principais (`lib/domain/types.ts`)

```typescript
type Instrument =
  | "Voz"
  | "Violão"
  | "Guitarra"
  | "Baixo"
  | "Teclado"
  | "Bateria"
  | "Cajon"
  | "Ministro";
type ServiceType = "Manhã" | "Noite" | "Especial";

interface MemberUnavailability {
  id: string;
  memberId: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
}

interface Member {
  id: string;
  name: string;
  instruments: Instrument[]; // Instrumentos que o membro toca
  unavailabilities?: MemberUnavailability[];
}

interface ScaleMember {
  member?: Member; // Opcional para suportar "Vagas"
  instrument: Instrument;
}

interface ScaleEntry {
  id: string;
  date: string; // ISO string ou YYYY-MM-DD
  service: ServiceType; // Tipo do culto
  members: ScaleMember[];
}

interface ScaleTemplate {
  id: string;
  description: string;
  dayOfWeek: number; // 0-6 (Domingo-Sábado)
  service: ServiceType;
  requiresConfirmation: boolean;
  instruments: Instrument[];
  active: boolean;
}
```

### Relacionamentos (Prisma)

```
Member 1──N ScaleMember N──1 ScaleEntry
```

- Um **Member** pode participar de várias escalas (via `ScaleMember`).
- Uma **ScaleEntry** (escala de culto) possui vários membros com seus respectivos instrumentos.
- A deleção de uma escala remove os `ScaleMember` associados em cascata.
- A deleção de um membro é restrita se ele estiver em alguma escala.

---

## Arquitetura

O projeto segue o padrão **Repository** com separação clara de camadas:

```
lib/
├── domain/
│   ├── types.ts          # Tipos e interfaces do domínio
│   └── interfaces.ts     # Contratos dos repositórios (IMemberRepository, IScaleRepository)
├── infrastructure/
│   ├── prisma.ts         # Instância do Prisma Client
│   ├── prismaRepository.ts  # Implementação concreta dos repositórios com Prisma
│   └── factory.ts        # RepositoryFactory (Singleton)
├── actions/
│   ├── members.ts        # Server Actions: getMembers, addMember, updateMember, deleteMember
│   ├── scales.ts         # Server Actions: getScales, saveScale, deleteScale, getScalesByMonth
│   └── templates.ts      # Server Actions: CRUD de modelos e geração automática de escalas
└── utils/
    ├── pdf-export.ts     # Exportação de escalas para PDF
    └── scale-alerts.ts   # Alertas inteligentes na criação/edição de escalas
```

### Fluxo de Dados

```
UI (React Component) → Server Action → RepositoryFactory → PrismaRepository → PostgreSQL
```

As **Server Actions** (Next.js `"use server"`) servem como camada de aplicação, chamando os repositórios via `repositoryFactory` e invalidando cache com `revalidatePath`.

---

## Estrutura de Diretórios

```
escalas-ibsc/
├── app/
│   ├── layout.tsx          # Layout raiz (ThemeProvider, fontes)
│   ├── page.tsx            # Página principal — visualização das escalas com filtros e exportação PDF
│   ├── globals.css         # Estilos globais + variáveis de tema (shadcn/ui)
│   └── admin/
│       └── page.tsx        # Painel administrativo — CRUD de membros e escalas
├── components/
│   ├── theme-provider.tsx     # Provider de tema (next-themes)
│   ├── scale-alert-badge.tsx  # Componentes de alertas (ScaleAlertIcon, ScaleAlertPanel)
│   └── ui/                    # Componentes shadcn/ui (Button, Card, Dialog, Input, Label, Select, Table, Tabs, Badge)
├── lib/                    # Lógica de negócio e infraestrutura (ver seção Arquitetura)
├── prisma/
│   ├── schema.prisma       # Schema do banco de dados
│   └── migrations/         # Migrações do Prisma
├── generated/
│   └── prisma/             # Cliente Prisma gerado
├── public/                 # Assets estáticos
├── docker-compose.yml      # PostgreSQL 15 (dev)
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## Páginas da Aplicação

### `/` — Página Principal (Visualização)

- Lista todas as escalas cadastradas.
- Filtros por mês, tipo de culto e membro.
- Ícones visuais por instrumento (Lucide Icons).
- Botão de **exportação para PDF** (respeitando filtros aplicados).

### `/admin` — Painel Administrativo

- **Aba Membros**: Cadastro, edição e exclusão de integrantes, com associação de **instrumentos** que cada um toca e registro de **indisponibilidades** (períodos de ausência).
- **Aba Escalas**: Criação e edição de escalas.
  - **Filtro por Mês**: Visualização filtrada das escalas de um mês específico.
  - **Geração Automática**: Botão para gerar todas as escalas do mês selecionado a partir dos modelos ativos.
  - **Deduplicação**: O sistema evita criar escalas duplicadas para o mesmo dia/horário.
- **Aba Modelos**: Gerenciamento de templates (cultos recorrentes) para automação.
- **Alertas inteligentes** exibidos na lista de escalas e dentro do dialog de edição:
  - 🛑 **Indisponibilidade (Crítico)** — membro foi escalado em um **dia (data)** onde registrou indisponibilidade, ignorando restrições de horas ou qual tipo de culto está sendo escalado.
  - 🔴 **Vaga em aberto (Crítico)** — escalas com instrumentos sem músicos escalados.
  - ⚠️ **Sobrecarga por instrumento** — membro toca um instrumento com frequência acima da média vs. demais.
  - ⚠️ **Sobrecarga total** — frequencia excessiva em várias escalas recentes.
  - ⚠️ **Escalas consecutivas** — membro escalado 2+ vezes seguidas.
  - ⚠️ **Escala sem Voz** — nenhum integrante com instrumento "Voz".
  - ℹ️ **Membro inativo** — sugestão de membros que não participam há 4+ semanas.

---

## Configuração do Ambiente de Desenvolvimento

### Pré-requisitos

- Node.js (compatível com Next.js 16)
- Docker (para o banco PostgreSQL)

### Passos

```bash
# 1. Subir o banco de dados
docker-compose up -d

# 2. Instalar dependências (também gera o Prisma Client via postinstall)
npm install

# 3. Executar migrações
npx prisma migrate dev

# 4. Iniciar o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente (`.env`)

O arquivo `.env` deve conter a URL de conexão com o PostgreSQL (variável `DATABASE_URL`).

---

## Convenções do Projeto

- **Idioma do domínio**: Português brasileiro (nomes de instrumentos, tipos de culto, labels).
- **Idioma do código**: Inglês (nomes de variáveis, funções, interfaces).
- **Componentes UI**: Baseados em shadcn/ui (Radix + Tailwind), localizados em `components/ui/`.
- **Server Actions**: Toda comunicação com o banco é feita via Server Actions em `lib/actions/`.
- **Revalidação**: Após mutações, os paths relevantes (`/`, `/admin`) são revalidados com `revalidatePath`.
- **IDs**: UUID v4 gerados pelo banco (Prisma `@default(uuid())`).
