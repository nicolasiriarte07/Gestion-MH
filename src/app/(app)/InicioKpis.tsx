"use client";

import { ShoppingBag, TrendingUp, Package, Target } from "lucide-react";
import { motion } from "framer-motion";
import KpiCard, { type KpiDelta } from "@/components/ds/KpiCard";
import { formatCurrency } from "@/lib/currency";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

export default function InicioKpis({
  totalArs,
  totalArsDelta,
  salesCount,
  salesCountDelta,
  lowStockCount,
  marketingInvestment,
  periodLabel,
}: {
  totalArs: number;
  totalArsDelta: KpiDelta | undefined;
  salesCount: number;
  salesCountDelta: KpiDelta | undefined;
  lowStockCount: number;
  marketingInvestment: number;
  periodLabel: string;
}) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
    >
      <motion.div variants={item}>
        <KpiCard
          icon={ShoppingBag}
          tone="pink"
          label="Ventas totales"
          value={formatCurrency(totalArs)}
          delta={totalArsDelta}
        />
      </motion.div>
      <motion.div variants={item}>
        <KpiCard
          icon={TrendingUp}
          tone="blue"
          label="Cantidad de ventas"
          value={String(salesCount)}
          delta={salesCountDelta}
        />
      </motion.div>
      <motion.div variants={item}>
        <KpiCard
          icon={Package}
          tone="gray"
          label="Productos en stock bajo"
          value={String(lowStockCount)}
          sublabel="0 o 1 unidad en stock"
        />
      </motion.div>
      <motion.div variants={item}>
        <KpiCard
          icon={Target}
          tone="blue-light"
          label="Inversión en marketing"
          value={formatCurrency(marketingInvestment)}
          sublabel={periodLabel}
        />
      </motion.div>
    </motion.div>
  );
}
