<script setup>
import { ref, onMounted } from 'vue';

const materials = ref([]);
const loading = ref(true);

const fetchMaterials = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/materials');
    const data = await response.json();
    materials.value = data.data; 
    loading.value = false;
  } catch (error) {
    console.error('Error fetching materials:', error);
    loading.value = false;
  }
};

onMounted(() => {
  fetchMaterials();
});

// --- CORE CONCEPT: EXPOSE ---
// We allow the Parent component to call this function from the outside.
defineExpose({
    fetchMaterials
});
</script>

<template>
  <div class="list-card">
    <h2>Current Inventory</h2>
    
    <div v-if="loading">Loading data...</div>

    <div v-else-if="materials.length === 0">
      <p>No inventory found.</p>
    </div>

    <table v-else>
      <thead>
        <tr>
          <th>Name</th>
          <th>Lot Code</th>
          <th>Qty</th>
          <th>Date Received</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in materials" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ item.lot_code }}</td>
          <td>{{ item.quantity }} {{ item.unit }}</td>
          <td>{{ new Date(item.received_date).toLocaleDateString() }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.list-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  border: 1px solid #ddd;
  margin-top: 2rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  font-weight: bold;
}

tr:hover {
  background-color: #f1f1f1;
}
</style>