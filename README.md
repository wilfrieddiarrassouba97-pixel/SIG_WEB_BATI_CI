# SIG Web - Évolution du bâti en Côte d'Ivoire

Application cartographique permettant de comparer les surfaces bâties pour les
années 2015, 2020 et 2025. Les données actuellement fournies couvrent la zone
d'Abidjan.

## Fonctionnalités

- Carte interactive Leaflet cadrée automatiquement sur les données
- Fonds OpenStreetMap et imagerie satellite Esri
- Affichage exclusif de la classe bâtie (`gridcode = 1`) par année
- Graphique d'évolution avec Chart.js
- Surface bâtie et taux d'évolution entre deux périodes
- Population et densité estimées du district autonome d'Abidjan
- Interface responsive pour ordinateur et mobile

## Lancement

Les données sont chargées avec `fetch()`. Le projet doit donc être servi par un
serveur HTTP local et ne doit pas être ouvert directement avec `file://`.

Avec l'extension VS Code **Live Server** :

1. Ouvrir `index.html`.
2. Cliquer sur **Go Live** dans la barre d'état de VS Code.
3. La page de présentation s'affiche. Cliquer sur **Accéder au WebSIG** pour ouvrir la carte.

La présentation se trouve dans `index.html`, avec ses styles dans `css/home.css`.
Le nom, le titre et le texte de présentation peuvent être personnalisés dans cette page.
La carte et ses fonctionnalités sont accessibles dans `websig.html`. Le lien
**Présentation** dans son en-tête permet de revenir à l'accueil.

Avec Python, lorsqu'il est installé :

```powershell
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

## Données géographiques

Les fichiers actuels sont des GeoJSON en coordonnées WGS84 (`EPSG:4326`).
L'application les charge directement dans Leaflet et, lorsque l'attribut
`gridcode` est présent, n'affiche que les entités dont la valeur vaut `1`.

Fichiers utilisés :

- `data/geojson/2015.geojson`
- `data/geojson/2020.geojson`
- `data/geojson/2025.geojson`

## Données statistiques

Les fichiers `data/csv/Surface_Batie_2015.csv`,
`data/csv/Surface_Batie_2020.csv` et `data/csv/Surface_Batie_2025.csv`
contiennent la surface bâtie totale en hectares.

```csv
annee,surface_batie_ha,population_estimee,densite_estimee_hab_km2
2015,2492.9254499348467,4909847,2317.06
2020,4913.479136056985,6060388,2860.02
2025,2981.12345598786,7480540,3530.22
```

L'application convertit automatiquement les hectares en km². Elle accepte aussi
une colonne `surface_km2`. Les colonnes `population_estimee` et
`densite_estimee_hab_km2` alimentent les indicateurs démographiques.

Les populations 2015, 2020 et 2025 sont des estimations exponentielles calculées
à partir des populations officielles du district autonome d'Abidjan aux RGPH
2014 (4 707 404 habitants) et 2021 (6 321 017 habitants). La densité est
calculée avec une superficie constante de 2 119 km². Ces estimations ne doivent
pas être présentées comme des résultats de recensement.

Sources :

- Portail officiel des données ouvertes :
  <https://data.gouv.ci/datasets?topics=PZ_0BXJLMHyeQEl1QV0bd>
- Résultats globaux du RGPH 2021, Institut National de la Statistique :
  <https://www.ins.ci/RGPH2021/RGPH2021-RESULTATS%20GLOBAUX_VF.pdf>

## Ajouter une année

1. Ajouter le fichier JSON Esri ou GeoJSON dans `data/geojson/`.
2. Ajouter la ligne correspondante dans le CSV.
3. Ajouter l'année et son chemin dans `js/config.js`.
4. Ajouter un bouton avec l'attribut `data-year` dans `websig.html`.

## Structure

```text
index.html
websig.html
css/home.css
css/style.css
js/config.js
js/map.js
js/layers.js
js/chart.js
js/stats.js
js/main.js
data/geojson/
data/csv/
```
