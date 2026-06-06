import type { Metadata } from "next";
import { apiClient } from "@/lib/api-client";
import { CompatibilityShareClient } from "./compatibility-share-client";

type PageProps = {
  params: Promise<{ readingId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { readingId } = await params;
  try {
    const reading = await apiClient.getPublicCompatibilityShare(readingId);
    const title = `${reading.profiles.a.label} × ${reading.profiles.b.label} 的八字合盘`;
    const description = `缘分分 ${reading.overallScore} · ${levelText(reading.level)}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        url: `/share/compatibility/${readingId}`
      },
      twitter: {
        card: "summary",
        title,
        description
      }
    };
  } catch {
    return {
      title: "八字合盘分享",
      description: "MetaMystic 合盘结果分享"
    };
  }
}

export default async function PublicCompatibilitySharePage({ params }: PageProps) {
  const { readingId } = await params;
  return <CompatibilityShareClient readingId={readingId} />;
}

function levelText(level: "excellent" | "good" | "balanced" | "challenging"): string {
  const labels = {
    excellent: "高契合",
    good: "互补良好",
    balanced: "平衡可经营",
    challenging: "需要更多磨合"
  };
  return labels[level];
}
