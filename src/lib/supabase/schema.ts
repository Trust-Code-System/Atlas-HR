export type SupabaseSchemaError = {
  code?: string;
  message: string;
};

export function isMissingSchemaObject(error: SupabaseSchemaError | null | undefined) {
  if (!error) return false;

  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    /schema cache|could not find the table|could not find.*column/i.test(error.message)
  );
}

export async function dataOrEmpty<T>(
  query: PromiseLike<{ data: T[] | null; error: SupabaseSchemaError | null }>
): Promise<T[]> {
  const { data, error } = await query;
  if (isMissingSchemaObject(error)) return [];
  if (error) throw new Error(error.message);
  return data ?? [];
}
