<script setup>
import { ref } from 'vue';

const searchLot = ref('');
const reportData = ref(null);
const errorMsg = ref('');

const runTrace = async () => {
  if (!searchLot.value) return;
  
  errorMsg.value = '';
  reportData.value = null;

  try {
    // Note: We are using the new /api/trace-lot endpoint
    const response = await fetch(`http://localhost:3000/api/trace-lot/${searchLot.value}`);
    
    if (!response.ok) {
        // Parse the specific error message from the server
        const errData = await response.json();
        errorMsg.value = errData.error || "❌ Lot not found.";
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
    <h2>🔍 Recall Search (Forward Trace)</h2>
    
    <div class="search-bar">
        <input 
            v-model="searchLot" 
            type="text" 
            placeholder="Lot #" 
            @keyup.enter="runTrace" 
        />
        <button @click="runTrace">Trace Usage</button>
    </div>

    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

    <div v-if="reportData" class="report-result">
        
        <div class="header-info">
            <h3>📦 {{ reportData.material }}</h3>
            <p><strong>Lot Code:</strong> {{ reportData.lot_code }}</p>
        </div>

        <div class="arrow">⬇️ Was Used In ⬇️</div>

        <div v-for="(runInfo, vatNumber) in reportData.runs" :key="vatNumber" class="run-container">
            <div class="run-header">
                <h4>🏭 Vat: {{ vatNumber }}</h4>
                <span>{{ runInfo.date }}</span>
            </div>

            <div v-if="runInfo.blocks.length > 0">
                <table class="block-table">
                    <thead>
                        <tr>
                            <th>Affected Block Serial</th>
                            <th>Weight</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="block in runInfo.blocks" :key="block.serial">
                            <td class="highlight">{{ block.serial }}</td>
                            <td>{{ block.weight }} lbs</td>
                            <td>{{ block.status }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else class="no-blocks">
                <p>⚠️ No finished blocks recorded for this run yet.</p>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.trace-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  border: 1px solid #ddd;
  /* Remove the grid-column span here, we handle layout in App.vue */
}

h2 { margin-top: 0; color: #c0392b; /* Red for Recall/Alert */ }

.search-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
input { flex-grow: 1; padding: 0.75rem; font-size: 1.1rem; border: 2px solid #c0392b; border-radius: 4px; }
button { padding: 0.75rem 1.5rem; background: #c0392b; color: white; border: none; font-weight: bold; border-radius: 4px; cursor: pointer; }
button:hover { background: #a93226; }

.report-result { margin-top: 1.5rem; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }

.header-info { background: #2c3e50; color: white; padding: 1rem; text-align: center; }
.header-info h3 { margin: 0; font-size: 1.5rem; }

.arrow { text-align: center; padding: 0.5rem; font-size: 1.2rem; color: #999; background-color: #f9f9f9; }

.run-container { border-top: 2px solid #ddd; }

.run-header { 
    background: #ecf0f1; 
    padding: 0.75rem 1rem; 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    font-weight: bold; 
    color: #2c3e50;
}

.block-table { width: 100%; border-collapse: collapse; }
.block-table th { background: #fff; padding: 0.5rem; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; color: #7f8c8d; }
.block-table td { padding: 0.5rem; border-bottom: 1px solid #eee; }

.highlight { font-weight: bold; color: #c0392b; }
.error { color: red; font-weight: bold; margin-top: 1rem; }
.no-blocks { padding: 1rem; color: #7f8c8d; font-style: italic; }
</style>