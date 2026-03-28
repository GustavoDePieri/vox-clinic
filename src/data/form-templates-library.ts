import type { LibraryTemplate } from "@/types/form-builder"
import type { FormField } from "@/types/forms"

function field(
  id: string,
  type: FormField["type"],
  label: string,
  order: number,
  opts?: Partial<FormField>
): FormField {
  return { id, type, label, required: false, order, ...opts }
}

function req(
  id: string,
  type: FormField["type"],
  label: string,
  order: number,
  opts?: Partial<FormField>
): FormField {
  return { id, type, label, required: true, order, ...opts }
}

// ─── 1. Anamnese Geral ───

const anamneseGeral: LibraryTemplate = {
  id: "lib-anamnese-geral",
  name: "Anamnese Geral",
  description:
    "Questionario completo de historico medico, medicacoes, alergias, cirurgias e estilo de vida.",
  category: "anamnese",
  specialty: "Geral",
  fields: [
    field("ag-1", "section_header", "Dados Clinicos", 0),
    req("ag-2", "text", "Queixa principal", 1, {
      placeholder: "Descreva o motivo da consulta",
    }),
    field("ag-3", "textarea", "Historia da doenca atual", 2, {
      description: "Descreva a evolucao dos sintomas",
    }),
    field("ag-4", "radio", "Possui doencas cronicas?", 3, {
      options: ["Sim", "Nao"],
    }),
    field("ag-5", "multiselect", "Quais doencas cronicas?", 4, {
      description: "Selecione todas que se aplicam",
      options: [
        "Diabetes",
        "Hipertensao",
        "Asma",
        "Cardiopatia",
        "Depressao/Ansiedade",
        "Tireoide",
        "Outra",
      ],
    }),
    field("ag-6", "section_header", "Medicacoes e Alergias", 5),
    field("ag-7", "textarea", "Medicacoes em uso", 6, {
      placeholder: "Liste todas as medicacoes atuais com dosagem",
    }),
    field("ag-8", "radio", "Possui alergias?", 7, {
      options: ["Sim", "Nao"],
    }),
    field("ag-9", "textarea", "Descreva as alergias", 8, {
      placeholder: "Medicamentos, alimentos, etc.",
    }),
    field("ag-10", "section_header", "Historico Cirurgico", 9),
    field("ag-11", "radio", "Ja realizou alguma cirurgia?", 10, {
      options: ["Sim", "Nao"],
    }),
    field("ag-12", "textarea", "Quais cirurgias?", 11, {
      placeholder: "Descreva as cirurgias e datas aproximadas",
    }),
    field("ag-13", "section_header", "Estilo de Vida", 12),
    field("ag-14", "radio", "Pratica atividade fisica?", 13, {
      options: ["Sim, regularmente", "Sim, esporadicamente", "Nao"],
    }),
    field("ag-15", "radio", "Tabagismo", 14, {
      options: ["Nunca fumou", "Ex-fumante", "Fumante"],
    }),
    field("ag-16", "radio", "Consumo de alcool", 15, {
      options: ["Nao consome", "Social", "Frequente"],
    }),
  ],
}

// ─── 2. Anamnese Odontologica ───

