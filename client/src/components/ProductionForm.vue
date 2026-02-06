<script setup>
import { ref, onMounted, computed, watch } from 'vue';

const emit = defineEmits(['run-started']);

// --- STATE VARIABLES ---
const runDate = ref(new Date().toISOString().substr(0, 10));
const availableMaterials = ref([]); 
const recipeRows = ref([]); // Stores the rows for the current recipe

// Dropdown State
const cheeseType = ref('CH');
const vatSequence = ref('01');

// Manual Add Variables (for extras not in recipe)
const extraMaterialId = ref('');
const extraQuantity = ref('');

// --- DATA: CHEESE TYPES ---
const cheeseTypes = [
  { code: 'CH', name: 'Cheddar' },
  { code: 'JK', name: 'Monterey Jack' },
  { code: 'IF', name: 'In Your Face' },
  { code: 'VS', name: 'Vampire Slayer' },
  { code: 'PC', name: 'Peppercorn Harvest' },
  { code: 'PJ', name: 'Pepper Jack' }
];

// --- DATA: RECIPES ---
const BASE_INGREDIENTS = ['Milk', 'Salt', 'Culture', 'Rennet'];

const RECIPES = {
  'CH': [...BASE_INGREDIENTS],
  'JK': [...BASE_INGREDIENTS],
  'IF': [...BASE_INGREDIENTS, 'Jalepeno Peppers', 'Habanero Peppers', 'Sweet Red Peppers'],
  'PJ': [...BASE_INGREDIENTS, 'Jalepeno Peppers', 'Habanero Peppers', 'Sweet Red Peppers'],
  'VS': [...BASE_INGREDIENTS, 'Garlic'],
  'PC': [...BASE_INGREDIENTS, 'Green Peppercorns', 'Red Peppercorns']
};

// --- COMPUTED BATCH NUMBER ---
const vatNumber = computed(() => {
  const cleanDate = runDate.value.replace(/-/g, '');
  return `${cleanDate}${cheeseType.value}${vatSequence.value}`;
});

// --- LOAD INVENTORY ---
const fetchInventory = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/materials');
    const data = await response.json();
    availableMaterials.value = data.data;
    generateRecipeRows(); // Build the table once inventory is ready
  } catch (error) {
    console.error('Error loading inventory:', error);
  }
};

onMounted(() => {
  fetchInventory();
});

// --- RECIPE ROW GENERATION ---
const generateRecipeRows = () => {
  const ingredientsNeeded = RECIPES[cheeseType.value] || [];
  
  // Create a clean row for each required ingredient
  recipeRows.value = ingredientsNeeded.map(name => ({
    name: name,             // The label (e.g. "Milk")
    selectedMaterialId: '', // User selects this from dropdown
    quantity: ''            // User types this
  }));
};

// Watch for changes in cheese type to rebuild the rows
watch(cheeseType, () => {
  generateRecipeRows();
});

// --- HELPER: FILTER INVENTORY FOR DROPDOWN ---
// Finds all available materials that match the recipe ingredient name
const getOptionsForIngredient = (ingredientName) => {
  return availableMaterials.value.filter(mat => 
    mat.name.toLowerCase().includes(ingredientName.toLowerCase()) && mat.quantity > 0
  );
};

// --- SUBMIT LOGIC ---
const startProduction = async () => {
  const finalIngredients = [];

  // 1. Process Recipe Rows
  for (const row of recipeRows.value) {
    // Skip if user left it blank (optional, or we could force validation)
    if (row.selectedMaterialId && row.quantity) {
      finalIngredients.push({
        id: row.selectedMaterialId,
        quantity: row.quantity
      });
    }
  }

  // 2. Process Extra Manual Item (if exists)
  if (extraMaterialId.value && extraQuantity.value) {
    finalIngredients.push({
      id: extraMaterialId.value,
      quantity: extraQuantity.value
    });
  }

  if (finalIngredients.length === 0) {
    alert("Please add at least one ingredient.");
    return;
  }

  const payload = {
    run_date: runDate.value,
    vat_number: vatNumber.value,
    ingredients: finalIngredients
  };

  try {
    const response = await fetch('http://localhost:3000/api/production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      alert(`Production Run Started! Batch: ${vatNumber.value}`);
      // Reset logic
      generateRecipeRows(); 
      extraMaterialId.value = '';
      extraQuantity.value = '';
      emit('run-started');
    } else {
      alert('Error starting run');
    }
  } catch (error) {
    console.error(error);
  }
};
</script>

