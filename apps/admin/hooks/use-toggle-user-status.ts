import { startTransition, useOptimistic } from "react";

type StatusBase = {
  id: string;
  status: "active" | "inactive" | "blocked" | string;
};

export function useToggleUserStatus<T extends StatusBase>(
  entity: T,
  updateAction: (id: string, currentStatus: string) => Promise<void>
) {
  const [optimisticEntity, setOptimisticEntity] = useOptimistic(
    entity,
    (state, newStatus: T["status"]) => ({
      ...state,
      status: newStatus,
    })
  );

  const toggleStatus = () => {
    const newStatus = optimisticEntity.status === "active" ? "blocked" : "active";

    startTransition(() => {
      setOptimisticEntity(newStatus);
    });

    updateAction(optimisticEntity.id, optimisticEntity.status).catch((err) => {
      console.error("Erro ao atualizar o status no banco:", err);
    });
  };

  return {
    entity: optimisticEntity,
    toggleStatus,
  };
}
