import { describe, expect, it } from "vitest";
import Loading from "@/app/(app)/loading";
import { PageSkeleton } from "@/components/ui/page-skeleton";

describe("app route loading state", () => {
  it("keeps a shared loading boundary for app navigation", () => {
    expect(Loading().type).toBe(PageSkeleton);
  });
});
