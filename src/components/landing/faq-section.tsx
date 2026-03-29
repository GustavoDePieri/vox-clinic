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
    question: "Funciona para a minha especialidade?",
    answer:
      "Sim. No onboarding, o VoxClinic gera templates customizados para sua profissão — médicos, dentistas, nutricionistas, fisioterapeutas, psicólogos e mais. A IA se adapta ao vocabulário e campos da sua área.",
  },
  {
    question: "Meus dados ficam seguros?",
    answer:
      "Criptografia AES-256, servidores exclusivamente no Brasil (sa-east-1), LGPD compliant (consentimento, auditoria, DPO, exclusão), conforme CFM 1.821/2007.",
  },
  {
    question: "E se a IA errar?",
    answer:
      "O profissional sempre revisa e confirma antes de qualquer dado ser salvo. A IA nunca grava nada automaticamente — ela extrai e sugere, você decide.",
  },
  {
    question: "Posso migrar dados de outro sistema?",
    answer:
      "Sim. Import via CSV e Excel com mapeamento automático de colunas. O assistente de migração guia o processo passo a passo.",
  },
  {
    question: "Tem app para celular?",
    answer:
      "O VoxClinic é um PWA responsivo — funciona como app nativo no celular via navegador. Grave consultas, acesse prontuários e gerencie a agenda de qualquer dispositivo.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer:
      "Sim, sem multa. Cancele quando quiser nas configurações da conta. Todos os dados podem ser exportados antes do cancelamento.",
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-24 md:py-32 border-t border-white/[0.06]">
      <div className="max-w-2xl mx-auto px-6">
        <BlurFade inView>
          <div className="text-center mb-12">
            <p className="text-[12px] font-medium text-vox-primary tracking-widest uppercase mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Perguntas frequentes
            </h2>
          </div>
        </BlurFade>

        <Accordion defaultValue={[]}>
          {faqs.map((faq, i) => (
            <BlurFade key={i} inView delay={0.05 + i * 0.05}>
              <AccordionItem value={String(i)} className="border-white/[0.06]">
                <AccordionTrigger className="text-[14px] text-white [&_[data-slot=accordion-trigger-icon]]:text-zinc-600">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            </BlurFade>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
