<script setup>
  import { ref } from 'vue';
  import MaterialForm from './components/MaterialForm.vue';
  import MaterialList from './components/MaterialList.vue';
  import ProductionForm from './components/ProductionForm.vue';
  import BlockOutput from './components/BlockOutput.vue'; // New Import

  const inventoryList = ref(null);
  const blockStation = ref(null); // Ref to update the dropdown

  const handleMaterialAdded = () => {
    inventoryList.value.fetchMaterials();
  };

  const handleRunStarted = () => {
    // When a new run starts, tell the Block Station to refresh its dropdown
    // so the new Vat appears immediately.
    if (blockStation.value) {
        blockStation.value.fetchRuns();
    }
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
            <div class="spacer"></div>
            <ProductionForm @run-started="handleRunStarted" />
        </div>

        <div class="column">
            <BlockOutput ref="blockStation" />
            
            <div class="spacer"></div>

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

.logo { font-size: 2.5rem; }
h1 { color: #2c3e50; margin: 0; }

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Changed to equal width 1fr 1fr */
  gap: 2rem;
  align-items: start;
}

.spacer { height: 2rem; }

@media (max-width: 768px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}
</style>