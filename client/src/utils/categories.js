export const categories = [
  { key: "food-drink", label: "Food & Drink", icon: "/assets/icons/Utensils.svg" },
  { key: "cultural", label: "Cultural", icon: "/assets/icons/Landmark.svg" },
  { key: "accommodation", label: "Accommodation", icon: "/assets/icons/Hotel.svg" },
  { key: "entertainment", label: "Entertainment", icon: "/assets/icons/PartyPopper.svg" },
  { key: "nature", label: "Nature", icon: "/assets/icons/TreePine.svg" },
  { key: "other", label: "Other", icon: "/assets/icons/MapPin.svg" },
];

export const categoryLabel = (key) =>
  categories.find((c) => c.key === key)?.label || key;
