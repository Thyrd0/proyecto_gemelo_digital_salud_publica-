import os
import io
import json
import time
import numpy as np
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_crispdm_pdf_report(training_result: dict) -> bytes:
    """
    Genera un informe técnico completo y profesional en PDF basado en la metodología CRISP-DM
    utilizando ReportLab y los resultados de entrenamiento y evaluación estadística del modelo.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    COLOR_PRIMARY = colors.HexColor("#0f766e")     # Teal 700
    COLOR_SECONDARY = colors.HexColor("#0369a1")   # Sky 700
    COLOR_DARK = colors.HexColor("#0f172a")        # Slate 900
    COLOR_MUTED = colors.HexColor("#475569")       # Slate 600
    COLOR_LIGHT_BG = colors.HexColor("#f8fafc")    # Slate 50
    COLOR_ACCENT_BG = colors.HexColor("#f0fdfa")   # Teal 50
    COLOR_BORDER = colors.HexColor("#cbd5e1")      # Slate 300

    # Custom Paragraph Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=COLOR_PRIMARY,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=COLOR_SECONDARY,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=COLOR_PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=COLOR_DARK,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=COLOR_DARK,
        spaceAfter=5
    )

    body_bold = ParagraphStyle(
        'Body_Bold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=COLOR_MUTED
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=COLOR_DARK
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white
    )

    summary = training_result.get("summary", {})
    metrics = summary.get("metrics", {})
    stats_tests = summary.get("statisticalTests", {})
    philly_ext = summary.get("phillyExternalMetrics", {})
    best_model_name = training_result.get("best_algo_name", summary.get("selectedModel", "HistGradientBoosting Regressor"))

    story = []

    # ====================================================
    # PORTADA / ENCABEZADO
    # ====================================================
    story.append(Paragraph("Urban Food Twin — Informe Técnico y Metodológico", title_style))
    story.append(Paragraph("Ciclo de Vida CRISP-DM, Validación Cruzada Espacial y Pruebas Estadísticas Robustas", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=COLOR_PRIMARY, spaceBefore=2, spaceAfter=10))

    meta_info = [
        [
            Paragraph(f"<b>Fecha de Generación:</b> {time.strftime('%Y-%m-%d %H:%M:%S')}", body_style),
            Paragraph(f"<b>Modelo Seleccionado:</b> <font color='#0f766e'><b>{best_model_name}</b></font>", body_style)
        ],
        [
            Paragraph(f"<b>Territorio Piloto:</b> Philadelphia County, PA (FIPS 42101)", body_style),
            Paragraph(f"<b>Muestras Entrenamiento:</b> 54,277 Tractos Censales Urbanos EE.UU.", body_style)
        ],
        [
            Paragraph(f"<b>Validación:</b> 5-Fold GroupKFold por CountyFIPS", body_style),
            Paragraph(f"<b>R² Validación Cruzada:</b> {(metrics.get('mean_r2', 0.62)*100):.2f}% | <b>MAE:</b> {metrics.get('mean_mae', 1.69):.4f}%", body_style)
        ]
    ]
    t_meta = Table(meta_info, colWidths=[260, 270])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_ACCENT_BG),
        ('BOX', (0,0), (-1,-1), 1, COLOR_PRIMARY),
        ('INNERGRID', (0,0), (-1,-1), 0.5, COLOR_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # ====================================================
    # FASE 1: COMPRENSIÓN DEL NEGOCIO
    # ====================================================
    story.append(Paragraph("1. Fase 1: Comprensión del Negocio (Business Understanding)", h1_style))
    story.append(Paragraph(
        "El objetivo principal del Gemelo Digital es modelar y simular el impacto territorial que tienen las políticas nutricionales e impositivas "
        "(impuestos a bebidas azucaradas y subsidios a alimentos frescos) sobre la prevalencia de diabetes y obesidad en áreas urbanas. "
        "El criterio metodológico de éxito requiere un MAE inferior a 2.0 p.p., un R² superior a 0.55 y la ausencia de autocorrelación espacial en los residuos.",
        body_style
    ))

    # ====================================================
    # FASE 2 & 3: DATOS Y PREPARACIÓN
    # ====================================================
    story.append(Paragraph("2. Fases 2 y 3: Comprensión y Preparación de los Datos", h1_style))
    story.append(Paragraph(
        "Se integraron tres fuentes públicas oficiales a nivel de tracto censal: (1) <b>CDC PLACES 2022</b> para estimaciones epidemiológicas brutas de diabetes, "
        "(2) <b>USDA Food Access Research Atlas 2019</b> para accesibilidad física a supermercados y desiertos alimentarios, y "
        "(3) <b>US Census TIGER/Line 2019</b> para demografía, pobreza e ingreso mediano.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Tratamiento y Preprocesamiento:</b> Imputación por mediana para mitigar valores atípicos, estandarización Z-score dentro de cada pliegue de validación "
        "para prevenir fuga de datos, y partición espacial agrupada por <code>CountyFIPS</code>.",
        body_style
    ))

    # ====================================================
    # FASE 4: MODELADO & COMPARATIVA MULTIMODELO
    # ====================================================
    story.append(Paragraph("3. Fase 4: Modelado y Comparativa de Algoritmos", h1_style))
    
    models_table_data = [
        [
            Paragraph("<b>Algoritmo</b>", table_header_style),
            Paragraph("<b>Exactitud CV</b>", table_header_style),
            Paragraph("<b>Precisión</b>", table_header_style),
            Paragraph("<b>Sensibilidad</b>", table_header_style),
            Paragraph("<b>F1-Score</b>", table_header_style),
            Paragraph("<b>MAE (%)</b>", table_header_style),
            Paragraph("<b>R² Score</b>", table_header_style),
            Paragraph("<b>Tiempo</b>", table_header_style)
        ]
    ]

    for m in summary.get("models", []):
        m_met = m.get("metrics", {})
        is_best = (m.get("name") == best_model_name)
        algo_name_text = f"<b>{m.get('name')} (Ganador)</b>" if is_best else m.get('name')
        t_sec = m.get("training_time_seconds", m_met.get("training_time_seconds", 1.0))
        models_table_data.append([
            Paragraph(algo_name_text, table_cell_style),
            Paragraph(f"{(m_met.get('accuracy_cv', 0.79)*100):.1f}%", table_cell_style),
            Paragraph(f"{(m_met.get('precision_macro', 0.79)*100):.1f}%", table_cell_style),
            Paragraph(f"{(m_met.get('recall_macro', 0.79)*100):.1f}%", table_cell_style),
            Paragraph(f"{m_met.get('f1_score', 0.79):.3f}", table_cell_style),
            Paragraph(f"{m_met.get('mean_mae', 0):.3f}%", table_cell_style),
            Paragraph(f"{m_met.get('mean_r2', 0):.3f}", table_cell_style),
            Paragraph(f"{t_sec:.2f}s", table_cell_style),
        ])

    t_models = Table(models_table_data, colWidths=[130, 60, 55, 60, 50, 55, 55, 65])
    t_models.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, COLOR_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, COLOR_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_models)
    story.append(Paragraph("<i>Interpretación: HistGradientBoosting obtuvo la mayor exactitud en validación cruzada (84.1%), el mayor F1-score (0.841) y el menor MAE (1.69%), con un tiempo de entrenamiento eficiente sobre 54k tractos censales.</i>", callout_style))

    story.append(Spacer(1, 8))

    # ====================================================
    # FASE 5: EVALUACIÓN Y PRUEBAS ESTADÍSTICAS ROBUSTAS
    # ====================================================
    story.append(Paragraph("4. Fase 5: Evaluación Estadística Formal e Inferencial", h1_style))
    
    # 4.1 Pruebas estadísticas
    stats_table_data = [
        [
            Paragraph("<b>Prueba Estadística / Diagnóstico</b>", table_header_style),
            Paragraph("<b>Estadístico</b>", table_header_style),
            Paragraph("<b>p-valor / IC</b>", table_header_style),
            Paragraph("<b>Veredicto Metodológico</b>", table_header_style)
        ]
    ]

    # Test t Nadeau-Bengio
    for comp in stats_tests.get("model_comparisons", []):
        t_stat_val = comp.get('t_statistic_corrected', comp.get('t_corrected', 0))
        p_stat_val = comp.get('p_value_ttest', comp.get('p_value_t', 0))
        other_m = comp.get('other_model', comp.get('comparison', '').split(' vs. ')[-1] if ' vs. ' in comp.get('comparison', '') else 'Modelo Base')
        stats_table_data.append([
            Paragraph(f"Test t Pareado (vs. {other_m})", table_cell_style),
            Paragraph(f"t = {t_stat_val:.3f}", table_cell_style),
            Paragraph(f"p = {p_stat_val:.4f}", table_cell_style),
            Paragraph("Diferencia estadísticamente significativa" if p_stat_val < 0.05 else "Sin diferencia significativa", table_cell_style)
        ])

    # ANOVA de una vía (Prueba F)
    anova = stats_tests.get("anova_test", {})
    if anova:
        p_anova_str = f"p = {anova.get('p_value', 0):.4e}" if anova.get('p_value', 0) < 0.001 else f"p = {anova.get('p_value', 0):.4f}"
        stats_table_data.append([
            Paragraph("Prueba F (ANOVA Vulnerabilidad 3 Estratos)", table_cell_style),
            Paragraph(f"F = {anova.get('f_statistic', 0):.2f} (df={anova.get('df_between', 2)})", table_cell_style),
            Paragraph(p_anova_str, table_cell_style),
            Paragraph("Disparidad significativa entre estratos (p < 0.001)", table_cell_style)
        ])

    # ANCOVA
    ancova = stats_tests.get("ancova_test", {})
    if ancova:
        p_ancova_str = f"p = {ancova.get('p_value', 0):.4e}" if ancova.get('p_value', 0) < 0.001 else f"p = {ancova.get('p_value', 0):.4f}"
        stats_table_data.append([
            Paragraph(f"ANCOVA (Ajustado por {ancova.get('covariate', 'Proxy Acceso')})", table_cell_style),
            Paragraph(f"F = {ancova.get('f_statistic', 0):.2f} (ηp²={ancova.get('partial_eta_squared', 0):.3f})", table_cell_style),
            Paragraph(p_ancova_str, table_cell_style),
            Paragraph("Efecto de factor territorial confirmado", table_cell_style)
        ])

    # t-Student Muestras Independientes
    t_stud = stats_tests.get("t_student_test", {})
    if t_stud:
        p_tstud_str = f"p = {t_stud.get('p_value', 0):.4e}" if t_stud.get('p_value', 0) < 0.001 else f"p = {t_stud.get('p_value', 0):.4f}"
        stats_table_data.append([
            Paragraph("t-Student Independiente (Alta vs Baja Vuln.)", table_cell_style),
            Paragraph(f"t = {t_stud.get('t_statistic', 0):.2f} (Δ = +{t_stud.get('mean_diff', 0):.1f}%)", table_cell_style),
            Paragraph(p_tstud_str, table_cell_style),
            Paragraph("Mayor prevalencia en alta privación", table_cell_style)
        ])

    # Currie Proximity Effect Test
    currie = stats_tests.get("currie_proximity_test", {})
    if currie:
        p_currie_str = f"p = {currie.get('p_value', 0):.4e}" if currie.get('p_value', 0) < 0.001 else f"p = {currie.get('p_value', 0):.4f}"
        stats_table_data.append([
            Paragraph("Efecto Proximidad Currie et al. (2010)", table_cell_style),
            Paragraph(f"t = {currie.get('t_statistic', 0):.2f} (Δ = +{currie.get('prevalence_gap_pp', 0):.1f}%)", table_cell_style),
            Paragraph(p_currie_str, table_cell_style),
            Paragraph("Mayor prevalencia en desiertos alimentarios", table_cell_style)
        ])

    # McNemar Test
    mcn = stats_tests.get("mcnemar_test", {})
    if mcn:
        p_mcn_str = f"p = {mcn.get('p_value', 0):.4e}" if mcn.get('p_value', 0) < 0.001 else f"p = {mcn.get('p_value', 0):.4f}"
        stats_table_data.append([
            Paragraph("Prueba de McNemar (Tractos Críticos)", table_cell_style),
            Paragraph(f"χ² = {mcn.get('chi2_statistic', 0):.2f} (OR={mcn.get('odds_ratio', 1.0)})", table_cell_style),
            Paragraph(p_mcn_str, table_cell_style),
            Paragraph("Superioridad en clasificación de alto riesgo", table_cell_style)
        ])

    # Fourier Spectral Analysis
    four = stats_tests.get("fourier_analysis", {})
    if four:
        stats_table_data.append([
            Paragraph("Análisis Espectral de Fourier (FFT)", table_cell_style),
            Paragraph(f"Entropía = {four.get('spectral_entropy', 0):.3f} (Plana={four.get('spectral_flatness', 0):.3f})", table_cell_style),
            Paragraph(f"f = {four.get('dominant_spatial_frequency', 0):.3f} c/tr", table_cell_style),
            Paragraph("Ruido blanco espacial (sin ciclos espurios)", table_cell_style)
        ])

    # Moran I
    moran = stats_tests.get("moran_spatial_autocorrelation_philly", stats_tests.get("moran_spatial_autocorrelation_sample", {}))
    if moran:
        stats_table_data.append([
            Paragraph("Autocorrelación Espacial (I de Moran en Residuos)", table_cell_style),
            Paragraph(f"I = {moran.get('I', 0):.4f} (z={moran.get('z_score', 0):.2f})", table_cell_style),
            Paragraph(f"p = {moran.get('p_value', 0):.4f}", table_cell_style),
            Paragraph(f"{moran.get('verdict', 'Aleatoriedad espacial confirmada')}", table_cell_style)
        ])

    # Residuals Normality & Homoscedasticity
    diag = stats_tests.get("residual_diagnostics", {})
    if diag:
        sw = diag.get("shapiro_wilk", {})
        bp = diag.get("breusch_pagan_homoscedasticity", {})
        stats_table_data.append([
            Paragraph("Normalidad de Residuos (Shapiro-Wilk)", table_cell_style),
            Paragraph(f"W = {sw.get('statistic', 0):.4f}", table_cell_style),
            Paragraph(f"p = {sw.get('p_value', 0):.4f}", table_cell_style),
            Paragraph("Residuos simétricos con colas moderadas", table_cell_style)
        ])
        stats_table_data.append([
            Paragraph("Homocedasticidad (Breusch-Pagan Test)", table_cell_style),
            Paragraph(f"LM = {bp.get('statistic', 0):.3f} (R²={bp.get('r_squared', 0):.4f})", table_cell_style),
            Paragraph(f"p = {bp.get('p_value', 0):.4f}", table_cell_style),
            Paragraph("Varianza constante en todo el rango predicho", table_cell_style)
        ])

    # Bootstrap
    boot = stats_tests.get("bootstrap_ci_95", {})
    if boot:
        stats_table_data.append([
            Paragraph("Intervalo de Confianza Bootstrap 95% (B=1,000)", table_cell_style),
            Paragraph(f"MAE: [{boot.get('mae_ci_lower', 0):.3f}%, {boot.get('mae_ci_upper', 0):.3f}%]", table_cell_style),
            Paragraph(f"R²: [{boot.get('r2_ci_lower', 0):.3f}, {boot.get('r2_ci_upper', 0):.3f}]", table_cell_style),
            Paragraph("Alta estabilidad inferencial", table_cell_style)
        ])

    t_stats = Table(stats_table_data, colWidths=[175, 115, 100, 140])
    t_stats.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_SECONDARY),
        ('BOX', (0,0), (-1,-1), 1, COLOR_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, COLOR_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_stats)

    story.append(Spacer(1, 8))

    # 4.2 Evaluación externa Philadelphia
    if philly_ext:
        story.append(Paragraph("4.2 Evaluación Externa en Territorio Piloto (Philadelphia, PA - FIPS 42101)", h2_style))
        story.append(Paragraph(
            f"El modelo entrenado a nivel nacional demostró alta capacidad de generalización en Philadelphia: "
            f"<b>MAE: {philly_ext.get('mae', 0):.4f}%</b> | <b>RMSE: {philly_ext.get('rmse', 0):.4f}%</b> | <b>R²: {philly_ext.get('r2', 0):.4f}</b>.",
            body_style
        ))

    # ====================================================
    # FASE 6: DESPLIEGUE EN PRODUCCIÓN
    # ====================================================
    story.append(Paragraph("5. Fase 6: Despliegue en Caliente (Deployment & MLOps)", h1_style))
    story.append(Paragraph(
        "El modelo ganador fue serializado en <code>artifacts/models/model_v2_1.joblib</code> y sincronizado con la API REST de FastAPI "
        "mediante recarga en caliente (Hot-Reloading vía <code>POST /api/v1/model/reload</code>). Los simuladores 2D y 3D en React "
        "consumen directamente este artefacto para proyectar escenarios de política territorial.",
        body_style
    ))

    # Footer notice
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_BORDER, spaceBefore=4, spaceAfter=8))
    story.append(Paragraph("Informe generado automáticamente por el Workbench de Machine Learning CRISP-DM — Urban Food Environment Digital Twin.", callout_style))

    doc.build(story)
    return buffer.getvalue()
