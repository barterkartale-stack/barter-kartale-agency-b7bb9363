import { createFileRoute } from "@tanstack/react-router";
import { BarterApp } from "@/components/app/BarterApp";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing you in — BarterKartale" },
      { name: "description", content: "Completing secure sign-in to BarterKartale." },
      { property: "og:title", content: "Signing you in — BarterKartale" },
      { property: "og:description", content: "Completing secure sign-in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <BarterApp initialView="home" />,
});
