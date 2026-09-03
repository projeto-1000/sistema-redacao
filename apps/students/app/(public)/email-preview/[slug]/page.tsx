import Link from "next/link";
import { notFound } from "next/navigation";

import {
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
  buildDowngradeScheduledEmailHtml,
  buildUpgradeCompletedEmailHtml,
  buildUpgradeFailedEmailHtml,
} from "@/lib/emails/templates";
import { emailPreviewMocks } from "@/lib/emails/preview/mocks";
import {
  getEmailPreviewBySlug,
  type EmailPreviewSlug,
} from "@/lib/emails/preview/registry";

interface EmailPreviewDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

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
      return null;
  }
}

export default async function EmailPreviewDetailPage({
  params,
}: EmailPreviewDetailPageProps) {
  const { slug } = await params;

  const email = getEmailPreviewBySlug(slug);

  if (!email) {
    notFound();
  }

  const html = buildPreviewHtml(email.slug);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href="/email-preview"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            ← Voltar para todos os e-mails
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                {email.category}
              </p>

              <h1 className="text-2xl font-bold text-slate-950">
                {email.name}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {email.description}
              </p>
            </div>

            <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:w-[520px]">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Assunto
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {email.subject}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Disparo
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {email.trigger}
                </p>
              </div>
            </div>
          </div>
        </div>

        {email.slug === "mentorship-access" ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-bold text-slate-950">
              Preview da mentoria ainda não conectado
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Esse é o único template que ainda usa a implementação antiga em
              <code className="mx-1 rounded bg-white px-1.5 py-0.5">
                apps/students/lib/hotmart/emails.ts
              </code>
              . A copy existente será preservada integralmente quando ele for
              conectado à galeria.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <iframe
              title={`Preview: ${email.name}`}
              srcDoc={html ?? ""}
              className="block min-h-[900px] w-full bg-white"
            />
          </div>
        )}
      </div>
    </main>
  );
}