import { prisma } from "@/lib/prisma";

export const MERCHANDISE_CATEGORIES = ["Books", "Calculator", "Notes", "Stationery", "Other"] as const;

// Sold listings disappear 48h after being marked sold. Rather than a cron
// job (extra infra, and 48h doesn't need to-the-minute precision), this
// runs opportunistically wherever listings are read.
export async function deleteExpiredSoldListings(): Promise<void> {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  try {
    await prisma.merchandiseListing.deleteMany({
      where: { status: "sold", soldAt: { lt: cutoff } },
    });
  } catch (error) {
    console.error("[Merchandise] Failed to clean up expired sold listings:", error);
  }
}
