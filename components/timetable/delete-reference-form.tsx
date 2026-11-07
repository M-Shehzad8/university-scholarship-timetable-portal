import { Button } from "@/components/ui/button";

export function DeleteReferenceForm({
  action,
  id,
  idField = "id",
  returnTo,
  label,
  description,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  idField?: string;
  returnTo: string;
  label: string;
  description: string;
}) {
  return (
    <details className="rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 dark:border-red-900 dark:bg-red-950/20">
      <summary className="cursor-pointer text-xs font-semibold text-red-800 dark:text-red-300">
        Delete
      </summary>
      <div className="mt-2 w-56 space-y-2">
        <p className="text-xs leading-5 text-red-900 dark:text-red-200">
          {description}
        </p>
        <form action={action}>
          <input type="hidden" name={idField} value={id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button type="submit" size="sm" variant="danger">
            {label}
          </Button>
        </form>
      </div>
    </details>
  );
}
