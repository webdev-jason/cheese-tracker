<script setup>
import { ref } from 'vue';

const searchSerial = ref('');
const reportData = ref(null);
const errorMsg = ref('');

const runTrace = async () => {
  if (!searchSerial.value) return;
  
  errorMsg.value = '';
  reportData.value = null;

  try {
    const response = await fetch(`http://localhost:3000/api/trace/${searchSerial.value}`);
    if (!response.ok) {
        errorMsg.value = "❌ Block not found.";
        return;
    }
    const data = await response.json();
    reportData.value = data;
  } catch (err) {
    console.error(err);
    errorMsg.value = "Network Error";
  }
};
</script>

<template>
  <div class="trace-card">
    <h2>🔍 Traceability Search</h2>
    
    <div class="search-bar">
        <input v-model="searchSerial" type="text" placeholder="Scan Barcode (e.g. BLK-1234)" @keyup.enter="runTrace" />
        <button @click="runTrace">Trace</button>
    </div>

    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

    <div v-if="reportData" class="report-result">
        
        <div class="header-info">
            <h3>📦 {{ reportData.block_info.serial_number }}</h3>
            <p><strong>Status:</strong> {{ reportData.block_info.status }}</p>
            <p><strong>Weight:</strong> {{ reportData.block_info.weight }} lbs</p>
        </div>

        <div class="arrow">⬇️ Created From ⬇️</div>

        <div class="run-info">
            <h4>Production Run: {{ reportData.block_info.vat_number }}</h4>
            <p>Date: {{ reportData.block_info.run_date }}</p>
        </div>

        <div class="arrow">⬇️ Containing Ingredients ⬇️</div>

        <table class="ing-table">
            <thead>
                <tr>
                    <th>Ingredient</th>
                    <th>Lot Code</th>
                    <th>Qty Used</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(ing, idx) in reportData.ingredients" :key="idx">
                    <td>{{ ing.name }}</td>
                    <td class="highlight">{{ ing.lot_code }}</td>
                    <td>{{ ing.quantity_used }}</td>
                </tr>
            </tbody>
        </table>
    </div>
  </div>
</template>

<style scoped>
.trace-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1); /* Slightly bigger shadow */
  border: 1px solid #ddd;
  grid-column: span 2; /* Make it stretch across full width if using grid */
}

h2 { margin-top: 0; color: #333; }

.search-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
input { flex-grow: 1; padding: 0.75rem; font-size: 1.1rem; border: 2px solid #3498db; border-radius: 4px; }
button { padding: 0.75rem 1.5rem; background: #3498db; color: white; border: none; font-weight: bold; border-radius: 4px; cursor: pointer; }

.report-result { margin-top: 1.5rem; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }

.header-info { background: #2c3e50; color: white; padding: 1rem; text-align: center; }
.header-info h3 { margin: 0; font-size: 1.5rem; }

.run-info { background: #ecf0f1; padding: 1rem; text-align: center; border-bottom: 1px solid #ccc; }
.run-info h4 { margin: 0 0 0.5rem 0; color: #2c3e50; }

.arrow { text-align: center; padding: 0.5rem; font-size: 1.2rem; color: #999; }

.ing-table { width: 100%; border-collapse: collapse; }
.ing-table th { background: #f8f9fa; padding: 0.5rem; text-align: left; border-bottom: 2px solid #ddd; }
.ing-table td { padding: 0.5rem; border-bottom: 1px solid #eee; }
.highlight { font-weight: bold; color: #e74c3c; } /* Red color for Lot Codes */
.error { color: red; font-weight: bold; margin-top: 1rem; }
</style>