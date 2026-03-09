export function renderLoader(container) {
  container.innerHTML = `
    <div class="page-loader">
      <div class="spinner"></div>
      <span>Loading...</span>
    </div>`;
}