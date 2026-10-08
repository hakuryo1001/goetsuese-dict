import { Suspense } from "react";
import WordClient from "./word-client";

export default function Page() {
  return (
    <Suspense>
      <WordClient />
    </Suspense>
  );
}
