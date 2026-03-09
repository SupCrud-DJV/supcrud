export function renderError(container, message = 'Something went wrong.') {
  container.innerHTML = `
    <div class="page-error">
      <div style="font-size:40px">⚠️</div>
      <p>${message}</p>
      <button class="btn btn-outline btn-sm" onclick="window.location.reload()" style="margin-top:12px">
        Try again
      </button>
    </div>`;
}