// Centralised mock data + nav config for the Mirae o'quv markazi student
// platform (runnable frontend demo — backend is Django REST + django-unfold
// admin, built separately; these shapes are meant to map 1:1 to that API).

export const APP_NAME = 'Mirae Maktab';

// Desktop sidebar order (Bildirishnomalar moved near end, Test = 2nd)
export const NAV = [
  { to: '/', icon: 'home', label: 'Bosh sahifa', end: true },
  { to: '/test', icon: 'target', label: 'Test' },
  { to: '/vazifalar', icon: 'clipboard', label: 'Vazifalar' },
  { to: '/darslar', icon: 'cap', label: 'Darslar' },
  { to: '/bilet', icon: 'ticket', label: 'Bilet' },
  { to: '/sinfim', icon: 'users', label: 'Sinfim' },
  { to: '/dtm', icon: 'bolt', label: 'DTM', minGrade: 9 },
  { to: '/kelajak', icon: 'trophy', label: 'Mirae (Kelajak)', minGrade: 9 },
  { to: '/tolovlar', icon: 'wallet', label: "To'lovlar", minGrade: 9 },
  { to: '/ijtimoiy', icon: 'telegram', label: 'Ijtimoiy tarmoqlar' },
  { to: '/adminga-yozish', icon: 'send', label: 'Adminga yozish' },
  { to: '/bildirishnomalar', icon: 'bell', label: 'Bildirishnomalar' },
];

export const getNav = (grade = 11) => NAV.filter((n) => !n.minGrade || grade >= n.minGrade);

export const USER = {
  name: 'Sardor',
  surname: 'Aliyev',
  login: 'sardor_a',
  className: '11-A',
  fan: '11-A',
  grade: 11,
  balance: 24000,
  xp: 4820,
  level: 12,
  levelXp: 5200,
  streak: 6,
  rank: 4,
  rankOf: 28,
  rankDelta: 2,
  plan: 'free',
};

export const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ');
export const scoreColor = (n) =>
  n >= 85 ? '#17A673' : n >= 70 ? '#3D7DF6' : n >= 55 ? '#F5A524' : '#DB3D6F';

// ---- Topics + rich question bank ----
export const TOPICS = [
  { id: 't1', name: 'Matematika', total: 620, solved: 402 },
  { id: 't2', name: 'Ingliz tili', total: 480, solved: 355 },
  { id: 't3', name: 'Fizika', total: 340, solved: 140 },
  { id: 't4', name: 'Ona tili', total: 260, solved: 210 },
  { id: 't5', name: 'Tarix', total: 300, solved: 96 },
  { id: 't6', name: 'Biologiya', total: 280, solved: 118 },
];
export const TOTAL_QUESTIONS = TOPICS.reduce((s, t) => s + t.total, 0);
export const SOLVED_QUESTIONS = TOPICS.reduce((s, t) => s + t.solved, 0);

/**
 * Rich Question shape (maps 1:1 to future Django model):
 * - text          plain text fallback
 * - html          optional rich HTML for the question body
 * - images[]      multiple images that belong to the question text
 * - latex         optional KaTeX/LaTeX string
 * - options[]     each option can also have text / html / latex / image
 * - correct       index or array of indices
 * - solutions[]   { type: 'video'|'image'|'text', url?, html?, caption? }
 */
