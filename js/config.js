"use strict";

window.APP_CONFIG = Object.freeze({
  map: Object.freeze({
    center: Object.freeze([7.54, -5.55]),
    zoom: 7,
    minZoom: 6,
    maxZoom: 18,
    countryBounds: Object.freeze([
      Object.freeze([4.2, -8.7]),
      Object.freeze([10.75, -2.45])
    ]),
    maxBounds: Object.freeze([
      Object.freeze([3.5, -9.6]),
      Object.freeze([11.5, -1.6])
    ])
  }),

  years: Object.freeze([2015, 2020, 2025]),
  defaultYear: 2015,

  data: Object.freeze({
    builtLayers: Object.freeze({
      2015: "data/geojson/2015.geojson",
      2020: "data/geojson/2020.geojson",
      2025: "data/geojson/2025.geojson"
    }),
    studyArea: "data/geojson/zone_etude_abidjan.geojson",
    evolution: "data/geojson/EVOLUTION DU BATIE 2015-2025.geojson",
    surfacesCsv: Object.freeze([
      "data/csv/Resultats_Evolution_Bati_Abidjan_2015_2020_2025.csv"
    ])
  }),

  baseMaps: Object.freeze({
    openStreetMap: Object.freeze({
      label: "OpenStreetMap",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: Object.freeze({
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      })
    }),
    gray: Object.freeze({
      label: "Fond de carte gris",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: Object.freeze({
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        className: "basemap-gray",
        maxZoom: 19
      })
    }),
    satellite: Object.freeze({
      label: "Imagerie satellite",
      url:
        "https://server.arcgisonline.com/ArcGIS/rest/services/" +
        "World_Imagery/MapServer/tile/{z}/{y}/{x}",
      options: Object.freeze({
        attribution:
          "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        maxZoom: 19
      })
    })
  }),

  builtLayerStyle: Object.freeze({
    color: "#c2410c",
    weight: 0,
    opacity: 0,
    fillColor: "#e34a33",
    fillOpacity: 0.65
  }),

  evolutionClasses: Object.freeze({
    1: Object.freeze({ label: "Bâti existant en 2015", color: "#dc2626" }),
    2: Object.freeze({ label: "Nouveau bâti entre 2015 et 2020", color: "#16a34a" }),
    3: Object.freeze({ label: "Nouveau bâti entre 2020 et 2025", color: "#9333ea" })
  }),

  comparisonStyles: Object.freeze({
    left: Object.freeze({ color: "#c2410c", fillColor: "#f97316", weight: 0, opacity: 0, fillOpacity: 0.65 }),
    right: Object.freeze({ color: "#7f1d1d", fillColor: "#b91c1c", weight: 0, opacity: 0, fillOpacity: 0.65 })
  }),

  studyAreaStyle: Object.freeze({
    color: "#2563eb",
    weight: 3,
    opacity: 1,
    fillColor: "#3b82f6",
    fillOpacity: 0.05,
    dashArray: "8 6"
  }),

  chart: Object.freeze({
    borderColor: "#0f766e",
    backgroundColor: "rgba(15, 118, 110, 0.18)"
  })
});
