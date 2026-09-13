"use strict";

(function initializeChartModule() {
  const config = window.APP_CONFIG;
  const canvas = document.getElementById("surface-chart");
  let chart = null;

  function render(rows) {
    if (!canvas || typeof Chart === "undefined") {
      return;
    }

    const labels = rows.map((row) => row.annee);
    const values = rows.map((row) => row.surface_km2);

    if (chart) {
      chart.destroy();
    }

    chart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Surface bâtie (km²)",
          data: values,
          borderColor: config.chart.borderColor,
          backgroundColor: config.chart.backgroundColor,
          borderWidth: 3,
          pointBackgroundColor: config.chart.borderColor,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.25
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${Number(context.parsed.y).toLocaleString("fr-FR")} km²`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "km²"
            }
          }
        }
      }
    });
  }

  function highlightYear(year) {
    if (!chart) {
      return;
    }

    const index = chart.data.labels.indexOf(Number(year));
    chart.data.datasets[0].pointRadius = chart.data.labels.map((_, itemIndex) =>
      itemIndex === index ? 7 : 4
    );
    chart.update();
  }

  window.ChartApp = Object.freeze({
    render,
    highlightYear
  });
})();
