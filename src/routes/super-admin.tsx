import { createFileRoute } from "@tanstack/react-router";
import { BarterApp } from "@/components/app/BarterApp";

export const Route = createFileRoute("/super-admin")({
  head: () => ({
    meta: [
      { title: "Super Admin — BarterKartale" },
      { name: "description", content: "Manage campaigns and partner access on BarterKartale." },
      { property: "og:title", content: "Super Admin — BarterKartale" },
      { property: "og:description", content: "Campaign and partner access management." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <BarterApp initialView="superadmin" />,
});
