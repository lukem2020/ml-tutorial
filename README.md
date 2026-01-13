# ml-tutorial

![NEXUS-PHARMA Demo](./demo.gif)

1. Scope

## Process Overview

**1. Drug-Disease Association Discovery**
   - The agent identifies and retrieves information about drugs associated with specific diseases
   - Processes SMILES (Simplified Molecular Input Line Entry System) data representing chemical structures
   - Aggregates drug-disease relationships from structured databases and scientific literature

**2. Chemical Structure Analysis**
   - Transforms SMILES data into analyzable molecular representations
   - Identifies chemical structure similarities between drugs using molecular fingerprinting and graph-based methods
   - Analyzes structural characteristics that differentiate drugs associated with disease symptoms
   - Performs comparative analysis to understand structure-activity relationships (SAR)

**3. Literature-Based Context Gathering**
   - The agent investigates scientific literature to provide comprehensive context on:
     - Drug mechanisms of action (MOA)
     - Disease symptom profiles
     - Clinical evidence and efficacy data
     - Adverse effects and safety profiles
   - Synthesizes multi-source evidence to build a knowledge base for informed drug design

**4. Drug Redesign & Hit Generation**
   - Combines drug properties with literature-derived evidence to generate redesigned drug candidates
   - Applies molecular optimization strategies to create potential hits
   - Evaluates candidates based on:
     - **Reduced symptom profiles**: Lower incidence or severity of disease symptoms
     - **Enhanced MOA**: Improved mechanism of action efficacy and specificity
     - **Structural feasibility**: Synthesizable and drug-like properties

**5. Hit Validation & Prioritization**
   - Ranks potential hits based on predicted efficacy, safety, and druggability
   - Provides evidence-backed recommendations for further experimental validation




2. Technical Stack

- **Backend**: Python, FastAPI, OpenAI, LangChain
- **ML Pipeline**: scikit-learn, PyCaret, scipy, numpy
- **Frontend**: Next.js 14, React, Three.js, TypeScript
- **Data Processing**: pandas, SMILES molecular data

3. Quick Launch

### Backend Setup

To install the required Python dependencies, run:
```bash
pip install -r requirements.txt
```

### Frontend Setup

To set up and run the TRON-themed React frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

### Features

- **Landing Page**: Features a spinning 3D cube with TRON aesthetic
- **Chat Interface**: Claude.ai-inspired interface for drug discovery queries
- **TRON Theme**: Neon blue/cyan color scheme with glowing effects and grid backgrounds
