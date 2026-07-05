"use client";

import { useState, useTransition } from "react";
import { addMealFood, removeMealFood } from "./food-actions";

type Food = {
  id: string;
  url: string;
  title: string | null;
  image_url: string | null;
};

export function MealFoodsList({
  petId,
  scheduleId,
  foods,
}: {
  petId: string;
  scheduleId: string;
  foods: Food[];
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addMealFood(petId, scheduleId, formData);
      if (!result.ok) {
        setError(result.error ?? "Could not add link");
      } else {
        setIsAdding(false);
      }
    });
  }

  function handleRemove(foodId: string) {
    startTransition(async () => {
      await removeMealFood(petId, foodId);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2">
      {foods.map((food) => (
        <a
          key={food.id}
          href={food.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-2 text-xs hover:bg-gray-50"
        >
          {food.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={food.image_url}
              alt=""
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] text-gray-400">
              🛒
            </span>
          )}
          <span className="max-w-[8rem] truncate">
            {food.title ?? food.url}
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemove(food.id);
            }}
            className="text-gray-400 hover:text-red-600"
          >
            ×
          </button>
        </a>
      ))}

      {isAdding ? (
        <form action={handleAdd} className="flex items-center gap-1">
          <input
            type="url"
            name="url"
            placeholder="Paste a food link"
            required
            autoFocus
            className="w-40 rounded border border-gray-300 px-2 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-black px-2 py-1 text-xs text-white disabled:opacity-50"
          >
            {isPending ? "Adding…" : "Add"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setError(null);
            }}
            className="text-xs text-gray-500 underline"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:bg-gray-50"
        >
          + Add food link
        </button>
      )}
      {error && <p className="w-full text-xs text-red-700">{error}</p>}
    </div>
  );
}
