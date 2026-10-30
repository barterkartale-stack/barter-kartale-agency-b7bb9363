import { createFileRoute } from "@tanstack/react-router";
import { BarterApp } from "@/components/app/BarterApp";

export const Route = createFileRoute("/partner-console")({
  head: () => ({
    meta: [
      { title: "Partner Console — BarterKartale" },
      { name: "description", content: "Private operations console for approved BarterKartale partners." },
      { property: "og:title", content: "Partner Console — BarterKartale" },
      { property: "og:description", content: "Private operations console for approved partners." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <BarterApp initialView="console" />,
});
