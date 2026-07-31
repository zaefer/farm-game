export const CROPS = {
  wheat: {
    id: "wheat",
    name: "Wheat",
    icon: "🌾",
    seedIcon: "🌱",
    growthTime: 10,
    seedPrice: 2,
  },

  tomato: {
    id: "tomato",
    name: "Tomato",
    icon: "🍅",
    seedIcon: "🌱",
    growthTime: 15,
    seedPrice: 4,
  },
} as const;

export type CropId =
  keyof typeof CROPS;