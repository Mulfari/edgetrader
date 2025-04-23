import { Metadata } from "next";
import SubscriptionPlans from "@/components/subscription/SubscriptionPlans";

export const metadata: Metadata = {
  title: "Suscripción - bTrader",
  description: "Gestiona tu suscripción en bTrader",
};

export default function SubscriptionPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Planes de Suscripción</h1>
      <SubscriptionPlans />
    </div>
  );
} 