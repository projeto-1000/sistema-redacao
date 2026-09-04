import Link from "next/link";

import {
  buildDowngradeScheduledEmailHtml,
  buildEssayCorrectedEmailHtml,
  buildEssayReturnedEmailHtml,
  buildEssaySubmittedEmailHtml,
  buildFreeCreditsExpiringEmailHtml,
  buildOrganicWelcomeEmailHtml,
  buildPasswordChangedEmailHtml,
  buildPasswordRecoveryEmailHtml,
  buildPaymentApprovedEmailHtml,
  buildPaymentFailedEmailHtml,
  buildPlanCreditsExpiringEmailHtml,
  buildSubscriptionCancelledEmailHtml,
  buildSubscriptionCreatedEmailHtml,
  buildUpgradeCompletedEmailHtml,
  buildUpgradeFailedEmailHtml,
  buildMentorshipAccessEmailHtml,
  buildAccountDeletedEmailHtml,
  buildAccountDeletionRequestedEmailHtml,
  buildCardExpiringEmailHtml,
  buildCorrectionDelayedEmailHtml,
  buildCreditsDepletedEmailHtml,
  buildDowngradeCompletedEmailHtml,
  buildFreeCreditsExpiredEmailHtml,
  buildFreeCreditsExpireTodayEmailHtml,
  buildPaymentMethodUpdatedEmailHtml,
  buildPlanCreditsExpiredEmailHtml,
  buildSecurityActivityAlertEmailHtml,
  buildSubscriptionEndedEmailHtml,
  buildSubscriptionReactivatedEmailHtml,
} from "@/lib/emails/templates";
import { emailPreviewMocks } from "@/lib/emails/preview/mocks";
import {
  emailPreviewRegistry,
  getEmailPreviewBySlug,
  type EmailPreviewSlug,
} from "@/lib/emails/preview/registry";
import { notFound } from "next/navigation";

interface EmailPreviewPageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

const categoryOrder = [
  "Conta e segurança",
  "Créditos",
  "Redações",
  "Assinatura e pagamentos",
  "Conta e privacidade",
] as const;

function buildPreviewHtml(slug: EmailPreviewSlug) {
  switch (slug) {
    case "organic-welcome":
      return buildOrganicWelcomeEmailHtml(emailPreviewMocks.organicWelcome);

    case "password-recovery":
      return buildPasswordRecoveryEmailHtml(emailPreviewMocks.passwordRecovery);

    case "password-changed":
      return buildPasswordChangedEmailHtml(emailPreviewMocks.passwordChanged);

    case "free-credits-expiring":
      return buildFreeCreditsExpiringEmailHtml(
        emailPreviewMocks.freeCreditsExpiring,
      );

    case "plan-credits-expiring":
      return buildPlanCreditsExpiringEmailHtml(
        emailPreviewMocks.planCreditsExpiring,
      );

    case "essay-submitted":
      return buildEssaySubmittedEmailHtml(emailPreviewMocks.essaySubmitted);

    case "essay-corrected":
      return buildEssayCorrectedEmailHtml(emailPreviewMocks.essayCorrected);

    case "essay-returned":
      return buildEssayReturnedEmailHtml(emailPreviewMocks.essayReturned);

    case "subscription-created":
      return buildSubscriptionCreatedEmailHtml(
        emailPreviewMocks.subscriptionCreated,
      );

    case "payment-approved":
      return buildPaymentApprovedEmailHtml(emailPreviewMocks.paymentApproved);

    case "payment-failed":
      return buildPaymentFailedEmailHtml(emailPreviewMocks.paymentFailed);

    case "upgrade-completed":
      return buildUpgradeCompletedEmailHtml(
        emailPreviewMocks.upgradeCompleted,
      );

    case "upgrade-failed":
      return buildUpgradeFailedEmailHtml(emailPreviewMocks.upgradeFailed);

    case "downgrade-scheduled":
      return buildDowngradeScheduledEmailHtml(
        emailPreviewMocks.downgradeScheduled,
      );

    case "subscription-cancelled":
      return buildSubscriptionCancelledEmailHtml(
        emailPreviewMocks.subscriptionCancelled,
      );

    case "mentorship-access":
      return buildMentorshipAccessEmailHtml({
        signupUrl:
          "https://projeto1000.com.br/cadastro?token=preview-mentoria",
      });

    case "security-activity-alert":
      return buildSecurityActivityAlertEmailHtml(
        emailPreviewMocks.securityActivityAlert,
      );

    case "free-credits-expire-today":
      return buildFreeCreditsExpireTodayEmailHtml(
        emailPreviewMocks.freeCreditsExpireToday,
      );

    case "free-credits-expired":
      return buildFreeCreditsExpiredEmailHtml(
        emailPreviewMocks.freeCreditsExpired,
      );

    case "plan-credits-expired":
      return buildPlanCreditsExpiredEmailHtml(
        emailPreviewMocks.planCreditsExpired,
      );

    case "credits-depleted":
      return buildCreditsDepletedEmailHtml(
        emailPreviewMocks.creditsDepleted,
      );

    case "correction-delayed":
      return buildCorrectionDelayedEmailHtml(
        emailPreviewMocks.correctionDelayed,
      );

    case "downgrade-completed":
      return buildDowngradeCompletedEmailHtml(
        emailPreviewMocks.downgradeCompleted,
      );

    case "subscription-ended":
      return buildSubscriptionEndedEmailHtml(
        emailPreviewMocks.subscriptionEnded,
      );

    case "subscription-reactivated":
      return buildSubscriptionReactivatedEmailHtml(
        emailPreviewMocks.subscriptionReactivated,
      );

    case "payment-method-updated":
      return buildPaymentMethodUpdatedEmailHtml(
        emailPreviewMocks.paymentMethodUpdated,
      );

    case "card-expiring":
      return buildCardExpiringEmailHtml(
        emailPreviewMocks.cardExpiring,
      );

    case "account-deletion-requested":
      return buildAccountDeletionRequestedEmailHtml(
        emailPreviewMocks.accountDeletionRequested,
      );

    case "account-deleted":
      return buildAccountDeletedEmailHtml(
        emailPreviewMocks.accountDeleted,
      );
  }
}

