import os
import json
import hashlib
import pandas as pd
import geopandas as gpd

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/external"))
PROCESSED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/processed"))
MANIFEST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/manifests"))

PLACES_FILENAME = "PLACES__Census_Tract_Data_(GIS_Friendly_Format),_2022_release_20260904.csv"
FARA_FILENAME = "FoodAccessResearchAtlasData2019.xlsx"
TIGER_FILENAME = "tl_2019_42_tract.zip"

def normalize_tract_geoid(val) -> str:
    if pd.isna(val):
        return ""
    val_str = str(val).strip()
    if val_str.endswith(".0"):
        val_str = val_str[:-2]
    val_str = val_str.zfill(11)
    if len(val_str) == 11 and val_str.isdigit():
        return val_str
    return ""

def calculate_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192*1024):
            h.update(chunk)
    return h.hexdigest()

def fetch_and_integrate_data():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    os.makedirs(MANIFEST_DIR, exist_ok=True)
    
    places_path = os.path.join(DATA_DIR, PLACES_FILENAME)
    fara_path = os.path.join(DATA_DIR, FARA_FILENAME)
    tiger_path = os.path.join(DATA_DIR, TIGER_FILENAME)

    for p in [places_path, fara_path, tiger_path]:
        if not os.path.exists(p):
            raise FileNotFoundError(f"Missing required public file: {p}")

    places_sha = calculate_sha256(places_path)
    fara_sha = calculate_sha256(fara_path)
    tiger_sha = calculate_sha256(tiger_path)

    print("--- Loading & cleaning CDC PLACES 2022 ---")
    df_places = pd.read_csv(places_path)
    df_places["GEOID"] = df_places["TractFIPS"].apply(normalize_tract_geoid)
    df_places = df_places[df_places["GEOID"] != ""].copy()
    
    df_places["DIABETES_CrudePrev"] = pd.to_numeric(
        df_places["DIABETES_CrudePrev"].astype(str).str.replace(",", ".", regex=False),
        errors="coerce"
    )

    print("--- Loading & cleaning USDA FARA 2019 ---")
    df_fara = pd.read_excel(fara_path, sheet_name="Food Access Research Atlas")
    df_fara["GEOID"] = df_fara["CensusTract"].apply(normalize_tract_geoid)
    df_fara = df_fara[df_fara["GEOID"] != ""].copy()

    print("--- Merging PLACES and FARA nationally on GEOID ---")
    df_merged = pd.merge(
        df_places,
        df_fara,
        on="GEOID",
        how="inner",
        suffixes=("_places", "_fara")
    )
    df_merged["CountyFIPS"] = df_merged["GEOID"].str[:5]
    df_merged["StateFIPS"] = df_merged["GEOID"].str[:2]

    print("--- Loading TIGER/Line 2019 PA census tracts ---")
    gdf_tiger = gpd.read_file(f"zip://{tiger_path}")
    gdf_tiger["GEOID"] = gdf_tiger["GEOID"].apply(normalize_tract_geoid)
    gdf_philly_tiger = gdf_tiger[gdf_tiger["COUNTYFP"] == "101"].copy()
    gdf_philly_tiger = gdf_philly_tiger.to_crs(epsg=4326)

    places_national_rows = len(df_places)
    fara_national_rows = len(df_fara)
    national_matches = len(df_merged)

    philly_places_cnt = len(df_places[df_places["GEOID"].str.startswith("42101")])
    philly_fara_cnt = len(df_fara[df_fara["GEOID"].str.startswith("42101")])
    philly_merged_cnt = len(df_merged[df_merged["GEOID"].str.startswith("42101")])

    print(f"National PLACES rows: {places_national_rows}")
    print(f"National FARA rows: {fara_national_rows}")
    print(f"National Matched rows: {national_matches}")
    print(f"Philadelphia PLACES: {philly_places_cnt}")
    print(f"Philadelphia FARA: {philly_fara_cnt}")
    print(f"Philadelphia Matched: {philly_merged_cnt}")

    merged_output_path = os.path.join(PROCESSED_DIR, "us_tracts_merged_raw.csv")
    df_merged.to_csv(merged_output_path, index=False)

    manifest_data = {
        "version": "V2.1",
        "data_sources": {
            "cdc_places": {
                "file": PLACES_FILENAME,
                "sha256": places_sha,
                "total_rows": places_national_rows,
                "philly_rows": philly_places_cnt
            },
            "usda_fara": {
                "file": FARA_FILENAME,
                "sha256": fara_sha,
                "total_rows": fara_national_rows,
                "philly_rows": philly_fara_cnt
            },
            "tiger_line": {
                "file": TIGER_FILENAME,
                "sha256": tiger_sha,
                "pa_tracts": len(gdf_tiger),
                "philly_tracts": len(gdf_philly_tiger)
            }
        },
        "audit": {
            "national_matches": national_matches,
            "philly_matches": philly_merged_cnt
        }
    }
    
    with open(os.path.join(MANIFEST_DIR, "data_manifest_v2_1.json"), "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)
    # Also save to data_manifest.json for backwards compatibility
    with open(os.path.join(MANIFEST_DIR, "data_manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)

    return df_merged, gdf_philly_tiger, manifest_data

if __name__ == "__main__":
    fetch_and_integrate_data()
