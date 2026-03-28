"use client"

import { BlurFade } from "@/components/ui/blur-fade"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "O VoxClinic funciona com minha especialidade?",
    answer:
      "Sim! O VoxClinic se adapta automaticamente a sua profissão durante o onboarding. Já atendemos dentistas, médicos, nutricionistas, esteticistas e advogados, com vocabulário e campos específicos para cada área.",
  },
  {
    question: "Preciso de internet para gravar?",
    answer:
      "Sim, a gravação e o processamento ocorrem online para garantir a melhor qualidade de transcrição. O áudio é enviado diretamente para processamento, sem armazenamento local.",
  },
  {
    question: "Meus dados ficam seguros?",
    answer:
      "Absolutamente. Todos os dados são armazenados em infraestrutura brasileira (sa-east-1), com consentimento LGPD obrigatório, auditoria completa e URLs de áudio com expiração de 5 minutos.",
  },
  {
    question: "Posso experimentar antes de pagar?",
    answer:
      "Sim! O plano Grátis permite até 50 consultas por mês sem necessidade de cartão de crédito. Você pode usar o tempo que precisar antes de decidir fazer upgrade.",
  },
  {
    question: "Como funciona a transcrição por voz?",
    answer:
      "Utilizamos a API Whisper da OpenAI com vocabulário médico em português. O áudio é transcrito automaticamente, e a IA extrai dados estruturados como nome do paciente, procedimentos e observações.",
  },
  {
    question: "Posso importar meus pacientes existentes?",
    answer:
      "Sim! O VoxClinic suporta importação via CSV com mapeamento automático de colunas. Você pode migrar sua base de pacientes em poucos minutos.",
  },
  {
    question: "O VoxClinic substitui meu prontuário eletrônico?",
    answer:
      "O VoxClinic é um CRM inteligente com funcionalidades de prontuário. Para clínicas que já possuem um sistema de prontuário eletrônico, ele funciona como complemento focado em produtividade.",
  },
  {
    question: "Como funciona o suporte?",
    answer:
      "Oferecemos suporte via email para todos os planos. Planos Profissional e Clínica contam com suporte prioritário e tempo de resposta reduzido.",
  },
]

export function FAQSection() {
  return (
    <section
      id="faq"
      className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-28"
    >
      <BlurFade inView>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Perguntas frequentes
        </h2>
      </BlurFade>

      <BlurFade inView delay={0.15}>
        <Accordion defaultValue={[]}>
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={String(i)}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </BlurFade>
    </section>
  )
}
