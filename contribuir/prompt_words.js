// Lista de palabras priorizadas. Espejo de lib/features/contribute/data/prompt_words.dart
// Si cambia uno, cambiar el otro para que IDs coincidan entre web y app.

export const PROMPT_WORDS = [
  // Saludos y cortesia (priority 2)
  { id: 'hola',           text: 'Hola',           category: 'saludos',     priority: 2 },
  { id: 'chao',           text: 'Chao',           category: 'saludos',     priority: 2 },
  { id: 'gracias',        text: 'Gracias',        category: 'saludos',     priority: 2 },
  { id: 'por_favor',      text: 'Por favor',      category: 'saludos',     priority: 2 },
  { id: 'perdon',         text: 'Perdón',         category: 'saludos',     priority: 2 },
  { id: 'permiso',        text: 'Permiso',        category: 'saludos',     priority: 2 },
  { id: 'buenos_dias',    text: 'Buenos días',    category: 'saludos',     priority: 2 },
  { id: 'buenas_tardes',  text: 'Buenas tardes',  category: 'saludos',     priority: 2 },
  { id: 'buenas_noches',  text: 'Buenas noches',  category: 'saludos',     priority: 2 },

  // Preguntas basicas (priority 2)
  { id: 'como_estas',     text: 'Cómo estás',     category: 'preguntas',   priority: 2 },
  { id: 'donde',          text: 'Dónde',          category: 'preguntas',   priority: 2 },
  { id: 'cuando',         text: 'Cuándo',         category: 'preguntas',   priority: 2 },
  { id: 'quien',          text: 'Quién',          category: 'preguntas',   priority: 2 },
  { id: 'que',            text: 'Qué',            category: 'preguntas',   priority: 2 },
  { id: 'por_que',        text: 'Por qué',        category: 'preguntas',   priority: 2 },
  { id: 'cuanto',         text: 'Cuánto',         category: 'preguntas',   priority: 3 },
  { id: 'como_se_llama',  text: 'Cómo se llama',  category: 'preguntas',   priority: 3 },

  // Emergencias y salud (priority 1)
  { id: 'ayuda',          text: 'Ayuda',          category: 'emergencias', priority: 1 },
  { id: 'urgente',        text: 'Urgente',        category: 'emergencias', priority: 1 },
  { id: 'doctor',         text: 'Doctor',         category: 'emergencias', priority: 1 },
  { id: 'hospital',       text: 'Hospital',       category: 'emergencias', priority: 1 },
  { id: 'ambulancia',     text: 'Ambulancia',     category: 'emergencias', priority: 1 },
  { id: 'policia',        text: 'Policía',        category: 'emergencias', priority: 1 },
  { id: 'bomberos',       text: 'Bomberos',       category: 'emergencias', priority: 1 },
  { id: 'dolor',          text: 'Dolor',          category: 'emergencias', priority: 1 },
  { id: 'enfermo',        text: 'Enfermo',        category: 'emergencias', priority: 1 },
  { id: 'medicamento',    text: 'Medicamento',    category: 'emergencias', priority: 1 },

  // Personas (priority 2-3)
  { id: 'yo',             text: 'Yo',             category: 'personas',    priority: 2 },
  { id: 'tu',             text: 'Tú',             category: 'personas',    priority: 2 },
  { id: 'el',             text: 'Él',             category: 'personas',    priority: 2 },
  { id: 'ella',           text: 'Ella',           category: 'personas',    priority: 2 },
  { id: 'nosotros',       text: 'Nosotros',       category: 'personas',    priority: 3 },
  { id: 'ellos',          text: 'Ellos',          category: 'personas',    priority: 3 },

  // Familia (priority 3)
  { id: 'mama',           text: 'Mamá',           category: 'familia',     priority: 3 },
  { id: 'papa',           text: 'Papá',           category: 'familia',     priority: 3 },
  { id: 'hermano',        text: 'Hermano',        category: 'familia',     priority: 3 },
  { id: 'hermana',        text: 'Hermana',        category: 'familia',     priority: 3 },
  { id: 'hijo',           text: 'Hijo',           category: 'familia',     priority: 3 },
  { id: 'hija',           text: 'Hija',           category: 'familia',     priority: 3 },
  { id: 'abuelo',         text: 'Abuelo',         category: 'familia',     priority: 3 },
  { id: 'abuela',         text: 'Abuela',         category: 'familia',     priority: 3 },
  { id: 'amigo',          text: 'Amigo',          category: 'familia',     priority: 3 },
  { id: 'amiga',          text: 'Amiga',          category: 'familia',     priority: 3 },

  // Lugares (priority 2-3)
  { id: 'casa',           text: 'Casa',           category: 'lugares',     priority: 3 },
  { id: 'calle',          text: 'Calle',          category: 'lugares',     priority: 3 },
  { id: 'banco',          text: 'Banco',          category: 'lugares',     priority: 3 },
  { id: 'supermercado',   text: 'Supermercado',   category: 'lugares',     priority: 3 },
  { id: 'escuela',        text: 'Escuela',        category: 'lugares',     priority: 3 },
  { id: 'trabajo',        text: 'Trabajo',        category: 'lugares',     priority: 3 },
  { id: 'bano',           text: 'Baño',           category: 'lugares',     priority: 2 },
  { id: 'farmacia',       text: 'Farmacia',       category: 'lugares',     priority: 2 },

  // Necesidades basicas (priority 2-3)
  { id: 'agua',           text: 'Agua',           category: 'necesidades', priority: 2 },
  { id: 'comida',         text: 'Comida',         category: 'necesidades', priority: 2 },
  { id: 'hambre',         text: 'Hambre',         category: 'necesidades', priority: 2 },
  { id: 'sed',            text: 'Sed',            category: 'necesidades', priority: 2 },
  { id: 'sueno',          text: 'Sueño',          category: 'necesidades', priority: 3 },
  { id: 'frio',           text: 'Frío',           category: 'necesidades', priority: 3 },
  { id: 'calor',          text: 'Calor',          category: 'necesidades', priority: 3 },

  // Tiempo (priority 3-4)
  { id: 'hoy',            text: 'Hoy',            category: 'tiempo',      priority: 3 },
  { id: 'manana',         text: 'Mañana',         category: 'tiempo',      priority: 3 },
  { id: 'ayer',           text: 'Ayer',           category: 'tiempo',      priority: 3 },
  { id: 'ahora',          text: 'Ahora',          category: 'tiempo',      priority: 3 },
  { id: 'despues',        text: 'Después',        category: 'tiempo',      priority: 4 },
  { id: 'antes',          text: 'Antes',          category: 'tiempo',      priority: 4 },

  // Acciones cotidianas (priority 4)
  { id: 'comer',          text: 'Comer',          category: 'acciones',    priority: 4 },
  { id: 'beber',          text: 'Beber',          category: 'acciones',    priority: 4 },
  { id: 'dormir',         text: 'Dormir',         category: 'acciones',    priority: 4 },
  { id: 'caminar',        text: 'Caminar',        category: 'acciones',    priority: 4 },
  { id: 'sentarse',       text: 'Sentarse',       category: 'acciones',    priority: 4 },
  { id: 'mirar',          text: 'Mirar',          category: 'acciones',    priority: 4 },
  { id: 'escuchar',       text: 'Escuchar',       category: 'acciones',    priority: 4 },
  { id: 'hablar',         text: 'Hablar',         category: 'acciones',    priority: 4 },

  // Respuestas (priority 1-4)
  { id: 'si',             text: 'Sí',             category: 'respuestas',  priority: 1 },
  { id: 'no',             text: 'No',             category: 'respuestas',  priority: 1 },
  { id: 'tal_vez',        text: 'Tal vez',        category: 'respuestas',  priority: 4 },
  { id: 'no_se',          text: 'No sé',          category: 'respuestas',  priority: 3 },
];