<template>
  <div class="production-card">
    <h2>Start Production Run</h2>

    <div class="section">
      <div class="form-row">
        <div class="form-group">
            <label>Date:</label>
            <input v-model="runDate" type="date" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group grow">
            <label>Cheese Type:</label>
            <select v-model="cheeseType">
                <option v-for="type in cheeseTypes" :key="type.code" :value="type.code">
                    {{ type.name }} ({{ type.code }})
                </option>
            </select>
        </div>

        <div class="form-group small">
            <label>Vat #:</label>
            <select v-model="vatSequence">
                <option value="01">01</option>
                <option value="02">02</option>
                <option value="03">03</option>
                <option value="04">04</option>
            </select>
        </div>
      </div>
    </div>

    <div class="section ingredients-section">
      <h3>Recipe Ingredients</h3>
      
      <table class="recipe-table">
        <thead>
            <tr>
                <th style="width: 25%">Ingredient</th>
                <th>Select Lot Code</th>
                <th style="width: 20%">Quantity</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(row, index) in recipeRows" :key="index">
                <td class="label-cell">{{ row.name }}</td>
                <td>
                    <select v-model="row.selectedMaterialId" class="lot-select">
                        <option value="" disabled>Select Lot...</option>
                        <option 
                            v-for="opt in getOptionsForIngredient(row.name)" 
                            :key="opt.id" 
                            :value="opt.id"
                        >
                            {{ opt.lot_code }} ({{ opt.quantity }} {{ opt.unit }} avail)
                        </option>
                    </select>
                </td>
                <td>
                    <input v-model="row.quantity" type="number" placeholder="Qty" />
                </td>
            </tr>
        </tbody>
      </table>

      <div class="manual-add">
          <h4>Add Extra / Non-Recipe Item:</h4>
          <div class="form-row">
            <div class="form-group grow">
                <select v-model="extraMaterialId">
                    <option disabled value="">Select Material...</option>
                    <option v-for="mat in availableMaterials" :key="mat.id" :value="mat.id">
                        {{ mat.name }} - {{ mat.lot_code }}
                    </option>
                </select>
            </div>
            <div class="form-group small">
                <input v-model="extraQuantity" type="number" placeholder="Qty" />
            </div>
          </div>
      </div>
    </div>

    <button @click="startProduction" class="btn-start">
        Start Production
    </button>
  </div>
</template>

<style scoped>
.production-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  border: 1px solid #ddd;
}

h2 { margin-top: 0; color: #2c3e50; }
h3 { font-size: 1rem; margin-bottom: 0.5rem; color: #666; }
h4 { font-size: 0.9rem; margin: 0.5rem 0; color: #888; }

.section { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
.ingredients-section { background-color: #f9f9f9; padding: 1rem; border-radius: 4px; }

.form-row { display: flex; gap: 1rem; align-items: flex-end; margin-bottom: 0.5rem; }
.form-group { display: flex; flex-direction: column; }
.form-group.grow { flex-grow: 1; }
.form-group.small { width: 80px; }

input, select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  height: 38px;
  box-sizing: border-box;
  width: 100%;
}

/* Table Styling */
.recipe-table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #ddd; margin-bottom: 1rem; }
.recipe-table th { text-align: left; padding: 0.5rem; background: #eee; font-size: 0.85rem; color: #555; }
.recipe-table td { padding: 0.5rem; border-bottom: 1px solid #eee; font-size: 0.95rem; vertical-align: middle; }

.label-cell { font-weight: bold; color: #2c3e50; }
.lot-select { width: 100%; }

.manual-add { margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #ccc; }

.btn-start {
    width: 100%; padding: 1rem; background-color: #e67e22; color: white;
    border: none; border-radius: 4px; font-size: 1.1rem; font-weight: bold; cursor: pointer;
}
.btn-start:hover { background-color: #d35400; }
</style>