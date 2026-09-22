// src/components/proposal-approval-steps.tsx
import { CheckCircle2, Clock, XCircle } from 'lucide-react'; // アイコンライブラリ（例: lucide-react）の活用

type Step = {
  id: string;
  role: string;
  status: string;
  comment: string | null;
  user: {
    name: string | null;
    email: string | null;
  };
};

export function ProposalApprovalSteps({ steps }: { steps: Step[] }) {

  
  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-xs font-semibold text-muted-foreground">【決裁ルート・承認状況】</p>
      <div className="space-y-1.5">
        {steps.map((step) => {
          // ステータスに応じたアイコンや色分け
          let statusBadge = null;
          if (step.status === 'APPROVED') {
            statusBadge = (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <CheckCircle2 className="w-4 h-4" /> 承認済み ({step.role})
              </span>
            );
          } else if (step.status === 'REJECTED') {
            statusBadge = (
              <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                <XCircle className="w-4 h-4" /> 却下・差し戻し ({step.role})
              </span>
            );
          } else {
            statusBadge = (
              <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                <Clock className="w-4 h-4" /> 未対応 ({step.role})
              </span>
            );
          }

          return (
            <div key={step.id} className="flex flex-col text-xs bg-muted/50 p-2 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  担当: {step.user.name || step.user.email}
                </span>
                {statusBadge}
              </div>
              {step.comment && (
                <p className="text-muted-foreground mt-1 text-[11px] italic">
                  コメント: {step.comment}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}