export default async function EmailPreviewPage({
  searchParams,
}: EmailPreviewPageProps) {
  const isEmailPreviewEnabled =
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview";

  if (!isEmailPreviewEnabled) {
    notFound();
  }

  const { email: requestedEmail } = await searchParams;

  const selectedEmail =
    (requestedEmail && getEmailPreviewBySlug(requestedEmail)) ||
    emailPreviewRegistry[0];

  const html = buildPreviewHtml(selectedEmail.slug);

  return (
    <main className="h-screen overflow-hidden bg-slate-100">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="flex w-[320px] shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Projeto 1000
            </p>

            <h1 className="mt-1 text-xl font-bold text-slate-950">
              Biblioteca de e-mails
            </h1>

            <p className="mt-2 text-sm leading-5 text-slate-500">
              Selecione um modelo para visualizar.
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-6">
              {categoryOrder.map((category) => {
                const emails = emailPreviewRegistry.filter(
                  (email) => email.category === category,
                );

                if (emails.length === 0) {
                  return null;
                }

                return (
                  <div key={category}>
                    <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      {category}
                    </p>

                    <div className="space-y-1">
                      {emails.map((email) => {
                        const isSelected = email.slug === selectedEmail.slug;

                        return (
                          <Link
                            key={email.slug}
                            href={`/email-preview?email=${email.slug}`}
                            className={[
                              "block rounded-xl px-3 py-3 transition",
                              isSelected
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={[
                                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                                  isSelected
                                    ? "bg-blue-600"
                                    : "bg-slate-300",
                                ].join(" ")}
                              />

                              <div className="min-w-0">
                                <p
                                  className={[
                                    "text-sm leading-5",
                                    isSelected
                                      ? "font-semibold"
                                      : "font-medium",
                                  ].join(" ")}
                                >
                                  {email.name}
                                </p>

                                <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-400">
                                  {email.trigger}
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-slate-200 px-5 py-4">
            <p className="text-xs text-slate-400">
              {emailPreviewRegistry.length} modelos no total
            </p>
          </div>
        </aside>

        {/* Content */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                    {selectedEmail.category}
                  </span>
                </div>

                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  {selectedEmail.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedEmail.description}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Assunto
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedEmail.subject}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Disparo
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {selectedEmail.trigger}
                </p>
              </div>
            </div>
          </header>

          {/* Preview */}
          <div className="min-h-0 flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-[900px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <iframe
                key={selectedEmail.slug}
                title={`Preview: ${selectedEmail.name}`}
                srcDoc={html}
                className="block h-[1000px] w-full bg-white"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}