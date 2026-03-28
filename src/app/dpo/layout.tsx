import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Encarregado de Protecao de Dados (DPO) — VoxClinic",
  description:
    "Canal de comunicacao com o Encarregado de Protecao de Dados da VoxClinic. Exerca seus direitos de titular conforme a LGPD: acesso, correcao, exclusao e portabilidade de dados pessoais.",
  openGraph: {
    title: "DPO — VoxClinic",
    description: "Exerca seus direitos de titular de dados pessoais conforme a LGPD.",
    type: "website",
  },
}

export default function DpoLayout({ children }: { children: React.ReactNode }) {
  return children
}
