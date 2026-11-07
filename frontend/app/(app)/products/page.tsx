"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Product } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { exportAllCsv, hasExportable } from "@/lib/export";
import { Navadeni } from "@/components/navadeni";

const STATUS_COLORS: Record<string, string> = {
  draft: "oklch(0.52 0.04 50)",
  analyzed: "oklch(0.55 0.12 155)",
  completed: "oklch(0.40 0.10 196)",
};

/**
 * Seznam produktů — oddělený od Přehledu (ten je o předplatném/kvótě/statistikách).
 * Dřív `/products` jen přesměrovával na `/dashboard`, takže se v menu nešlo přepnout
 * a vypadalo to nedodělaně.
 */
export default function ProductsPage() {
  const t = useT();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.products
      .list()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="text-3xl animate-pulse">✦</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navádění pro nového uživatele (0 produktů) → „Přidat první produkt". */}
      <Navadeni selector="[data-nav='pridat']" enabled={products.length === 0} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-heading text-4xl font-light heading-accent">{t("nav.products")}</h1>
        <div className="flex items-center gap-2">
          {hasExportable(products) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportAllCsv(products)}
              title={t("exp.allCsvHint")}
            >
              {t("exp.allCsv")}
            </Button>
          )}
          <Link href="/products/new" className={cn(buttonVariants({ size: "sm" }))}>
            {t("dash.addProduct")}
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="border-dashed border-2" style={{ borderColor: "oklch(0.85 0.02 72)", background: "transparent" }}>
          <CardContent className="py-16 text-center">
            <p className="text-3xl mb-3">✦</p>
            <p className="font-heading text-xl font-light text-muted-foreground">
              {t("dash.emptyTitle")}
            </p>
            <p className="text-sm text-muted-foreground mt-2 mb-6">{t("dash.emptyText")}</p>
            <Link href="/products/new" data-nav="pridat" className={cn(buttonVariants())}>
              {t("dash.addFirst")}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {products.map((product) => {
            const statusColor = STATUS_COLORS[product.status];
            return (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card
                  className="border-0 card-mystical hover:shadow-md transition-shadow cursor-pointer"
                  style={{ background: "oklch(0.94 0.012 75)" }}
                >
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{product.titleOriginal}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {product.category || t("prod.noCategory")}
                        {product.priceOriginal ? ` · ${product.priceOriginal} EUR` : ""}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-xs"
                      style={{ background: `${statusColor}18`, color: statusColor }}
                    >
                      {t(`status.${product.status}` as "status.draft")}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
