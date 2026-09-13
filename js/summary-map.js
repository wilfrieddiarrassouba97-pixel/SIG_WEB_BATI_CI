"use strict";

(function initializeSummaryMap() {
  const dialog = document.getElementById("summary-map-dialog");
  const openButton = document.getElementById("summary-map-open");
  const closeButton = document.getElementById("summary-map-close");

  if (!dialog || !openButton || !closeButton) return;

  openButton.addEventListener("click", () => dialog.showModal());
  closeButton.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
})();
