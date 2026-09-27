# Urban Food Twin — Portal CRISP-DM y Módulo de Entrenamiento Independent

Este documento describe la arquitectura, instalación y flujo de uso de los dos nuevos módulos independientes integrados al proyecto **Urban Food Environment Digital Twin (V2.2.0)**:

1. **CRISP-DM Frontend (`crispdm-frontend/`)**: Portal web de seguimiento metodológico y documentación informativa (React + TypeScript + Vite + Tailwind CSS + React Router + i18next).
2. **Streamlit Training Workbench (`streamlit-training/`)**: Entorno interactivo para entrenamiento de modelos, evaluación cruzada agrupada e inferencia (Python + Streamlit + scikit-learn + Plotly).

---

## 1. Arquitectura y Relación entre Aplicaciones

El sistema preserva intacto el gemelo digital existente y organiza la arquitectura en tres componentes aislados:

```text
urban-food-environment-digital-twin-prototype/
├── frontend/                  # Gemelo Digital 2D/3D actual (Puerto 3000)
├── backend/                   # FastAPI Backend microservicio (Puerto 8000)
├── crispdm-frontend/          # NUEVO: Portal de seguimiento CRISP-DM (Puerto 5174)
├── streamlit-training/        # NUEVO: Módulo de entrenamiento ML (Puerto 8501)
├── data/                      # Datasets procesados CDC PLACES 2022 y USDA FARA
└── README_CRISPDM.md          # Documentación general CRISP-DM
```

### Principio de Responsabilidad Única
- **`crispdm-frontend`**: Es estrictamente **informativo y metodológico**. No ejecuta código Python ni entrena modelos directamente. Almacena en `localStorage` las preferencias, estado de las fases y el archivo `training_summary.json` importado.
- **`streamlit-training`**: Es la **única interfaz autorizada para ejecutar el entrenamiento** de algoritmos. Exporta artefactos en `streamlit-training/artifacts/` (`modelo_entrenado.joblib`, `training_summary.json`, `predicciones.csv`).
- **`training_summary.json`**: Funciona como el contrato de datos (JSON schema) para conectar ambas aplicaciones de forma desacoplada.

---

## 2. Puertos de Servicio

| Aplicación | Tecnología | Puerto por Defecto |
| :--- | :--- | :--- |
| **Sistema Actual (Digital Twin)** | React + Vite | `http://localhost:3000` |
| **FastAPI Backend** | Python / FastAPI | `http://localhost:8000` |
| **Portal CRISP-DM (Nuevo)** | React + TS + Vite | `http://localhost:5174` |
| **Streamlit Training (Nuevo)** | Python Streamlit | `http://localhost:8501` |

---

## 3. Instrucciones de Ejecución Local

### Terminal 1 — Portal CRISP-DM Frontend

```powershell
# Acceder a la carpeta del frontend CRISP-DM
cd crispdm-frontend

# Instalar dependencias Node.js
npm install

# Iniciar servidor de desarrollo en el puerto 5174
npm run dev -- --port 5174
```

*Acceso en navegador*: [http://localhost:5174](http://localhost:5174)

### Terminal 2 — Módulo de Entrenamiento Streamlit

```powershell
# Acceder a la carpeta del módulo Streamlit
cd streamlit-training

# Crear entorno virtual de Python
python -m venv .venv

# Activar entorno virtual (PowerShell)
.\.venv\Scripts\Activate.ps1

# Instalar dependencias requeridas
pip install -r requirements.txt

# Iniciar aplicación Streamlit en el puerto 8501
streamlit run app.py --server.port 8501
```

*Acceso en navegador*: [http://localhost:8501](http://localhost:8501)

---

## 4. Variables de Entorno

### `crispdm-frontend/.env`
```env
VITE_STREAMLIT_URL=http://localhost:8501
```

*Si la variable no está configurada, el botón "Abrir módulo de entrenamiento" en la sección de Modelado notificará amigablemente al usuario sin fallar silenciosamente.*

---

## 5. Flujo Metodológico y Comunicación CRISP-DM

1. **Comprensión del Negocio (`/comprension-negocio`)**: Revisa el marco epidemiológico, alcance en el condado de Philadelphia (FIPS 42101), variable objetivo (`OBESITY_CrudePrev`) y escenarios de política (Impuestos SSB 20 %, Subsidio a frutas/verduras 30 %).
2. **Comprensión de los Datos (`/comprension-datos`)**: Consulta el inventario de fuentes (CDC PLACES 2022, USDA FARA 2019, TIGER/Line 2019) y el esquema de variables con identificadores GEOID explícitamente diferenciados como atributos técnicos no predictores.
3. **Preparación de los Datos (`/preparacion-datos`)**: Visualiza el flujo de 10 pasos y la regla de separación entre el entrenamiento nacional (54,277 tractos urbanos) y la evaluación externa en Philadelphia (384 tractos).
4. **Modelado (`/modelado`)**: Examina los hiperparámetros de los algoritmos (`DummyRegressor`, `Ridge`, `RandomForestRegressor`, `HistGradientBoostingRegressor`). Presiona el botón **"Abrir módulo de entrenamiento"** para ir a Streamlit.
5. **Entrenamiento en Streamlit (`http://localhost:8501`)**:
   - Selecciona dataset, variable objetivo y predictores.
   - Entrena los modelos con `GroupKFold` de 5 pliegues por `CountyFIPS`.
   - Revisa las métricas MAE, RMSE, R² y gráficos interactivos de residuos e importancia de variables.
   - En la pestaña **Exportaciones**, descarga el archivo `training_summary.json`.
6. **Evaluación (`/evaluacion`)**: Regresa al portal CRISP-DM e importa el archivo `training_summary.json` descargado para visualizar los resultados guardados en `localStorage`.
7. **Despliegue (`/despliegue`)**: Revisa la matriz de madurez MLOps (clasificado explícitamente como **Prototipo Académico — No Validado Clínicamente**).

---

## 6. Advertencia Permanente de Salud Pública

Ambas aplicaciones muestran de forma prominente la siguiente exención de responsabilidad científica:

> **Prototipo académico.** Los modelos y escenarios son exploratorios, no clínicos ni causales, y no deben utilizarse por sí solos para tomar decisiones médicas o de política pública.

---

## 7. Solución de Problemas Frecuentes

1. **El botón "Abrir módulo de entrenamiento" no abre Streamlit**:
   - Asegúrese de que Streamlit esté corriendo en `http://localhost:8501`.
   - Verifique que `crispdm-frontend/.env` contenga `VITE_STREAMLIT_URL=http://localhost:8501`.

2. **Error al importar `training_summary.json`**:
   - Confirme que el archivo proviene de la opción "Descargar training_summary.json" en la pestaña Exportaciones de Streamlit.
   - El validador JSON verificará que existan los campos `selectedModel` y `metrics`.

3. **Conflictos con la aplicación original**:
   - Las carpetas `crispdm-frontend/` y `streamlit-training/` están aisladas a nivel de raíz. El sistema original en `src/` y `backend/` no sufre ninguna modificación.
