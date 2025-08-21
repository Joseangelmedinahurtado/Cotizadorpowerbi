import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit3, Save, X, Calculator, Users, Clock, BarChart3, Database, Settings, BrainCircuit, Award, Calendar, GanttChartSquare, Download, ChevronLeft, ChevronRight, Target } from 'lucide-react';
// import './App.css';

// --- Funciones de Ayuda para Fechas ---
const addWorkDays = (date, days) => {
  const newDate = new Date(date);
  let addedDays = 0;
  // Asegurarse de que la fecha de inicio no sea un fin de semana
  while (newDate.getDay() === 0 || newDate.getDay() === 6) {
      newDate.setDate(newDate.getDate() + 1);
  }

  while (addedDays < days) {
    newDate.setDate(newDate.getDate() + 1);
    const dayOfWeek = newDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Domingo, 6 = Sábado
      addedDays++;
    }
  }
  return newDate;
};

// --- Funciones de Exportación ---
const exportData = (estimation, format, clientName, projectName, projectStartDate) => {
    if (!estimation) return;

    const fileName = `${projectName || 'Estimacion_BI'}_${new Date().toISOString().split('T')[0]}`;
    let content = '';
    let mimeType = '';
    let fileExtension = '';

    const formatCurrency = (value) => value.toLocaleString('es-ES', { maximumFractionDigits: 0 });
    const endDate = addWorkDays(new Date(projectStartDate + 'T00:00:00'), Math.ceil(estimation.totalWorkDays));
    
    const resourceCosts = estimation.phases.reduce((acc, phase) => {
        phase.resourceCosts.forEach(rc => {
            if (!acc[rc.id]) {
                acc[rc.id] = { role: rc.role, totalCost: 0 };
            }
            acc[rc.id].totalCost += rc.cost;
        });
        return acc;
    }, {});

    if (format === 'csv') {
        mimeType = 'text/csv;charset=utf-8;';
        fileExtension = 'csv';
        const rows = [];
        rows.push(['Proyecto', projectName]);
        rows.push(['Cliente', clientName]);
        rows.push([]);
        rows.push(['Métrica', 'Valor']);
        rows.push(['Multiplicador de Complejidad', estimation.complexityMultiplier.toFixed(2) + 'x']);
        rows.push(['Costo Base', estimation.totalProjectCost]);
        rows.push(['Contingencia (%)', estimation.contingencyPercentage]);
        rows.push(['Costo Contingencia', estimation.contingencyCost]);
        rows.push(['Costo Total Estimado', estimation.finalCost]);
        rows.push(['Esfuerzo Total (horas)', estimation.totalProjectEffortHours]);
        rows.push(['Duración Total (días laborables)', estimation.totalWorkDays]);
        rows.push(['Duración Total (semanas)', estimation.totalDurationWeeks]);
        rows.push(['Fecha de Inicio', projectStartDate]);
        rows.push(['Fecha de Finalización', endDate.toLocaleDateString('es-ES')]);
        rows.push([]);
        rows.push(['Desglose por Fase']);
        rows.push(['Fase', 'Costo', 'Esfuerzo (horas)']);
        estimation.phases.forEach(p => rows.push([p.name, p.totalCost, p.adjustedEffortHours]));
        rows.push([]);
        rows.push(['Desglose por Recurso']);
        rows.push(['Rol', 'Costo Total']);
        Object.values(resourceCosts).forEach(r => rows.push([r.role, r.totalCost]));
        
        content = rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    } else if (format === 'word') {
        mimeType = 'application/msword';
        fileExtension = 'doc';
        let html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Estimación BI</title></head>
            <body>
                <h1>Resumen de Estimación: ${projectName}</h1>
                <p><b>Cliente:</b> ${clientName}</p>
                <h2>Resumen General</h2>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <tr><td style="padding: 5px;"><b>Métrica</b></td><td style="padding: 5px;"><b>Valor</b></td></tr>
                    <tr><td style="padding: 5px;">Multiplicador de Complejidad</td><td style="padding: 5px;">${estimation.complexityMultiplier.toFixed(2)}x</td></tr>
                    <tr><td style="padding: 5px;">Costo Base</td><td style="padding: 5px;">$${formatCurrency(estimation.totalProjectCost)}</td></tr>
                    <tr><td style="padding: 5px;">Contingencia (${estimation.contingencyPercentage}%)</td><td style="padding: 5px;">$${formatCurrency(estimation.contingencyCost)}</td></tr>
                    <tr><td style="padding: 5px;"><b>Costo Total Estimado</b></td><td style="padding: 5px;"><b>$${formatCurrency(estimation.finalCost)}</b></td></tr>
                    <tr><td style="padding: 5px;">Esfuerzo Total (horas)</td><td style="padding: 5px;">${estimation.totalProjectEffortHours.toFixed(2)} horas</td></tr>
                    <tr><td style="padding: 5px;">Duración Total (días laborables)</td><td style="padding: 5px;">${estimation.totalWorkDays} días</td></tr>
                    <tr><td style="padding: 5px;">Duración Total</td><td style="padding: 5px;">${estimation.totalDurationWeeks} semanas</td></tr>
                    <tr><td style="padding: 5px;">Fecha de Inicio</td><td style="padding: 5px;">${new Date(projectStartDate + 'T00:00:00').toLocaleDateString('es-ES')}</td></tr>
                    <tr><td style="padding: 5px;">Fecha de Finalización</td><td style="padding: 5px;">${endDate.toLocaleDateString('es-ES')}</td></tr>
                </table>
                <h2>Desglose por Fase</h2>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <tr><td style="padding: 5px;"><b>Fase</b></td><td style="padding: 5px;"><b>Costo</b></td><td style="padding: 5px;"><b>Esfuerzo (horas)</b></td></tr>
                    ${estimation.phases.map(p => `<tr><td style="padding: 5px;">${p.name}</td><td style="padding: 5px;">$${formatCurrency(p.totalCost)}</td><td style="padding: 5px;">${p.adjustedEffortHours.toFixed(2)}</td></tr>`).join('')}
                </table>
                <h2>Desglose por Recurso</h2>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <tr><td style="padding: 5px;"><b>Rol</b></td><td style="padding: 5px;"><b>Costo Total</b></td></tr>
                    ${Object.values(resourceCosts).map(r => `<tr><td style="padding: 5px;">${r.role}</td><td style="padding: 5px;">$${formatCurrency(r.totalCost)}</td></tr>`).join('')}
                </table>
            </body>
            </html>`;
        content = html;
    } else if (format === 'markdown') {
        mimeType = 'text/markdown;charset=utf-8;';
        fileExtension = 'md';
        let md = `# Resumen de Estimación: ${projectName}\n\n`;
        md += `**Cliente:** ${clientName}\n\n`;
        md += `## Resumen General\n`;
        md += `* **Multiplicador de Complejidad:** ${estimation.complexityMultiplier.toFixed(2)}x\n`;
        md += `* **Costo Base:** $${formatCurrency(estimation.totalProjectCost)}\n`;
        md += `* **Contingencia (${estimation.contingencyPercentage}%):** $${formatCurrency(estimation.contingencyCost)}\n`;
        md += `* **Costo Total Estimado:** $${formatCurrency(estimation.finalCost)}\n`;
        md += `* **Esfuerzo Total (horas):** ${estimation.totalProjectEffortHours.toFixed(2)} horas\n`;
        md += `* **Duración Total (días laborables):** ${estimation.totalWorkDays} días\n`;
        md += `* **Duración Total:** ${estimation.totalDurationWeeks} semanas\n`;
        md += `* **Fecha de Inicio:** ${new Date(projectStartDate + 'T00:00:00').toLocaleDateString('es-ES')}\n`;
        md += `* **Fecha de Finalización:** ${endDate.toLocaleDateString('es-ES')}\n\n`;
        md += `## Desglose por Fase\n\n`;
        md += `| Fase | Costo | Esfuerzo (horas) |\n`;
        md += `|:---|:---|:---|\n`;
        estimation.phases.forEach(p => {
            md += `| ${p.name} | $${formatCurrency(p.totalCost)} | ${p.adjustedEffortHours.toFixed(2)} |\n`;
        });
        md += `\n## Desglose por Recurso\n\n`;
        md += `| Rol | Costo Total |\n`;
        md += `|:---|:---|\n`;
        Object.values(resourceCosts).forEach(r => {
            md += `| ${r.role} | $${formatCurrency(r.totalCost)} |\n`;
        });
        content = md;
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// Componente principal para la Herramienta de Estimación de Costos de BI
const ForresterBIEstimator = () => {
  const hoursPerWorkDay = 8;
  // Estado para los factores de complejidad según la metodología Forrester
  const [complexityFactors, setComplexityFactors] = useState({
    technical: {
      dataSourcesCount: { value: '', weight: 0.25, multiplier: { '1-2': 1, '3-5': 1.3, '6-10': 1.6, '10+': 2.0 }},
      dataVolume: { value: '', weight: 0.20, multiplier: { 'Pequeño (<1GB)': 1, 'Mediano (1-10GB)': 1.2, 'Grande (10-100GB)': 1.5, 'Muy Grande (>100GB)': 2.0 }},
      integrationComplexity: { value: '', weight: 0.25, multiplier: { 'Simple': 1, 'Moderada': 1.4, 'Compleja': 1.8, 'Muy Compleja': 2.2 }},
      architecturalComplexity: { value: '', weight: 0.30, multiplier: { 'Estándar': 1, 'Híbrida': 1.3, 'Distribuida': 1.6, 'Multi-Cloud': 2.0 }}
    },
    organizational: {
      stakeholderCount: { value: '', weight: 0.30, multiplier: { '1-5': 1, '6-15': 1.2, '16-30': 1.5, '30+': 1.8 }},
      geographicalDistribution: { value: '', weight: 0.25, multiplier: { 'Única': 1, 'Regional': 1.3, 'Nacional': 1.6, 'Global': 2.0 }},
      changeManagementNeeds: { value: '', weight: 0.25, multiplier: { 'Baja': 1, 'Media': 1.4, 'Alta': 1.8, 'Crítica': 2.2 }},
      governanceRequirements: { value: '', weight: 0.20, multiplier: { 'Básicos': 1, 'Estándar': 1.3, 'Avanzados': 1.6, 'Empresariales': 2.0 }}
    },
    projectScope: {
      functionalScope: { value: '', weight: 0.35, multiplier: { 'Reportería': 1, 'Análisis': 1.3, 'Predictivo': 1.6, 'Prescriptivo': 2.0 }},
      userCount: { value: '', weight: 0.25, multiplier: { '1-25': 1, '26-100': 1.2, '101-500': 1.5, '500+': 1.8 }},
      customizationLevel: { value: '', weight: 0.25, multiplier: { 'Estándar': 1, 'Moderado': 1.3, 'Extenso': 1.6, 'Completo': 2.0 }},
      securityRequirements: { value: '', weight: 0.15, multiplier: { 'Básicos': 1, 'Estándar': 1.2, 'Altos': 1.5, 'Empresariales': 1.8 }}
    }
  });

  // Estado para las fases del proyecto (esfuerzo en horas)
  const [projectPhases, setProjectPhases] = useState([
    { id: 1, name: "Evaluación y Estrategia", description: "Evaluación inicial y definición de la estrategia", baseEffort: 120, activities: ["Evaluación del Estado Actual", "Diseño del Estado Futuro", "Análisis de Brechas", "Definición de Estrategia"] },
    { id: 2, name: "Arquitectura y Diseño", description: "Diseño de la arquitectura técnica y funcional", baseEffort: 200, activities: ["Arquitectura Técnica", "Arquitectura de Datos", "Diseño de Seguridad", "Diseño de Integración"] },
    { id: 3, name: "Gestión de Datos", description: "Gestión, calidad y preparación de datos", baseEffort: 240, activities: ["Perfilado de Datos", "Calidad de Datos", "Desarrollo ETL", "Gestión de Datos Maestros"] },
    { id: 4, name: "Implementación de Plataforma", description: "Implementación de la plataforma de BI", baseEffort: 320, activities: ["Configuración de Infraestructura", "Configuración de Herramientas", "Implementación de Seguridad", "Ajuste de Rendimiento"] },
    { id: 5, name: "Desarrollo Analítico", description: "Desarrollo de informes y análisis", baseEffort: 280, activities: ["Desarrollo de Informes", "Creación de Dashboards", "Análisis Avanzado", "Soluciones Móviles"] },
    { id: 6, name: "Pruebas y Validación", description: "Pruebas integrales y validación", baseEffort: 160, activities: ["Pruebas Unitarias", "Pruebas de Integración", "Pruebas de Aceptación de Usuario", "Pruebas de Rendimiento"] },
    { id: 7, name: "Despliegue y Capacitación", description: "Despliegue a usuarios y capacitación", baseEffort: 120, activities: ["Despliegue a Producción", "Capacitación de Usuarios", "Documentación", "Transferencia de Conocimiento"] },
    { id: 8, name: "Gestión del Cambio", description: "Gestión del cambio organizacional", baseEffort: 96, activities: ["Gestión de Interesados", "Plan de Comunicación", "Estrategia de Adopción", "Métricas de Éxito"] }
  ]);

  // Estado para las áreas de conocimiento de los consultores
  const [knowledgeAreas, setKnowledgeAreas] = useState([
    { id: 1, name: "Inteligencia de Negocios", baseRate: 120, description: "Análisis de negocio y reportería" },
    { id: 2, name: "Ingeniería de Datos", baseRate: 130, description: "Ingeniería y arquitectura de datos" },
    { id: 3, name: "Análisis y Machine Learning", baseRate: 150, description: "Análisis avanzado y ML" },
    { id: 4, name: "Plataformas Cloud", baseRate: 140, description: "Experiencia en AWS, Azure, GCP" },
    { id: 5, name: "Gobernanza de Datos", baseRate: 125, description: "Gobernanza y calidad de datos" },
    { id: 6, name: "Visualización y UX", baseRate: 110, description: "Dashboards y experiencia de usuario" },
    { id: 7, name: "Gestión del Cambio", baseRate: 115, description: "Gestión del cambio organizacional" },
    { id: 8, name: "Gestión de Proyectos", baseRate: 105, description: "Gestión de proyectos" }
  ]);

  // Estado para los niveles de experiencia
  const [experienceLevels, setExperienceLevels] = useState([
    { id: 1, name: "Junior", multiplier: 0.7, description: "0-2 años de experiencia" },
    { id: 2, name: "Semi-Senior", multiplier: 1.0, description: "3-5 años de experiencia" },
    { id: 3, name: "Senior", multiplier: 1.3, description: "6-10 años de experiencia" },
    { id: 4, name: "Experto", multiplier: 1.6, description: "10+ años de experiencia" },
    { id: 5, name: "Principal", multiplier: 2.0, description: "15+ años, liderazgo técnico" }
  ]);

  // Estado para los recursos especializados de BI
  const [biResources, setBiResources] = useState([
    { id: 1, role: "Director de Programa BI", knowledgeAreaId: 8, experienceLevelId: 5, customRate: null, workBlock: 4, utilizationByPhase: {1: 0.5, 2: 0.3, 3: 0.2, 4: 0.2, 5: 0.2, 6: 0.2, 7: 0.4, 8: 0.6} },
    { id: 2, role: "Arquitecto de Soluciones BI", knowledgeAreaId: 1, experienceLevelId: 4, customRate: null, workBlock: 4, utilizationByPhase: {1: 0.8, 2: 1.0, 3: 0.6, 4: 0.8, 5: 0.4, 6: 0.3, 7: 0.2, 8: 0.1} },
    { id: 3, role: "Arquitecto de Datos", knowledgeAreaId: 2, experienceLevelId: 4, customRate: null, workBlock: 4, utilizationByPhase: {1: 0.3, 2: 0.8, 3: 1.0, 4: 0.6, 5: 0.3, 6: 0.2, 7: 0.1, 8: 0.1} },
    { id: 4, role: "Desarrollador ETL", knowledgeAreaId: 2, experienceLevelId: 2, customRate: null, workBlock: 2, utilizationByPhase: {1: 0.1, 2: 0.2, 3: 1.0, 4: 0.8, 5: 0.2, 6: 0.6, 7: 0.2, 8: 0.1} },
    { id: 5, role: "Desarrollador BI", knowledgeAreaId: 1, experienceLevelId: 2, customRate: null, workBlock: 2, utilizationByPhase: {1: 0.1, 2: 0.2, 3: 0.3, 4: 0.4, 5: 1.0, 6: 0.8, 7: 0.3, 8: 0.1} },
    { id: 6, role: "Analista de Datos", knowledgeAreaId: 3, experienceLevelId: 2, customRate: null, workBlock: 1, utilizationByPhase: {1: 0.5, 2: 0.3, 3: 0.6, 4: 0.2, 5: 0.8, 6: 0.6, 7: 0.4, 8: 0.3} },
    { id: 7, role: "Especialista QA", knowledgeAreaId: 1, experienceLevelId: 2, customRate: null, workBlock: 2, utilizationByPhase: {1: 0.1, 2: 0.1, 3: 0.2, 4: 0.3, 5: 0.4, 6: 1.0, 7: 0.6, 8: 0.2} },
    { id: 8, role: "Especialista en Gestión del Cambio", knowledgeAreaId: 7, experienceLevelId: 3, customRate: null, workBlock: 4, utilizationByPhase: {1: 0.3, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.2, 6: 0.2, 7: 0.8, 8: 1.0} },
    { id: 9, role: "Gerente de Proyecto", knowledgeAreaId: 8, experienceLevelId: 3, customRate: null, workBlock: 4, utilizationByPhase: {1: 0.6, 2: 0.6, 3: 0.6, 4: 0.6, 5: 0.6, 6: 0.6, 7: 0.6, 8: 0.6} },
    { id: 10, role: "Stakeholder (Cliente)", knowledgeAreaId: 8, experienceLevelId: 3, customRate: 0, workBlock: 2, utilizationByPhase: {1:0.1, 2:0.1, 3:0.1, 4:0.1, 5:0.1, 6:0.1, 7:0.1, 8:0.1} }
  ]);

  // Estados para resultados de cálculo y control de UI
  const [estimation, setEstimation] = useState(null);
  const [activeTab, setActiveTab] = useState('assessment');
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [calendarView, setCalendarView] = useState('month');
  // eslint-disable-next-line no-unused-vars
  const [projectStartDate, _setProjectStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [actualHours, setActualHours] = useState({});

  // Hook movido al nivel superior del componente para cumplir con las Reglas de Hooks
  const dayToPhaseMap = useMemo(() => {
    if (!estimation) return new Map();
    const map = new Map();
    const startDate = new Date(projectStartDate + 'T00:00:00');
    estimation.phases.forEach(phase => {
        for (let i = 0; i < phase.adjustedEffortDays; i++) {
            const date = addWorkDays(startDate, phase.startDay + i);
            map.set(date.toISOString().split('T')[0], phase);
        }
    });
    return map;
  }, [estimation, projectStartDate]);


  // --- Funciones de Lógica de Negocio ---
  const calculateResourceRate = (resource) => {
    if (resource.customRate !== null) return resource.customRate;
    const knowledgeArea = knowledgeAreas.find(ka => ka.id === resource.knowledgeAreaId);
    const experienceLevel = experienceLevels.find(el => el.id === resource.experienceLevelId);
    if (!knowledgeArea || !experienceLevel) return 100;
    return Math.round(knowledgeArea.baseRate * experienceLevel.multiplier);
  };

  const calculateComplexityMultiplier = () => {
    let totalMultiplier = 1;
    Object.values(complexityFactors).forEach(category => {
      let categoryMultiplier = 0;
      let totalWeight = 0;
      Object.values(category).forEach(factor => {
        if (factor.value) {
          categoryMultiplier += factor.multiplier[factor.value] * factor.weight;
          totalWeight += factor.weight;
        }
      });
      if (totalWeight > 0) {
        totalMultiplier *= (categoryMultiplier / totalWeight);
      }
    });
    return Math.max(1, totalMultiplier);
  };

  const calculateForresterEstimation = () => {
    const complexityMultiplier = calculateComplexityMultiplier();
    
    let remainingHoursByPhase = projectPhases.map(p => ({
        phaseId: p.id,
        hours: Math.ceil(p.baseEffort * complexityMultiplier)
    }));

    let workDays = 0;
    let phaseTimeline = {};
    let currentPhaseIndex = 0;

    while(remainingHoursByPhase.some(p => p.hours > 0) && currentPhaseIndex < remainingHoursByPhase.length) {
        const currentPhaseId = remainingHoursByPhase[currentPhaseIndex].phaseId;
        if (!phaseTimeline[currentPhaseId]) {
            phaseTimeline[currentPhaseId] = { startDay: workDays };
        }

        let dailyEffort = 0;
        for(const resource of biResources) {
            const utilization = resource.utilizationByPhase[currentPhaseId] || 0;
            dailyEffort += utilization * hoursPerWorkDay;
        }

        if (dailyEffort > 0) {
            const daysForPhase = Math.ceil(remainingHoursByPhase[currentPhaseIndex].hours / dailyEffort);
            workDays += daysForPhase;
            phaseTimeline[currentPhaseId].endDay = workDays - 1;
        }
        
        remainingHoursByPhase[currentPhaseIndex].hours = 0;
        currentPhaseIndex++;
    }

    const phaseEstimations = projectPhases.map(phase => {
      const adjustedEffortHours = Math.ceil(phase.baseEffort * complexityMultiplier);
      const resourceCosts = biResources.map(resource => {
        const utilization = resource.utilizationByPhase[phase.id] || 0;
        const effortHours = adjustedEffortHours * utilization;
        const hourlyRate = calculateResourceRate(resource);
        const cost = effortHours * hourlyRate;
        return { ...resource, effort: effortHours, cost, utilization, hourlyRate };
      });
      const totalCost = resourceCosts.reduce((sum, r) => sum + r.cost, 0);
      
      const timeline = phaseTimeline[phase.id] || { startDay: 0, endDay: -1 };

      return { 
        ...phase, 
        adjustedEffortHours,
        resourceCosts, 
        totalCost, 
        startDay: timeline.startDay,
        adjustedEffortDays: (timeline.endDay - timeline.startDay + 1)
      };
    });

    const totalProjectEffortHours = phaseEstimations.reduce((sum, p) => sum + p.adjustedEffortHours, 0);
    const totalProjectEffortDays = totalProjectEffortHours / hoursPerWorkDay;
    const totalProjectCost = phaseEstimations.reduce((sum, p) => sum + p.totalCost, 0);
    const totalDurationWeeks = Math.ceil(workDays / 5);
    const contingencyPercentage = Math.min(25, Math.max(10, (complexityMultiplier - 1) * 15 + 10));
    const contingencyCost = totalProjectCost * (contingencyPercentage / 100);
    
    // Calcular resumen quincenal
    const fortnightSummary = {};
    for (let day = 0; day < workDays; day++) {
        const fortnightNumber = Math.floor(day / 10) + 1;
        const currentPhase = phaseEstimations.find(p => day >= p.startDay && day <= p.startDay + p.adjustedEffortDays - 1);
        if (currentPhase) {
            currentPhase.resourceCosts.forEach(resource => {
                if (resource.utilization > 0) {
                    if (!fortnightSummary[resource.role]) {
                        fortnightSummary[resource.role] = {};
                    }
                    if (!fortnightSummary[resource.role][fortnightNumber]) {
                        fortnightSummary[resource.role][fortnightNumber] = 0;
                    }
                    fortnightSummary[resource.role][fortnightNumber] += hoursPerWorkDay * resource.utilization;
                }
            });
        }
    }

    setEstimation({
      phases: phaseEstimations,
      complexityMultiplier,
      totalProjectCost,
      totalProjectEffortHours,
      totalProjectEffortDays,
      totalDurationWeeks,
      totalWorkDays: workDays,
      contingencyPercentage: contingencyPercentage.toFixed(1),
      contingencyCost,
      finalCost: totalProjectCost + contingencyCost,
      fortnightSummary
    });
    setCurrentCalendarDate(new Date(projectStartDate + 'T00:00:00'));
    setActiveTab('estimation');
  };

  // --- Funciones CRUD y de Edición ---
  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditingData({ ...item });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const handleSave = (setter, items) => {
    setter(items.map(item => (item.id === editingId ? editingData : item)));
    handleCancel();
  };
  
  const handlePhaseSave = () => {
    const updatedPhase = { ...editingData };
    delete updatedPhase.utilization;
    setProjectPhases(projectPhases.map(p => p.id === editingId ? updatedPhase : p));

    const newBiResources = biResources.map(resource => {
        const newUtilizationByPhase = { ...resource.utilizationByPhase };
        if (editingData.utilization[resource.id] !== undefined) {
            newUtilizationByPhase[editingId] = editingData.utilization[resource.id];
        }
        return { ...resource, utilizationByPhase: newUtilizationByPhase };
    });
    setBiResources(newBiResources);

    handleCancel();
  };

  const handleDelete = (setter, items, id) => {
    setter(items.filter(item => item.id !== id));
  };

  const handleAdd = (setter, items, newItem) => {
    const newId = Math.max(0, ...items.map(i => i.id)) + 1;
    setter([...items, { ...newItem, id: newId }]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumericInputChange = (e) => {
    const { name, value } = e.target;
    setEditingData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
  };

  const handlePhaseUtilizationChange = (resourceId, value) => {
    const percentage = Math.max(0, Math.min(100, Number(value) || 0));
    setEditingData(prev => ({
        ...prev,
        utilization: {
            ...prev.utilization,
            [resourceId]: percentage / 100
        }
    }));
  };

  const handleActualHoursChange = (resourceId, phaseId, value) => {
    const hours = Number(value) || 0;
    setActualHours(prev => ({
        ...prev,
        [resourceId]: {
            ...prev[resourceId],
            [phaseId]: hours
        }
    }));
  };

  const CalculationButton = () => (
    <div className="text-center pt-4 mt-auto">
        <button onClick={calculateForresterEstimation} className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md">
            <Calculator className="inline mr-2" size={20} />
            Calcular Estimación
        </button>
    </div>
  );

  // --- Componentes de Renderizado ---
  const renderComplexitySelector = (category, factorKey, factor) => {
    const formattedLabel = factorKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return (
        <div key={factorKey} className="bg-white p-4 rounded-lg border">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {formattedLabel}
                <span className="text-xs text-gray-500 ml-2">(Peso: {factor.weight * 100}%)</span>
            </label>
            <select
                value={factor.value}
                onChange={(e) => {
                    const newFactors = { ...complexityFactors };
                    newFactors[category][factorKey].value = e.target.value;
                    setComplexityFactors(newFactors);
                }}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="">Seleccionar...</option>
                {Object.keys(factor.multiplier).map(option => (
                    <option key={option} value={option}>
                        {option} (x{factor.multiplier[option]})
                    </option>
                ))}
            </select>
        </div>
    );
  };

  const EditableTableCell = ({ value, name, type = 'text' }) => (
    <td className="px-6 py-4">
      <input
        type={type}
        name={name}
        value={value}
        onChange={type === 'number' ? handleNumericInputChange : handleInputChange}
        className="w-full p-1 border rounded"
      />
    </td>
  );

  const renderGanttChart = () => {
    if (!estimation) return null;
    const totalWorkDays = estimation.totalWorkDays;
    if (totalWorkDays <= 0) return null;
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-gray-500'];
    const totalWeeks = Math.ceil(totalWorkDays / 5);

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><GanttChartSquare/> Diagrama de Gantt</h3>
            <div className="bg-gray-100 p-4 rounded-lg space-y-2">
                <div className="relative h-6 flex mb-2">
                    <div className="w-48 text-sm pr-2"></div>
                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${totalWeeks}, minmax(0, 1fr))`}}>
                        {Array.from({ length: totalWeeks }, (_, i) => (
                            <div key={i} className="text-xs text-center text-gray-600 border-r">Semana {i + 1}</div>
                        ))}
                    </div>
                </div>
                {estimation.phases.map((phase, index) => {
                    const leftPercentage = (phase.startDay / totalWorkDays) * 100;
                    const widthPercentage = (phase.adjustedEffortDays / totalWorkDays) * 100;
                    return (
                        <div key={phase.id} className="relative h-10 flex items-center">
                            <div className="w-48 text-sm pr-2 text-right font-medium text-gray-700 truncate">{phase.name}</div>
                            <div className="flex-1 bg-gray-300 rounded h-6 relative">
                                <div 
                                    className={`absolute h-6 rounded text-white text-xs flex items-center justify-center ${colors[index % colors.length]}`}
                                    style={{ left: `${leftPercentage}%`, width: `${widthPercentage}%` }}
                                    title={`${phase.name}: Días ${phase.startDay + 1} a ${phase.startDay + phase.adjustedEffortDays} (${phase.adjustedEffortDays} días)`}
                                >
                                    <span className="truncate px-1">{phase.name}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };
  
  const renderFortnightSummary = () => {
    if (!estimation || !estimation.fortnightSummary) return null;
    const summary = estimation.fortnightSummary;
    const resources = Object.keys(summary);
    if (resources.length === 0) return null;

    const allFortnights = new Set();
    resources.forEach(res => {
        Object.keys(summary[res]).forEach(fn => allFortnights.add(fn));
    });
    const fortnightHeaders = Array.from(allFortnights).sort((a, b) => a - b);

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><Clock/> Resumen Quincenal de Horas por Recurso</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded-lg">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
                            {fortnightHeaders.map(fn => <th key={fn} className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Quincena {fn}</th>)}
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Total Horas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {resources.map(resource => {
                            const totalHours = fortnightHeaders.reduce((acc, fn) => acc + (summary[resource][fn] || 0), 0);
                            return (
                                <tr key={resource}>
                                    <td className="px-4 py-2 font-medium">{resource}</td>
                                    {fortnightHeaders.map(fn => <td key={fn} className="px-4 py-2 text-center">{Math.round(summary[resource][fn] || 0)}</td>)}
                                    <td className="px-4 py-2 text-center font-bold">{Math.round(totalHours)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const renderResourceAllocationAnalysis = () => {
    if (!estimation) return null;

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><Users/> Análisis de Asignación de Recursos</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded-lg">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
                            {projectPhases.map(p => <th key={p.id} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase" title={p.name}>F{p.id} %</th>)}
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Horas Totales</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Bloque Intensidad</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Bloques Completos</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Horas Restantes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {biResources.map(resource => {
                            const totalHours = estimation.phases.reduce((acc, phase) => {
                                const resourceInPhase = phase.resourceCosts.find(r => r.id === resource.id);
                                return acc + (resourceInPhase ? resourceInPhase.effort : 0);
                            }, 0);

                            if (totalHours === 0) return null;

                            const workBlock = resource.workBlock || 1;
                            const fullBlocks = Math.floor(totalHours / workBlock);
                            const remainingHours = totalHours % workBlock;

                            return (
                                <tr key={resource.id}>
                                    <td className="px-4 py-2 font-medium">{resource.role}</td>
                                    {projectPhases.map(p => {
                                        const utilization = resource.utilizationByPhase[p.id] || 0;
                                        return <td key={p.id} className="px-2 py-2 text-center text-sm">{(utilization * 100).toFixed(0)}%</td>
                                    })}
                                    <td className="px-4 py-2 text-center font-bold">{totalHours.toFixed(1)}</td>
                                    <td className="px-4 py-2 text-center">{workBlock}h</td>
                                    <td className="px-4 py-2 text-center">{fullBlocks}</td>
                                    <td className="px-4 py-2 text-center">{remainingHours.toFixed(1)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const renderCalendarView = () => {
    if (!estimation) return null;

    const handleCalendarNav = (direction) => {
        setCurrentCalendarDate(prevDate => {
            const newDate = new Date(prevDate);
            if (calendarView === 'month') {
                newDate.setMonth(newDate.getMonth() + direction);
            } else if (calendarView === 'week') {
                newDate.setDate(newDate.getDate() + (7 * direction));
            } else {
                newDate.setDate(newDate.getDate() + direction);
            }
            return newDate;
        });
    };
    
    const getCalendarDays = () => {
        const days = [];
        let startDate, endDate;
        
        if (calendarView === 'month') {
            startDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
            endDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
            
            const firstDayOfWeek = startDate.getDay();
            const placeholders = (firstDayOfWeek === 0) ? 6 : firstDayOfWeek - 1;

            for (let i = 0; i < placeholders; i++) {
                days.push(null);
            }
        } else if (calendarView === 'week') {
            const dayOfWeek = currentCalendarDate.getDay();
            startDate = new Date(currentCalendarDate);
            startDate.setDate(startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Lunes
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6); // Domingo
        } else { // day
            startDate = new Date(currentCalendarDate);
            endDate = new Date(currentCalendarDate);
        }

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
        }
        return days;
    };

    const calendarDays = getCalendarDays();
    const calendarTitle = calendarView === 'day' 
        ? currentCalendarDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : currentCalendarDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });

    return (
        <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><Calendar/> Calendario de Recursos</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleCalendarNav(-1)} className="p-1 rounded-full hover:bg-gray-200"><ChevronLeft/></button>
                        <span className="font-medium text-center w-48">{calendarTitle}</span>
                        <button onClick={() => handleCalendarNav(1)} className="p-1 rounded-full hover:bg-gray-200"><ChevronRight/></button>
                    </div>
                    <div className="flex gap-1 bg-gray-200 p-1 rounded-md">
                        {['month', 'week', 'day'].map(view => (
                            <button key={view} onClick={() => setCalendarView(view)} className={`px-3 py-1 text-sm rounded ${calendarView === view ? 'bg-white shadow' : 'hover:bg-gray-300'}`}>
                                {view === 'month' ? 'Mes' : view === 'week' ? 'Semana' : 'Día'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className={`grid gap-1 ${calendarView === 'month' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                {calendarView === 'month' && ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => <div key={day} className="font-bold text-center text-sm text-gray-500">{day}</div>)}
                {calendarDays.map((date, index) => {
                    if (!date) {
                        return <div key={`placeholder-${index}`} className="border rounded-lg bg-gray-50"></div>;
                    }
                    const dateString = date.toISOString().split('T')[0];
                    const phase = dayToPhaseMap.get(dateString);
                    const activeResources = phase ? phase.resourceCosts.filter(r => r.utilization > 0) : [];
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    
                    return (
                        <div key={index} className={`border rounded-lg p-2 min-h-[120px] flex flex-col ${phase && !isWeekend ? 'bg-white' : 'bg-gray-50'} ${isWeekend ? 'bg-gray-200' : ''}`}>
                            <div className="font-bold text-sm">{date.getDate()}</div>
                            {phase && !isWeekend && (
                                <>
                                    <div className="text-xs text-gray-500 mb-1 flex-shrink-0">{phase.name}</div>
                                    <div className="space-y-1 overflow-y-auto">
                                        {activeResources.map(res => (
                                            <div key={res.id} className="text-xs bg-green-100 text-green-800 p-1 rounded truncate" title={`${res.role} (${(res.utilization*100).toFixed(0)}%)`}>
                                                {res.role}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };
  
  const renderTrackingView = () => {
    if (!estimation) return null;

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><Target/> Registro de Horas Reales</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
                                {estimation.phases.map(p => <th key={p.id} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase" title={p.name}>F{p.id}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {biResources.map(resource => (
                                <tr key={resource.id}>
                                    <td className="px-4 py-2 font-medium">{resource.role}</td>
                                    {estimation.phases.map(phase => (
                                        <td key={phase.id} className="px-2 py-2">
                                            <input
                                                type="number"
                                                className="w-20 p-1 border rounded text-sm text-center"
                                                value={actualHours[resource.id]?.[phase.id] || ''}
                                                onChange={(e) => handleActualHoursChange(resource.id, phase.id, e.target.value)}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><BarChart3/> Análisis de Rentabilidad (Estimado vs. Real)</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Horas Estimadas</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Horas Reales</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Variación</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {biResources.map(resource => {
                                const estimated = estimation.phases.reduce((acc, p) => acc + (p.resourceCosts.find(rc => rc.id === resource.id)?.effort || 0), 0);
                                const actual = Object.values(actualHours[resource.id] || {}).reduce((acc, h) => acc + h, 0);
                                const variance = actual - estimated;
                                if (estimated === 0 && actual === 0) return null;
                                return (
                                    <tr key={resource.id}>
                                        <td className="px-4 py-2 font-medium">{resource.role}</td>
                                        <td className="px-4 py-2 text-center">{estimated.toFixed(1)}</td>
                                        <td className="px-4 py-2 text-center">{actual.toFixed(1)}</td>
                                        <td className={`px-4 py-2 text-center font-bold ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {variance.toFixed(1)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold">
                            <tr>
                                <td className="px-4 py-2">Total Proyecto</td>
                                <td className="px-4 py-2 text-center">{estimation.totalProjectEffortHours.toFixed(1)}</td>
                                <td className="px-4 py-2 text-center">
                                    {Object.values(actualHours).flatMap(ph => Object.values(ph)).reduce((acc, h) => acc + h, 0).toFixed(1)}
                                </td>
                                <td className={`px-4 py-2 text-center ${
                                    (Object.values(actualHours).flatMap(ph => Object.values(ph)).reduce((acc, h) => acc + h, 0) - estimation.totalProjectEffortHours) > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    {(Object.values(actualHours).flatMap(ph => Object.values(ph)).reduce((acc, h) => acc + h, 0) - estimation.totalProjectEffortHours).toFixed(1)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen font-sans">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6 flex items-center justify-center gap-4">
            <svg width="60" height="60" viewBox="0 0 108 108" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.4,29.5c-4.2,4.2-6.7,9.9-6.7,16.1c0,6.2,2.5,11.9,6.7,16.1l29.1,29.1c4.2,4.2,9.9,6.7,16.1,6.7s11.9-2.5,16.1-6.7 l29.1-29.1c4.2-4.2,6.7-9.9,6.7-16.1c0-6.2-2.5-11.9-6.7-16.1L70.7,10.4c-4.2-4.2-9.9-6.7-16.1-6.7s-11.9,2.5-16.1,6.7L9.4,29.5z" fill="#f7b600"/>
                <path d="M9.4,29.5c-4.2,4.2-6.7,9.9-6.7,16.1c0,6.2,2.5,11.9,6.7,16.1l29.1,29.1c4.2,4.2,9.9,6.7,16.1,6.7V3.7 c-6.2,0-11.9,2.5-16.1,6.7L9.4,29.5z" fill="#005c9e"/>
                <g>
                    <rect x="35.8" y="35.8" width="8.4" height="36.4" fill="#333333"/>
                    <rect x="49.8" y="47.6" width="8.4" height="24.6" fill="#333333"/>
                    <rect x="63.8" y="24" width="8.4" height="48.2" fill="#333333"/>
                </g>
            </svg>
            <div>
                <h1 className="text-4xl font-bold" style={{ color: '#4A4A4A' }}>
                    Cepo<span style={{ color: '#000000' }}>BIA</span>
                </h1>
            </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex mb-6 border-b overflow-x-auto">
          {[
            {id: 'assessment', label: 'Análisis de Complejidad', icon: BarChart3},
            {id: 'knowledge', label: 'Conocimiento y Experiencia', icon: BrainCircuit},
            {id: 'phases', label: 'Fases del Proyecto', icon: Clock},
            {id: 'resources', label: 'Recursos', icon: Users},
            estimation && {id: 'estimation', label: 'Estimación', icon: Calculator},
            estimation && {id: 'tracking', label: 'Seguimiento', icon: Target}
          ].filter(Boolean).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido de la Pestaña: Análisis de Complejidad */}
        {activeTab === 'assessment' && (
          <div className="space-y-8 animate-fade-in flex flex-col h-full">
            <div>
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">🎯 Análisis de Complejidad</h2>
                <p className="text-gray-600">Evalúa los factores de complejidad según la metodología Forrester.</p>
              </div>
              <div className="space-y-8 mt-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><Database size={20} /> Complejidad Técnica</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.keys(complexityFactors.technical).map(key => renderComplexitySelector('technical', key, complexityFactors.technical[key]))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><Users size={20} /> Complejidad Organizacional</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.keys(complexityFactors.organizational).map(key => renderComplexitySelector('organizational', key, complexityFactors.organizational[key]))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><Settings size={20} /> Alcance del Proyecto</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.keys(complexityFactors.projectScope).map(key => renderComplexitySelector('projectScope', key, complexityFactors.projectScope[key]))}
                  </div>
                </div>
              </div>
            </div>
            <CalculationButton />
          </div>
        )}
        
        {/* Contenido de la Pestaña: Conocimiento y Experiencia */}
        {activeTab === 'knowledge' && (
            <div className="space-y-8 animate-fade-in flex flex-col h-full">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        <BrainCircuit size={24} className="inline mr-2"/> Áreas de Conocimiento y Tarifas Base
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border rounded-lg">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarifa Base (/hr)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {knowledgeAreas.map(area => (
                                    <tr key={area.id}>
                                        {editingId === area.id ? (
                                            <>
                                                <EditableTableCell value={editingData.name} name="name" />
                                                <EditableTableCell value={editingData.description} name="description" />
                                                <EditableTableCell value={editingData.baseRate} name="baseRate" type="number" />
                                                <td className="px-6 py-4 flex gap-2">
                                                    <button onClick={() => handleSave(setKnowledgeAreas, knowledgeAreas)} className="text-green-600"><Save size={18}/></button>
                                                    <button onClick={handleCancel} className="text-gray-600"><X size={18}/></button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 font-medium">{area.name}</td>
                                                <td className="px-6 py-4">{area.description}</td>
                                                <td className="px-6 py-4 font-semibold text-green-600">${area.baseRate}</td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <button onClick={() => handleEdit(area)} className="text-blue-600"><Edit3 size={18}/></button>
                                                    <button onClick={() => handleDelete(setKnowledgeAreas, knowledgeAreas, area.id)} className="text-red-600"><Trash2 size={18}/></button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button onClick={() => handleAdd(setKnowledgeAreas, knowledgeAreas, { name: 'Nueva Área', description: 'Descripción', baseRate: 100 })} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"><Plus size={16}/> Agregar Área</button>
                </div>
                 <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        <Award size={24} className="inline mr-2"/> Niveles de Experiencia y Multiplicadores
                    </h2>
                     <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border rounded-lg">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Multiplicador</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {experienceLevels.map(level => (
                                    <tr key={level.id}>
                                       {editingId === level.id ? (
                                           <>
                                                <EditableTableCell value={editingData.name} name="name" />
                                                <EditableTableCell value={editingData.description} name="description" />
                                                <EditableTableCell value={editingData.multiplier} name="multiplier" type="number" />
                                                <td className="px-6 py-4 flex gap-2">
                                                    <button onClick={() => handleSave(setExperienceLevels, experienceLevels)} className="text-green-600"><Save size={18}/></button>
                                                    <button onClick={handleCancel} className="text-gray-600"><X size={18}/></button>
                                                </td>
                                           </>
                                       ) : (
                                           <>
                                                <td className="px-6 py-4 font-medium">{level.name}</td>
                                                <td className="px-6 py-4">{level.description}</td>
                                                <td className="px-6 py-4 font-semibold text-blue-600">{level.multiplier.toFixed(1)}x</td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <button onClick={() => handleEdit(level)} className="text-blue-600"><Edit3 size={18}/></button>
                                                    <button onClick={() => handleDelete(setExperienceLevels, experienceLevels, level.id)} className="text-red-600"><Trash2 size={18}/></button>
                                                </td>
                                           </>
                                       )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button onClick={() => handleAdd(setExperienceLevels, experienceLevels, { name: 'Nuevo Nivel', description: 'Descripción', multiplier: 1.0 })} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"><Plus size={16}/> Agregar Nivel</button>
                </div>
                <CalculationButton />
            </div>
        )}
        
        {/* Contenido de la Pestaña: Fases del Proyecto */}
        {activeTab === 'phases' && (
          <div className="space-y-6 animate-fade-in flex flex-col h-full">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">🚀 Fases del Proyecto de BI</h2>
              <div className="grid gap-4">
                {projectPhases.map((phase) => (
                  <div key={phase.id} className="border rounded-lg p-6 bg-gray-50 shadow-sm">
                    {editingId === phase.id ? (
                        <div className="space-y-3">
                          <input name="name" value={editingData.name} onChange={handleInputChange} className="text-lg font-semibold w-full p-1 border rounded" />
                          <textarea name="description" value={editingData.description} onChange={handleInputChange} className="text-gray-600 w-full p-1 border rounded" rows="2" />
                          <div>
                            <span className="text-sm text-gray-500">Esfuerzo Base (horas): </span>
                            <input name="baseEffort" type="number" value={editingData.baseEffort} onChange={handleNumericInputChange} className="font-medium w-24 p-1 border rounded" />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-700 mt-3 mb-2">Recursos y Participación (%)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                              {biResources.map(resource => (
                                  <div key={resource.id}>
                                      <label className="text-xs text-gray-600 truncate" title={resource.role}>{resource.role}</label>
                                      <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={Math.round((editingData.utilization[resource.id] || 0) * 100)}
                                          onChange={(e) => handlePhaseUtilizationChange(resource.id, e.target.value)}
                                          className="w-full p-1 border rounded text-sm"
                                      />
                                  </div>
                              ))}
                          </div>
                          <div className="flex gap-2">
                             <button onClick={handlePhaseSave} className="text-green-600"><Save size={18}/></button>
                             <button onClick={handleCancel} className="text-gray-600"><X size={18}/></button>
                          </div>
                        </div>
                    ) : (
                        <>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800">{phase.name}</h3>
                              <p className="text-gray-600 mt-1">{phase.description}</p>
                              <div className="mt-2">
                                <span className="text-sm text-gray-500">Esfuerzo Base: </span>
                                <span className="font-medium text-blue-600">{phase.baseEffort} horas</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => {
                                  const utilization = {};
                                  biResources.forEach(r => {
                                      utilization[r.id] = r.utilizationByPhase[phase.id] || 0;
                                  });
                                  handleEdit({ ...phase, utilization });
                              }} className="text-blue-600"><Edit3 size={18}/></button>
                              <button onClick={() => handleDelete(setProjectPhases, projectPhases, phase.id)} className="text-red-600"><Trash2 size={18}/></button>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Recursos Asignados:</h4>
                            <div className="flex flex-wrap gap-2">
                              {biResources.filter(r => r.utilizationByPhase[phase.id] > 0).map(r => (
                                <span key={r.id} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                  {r.role} ({(r.utilizationByPhase[phase.id] * 100).toFixed(0)}%)
                                </span>
                              ))}
                            </div>
                          </div>
                        </>
                    )}
                  </div>
                ))}
              </div>
               <button onClick={() => handleAdd(setProjectPhases, projectPhases, { name: 'Nueva Fase', description: 'Descripción', baseEffort: 80, activities: ['Nueva Actividad'] })} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"><Plus size={16}/> Agregar Fase</button>
            </div>
            <CalculationButton />
          </div>
        )}
        
        {/* Contenido de la Pestaña: Recursos */}
        {activeTab === 'resources' && (
          <div className="space-y-6 animate-fade-in flex flex-col h-full">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">👥 Recursos Especializados de BI</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {biResources.map((resource) => (
                  <div key={resource.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                    {editingId === resource.id ? (
                        <div className="space-y-2 text-sm">
                          <div><label className="font-medium">Rol:</label><input name="role" value={editingData.role} onChange={handleInputChange} className="w-full p-1 border rounded" /></div>
                          <div>
                            <label className="font-medium">Área Conocimiento:</label>
                            <select name="knowledgeAreaId" value={editingData.knowledgeAreaId} onChange={handleNumericInputChange} className="w-full p-1 border rounded">
                              {knowledgeAreas.map(ka => <option key={ka.id} value={ka.id}>{ka.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="font-medium">Nivel Experiencia:</label>
                            <select name="experienceLevelId" value={editingData.experienceLevelId} onChange={handleNumericInputChange} className="w-full p-1 border rounded">
                              {experienceLevels.map(el => <option key={el.id} value={el.id}>{el.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="font-medium">Bloque de Intensidad (horas):</label>
                            <select name="workBlock" value={editingData.workBlock} onChange={handleNumericInputChange} className="w-full p-1 border rounded">
                                <option value="1">1 hora</option>
                                <option value="2">2 horas</option>
                                <option value="3">3 horas</option>
                                <option value="4">4 horas</option>
                            </select>
                          </div>
                          <div className="flex gap-2 pt-2">
                             <button onClick={() => handleSave(setBiResources, biResources)} className="text-green-600"><Save size={18}/></button>
                             <button onClick={handleCancel} className="text-gray-600"><X size={18}/></button>
                          </div>
                        </div>
                    ) : (
                        <>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800">{resource.role}</h3>
                              <div className="text-sm text-gray-600">{experienceLevels.find(el => el.id === resource.experienceLevelId)?.name || 'N/A'}</div>
                              <div className="text-lg font-bold text-green-600 mt-1">${calculateResourceRate(resource)}/hora</div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleEdit(resource)} className="text-blue-600"><Edit3 size={18}/></button>
                              <button onClick={() => handleDelete(setBiResources, biResources, resource.id)} className="text-red-600"><Trash2 size={18}/></button>
                            </div>
                          </div>
                        </>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => handleAdd(setBiResources, biResources, { role: 'Nuevo Rol', knowledgeAreaId: 1, experienceLevelId: 1, customRate: null, workBlock: 4, utilizationByPhase: {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0} })} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"><Plus size={16}/> Agregar Recurso</button>
            </div>
            <CalculationButton />
          </div>
        )}

        {/* Contenido de la Pestaña: Estimación Final */}
        {activeTab === 'estimation' && (
          <div className="animate-fade-in">
            {estimation ? (
              <div className="space-y-8">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h2 className="text-2xl font-semibold text-gray-800">💰 Estimación Final del Proyecto</h2>
                    <div className="flex items-center gap-4">
                         <div className="relative">
                            <button onClick={() => setShowExportMenu(!showExportMenu)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 flex items-center gap-2">
                                <Download size={16}/> Exportar Resumen
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                    <button onClick={() => { exportData(estimation, 'csv', clientName, projectName, projectStartDate); setShowExportMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Excel (.csv)</button>
                                    <button onClick={() => { exportData(estimation, 'word', clientName, projectName, projectStartDate); setShowExportMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Word (.doc)</button>
                                    <button onClick={() => { exportData(estimation, 'markdown', clientName, projectName, projectStartDate); setShowExportMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Markdown (.md)</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 border-b pb-4">
                    <div>
                        <label htmlFor="projectName" className="text-sm font-medium text-gray-600">Nombre del Proyecto</label>
                        <input type="text" id="projectName" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full p-2 border rounded-md mt-1"/>
                    </div>
                    <div>
                        <label htmlFor="clientName" className="text-sm font-medium text-gray-600">Nombre del Cliente</label>
                        <input type="text" id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-2 border rounded-md mt-1"/>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg">
                    <div className="text-sm opacity-90">Multiplicador de Complejidad</div>
                    <div className="text-2xl font-bold">{estimation.complexityMultiplier.toFixed(2)}x</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg shadow-lg">
                    <div className="text-sm opacity-90">Costo Base</div>
                    <div className="text-2xl font-bold">${estimation.totalProjectCost.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg shadow-lg">
                    <div className="text-sm opacity-90">Contingencia ({estimation.contingencyPercentage}%)</div>
                    <div className="text-2xl font-bold">${estimation.contingencyCost.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
                    <div className="text-sm opacity-90">Costo Total Estimado</div>
                    <div className="text-2xl font-bold">${estimation.finalCost.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>
                
                {renderGanttChart()}

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">📅 Cronograma Estimado</h3>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div>
                        <div className="text-sm text-gray-600">Fecha de Inicio</div>
                        <div className="text-2xl font-bold text-blue-600">{new Date(projectStartDate + 'T00:00:00').toLocaleDateString('es-ES')}</div>
                    </div>
                     <div>
                        <div className="text-sm text-gray-600">Fecha de Finalización</div>
                        <div className="text-2xl font-bold text-blue-600">{addWorkDays(new Date(projectStartDate + 'T00:00:00'), Math.ceil(estimation.totalWorkDays)).toLocaleDateString('es-ES')}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Duración Total Estimada</div>
                      <div className="text-2xl font-bold text-blue-600">{estimation.totalDurationWeeks} semanas</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Esfuerzo Total</div>
                      <div className="text-3xl font-bold text-purple-600">{estimation.totalProjectEffortDays.toFixed(1)} días-persona</div>
                      <div className="text-sm text-gray-600">({estimation.totalProjectEffortHours.toFixed(0)} horas)</div>
                    </div>
                  </div>
                </div>
                
                {renderResourceAllocationAnalysis()}
                {renderFortnightSummary()}
                {renderCalendarView()}

              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Calculator size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">Esperando Cálculo</h3>
                <p className="text-gray-500 mt-2">
                  Por favor, completa el 'Análisis de Complejidad' y haz clic en el botón de calcular para ver la estimación de tu proyecto.
                </p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'tracking' && (
            <div className="animate-fade-in">
                {estimation ? renderTrackingView() : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Target size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700">Primero calcula una estimación</h3>
                        <p className="text-gray-500 mt-2">
                          Para registrar las horas reales, primero debes generar una estimación en la pestaña 'Análisis de Complejidad'.
                        </p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ForresterBIEstimator;

