import { createFileRoute } from "@tanstack/react-router";
import { BarterApp } from "@/components/app/BarterApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BarterKartale — Influencer Collaboration & Brand Promotion Network" },
      { name: "description", content: "Discover product sponsorships and beta-testing campaigns across Amazon, Flipkart, Myntra and Meesho. Zero followers required." },
      { property: "og:title", content: "BarterKartale — Creator Commerce, Reimagined" },
      { property: "og:description", content: "Product sponsorships and campaigns with India's premier influencer collaboration network." },
    ],
  }),
  component: () => <BarterApp initialView="home" />,
});
