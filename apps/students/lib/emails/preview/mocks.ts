export const emailPreviewMocks = {
  organicWelcome: {
    firstName: "Fernanda",
    dashboardUrl: "https://projeto1000.com.br/redacoes",
    freeCredits: 1,
    creditsExpireAt: "17 de setembro de 2026",
  },

  passwordRecovery: {
    firstName: "Fernanda",
    resetPasswordUrl: "https://projeto1000.com.br/redefinir-senha?token=preview-token",
    expiresInMinutes: 60,
  },

  passwordChanged: {
    firstName: "Fernanda",
    loginUrl: "https://projeto1000.com.br/login",
  },

  freeCreditsExpiring: {
    firstName: "Fernanda",
    credits: 1,
    expiresAt: "17 de setembro de 2026",
    essaysUrl: "https://projeto1000.com.br/redacoes",
  },

  planCreditsExpiring: {
    firstName: "Fernanda",
    credits: 3,
    expiresAt: "30 de setembro de 2026",
    essaysUrl: "https://projeto1000.com.br/redacoes",
    planName: "Avançado",
  },

  essaySubmitted: {
    firstName: "Fernanda",
    essayTitle:
      "Desafios para a (re)inserção socioeconômica da população em situação de rua no Brasil",
    submittedAt: "3 de setembro de 2026, às 13h20",
    dueAt: "8 de setembro de 2026, às 13h20",
    essayUrl: "https://projeto1000.com.br/redacoes/preview",
  },

  essayCorrected: {
    firstName: "Fernanda",
    essayTitle:
      "Desafios para a (re)inserção socioeconômica da população em situação de rua no Brasil",
    score: 920,
    correctionUrl: "https://projeto1000.com.br/redacoes/preview/correcao",
  },

  essayReturned: {
    firstName: "Fernanda",
    essayTitle:
      "Desafios para a (re)inserção socioeconômica da população em situação de rua no Brasil",
    reason:
      "A imagem enviada está cortada e não permite visualizar o texto completo. Envie novamente uma imagem nítida, com todas as partes da redação visíveis.",
    essayUrl: "https://projeto1000.com.br/redacoes/preview",
    creditReturned: true,
  },

  subscriptionCreated: {
    firstName: "Fernanda",
    planName: "Avançado",
    billingLabel: "Mensal",
    amount: "R$ 89,90",
    credits: 10,
    nextBillingAt: "3 de outubro de 2026",
    dashboardUrl: "https://projeto1000.com.br",
  },

  paymentApproved: {
    firstName: "Fernanda",
    planName: "Avançado",
    amount: "R$ 89,90",
    creditsAdded: 10,
    paidAt: "3 de setembro de 2026",
    nextBillingAt: "3 de outubro de 2026",
    dashboardUrl: "https://projeto1000.com.br",
  },

  paymentFailed: {
    firstName: "Fernanda",
    planName: "Avançado",
    amount: "R$ 89,90",
    billingAttemptAt: "3 de setembro de 2026",
    paymentSettingsUrl: "https://projeto1000.com.br/assinatura/metodos-de-pagamento",
  },

  upgradeCompleted: {
    firstName: "Fernanda",
    previousPlanName: "Essencial",
    newPlanName: "Avançado",
    amountCharged: "R$ 40,00",
    creditsAdded: 6,
    nextBillingAt: "3 de outubro de 2026",
    dashboardUrl: "https://projeto1000.com.br/assinatura",
  },

  upgradeFailed: {
    firstName: "Fernanda",
    currentPlanName: "Essencial",
    requestedPlanName: "Avançado",
    paymentSettingsUrl: "https://projeto1000.com.br/assinatura/metodos-de-pagamento",
  },

  downgradeScheduled: {
    firstName: "Fernanda",
    currentPlanName: "Avançado",
    newPlanName: "Essencial",
    effectiveAt: "3 de outubro de 2026",
    nextAmount: "R$ 49,90",
    subscriptionUrl: "https://projeto1000.com.br/assinatura",
  },

  subscriptionCancelled: {
    firstName: "Fernanda",
    planName: "Avançado",
    accessUntil: "3 de outubro de 2026",
    subscriptionUrl: "https://projeto1000.com.br/assinatura",
  },

  securityActivityAlert: {
    occurredAt: "3 de setembro de 2026, às 14h32",
    device: "Safari no macOS",
    location: "São Paulo, SP",
    securityUrl: "https://projeto1000.com.br/redefinir-senha",
  },

  freeCreditsExpireToday: {
    firstName: "Fernanda",
    credits: 1,
    essaysUrl: "https://projeto1000.com.br/redacoes",
  },

  freeCreditsExpired: {
    firstName: "Fernanda",
    plansUrl: "https://projeto1000.com.br/planos",
  },

  planCreditsExpired: {
    firstName: "Fernanda",
    expiredCredits: 2,
    planName: "Avançado",
    nextCycleAt: "3 de outubro de 2026",
    dashboardUrl: "https://projeto1000.com.br",
  },

  creditsDepleted: {
    firstName: "Fernanda",
    plansUrl: "https://projeto1000.com.br/assinatura",
    hasActiveSubscription: true,
    nextCreditsAt: "3 de outubro de 2026",
  },

  correctionDelayed: {
    firstName: "Fernanda",
    essayTitle:
      "Desafios para a (re)inserção socioeconômica da população em situação de rua no Brasil",
    essayUrl: "https://projeto1000.com.br/redacoes/preview",
  },

  downgradeCompleted: {
    firstName: "Fernanda",
    previousPlanName: "Avançado",
    newPlanName: "Essencial",
    amount: "R$ 49,90",
    credits: 4,
    subscriptionUrl: "https://projeto1000.com.br/assinatura",
  },

  subscriptionEnded: {
    firstName: "Fernanda",
    planName: "Avançado",
    plansUrl: "https://projeto1000.com.br/planos",
  },

  subscriptionReactivated: {
    firstName: "Fernanda",
    planName: "Avançado",
    nextBillingAt: "3 de outubro de 2026",
    subscriptionUrl: "https://projeto1000.com.br/assinatura",
  },

  paymentMethodUpdated: {
    cardBrand: "Visa",
    lastFourDigits: "4242",
    updatedAt: "3 de setembro de 2026, às 14h40",
    paymentMethodsUrl: "https://projeto1000.com.br/assinatura/metodos-de-pagamento",
  },

  cardExpiring: {
    firstName: "Fernanda",
    cardBrand: "Visa",
    lastFourDigits: "4242",
    expiration: "09/26",
    paymentMethodsUrl: "https://projeto1000.com.br/assinatura/metodos-de-pagamento",
  },

  accountDeletionRequested: {
    requestedAt: "3 de setembro de 2026, às 14h45",
    supportUrl: "https://projeto1000.com.br/contato",
  },

  accountDeleted: {
    deletedAt: "3 de setembro de 2026",
    projectUrl: "https://projeto1000.com.br",
  },
} as const;
