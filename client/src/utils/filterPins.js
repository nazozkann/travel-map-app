import { tags } from "./tags";

// A pin is shown when its category is selected and, if a tag filter is active,
// it has at least one of the selected tags. Selecting every tag means "no tag filter".
export default function filterPins(pins, selectedCategories, selectedTags) {
  const tagFilterActive =
    selectedTags.length > 0 && selectedTags.length < tags.length;

  return pins.filter(
    (pin) =>
      selectedCategories.includes(pin.category) &&
      (!tagFilterActive ||
        (Array.isArray(pin.tags) &&
          pin.tags.some((t) => selectedTags.includes(t))))
  );
}