export const CATEGORY_LABELS = {
  saludos:     'Saludos y cortesía',
  preguntas:   'Preguntas básicas',
  emergencias: 'Salud y emergencias',
  personas:    'Personas',
  familia:     'Familia',
  lugares:     'Lugares',
  necesidades: 'Necesidades básicas',
  tiempo:      'Tiempo',
  acciones:    'Acciones cotidianas',
  respuestas:  'Respuestas',
};

export const REGIONS = [
  { id: 'unspecified', label: 'Sin especificar' },
  { id: 'XV',          label: 'Arica y Parinacota' },
  { id: 'I',           label: 'Tarapacá' },
  { id: 'II',          label: 'Antofagasta' },
  { id: 'III',         label: 'Atacama' },
  { id: 'IV',          label: 'Coquimbo' },
  { id: 'V',           label: 'Valparaíso' },
  { id: 'RM',          label: 'Metropolitana' },
  { id: 'VI',          label: "O'Higgins" },
  { id: 'VII',         label: 'Maule' },
  { id: 'XVI',         label: 'Ñuble' },
  { id: 'VIII',        label: 'Biobío' },
  { id: 'IX',          label: 'La Araucanía' },
  { id: 'XIV',         label: 'Los Ríos' },
  { id: 'X',           label: 'Los Lagos' },
  { id: 'XI',          label: 'Aysén' },
  { id: 'XII',         label: 'Magallanes' },
  { id: 'OTHER',       label: 'Fuera de Chile' },
];

export const FLUENCY_LEVELS = [
  {
    id: 'deaf_native',
    label: 'Soy Sordo/a, LSCh es mi primera lengua',
    description: 'Aprendí LSCh desde la infancia, es mi forma natural de comunicarme.',
  },
  {
    id: 'deaf_learned',
    label: 'Soy Sordo/a, aprendí LSCh más adelante',
    description: 'Soy Sordo/a pero aprendí LSCh en la adolescencia o adulto/a.',
  },
  {
    id: 'interpreter',
    label: 'Soy intérprete certificado/a',
    description: 'Tengo formación profesional en interpretación LSCh.',
  },
  {
    id: 'family',
    label: 'Soy familia o cercano/a de persona Sorda',
    description: 'Aprendí LSCh por convivencia con personas Sordas.',
  },
  {
    id: 'student',
    label: 'Estoy aprendiendo LSCh',
    description: 'Estoy en proceso de aprender la lengua.',
  },
];

export const VALID_REGION_IDS = REGIONS.map(r => r.id);
export const VALID_FLUENCY_IDS = FLUENCY_LEVELS.map(f => f.id);
export const VALID_WORD_IDS = PROMPT_WORDS.map(w => w.id);

export function sortedByPriority(excludedIds = new Set()) {
  return PROMPT_WORDS
    .filter(w => !excludedIds.has(w.id))
    .sort((a, b) => a.priority - b.priority || a.text.localeCompare(b.text));
}
