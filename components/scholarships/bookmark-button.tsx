import { Button } from "@/components/ui/button";
import { toggleBookmarkAction } from "@/lib/scholarships/actions";

type BookmarkButtonProps = {
  scholarshipId: string;
  isSaved: boolean;
  canSave: boolean;
  returnTo: string;
  size?: "sm" | "md" | "lg";
};

export function BookmarkButton({
  scholarshipId,
  isSaved,
  canSave,
  returnTo,
  size = "sm",
}: BookmarkButtonProps) {
  if (!isSaved && !canSave) {
    return (
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Read-only reference
      </span>
    );
  }

  return (
    <form action={toggleBookmarkAction}>
      <input type="hidden" name="scholarshipId" value={scholarshipId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="intent" value={isSaved ? "remove" : "save"} />
      <Button
        type="submit"
        size={size}
        variant={isSaved ? "secondary" : "primary"}
      >
        {isSaved ? "Remove saved" : "Save scholarship"}
      </Button>
    </form>
  );
}
