import Category from "@/models/Category";

const DEFAULT_EXPENSE_CATEGORIES = [
  // Food & Dining
  { name: "Food & Dining", icon: "restaurant", type: "expense", sortOrder: 1 },
  { name: "Restaurants", icon: "local-dining", type: "expense", sortOrder: 2 },
  { name: "Fast Food", icon: "fastfood", type: "expense", sortOrder: 3 },
  { name: "Coffee", icon: "local-cafe", type: "expense", sortOrder: 4 },
  { name: "Groceries", icon: "local-grocery-store", type: "expense", sortOrder: 5 },

  // Transportation
  { name: "Transportation", icon: "directions-car", type: "expense", sortOrder: 10 },
  { name: "Fuel", icon: "local-gas-station", type: "expense", sortOrder: 11 },
  { name: "Public Transport", icon: "directions-bus", type: "expense", sortOrder: 12 },
  { name: "Taxi / Ride Sharing", icon: "local-taxi", type: "expense", sortOrder: 13 },
  { name: "Car Maintenance", icon: "build", type: "expense", sortOrder: 14 },

  // Bills & Utilities
  { name: "Bills & Utilities", icon: "receipt", type: "expense", sortOrder: 20 },
  { name: "Electricity", icon: "flash-on", type: "expense", sortOrder: 21 },
  { name: "Gas", icon: "whatshot", type: "expense", sortOrder: 22 },
  { name: "Water", icon: "opacity", type: "expense", sortOrder: 23 },
  { name: "Internet", icon: "wifi", type: "expense", sortOrder: 24 },
  { name: "Mobile / Phone", icon: "phone-android", type: "expense", sortOrder: 25 },

  // Shopping
  { name: "Shopping", icon: "shopping-bag", type: "expense", sortOrder: 30 },
  { name: "Clothing", icon: "checkroom", type: "expense", sortOrder: 31 },
  { name: "Electronics", icon: "devices", type: "expense", sortOrder: 32 },
  { name: "Household", icon: "home-work", type: "expense", sortOrder: 33 },
  { name: "Personal Care", icon: "face", type: "expense", sortOrder: 34 },

  // Health
  { name: "Health", icon: "medical-services", type: "expense", sortOrder: 40 },
  { name: "Medicine", icon: "medication", type: "expense", sortOrder: 41 },
  { name: "Doctor", icon: "healing", type: "expense", sortOrder: 42 },
  { name: "Pharmacy", icon: "local-pharmacy", type: "expense", sortOrder: 43 },
  { name: "Fitness", icon: "fitness-center", type: "expense", sortOrder: 44 },

  // Entertainment
  { name: "Entertainment", icon: "movie", type: "expense", sortOrder: 50 },
  { name: "Movies", icon: "theaters", type: "expense", sortOrder: 51 },
  { name: "Games", icon: "sports-esports", type: "expense", sortOrder: 52 },
  { name: "Subscriptions", icon: "card-membership", type: "expense", sortOrder: 53 },
  { name: "Events", icon: "event", type: "expense", sortOrder: 54 },

  // Education
  { name: "Education", icon: "school", type: "expense", sortOrder: 60 },
  { name: "Courses", icon: "menu-book", type: "expense", sortOrder: 61 },
  { name: "Books", icon: "book", type: "expense", sortOrder: 62 },
  { name: "School / University", icon: "account-balance", type: "expense", sortOrder: 63 },

  // Home
  { name: "Home", icon: "home", type: "expense", sortOrder: 70 },
  { name: "Rent", icon: "vpn-key", type: "expense", sortOrder: 71 },
  { name: "Maintenance", icon: "handyman", type: "expense", sortOrder: 72 },
  { name: "Furniture", icon: "chair", type: "expense", sortOrder: 73 },

  // Family
  { name: "Family", icon: "people", type: "expense", sortOrder: 80 },
  { name: "Children", icon: "child-care", type: "expense", sortOrder: 81 },
  { name: "Parents", icon: "supervisor-account", type: "expense", sortOrder: 82 },
  { name: "Gifts", icon: "card-giftcard", type: "expense", sortOrder: 83 },

  // Travel
  { name: "Travel", icon: "flight", type: "expense", sortOrder: 90 },
  { name: "Hotels", icon: "hotel", type: "expense", sortOrder: 91 },
  { name: "Flights", icon: "flight-takeoff", type: "expense", sortOrder: 92 },
  { name: "Travel Expenses", icon: "card-travel", type: "expense", sortOrder: 93 },

  // Other
  { name: "Other", icon: "more-horiz", type: "expense", sortOrder: 100 },
  { name: "Miscellaneous", icon: "help-outline", type: "expense", sortOrder: 101 },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "work", type: "income", sortOrder: 1 },
  { name: "Freelance", icon: "laptop", type: "income", sortOrder: 2 },
  { name: "Business", icon: "store", type: "income", sortOrder: 3 },
  { name: "Bonus", icon: "redeem", type: "income", sortOrder: 4 },
  { name: "Investment", icon: "trending-up", type: "income", sortOrder: 5 },
  { name: "Gift", icon: "card-giftcard", type: "income", sortOrder: 6 },
  { name: "Other Income", icon: "monetization-on", type: "income", sortOrder: 7 },
];

/**
 * Checks if system categories exist. If not, seeds them.
 */
export async function seedSystemCategories(): Promise<void> {
  try {
    const count = await Category.countDocuments({ isSystem: true });

    if (count > 0) {
      // System categories already exist, skip seeding
      return;
    }

    console.log("No system categories found. Seeding default system categories...");

    const allCategories = [
      ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, isSystem: true, userId: null })),
      ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, isSystem: true, userId: null })),
    ];

    await Category.insertMany(allCategories);
    console.log(`Successfully seeded ${allCategories.length} system categories.`);
  } catch (error) {
    console.error("Failed to seed system categories:", error);
  }
}