export const QUESTION_BANK = {
  t1: [
    {
      text: '2x + 5 = 17 tenglamada x nimaga teng?',
      html: '<p>2x + 5 = 17 tenglamada <strong>x</strong> nimaga teng?</p>',
      latex: '2x + 5 = 17',
      images: [],
      options: [
        { text: '4' },
        { text: '6' },
        { text: '8' },
        { text: '11' },
      ],
      correct: 1,
      solutions: [
        { type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption: 'To‘liq yechim videosi' },
        { type: 'image', url: 'https://placehold.co/600x200/8458B3/fff?text=Yechim+sxemasi', caption: 'Yechim sxemasi' },
      ],
    },
    {
      text: 'Uchburchak ichki burchaklari yig‘indisi nechchi gradus?',
      html: '<p>Uchburchak ichki burchaklari yig‘indisi <em>nechchi</em> gradus?</p>',
      images: ['https://placehold.co/400x180/4C7DF0/fff?text=Uchburchak'],
      options: [
        { text: '90°' },
        { text: '180°' },
        { text: '270°' },
        { text: '360°' },
      ],
      correct: 1,
      solutions: [
        { type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption: 'Geometriya tushuntirish' },
        { type: 'text', html: '<p>Har qanday uchburchakda ichki burchaklar yig‘indisi <strong>180°</strong> ga teng.</p>' },
      ],
    },
    {
      text: '3² + 4² nechaga teng?',
      latex: '3^2 + 4^2',
      options: [
        { text: '12' },
        { text: '25' },
        { text: '7' },
        { text: '49' },
      ],
      correct: 1,
      solutions: [
        { type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      ],
    },
  ],
  t2: [
    {
      text: 'Choose the correct sentence.',
      html: '<p>Choose the <strong>correct</strong> sentence.</p>',
      options: [
        { text: 'She go to school.' },
        { text: 'She goes to school.' },
        { text: 'She going to school.' },
        { text: 'She gone to school.' },
      ],
      correct: 1,
      solutions: [
        { type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption: 'Present Simple rules' },
        { type: 'text', html: '<p>Third person singular takes <code>-s / -es</code>.</p>' },
      ],
    },
    {
      text: 'Past tense of "write" is:',
      options: [
        { text: 'writed' },
        { text: 'wrote' },
        { text: 'written' },
        { text: 'writting' },
      ],
      correct: 1,
      solutions: [
        { type: 'image', url: 'https://placehold.co/500x160/17A673/fff?text=Irregular+verbs', caption: 'Noto‘g‘ri fe’llar jadvali' },
      ],
    },
  ],
  t3: [
    {
      text: 'Tezlik formulasi qaysi?',
      latex: 'v = \\frac{s}{t}',
      options: [
        { text: 'v = m/t' },
        { text: 'v = s/t' },
        { text: 'v = F/m' },
        { text: 'v = s·t' },
      ],
      correct: 1,
      solutions: [
        { type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { type: 'image', url: 'https://placehold.co/500x180/F5A524/fff?text=Kinematika' },
      ],
    },
    {
      text: 'Suvning qaynash harorati (normal bosimda)?',
      options: [
        { text: '90°C' },
        { text: '100°C' },
        { text: '80°C' },
        { text: '120°C' },
      ],
      correct: 1,
      solutions: [{ type: 'text', html: '<p>Normal atmosfera bosimida suv <strong>100°C</strong> da qaynaydi.</p>' }],
    },
  ],
  t4: [
    {
      text: '"Kitob" so‘zi qaysi turkumga kiradi?',
      options: [
        { text: 'Fe’l' },
        { text: 'Ot' },
        { text: 'Sifat' },
        { text: 'Ravish' },
      ],
      correct: 1,
      solutions: [{ type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
    },
  ],
  t5: [
    {
      text: 'Amir Temur qaysi asrda yashagan?',
      options: [
        { text: 'XII asr' },
        { text: 'XIV asr' },
        { text: 'XVI asr' },
        { text: 'XVIII asr' },
      ],
      correct: 1,
      solutions: [{ type: 'text', html: '<p>Amir Temur <strong>XIV asr</strong>da yashagan (1336–1405).</p>' }],
    },
  ],
  t6: [
    {
      text: 'Fotosintez qayerda sodir bo‘ladi?',
      options: [
        { text: 'Ildizda' },
        { text: 'Xloroplastda' },
        { text: 'Bo‘g‘imda' },
        { text: 'Gulda' },
      ],
      correct: 1,
      solutions: [
        { type: 'image', url: 'https://placehold.co/480x200/17A673/fff?text=Xloroplast' },
        { type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      ],
    },
  ],
  // Pedagogika — used ONLY as the final block of the 50-question real exam.
  t7: [
    {
      text: 'Didaktika pedagogikaning qaysi sohasini o‘rganadi?',
      options: [{ text: 'Tarbiya nazariyasi' }, { text: 'Ta’lim (o‘qitish) nazariyasi' }, { text: 'Maktab boshqaruvi' }, { text: 'Yosh fiziologiyasi' }],
      correct: 1,
      solutions: [{ type: 'text', html: '<p><strong>Didaktika</strong> — ta’lim va o‘qitish qonuniyatlarini o‘rganadigan soha.</p>' }],
    },
    {
      text: 'Ko‘rgazmalilik tamoyili birinchi bo‘lib kim tomonidan asoslangan?',
      options: [{ text: 'Ya. A. Komenskiy' }, { text: 'J. J. Russo' }, { text: 'K. D. Ushinskiy' }, { text: 'J. Dyui' }],
      correct: 0,
      solutions: [{ type: 'text', html: '<p>Ya. A. Komenskiy “Buyuk didaktika” asarida ko‘rgazmalilikni “oltin qoida” deb atagan.</p>' }],
    },
    {
      text: 'Dars — bu ta’lim tashkil etishning qanday shakli?',
      options: [{ text: 'Yakka tartibdagi' }, { text: 'Sinf-dars tizimidagi asosiy' }, { text: 'Fakultativ' }, { text: 'Masofaviy' }],
      correct: 1,
      solutions: [{ type: 'text', html: '<p>Dars — sinf-dars tizimining asosiy tashkiliy shakli.</p>' }],
    },
    {
      text: 'Baholashning asosiy funksiyalaridan biri qaysi?',
      options: [{ text: 'Jazolash' }, { text: 'Tashxislash (diagnostik)' }, { text: 'Saralash' }, { text: 'Cheklash' }],
      correct: 1,
      solutions: [{ type: 'text', html: '<p>Baholash tashxislovchi, rag‘batlantiruvchi va nazorat funksiyalarini bajaradi.</p>' }],
    },
    {
      text: 'Interfaol metodlarga qaysi biri kiradi?',
      options: [{ text: 'Ma’ruza (monolog)' }, { text: 'Aqliy hujum (brainstorming)' }, { text: 'Diktant' }, { text: 'Konspekt yozish' }],
      correct: 1,
      solutions: [{ type: 'text', html: '<p>Aqliy hujum — o‘quvchilar faolligiga asoslangan interaktiv metod.</p>' }],
    },
    {
      text: 'Tarbiyaning maqsadi nima bilan belgilanadi?',
      options: [{ text: 'O‘qituvchi xohishi' }, { text: 'Jamiyat ehtiyoji va ijtimoiy buyurtma' }, { text: 'Ota-ona' }, { text: 'Ob-havo' }],
      correct: 1,
      solutions: [{ type: 'text', html: '<p>Tarbiya maqsadi jamiyatning ijtimoiy buyurtmasi bilan belgilanadi.</p>' }],
    },
  ],
};

export const PEDAGOGIKA_ID = 't7';
export const topicLabel = (id) => (id === PEDAGOGIKA_ID ? 'Pedagogika' : (TOPICS.find((t) => t.id === id)?.name || 'Savollar'));

export function buildMockQuestions(mix) {
  const out = [];
  let n = 1;
  mix.forEach(({ topicId, count }) => {
    const bank = QUESTION_BANK[topicId] || [];
    for (let i = 0; i < count; i++) {
      const q = bank[i % bank.length];
      if (!q) continue;
      out.push({ id: `${topicId}-${i}-${n}`, no: n++, topicId, ...q });
    }
  });
  return out;
}

/**
 * Build the ordered question list for an exam.
 * If the preset declares a `pedagogika` block (e.g. the 50-question real exam),
 * the FIRST (size - pedagogika) questions come from the subject mix and the
 * LAST `pedagogika` questions are random Pedagogika questions — mirroring the
 * real DTM 40 + 10 structure. Otherwise it's a single normal block.
 */
export function buildExamQuestions(preset) {
  const size = preset.size || (preset.mix ? preset.mix.reduce((s, m) => s + m.count, 0) : 30);
  const pedCount = preset.pedagogika || 0;
  if (pedCount > 0) {
    const mainCount = Math.max(0, size - pedCount);
    const main = buildMockQuestions(preset.mix).slice(0, mainCount);
    const ped = buildMockQuestions([{ topicId: PEDAGOGIKA_ID, count: pedCount }]);
    return [...main, ...ped].map((q, i) => ({ ...q, no: i + 1 }));
  }
  return buildMockQuestions(preset.mix);
}

// Paid random tests (admin configures the mix)
export const TEST_PRESETS = [
  {
    id: 'p30',
    size: 30,
    price: 0,
    title: '30 savollik tasodifiy test',
    titleKey: 'test.preset30',
  },
  {
    id: 'p50',
    size: 50,
    price: 0,
    title: '50 savollik tasodifiy test',
    titleKey: 'test.preset50',
  },
];

// ---- Bilet (exam tickets) — 5 free, rest paid forever unlock ----
export const BILETS = [
  { id: 'b1', title: 'Matematika — Bilet 1', topic: 'Matematika', questions: 25, free: true, price: 0, unlocked: true, mix: [{ topicId: 't1', count: 25 }] },
  { id: 'b2', title: 'Matematika — Bilet 2', topic: 'Matematika', questions: 25, free: true, price: 0, unlocked: true, mix: [{ topicId: 't1', count: 25 }] },
  { id: 'b3', title: 'Ingliz tili — Bilet 1', topic: 'Ingliz tili', questions: 20, free: true, price: 0, unlocked: true, mix: [{ topicId: 't2', count: 20 }] },
  { id: 'b4', title: 'Fizika — Bilet 1', topic: 'Fizika', questions: 20, free: true, price: 0, unlocked: true, mix: [{ topicId: 't3', count: 20 }] },
  { id: 'b5', title: 'Ona tili — Bilet 1', topic: 'Ona tili', questions: 15, free: true, price: 0, unlocked: true, mix: [{ topicId: 't4', count: 15 }] },
  { id: 'b6', title: 'Matematika — Bilet 3', topic: 'Matematika', questions: 30, free: false, price: 8000, unlocked: false, mix: [{ topicId: 't1', count: 30 }] },
  { id: 'b7', title: 'Ingliz tili — Bilet 2', topic: 'Ingliz tili', questions: 25, free: false, price: 7000, unlocked: false, mix: [{ topicId: 't2', count: 25 }] },
  { id: 'b8', title: 'Fizika — Bilet 2', topic: 'Fizika', questions: 25, free: false, price: 7500, unlocked: true, mix: [{ topicId: 't3', count: 25 }] }, // already bought
  { id: 'b9', title: 'Tarix — Bilet 1', topic: 'Tarix', questions: 20, free: false, price: 6000, unlocked: false, mix: [{ topicId: 't5', count: 20 }] },
  { id: 'b10', title: 'Biologiya — Bilet 1', topic: 'Biologiya', questions: 20, free: false, price: 6000, unlocked: false, mix: [{ topicId: 't6', count: 20 }] },
];

// ---- Darslar: course -> paragraph -> topic ----
export const COURSES = [
  {
    id: 'c1', subjectIds: ['t1'], title: 'Matematika', teacher: 'Bahodir Qodirov', kit: 'blue', icon: 'cap', topicId: 't1',
    paragraphs: [
      {
        id: 'p1', title: '1-bob. Tenglamalar',
        topics: [
          { id: 'tp1', title: 'Chiziqli tenglamalar', statement: "Bir noma'lumli chiziqli tenglamalarni yechish usullari va misollar.", video: { source: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, hasTest: true },
          { id: 'tp2', title: 'Tengsizliklar', statement: "Chiziqli tengsizliklarni yechish va sonlar o'qida tasvirlash.", video: { source: 'file', url: '#' }, hasTest: true },
        ],
      },
      {
        id: 'p2', title: '2-bob. Geometriya',
        topics: [
          { id: 'tp3', title: 'Uchburchaklar', statement: 'Uchburchak turlari, perimetri va yuzi.', video: { source: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, hasTest: true },
        ],
      },
    ],
  },
  {
    id: 'c2', subjectIds: ['t2'], title: 'Ingliz tili', teacher: 'Zilola Karimova', kit: 'green', icon: 'cap', topicId: 't2',
    paragraphs: [
      {
        id: 'p3', title: 'Unit 1. Tenses',
        topics: [
          { id: 'tp4', title: 'Present Simple', statement: 'Present Simple zamonining qo‘llanilishi va qoidalari.', video: { source: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, hasTest: true },
          { id: 'tp5', title: 'Past Simple', statement: 'Past Simple zamoni va noto‘g‘ri fe’llar.', video: { source: 'file', url: '#' }, hasTest: true },
        ],
      },
    ],
  },
  {
    id: 'c3', subjectIds: ['t3'], title: 'Fizika', teacher: 'Aziz Nortojiyev', kit: 'amber', icon: 'cap', topicId: 't3',
    paragraphs: [
      {
        id: 'p4', title: '1-bob. Kinematika',
        topics: [
          { id: 'tp6', title: 'Tekis harakat', statement: 'Tekis to‘g‘ri chiziqli harakat va tezlik.', video: { source: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, hasTest: true },
        ],
      },
    ],
  },
  {
    id: 'c4', subjectIds: ['t4'], title: 'Ona tili', teacher: 'Kamola Rashidova', kit: 'rose', icon: 'cap', topicId: 't4',
    paragraphs: [
      {
        id: 'p5', title: 'Morfologiya',
        topics: [
          { id: 'tp7', title: 'So‘z turkumlari', statement: 'Ot, sifat, fe’l va boshqa so‘z turkumlari.', video: { source: 'file', url: '#' }, hasTest: true },
        ],
      },
    ],
  },
];

// ---- Vazifalar ----
export const ASSIGNMENTS = [
  { id: 'a1', title: "Chiziqli tenglamalar — amaliy mashg'ulot", course: 'Matematika', kit: 'blue', deadline: '2026-09-24', status: 'done', score: 92, mix: [{ topicId: 't1', count: 10 }] },
  { id: 'a2', title: 'Present Simple — mashq', course: 'Ingliz tili', kit: 'green', deadline: '2026-09-22', status: 'pending', score: null, mix: [{ topicId: 't2', count: 8 }] },
  { id: 'a3', title: 'Tekis harakat — masalalar', course: 'Fizika', kit: 'amber', deadline: '2026-09-25', status: 'pending', score: null, mix: [{ topicId: 't3', count: 8 }] },
  { id: 'a4', title: "So'z turkumlari — nazorat", course: 'Ona tili', kit: 'rose', deadline: '2026-09-20', status: 'late', score: null, mix: [{ topicId: 't4', count: 6 }] },
  { id: 'a5', title: 'Uchburchaklar — amaliyot', course: 'Matematika', kit: 'blue', deadline: '2026-09-18', status: 'done', score: 78, mix: [{ topicId: 't1', count: 10 }] },
];

// ---- Videodarslar ----
export const VIDEO_LESSONS = [
  { id: 'v1', title: 'Chiziqli tenglamalar asosi', course: 'Matematika', minutes: 18, free: true, price: 0, granted: false },
  { id: 'v2', title: 'Present Simple tushuntirish', course: 'Ingliz tili', minutes: 14, free: true, price: 0, granted: false },
  { id: 'v3', title: 'Tekis harakat masalalari', course: 'Fizika', minutes: 22, free: true, price: 0, granted: false },
  { id: 'v4', title: "So'z turkumlari to'liq kurs", course: 'Ona tili', minutes: 16, free: true, price: 0, granted: false },
  { id: 'v5', title: 'Uchburchaklar geometriyasi', course: 'Matematika', minutes: 20, free: true, price: 0, granted: false },
  { id: 'v6', title: 'Kvadrat tenglamalar chuqur kurs', course: 'Matematika', minutes: 34, free: false, price: 6000, granted: false },
  { id: 'v7', title: 'Past Simple va noto‘g‘ri fe’llar', course: 'Ingliz tili', minutes: 28, free: false, price: 5000, granted: true },
  { id: 'v8', title: 'Dinamika asoslari', course: 'Fizika', minutes: 31, free: false, price: 6000, granted: false },
];

// ---- To'lovlar ----
export const TRANSACTIONS = [
  { id: 'x1', type: 'topup', title: "Click orqali to'ldirish", amount: 15000, date: '2026-09-16T09:12:00', status: 'success' },
  { id: 'x2', type: 'purchase', title: '30 savollik tasodifiy test', amount: -7000, date: '2026-09-16T18:40:00', status: 'success' },
  { id: 'x3', type: 'purchase', title: 'Video dars: Kvadrat tenglamalar', amount: -6000, date: '2026-09-14T11:05:00', status: 'success' },
  { id: 'x4', type: 'topup', title: "Click orqali to'ldirish", amount: 20000, date: '2026-09-10T08:02:00', status: 'success' },
  { id: 'x5', type: 'purchase', title: '50 savollik tasodifiy test', amount: -10000, date: '2026-09-05T20:33:00', status: 'success' },
  { id: 'x6', type: 'topup', title: "Click orqali to'ldirish", amount: 10000, date: '2026-08-29T10:00:00', status: 'failed' },
  { id: 'x7', type: 'purchase', title: 'Bilet: Fizika — Bilet 2', amount: -7500, date: '2026-09-12T15:20:00', status: 'success' },
];

// ---- Ijtimoiy ----
export const SOCIALS = [
  { id: 's1', name: 'Mirae — rasmiy kanal', platform: 'telegram', followers: 12400, url: 'https://t.me/mirae_uz' },
  { id: 's2', name: 'Matematika guruhi', platform: 'telegram', followers: 3200, url: 'https://t.me/mirae_math' },
  { id: 's3', name: 'Ingliz tili guruhi', platform: 'telegram', followers: 2870, url: 'https://t.me/mirae_english' },
  { id: 's4', name: 'Mirae Instagram', platform: 'instagram', followers: 8900, url: 'https://instagram.com/mirae.uz' },
  { id: 's5', name: 'Mirae YouTube', platform: 'youtube', followers: 5400, url: 'https://youtube.com/@mirae' },
];

// ---- Guruhlar ----
export const GROUPS = [
  { id: 'g1', name: '9-A — Matematika chuqur', teacher: 'Bahodir Qodirov', members: 28, isMember: true, telegramUrl: 'https://t.me/+mirae_9a', kit: 'blue', lastActivity: "Bugun yangi dars qo'shildi" },
  { id: 'g2', name: 'IELTS intensiv guruhi', teacher: 'Zilola Karimova', members: 64, isMember: true, telegramUrl: 'https://t.me/+mirae_ielts', kit: 'green', lastActivity: 'Ertaga soat 18:00 jonli efir' },
  { id: 'g3', name: 'Fizika olimpiada tayyorgarlik', teacher: 'Aziz Nortojiyev', members: 41, isMember: false, telegramUrl: 'https://t.me/+mirae_fizika', kit: 'amber', lastActivity: "Haftalik masalalar to'plami" },
];

// ---- Bildirishnomalar ----
export const NOTIFICATIONS = [
  { id: 'n1', title: "Yangi video dars qo'shildi", body: 'Matematika kursiga "Kvadrat tenglamalar" video darsi qo\'shildi.', time: '2026-09-19T08:10:00', read: false, kind: 'video' },
  { id: 'n2', title: 'Vazifa muddati yaqinlashmoqda', body: '"So\'z turkumlari — nazorat" vazifasini topshirish muddati o\'tib ketdi.', time: '2026-09-18T14:00:00', read: false, kind: 'assignment' },
  { id: 'n3', title: "To'lov muvaffaqiyatli", body: "15 000 so'm balansingizga qo'shildi.", time: '2026-09-16T09:13:00', read: true, kind: 'payment' },
  { id: 'n4', title: "Reytingda ko'tarildingiz", body: "Siz saytdagi reytingda 6 ta o'rinni yuqoriga ko'tarildingiz.", time: '2026-09-15T19:00:00', read: true, kind: 'rank' },
  { id: 'n5', title: 'Admin javob berdi', body: '"To\'lov qaytarilishi" so\'rovingizga javob yozildi.', time: '2026-09-12T10:22:00', read: true, kind: 'admin' },
];

export const ANNOUNCEMENTS = [
  { id: 'e1', title: 'Kuzgi semestr uchun yangi guruhlar ochildi', date: '2026-09-18' },
  { id: 'e2', title: "Fizika olimpiadasiga ro'yxatdan o'tish boshlandi", date: '2026-09-15' },
  { id: 'e3', title: "Dam olish kunlari markaz ish tartibi o'zgardi", date: '2026-09-10' },
];

export const LEADERBOARD = [
  { rank: 1, name: 'Javlon Tursunov', avg: 97 },
  { rank: 2, name: 'Madina Yusupova', avg: 95 },
  { rank: 3, name: 'Otabek Rahimov', avg: 93 },
  { rank: 4, name: 'Nilufar Saidova', avg: 90 },
  { rank: 5, name: 'Diyorbek Xolmatov', avg: 88 },
];

// ---- Full results with answer-level detail (saved completely) ----
const RESULT_TYPES = ['Tasodifiy test', 'Vazifa', 'Bilet'];
const RESULT_COURSES = ['Matematika', 'Ingliz tili', 'Fizika', 'Ona tili', 'Tarix', 'Biologiya'];
const RESULT_SUBJECT = { 'Matematika': 't1', 'Ingliz tili': 't2', 'Fizika': 't3', 'Ona tili': 't4', 'Tarix': 't5', 'Biologiya': 't6' };

// Topic mix used to reconstruct a full review for a saved result.
const MIX_FOR = (size) => {
  if (size <= 20) return [{ topicId: 't1', count: 6 }, { topicId: 't2', count: 5 }, { topicId: 't3', count: 5 }, { topicId: 't4', count: 4 }];
  if (size <= 30) return [{ topicId: 't1', count: 8 }, { topicId: 't2', count: 6 }, { topicId: 't3', count: 6 }, { topicId: 't4', count: 5 }, { topicId: 't5', count: 5 }];
  return [{ topicId: 't1', count: 12 }, { topicId: 't2', count: 10 }, { topicId: 't3', count: 10 }, { topicId: 't4', count: 8 }, { topicId: 't5', count: 5 }, { topicId: 't6', count: 5 }];
};

export const RESULTS = Array.from({ length: 34 }).map((_, i) => {
  const size = [20, 30, 50][i % 3];
  const correctPct = 45 + ((i * 13) % 50);
  const correct = Math.round((size * correctPct) / 100);
  const d = new Date('2026-09-19T12:00:00');
  d.setDate(d.getDate() - i * 2);

  // Full answer snapshot (what was selected + whether correct)
  const answers = Array.from({ length: size }).map((__, qi) => {
    const selected = Math.floor(Math.random() * 4);
    const isCorrect = qi < correct;
    return {
      questionNo: qi + 1,
      selected,
      correctIndex: isCorrect ? selected : (selected + 1) % 4,
      isCorrect,
    };
  });

  return {
    id: `res${i + 1}`,
    type: RESULT_TYPES[i % RESULT_TYPES.length],
    course: RESULT_COURSES[i % RESULT_COURSES.length],
    subjectId: RESULT_SUBJECT[RESULT_COURSES[i % RESULT_COURSES.length]],
    size,
    correct,
    pct: Math.round((correct / size) * 100),
    date: d.toISOString(),
    duration: `${10 + (i % 20)}:${String((i * 7) % 60).padStart(2, '0')}`,
    mix: MIX_FOR(size),
    answers, // full saved result
  };
});

export const AVERAGE_SCORE = Math.round(RESULTS.reduce((s, r) => s + r.pct, 0) / RESULTS.length);

/**
 * Rebuild a complete, question-by-question review for a saved result:
 * each entry carries the real question (text/options/solutions), the option the
 * student selected, the correct option, and whether it was right. Used by the
 * "eye" action on the results table -> full review screen.
 */
export function buildResultReview(result) {
  const questions = buildMockQuestions(result.mix || MIX_FOR(result.size)).slice(0, result.size);
  return questions.map((q, i) => {
    const optCount = (q.options && q.options.length) || 4;
    const correctIndex = Array.isArray(q.correct) ? q.correct[0] : q.correct;
    const isCorrect = i < result.correct;
    const selected = isCorrect ? correctIndex : (correctIndex + 1) % optCount;
    return { q, no: i + 1, selected, correctIndex, isCorrect };
  });
}

// ---- Visual palette per subject (drives donut segments + progress rows) ----
export const SUBJECT_COLORS = {
  t1: '#2F6FED', // Matematika  — blue
  t2: '#17A673', // Ingliz tili — green
  t3: '#F5A524', // Fizika      — amber
  t4: '#7A5AF8', // Ona tili    — violet
  t5: '#DB3D6F', // Tarix       — rose
  t6: '#12B5B0', // Biologiya   — teal
};

// Readiness % per subject (solved / total), used by donut + progress card.
export const SUBJECT_READINESS = TOPICS.map((t) => ({
  id: t.id,
  name: t.name,
  color: SUBJECT_COLORS[t.id] || '#3D7DF6',
  solved: t.solved,
  total: t.total,
  pct: Math.round((t.solved / t.total) * 100),
}));

// ---- Weekly activity, derived from saved RESULTS (last 7 weekdays) ----
// Bars = tests taken per weekday; a small honest signal from real result data.
const WEEKDAYS_UZ = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
export const WEEKLY_ACTIVITY = (() => {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const correctPct = [[], [], [], [], [], [], []];
  RESULTS.slice(0, 18).forEach((r) => {
    const jsDay = new Date(r.date).getDay();      // 0=Sun..6=Sat
    const idx = (jsDay + 6) % 7;                   // -> 0=Mon..6=Sun
    counts[idx] += 1;
    correctPct[idx].push(r.pct);
  });
  return WEEKDAYS_UZ.map((label, i) => ({
    label,
    tests: counts[i],
    avg: correctPct[i].length ? Math.round(correctPct[i].reduce((a, b) => a + b, 0) / correctPct[i].length) : 0,
  }));
})();

// Score trend for the hero sparkline (oldest -> newest).
export const SCORE_TREND = RESULTS.slice(0, 12).map((r) => r.pct).reverse();

// Overall readiness across the whole question bank.
export const READINESS_PCT = Math.round((SOLVED_QUESTIONS / TOTAL_QUESTIONS) * 100);


// ---- helpers for result grade + video embeds ----
export function gradeFor(pct) {
  if (pct >= 90) return { label: "A'lo", fg: '#17A673', bg: 'rgba(23,166,115,.14)' };
  if (pct >= 75) return { label: 'Yaxshi', fg: '#2F6FED', bg: 'rgba(47,111,237,.14)' };
  if (pct >= 60) return { label: 'Qoniqarli', fg: '#DB8A17', bg: 'rgba(245,165,36,.18)' };
  return { label: "Yana mashq", fg: '#DB3D6F', bg: 'rgba(219,61,111,.14)' };
}

// Extract a YouTube id from common URL forms; returns '' if not YouTube.
export function ytId(url = '') {
  const m = String(url).match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? m[1] : '';
}

// ============================================================================
// SUBJECTS — attestatsiya is per-subject. A user enrolls in one or more.
// Each subject carries its OWN KPIs, topic breakdown, trend, weekly activity
// and rank (rank is computed WITHIN a subject). Pedagogika is shared.
// This is the seam the Django API fills later (keyed by user+subject).
// ============================================================================
export const SUBJECTS = [
  {
    id: 't1', name: 'Matematika', color: '#2F6FED', enrolled: true,
    solved: 402, total: 620, avg: 78, rank: 37, rankOf: 1840, rankDelta: 6,
    trend: [62, 64, 61, 67, 70, 69, 72, 74, 73, 76, 78, 80],
    weekly: [2, 3, 2, 3, 2, 3, 3],
    topics: [
      { name: 'Algebra', solved: 150, total: 210, color: '#2F6FED' },
      { name: 'Geometriya', solved: 120, total: 180, color: '#17A673' },
      { name: 'Trigonometriya', solved: 70, total: 120, color: '#F5A524' },
      { name: 'Funksiyalar', solved: 62, total: 110, color: '#7A5AF8' },
    ],
  },
  {
    id: 't2', name: 'Ingliz tili', color: '#17A673', enrolled: true,
    solved: 355, total: 480, avg: 74, rank: 54, rankOf: 1220, rankDelta: -3,
    trend: [50, 52, 55, 53, 58, 60, 59, 62, 61, 64, 66, 68],
    weekly: [1, 2, 3, 2, 3, 2, 4],
    topics: [
      { name: 'Grammar', solved: 130, total: 170, color: '#2F6FED' },
      { name: 'Vocabulary', solved: 110, total: 150, color: '#17A673' },
      { name: 'Reading', solved: 70, total: 100, color: '#F5A524' },
      { name: 'Listening', solved: 45, total: 60, color: '#7A5AF8' },
    ],
  },
  {
    id: 't3', name: 'Fizika', color: '#F5A524', enrolled: true,
    solved: 0, total: 340, avg: 0, rank: 0, rankOf: 990, rankDelta: 0,
    trend: [0], weekly: [0, 0, 0, 0, 0, 0, 0],
    topics: [
      { name: 'Mexanika', solved: 0, total: 120, color: '#2F6FED' },
      { name: 'Elektr', solved: 0, total: 110, color: '#17A673' },
      { name: 'Optika', solved: 0, total: 70, color: '#F5A524' },
      { name: 'Termodinamika', solved: 0, total: 40, color: '#7A5AF8' },
    ],
  },
  {
    id: 't4', name: 'Ona tili va adabiyot', color: '#DB3D6F', enrolled: true,
    solved: 0, total: 260, avg: 0, rank: 0, rankOf: 760, rankDelta: 0,
    trend: [0], weekly: [0, 0, 0, 0, 0, 0, 0],
    topics: [
      { name: 'Fonetika', solved: 0, total: 70, color: '#2F6FED' },
      { name: 'Morfologiya', solved: 0, total: 90, color: '#17A673' },
      { name: 'Sintaksis', solved: 0, total: 60, color: '#F5A524' },
      { name: 'Adabiyot', solved: 0, total: 40, color: '#7A5AF8' },
    ],
  },
  {
    id: 't5', name: 'Tarix', color: '#7A5AF8', enrolled: true,
    solved: 180, total: 300, avg: 70, rank: 6, rankOf: 28, rankDelta: 1,
    trend: [55, 58, 57, 60, 62, 61, 64, 66, 65, 68, 69, 70],
    weekly: [1, 2, 1, 2, 2, 1, 2],
    topics: [
      { name: 'Qadimgi dunyo', solved: 60, total: 90, color: '#2F6FED' },
      { name: 'O\u2018rta asrlar', solved: 55, total: 90, color: '#17A673' },
      { name: 'Yangi tarix', solved: 40, total: 70, color: '#F5A524' },
      { name: 'Eng yangi tarix', solved: 25, total: 50, color: '#7A5AF8' },
    ],
  },
  {
    id: 't6', name: 'Informatika', color: '#12B5B0', enrolled: true,
    solved: 240, total: 360, avg: 76, rank: 3, rankOf: 28, rankDelta: 2,
    trend: [60, 62, 64, 63, 66, 68, 70, 69, 72, 74, 75, 76],
    weekly: [2, 3, 2, 3, 3, 2, 3],
    topics: [
      { name: 'Algoritmlar', solved: 90, total: 120, color: '#2F6FED' },
      { name: 'Dasturlash', solved: 70, total: 110, color: '#17A673' },
      { name: 'Ma\u2018lumotlar bazasi', solved: 50, total: 80, color: '#F5A524' },
      { name: 'Tarmoqlar', solved: 30, total: 50, color: '#7A5AF8' },
    ],
  },
];

// Shared pedagogika readiness (same for every subject's exam block).
export const PEDAGOGIKA_READINESS = { name: 'Pedagogika (umumiy)', solved: 128, total: 200, color: '#7A5AF8' };

export const subjectReadiness = (s) => (s && s.total ? Math.round((s.solved / s.total) * 100) : 0);

// ---- Subject scoping: map a course/topic name to its subject id (= topic id) ----
const NAME_TO_SUBJECT = {
  'Matematika': 't1', 'Ingliz tili': 't2', 'Fizika': 't3',
  'Ona tili': 't4', 'Ona tili va adabiyot': 't4', 'Tarix': 't5', 'Biologiya': 't6',
};
export const subjectIdOf = (name) => NAME_TO_SUBJECT[name] || null;

// ---- User status / plans (allowances are admin-configurable) ----
export const PLANS = {
  free: { id: 'free', name: 'Free', price: 0, color: '#5C6B85', tagline: 'Boshlash uchun', perks: ['Balans orqali xarid qilish', 'Bepul testlar va biletlar', "Sotib olingan narsa — abadiy"], allowance: null },
  pro: { id: 'pro', name: 'Pro', price: 49000, period: 'oy', color: '#3D7DF6', tagline: 'Muntazam tayyorlanuvchilar uchun', perks: ['Har hafta 5 ta bepul random test', 'Reytingda ustuvorlik', 'Barcha bepul darslar'], allowance: { count: 5, per: 'hafta' } },
  vip: { id: 'vip', name: 'VIP', price: 99000, period: 'oy', color: '#F5A524', tagline: 'Jadal tayyorgarlik', perks: ['Har kuni 3 ta random test', 'Barcha biletlar ochiq', 'Ustuvor qo‘llab-quvvatlash'], allowance: { count: 3, per: 'kun' } },
  vip2: { id: 'vip2', name: 'VIP+', price: null, color: '#7A5AF8', tagline: 'Adminlar va ijodkorlar', perks: ['Hamma narsa cheksiz', 'To‘lovsiz', 'Faqat admin tomonidan beriladi'], allowance: { count: '∞' }, adminOnly: true },
};
export const PLAN_ORDER = ['free', 'pro', 'vip', 'vip2'];

// ---- Languages ----
export const LANGS = [
  { id: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
];

// Does the user belong to at least one study group? (drives group-only access)
export const hasGroupMembership = () => GROUPS.some((g) => g.isMember);

// ============================================================================
// SCHOOL MODEL (Mirae Maktab) — class, timetable, homework, practical, class
// ============================================================================
export const SUBJECT_BY_ID = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));

// Weekly timetable for the student's class (Mon..Sat). Each cell: {subjectId, teacher, room}
const T = (subjectId, teacher) => ({ subjectId, teacher });
export const BELL = ['08:30', '09:25', '10:20', '11:25', '12:20', '13:15', '14:10', '15:05'];
export const WEEKDAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
export const TIMETABLE = [
  // Dushanba
  [T('t1', 'B. Qodirov'), T('t6', 'A. Nazarov'), T('t2', 'Z. Karimova'), T('t3', 'A. Nortojiyev'), null, null, null, null],
  // Seshanba
  [T('t4', 'K. Rashidova'), T('t1', 'B. Qodirov'), T('t5', 'D. Yusupov'), T('t6', 'A. Nazarov'), null, null, null, null],
  // Chorshanba
  [T('t1', 'B. Qodirov'), T('t2', 'Z. Karimova'), T('t3', 'A. Nortojiyev'), T('t5', 'D. Yusupov'), null, null, null, null],
  // Payshanba
  [T('t6', 'A. Nazarov'), T('t4', 'K. Rashidova'), T('t1', 'B. Qodirov'), T('t2', 'Z. Karimova'), null, null, null, null],
  // Juma
  [T('t3', 'A. Nortojiyev'), T('t5', 'D. Yusupov'), T('t6', 'A. Nazarov'), T('t1', 'B. Qodirov'), null, null, null, null],
  // Shanba
  [T('t2', 'Z. Karimova'), T('t1', 'B. Qodirov'), T('t4', 'K. Rashidova'), null, null, null, null, null],
];

// Homework attached to lessons. status: not_started | in_progress | submitted | checked
export const HOMEWORK = [
  { id: 'hw1', subjectId: 't1', topic: 'Kvadrat tenglamalar', kind: 'test', questions: 20, xp: 60, deadline: '2026-09-24T20:00:00', status: 'not_started', teacher: 'B. Qodirov', lessonTime: '08:30', today: true },
  { id: 'hw2', subjectId: 't6', topic: 'Siklik algoritmlar', kind: 'practical', questions: 1, xp: 80, deadline: '2026-09-24T20:00:00', status: 'in_progress', teacher: 'A. Nazarov', lessonTime: '09:25', today: true },
  { id: 'hw3', subjectId: 't2', topic: 'Present Perfect', kind: 'test', questions: 15, xp: 45, deadline: '2026-09-24T20:00:00', status: 'submitted', teacher: 'Z. Karimova', lessonTime: '10:20', today: true, score: 87 },
  { id: 'hw4', subjectId: 't3', topic: 'Nyuton qonunlari', kind: 'test', questions: 18, xp: 54, deadline: '2026-09-22T20:00:00', status: 'not_started', teacher: 'A. Nortojiyev', lessonTime: '11:25', today: false, overdue: true },
  { id: 'hw5', subjectId: 't5', topic: 'Amir Temur davri', kind: 'practical', questions: 1, xp: 70, deadline: '2026-09-20T20:00:00', status: 'checked', teacher: 'D. Yusupov', today: false, score: 92 },
  { id: 'hw6', subjectId: 't4', topic: 'Sifatdosh', kind: 'test', questions: 12, xp: 36, deadline: '2026-09-19T20:00:00', status: 'checked', teacher: 'K. Rashidova', today: false, score: 75 },
];

export const todaysLessons = () => TIMETABLE[Math.min(new Date().getDay() === 0 ? 5 : new Date().getDay() - 1, 5)]
  .filter(Boolean)
  .map((cell, i) => {
    const subj = SUBJECT_BY_ID[cell.subjectId];
    const hw = HOMEWORK.find((h) => h.subjectId === cell.subjectId && h.today);
    return { ...cell, subject: subj, time: BELL[i] || '', hw };
  });

export const PRACTICAL_TASKS = [
  {
    id: 'p1',
    homeworkId: 'hw2',
    subjectId: 't6',
    topic: 'Siklik algoritmlar',
    title: 'Massiv elementlari yig‘indisi',
    xp: 80,
    deadline: '2026-09-24T20:00:00',
    status: 'in_progress',
    keywords: ['for', 'while', 'array'],
    statementHtml: '<p><strong>Topshiriq:</strong> Berilgan butun sonlar massividagi elementlar yig‘indisini hisoblovchi dastur yozing.</p><ol><li>Kirish: <code>n</code> va massiv elementlari</li><li>Chiqish: yig‘indi</li><li>Sikl (<code>for</code> yoki <code>while</code>) ishlatilishi shart</li></ol><p>Yechimni daftar yoki IDE da bajarib, <strong>foto yoki PDF</strong> yuklang.</p>',
    teacherFiles: [
      { id: 'tf1', name: 'Shart_namuna.pdf', size: '240 KB', type: 'pdf', url: '#' },
      { id: 'tf2', name: 'Misollar.png', size: '180 KB', type: 'image', url: 'https://placehold.co/640x360/3D7DF6/fff?text=Misollar' },
    ],
  },
  {
    id: 'p2',
    homeworkId: 'hw5',
    subjectId: 't5',
    topic: 'Amir Temur davri',
    title: 'Referat: Temur imperiyasi',
    xp: 70,
    deadline: '2026-09-20T20:00:00',
    status: 'checked',
    score: 92,
    keywords: ['referat', 'tarix'],
    statementHtml: '<p>Amir Temur davri haqida 2–3 sahifalik referat tayyorlang. Asosiy voqealar, davlat boshqaruvi va madaniyat.</p>',
    teacherFiles: [
      { id: 'tf3', name: 'Mavzu_rejasi.docx', size: '52 KB', type: 'doc', url: '#' },
    ],
  },
  {
    id: 'p3',
    homeworkId: null,
    subjectId: 't1',
    topic: 'Geometriya',
    title: 'Uchburchak yuzasini isbotlash',
    xp: 60,
    deadline: '2026-09-26T20:00:00',
    status: 'not_started',
    keywords: ['isbot', 'yuza'],
    statementHtml: '<p>Uchburchak yuzasini Geron formulasi orqali isbotlang va chizma bilan birga yuklang.</p>',
    teacherFiles: [],
  },
];

export function getPracticalByHomeworkId(hwId) {
  return PRACTICAL_TASKS.find((p) => p.homeworkId === hwId) || PRACTICAL_TASKS.find((p) => p.id === hwId);
}
export function getPracticalById(id) {
  return PRACTICAL_TASKS.find((p) => p.id === id || p.homeworkId === id);
}


export const CLASSMATES = [
  { name: 'Aziza Karimova', xp: 6120, rank: 1 },
  { name: 'Jasur Toshmatov', xp: 5540, rank: 2 },
  { name: 'Dilnoza Rahimova', xp: 5010, rank: 3 },
  { name: 'Sardor Aliyev', xp: 4820, rank: 4, me: true },
  { name: 'Bekzod Umarov', xp: 4300, rank: 5 },
  { name: 'Malika Yusupova', xp: 3990, rank: 6 },
  { name: 'Otabek Nazarov', xp: 3610, rank: 7 },
  { name: 'Nigora Sobirova', xp: 3200, rank: 8 },
];

export const CLASS_INFO = {
  name: '11-A', grade: 11, students: 28,
  rahbar: 'Kamola Rashidova', year: '2025–2026',
};

// DTM (grades 9-11)
export const DTM_MANDATORY = [
  { id: 't4', name: 'Ona tili', q: 10, w: 1.1 },
  { id: 't1', name: 'Matematika', q: 10, w: 1.1 },
  { id: 't5', name: 'O‘zbekiston tarixi', q: 10, w: 1.1 },
];
export const DTM_BLOCKS = { primary: { q: 30, w: 3.1 }, secondary: { q: 30, w: 2.1 } };
export const DTM_RESULTS = [
  { id: 'd1', date: '2026-09-14T10:00:00', total: 154.3, max: 189, primary: 'Matematika', secondary: 'Fizika' },
  { id: 'd2', date: '2026-08-30T10:00:00', total: 141.7, max: 189, primary: 'Matematika', secondary: 'Fizika' },
  { id: 'd3', date: '2026-08-12T10:00:00', total: 132.0, max: 189, primary: 'Matematika', secondary: 'Fizika' },
];

export const levelPct = () => Math.min(100, Math.round((USER.xp % USER.levelXp) / USER.levelXp * 100)) || Math.round(USER.xp / USER.levelXp * 100);
