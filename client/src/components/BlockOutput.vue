<script setup>
import { ref, onMounted } from 'vue';

const runs = ref([]);
const selectedRunId = ref('');
const weight = ref('');
const lastSerial = ref('');

// 1. Fetch available runs so the user can choose a Vat
const fetchRuns = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/production');
    const data = await response.json();
    runs.value = data.data;
  } catch (error) {
    console.error('Error fetching runs:', error);
  }
};

// 2. Generate a random Serial Number (Simulating a barcode scan)
// Format: BLOCK-[Random 4 Digits]
const generateSerial = () => {
   return 'BLK-' + Math.floor(1000 + Math.random() * 9000);
};

const saveBlock = async () => {
  if (!selectedRunId.value || !weight.value) return;

  const newSerial = generateSerial();

  try {
    const response = await fetch('http://localhost:3000/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            run_id: selectedRunId.value,
            weight: weight.value,
            serial_number: newSerial
        })
    });

    if (response.ok) {
        lastSerial.value = newSerial;
        weight.value = ''; // Clear weight for the next block
        alert(`✅ Block Saved! Serial: ${newSerial}`);
    } else {
        alert('Error saving block');
    }
  } catch (error) {
    console.error(error);
  }
};

// Reload runs when the component loads
onMounted(() => {
    fetchRuns();
});

// Allow the parent to refresh the dropdown list when a new run starts
defineExpose({ fetchRuns });
</script>

<template>
  <div class="output-card">
    <h2>Weigh Finished Blocks</h2>

    <div class="form-group">
        <label>Select Source Vat:</label>
        <select v-model="selectedRunId">
            <option disabled value="">Select Active Run...</option>
            <option v-for="run in runs" :key="run.id" :value="run.id">
                {{ run.vat_number }} ({{ run.run_date }})
            </option>
        </select>
    </div>

    <div class="form-group">
        <label>Block Weight (lbs):</label>
        <input v-model="weight" type="number" placeholder="40.0" step="0.1" />
    </div>

    <button @click="saveBlock" class="btn-print" :disabled="!selectedRunId || !weight">
        Save & Print Label
    </button>
    
    <div v-if="lastSerial" class="last-created">
        Last Block: <strong>{{ lastSerial }}</strong>
    </div>
  </div>
</template>

<style scoped>
.output-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  border: 1px solid #ddd;
  border-left: 5px solid #8e44ad; /* Purple for Finished Goods */
}

h2 { margin-top: 0; color: #2c3e50; }

.form-group { margin-bottom: 1rem; }
label { display: block; font-weight: bold; margin-bottom: 0.5rem; }
input, select { width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }

.btn-print {
    width: 100%;
    padding: 1rem;
    background-color: #8e44ad;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
}
.btn-print:disabled { background-color: #ccc; cursor: not-allowed; }
.btn-print:hover:not(:disabled) { background-color: #732d91; }

.last-created {
    margin-top: 1rem;
    padding: 0.5rem;
    background-color: #f3e5f5;
    color: #8e44ad;
    text-align: center;
    border-radius: 4px;
}
</style>