const anamneseOdontologica: LibraryTemplate = {
  id: "lib-anamnese-odonto",
  name: "Anamnese Odontologica",
  description:
    "Historico dentario, habitos bucais, bruxismo, sangramento gengival e mais.",
  category: "anamnese",
  specialty: "Odontologia",
  fields: [
    field("ao-1", "section_header", "Queixa e Historico", 0),
    req("ao-2", "text", "Queixa principal", 1, {
      placeholder: "Motivo da consulta odontologica",
    }),
    field("ao-3", "date", "Ultima consulta odontologica", 2),
    field("ao-4", "radio", "Ja fez tratamento ortodontico?", 3, {
      options: ["Sim", "Nao"],
    }),
    field("ao-5", "section_header", "Saude Bucal", 4),
    field("ao-6", "radio", "Sangramento gengival ao escovar?", 5, {
      options: ["Sim, frequentemente", "As vezes", "Nunca"],
    }),
    field("ao-7", "radio", "Range ou aperta os dentes (bruxismo)?", 6, {
      options: ["Sim", "Nao", "Nao sei"],
    }),
    field("ao-8", "radio", "Usa placa de mordida?", 7, {
      options: ["Sim", "Nao"],
    }),
    field("ao-9", "multiselect", "Sensibilidade dentaria", 8, {
      options: ["Frio", "Calor", "Doces", "Mastigacao", "Nenhuma"],
    }),
    field("ao-10", "rating", "Nivel de ansiedade dental", 9, {
      ratingMax: 10,
      description: "1 = sem ansiedade, 10 = ansiedade extrema",
    }),
    field("ao-11", "section_header", "Saude Geral", 10),
    field("ao-12", "radio", "Esta gravida ou amamentando?", 11, {
      options: ["Gravida", "Amamentando", "Nao", "Nao se aplica"],
    }),
    field("ao-13", "textarea", "Medicacoes em uso", 12, {
      placeholder: "Liste todas as medicacoes atuais",
    }),
    field("ao-14", "radio", "Alergia a anestesico local?", 13, {
      options: ["Sim", "Nao", "Nao sei"],
    }),
  ],
}

// ─── 3. Avaliacao Nutricional ───

const avaliacaoNutricional: LibraryTemplate = {
  id: "lib-avaliacao-nutricional",
  name: "Avaliacao Nutricional",
  description:
    "Habitos alimentares, restricoes, historico de peso, objetivos nutricionais.",
  category: "avaliacao",
  specialty: "Nutricao",
  fields: [
    field("an-1", "section_header", "Objetivos e Historico", 0),
    req("an-2", "text", "Objetivo principal", 1, {
      placeholder: "Ex: Emagrecer, ganhar massa, melhorar saude",
    }),
    field("an-3", "number", "Peso atual (kg)", 2, {
      validation: { min: 20, max: 300 },
      placeholder: "Ex: 72.5",
    }),
    field("an-4", "number", "Altura (cm)", 3, {
      validation: { min: 100, max: 250 },
      placeholder: "Ex: 170",
    }),
    field("an-5", "number", "Peso desejado (kg)", 4, {
      validation: { min: 20, max: 300 },
    }),
    field("an-6", "radio", "Ja fez dieta antes?", 5, {
      options: [
        "Sim, com acompanhamento",
        "Sim, por conta propria",
        "Nao",
      ],
    }),
    field("an-7", "section_header", "Habitos Alimentares", 6),
    field("an-8", "select", "Quantas refeicoes por dia?", 7, {
      options: ["1-2 refeicoes", "3-4 refeicoes", "5-6 refeicoes", "Mais de 6"],
    }),
    field("an-9", "multiselect", "Restricoes alimentares", 8, {
      options: [
        "Lactose",
        "Gluten",
        "Vegetariano",
        "Vegano",
        "Frutos do mar",
        "Nenhuma",
      ],
    }),
    field("an-10", "number", "Litros de agua por dia", 9, {
      validation: { min: 0, max: 10 },
      placeholder: "Ex: 1.5",
    }),
    field("an-11", "radio", "Consome bebida alcoolica?", 10, {
      options: ["Nao", "Socialmente", "Frequentemente"],
    }),
    field("an-12", "section_header", "Rotina e Atividade Fisica", 11),
    field("an-13", "select", "Nivel de atividade fisica", 12, {
      options: [
        "Sedentario",
        "Leve (1-2x/semana)",
        "Moderado (3-4x/semana)",
        "Intenso (5+x/semana)",
      ],
    }),
    field("an-14", "textarea", "Descreva sua rotina alimentar tipica", 13, {
      placeholder:
        "Descreva o que costuma comer no cafe, almoco, jantar e lanches",
    }),
    field("an-15", "textarea", "Observacoes adicionais", 14, {
      placeholder: "Alergias, intolerencias, preferencias...",
    }),
  ],
}

// ─── 4. SOAP (Subjetivo/Objetivo/Avaliacao/Plano) ───

