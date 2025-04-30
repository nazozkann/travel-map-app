import {
  Utensils,
  Landmark,
  Hotel,
  PartyPopper,
  TreePine,
  MapPin,
} from "lucide-react";

export const categories = [
  {
    key: "food-drink",
    label: "Food & Drink",
    icon: Utensils,
    darkIcon: "UtensilsDark",
  },
  {
    key: "cultural",
    label: "Cultural",
    icon: Landmark,
    darkIcon: "LandmarkDark",
  },
  {
    key: "accommodation",
    label: "Accommodation",
    icon: Hotel,
    darkIcon: "HotelDark",
  },
  {
    key: "entertainment",
    label: "Entertainment",
    icon: PartyPopper,
    darkIcon: "PartyPopperDark",
  },
  { key: "nature", label: "Nature", icon: TreePine, darkIcon: "TreePineDark" },
  { key: "other", label: "Other", icon: MapPin, darkIcon: "MapPinDark" },
];
