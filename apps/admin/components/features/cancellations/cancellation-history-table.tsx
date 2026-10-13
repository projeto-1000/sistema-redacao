import { listCancellationHistory } from "@/app/actions/subscription-withdrawals";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { CancellationHistory } from "./cancellation-history";

export async function CancellationHistoryTable() {
  let entries;
  try {
    entries = await listCancellationHistory();
  } catch (error) {
    return (
      <Alert className="rounded-2xl border-amber-200 bg-amber-50 p-6 text-amber-900">
        <AlertDescription className="text-amber-900">
          {error instanceof Error ? error.message : "Não foi possível carregar o histórico."}
        </AlertDescription>
      </Alert>
    );
  }
  return <CancellationHistory entries={entries} />;
}
