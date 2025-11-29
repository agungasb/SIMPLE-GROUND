# Database Structure Diagram and Example Data

The application uses Firestore as its database, with a schema primarily defined by the TypeScript interfaces and `const` objects found in the `src/lib` directory. The Firestore rules are currently open, allowing read/write access for development purposes.

It appears the main data models are:

1.  **`recipes` (Collection)**: Stores definitions for various food recipes, including their ingredients and preparation steps.
2.  **`inventory` (Collection)**: Manages the stock of individual ingredients, including current quantities, minimum stock levels, units, and purchasing information.
3.  **`products` (Collection)**: Describes the final products sold, linking them to base recipes, additional ingredients, calculation parameters, and selling prices.

---

## 1. `recipes` Collection Structure

This collection stores individual recipes, which can be composed of basic ingredients or other sub-recipes.

**Interface:** `Recipe` (from `src/lib/recipes.ts`)

```typescript
export interface Ingredient {
    id: string; // Unique ID for each ingredient entry within a recipe
    name: string;
    amount: number;
    unit: string;
    type: 'ingredient' | 'recipe'; // 'ingredient' for raw materials, 'recipe' for sub-recipes
    recipeId?: string; // ID of the sub-recipe if type is 'recipe'
}

export interface Recipe {
    id: string; // Unique ID for the recipe
    name: string;
    ingredients: Ingredient[];
    steps: string[];
    baseWeight?: number; // Optional base weight for the recipe
}
```

**Diagram (Conceptual):**

```mermaid
erDiagram
    RECIPES ||--o{ INGREDIENTS : contains
    INGREDIENTS {
        string id PK
        string name
        float amount
        string unit
        string type ENUM("ingredient", "recipe")
        string recipeId FK "References RECIPES.id if type is 'recipe'"
    }
    RECIPES {
        string id PK
        string name
        array steps
        float baseWeight OPTIONAL
    }
```

**Example Data (`recipes` collection):**

```json
// Document ID: "adonan_donut_paha_ayam"
{
  "id": "adonan_donut_paha_ayam",
  "name": "Adonan Donut Paha Ayam",
  "ingredients": [
    { "id": "1", "name": "Tepung", "amount": 500, "unit": "g", "type": "ingredient" },
    { "id": "2", "name": "Premix", "amount": 500, "unit": "g", "type": "ingredient" },
    { "id": "3", "name": "Gula Pasir", "amount": 120, "unit": "g", "type": "ingredient" },
    { "id": "7", "name": "telur", "amount": 150, "unit": "g", "type": "ingredient" },
    { "id": "11", "name": "Air", "amount": 150, "unit": "g", "type": "ingredient" },
    { "id": "12", "name": "es batu", "amount": 150, "unit": "g", "type": "ingredient" }
    // ... more ingredients
  ],
  "steps": [
    "Campurkan bahan kering: tepung, premix, gula, susu bubuk, ragi, softer.",
    "Masukkan telur, air, dan es batu. Uleni hingga setengah kalis.",
    "Tambahkan margarin, BOS, dan garam. Uleni hingga kalis elastis.",
    "Istirahatkan adonan selama 15 menit.",
    "Bagi dan bentuk adonan sesuai selera.",
    "Proofing hingga mengembang dua kali lipat.",
    "Goreng dengan api sedang hingga matang."
  ],
  "baseWeight": null
}

// Document ID: "donut_paha_ayam_special" (demonstrates nested recipes)
{
  "id": "donut_paha_ayam_special",
  "name": "Donut Paha Ayam Special",
  "ingredients": [
    {
      "id": "1",
      "name": "Adonan Donut Paha Ayam",
      "amount": 1,
      "unit": "recipe",
      "type": "recipe",
      "recipeId": "adonan_donut_paha_ayam"
    },
    { "id": "2", "name": "Coklat Ganache", "amount": 50, "unit": "g", "type": "ingredient" },
    { "id": "3", "name": "Keju Parut", "amount": 50, "unit": "g", "type": "ingredient" }
  ],
  "steps": [
    "Buat Adonan Donut Paha Ayam sesuai resep.",
    "Setelah donat digoreng dan dingin, celupkan bagian atasnya ke dalam Coklat Ganache.",
    "Taburi dengan Keju Parut.",
    "Sajikan."
  ],
  "baseWeight": null
}
```

---

## 2. `inventory` Collection Structure

This collection holds information about all raw ingredients and their current stock levels.

**Interface:** `InventoryItem` (from `src/lib/inventoryData.ts`)

```typescript
export interface InventoryItem {
    id: string; // Unique ID for the inventory item
    name: string;
    currentStock: number;
    minimumStock: number;
    unit: string;
    orderUnit?: string; // Optional unit for ordering
    orderUnitConversion?: number; // Conversion factor from order unit to stock unit
    department: 'rotiManis' | 'donut' | 'rotiSobek' | 'bolu' | 'croissant'; // Associated department
    purchasePrice?: number; // Optional purchase price
    supplier?: string; // Optional supplier information
    aliases?: string[]; // Alternative names for the ingredient
}
```

