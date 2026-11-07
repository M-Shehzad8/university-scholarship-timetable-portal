import { Alert } from "@/components/ui/alert";
import {
  referenceNoticeMessages,
  referenceProblemMessages,
} from "@/lib/timetable/messages";

export function ReferenceAlerts({
  notice,
  problem,
}: {
  notice?: string;
  problem?: string;
}) {
  const noticeMessage = notice ? referenceNoticeMessages[notice] : undefined;
  const problemMessage = problem
    ? referenceProblemMessages[problem]
    : undefined;

  return (
    <>
      {noticeMessage ? (
        <Alert tone="success" title="Change saved">
          {noticeMessage}
        </Alert>
      ) : null}
      {problemMessage ? (
        <Alert tone="error" title="Change blocked">
          {problemMessage}
        </Alert>
      ) : null}
    </>
  );
}
