"use server";

import { createClient } from "@/lib/server";
import type { ExtraCreditPackage } from "@repo/types";
import {
  createExtraCreditPackageSchema,
  extraCreditPackageIdSchema,
  setExtraCreditPackageStatusSchema,
  updateExtraCreditPackageSchema,
  type CreateExtraCreditPackageInput,
  type UpdateExtraCreditPackageInput,
} from "@repo/validators";
import { revalidatePath } from "next/cache";

const EXTRA_CREDIT_PACKAGES_PATH = "/creditos-extras";
const EXTRA_CREDIT_PACKAGE_COLUMNS =
  "id, name, description, credits_amount, price_cents, is_active, created_at, updated_at";

class ExtraCreditPackageAuthorizationError extends Error {}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function requireAdmin(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new ExtraCreditPackageAuthorizationError("Sessão administrativa inválida.");
  }

  const { data: role, error: roleError } = await supabase.rpc("get_my_role");

  if (roleError || role !== "ADMIN") {
    throw new ExtraCreditPackageAuthorizationError(
      "Você não tem permissão para gerenciar pacotes de créditos extras."
    );
  }
}

function normalizeDescription(description?: string | null) {
  return description?.trim() || null;
}

function getUnexpectedError(error: unknown, operation: string) {
  console.error(`[EXTRA_CREDIT_PACKAGE_${operation}_ERROR]`, error);

  if (error instanceof ExtraCreditPackageAuthorizationError) {
    return error.message;
  }

  return "Erro interno no servidor.";
}

export async function listExtraCreditPackages(): Promise<{
  packages: ExtraCreditPackage[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { data, error } = await supabase
      .from("extra_credit_packages")
      .select(EXTRA_CREDIT_PACKAGE_COLUMNS)
      .order("is_active", { ascending: false })
      .order("credits_amount", { ascending: true })
      .order("price_cents", { ascending: true })
      .order("name", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error("[EXTRA_CREDIT_PACKAGE_LIST_DB_ERROR]", error);
      return {
        packages: null,
        error: "Não foi possível carregar os pacotes de créditos extras.",
      };
    }

    return { packages: data as ExtraCreditPackage[], error: null };
  } catch (error) {
    return { packages: null, error: getUnexpectedError(error, "LIST") };
  }
}

export async function createExtraCreditPackage(input: CreateExtraCreditPackageInput) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const parsedInput = createExtraCreditPackageSchema.safeParse(input);

    if (!parsedInput.success) {
      return { success: false, package: null, error: "Dados do pacote inválidos." };
    }

    const { data, error } = await supabase
      .from("extra_credit_packages")
      .insert({
        name: parsedInput.data.name,
        description: normalizeDescription(parsedInput.data.description),
        credits_amount: parsedInput.data.credits_amount,
        price_cents: parsedInput.data.price_cents,
        is_active: parsedInput.data.is_active,
      })
      .select(EXTRA_CREDIT_PACKAGE_COLUMNS)
      .single();

    if (error || !data) {
      console.error("[EXTRA_CREDIT_PACKAGE_CREATE_DB_ERROR]", error);
      return {
        success: false,
        package: null,
        error: "Não foi possível criar o pacote de créditos extras.",
      };
    }

    revalidatePath(EXTRA_CREDIT_PACKAGES_PATH);

    return {
      success: true,
      package: data as ExtraCreditPackage,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      package: null,
      error: getUnexpectedError(error, "CREATE"),
    };
  }
}

export async function updateExtraCreditPackage(id: string, input: UpdateExtraCreditPackageInput) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const parsedId = extraCreditPackageIdSchema.safeParse(id);
    const parsedInput = updateExtraCreditPackageSchema.safeParse(input);

    if (!parsedId.success || !parsedInput.success) {
      return { success: false, package: null, error: "Dados do pacote inválidos." };
    }

    const updatePayload = {
      ...parsedInput.data,
      ...(Object.hasOwn(parsedInput.data, "description")
        ? { description: normalizeDescription(parsedInput.data.description) }
        : {}),
    };

    const { data, error } = await supabase
      .from("extra_credit_packages")
      .update(updatePayload)
      .eq("id", parsedId.data)
      .select(EXTRA_CREDIT_PACKAGE_COLUMNS)
      .maybeSingle();

    if (error) {
      console.error("[EXTRA_CREDIT_PACKAGE_UPDATE_DB_ERROR]", error);
      return {
        success: false,
        package: null,
        error: "Não foi possível atualizar o pacote de créditos extras.",
      };
    }

    if (!data) {
      return {
        success: false,
        package: null,
        error: "Pacote de créditos extras não encontrado.",
      };
    }

    revalidatePath(EXTRA_CREDIT_PACKAGES_PATH);

    return {
      success: true,
      package: data as ExtraCreditPackage,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      package: null,
      error: getUnexpectedError(error, "UPDATE"),
    };
  }
}

export async function setExtraCreditPackageStatus(id: string, isActive: boolean) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const parsedInput = setExtraCreditPackageStatusSchema.safeParse({
      id,
      is_active: isActive,
    });

    if (!parsedInput.success) {
      return { success: false, package: null, error: "Status do pacote inválido." };
    }

    const { data: currentPackage, error: fetchError } = await supabase
      .from("extra_credit_packages")
      .select("id, is_active")
      .eq("id", parsedInput.data.id)
      .maybeSingle();

    if (fetchError) {
      console.error("[EXTRA_CREDIT_PACKAGE_STATUS_FETCH_DB_ERROR]", fetchError);
      return {
        success: false,
        package: null,
        error: "Não foi possível consultar o pacote de créditos extras.",
      };
    }

    if (!currentPackage) {
      return {
        success: false,
        package: null,
        error: "Pacote de créditos extras não encontrado.",
      };
    }

    if (currentPackage.is_active === parsedInput.data.is_active) {
      const { data: unchangedPackage, error: unchangedPackageError } = await supabase
        .from("extra_credit_packages")
        .select(EXTRA_CREDIT_PACKAGE_COLUMNS)
        .eq("id", parsedInput.data.id)
        .single();

      if (unchangedPackageError || !unchangedPackage) {
        console.error("[EXTRA_CREDIT_PACKAGE_STATUS_UNCHANGED_DB_ERROR]", unchangedPackageError);
        return {
          success: false,
          package: null,
          error: "Não foi possível confirmar o status do pacote.",
        };
      }

      return {
        success: true,
        package: unchangedPackage as ExtraCreditPackage,
        error: null,
      };
    }

    const { data, error } = await supabase
      .from("extra_credit_packages")
      .update({ is_active: parsedInput.data.is_active })
      .eq("id", parsedInput.data.id)
      .eq("is_active", currentPackage.is_active)
      .select(EXTRA_CREDIT_PACKAGE_COLUMNS)
      .maybeSingle();

    if (error) {
      console.error("[EXTRA_CREDIT_PACKAGE_STATUS_DB_ERROR]", error);
      return {
        success: false,
        package: null,
        error: "Não foi possível alterar o status do pacote de créditos extras.",
      };
    }

    if (!data) {
      return {
        success: false,
        package: null,
        error: "O status do pacote foi alterado por outra operação. Atualize a lista.",
      };
    }

    revalidatePath(EXTRA_CREDIT_PACKAGES_PATH);

    return {
      success: true,
      package: data as ExtraCreditPackage,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      package: null,
      error: getUnexpectedError(error, "STATUS"),
    };
  }
}
