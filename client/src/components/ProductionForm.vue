<script setup>
import { ref, onMounted, computed } from 'vue';

const emit = defineEmits(['run-started']);

// --- STATE VARIABLES ---
const runDate = ref(new Date().toISOString().substr(0, 10)); // Default to Today
const vatNumber = ref('');
const availableMaterials = ref([]); // List from DB
const addedIngredients = ref([]); // The "Shopping Cart" for this run

// Temporary variables for the "Add Ingredient" inputs
const selectedMaterialId = ref('');
const usageQuantity = ref('');

// --- LOAD INVENTORY ---
const fetchInventory = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/materials');
    const data = await response.json();
    availableMaterials.value = data.data;
  } catch (error) {
    console.error('Error loading inventory:', error);
  }
};

onMounted(() => {
  fetchInventory();
});

// --- STAGING LOGIC ---
// Helper to find the name of the selected material for display
const selectedMaterialName = computed(() => {
  const m = availableMaterials.value.find(m => m.id === selectedMaterialId.value);
  return m ? `${m.name} (${m.lot_code})` : '';
});

const addToVat = () => {
  if (!selectedMaterialId.value || !usageQuantity.value) return;

  // Add to our temporary "Cart"
  addedIngredients.value.push({
    id: selectedMaterialId.value, // The Database ID
    name: selectedMaterialName.value, // Just for display
    quantity: usageQuantity.value
  });

  // Reset the little form inputs
  selectedMaterialId.value = '';
  usageQuantity.value = '';
};

// --- SUBMIT LOGIC ---
const startProduction = async () => {
  const payload = {
    run_date: runDate.value,
    vat_number: vatNumber.value,
    ingredients: addedIngredients.value
  };

  try {
    const response = await fetch('http://localhost:3000/api/production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      alert('Production Run Started!');
      // Reset Form
      vatNumber.value = '';
      addedIngredients.value = [];
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
        <div class="form-group">
            <label>Vat / Batch #:</label>
            <input v-model="vatNumber" type="text" placeholder="e.g. Vat-01" />
        </div>
      </div>
    </div>

    <div class="section ingredients-section">
      <h3>Add Ingredients</h3>
      <div class="form-row">
        <div class="form-group grow">
            <select v-model="selectedMaterialId">
                <option disabled value="">Select Material...</option>
                <option v-for="mat in availableMaterials" :key="mat.id" :value="mat.id">
                    {{ mat.name }} - {{ mat.lot_code }} (Avail: {{ mat.quantity }})
                </option>
            </select>
        </div>
        <div class="form-group small">
            <input v-model="usageQuantity" type="number" placeholder="Qty Used" />
        </div>
        <button @click="addToVat" class="btn-add">+</button>
      </div>

      <ul class="staging-list">
        <li v-for="(item, index) in addedIngredients" :key="index">
            <span>{{ item.quantity }} lbs of <strong>{{ item.name }}</strong></span>
        </li>
      </ul>
    </div>

    <button @click="startProduction" class="btn-start" :disabled="addedIngredients.length === 0">
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

.section {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
}

.ingredients-section {
    background-color: #f9f9f9;
    padding: 1rem;
    border-radius: 4px;
}

.form-row { display: flex; gap: 1rem; align-items: flex-end; }
.form-group { display: flex; flex-direction: column; }
.form-group.grow { flex-grow: 1; }
.form-group.small { width: 100px; }

input, select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.btn-add {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    height: 38px; /* Match input height */
}

.staging-list {
    list-style: none;
    padding: 0;
    margin-top: 1rem;
    background: white;
    border: 1px solid #eee;
}

.staging-list li {
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
}

.btn-start {
    width: 100%;
    padding: 1rem;
    background-color: #e67e22; /* Orange for Action */
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
}
.btn-start:disabled { background-color: #ccc; cursor: not-allowed; }
.btn-start:hover:not(:disabled) { background-color: #d35400; }
</style>