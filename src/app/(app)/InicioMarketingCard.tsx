"use client";

import Link from "next/link";
import { CalendarCheck2 } from "lucide-react";
import { motion } from "framer-motion";
import Card from "@/components/ds/Card";
import Badge from "@/components/ds/Badge";
import EmptyState from "@/components/ds/EmptyState";
import type { MarketingPost } from "@/lib/types";
import { formatDateDMY } from "./crm-equipamientos/contactStages";
import { itemStatus, statusLabel, statusTone, type MarketingItem } from "./marketing/normalize";
import { CONTENT_LABELS } from "./marketing/marketingLabels";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const rowMotion = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.16 } } };

export default function InicioMarketingCard({
  rows,
  totalCount,
  todayISO,
}: {
  rows: MarketingPost[];
  totalCount: number;
  todayISO: string;
}) {
  return (
    <Card className="font-inter">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-mh-ink">Próximas acciones de marketing</h3>
          <span className="rounded-full bg-mh-blue-light px-2 py-0.5 text-xs font-extrabold text-mh-blue">
            {totalCount}
          </span>
        </div>
        <Link
          href="/marketing"
          className="shrink-0 text-xs font-semibold text-mh-pink hover:text-mh-pink-dark"
        >
          Ver todas
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={CalendarCheck2} title="Sin acciones pendientes" />
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          {rows.map((post) => {
            const marketingItem: MarketingItem = { kind: "post", data: post };
            const status = itemStatus(marketingItem, todayISO);
            return (
              <motion.div
                variants={rowMotion}
                key={post.id}
                className="rounded-xl border border-mh-border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-mh-ink">{post.concept}</p>
                    <p className="truncate text-xs text-mh-ink-muted">
                      {formatDateDMY(post.publish_date)}
                      {post.responsible ? ` · ${post.responsible}` : ""}
                      {post.format ? ` · ${post.format}` : ""}
                    </p>
                  </div>
                  <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>
                </div>
                {post.content_type && (
                  <p className="mt-1 truncate text-xs text-mh-ink-muted">
                    {CONTENT_LABELS[post.content_type]}
                  </p>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </Card>
  );
}
