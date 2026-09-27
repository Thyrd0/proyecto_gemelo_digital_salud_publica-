import os
import json
import pandas as pd
import geopandas as gpd

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/external"))
PROCESSED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/processed"))

PREDICTOR_COLS_RAW = [
    "Urban", "Pop2010", "PovertyRate", "MedianFamilyIncome",
    "LowIncomeTracts", "HUNVFlag", "LILATracts_1And10", "LILATracts_halfAnd10",
    "LILATracts_Vehicle", "lapophalfshare", "lalowihalfshare", "lahunvhalfshare",
    "lapop1share", "lalowi1share", "lahunv1share", "OHU2010", "TractHUNV", "TractSNAP"
]

FORBIDDEN_PREDICTORS = [
    "OBESITY_CrudePrev", "LPA_CrudePrev", "BPHIGH_CrudePrev", "CHD_CrudePrev"
]

def preprocess_and_prepare_datasets():
    print("=== STARTING DATA PREPARATION & PREPROCESSING (V2.1) ===")
    raw_merged_path = os.path.join(PROCESSED_DIR, "us_tracts_merged_raw.csv")
    if not os.path.exists(raw_merged_path):
        from ml_pipeline.src.data.fetch_real_data import fetch_and_integrate_data
        df_merged, _, _ = fetch_and_integrate_data()
    else:
        df_merged = pd.read_csv(raw_merged_path, dtype={"GEOID": str})

    df_merged["GEOID"] = df_merged["GEOID"].astype(str).str.zfill(11)
    df_merged["CountyFIPS"] = df_merged["GEOID"].str[:5]
    df_merged["StateFIPS"] = df_merged["GEOID"].str[:2]
    df_merged["diabetes_crude_prevalence"] = pd.to_numeric(df_merged["DIABETES_CrudePrev"], errors="coerce")

    ohu = pd.to_numeric(df_merged["OHU2010"], errors="coerce").fillna(0)
    hunv = pd.to_numeric(df_merged["TractHUNV"], errors="coerce").fillna(0)
    snap = pd.to_numeric(df_merged["TractSNAP"], errors="coerce").fillna(0)

    df_merged["no_vehicle_household_share"] = (hunv / ohu.replace(0, pd.NA)).fillna(0.0)
    df_merged["snap_household_share"] = (snap / ohu.replace(0, pd.NA)).fillna(0.0)
    
    # Proxy de proximidad a grandes comercios de alimentos: 1.0 - lapophalfshare
    lapop = pd.to_numeric(df_merged["lapophalfshare"], errors="coerce").fillna(0.0)
    df_merged["food_retail_proximity_proxy"] = (1.0 - lapop).clip(0.0, 1.0)

    for col in PREDICTOR_COLS_RAW:
        if col in df_merged.columns:
            df_merged[col] = pd.to_numeric(df_merged[col], errors="coerce")

    # Eligibility masks
    mask_valid_target = df_merged["diabetes_crude_prevalence"].notna()
    mask_urban = df_merged["Urban"] == 1
    mask_pop1000 = df_merged["Pop2010"] >= 1000
    mask_not_philly = df_merged["CountyFIPS"] != "42101"
    mask_philly = df_merged["CountyFIPS"] == "42101"

    # US Urban modeling set (54,277 tracts)
    df_us_modeling = df_merged[mask_valid_target & mask_urban & mask_pop1000 & mask_not_philly].copy()
    
    # Philadelphia all matched tracts (376 tracts)
    df_philly_all = df_merged[mask_philly & mask_valid_target].copy()
    
    # Philadelphia eligible analysis tracts (369 tracts: Urban == 1 & Pop2010 >= 1000)
    df_philly_analysis = df_merged[mask_philly & mask_valid_target & mask_urban & mask_pop1000].copy()

    # Exclusions audit
    philly_excluded = df_philly_all[~df_philly_all["GEOID"].isin(df_philly_analysis["GEOID"])].copy()

    # Save CSVs
    df_us_modeling.to_csv(os.path.join(PROCESSED_DIR, "us_urban_tracts_modeling.csv"), index=False)
    df_philly_all.to_csv(os.path.join(PROCESSED_DIR, "philadelphia_tracts_all.csv"), index=False)
    df_philly_analysis.to_csv(os.path.join(PROCESSED_DIR, "philadelphia_tracts_analysis.csv"), index=False)

    print(f"US Urban Modeling Tracts (Excl. Philly): {len(df_us_modeling)}")
    print(f"Philadelphia All Matched Tracts: {len(df_philly_all)}")
    print(f"Philadelphia Analysis Eligible Tracts: {len(df_philly_analysis)}")
    print(f"Philadelphia Excluded Tracts (Pop2010 < 1000): {len(philly_excluded)}")

    # Quality and Audit Report
    quality_report = {
        "us_urban_modeling_count": len(df_us_modeling),
        "philadelphia_all_count": len(df_philly_all),
        "philadelphia_analysis_count": len(df_philly_analysis),
        "philadelphia_excluded_count": len(philly_excluded),
        "philadelphia_excluded_geoids": philly_excluded["GEOID"].tolist(),
        "philadelphia_exclusion_reasons": {
            geoid: "Pop2010 < 1000" for geoid in philly_excluded["GEOID"]
        },
        "target_col": "diabetes_crude_prevalence",
        "predictors_raw": PREDICTOR_COLS_RAW,
        "predictors_derived": ["no_vehicle_household_share", "snap_household_share", "food_retail_proximity_proxy"],
        "forbidden_predictors_excluded": FORBIDDEN_PREDICTORS
    }
    with open(os.path.join(PROCESSED_DIR, "data_quality_report.json"), "w", encoding="utf-8") as f:
        json.dump(quality_report, f, indent=2)

    # GeoJSON Generation
    print("--- Generating TIGER/Line 2019 Philadelphia GeoJSON Files ---")
    tiger_path = os.path.join(DATA_DIR, "tl_2019_42_tract.zip")
    gdf_tiger = gpd.read_file(f"zip://{tiger_path}")
    gdf_philly = gdf_tiger[gdf_tiger["COUNTYFP"] == "101"].copy()
    gdf_philly["GEOID"] = gdf_philly["GEOID"].astype(str).str.zfill(11)
    gdf_philly = gdf_philly.to_crs(epsg=4326)

    philly_cols_to_keep = [
        "GEOID", "diabetes_crude_prevalence", "PovertyRate", "MedianFamilyIncome",
        "Urban", "Pop2010", "LowIncomeTracts", "LILATracts_1And10",
        "lapophalfshare", "food_retail_proximity_proxy",
        "no_vehicle_household_share", "snap_household_share"
    ]

    # 1. philadelphia_tracts_all.geojson (376 tracts)
    gdf_all = gdf_philly.merge(df_philly_all[philly_cols_to_keep], on="GEOID", how="inner")
    gdf_all.to_file(os.path.join(PROCESSED_DIR, "philadelphia_tracts_all.geojson"), driver="GeoJSON")

    # 2. philadelphia_tracts_analysis.geojson (369 tracts)
    gdf_analysis = gdf_philly.merge(df_philly_analysis[philly_cols_to_keep], on="GEOID", how="inner")
    gdf_analysis.to_file(os.path.join(PROCESSED_DIR, "philadelphia_tracts_analysis.geojson"), driver="GeoJSON")
    gdf_analysis.to_file(os.path.join(PROCESSED_DIR, "philadelphia_tracts.geojson"), driver="GeoJSON")

    print(f"GeoJSON all created: {len(gdf_all)} tracts")
    print(f"GeoJSON analysis created: {len(gdf_analysis)} tracts")

    return df_us_modeling, df_philly_analysis, gdf_analysis

if __name__ == "__main__":
    preprocess_and_prepare_datasets()
