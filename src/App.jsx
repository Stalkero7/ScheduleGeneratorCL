import { useState } from 'react'

function App() {
  // ===========================================
  // ESTADOS PRINCIPALES - DATOS DEL SISTEMA
  // ===========================================
  
  // PROFESORES: Estructura completa con bloqueos de horario
  // { id, nombre, asignaturas: [], cursos: [], horasContrato, nivel: 'basica'|'media'|'ambos', 
  //   bloqueosHorario: [{dia, bloque}], horarioAsignado: {} }
  const [profesores, setProfesores] = useState([]);
  
  // ASIGNATURAS: Lista global de asignaturas disponibles
  const [asignaturas, setAsignaturas] = useState([
    "Lenguaje y Comunicación", "Matemática", "Historia, Geografía y Ciencias Sociales", 
    "Ciencias Naturales", "Inglés", "Artes Visuales", "Música", "Educación Física y Salud",
    "Tecnología", "Orientación", "Religión"
  ]);
  
  // CURSOS: Cada curso con su malla curricular y configuración
  // { id, nombre, nivel: 'basica'|'media', malla: {asignatura: horasSemanales}, 
  //   configuracionHorario: {}, horarioGenerado: {} }
  const [cursos, setCursos] = useState([]);
  
  // CONFIGURACIÓN GLOBAL DE HORARIO (puede ser sobreescrita por curso)
  const [configGlobal, setConfigGlobal] = useState({
    // Horario mañana
    horaInicioManana: "08:00",
    horaTerminoManana: "13:30",
    // Horario tarde (si aplica)
    tieneTarde: false,
    horaInicioTarde: "14:30",
    horaTerminoTarde: "17:00",
    // Bloques
    duracionBloque: 45, // minutos (hora pedagógica)
    // Recreos
    recreos: [
      { nombre: "Recreo 1", despuesBloque: 2, duracion: 15 },
      { nombre: "Recreo 2 (Colación)", despuesBloque: 4, duracion: 30 },
      { nombre: "Recreo 3", despuesBloque: 6, duracion: 15 }
    ],
    diasSemana: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
  });
  
  // HORARIOS GENERADOS (resultado final)
  const [horariosGenerados, setHorariosGenerados] = useState(null);
  const [alertasGeneracion, setAlertasGeneracion] = useState([]);
  
  // ===========================================
  // ESTADOS DE NAVEGACIÓN E INTERFAZ
  // ===========================================
  
  const [seccionActual, setSeccionActual] = useState('docentes'); // docentes | asignaturas | cursos | generador
  const [itemSeleccionado, setItemSeleccionado] = useState(null); // Para editar perfil
  const [mostrarModal, setMostrarModal] = useState(null); // nuevo-docente | nuevo-curso | editar-config | etc
  const [busqueda, setBusqueda] = useState('');
  
  // Formularios temporales
  const [formDocente, setFormDocente] = useState({
    nombre: '',
    asignaturas: [],
    cursos: [],
    horasContrato: 44,
    nivel: 'ambos',
    bloqueosHorario: []
  });
  
  const [formCurso, setFormCurso] = useState({
    nombre: '',
    nivel: 'basica',
    malla: {},
    configuracionCustom: false,
    configuracionHorario: null
  });
  
  // ===========================================
  // FUNCIONES - GESTIÓN DE PROFESORES
  // ===========================================
  
  const agregarProfesor = () => {
    if (!formDocente.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    
    setProfesores([...profesores, {
      ...formDocente,
      id: Date.now(),
      horarioAsignado: {}
    }]);
    
    setFormDocente({
      nombre: '',
      asignaturas: [],
      cursos: [],
      horasContrato: 44,
      nivel: 'ambos',
      bloqueosHorario: []
    });
    
    setMostrarModal(null);
  };
  
  const actualizarProfesor = (id, cambios) => {
    setProfesores(profesores.map(p => p.id === id ? { ...p, ...cambios } : p));
  };
  
  const eliminarProfesor = (id) => {
    if (confirm('¿Eliminar este profesor?')) {
      setProfesores(profesores.filter(p => p.id !== id));
      setItemSeleccionado(null);
    }
  };
  
  const toggleAsignaturaProfesor = (profId, asignatura) => {
    actualizarProfesor(profId, {
      asignaturas: profesores.find(p => p.id === profId).asignaturas.includes(asignatura)
        ? profesores.find(p => p.id === profId).asignaturas.filter(a => a !== asignatura)
        : [...profesores.find(p => p.id === profId).asignaturas, asignatura]
    });
  };
  
  const toggleBloqueoHorario = (profId, dia, bloque) => {
    const prof = profesores.find(p => p.id === profId);
    const bloqueExiste = prof.bloqueosHorario.some(b => b.dia === dia && b.bloque === bloque);
    
    actualizarProfesor(profId, {
      bloqueosHorario: bloqueExiste
        ? prof.bloqueosHorario.filter(b => !(b.dia === dia && b.bloque === bloque))
        : [...prof.bloqueosHorario, { dia, bloque }]
    });
  };
  
  // ===========================================
  // FUNCIONES - GESTIÓN DE ASIGNATURAS
  // ===========================================
  
  const agregarAsignatura = (nombre) => {
    if (nombre.trim() && !asignaturas.includes(nombre.trim())) {
      setAsignaturas([...asignaturas, nombre.trim()]);
    }
  };
  
  const eliminarAsignatura = (nombre) => {
    if (confirm(`¿Eliminar asignatura "${nombre}"?`)) {
      setAsignaturas(asignaturas.filter(a => a !== nombre));
    }
  };
  
  const editarAsignatura = (nombreViejo, nombreNuevo) => {
    setAsignaturas(asignaturas.map(a => a === nombreViejo ? nombreNuevo : a));
  };
  
  // ===========================================
  // FUNCIONES - GESTIÓN DE CURSOS
  // ===========================================
  
  const agregarCurso = () => {
    if (!formCurso.nombre.trim()) {
      alert('El nombre del curso es obligatorio');
      return;
    }
    
    setCursos([...cursos, {
      ...formCurso,
      id: Date.now(),
      horarioGenerado: {}
    }]);
    
    setFormCurso({
      nombre: '',
      nivel: 'basica',
      malla: {},
      configuracionCustom: false,
      configuracionHorario: null
    });
    
    setMostrarModal(null);
  };
  
  const cargarCursosRapido = (tipo) => {
    const niveles = tipo === 'basica' 
      ? Array.from({length: 8}, (_, i) => `${i + 1}° Básico`)
      : Array.from({length: 4}, (_, i) => `${i + 1}° Medio`);
    
    const nuevos = niveles.map(nivel => ({
      id: Date.now() + Math.random(),
      nombre: nivel + ' A',
      nivel: tipo,
      malla: generarMallaDefault(tipo),
      configuracionCustom: false,
      configuracionHorario: null,
      horarioGenerado: {}
    }));
    
    setCursos([...cursos, ...nuevos]);
  };
  
  const clonarCurso = (cursoId) => {
    const curso = cursos.find(c => c.id === cursoId);
    const nombreBase = curso.nombre.slice(0, -1).trim();
    let letra = curso.nombre.slice(-1).charCodeAt(0);
    let nuevoNombre = `${nombreBase} ${String.fromCharCode(letra + 1)}`;
    
    while (cursos.some(c => c.nombre === nuevoNombre)) {
      letra++;
      nuevoNombre = `${nombreBase} ${String.fromCharCode(letra + 1)}`;
    }
    
    setCursos([...cursos, {
      ...curso,
      id: Date.now(),
      nombre: nuevoNombre,
      horarioGenerado: {}
    }]);
  };
  
  const generarMallaDefault = (nivel) => {
    // Mallas según normativa chilena
    if (nivel === 'basica') {
      return {
        "Lenguaje y Comunicación": 8,
        "Matemática": 7,
        "Historia, Geografía y Ciencias Sociales": 4,
        "Ciencias Naturales": 4,
        "Inglés": 3,
        "Artes Visuales": 2,
        "Música": 2,
        "Educación Física y Salud": 2,
        "Tecnología": 1,
        "Orientación": 1
      };
    } else {
      return {
        "Lenguaje y Comunicación": 6,
        "Matemática": 7,
        "Historia, Geografía y Ciencias Sociales": 4,
        "Ciencias Naturales": 6,
        "Inglés": 4,
        "Artes Visuales": 2,
        "Música": 2,
        "Educación Física y Salud": 2,
        "Orientación": 1
      };
    }
  };
  
  const actualizarMallaCurso = (cursoId, asignatura, horas) => {
    setCursos(cursos.map(c => {
      if (c.id === cursoId) {
        const malla = { ...c.malla };
        if (horas > 0) {
          malla[asignatura] = parseInt(horas);
        } else {
          delete malla[asignatura];
        }
        return { ...c, malla };
      }
      return c;
    }));
  };
  
  const eliminarCurso = (cursoId) => {
    const curso = cursos.find(c => c.id === cursoId);
    if (confirm(`¿Estás seguro de eliminar el curso "${curso.nombre}"?`)) {
      if (confirm(`⚠️ CONFIRMACIÓN FINAL: Esta acción eliminará permanentemente "${curso.nombre}" y no se puede deshacer. ¿Continuar?`)) {
        setCursos(cursos.filter(c => c.id !== cursoId));
        setItemSeleccionado(null);
      }
    }
  };
  
  // ===========================================
  // ALGORITMO DE GENERACIÓN DE HORARIOS
  // ===========================================
  
  const generarHorarios = () => {
    // Validaciones
    if (cursos.length === 0) {
      alert('Debes crear al menos un curso');
      return;
    }
    
    if (profesores.length === 0) {
      alert('Debes registrar al menos un profesor');
      return;
    }
    
    const alertas = [];
    const horariosFinales = {};
    
    // Calcular bloques disponibles por día
    const bloquesTotalesDia = calcularBloquesTotales(configGlobal);
    const diasSemana = configGlobal.diasSemana;
    
    // Para cada curso
    cursos.forEach(curso => {
      const config = curso.configuracionCustom && curso.configuracionHorario 
        ? curso.configuracionHorario 
        : configGlobal;
      
      const bloquesCurso = curso.configuracionCustom 
        ? calcularBloquesTotales(config)
        : bloquesTotalesDia;
      
      // Inicializar horario del curso
      const horarioCurso = {};
      diasSemana.forEach(dia => {
        horarioCurso[dia] = Array(bloquesCurso).fill(null);
      });
      
      // Ordenar asignaturas por más horas primero
      const asignaturasOrdenadas = Object.entries(curso.malla)
        .sort((a, b) => b[1] - a[1]);
      
      // Asignar cada asignatura
      asignaturasOrdenadas.forEach(([asignatura, horasRequeridas]) => {
        // Buscar profesores compatibles
        const profesoresCompatibles = profesores.filter(prof => 
          prof.asignaturas.includes(asignatura) &&
          (prof.nivel === 'ambos' || prof.nivel === curso.nivel) &&
          (prof.cursos.length === 0 || prof.cursos.includes(curso.id))
        );
        
        if (profesoresCompatibles.length === 0) {
          alertas.push({
            tipo: 'error',
            mensaje: `No hay profesor para ${asignatura} en ${curso.nombre}`,
            curso: curso.nombre,
            asignatura
          });
          return;
        }
        
        // Seleccionar profesor con menos carga
        const profesor = profesoresCompatibles.reduce((prev, curr) => {
          const cargaPrev = calcularHorasAsignadas(prev.id, horariosFinales);
          const cargaCurr = calcularHorasAsignadas(curr.id, horariosFinales);
          return cargaCurr < cargaPrev ? curr : prev;
        });
        
        // Intentar asignar las horas
        let horasAsignadas = 0;
        const intentosMaximos = 1000;
        
        for (let intento = 0; intento < intentosMaximos && horasAsignadas < horasRequeridas; intento++) {
          const dia = diasSemana[Math.floor(Math.random() * diasSemana.length)];
          const bloque = Math.floor(Math.random() * bloquesCurso);
          
          // Verificar disponibilidad
          const bloqueDisponible = horarioCurso[dia][bloque] === null;
          const profesorDisponible = !profesorOcupado(profesor.id, dia, bloque, horariosFinales);
          const noBloqueado = !profesor.bloqueosHorario.some(b => b.dia === dia && b.bloque === bloque);
          const noExcedeContrato = calcularHorasAsignadas(profesor.id, horariosFinales) < profesor.horasContrato;
          
          if (bloqueDisponible && profesorDisponible && noBloqueado && noExcedeContrato) {
            horarioCurso[dia][bloque] = {
              asignatura,
              profesorId: profesor.id,
              profesorNombre: profesor.nombre
            };
            horasAsignadas++;
          }
        }
        
        // Si no se asignaron todas las horas
        if (horasAsignadas < horasRequeridas) {
          alertas.push({
            tipo: 'warning',
            mensaje: `Solo se asignaron ${horasAsignadas}/${horasRequeridas} horas de ${asignatura}`,
            curso: curso.nombre,
            asignatura,
            horasFaltantes: horasRequeridas - horasAsignadas
          });
        }
      });
      
      horariosFinales[curso.id] = horarioCurso;
    });
    
    // Generar horarios individuales de profesores
    const horariosProfesores = {};
    profesores.forEach(prof => {
      horariosProfesores[prof.id] = generarHorarioProfesor(prof.id, horariosFinales);
    });
    
    setHorariosGenerados({
      cursos: horariosFinales,
      profesores: horariosProfesores,
      configuracion: configGlobal
    });
    
    setAlertasGeneracion(alertas);
    setSeccionActual('generador');
  };
  
  // Funciones auxiliares del algoritmo
  const calcularBloquesTotales = (config) => {
    const minutosTotales = calcularMinutosDisponibles(config);
    const minutosRecreos = config.recreos.reduce((sum, r) => sum + r.duracion, 0);
    return Math.floor((minutosTotales - minutosRecreos) / config.duracionBloque);
  };
  
  const calcularMinutosDisponibles = (config) => {
    const [hIniM, mIniM] = config.horaInicioManana.split(':').map(Number);
    const [hFinM, mFinM] = config.horaTerminoManana.split(':').map(Number);
    let minutos = (hFinM * 60 + mFinM) - (hIniM * 60 + mIniM);
    
    if (config.tieneTarde) {
      const [hIniT, mIniT] = config.horaInicioTarde.split(':').map(Number);
      const [hFinT, mFinT] = config.horaTerminoTarde.split(':').map(Number);
      minutos += (hFinT * 60 + mFinT) - (hIniT * 60 + mIniT);
    }
    
    return minutos;
  };
  
  const calcularHorasAsignadas = (profesorId, horarios) => {
    let total = 0;
    Object.values(horarios).forEach(horarioCurso => {
      Object.values(horarioCurso).forEach(dia => {
        dia.forEach(bloque => {
          if (bloque && bloque.profesorId === profesorId) total++;
        });
      });
    });
    return total;
  };
  
  const profesorOcupado = (profesorId, dia, bloqueIdx, horarios) => {
    return Object.values(horarios).some(horarioCurso => 
      horarioCurso[dia]?.[bloqueIdx]?.profesorId === profesorId
    );
  };
  
  const generarHorarioProfesor = (profesorId, horariosFinales) => {
    const horario = {};
    configGlobal.diasSemana.forEach(dia => {
      horario[dia] = [];
    });
    
    Object.entries(horariosFinales).forEach(([cursoId, horarioCurso]) => {
      const curso = cursos.find(c => c.id == cursoId);
      Object.entries(horarioCurso).forEach(([dia, bloques]) => {
        bloques.forEach((bloque, idx) => {
          if (bloque && bloque.profesorId === profesorId) {
            horario[dia].push({
              bloque: idx + 1,
              curso: curso?.nombre || 'Curso',
              asignatura: bloque.asignatura
            });
          }
        });
      });
    });
    
    return horario;
  };
  
  // Calcular la hora de inicio y fin de un bloque específico
  const calcularHoraBloque = (bloqueIdx, config = configGlobal) => {
    const { horaInicioManana, duracionBloque, recreos } = config;
    const [h, m] = horaInicioManana.split(':').map(Number);
    let minutosAcumulados = h * 60 + m;
    
    // Agregar tiempo de bloques anteriores
    minutosAcumulados += bloqueIdx * duracionBloque;
    
    // Agregar recreos que ocurren antes de este bloque
    recreos.forEach(recreo => {
      if (bloqueIdx > recreo.despuesBloque) {
        minutosAcumulados += recreo.duracion;
      }
    });
    
    const horaInicio = Math.floor(minutosAcumulados / 60);
    const minInicio = minutosAcumulados % 60;
    
    const minutosFin = minutosAcumulados + duracionBloque;
    const horaFin = Math.floor(minutosFin / 60);
    const minFin = minutosFin % 60;
    
    return `${String(horaInicio).padStart(2, '0')}:${String(minInicio).padStart(2, '0')} - ${String(horaFin).padStart(2, '0')}:${String(minFin).padStart(2, '0')}`;
  };
  
  // ===========================================
  // FUNCIONES - EXPORTACIÓN
  // ===========================================
  
  const exportarHorarioCurso = async (cursoId) => {
    // Usar xlsx skill para exportar
    alert('Función de exportación Excel - Próximamente implementada');
  };
  
  const exportarHorarioProfesor = (profesorId) => {
    alert('Exportar horario profesor - Por implementar');
  };
  
  // ===========================================
  // RENDERIZADO
  // ===========================================
  
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* ============================================= */}
      {/* BARRA LATERAL DE NAVEGACIÓN */}
      {/* ============================================= */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">HorarioCL</h1>
          <p className="text-xs text-gray-500 mt-1">Generador de Horarios Escolares</p>
        </div>
        
        {/* Menú de navegación */}
        <nav className="flex-1 p-4">
          <button
            onClick={() => setSeccionActual('docentes')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              seccionActual === 'docentes'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            👨‍🏫 Docentes
          </button>
          
          <button
            onClick={() => setSeccionActual('asignaturas')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              seccionActual === 'asignaturas'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📚 Asignaturas
          </button>
          
          <button
            onClick={() => setSeccionActual('cursos')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              seccionActual === 'cursos'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🏫 Cursos
          </button>
          
          <button
            onClick={() => setSeccionActual('generador')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              seccionActual === 'generador'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ⚡ Generador de Horario
          </button>
          
          <div className="my-4 border-t border-gray-200"></div>
          
          <button
            onClick={() => setMostrarModal('config-horario')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ⚙️ Configurar Horario
          </button>
        </nav>
        
        {/* Footer info */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <div className="mb-1">📊 {profesores.length} profesores</div>
            <div className="mb-1">📚 {asignaturas.length} asignaturas</div>
            <div>🏫 {cursos.length} cursos</div>
          </div>
        </div>
      </aside>
      
      {/* ============================================= */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ============================================= */}
      <main className="flex-1 overflow-auto bg-gray-50">
        
        {/* SECCIÓN: DOCENTES */}
        {seccionActual === 'docentes' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Docentes</h2>
                <p className="text-sm text-gray-500 mt-1">Administra la planta docente del establecimiento</p>
              </div>
              <button
                onClick={() => setMostrarModal('nuevo-docente')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                + Nuevo Docente
              </button>
            </div>
            
            {/* Buscador */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="🔍 Buscar docente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            
            {/* Lista de docentes */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Asignaturas</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nivel</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Horas</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cursos</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {profesores
                    .filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
                    .map(prof => (
                      <tr key={prof.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{prof.nombre}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{prof.asignaturas.join(', ') || 'Sin asignaturas'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            prof.nivel === 'basica' ? 'bg-green-100 text-green-800' :
                            prof.nivel === 'media' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {prof.nivel === 'basica' ? 'Básica' : prof.nivel === 'media' ? 'Media' : 'Ambos'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{prof.horasContrato}h</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {prof.cursos.length === 0 ? 'Todos' : `${prof.cursos.length} cursos`}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setItemSeleccionado(prof)}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                          >
                            Ver Perfil
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              
              {profesores.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">👨‍🏫</div>
                  <div>No hay docentes registrados</div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* SECCIÓN: ASIGNATURAS */}
        {seccionActual === 'asignaturas' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Asignaturas</h2>
                <p className="text-sm text-gray-500 mt-1">Administra las asignaturas disponibles</p>
              </div>
              <button
                onClick={() => setMostrarModal('nueva-asignatura')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                + Nueva Asignatura
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {asignaturas.map((asig, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                  <span className="font-semibold text-gray-900">{asig}</span>
                  <button
                    onClick={() => eliminarAsignatura(asig)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* SECCIÓN: CURSOS */}
        {seccionActual === 'cursos' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Cursos</h2>
                <p className="text-sm text-gray-500 mt-1">Configura los cursos del establecimiento</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => cargarCursosRapido('basica')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  + Básica Completa
                </button>
                <button
                  onClick={() => cargarCursosRapido('media')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  + Media Completa
                </button>
                <button
                  onClick={() => setMostrarModal('nuevo-curso')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  + Curso Individual
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cursos.map(curso => (
                <div key={curso.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group">
                  {/* Botón eliminar */}
                  <button
                    onClick={() => eliminarCurso(curso.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Eliminar curso"
                  >
                    ✕
                  </button>
                  
                  <div className="mb-2">
                    <div className="font-bold text-gray-900">{curso.nombre}</div>
                    <div className="text-xs text-gray-500">{curso.nivel === 'basica' ? 'Básica' : 'Media'}</div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {Object.keys(curso.malla).length} asignaturas
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setItemSeleccionado(curso)}
                      className="flex-1 bg-blue-50 text-blue-600 px-3 py-1 rounded text-xs font-semibold hover:bg-blue-100"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => clonarCurso(curso.id)}
                      className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-200"
                    >
                      Clonar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* SECCIÓN: GENERADOR */}
        {seccionActual === 'generador' && (
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Generador de Horarios</h2>
              <p className="text-sm text-gray-500 mt-1">Genera horarios automáticamente para todos los cursos</p>
            </div>
            
            {!horariosGenerados ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="text-xl font-bold mb-2">Listo para generar</h3>
                <p className="text-gray-600 mb-6">
                  Se generarán horarios para {cursos.length} cursos con {profesores.length} profesores
                </p>
                <button
                  onClick={generarHorarios}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors"
                >
                  🚀 Generar Horarios
                </button>
              </div>
            ) : (
              <div>
                {/* Alertas */}
                {alertasGeneracion.length > 0 && (
                  <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-bold text-yellow-900 mb-2">⚠️ Alertas de Generación</h4>
                    <div className="space-y-1">
                      {alertasGeneracion.map((alerta, idx) => (
                        <div key={idx} className="text-sm text-yellow-800">• {alerta.mensaje}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Horarios generados */}
                <div className="space-y-6">
                  {cursos.map(curso => {
                    const horario = horariosGenerados.cursos[curso.id];
                    if (!horario) return null;
                    
                    return (
                      <div key={curso.id} className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold">{curso.nombre}</h3>
                          <button
                            onClick={() => exportarHorarioCurso(curso.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                          >
                            📥 Exportar Excel
                          </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-gray-300">
                                <th className="p-3 text-left font-bold text-gray-700 bg-gray-50">Bloque / Hora</th>
                                {configGlobal.diasSemana.map(dia => (
                                  <th key={dia} className="p-3 text-center font-bold text-gray-700 bg-gray-50">{dia}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {horario[configGlobal.diasSemana[0]].map((_, idx) => (
                                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                  <td className="p-3 font-semibold text-gray-700 bg-gray-50">
                                    <div className="text-sm">{idx + 1}</div>
                                    <div className="text-xs text-gray-500 font-normal">{calcularHoraBloque(idx)}</div>
                                  </td>
                                  {configGlobal.diasSemana.map(dia => {
                                    const bloque = horario[dia][idx];
                                    return (
                                      <td key={dia} className="p-2">
                                        {bloque ? (
                                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors">
                                            <div className="font-bold text-blue-900 text-xs mb-1">{bloque.asignatura}</div>
                                            <div className="text-blue-700 text-xs">{bloque.profesorNombre}</div>
                                          </div>
                                        ) : (
                                          <div className="text-gray-300 text-center py-3">—</div>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* MODAL: Configuración de Horario */}
        {mostrarModal === 'config-horario' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h3 className="text-xl font-bold mb-4">⚙️ Configuración de Horario del Colegio</h3>
              
              <div className="space-y-6">
                {/* Horario de Mañana */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold mb-3 text-gray-900">📅 Jornada de Mañana</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Hora de Inicio</label>
                      <input
                        type="time"
                        value={configGlobal.horaInicioManana}
                        onChange={(e) => setConfigGlobal({...configGlobal, horaInicioManana: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Hora de Término</label>
                      <input
                        type="time"
                        value={configGlobal.horaTerminoManana}
                        onChange={(e) => setConfigGlobal({...configGlobal, horaTerminoManana: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Horario de Tarde (Opcional) */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900">🌆 Jornada de Tarde (Opcional)</h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configGlobal.tieneTarde}
                        onChange={(e) => setConfigGlobal({...configGlobal, tieneTarde: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm font-semibold">Habilitar</span>
                    </label>
                  </div>
                  
                  {configGlobal.tieneTarde && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Hora de Inicio</label>
                        <input
                          type="time"
                          value={configGlobal.horaInicioTarde}
                          onChange={(e) => setConfigGlobal({...configGlobal, horaInicioTarde: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Hora de Término</label>
                        <input
                          type="time"
                          value={configGlobal.horaTerminoTarde}
                          onChange={(e) => setConfigGlobal({...configGlobal, horaTerminoTarde: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Duración de Bloques */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold mb-3 text-gray-900">⏱️ Duración de Bloque (Hora Pedagógica)</h4>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="30"
                      max="90"
                      step="5"
                      value={configGlobal.duracionBloque}
                      onChange={(e) => setConfigGlobal({...configGlobal, duracionBloque: parseInt(e.target.value)})}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold"
                    />
                    <span className="text-sm text-gray-600">minutos por bloque</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Recomendado: 45 minutos (estándar en Chile)</p>
                </div>
                
                {/* Recreos */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-900">☕ Recreos</h4>
                    <button
                      onClick={() => setConfigGlobal({
                        ...configGlobal,
                        recreos: [...configGlobal.recreos, { nombre: `Recreo ${configGlobal.recreos.length + 1}`, despuesBloque: configGlobal.recreos.length + 2, duracion: 15 }]
                      })}
                      className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                    >
                      + Agregar Recreo
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {configGlobal.recreos.map((recreo, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                        <input
                          type="text"
                          value={recreo.nombre}
                          onChange={(e) => {
                            const nuevosRecreos = [...configGlobal.recreos];
                            nuevosRecreos[idx].nombre = e.target.value;
                            setConfigGlobal({...configGlobal, recreos: nuevosRecreos});
                          }}
                          placeholder="Nombre del recreo"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Después del bloque:</span>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={recreo.despuesBloque}
                            onChange={(e) => {
                              const nuevosRecreos = [...configGlobal.recreos];
                              nuevosRecreos[idx].despuesBloque = parseInt(e.target.value);
                              setConfigGlobal({...configGlobal, recreos: nuevosRecreos});
                            }}
                            className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center text-sm"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="5"
                            max="60"
                            step="5"
                            value={recreo.duracion}
                            onChange={(e) => {
                              const nuevosRecreos = [...configGlobal.recreos];
                              nuevosRecreos[idx].duracion = parseInt(e.target.value);
                              setConfigGlobal({...configGlobal, recreos: nuevosRecreos});
                            }}
                            className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center text-sm"
                          />
                          <span className="text-xs text-gray-600">min</span>
                        </div>
                        
                        <button
                          onClick={() => {
                            setConfigGlobal({
                              ...configGlobal,
                              recreos: configGlobal.recreos.filter((_, i) => i !== idx)
                            });
                          }}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Vista previa de bloques */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2">📊 Vista Previa</h4>
                  <div className="text-sm text-blue-800">
                    <div className="mb-1">
                      <strong>Bloques totales por día:</strong> {calcularBloquesTotales(configGlobal)} bloques
                    </div>
                    <div className="mb-1">
                      <strong>Horas pedagógicas:</strong> {calcularBloquesTotales(configGlobal)} x {configGlobal.duracionBloque} min = {calcularBloquesTotales(configGlobal) * configGlobal.duracionBloque} minutos
                    </div>
                    <div>
                      <strong>Ejemplo primer bloque:</strong> {calcularHoraBloque(0)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setMostrarModal(null);
                    // Reiniciar horarios generados si hay cambios
                    if (horariosGenerados) {
                      if (confirm('Los cambios en la configuración requieren regenerar los horarios. ¿Deseas continuar?')) {
                        setHorariosGenerados(null);
                      }
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Guardar Configuración
                </button>
                <button
                  onClick={() => setMostrarModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* MODAL: Nuevo Docente */}
        {mostrarModal === 'nuevo-docente' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h3 className="text-xl font-bold mb-4">Nuevo Docente</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={formDocente.nombre}
                    onChange={(e) => setFormDocente({...formDocente, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej: María González"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1">Horas de Contrato (cronológicas)</label>
                  <input
                    type="number"
                    value={formDocente.horasContrato}
                    onChange={(e) => setFormDocente({...formDocente, horasContrato: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">44 horas cronológicas ≈ 38 horas pedagógicas de aula</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1">Nivel</label>
                  <select
                    value={formDocente.nivel}
                    onChange={(e) => setFormDocente({...formDocente, nivel: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="ambos">Básica y Media</option>
                    <option value="basica">Solo Básica</option>
                    <option value="media">Solo Media</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Asignaturas que puede enseñar</label>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                    {asignaturas.map(asig => (
                      <label key={asig} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formDocente.asignaturas.includes(asig)}
                          onChange={() => {
                            setFormDocente({
                              ...formDocente,
                              asignaturas: formDocente.asignaturas.includes(asig)
                                ? formDocente.asignaturas.filter(a => a !== asig)
                                : [...formDocente.asignaturas, asig]
                            });
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{asig}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={agregarProfesor}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Guardar Docente
                </button>
                <button
                  onClick={() => setMostrarModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* MODAL: Nueva Asignatura */}
        {mostrarModal === 'nueva-asignatura' && (() => {
          const [nombreAsig, setNombreAsig] = useState('');
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-xl font-bold mb-4">Nueva Asignatura</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1">Nombre de la Asignatura</label>
                  <input
                    type="text"
                    value={nombreAsig}
                    onChange={(e) => setNombreAsig(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej: Física"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      agregarAsignatura(nombreAsig);
                      setMostrarModal(null);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Agregar
                  </button>
                  <button
                    onClick={() => setMostrarModal(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
        
        {/* MODAL: Nuevo Curso */}
        {mostrarModal === 'nuevo-curso' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h3 className="text-xl font-bold mb-4">Nuevo Curso</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nombre del Curso</label>
                  <input
                    type="text"
                    value={formCurso.nombre}
                    onChange={(e) => setFormCurso({...formCurso, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej: 3° Básico A"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1">Nivel</label>
                  <select
                    value={formCurso.nivel}
                    onChange={(e) => setFormCurso({...formCurso, nivel: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="basica">Básica</option>
                    <option value="media">Media</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Malla Curricular (horas semanales)</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                    {asignaturas.map(asig => (
                      <div key={asig} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <span className="text-sm font-medium">{asig}</span>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={formCurso.malla[asig] || 0}
                          onChange={(e) => {
                            const horas = parseInt(e.target.value) || 0;
                            setFormCurso({
                              ...formCurso,
                              malla: horas > 0 
                                ? {...formCurso.malla, [asig]: horas}
                                : Object.fromEntries(Object.entries(formCurso.malla).filter(([k]) => k !== asig))
                            });
                          }}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const mallaDefault = generarMallaDefault(formCurso.nivel);
                      setFormCurso({...formCurso, malla: mallaDefault});
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Usar malla por defecto ({formCurso.nivel})
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={agregarCurso}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Crear Curso
                </button>
                <button
                  onClick={() => setMostrarModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* PERFIL: Docente */}
        {itemSeleccionado && seccionActual === 'docentes' && profesores.find(p => p.id === itemSeleccionado.id) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full my-8 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold">{itemSeleccionado.nombre}</h3>
                  <p className="text-gray-500">Perfil Docente</p>
                </div>
                <button
                  onClick={() => setItemSeleccionado(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-semibold text-gray-600 mb-1">Horas de Contrato</div>
                  <div className="text-2xl font-bold">{itemSeleccionado.horasContrato}h</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-semibold text-gray-600 mb-1">Nivel</div>
                  <div className="text-2xl font-bold capitalize">{itemSeleccionado.nivel}</div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-bold mb-3">Asignaturas</h4>
                <div className="flex flex-wrap gap-2">
                  {itemSeleccionado.asignaturas.map(asig => (
                    <span key={asig} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {asig}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-bold mb-3">Bloqueos de Horario</h4>
                <p className="text-sm text-gray-600 mb-3">Marca los bloques en que el docente NO puede hacer clases</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-2 border border-gray-200">Bloque</th>
                        {configGlobal.diasSemana.map(dia => (
                          <th key={dia} className="p-2 border border-gray-200">{dia}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({length: 8}).map((_, idx) => (
                        <tr key={idx}>
                          <td className="p-2 border border-gray-200 font-semibold bg-gray-50 text-center">{idx + 1}</td>
                          {configGlobal.diasSemana.map(dia => {
                            const bloqueado = itemSeleccionado.bloqueosHorario.some(b => b.dia === dia && b.bloque === idx);
                            return (
                              <td key={dia} className="p-0 border border-gray-200">
                                <button
                                  onClick={() => toggleBloqueoHorario(itemSeleccionado.id, dia, idx)}
                                  className={`w-full h-12 transition-colors ${
                                    bloqueado 
                                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                                      : 'hover:bg-gray-100'
                                  }`}
                                >
                                  {bloqueado ? '✕' : ''}
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
              
              {horariosGenerados && horariosGenerados.profesores[itemSeleccionado.id] && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold">Horario Asignado</h4>
                    <button
                      onClick={() => exportarHorarioProfesor(itemSeleccionado.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                      📥 Exportar
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-3 border border-gray-200 text-left font-bold">Bloque / Hora</th>
                          {configGlobal.diasSemana.map(dia => (
                            <th key={dia} className="p-3 border border-gray-200 text-center font-bold">{dia}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({length: calcularBloquesTotales(configGlobal)}).map((_, bloqueIdx) => {
                          return (
                            <tr key={bloqueIdx} className="hover:bg-gray-50">
                              <td className="p-3 border border-gray-200 bg-gray-50">
                                <div className="font-semibold text-gray-900">{bloqueIdx + 1}</div>
                                <div className="text-xs text-gray-600">{calcularHoraBloque(bloqueIdx)}</div>
                              </td>
                              {configGlobal.diasSemana.map(dia => {
                                const clase = horariosGenerados.profesores[itemSeleccionado.id].horario[dia].find(c => c.bloque === bloqueIdx + 1);
                                return (
                                  <td key={dia} className="p-2 border border-gray-200">
                                    {clase ? (
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                        <div className="font-bold text-blue-900 text-xs">{clase.asignatura}</div>
                                        <div className="text-blue-700 text-xs">{clase.curso}</div>
                                      </div>
                                    ) : (
                                      <div className="text-gray-300 text-center">—</div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Total horas asignadas:</strong> {Object.values(horariosGenerados.profesores[itemSeleccionado.id].horario).flat().length} horas pedagógicas
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => eliminarProfesor(itemSeleccionado.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Eliminar Docente
                </button>
                <button
                  onClick={() => setItemSeleccionado(null)}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* PERFIL: Curso */}
        {itemSeleccionado && seccionActual === 'cursos' && cursos.find(c => c.id === itemSeleccionado.id) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-3xl w-full my-8 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold">{itemSeleccionado.nombre}</h3>
                  <p className="text-gray-500">Perfil del Curso</p>
                </div>
                <button
                  onClick={() => setItemSeleccionado(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-6">
                <h4 className="font-bold mb-3">Malla Curricular</h4>
                <div className="space-y-2">
                  {asignaturas.map(asig => (
                    <div key={asig} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <span className="font-medium">{asig}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={itemSeleccionado.malla[asig] || 0}
                          onChange={(e) => actualizarMallaCurso(itemSeleccionado.id, asig, e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <span className="text-sm text-gray-500">horas/semana</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="font-bold text-blue-900">Total horas semanales: {Object.values(itemSeleccionado.malla).reduce((sum, h) => sum + h, 0)}</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setItemSeleccionado(null)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => setItemSeleccionado(null)}
                  className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
        
      </main>
    </div>
  )
}

export default App