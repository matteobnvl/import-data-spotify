# SCRIPT IMPORT DATA SPOTIFY

## création de la bdd

```
docker compose up -d --build

node create_table.js
```

## lancement script import
- mettre les fichiers à importer dans un dossier appelé data

```
node script_import.js 
```
