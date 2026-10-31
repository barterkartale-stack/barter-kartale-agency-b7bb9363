import { createFileRoute } from "@tanstack/react-router";
import { BarterApp } from "@/components/app/BarterApp";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Interactive Marketplace Sandbox — BarterKartale" },
      {
        name: "description",
        content:
          "Explore a fictional, guided marketplace demo with no real checkout, order, upload, rating, refund, or payout.",
      },
      { property: "og:title", content: "Interactive Marketplace Sandbox — BarterKartale" },
      {
        property: "og:description",
        content: "Practice sample campaign steps in a transparent, no-purchase sandbox.",
      },
    ],
  }),
  component: () => <BarterApp initialView="demo" />,
});
