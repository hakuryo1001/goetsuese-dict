import { Suspense } from "react";
import BrowseClient from "../browse-client";

export default function Page() {
  return (
    <Suspense>
      <BrowseClient />
    </Suspense>
  );
}
