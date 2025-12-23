<script setup>
import { ref } from 'vue';

// --- CORE CONCEPT: EMITS ---
// This defines the "signals" this component can send to its parent.
const emit = defineEmits(['added']);

const name = ref('');
const lotCode = ref('');
const quantity = ref('');
const unit = ref('lbs');
const statusMessage = ref('');

const submitMaterial = async () => {
  const newMaterial = {
    name: name.value,
    lot_code: lotCode.value,
    quantity: quantity.value,
    unit: unit.value
  };

  try {
    const response = await fetch('http://localhost:3000/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMaterial)
    });

    if (response.ok) {
      statusMessage.value = '✅ Success! Material saved.';
      name.value = '';
      lotCode.value = '';
      quantity.value = '';
      
      // --- THE CHANGE ---
      // We shout "added" to the parent component.
      emit('added'); 
      
    } else {
      statusMessage.value = '❌ Error saving material.';
    }
  } catch (error) {
    console.error(error);
    statusMessage.value = '❌ Server connection failed.';
  }
};
</script>

<template>
  <div class="form-card">
    <h2>Receive Raw Material</h2>
    
    <div class="form-group">
      <label>Material Name:</label>
      <input v-model="name" type="text" placeholder="e.g. Whole Milk" />
    </div>

    <div class="form-group">
      <label>Lot Code:</label>
      <input v-model="lotCode" type="text" placeholder="e.g. LOT-2025-A" />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Quantity:</label>
        <input v-model="quantity" type="number" placeholder="0.00" />
      </div>

      <div class="form-group">
        <label>Unit:</label>
        <select v-model="unit">
          <option value="lbs">lbs</option>
          <option value="gal">gal</option>
          <option value="kg">kg</option>
          <option value="units">units</option>
        </select>
      </div>
    </div>

    <button @click="submitMaterial" class="btn-save">Add to Inventory</button>
    
    <p v-if="statusMessage" class="status">{{ statusMessage }}</p>
  </div>
</template>

<style scoped>
.form-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  max-width: 400px;
  border: 1px solid #ddd;
}

h2 {
  margin-top: 0;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

input, select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.btn-save {
  width: 100%;
  padding: 0.75rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: bold;
}

.btn-save:hover {
  background-color: #33a06f;
}

.status {
  margin-top: 1rem;
  text-align: center;
  font-weight: bold;
}
</style>