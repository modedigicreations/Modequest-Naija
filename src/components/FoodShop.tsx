"use client";

import { useState } from "react";
import { foodPrice, foodPriceLevelHere, locationOpen } from "@/game/engine";
import { DELIVERY_FEE, DELIVERY_HOURS, DELIVERY_PRICE_LEVEL, FOODSTUFFS, getFood } from "@/game/data/food";
import { LOCATIONS, getCity } from "@/game/data/world";
import { pantryCapacity, pantryCount, price } from "@/game/helpers";
import { useGame } from "@/game/store";
import { formatNaira, hourOf } from "@/game/util";

const KITS: { label: string; items: Record<string, number> }[] = [
  { label: "🍛 Jollof", items: { rice: 1, tomato_pepper: 1 } },
  { label: "🫘 Beans & dodo", items: { beans: 1, plantain: 1 } },
  { label: "🍠 Yam & egg", items: { yam: 1, eggs: 1 } },
  { label: "🥬 Egusi & eba", items: { soup_pack: 1, garri: 1 } },
  { label: "🍜 Noodles & egg", items: { noodles: 1, eggs: 1 } },
  { label: "🍞 Bread & tea", items: { bread: 1 } },
];

/** Buy foodstuff: in person at a market, or delivered home from the phone. */
export default function FoodShop({ delivery }: { delivery: boolean }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const [cart, setCart] = useState<Record<string, number>>({});

  const level = delivery ? DELIVERY_PRICE_LEVEL : foodPriceLevelHere(game);
  if (level === null) return null;
  const open = delivery ? hourOf(game.time) >= DELIVERY_HOURS[0] && hourOf(game.time) < DELIVERY_HOURS[1] : locationOpen(game, game.location);

  const inCart = Object.values(cart).reduce((a, n) => a + n, 0);
  const space = pantryCapacity(game) - pantryCount(game);
  const fee = delivery && inCart ? price(game, DELIVERY_FEE, false) : 0;
  const total = Object.entries(cart).reduce((a, [id, n]) => a + foodPrice(game, id, level) * n, 0) + fee;
  const add = (items: Record<string, number>) =>
    setCart((c) => {
      const next = { ...c };
      for (const [id, n] of Object.entries(items)) next[id] = Math.max(0, (next[id] ?? 0) + n);
      return next;
    });

  // Point delivery shoppers to the cheapest market in town.
  const cheapest = delivery
    ? LOCATIONS.filter((l) => l.city === game.city && l.groceryPrice).sort((a, b) => a.groceryPrice! - b.groceryPrice!)[0]
    : null;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {KITS.map((k) => (
          <button
            key={k.label}
            className="chip hover:bg-[var(--bg-2)] disabled:opacity-40"
            disabled={inCart + Object.values(k.items).reduce((a, n) => a + n, 0) > space}
            title={inCart >= space ? "No more room in your pantry" : undefined}
            onClick={() => add(k.items)}
          >
            + {k.label}
          </button>
        ))}
      </div>
      <div className="grid gap-1.5">
        {FOODSTUFFS.map((f) => {
          const n = cart[f.id] ?? 0;
          return (
            <div key={f.id} className="flex items-center gap-2 rounded-xl bg-[var(--card-2)] px-2.5 py-2">
              <span className="text-xl">{f.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold leading-tight">{f.name}</span>
                <span className="block text-[11px] text-[var(--ink-2)]">
                  {formatNaira(foodPrice(game, f.id, level))} · you have {game.pantry[f.id] ?? 0}
                </span>
              </span>
              <button className="btn btn-ghost btn-sm w-8 px-0" disabled={!n} onClick={() => add({ [f.id]: -1 })} aria-label={`Remove ${f.name}`}>
                −
              </button>
              <span className="w-5 text-center font-bold text-sm">{n}</span>
              <button className="btn btn-ghost btn-sm w-8 px-0" disabled={inCart >= space} onClick={() => add({ [f.id]: 1 })} aria-label={`Add ${f.name}`}>
                +
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-[var(--ink-2)] mt-3">
        <span>
          🥫 Pantry {pantryCount(game) + inCart}/{pantryCapacity(game)}
        </span>
        {delivery && <span>Delivery {formatNaira(price(game, DELIVERY_FEE, false))} · riders {DELIVERY_HOURS[0]}am–{DELIVERY_HOURS[1] - 12}pm</span>}
      </div>
      <button
        className="btn btn-primary w-full mt-2"
        disabled={!inCart || !open}
        onClick={() => {
          if (dispatch({ type: "buyFood", items: cart, delivery })) setCart({});
        }}
      >
        {!open ? (delivery ? "Riders are off for the night" : "Closed now") : inCart ? `${delivery ? "Order delivery" : "Buy"} · ${formatNaira(total)}` : "Pick foodstuff above"}
      </button>
      {inCart > 0 && (
        <p className="text-[11px] text-[var(--muted)] mt-1.5">
          {Object.entries(cart)
            .filter(([, n]) => n > 0)
            .map(([id, n]) => `${getFood(id)?.emoji} ${getFood(id)?.name} ×${n}`)
            .join(" · ")}
        </p>
      )}
      {cheapest && (
        <p className="text-[11px] text-[var(--muted)] mt-2">
          💡 Cheaper in person: {cheapest.name} in {getCity(game.city).name} sells foodstuff for about {Math.round((1 - cheapest.groceryPrice! / 1000 / DELIVERY_PRICE_LEVEL) * 100)}% less, with no delivery fee.
        </p>
      )}
    </div>
  );
}
