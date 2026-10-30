import { createFileRoute } from "@tanstack/react-router";
import { BarterApp } from "@/components/app/BarterApp";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Partner Dashboard — BarterKartale" },
      { name: "description", content: "Track your sponsorship orders, refunds and referrals on BarterKartale." },
      { property: "og:title", content: "Partner Dashboard — BarterKartale" },
      { property: "og:description", content: "Your sponsorship campaigns and partner network in one view." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <BarterApp initialView="dashboard" />,
});
