"use client";

import { useState, useTransition } from "react";
import { addMealFood, removeMealFood, updateMealFood } from "./food-actions";

type Food = {
  id: string;
  url: string;
  title: string | null;
  image_url: string | null;
  amount: string | null;
};

function FoodChip({
  petId,
  food,
}: {
  petId: string;
  food: Food;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateMealFood(petId, food.id, formData);
      if (!result.ok) setError(result.error ?? "Could not save");
      else setIsEditing(false);
    });
  }

  function handleRemove() {
    startTransition(async () => {
      await removeMealFood(petId, food.id);
    });
  }

  if (isEditing) {
    return (
      <form
        action={handleSave}
        className="flex flex-col gap-1 rounded border border-gray-200 p-2 text-xs"
      >
        <input
          type="text"
          name="title"
          defaultValue={food.title ?? ""}
          placeholder="Food name"
          className="rounded border border-gray-300 px-2 py-1"
        />
        <input
          type="text"
          name="amount"
          defaultValue={food.amount ?? ""}
          placeholder="Amount to feed (e.g. 1/2 cup)"
          className="rounded border border-gray-300 px-2 py-1"
        />
        <input
          type="url"
          name="url"
          defaultValue={food.url}
          placeholder="Product link"
          className="rounded border border-gray-300 px-2 py-1"
        />
        <input
          type="url"
          name="image_url"
          defaultValue={food.image_url ?? ""}
          placeholder="Image URL (optional)"
          className="rounded border border-gray-300 px-2 py-1"
        />
        {error && <p className="text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded bg-black px-2 py-1 text-white disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setError(null);
            }}
            className="flex-1 rounded border border-gray-300 px-2 py-1"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <span className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-2 text-xs">
      <a
        href={food.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 hover:opacity-70"
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
        <span className="max-w-[10rem] truncate">
          {food.title ?? food.url}
          {food.amount ? ` · ${food.amount}` : ""}
        </span>
      </a>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="text-gray-400 hover:text-gray-700"
      >
        edit
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={handleRemove}
        className="text-gray-400 hover:text-red-600"
      >
        ×
      </button>
    </span>
  );
}

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

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2">
      {foods.map((food) => (
        <FoodChip key={food.id} petId={petId} food={food} />
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
