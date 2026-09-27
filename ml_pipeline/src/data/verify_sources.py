import os
import hashlib
import json
import pandas as pd
import zipfile
import geopandas as gpd

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/external"))

FILES = {
    "places": "PLACES__Census_Tract_Data_(GIS_Friendly_Format),_2022_release_20260904.csv",
    "fara": "FoodAccessResearchAtlasData2019.xlsx",
    "tiger": "tl_2019_42_tract.zip"
}

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

def verify_all_sources():
    results = {}
    print("=== STARTING SOURCE DATA AUDIT ===")
    
    # Check existence
    for key, filename in FILES.items():
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Required file missing: {filepath}")
        
        size = os.path.getsize(filepath)
        sha256 = calculate_sha256(filepath)
        results[key] = {
            "filename": filename,
            "path": filepath,
            "size_bytes": size,
            "sha256": sha256
        }
        print(f"[{key.upper()}] File: {filename}")
        print(f"  - Size: {size:,} bytes")
        print(f"  - SHA256: {sha256}")

    # 1. Audit PLACES 2022
    print("\n--- Auditing CDC PLACES 2022 ---")
    places_path = results["places"]["path"]
    df_places = pd.read_csv(places_path)
    places_total_rows = len(df_places)
    places_cols = list(df_places.columns)
    
    # Standardize decimal comma in DIABETES_CrudePrev
    df_places["DIABETES_CrudePrev_Num"] = pd.to_numeric(
        df_places["DIABETES_CrudePrev"].astype(str).str.replace(",", ".", regex=False),
        errors="coerce"
    )
    
    # GEOID check
    df_places["GEOID"] = df_places["TractFIPS"].apply(normalize_tract_geoid)
    valid_places_geoid = df_places[df_places["GEOID"] != ""]
    unique_places_geoids = df_places["GEOID"].nunique()
    if "" in df_places["GEOID"].unique():
        unique_places_geoids -= 1
        
    philly_places = df_places[df_places["CountyFIPS"].astype(str).str.zfill(5) == "42101"]
    philly_places_valid_geoid = philly_places[philly_places["GEOID"] != ""]
    
    results["places"].update({
        "total_rows": places_total_rows,
        "total_columns": len(places_cols),
        "valid_geoid_rows": len(valid_places_geoid),
        "unique_geoids": unique_places_geoids,
        "philly_rows": len(philly_places),
        "philly_valid_geoids": len(philly_places_valid_geoid)
    })
    print(f"  Total rows: {places_total_rows}")
    print(f"  Columns: {len(places_cols)}")
    print(f"  Valid GEOIDs (11 digits): {len(valid_places_geoid)}")
    print(f"  Unique GEOIDs: {unique_places_geoids}")
    print(f"  Philadelphia (CountyFIPS 42101) rows: {len(philly_places)}")

    # 2. Audit USDA FARA 2019
    print("\n--- Auditing USDA Food Access Research Atlas 2019 ---")
    fara_path = results["fara"]["path"]
    xl = pd.ExcelFile(fara_path)
    sheet_names = xl.sheet_names
    
    df_fara = pd.read_excel(fara_path, sheet_name="Food Access Research Atlas")
    fara_total_rows = len(df_fara)
    fara_cols = list(df_fara.columns)
    
    df_fara["GEOID"] = df_fara["CensusTract"].apply(normalize_tract_geoid)
    valid_fara_geoid = df_fara[df_fara["GEOID"] != ""]
    unique_fara_geoids = df_fara["GEOID"].nunique()
    if "" in df_fara["GEOID"].unique():
        unique_fara_geoids -= 1
        
    df_fara["StateFIPS"] = df_fara["GEOID"].str[:2]
    df_fara["CountyFIPS"] = df_fara["GEOID"].str[:5]
    philly_fara = df_fara[df_fara["CountyFIPS"] == "42101"]
    
    results["fara"].update({
        "sheet_names": sheet_names,
        "total_rows": fara_total_rows,
        "total_columns": len(fara_cols),
        "valid_geoid_rows": len(valid_fara_geoid),
        "unique_geoids": unique_fara_geoids,
        "philly_rows": len(philly_fara)
    })
    print(f"  Sheets: {sheet_names}")
    print(f"  Total rows: {fara_total_rows}")
    print(f"  Columns: {len(fara_cols)}")
    print(f"  Valid GEOIDs: {len(valid_fara_geoid)}")
    print(f"  Unique GEOIDs: {unique_fara_geoids}")
    print(f"  Philadelphia (CountyFIPS 42101) rows: {len(philly_fara)}")

    # 3. Audit TIGER/Line 2019
    print("\n--- Auditing TIGER/Line 2019 PA Tract Shapefile ---")
    tiger_path = results["tiger"]["path"]
    gdf_tiger = gpd.read_file(f"zip://{tiger_path}")
    tiger_total_rows = len(gdf_tiger)
    gdf_tiger["GEOID_Norm"] = gdf_tiger["GEOID"].apply(normalize_tract_geoid)
    
    philly_tiger = gdf_tiger[gdf_tiger["COUNTYFP"] == "101"]
    
    results["tiger"].update({
        "crs": str(gdf_tiger.crs),
        "total_pa_tracts": tiger_total_rows,
        "philly_tracts": len(philly_tiger)
    })
    print(f"  Original CRS: {gdf_tiger.crs}")
    print(f"  Total PA census tracts: {tiger_total_rows}")
    print(f"  Philadelphia tracts (COUNTYFP 101): {len(philly_tiger)}")

    # 4. Join Audits
    print("\n--- Auditing National and Philadelphia Merges ---")
    places_geoids_set = set(valid_places_geoid["GEOID"])
    fara_geoids_set = set(valid_fara_geoid["GEOID"])
    
    national_matches = places_geoids_set.intersection(fara_geoids_set)
    places_only = places_geoids_set - fara_geoids_set
    fara_only = fara_geoids_set - places_geoids_set
    
    philly_places_set = set(philly_places_valid_geoid["GEOID"])
    philly_fara_set = set(philly_fara["GEOID"])
    philly_matches = philly_places_set.intersection(philly_fara_set)
    
    results["join_audit"] = {
        "places_geoids_count": len(places_geoids_set),
        "fara_geoids_count": len(fara_geoids_set),
        "national_matches": len(national_matches),
        "places_only": len(places_only),
        "fara_only": len(fara_only),
        "philly_places_count": len(philly_places_set),
        "philly_fara_count": len(philly_fara_set),
        "philly_matches": len(philly_matches)
    }
    
    print(f"  National PLACES & FARA GEOID Matches: {len(national_matches)}")
    print(f"  Only in PLACES: {len(places_only)}")
    print(f"  Only in FARA: {len(fara_only)}")
    print(f"  Philadelphia PLACES GEOIDs: {len(philly_places_set)}")
    print(f"  Philadelphia FARA GEOIDs: {len(philly_fara_set)}")
    print(f"  Philadelphia Matches: {len(philly_matches)}")

    report_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/processed/source_audit_report.json"))
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nAudit complete. Saved to: {report_path}")
    return results

if __name__ == "__main__":
    verify_all_sources()
