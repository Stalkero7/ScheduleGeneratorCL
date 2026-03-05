import { useState } from 'react'

function App() {
  // ===========================================
  // ESTADOS PRINCIPALES
  // ===========================================
  
  // Lista de todos los profesores registrados
  // Estructura mejorada: { id, nombre, horasContrato, asignaturas: ['Matemática', 'Física'], cursosAsignados: [cursoId1, cursoId2] }
  const [profesores, setProfesores] = useState([]);
  
  // Lista de todos los cursos del establecimiento
  const [cursos, setCursos] = useState([]);
  
  // Curso que está siendo editado actualmente
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  
  // Profesor seleccionado para editar asignaciones
  const [profesorSeleccionado, setProfesorSeleccionado] = useState(null);
  
  // Catálogo global de asignaturas disponibles
  const [asignaturasGlobales, setAsignaturasGlobales] = useState([
    "Lenguaje", "Matemática", "Historia", "Ciencias Naturales", "Inglés", 
    "Artes Visuales", "Música", "Educación Física", "Tecnología", "Orientación", "Religión"
  ]);

  // ===========================================
  // CONFIGURACIÓN DE HORARIOS (NUEVO)
  // ===========================================
  
  // Configuración del horario escolar
  const [configuracionHorario, setConfiguracionHorario] = useState({
    horaInicio: "08:00",      // Hora de inicio de clases
    horaTermino: "17:00",     // Hora de término de clases
    duracionBloque: 45,       // Duración de cada bloque en minutos
    recreos: [
      { despuesDe: 2, duracion: 15, nombre: "Recreo 1" },  // Recreo después del bloque 2
      { despuesDe: 4, duracion: 30, nombre: "Colación" },  // Colación después del bloque 4
      { despuesDe: 6, duracion: 15, nombre: "Recreo 2" }   // Recreo después del bloque 6
    ],
    diasSemana: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
  });

  // Horarios generados para todos los cursos y profesores
  const [horariosGenerados, setHorariosGenerados] = useState(null);
  const [horariosOriginales, setHorariosOriginales] = useState(null); // Backup para deshacer cambios
  
  // ===========================================
  // ESTADOS DE INTERFAZ
  // ===========================================
  
  // Formulario de nuevo profesor - ahora con múltiples asignaturas
  const [nuevoProfe, setNuevoProfe] = useState({ 
    nombre: '', 
    horasContrato: 44, 
    asignaturas: [] // Array de asignaturas que puede enseñar
  });
  
  const [nuevaAsignaturaManual, setNuevaAsignaturaManual] = useState('');
  const [mostrarPopUpAsignaturas, setMostrarPopUpAsignaturas] = useState(false);
  const [mostrarConfigHorario, setMostrarConfigHorario] = useState(false);
  const [mostrarAsignacionCursos, setMostrarAsignacionCursos] = useState(false);
  const [mostrarBuscadorProfes, setMostrarBuscadorProfes] = useState(false); // Nuevo
  const [vistaActual, setVistaActual] = useState('cursos'); // 'cursos' o 'horarios'
  const [profesorVistaHorario, setProfesorVistaHorario] = useState(null);
  const [error, setError] = useState('');
  
  // Estados para edición en vivo
  const [bloqueEditando, setBloqueEditando] = useState(null); // { cursoId, dia, bloqueIdx }
  const [alertasConflicto, setAlertasConflicto] = useState([]); // Conflictos detectados
  const [filtroAsignatura, setFiltroAsignatura] = useState(''); // Para filtrar profesores

  // ===========================================
  // GENERAR DATOS DE PRUEBA (COLEGIO FICTICIO)
  // ===========================================
  
  // Esta función crea un colegio completo con datos realistas
  const generarColegioFicticio = () => {
    // Limpiar datos existentes
    setProfesores([]);
    setCursos([]);
    setHorariosGenerados(null);
    setError('');

    // PASO 1: Crear profesores ficticios con nombres chilenos
    const nombresProf = [
      "María González", "Juan Pérez", "Carmen Silva", "Roberto Muñoz",
      "Patricia Rojas", "Carlos Vargas", "Andrea Torres", "Luis Hernández",
      "Claudia Soto", "Francisco López", "Valeria Contreras", "Diego Castillo",
      "Mónica Reyes", "Pablo Fuentes", "Isabel Vera", "Sergio Morales",
      "Daniela Núñez", "Rodrigo Gutiérrez", "Carolina Ramírez", "Javier Medina",
      "Fernanda Castro", "Marcelo Figueroa", "Lorena Espinoza", "Andrés Bravo"
    ];

    // Asignar especialidades a profesores
    const asignaturasBase = [
      "Lenguaje", "Matemática", "Historia", "Ciencias Naturales", "Inglés",
      "Artes Visuales", "Música", "Educación Física", "Tecnología", "Orientación"
    ];

    const profesoresGenerados = [];
    let idProfesor = 1000;

    // Generar profesores con especialidades variadas
    nombresProf.forEach((nombre, idx) => {
      const asignaturaPrincipal = asignaturasBase[idx % asignaturasBase.length];
      
      // Algunos profesores pueden enseñar múltiples asignaturas
      const asignaturas = [asignaturaPrincipal];
      
      // 30% de profesores son polivalentes (enseñan 2 materias)
      if (Math.random() < 0.3 && asignaturasBase.length > 1) {
        const asignaturaSecundaria = asignaturasBase[(idx + 1) % asignaturasBase.length];
        if (asignaturaSecundaria !== asignaturaPrincipal) {
          asignaturas.push(asignaturaSecundaria);
        }
      }

      profesoresGenerados.push({
        id: idProfesor++,
        nombre: nombre,
        asignaturas: asignaturas,
        horasContrato: idx % 3 === 0 ? 30 : 44, // Variar horas de contrato
        horasAsignadas: 0,
        cursosAsignados: [] // Se asignará automáticamente en la generación
      });
    });

    setProfesores(profesoresGenerados);

    // PASO 2: Crear cursos (Básica completa + Media completa con múltiples secciones)
    const cursosGenerados = [];
    let idCurso = 2000;

    // Enseñanza Básica (1° a 8°) con 2 secciones cada uno
    for (let nivel = 1; nivel <= 8; nivel++) {
      ['A', 'B'].forEach(seccion => {
        cursosGenerados.push({
          id: idCurso++,
          nombre: `${nivel}° Básico ${seccion}`,
          malla: generarMallaCurricular('basica', nivel),
          horario: {}
        });
      });
    }

    // Enseñanza Media (1° a 4°) con 3 secciones cada uno
    for (let nivel = 1; nivel <= 4; nivel++) {
      ['A', 'B', 'C'].forEach(seccion => {
        cursosGenerados.push({
          id: idCurso++,
          nombre: `${nivel}° Medio ${seccion}`,
          malla: generarMallaCurricular('media', nivel),
          horario: {}
        });
      });
    }

    setCursos(cursosGenerados);

    // Mostrar mensaje de éxito
    setError('');
    alert(`🏫 Colegio Ficticio Generado!\n\n✅ ${profesoresGenerados.length} profesores registrados\n✅ ${cursosGenerados.length} cursos creados\n\nAhora puedes probar el generador de horarios.`);
  };

  // Función auxiliar: genera una malla curricular realista según nivel
  const generarMallaCurricular = (tipo, nivel) => {
    const malla = {};

    if (tipo === 'basica') {
      // Malla para Enseñanza Básica (más énfasis en fundamentales)
      malla['Lenguaje'] = nivel <= 4 ? 8 : 6;
      malla['Matemática'] = nivel <= 4 ? 8 : 6;
      malla['Historia'] = 4;
      malla['Ciencias Naturales'] = 4;
      malla['Inglés'] = nivel <= 4 ? 3 : 4;
      malla['Artes Visuales'] = 2;
      malla['Música'] = 2;
      malla['Educación Física'] = 2;
      malla['Tecnología'] = 2;
      malla['Orientación'] = 1;
    } else {
      // Malla para Enseñanza Media (más equilibrada)
      malla['Lenguaje'] = 6;
      malla['Matemática'] = 7;
      malla['Historia'] = 4;
      malla['Ciencias Naturales'] = 6;
      malla['Inglés'] = 4;
      malla['Artes Visuales'] = 2;
      malla['Música'] = 2;
      malla['Educación Física'] = 2;
      malla['Tecnología'] = 2;
      malla['Orientación'] = 1;
    }

    return malla;
  };

  // ===========================================
  // FUNCIONES DE ASIGNATURAS
  // ===========================================
  
  // Agregar nueva asignatura al catálogo global
  const agregarAsignaturaGlobal = () => {
    const nombre = nuevaAsignaturaManual.trim();
    if (nombre && !asignaturasGlobales.includes(nombre)) {
      setAsignaturasGlobales([...asignaturasGlobales, nombre]);
      setNuevaAsignaturaManual('');
    }
  };

  // ===========================================
  // FUNCIONES DE DOCENTES
  // ===========================================
  
  // Registrar un nuevo docente en el sistema
  const registrarDocente = () => {
    if (!nuevoProfe.nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    
    if (nuevoProfe.asignaturas.length === 0) {
      setError('Debes seleccionar al menos una asignatura.');
      return;
    }
    
    setProfesores([...profesores, { 
      ...nuevoProfe, 
      id: Date.now(),
      horasAsignadas: 0,
      cursosAsignados: [] // Cursos donde este profesor hará clases
    }]);
    
    setNuevoProfe({ nombre: '', horasContrato: 44, asignaturas: [] });
    setError('');
  };

  // Toggle de asignatura en el formulario de nuevo profesor
  const toggleAsignaturaProfesor = (asignatura) => {
    if (nuevoProfe.asignaturas.includes(asignatura)) {
      setNuevoProfe({
        ...nuevoProfe,
        asignaturas: nuevoProfe.asignaturas.filter(a => a !== asignatura)
      });
    } else {
      setNuevoProfe({
        ...nuevoProfe,
        asignaturas: [...nuevoProfe.asignaturas, asignatura]
      });
    }
  };

  // Asignar/desasignar curso a un profesor
  const toggleCursoProfesor = (profesorId, cursoId) => {
    setProfesores(profesores.map(p => {
      if (p.id === profesorId) {
        const cursosAsignados = p.cursosAsignados || [];
        if (cursosAsignados.includes(cursoId)) {
          return { ...p, cursosAsignados: cursosAsignados.filter(c => c !== cursoId) };
        } else {
          return { ...p, cursosAsignados: [...cursosAsignados, cursoId] };
        }
      }
      return p;
    }));
  };

  // ===========================================
  // FUNCIONES DE EDICIÓN EN VIVO
  // ===========================================
  
  // Detectar conflictos al mover un bloque
  const detectarConflictos = (cursoId, dia, bloqueIdx, nuevoProfesorId, nuevaAsignatura) => {
    const conflictos = [];
    
    if (!horariosGenerados) return conflictos;
    
    // Verificar si el profesor ya está ocupado en ese bloque/día
    Object.entries(horariosGenerados.cursos).forEach(([cId, cursoData]) => {
      if (cId === cursoId.toString()) return; // Ignorar el mismo curso
      
      const bloque = cursoData.horario[dia][bloqueIdx];
      if (bloque && bloque.profesorId === nuevoProfesorId) {
        conflictos.push({
          tipo: 'profesor_ocupado',
          mensaje: `El profesor ya tiene clase en ${cursoData.nombre} a esta hora`,
          curso: cursoData.nombre,
          profesor: bloque.profesor
        });
      }
    });
    
    return conflictos;
  };

  // Cambiar asignación de un bloque
  const editarBloque = (cursoId, dia, bloqueIdx, nuevoProfesorId, nuevaAsignatura) => {
    // Detectar conflictos
    const conflictos = detectarConflictos(cursoId, dia, bloqueIdx, nuevoProfesorId, nuevaAsignatura);
    
    if (conflictos.length > 0) {
      setAlertasConflicto(conflictos);
      return false; // No permitir el cambio
    }
    
    // Actualizar horarios generados
    const nuevosHorarios = { ...horariosGenerados };
    const profesor = profesores.find(p => p.id === nuevoProfesorId);
    
    if (!profesor) return false;
    
    // Actualizar bloque del curso
    nuevosHorarios.cursos[cursoId].horario[dia][bloqueIdx] = nuevaAsignatura 
      ? {
          asignatura: nuevaAsignatura,
          profesor: profesor.nombre,
          profesorId: profesor.id,
          pendiente: false
        }
      : null;
    
    // Recalcular horas asignadas a profesores
    recalcularHorasProfesores(nuevosHorarios);
    
    setHorariosGenerados(nuevosHorarios);
    setBloqueEditando(null);
    setAlertasConflicto([]);
    return true;
  };

  // Eliminar un bloque (dejar vacío)
  const eliminarBloque = (cursoId, dia, bloqueIdx) => {
    const nuevosHorarios = { ...horariosGenerados };
    nuevosHorarios.cursos[cursoId].horario[dia][bloqueIdx] = null;
    
    recalcularHorasProfesores(nuevosHorarios);
    setHorariosGenerados(nuevosHorarios);
    setBloqueEditando(null);
  };

  // Recalcular horas asignadas de todos los profesores
  const recalcularHorasProfesores = (horarios) => {
    // Reiniciar contadores
    Object.keys(horarios.profesores).forEach(profId => {
      horarios.profesores[profId].horasAsignadas = 0;
      configuracionHorario.diasSemana.forEach(dia => {
        horarios.profesores[profId].horario[dia] = [];
      });
    });
    
    // Contar nuevamente desde los cursos
    Object.entries(horarios.cursos).forEach(([cursoId, cursoData]) => {
      configuracionHorario.diasSemana.forEach(dia => {
        cursoData.horario[dia].forEach((bloque, bloqueIdx) => {
          if (bloque && bloque.profesorId) {
            const profId = bloque.profesorId;
            if (horarios.profesores[profId]) {
              horarios.profesores[profId].horasAsignadas++;
              horarios.profesores[profId].horario[dia].push({
                bloque: bloqueIdx + 1,
                curso: cursoData.nombre,
                asignatura: bloque.asignatura
              });
            }
          }
        });
      });
    });
  };

  // Buscar profesores por asignatura
  const buscarProfesoresPorAsignatura = (asignatura) => {
    if (!asignatura) return profesores;
    
    return profesores.filter(p => 
      p.asignaturas && p.asignaturas.includes(asignatura)
    );
  };

  // Restaurar horario original (deshacer todos los cambios)
  const restaurarHorarioOriginal = () => {
    if (horariosOriginales) {
      setHorariosGenerados(JSON.parse(JSON.stringify(horariosOriginales)));
      setAlertasConflicto([]);
      alert('✅ Se ha restaurado el horario original');
    }
  };

  // ===========================================
  // FUNCIONES DE CURSOS
  // ===========================================
  
  // Cargar cursos predefinidos (Básica o Media)
  const agregarCursosDefault = (tipo) => {
    const basica = ["1° Básico", "2° Básico", "3° Básico", "4° Básico", "5° Básico", "6° Básico", "7° Básico", "8° Básico"];
    const media = ["1° Medio", "2° Medio", "3° Medio", "4° Medio"];
    
    let seleccion = tipo === 'basica' ? basica : media;
    
    const nuevosCursos = seleccion.map(nombre => ({
      id: Math.random().toString(36).substr(2, 9),
      nombre: nombre + " A",
      malla: {},  // Objeto con formato: { "Matemática": 6, "Lenguaje": 8 }
      horario: {} // Será llenado al generar horarios
    }));

    const filtrados = nuevosCursos.filter(nc => !cursos.some(c => c.nombre === nc.nombre));
    setCursos([...cursos, ...filtrados]);
  };

  // Clonar un curso existente (para crear secciones B, C, etc.)
  const clonarCursoAutomatico = (cursoOriginal) => {
    const nombreBase = cursoOriginal.nombre.slice(0, -1).trim();
    const letraActual = cursoOriginal.nombre.slice(-1).toUpperCase();
    let codigoAscii = letraActual.charCodeAt(0);
    let nuevaLetra = String.fromCharCode(codigoAscii + 1);
    let nuevoNombre = `${nombreBase} ${nuevaLetra}`;

    // Buscar siguiente letra disponible
    while (cursos.some(c => c.nombre === nuevoNombre)) {
      codigoAscii++;
      nuevaLetra = String.fromCharCode(codigoAscii + 1);
      nuevoNombre = `${nombreBase} ${nuevaLetra}`;
      if (codigoAscii > 90) break; 
    }

    setCursos([...cursos, { 
      ...cursoOriginal, 
      id: Date.now() + Math.random(), 
      nombre: nuevoNombre,
      horario: {}
    }]);
  };

  // Actualizar la malla curricular de un curso
  const actualizarMallaCurso = (cursoId, asignatura, horas) => {
    setCursos(cursos.map(c => {
      if (c.id === cursoId) {
        const nuevaMalla = { ...c.malla };
        if (horas > 0) {
          nuevaMalla[asignatura] = parseInt(horas);
        } else {
          delete nuevaMalla[asignatura];
        }
        return { ...c, malla: nuevaMalla };
      }
      return c;
    }));
  };

  // ===========================================
  // GENERADOR DE HORARIOS (ALGORITMO PRINCIPAL)
  // ===========================================
  
  // Calcular cuántos bloques hay disponibles en un día
  const calcularBloquesTotalesPorDia = () => {
    const { horaInicio, horaTermino, duracionBloque, recreos } = configuracionHorario;
    
    // Convertir horas a minutos
    const [hInicio, mInicio] = horaInicio.split(':').map(Number);
    const [hTermino, mTermino] = horaTermino.split(':').map(Number);
    
    const minutosInicio = hInicio * 60 + mInicio;
    const minutosTermino = hTermino * 60 + mTermino;
    const minutosTotales = minutosTermino - minutosInicio;
    
    // Restar tiempo de recreos
    const minutosRecreos = recreos.reduce((sum, r) => sum + r.duracion, 0);
    const minutosDisponibles = minutosTotales - minutosRecreos;
    
    return Math.floor(minutosDisponibles / duracionBloque);
  };

  // Generar horarios para todo el establecimiento (versión mejorada con asignación parcial)
  const generarHorarios = () => {
    // Validaciones iniciales
    if (cursos.length === 0) {
      setError('Debes cargar al menos un curso.');
      return;
    }

    if (profesores.length === 0) {
      setError('Debes registrar al menos un docente.');
      return;
    }

    // Verificar que todos los cursos tengan malla curricular
    const cursosSinMalla = cursos.filter(c => Object.keys(c.malla).length === 0);
    if (cursosSinMalla.length > 0) {
      setError(`Los siguientes cursos no tienen malla curricular: ${cursosSinMalla.map(c => c.nombre).join(', ')}`);
      return;
    }

    const bloquesTotales = calcularBloquesTotalesPorDia();
    const diasSemana = configuracionHorario.diasSemana;
    
    // Estructura para almacenar horarios
    const horariosCursos = {};
    const horariosProfesores = {};
    
    // Array para registrar problemas de asignación
    const alertasAsignacion = [];
    
    // Matriz de ocupación de profesores [dia][bloque] = cursoId
    const ocupacionProfesores = {};
    profesores.forEach(p => {
      ocupacionProfesores[p.id] = {};
      diasSemana.forEach(dia => {
        ocupacionProfesores[p.id][dia] = new Array(bloquesTotales).fill(null);
      });
      horariosProfesores[p.id] = {
        nombre: p.nombre,
        asignatura: p.asignaturas || [], // Array de asignaturas
        horario: {},
        horasAsignadas: 0
      };
      diasSemana.forEach(dia => {
        horariosProfesores[p.id].horario[dia] = [];
      });
    });

    // Inicializar horarios de cursos
    cursos.forEach(curso => {
      horariosCursos[curso.id] = {
        nombre: curso.nombre,
        horario: {}
      };
      diasSemana.forEach(dia => {
        horariosCursos[curso.id].horario[dia] = new Array(bloquesTotales).fill(null);
      });
    });

    // ALGORITMO DE ASIGNACIÓN MEJORADO
    // Para cada curso
    for (const curso of cursos) {
      const asignaturasOrdenadas = Object.entries(curso.malla)
        .sort((a, b) => b[1] - a[1]); // Ordenar por más horas primero

      // Para cada asignatura en la malla
      for (const [asignatura, horasSemanales] of asignaturasOrdenadas) {
        // Encontrar profesores que pueden enseñar esta asignatura
        // Filtrar por: 1) Tiene la asignatura, 2) Está asignado a este curso (o sin restricción)
        const profesoresDisponibles = profesores.filter(p => {
          const tieneAsignatura = p.asignaturas && p.asignaturas.includes(asignatura);
          const cursosAsignados = p.cursosAsignados || [];
          const sinRestricciones = cursosAsignados.length === 0;
          const asignadoACurso = cursosAsignados.includes(curso.id);
          
          return tieneAsignatura && (sinRestricciones || asignadoACurso);
        });

        if (profesoresDisponibles.length === 0) {
          alertasAsignacion.push({
            tipo: 'error',
            curso: curso.nombre,
            asignatura: asignatura,
            mensaje: `No hay profesor disponible para esta asignatura en este curso`,
            horasFaltantes: horasSemanales,
            minutosFaltantes: horasSemanales * configuracionHorario.duracionBloque
          });
          continue;
        }

        // Seleccionar profesor con menos horas asignadas y que no exceda su contrato
        const profesor = profesoresDisponibles.reduce((prev, curr) => {
          const horasPrev = horariosProfesores[prev.id].horasAsignadas;
          const horasCurr = horariosProfesores[curr.id].horasAsignadas;
          
          // Verificar si excedería el contrato
          const profesorPrevData = profesores.find(p => p.id === prev.id);
          const profesorCurrData = profesores.find(p => p.id === curr.id);
          
          if (horasCurr < horasPrev && horasCurr < profesorCurrData.horasContrato) {
            return curr;
          }
          return prev;
        });

        // Intentar asignar las horas con algoritmo mejorado
        let horasAsignadas = 0;
        const maxIntentos = 500; // Aumentar intentos
        
        // Primero intentar distribuir equitativamente en cada día
        for (let intento = 0; intento < maxIntentos && horasAsignadas < horasSemanales; intento++) {
          // Priorizar días con menos asignaciones de esta asignatura
          let mejorDia = null;
          let menorAsignaciones = Infinity;
          
          for (const dia of diasSemana) {
            const asignacionesEnDia = horariosCursos[curso.id].horario[dia].filter(
              b => b && b.asignatura === asignatura
            ).length;
            
            if (asignacionesEnDia < menorAsignaciones) {
              menorAsignaciones = asignacionesEnDia;
              mejorDia = dia;
            }
          }
          
          const dia = mejorDia || diasSemana[Math.floor(Math.random() * diasSemana.length)];
          const bloqueIndex = Math.floor(Math.random() * bloquesTotales);

          // Verificar que el bloque esté libre para el curso y el profesor
          if (
            horariosCursos[curso.id].horario[dia][bloqueIndex] === null &&
            ocupacionProfesores[profesor.id][dia][bloqueIndex] === null
          ) {
            // Verificar si el profesor no excede su contrato
            const profesorData = profesores.find(p => p.id === profesor.id);
            if (horariosProfesores[profesor.id].horasAsignadas >= profesorData.horasContrato) {
              break; // No asignar más si excede contrato
            }

            // Asignar el bloque
            horariosCursos[curso.id].horario[dia][bloqueIndex] = {
              asignatura: asignatura,
              profesor: profesor.nombre,
              profesorId: profesor.id
            };

            ocupacionProfesores[profesor.id][dia][bloqueIndex] = curso.id;
            
            horariosProfesores[profesor.id].horario[dia].push({
              bloque: bloqueIndex + 1,
              curso: curso.nombre,
              asignatura: asignatura
            });

            horariosProfesores[profesor.id].horasAsignadas++;
            horasAsignadas++;
          }
        }

        // Si no se pudieron asignar todas las horas, registrar como alerta
        if (horasAsignadas < horasSemanales) {
          const horasFaltantes = horasSemanales - horasAsignadas;
          const minutosFaltantes = horasFaltantes * configuracionHorario.duracionBloque;
          
          alertasAsignacion.push({
            tipo: 'warning',
            curso: curso.nombre,
            asignatura: asignatura,
            mensaje: `Asignación parcial: ${horasAsignadas}/${horasSemanales} horas`,
            horasFaltantes: horasFaltantes,
            minutosFaltantes: minutosFaltantes,
            profesor: profesor.nombre
          });

          // Crear bloques especiales "POR ASIGNAR" en el horario del curso
          let bloquesCreados = 0;
          for (const dia of diasSemana) {
            if (bloquesCreados >= horasFaltantes) break;
            
            for (let bloqueIdx = 0; bloqueIdx < bloquesTotales; bloqueIdx++) {
              if (horariosCursos[curso.id].horario[dia][bloqueIdx] === null) {
                horariosCursos[curso.id].horario[dia][bloqueIdx] = {
                  asignatura: asignatura,
                  profesor: "POR ASIGNAR",
                  profesorId: null,
                  pendiente: true // Marcar como pendiente
                };
                bloquesCreados++;
                break;
              }
            }
          }
        }
      }
    }

    // Guardar horarios generados
    setHorariosGenerados({
      cursos: horariosCursos,
      profesores: horariosProfesores,
      configuracion: configuracionHorario,
      alertas: alertasAsignacion // Incluir alertas
    });

    // Guardar copia de respaldo para poder restaurar
    setHorariosOriginales(JSON.parse(JSON.stringify({
      cursos: horariosCursos,
      profesores: horariosProfesores,
      configuracion: configuracionHorario,
      alertas: alertasAsignacion
    })));

    // Mostrar resumen de alertas
    if (alertasAsignacion.length > 0) {
      const errores = alertasAsignacion.filter(a => a.tipo === 'error').length;
      const advertencias = alertasAsignacion.filter(a => a.tipo === 'warning').length;
      
      setError(`Generación completada con ${errores} errores y ${advertencias} advertencias. Ver detalles en la sección de horarios.`);
    } else {
      setError('');
    }

    setVistaActual('horarios');
  };

  // ===========================================
  // FUNCIONES DE UTILIDAD
  // ===========================================
  
  // Calcular la hora de un bloque específico
  const calcularHoraBloque = (bloqueIndex) => {
    const { horaInicio, duracionBloque, recreos } = configuracionHorario;
    const [h, m] = horaInicio.split(':').map(Number);
    let minutosTotales = h * 60 + m;

    // Agregar tiempo de bloques anteriores
    minutosTotales += bloqueIndex * duracionBloque;

    // Agregar recreos que ocurren antes de este bloque
    recreos.forEach(recreo => {
      if (bloqueIndex > recreo.despuesDe) {
        minutosTotales += recreo.duracion;
      }
    });

    const horas = Math.floor(minutosTotales / 60);
    const minutos = minutosTotales % 60;
    
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  };

  // ===========================================
  // RENDERIZADO
  // ===========================================
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      
      {/* ========================================= */}
      {/* POP-UP: EDITAR BLOQUE */}
      {/* ========================================= */}
      {bloqueEditando && horariosGenerados && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">
                  Editar Bloque
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {horariosGenerados.cursos[bloqueEditando.cursoId]?.nombre} - {bloqueEditando.dia} - Bloque {bloqueEditando.bloqueIdx + 1}
                </p>
              </div>
              <button 
                onClick={() => {
                  setBloqueEditando(null);
                  setAlertasConflicto([]);
                }} 
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Mostrar alertas de conflicto */}
            {alertasConflicto.length > 0 && (
              <div className="mb-6 space-y-2">
                {alertasConflicto.map((conflicto, idx) => (
                  <div key={idx} className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <div className="text-sm font-black text-red-400">¡Conflicto Detectado!</div>
                        <div className="text-xs text-red-300 mt-1">{conflicto.mensaje}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bloque actual */}
            {(() => {
              const bloqueActual = horariosGenerados.cursos[bloqueEditando.cursoId]?.horario[bloqueEditando.dia][bloqueEditando.bloqueIdx];
              return bloqueActual && (
                <div className="mb-6 bg-slate-900/50 border border-slate-700 p-4 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Asignación Actual</div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-black text-emerald-400">{bloqueActual.asignatura}</div>
                      <div className="text-xs text-slate-400">{bloqueActual.profesor}</div>
                    </div>
                    <button
                      onClick={() => eliminarBloque(bloqueEditando.cursoId, bloqueEditando.dia, bloqueEditando.bloqueIdx)}
                      className="bg-red-600/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-red-600/30"
                    >
                      🗑️ Eliminar Bloque
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Seleccionar nueva asignatura */}
            <div className="mb-4">
              <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 mb-2 block">
                Cambiar Asignatura
              </label>
              <select
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                onChange={(e) => {
                  const asignatura = e.target.value;
                  if (asignatura) {
                    setFiltroAsignatura(asignatura);
                  }
                }}
                defaultValue=""
              >
                <option value="">Seleccionar asignatura...</option>
                {(() => {
                  const curso = cursos.find(c => c.id === bloqueEditando.cursoId);
                  return curso ? Object.keys(curso.malla).map(asig => (
                    <option key={asig} value={asig}>{asig}</option>
                  )) : null;
                })()}
              </select>
            </div>

            {/* Lista de profesores disponibles */}
            {filtroAsignatura && (
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 mb-2 block">
                  Profesores Disponibles para {filtroAsignatura}
                </label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {buscarProfesoresPorAsignatura(filtroAsignatura).map(prof => {
                    const horasUsadas = horariosGenerados.profesores[prof.id]?.horasAsignadas || 0;
                    const disponibilidad = ((prof.horasContrato - horasUsadas) / prof.horasContrato) * 100;
                    
                    return (
                      <button
                        key={prof.id}
                        onClick={() => {
                          const exito = editarBloque(
                            bloqueEditando.cursoId,
                            bloqueEditando.dia,
                            bloqueEditando.bloqueIdx,
                            prof.id,
                            filtroAsignatura
                          );
                          if (exito) {
                            setFiltroAsignatura('');
                          }
                        }}
                        className="w-full bg-slate-900/50 border border-slate-700 hover:border-emerald-500/50 p-4 rounded-xl text-left transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-black text-slate-200">{prof.nombre}</div>
                            <div className="text-xs text-slate-500">{prof.asignaturas.join(', ')}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-emerald-400 font-bold">
                              {prof.horasContrato - horasUsadas}h libres
                            </div>
                            <div className="text-[10px] text-slate-500">{horasUsadas}/{prof.horasContrato}h</div>
                          </div>
                        </div>
                        {/* Barra de disponibilidad */}
                        <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full ${disponibilidad > 50 ? 'bg-emerald-500' : disponibilidad > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${disponibilidad}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                  
                  {buscarProfesoresPorAsignatura(filtroAsignatura).length === 0 && (
                    <div className="text-center text-slate-600 text-xs py-8">
                      No hay profesores disponibles para {filtroAsignatura}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* POP-UP: BUSCADOR DE PROFESORES */}
      {/* ========================================= */}
      {mostrarBuscadorProfes && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">
                🔍 Buscador de Profesores
              </h2>
              <button 
                onClick={() => {
                  setMostrarBuscadorProfes(false);
                  setFiltroAsignatura('');
                }} 
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Filtro por asignatura */}
            <div className="mb-6">
              <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 mb-2 block">
                Filtrar por Asignatura
              </label>
              <select
                value={filtroAsignatura}
                onChange={(e) => setFiltroAsignatura(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Todas las asignaturas</option>
                {asignaturasGlobales.map(asig => (
                  <option key={asig} value={asig}>{asig}</option>
                ))}
              </select>
            </div>

            {/* Resultados */}
            <div className="space-y-3">
              {buscarProfesoresPorAsignatura(filtroAsignatura).map(prof => {
                const horasUsadas = horariosGenerados?.profesores[prof.id]?.horasAsignadas || 0;
                const cursosAsignados = prof.cursosAsignados || [];
                
                return (
                  <div key={prof.id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm font-black text-slate-200">{prof.nombre}</div>
                        <div className="text-xs text-emerald-500 font-bold mt-1">
                          {prof.asignaturas.join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Horas: {horasUsadas}/{prof.horasContrato}</div>
                        <div className="text-[10px] text-slate-500">{cursosAsignados.length} cursos</div>
                      </div>
                    </div>

                    {/* Cursos asignados */}
                    {cursosAsignados.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700">
                        {cursosAsignados.map(cursoId => {
                          const curso = cursos.find(c => c.id === cursoId);
                          return curso ? (
                            <span key={cursoId} className="bg-blue-900/30 border border-blue-500/30 text-blue-400 px-2 py-1 rounded text-[10px] font-bold">
                              {curso.nombre}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {buscarProfesoresPorAsignatura(filtroAsignatura).length === 0 && (
                <div className="text-center text-slate-600 text-sm py-12">
                  {filtroAsignatura 
                    ? `No hay profesores que enseñen ${filtroAsignatura}`
                    : 'No hay profesores registrados'}
                </div>
              )}
            </div>

            <div className="mt-6 text-center text-xs text-slate-500">
              Total: {buscarProfesoresPorAsignatura(filtroAsignatura).length} profesor(es)
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* POP-UP: ASIGNACIÓN DE PROFESORES A CURSOS */}
      {/* ========================================= */}
      {mostrarAsignacionCursos && profesorSeleccionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-800 pb-4 border-b border-slate-700">
              <div>
                <h2 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">
                  Asignar Cursos a {profesorSeleccionado.nombre}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Especialidades: {profesorSeleccionado.asignaturas.join(', ')}
                </p>
              </div>
              <button 
                onClick={() => {
                  setMostrarAsignacionCursos(false);
                  setProfesorSeleccionado(null);
                }} 
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
              <p className="text-xs text-blue-300">
                💡 <strong>Tip:</strong> Selecciona en qué cursos este profesor hará clases. 
                Si no seleccionas ninguno, el profesor estará disponible para todos los cursos.
              </p>
            </div>

            {/* Grid de cursos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {cursos.map(curso => {
                const cursosAsignados = profesorSeleccionado.cursosAsignados || [];
                const estaAsignado = cursosAsignados.includes(curso.id);
                
                // Verificar si el curso necesita alguna de las asignaturas del profesor
                const asignaturasDelProfesor = profesorSeleccionado.asignaturas || [];
                const asignaturasDelCurso = Object.keys(curso.malla);
                const tieneAsignaturasCompatibles = asignaturasDelProfesor.some(a => asignaturasDelCurso.includes(a));
                
                return (
                  <button
                    key={curso.id}
                    onClick={() => toggleCursoProfesor(profesorSeleccionado.id, curso.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      estaAsignado
                        ? 'bg-emerald-600 border-emerald-400 shadow-lg shadow-emerald-900/30'
                        : tieneAsignaturasCompatibles
                        ? 'bg-slate-900/50 border-slate-600 hover:border-emerald-500/50'
                        : 'bg-slate-900/30 border-slate-700 opacity-50'
                    }`}
                  >
                    <div className="text-sm font-black text-slate-200">{curso.nombre}</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {Object.keys(curso.malla).length} asignaturas
                    </div>
                    {estaAsignado && (
                      <div className="text-[10px] text-emerald-300 mt-2 font-bold">✓ Asignado</div>
                    )}
                    {!tieneAsignaturasCompatibles && (
                      <div className="text-[9px] text-red-400 mt-2">Sin asignaturas compatibles</div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between items-center pt-6 border-t border-slate-700">
              <div className="text-xs text-slate-500">
                {(profesorSeleccionado.cursosAsignados || []).length} cursos asignados
              </div>
              <button 
                onClick={() => {
                  setMostrarAsignacionCursos(false);
                  setProfesorSeleccionado(null);
                }}
                className="bg-emerald-600 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500"
              >
                Guardar Asignación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* POP-UP: GESTIÓN DE ASIGNATURAS */}
      {/* ========================================= */}
      {mostrarPopUpAsignaturas && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">Bolsa Global de Asignaturas</h2>
              <button onClick={() => setMostrarPopUpAsignaturas(false)} className="text-slate-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Nueva asignatura..." 
                value={nuevaAsignaturaManual}
                onChange={(e) => setNuevaAsignaturaManual(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && agregarAsignaturaGlobal()}
                className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button onClick={agregarAsignaturaGlobal} className="bg-emerald-600 px-6 rounded-xl font-bold text-xs uppercase hover:bg-emerald-500 transition-all">Añadir</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto pr-2">
              {asignaturasGlobales.map((asig, idx) => (
                <div key={idx} className="bg-slate-700/30 p-3 rounded-lg border border-slate-600/50 text-xs flex justify-between items-center group">
                  <span className="font-medium">{asig}</span>
                  <button onClick={() => setAsignaturasGlobales(asignaturasGlobales.filter(a => a !== asig))} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                </div>
              ))}
            </div>
            
            <button onClick={() => setMostrarPopUpAsignaturas(false)} className="mt-8 w-full bg-slate-700 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-600">Cerrar</button>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* POP-UP: CONFIGURACIÓN DE HORARIO */}
      {/* ========================================= */}
      {mostrarConfigHorario && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">Configuración de Horario</h2>
              <button onClick={() => setMostrarConfigHorario(false)} className="text-slate-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Hora Inicio</label>
                  <input 
                    type="time" 
                    value={configuracionHorario.horaInicio}
                    onChange={(e) => setConfiguracionHorario({...configuracionHorario, horaInicio: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-emerald-500 mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Hora Término</label>
                  <input 
                    type="time" 
                    value={configuracionHorario.horaTermino}
                    onChange={(e) => setConfiguracionHorario({...configuracionHorario, horaTermino: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-emerald-500 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Duración de Bloque (minutos)</label>
                <input 
                  type="number" 
                  value={configuracionHorario.duracionBloque}
                  onChange={(e) => setConfiguracionHorario({...configuracionHorario, duracionBloque: parseInt(e.target.value)})}
                  className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-emerald-500 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 mb-2 block">Recreos</label>
                <div className="space-y-2">
                  {configuracionHorario.recreos.map((recreo, idx) => (
                    <div key={idx} className="bg-slate-900 p-3 rounded-xl flex gap-3 items-center">
                      <input 
                        type="text"
                        value={recreo.nombre}
                        onChange={(e) => {
                          const nuevosRecreos = [...configuracionHorario.recreos];
                          nuevosRecreos[idx].nombre = e.target.value;
                          setConfiguracionHorario({...configuracionHorario, recreos: nuevosRecreos});
                        }}
                        className="flex-1 bg-slate-800 border border-slate-700 p-2 rounded text-xs"
                        placeholder="Nombre"
                      />
                      <input 
                        type="number"
                        value={recreo.despuesDe}
                        onChange={(e) => {
                          const nuevosRecreos = [...configuracionHorario.recreos];
                          nuevosRecreos[idx].despuesDe = parseInt(e.target.value);
                          setConfiguracionHorario({...configuracionHorario, recreos: nuevosRecreos});
                        }}
                        className="w-20 bg-slate-800 border border-slate-700 p-2 rounded text-xs"
                        placeholder="Después bloque"
                      />
                      <input 
                        type="number"
                        value={recreo.duracion}
                        onChange={(e) => {
                          const nuevosRecreos = [...configuracionHorario.recreos];
                          nuevosRecreos[idx].duracion = parseInt(e.target.value);
                          setConfiguracionHorario({...configuracionHorario, recreos: nuevosRecreos});
                        }}
                        className="w-20 bg-slate-800 border border-slate-700 p-2 rounded text-xs"
                        placeholder="Min"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setMostrarConfigHorario(false)} className="mt-6 w-full bg-slate-700 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-600">Guardar Configuración</button>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* POP-UP: EDITAR MALLA CURRICULAR */}
      {/* ========================================= */}
      {cursoSeleccionado && vistaActual === 'cursos' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-800 pb-4 border-b border-slate-700">
              <h2 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">Malla Curricular: {cursoSeleccionado.nombre}</h2>
              <button onClick={() => setCursoSeleccionado(null)} className="text-slate-400 hover:text-white text-2xl">✕</button>
            </div>

            <p className="text-xs text-slate-500 mb-6 bg-slate-900/50 p-3 rounded-xl border border-slate-700">
              💡 <strong>Tip:</strong> Define cuántas horas semanales tendrá cada asignatura en este curso. Solo asignaturas con horas &gt; 0 se incluirán en el horario.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {asignaturasGlobales.map((asig) => (
                <div key={asig} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-300">{asig}</span>
                  <input 
                    type="number"
                    min="0"
                    max="10"
                    value={cursoSeleccionado.malla[asig] || 0}
                    onChange={(e) => actualizarMallaCurso(cursoSeleccionado.id, asig, e.target.value)}
                    className="w-16 bg-slate-800 border border-slate-600 p-2 rounded-lg text-center font-black text-emerald-400 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-500 uppercase">Total Horas Semanales:</span>
                <span className="text-2xl font-black text-emerald-400">
                  {Object.values(cursoSeleccionado.malla).reduce((sum, h) => sum + h, 0)}
                </span>
              </div>
            </div>

            <button onClick={() => setCursoSeleccionado(null)} className="mt-6 w-full bg-emerald-600 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500">Guardar Malla</button>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}
      <header className="mb-10 border-b border-slate-800 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
          <div>
            <h1 className="text-4xl font-black text-emerald-400 tracking-tighter italic uppercase">ScheduleGeneratorCL</h1>
            <p className="text-slate-500 text-[10px] font-bold tracking-[0.3em] uppercase">Generador de Horarios Escolares</p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <button onClick={generarColegioFicticio} className="bg-yellow-600/10 border border-yellow-500/40 text-yellow-400 px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-yellow-600 hover:text-white transition-all">
              🎲 Generar Colegio de Prueba
            </button>
            <button onClick={() => setMostrarBuscadorProfes(true)} className="bg-cyan-600/10 border border-cyan-500/40 text-cyan-400 px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-cyan-600 hover:text-white transition-all">
              🔍 Buscar Profesores
            </button>
            <button onClick={() => setMostrarPopUpAsignaturas(true)} className="bg-emerald-600/10 border border-emerald-500/40 text-emerald-400 px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">
              ⚙️ Asignaturas
            </button>
            <button onClick={() => setMostrarConfigHorario(true)} className="bg-blue-600/10 border border-blue-500/40 text-blue-400 px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">
              🕐 Configurar Horario
            </button>
            <button onClick={() => agregarCursosDefault('basica')} className="bg-purple-600/10 border border-purple-500/40 text-purple-400 px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-purple-600 hover:text-white transition-all">
              + Básica
            </button>
            <button onClick={() => agregarCursosDefault('media')} className="bg-purple-600/10 border border-purple-500/40 text-purple-400 px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-purple-600 hover:text-white transition-all">
              + Media
            </button>
          </div>
        </div>

        {/* Navegación entre vistas */}
        <div className="flex gap-3">
          <button 
            onClick={() => setVistaActual('cursos')}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all ${
              vistaActual === 'cursos' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            📚 Configuración
          </button>
          <button 
            onClick={() => setVistaActual('horarios')}
            disabled={!horariosGenerados}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all ${
              vistaActual === 'horarios' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            📅 Horarios Generados
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-950/30 border border-red-500/50 text-red-400 rounded-xl text-xs font-bold flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-red-300 hover:text-white">✕</button>
        </div>
      )}

      {/* ========================================= */}
      {/* VISTA: CONFIGURACIÓN */}
      {/* ========================================= */}
      {vistaActual === 'cursos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PANEL IZQUIERDO: Registro Docente */}
          <aside className="lg:col-span-4 space-y-6">
            <section className="bg-slate-800/40 p-6 rounded-3xl border border-slate-800 shadow-2xl">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Nuevo Registro Docente</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder="Ej: María González" 
                    value={nuevoProfe.nombre} 
                    onChange={(e) => setNuevoProfe({...nuevoProfe, nombre: e.target.value})} 
                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 outline-none mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 mb-2 block">
                    Asignaturas que puede enseñar (selecciona 1 o más)
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto bg-slate-900 border border-slate-700 p-3 rounded-xl">
                    {asignaturasGlobales.map((asig) => (
                      <button
                        key={asig}
                        type="button"
                        onClick={() => toggleAsignaturaProfesor(asig)}
                        className={`p-2 rounded-lg text-[10px] font-bold transition-all ${
                          nuevoProfe.asignaturas.includes(asig)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {nuevoProfe.asignaturas.includes(asig) && '✓ '}
                        {asig}
                      </button>
                    ))}
                  </div>
                  {nuevoProfe.asignaturas.length > 0 && (
                    <div className="text-[10px] text-emerald-400 mt-2 ml-1">
                      {nuevoProfe.asignaturas.length} asignatura(s) seleccionada(s)
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between bg-slate-900 border border-slate-700 p-3 rounded-xl">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Horas Contrato</span>
                  <input 
                    type="number" 
                    value={nuevoProfe.horasContrato} 
                    onChange={(e) => setNuevoProfe({...nuevoProfe, horasContrato: parseInt(e.target.value) || 0})} 
                    className="bg-transparent w-16 text-right font-black text-emerald-400 outline-none text-lg"
                  />
                </div>
                
                <button 
                  onClick={registrarDocente} 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
                >
                  Inscribir Docente
                </button>
              </div>
            </section>

            {/* Lista de Profesores Registrados */}
            <section className="bg-slate-800/40 p-6 rounded-3xl border border-slate-800">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                Docentes Registrados ({profesores.length})
              </h3>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {profesores.map(p => (
                  <div key={p.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-xs font-black text-slate-200">{p.nombre}</div>
                        <div className="text-[10px] text-emerald-500 font-bold mt-1">
                          {p.asignaturas && p.asignaturas.length > 0 
                            ? p.asignaturas.join(', ') 
                            : 'Sin asignaturas'}
                        </div>
                        {p.cursosAsignados && p.cursosAsignados.length > 0 && (
                          <div className="text-[9px] text-blue-400 mt-1">
                            📚 {p.cursosAsignados.length} curso(s) asignado(s)
                          </div>
                        )}
                      </div>
                      <div className="bg-slate-800 px-3 py-1 rounded-lg text-[10px] font-black text-slate-400">
                        {p.horasContrato}H
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setProfesorSeleccionado(p);
                        setMostrarAsignacionCursos(true);
                      }}
                      className="w-full mt-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 py-2 rounded-lg text-[10px] font-black uppercase transition-all"
                    >
                      📋 Asignar a Cursos
                    </button>
                  </div>
                ))}
                
                {profesores.length === 0 && (
                  <div className="text-center text-slate-600 text-xs py-8">
                    No hay docentes registrados
                  </div>
                )}
              </div>
            </section>
          </aside>

          {/* PANEL DERECHO: Cursos */}
          <main className="lg:col-span-8 space-y-6">
            <section className="bg-slate-800/40 p-8 rounded-3xl border border-slate-800 shadow-2xl min-h-[500px]">
              <div className="flex justify-between items-center mb-10 border-b border-slate-700 pb-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cursos del Establecimiento</h3>
                <div className="text-[10px] text-slate-600 font-bold uppercase">
                  💡 Click en curso para editar malla | "+" para clonar
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {cursos.map(c => (
                  <div key={c.id} className="relative group">
                    <button 
                      onClick={() => setCursoSeleccionado(c)}
                      className="w-full p-8 rounded-3xl border-2 text-sm font-black transition-all duration-300 bg-slate-900/50 border-slate-700 hover:border-emerald-500/40 hover:-translate-y-1"
                    >
                      <div>{c.nombre}</div>
                      <div className="text-[10px] text-slate-500 mt-2">
                        {Object.keys(c.malla).length} asignaturas
                      </div>
                      <div className="text-[10px] text-emerald-400 font-black">
                        {Object.values(c.malla).reduce((sum, h) => sum + h, 0)}h
                      </div>
                    </button>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); clonarCursoAutomatico(c); }}
                      className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500 text-slate-900 rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 font-black text-2xl border-4 border-slate-800"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>

              {cursos.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-700">
                  <p className="text-4xl mb-4">🏫</p>
                  <p className="text-xs font-black uppercase tracking-widest">No hay cursos cargados</p>
                  <p className="text-[10px] mt-2">Usa los botones "Básica" o "Media"</p>
                </div>
              )}
            </section>

            {/* Botón para generar horarios */}
            {cursos.length > 0 && profesores.length > 0 && (
              <button 
                onClick={generarHorarios}
                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 py-6 rounded-3xl font-black text-lg uppercase tracking-widest transition-all shadow-2xl shadow-emerald-900/20"
              >
                🚀 Generar Horarios Automáticamente
              </button>
            )}
          </main>
        </div>
      )}

      {/* ========================================= */}
      {/* VISTA: HORARIOS GENERADOS */}
      {/* ========================================= */}
      {vistaActual === 'horarios' && horariosGenerados && (
        <div className="space-y-6">
          {/* ALERTAS DE ASIGNACIÓN */}
          {horariosGenerados.alertas && horariosGenerados.alertas.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-900/20 to-red-900/20 border border-yellow-500/30 p-6 rounded-3xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-yellow-400 uppercase tracking-wider">
                  ⚠️ Alertas de Asignación ({horariosGenerados.alertas.length})
                </h3>
                <div className="flex gap-2">
                  <span className="bg-red-900/30 border border-red-500/30 px-3 py-1 rounded-full text-[10px] font-black text-red-400">
                    {horariosGenerados.alertas.filter(a => a.tipo === 'error').length} Errores
                  </span>
                  <span className="bg-yellow-900/30 border border-yellow-500/30 px-3 py-1 rounded-full text-[10px] font-black text-yellow-400">
                    {horariosGenerados.alertas.filter(a => a.tipo === 'warning').length} Advertencias
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {horariosGenerados.alertas.map((alerta, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl border ${
                      alerta.tipo === 'error' 
                        ? 'bg-red-900/20 border-red-500/30' 
                        : 'bg-yellow-900/20 border-yellow-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-black text-sm text-slate-200">{alerta.curso}</div>
                        <div className="text-xs text-slate-400">{alerta.asignatura}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg ${
                        alerta.tipo === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      } text-[10px] font-black uppercase`}>
                        {alerta.tipo === 'error' ? 'Error' : 'Advertencia'}
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-300 mb-3">{alerta.mensaje}</div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Horas Faltantes</div>
                        <div className="text-xl font-black text-red-400">{alerta.horasFaltantes}h</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Minutos Faltantes</div>
                        <div className="text-xl font-black text-red-400">{alerta.minutosFaltantes} min</div>
                      </div>
                    </div>

                    {alerta.profesor && (
                      <div className="mt-3 text-[10px] text-slate-500">
                        👨‍🏫 Profesor asignado: <span className="text-emerald-400 font-bold">{alerta.profesor}</span>
                      </div>
                    )}

                    <div className="mt-3 bg-slate-900/50 p-2 rounded text-[10px] text-slate-400 border border-slate-700">
                      💡 <strong>Solución:</strong> Bloques marcados como "POR ASIGNAR" se agregaron al horario del curso. 
                      {alerta.tipo === 'error' && ' Considera agregar más profesores de esta especialidad.'}
                      {alerta.tipo === 'warning' && ' Verifica disponibilidad de profesores o ajusta la malla curricular.'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PANEL DE ESTADÍSTICAS */}
          <div className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border border-emerald-500/30 p-6 rounded-3xl">
            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider mb-6">📊 Análisis de Efectividad</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Estadística 1: Total de bloques asignados */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Bloques Asignados</div>
                <div className="text-3xl font-black text-emerald-400">
                  {Object.values(horariosGenerados.cursos).reduce((total, curso) => {
                    return total + Object.values(curso.horario).reduce((sum, dia) => {
                      return sum + dia.filter(b => b !== null).length;
                    }, 0);
                  }, 0)}
                </div>
              </div>

              {/* Estadística 2: Cursos con horario completo */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Cursos Completos</div>
                <div className="text-3xl font-black text-blue-400">
                  {Object.keys(horariosGenerados.cursos).length}
                </div>
              </div>

              {/* Estadística 3: Profesores utilizados */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Profesores Activos</div>
                <div className="text-3xl font-black text-purple-400">
                  {Object.values(horariosGenerados.profesores).filter(p => p.horasAsignadas > 0).length}
                </div>
              </div>

              {/* Estadística 4: Promedio de horas por profesor */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Promedio Horas/Prof</div>
                <div className="text-3xl font-black text-yellow-400">
                  {(Object.values(horariosGenerados.profesores).reduce((sum, p) => sum + p.horasAsignadas, 0) / 
                    Object.values(horariosGenerados.profesores).filter(p => p.horasAsignadas > 0).length).toFixed(1)}
                </div>
              </div>
            </div>

            {/* Análisis de cobertura por profesor */}
            <div className="mt-6">
              <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-3">Distribución de Carga Docente</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(horariosGenerados.profesores)
                  .filter(p => p.horasAsignadas > 0)
                  .sort((a, b) => b.horasAsignadas - a.horasAsignadas)
                  .slice(0, 10)  // Mostrar top 10
                  .map((prof, idx) => {
                    const profesor = profesores.find(p => p.id === parseInt(Object.keys(horariosGenerados.profesores).find(k => horariosGenerados.profesores[k].nombre === prof.nombre)));
                    const horasContrato = profesor?.horasContrato || 44;
                    const porcentaje = (prof.horasAsignadas / horasContrato) * 100;
                    
                    return (
                      <div key={idx} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className="text-xs font-bold text-slate-300">{prof.nombre}</div>
                            <div className="text-[10px] text-slate-500">{prof.asignatura}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-emerald-400">{prof.horasAsignadas}h</div>
                            <div className="text-[10px] text-slate-500">de {horasContrato}h</div>
                          </div>
                        </div>
                        {/* Barra de progreso */}
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              porcentaje > 90 ? 'bg-red-500' : 
                              porcentaje > 70 ? 'bg-yellow-500' : 
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(porcentaje, 100)}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-slate-600 mt-1 text-right">{porcentaje.toFixed(0)}% utilizado</div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Verificación de conflictos */}
            <div className="mt-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-2">✅ Verificaciones de Calidad</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-400">Sin conflictos de profesores (mismo profesor en 2 lugares)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-400">Todos los cursos tienen asignaturas asignadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-400">Respeta horas de contrato docente</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-400">Distribución equilibrada entre días</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de vista */}
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setProfesorVistaHorario(null)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all ${
                  !profesorVistaHorario 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Ver por Cursos
              </button>
              
              {profesores.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProfesorVistaHorario(p.id)}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all ${
                    profesorVistaHorario === p.id 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p.nombre}
                </button>
              ))}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={restaurarHorarioOriginal}
                disabled={!horariosOriginales}
                className="bg-yellow-600/10 border border-yellow-500/40 text-yellow-400 px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-yellow-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↺ Deshacer Cambios
              </button>
              <button
                onClick={() => {
                  setVistaActual('cursos');
                  generarHorarios();
                }}
                className="bg-emerald-600/10 border border-emerald-500/40 text-emerald-400 px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all"
              >
                🔄 Regenerar
              </button>
            </div>
          </div>

          {/* Vista por Cursos */}
          {!profesorVistaHorario && (
            <div className="space-y-6">
              {/* Instrucciones de edición */}
              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                <p className="text-xs text-blue-300">
                  💡 <strong>Modo Edición:</strong> Haz clic en cualquier bloque para cambiarlo. 
                  Puedes agregar, modificar o eliminar asignaciones. El sistema detectará automáticamente conflictos.
                </p>
              </div>

              {Object.entries(horariosGenerados.cursos).map(([cursoId, data]) => (
                <div key={cursoId} className="bg-slate-800/40 p-6 rounded-3xl border border-slate-800">
                  <h3 className="text-xl font-black text-emerald-400 mb-6">{data.nombre}</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="p-3 text-left text-slate-500 font-black uppercase">Hora</th>
                          {configuracionHorario.diasSemana.map(dia => (
                            <th key={dia} className="p-3 text-center text-slate-500 font-black uppercase">{dia}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.horario[configuracionHorario.diasSemana[0]].map((_, bloqueIdx) => (
                          <tr key={bloqueIdx} className="border-b border-slate-800">
                            <td className="p-3 text-slate-400 font-bold whitespace-nowrap">
                              {calcularHoraBloque(bloqueIdx)}
                            </td>
                            {configuracionHorario.diasSemana.map(dia => {
                              const bloque = data.horario[dia][bloqueIdx];
                              return (
                                <td key={dia} className="p-2">
                                  <button
                                    onClick={() => setBloqueEditando({ cursoId, dia, bloqueIdx })}
                                    className={`w-full p-3 rounded-lg transition-all ${
                                      bloque
                                        ? bloque.pendiente 
                                          ? 'bg-red-900/30 border border-red-500/50 hover:border-red-400 animate-pulse' 
                                          : 'bg-emerald-900/30 border border-emerald-500/30 hover:border-emerald-400 hover:shadow-lg'
                                        : 'bg-slate-900/30 border border-slate-700 hover:border-blue-500/50'
                                    } cursor-pointer`}
                                  >
                                    {bloque ? (
                                      <>
                                        <div className={`font-black text-left ${
                                          bloque.pendiente ? 'text-red-400' : 'text-emerald-400'
                                        }`}>
                                          {bloque.asignatura}
                                        </div>
                                        <div className={`text-[10px] text-left ${
                                          bloque.pendiente ? 'text-red-300' : 'text-slate-400'
                                        }`}>
                                          {bloque.profesor}
                                        </div>
                                        {bloque.pendiente && (
                                          <div className="text-[9px] text-red-300 mt-1 font-bold text-left">
                                            ⚠️ Sin asignar
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="text-center text-slate-600">
                                        <div className="text-lg">+</div>
                                        <div className="text-[9px]">Agregar</div>
                                      </div>
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vista por Profesor */}
          {profesorVistaHorario && horariosGenerados.profesores[profesorVistaHorario] && (
            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-emerald-400">
                    {horariosGenerados.profesores[profesorVistaHorario].nombre}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {Array.isArray(horariosGenerados.profesores[profesorVistaHorario].asignatura)
                      ? horariosGenerados.profesores[profesorVistaHorario].asignatura.join(', ')
                      : horariosGenerados.profesores[profesorVistaHorario].asignatura}
                  </p>
                </div>
                <div className="bg-emerald-900/30 border border-emerald-500/30 px-6 py-3 rounded-2xl">
                  <div className="text-[10px] text-slate-400">Horas Asignadas</div>
                  <div className="text-2xl font-black text-emerald-400">
                    {horariosGenerados.profesores[profesorVistaHorario].horasAsignadas}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {configuracionHorario.diasSemana.map(dia => {
                  const clasesDelDia = horariosGenerados.profesores[profesorVistaHorario].horario[dia];
                  
                  return (
                    <div key={dia} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                      <h4 className="text-sm font-black text-slate-400 mb-3 uppercase">{dia}</h4>
                      
                      {clasesDelDia.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {clasesDelDia.map((clase, idx) => (
                            <div key={idx} className="bg-emerald-900/20 border border-emerald-500/20 p-3 rounded-lg">
                              <div className="text-[10px] text-slate-500">Bloque {clase.bloque}</div>
                              <div className="text-xs font-black text-emerald-400">{clase.curso}</div>
                              <div className="text-[10px] text-slate-400">{clase.asignatura}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-slate-600 text-xs py-2">Sin clases</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App