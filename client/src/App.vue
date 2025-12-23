<script setup>
  import { ref } from 'vue';
  import MaterialForm from './components/MaterialForm.vue';
  import MaterialList from './components/MaterialList.vue';

  // --- CORE CONCEPT: TEMPLATE REF ---
  // This variable "inventoryList" will eventually hold the actual
  // MaterialList component instance, allowing us to control it.
  const inventoryList = ref(null);

  // This function runs when the Form says "I added something!"
  const handleMaterialAdded = () => {
    // We tell the list to re-fetch its data from the server
    inventoryList.value.fetchMaterials();
  };
</script>

<template>
  <div class="app-container">
    <header>
      <div class="logo">🧀</div>
      <h1>Cheese Tracker</h1>
    </header>

    <main>
      <div class="dashboard-grid">
        <div class="column">
            <MaterialForm @added="handleMaterialAdded" />
        </div>

        <div class="column">
            <MaterialList ref="inventoryList" />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Arial, sans-serif;
  background-color: #f4f6f8;
  min-height: 100vh;
}

header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #ddd;
}

.logo {
  font-size: 2.5rem;
}

h1 {
  color: #2c3e50;
  margin: 0;
}

/* Simple Grid Layout */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>