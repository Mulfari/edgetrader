"use client";

import { Star } from "lucide-react";
import SubscriptionPlans from "@/components/subscription/SubscriptionPlans";

export default function SettingsSuscription() {
  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      <div className="px-6 py-5 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg blur opacity-25"></div>
          <div className="relative h-14 w-14 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-[2px]">
            <div className="h-full w-full rounded-[7px] bg-white dark:bg-zinc-900 flex items-center justify-center">
              <Star className="h-7 w-7 text-purple-500 dark:text-pink-400" />
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
            Suscripción
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Gestiona tu plan y facturación
          </p>
        </div>
      </div>

      <div className="p-6">
        <SubscriptionPlans />
      </div>
    </div>
  );
} 