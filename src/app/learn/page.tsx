import { Suspense } from "react";
import { LessonRunner } from "@/components/lesson-runner";
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Loading your lesson…</p>}>
      <LessonRunner />
    </Suspense>
  );
}