const soapTemplate: LibraryTemplate = {
  id: "lib-soap",
  name: "SOAP",
  description:
    "Nota clinica no formato Subjetivo, Objetivo, Avaliacao e Plano.",
  category: "avaliacao",
  specialty: "Geral",
  fields: [
    field("soap-1", "section_header", "S — Subjetivo", 0),
    field("soap-2", "rich_text", "Relato do paciente sobre seus sintomas, queixas e historico.", 1),
    req("soap-3", "textarea", "Queixa principal e historia", 2, {
      placeholder: "O que o paciente relata? Inicio, duracao, intensidade dos sintomas...",
    }),
    field("soap-4", "rating", "Intensidade dos sintomas", 3, {
      ratingMax: 10,
      description: "1 = ausente, 10 = insuportavel",
    }),
    field("soap-5", "section_header", "O — Objetivo", 4),
    field("soap-6", "rich_text", "Dados objetivos do exame fisico e exames complementares.", 5),
    field("soap-7", "textarea", "Exame fisico", 6, {
      placeholder: "Sinais vitais, achados do exame fisico...",
    }),
    field("soap-8", "textarea", "Exames complementares", 7, {
      placeholder: "Resultados de exames laboratoriais, imagem...",
    }),
    field("soap-9", "section_header", "A — Avaliacao", 8),
    field("soap-10", "textarea", "Diagnostico / Hipotese diagnostica", 9, {
      placeholder: "Impressao clinica, diagnosticos diferenciais...",
    }),
    field("soap-11", "section_header", "P — Plano", 10),
    field("soap-12", "textarea", "Plano terapeutico", 11, {
      placeholder: "Prescricoes, orientacoes, encaminhamentos, retorno...",
    }),
  ],
}

// ─── 5. Ficha de Retorno ───

const fichaRetorno: LibraryTemplate = {
  id: "lib-ficha-retorno",
  name: "Ficha de Retorno",
  description:
    "Formulario breve para consultas de retorno — evolucao, adesao ao tratamento, novas queixas.",
  category: "retorno",
  specialty: "Geral",
  fields: [
    field("fr-1", "section_header", "Evolucao", 0),
    req("fr-2", "radio", "Como voce esta se sentindo desde a ultima consulta?", 1, {
      options: [
        "Muito melhor",
        "Melhor",
        "Igual",
        "Pior",
        "Muito pior",
      ],
    }),
    field("fr-3", "textarea", "Descreva a evolucao dos sintomas", 2),
    field("fr-4", "section_header", "Tratamento", 3),
    field("fr-5", "radio", "Seguiu o tratamento prescrito?", 4, {
      options: [
        "Sim, integralmente",
        "Parcialmente",
        "Nao consegui seguir",
      ],
    }),
    field("fr-6", "textarea", "Dificuldades com o tratamento", 5, {
      placeholder: "Efeitos colaterais, esquecimentos, etc.",
    }),
    field("fr-7", "section_header", "Novas Queixas", 6),
    field("fr-8", "radio", "Surgiu alguma queixa nova?", 7, {
      options: ["Sim", "Nao"],
    }),
    field("fr-9", "textarea", "Descreva as novas queixas", 8, {
      placeholder: "Novos sintomas ou preocupacoes",
    }),
    field("fr-10", "textarea", "Observacoes do profissional", 9, {
      description: "Uso exclusivo do profissional",
    }),
  ],
}

// ─── Export all templates ───

export const LIBRARY_TEMPLATES: LibraryTemplate[] = [
  anamneseGeral,
  anamneseOdontologica,
  avaliacaoNutricional,
  soapTemplate,
  fichaRetorno,
]

export const LIBRARY_SPECIALTIES = [
  "Geral",
  "Odontologia",
  "Nutricao",
] as const

export function getTemplatesBySpecialty(
  specialty: string
): LibraryTemplate[] {
  return LIBRARY_TEMPLATES.filter((t) => t.specialty === specialty)
}

export function getTemplateById(
  id: string
): LibraryTemplate | undefined {
  return LIBRARY_TEMPLATES.find((t) => t.id === id)
}