**Diagram (Conceptual):**

```mermaid
erDiagram
    INVENTORY {
        string id PK
        string name
        float currentStock
        float minimumStock
        string unit
        string orderUnit OPTIONAL
        float orderUnitConversion OPTIONAL
        string department ENUM("rotiManis", "donut", "rotiSobek", "bolu", "croissant")
        float purchasePrice OPTIONAL
        string supplier OPTIONAL
        array aliases OPTIONAL
    }
```

**Example Data (`inventory` collection):**

```json
// Document ID: "ing-1"
{
  "id": "ing-1",
  "name": "abon",
  "currentStock": 1800,
  "minimumStock": 1000,
  "unit": "g",
  "department": "rotiManis",
  "purchasePrice": 90000,
  "supplier": "Supplier Daging",
  "aliases": ["Abon Sapi Super"]
}

// Document ID: "ing-6"
{
  "id": "ing-6",
  "name": "ceres",
  "currentStock": 3000,
  "minimumStock": 2000,
  "unit": "g",
  "orderUnit": "dus",
  "orderUnitConversion": 12000,
  "department": "rotiManis",
  "purchasePrice": 650000,
  "supplier": "Toko Bahan Kue B",
  "aliases": ["Meises", "Ceres Classic"]
}
```

---

## 3. `products` Collection Structure

This collection defines the final products, detailing their composition using base recipes and additional ingredients, as well as sales-related information.

**Interfaces:** `ProductData`, `IngredientData`, `CalculationData`, `BaseRecipeData` (from `src/lib/productIngredients.ts`)

```typescript
export interface IngredientData {
    amount: number;
    unit: string;
    type?: 'ingredient' | 'recipe'; // Defaults to 'ingredient'
    recipeId?: string; // Required if type is 'recipe'
}

export interface CalculationData {
    divisor?: number;
    unit?: string;
    multiplier?: number;
}

export interface BaseRecipeData {
    recipeName: string;
    weight: number; // The weight of the base recipe used in this product
}

export interface ProductData {
    ingredients: {
        [ingredientName: string]: IngredientData; // Key is ingredient name, value is its data
    };
    baseRecipes?: BaseRecipeData[]; // Array of base recipes used
    calculation?: CalculationData; // Calculation details for production
    sellingPrice?: number;
    department: 'rotiManis' | 'donut' | 'rotiSobek' | 'bolu' | 'croissant';
}

export interface AllProductsData {
    [productName: string]: ProductData; // Key is product name, value is its data
}
```

**Diagram (Conceptual):**

```mermaid
erDiagram
    PRODUCTS ||--o{ PRODUCT_INGREDIENTS : uses
    PRODUCTS ||--o{ PRODUCT_BASE_RECIPES : based_on
    PRODUCTS ||--o{ PRODUCT_CALCULATION : has

    PRODUCTS {
        string productName PK "Corresponds to product name"
        string department ENUM("rotiManis", "donut", "rotiSobek", "bolu", "croissant")
        float sellingPrice OPTIONAL
    }
    PRODUCT_INGREDIENTS {
        string ingredientName PK
        float amount
        string unit
        string type ENUM("ingredient", "recipe") OPTIONAL
        string recipeId FK "References RECIPES.id if type is 'recipe'" OPTIONAL
    }
    PRODUCT_BASE_RECIPES {
        string recipeName FK "References RECIPES.name"
        float weight
    }
    PRODUCT_CALCULATION {
        float divisor OPTIONAL
        string unit OPTIONAL
        float multiplier OPTIONAL
    }
```

**Example Data (`products` collection):**

```json
// Document ID: "maxicana coklat"
{
  "department": "rotiManis",
  "baseRecipes": [{ "recipeName": "Adonan Roti Manis Mesin", "weight": 45 }],
  "ingredients": {
    "topping maxicana": { "amount": 10, "unit": "g" },
    "coklat filling": { "amount": 10, "unit": "g" }
  },
  "calculation": { "divisor": 15, "unit": "loyang" },
  "sellingPrice": 7000
}

// Document ID: "abon taiwan" (demonstrates baseRecipe with a `weight` that is a fraction of a recipe)
{
  "department": "rotiManis",
  "baseRecipes": [{ "recipeName": "Adonan Abon Taiwan", "weight": 0.25 }],
  "ingredients": {
    "fla abon taiwan": { "amount": 30, "unit": "g" },
    "abon": { "amount": 5, "unit": "g" },
    "mayonaise": { "amount": 1.5, "unit": "g" },
    "wijen putih": { "amount": 0.5, "unit": "g" },
    "wijen hitam": { "amount": 0.5, "unit": "g" }
  },
  "calculation": { "divisor": 15, "unit": "loyang", "multiplier": 2 },
  "sellingPrice": 7000
}
