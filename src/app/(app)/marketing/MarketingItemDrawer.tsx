"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, CheckCircle2, Trash2 } from "lucide-react";
import Drawer from "@/components/ds/Drawer";
import Badge from "@/components/ds/Badge";
import { formatCurrency } from "@/lib/currency";
import { parseFlexibleNumber } from "@/lib/excel";
import type { BusinessUnit, ContentType } from "@/lib/types";
import {
  itemTitle,
  itemStatus,
  statusLabel,
  statusTone,
  todayISO,
  type MarketingItem,
} from "./normalize";
import { CONTENT_LABELS } from "./marketingLabels";
import {
  createMarketingPost,
  updateMarketingPost,
  deleteMarketingPost,
} from "./actions";
import {
  createAdCampaign,
  updateAdCampaign,
  deleteAdCampaign,
} from "./pauta-actions";

const inputClass =
  "font-inter w-full rounded-xl border border-mh-border px-3 py-2 text-sm text-mh-ink focus:border-mh-pink focus:outline-none";
const labelClass = "mb-1 block text-xs font-semibold text-mh-ink-muted";

// No hay archivos adjuntos, checklist ni comentarios en ninguna de las
// dos tablas (marketing_posts / ad_campaigns): esos 3 bloques del brief
// quedan fuera, documentado en el README. Tampoco hay "responsable" ni
// "canal" (content_type es un tipo de contenido, no una plataforma).
export default function MarketingItemDrawer({
  item,
  businessUnits,
  onClose,
}: {
  item: MarketingItem | null;
  businessUnits: BusinessUnit[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = item ? itemStatus(item, todayISO()) : null;
  const alreadyFinished = status === "finalizada";

  async function handleDuplicate() {
    if (!item) return;
    setSaving(true);
    setError(null);
    const result =
      item.kind === "post"
        ? await createMarketingPost({
            concept: `${item.data.concept} (copia)`,
            description: item.data.description,
            business_unit_id: item.data.business_unit_id,
            publish_date: item.data.publish_date,
            content_type: item.data.content_type,
            is_scheduled: item.data.is_scheduled,
            is_published: false,
            investment_ars: item.data.investment_ars,
          })
        : await createAdCampaign({
            campaign_name: `${item.data.campaign_name} (copia)`,
            investment_ars: item.data.investment_ars,
            reach: item.data.reach,
            start_date: item.data.start_date,
            end_date: item.data.end_date,
          });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  async function handleFinish() {
    if (!item) return;
    setSaving(true);
    setError(null);
    const result =
      item.kind === "post"
        ? await updateMarketingPost(item.data.id, { is_published: true })
        : await updateAdCampaign(item.data.id, { end_date: todayISO() });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`¿Eliminar "${itemTitle(item)}"?`)) return;
    setSaving(true);
    const result =
      item.kind === "post"
        ? await deleteMarketingPost(item.data.id)
        : await deleteAdCampaign(item.data.id);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  async function saveField(patch: Record<string, unknown>) {
    if (!item) return;
    setError(null);
    const result =
      item.kind === "post"
        ? await updateMarketingPost(item.data.id, patch)
        : await updateAdCampaign(item.data.id, patch);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Drawer open={item !== null} onClose={onClose}>
      {item && status && (
        <>
      <div className="border-b border-mh-border p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={item.kind === "post" ? "pink" : "blue"}>
            {item.kind === "post" ? "Publicación orgánica" : "Campaña de pauta"}
          </Badge>
          <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>
        </div>
        <p className="mt-2 text-lg font-extrabold text-mh-ink">{itemTitle(item)}</p>
      </div>

      <div className="flex-1 space-y-4 p-6">
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {item.kind === "post" ? (
          <>
            <label className="block">
              <span className={labelClass}>Concepto</span>
              <input
                className={inputClass}
                defaultValue={item.data.concept}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== item.data.concept) saveField({ concept: v });
                }}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Descripción</span>
              <textarea
                className={inputClass}
                rows={2}
                defaultValue={item.data.description ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (item.data.description ?? "")) saveField({ description: v || null });
                }}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>Vertical</span>
                <select
                  className={inputClass}
                  defaultValue={item.data.business_unit_id ?? ""}
                  onChange={(e) => saveField({ business_unit_id: e.target.value || null })}
                >
                  <option value="">Sin asignar</option>
                  {businessUnits.map((bu) => (
                    <option key={bu.id} value={bu.id}>
                      {bu.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Tipo de contenido</span>
                <select
                  className={inputClass}
                  defaultValue={item.data.content_type ?? ""}
                  onChange={(e) =>
                    saveField({ content_type: (e.target.value as ContentType) || null })
                  }
                >
                  <option value="">Sin definir</option>
                  {(Object.entries(CONTENT_LABELS) as [ContentType, string][]).map(
                    ([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>
            <label className="block">
              <span className={labelClass}>Fecha de publicación</span>
              <input
                type="date"
                className={inputClass}
                defaultValue={item.data.publish_date}
                onChange={(e) => e.target.value && saveField({ publish_date: e.target.value })}
              />
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm font-medium text-mh-ink">
                <input
                  type="checkbox"
                  className="accent-mh-pink"
                  defaultChecked={item.data.is_scheduled}
                  onChange={(e) => saveField({ is_scheduled: e.target.checked })}
                />
                Pautado
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-mh-ink">
                <input
                  type="checkbox"
                  className="accent-mh-pink"
                  defaultChecked={item.data.is_published}
                  onChange={(e) => saveField({ is_published: e.target.checked })}
                />
                Publicado
              </label>
            </div>
          </>
        ) : (
          <>
            <label className="block">
              <span className={labelClass}>Nombre de la campaña</span>
              <input
                className={inputClass}
                defaultValue={item.data.campaign_name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== item.data.campaign_name) saveField({ campaign_name: v });
                }}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>Fecha de inicio</span>
                <input
                  type="date"
                  className={inputClass}
                  defaultValue={item.data.start_date}
                  onChange={(e) => e.target.value && saveField({ start_date: e.target.value })}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Fecha de fin</span>
                <input
                  type="date"
                  className={inputClass}
                  defaultValue={item.data.end_date}
                  onChange={(e) => e.target.value && saveField({ end_date: e.target.value })}
                />
              </label>
            </div>
            <label className="block">
              <span className={labelClass}>Alcance estimado</span>
              <input
                className={inputClass}
                defaultValue={String(item.data.reach)}
                onBlur={(e) => {
                  const v = parseFlexibleNumber(e.target.value);
                  if (v !== item.data.reach) saveField({ reach: v });
                }}
              />
            </label>
          </>
        )}

        <label className="block">
          <span className={labelClass}>Inversión</span>
          <input
            className={inputClass}
            defaultValue={formatCurrency(item.data.investment_ars)}
            onFocus={(e) => e.target.select()}
            onBlur={(e) => {
              const v = parseFlexibleNumber(e.target.value);
              e.target.value = formatCurrency(v);
              if (v !== item.data.investment_ars) saveField({ investment_ars: v });
            }}
          />
        </label>
      </div>

      <div className="space-y-2 border-t border-mh-border p-6">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDuplicate}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-mh-border px-4 py-2.5 text-sm font-semibold text-mh-ink hover:bg-slate-50 disabled:opacity-50"
          >
            <Copy size={16} />
            Duplicar
          </button>
          <button
            onClick={handleFinish}
            disabled={saving || alreadyFinished}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-mh-border px-4 py-2.5 text-sm font-semibold text-mh-ink hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircle2 size={16} />
            Finalizar
          </button>
        </div>
        <button
          onClick={handleDelete}
          disabled={saving}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={16} />
          Eliminar
        </button>
      </div>
        </>
      )}
    </Drawer>
  );
}
