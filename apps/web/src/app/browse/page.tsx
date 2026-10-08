import { Suspense } from "react";
import BrowsePage from "./browse-client";

export default function Page() {
  return (
    <Suspense>
      <BrowsePage />
    </Suspense>
  );
}
