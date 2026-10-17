import { Hotel, Landmark, MapPin, PartyPopper, TreePine, Utensils } from "lucide-react";

export const categories = [
  { key: "food-drink", label: "Food & Drink", Icon: Utensils },
  { key: "cultural", label: "Cultural", Icon: Landmark },
  { key: "accommodation", label: "Stay", Icon: Hotel },
  { key: "entertainment", label: "Fun", Icon: PartyPopper },
  { key: "nature", label: "Nature", Icon: TreePine },
  { key: "other", label: "Other", Icon: MapPin },
];

export const getCategory = (key) =>
  categories.find((c) => c.key === key) || categories[categories.length - 1];

export const categoryLabel = (key) =>
  categories.find((c) => c.key === key)?.label || key;
