<template>
  <header class="header">
    <h1 class="title">
      <img src="~/assets/images/로고_투명.png" alt="매일일독" class="logo">
    </h1>
    <button class="menu-button">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  letter-spacing: -0.05em;
  height: 56px;
}

.title {
  display: flex;
  align-items: center;
}

.logo {
  height: 20px;
  width: auto;
}

.menu-button {
  background: none;
  border: none;
  padding: 0.5rem;
  margin: -0.5rem;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-button:hover {
  opacity: 0.7;
}

.menu-button:active {
  transform: scale(0.95);
}
</style> 