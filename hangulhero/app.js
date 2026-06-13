// ==========================================================================
// 1. Stage Data & SVG Assets
// ==========================================================================
const STAGE_DATA = [
    {
        letter: 'ㄱ',
        label: '기역 배우기',
        word: '구두',
        options: ['ㄴ', 'ㄱ', 'ㄷ'],
        // Cute red shoe SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <path d="M20 70 L40 70 C50 70, 55 50, 75 50 L85 50 C90 50, 90 70, 85 75 L70 80 L30 80 C20 80, 15 75, 20 70 Z" fill="#ff5252" stroke="#d32f2f" stroke-width="3"/>
            <circle cx="75" cy="50" r="4" fill="#ffd54f"/>
            <rect x="25" y="70" width="10" height="15" rx="3" fill="#ffe082" stroke="#ffb300" stroke-width="2"/>
            <path d="M45 68 C45 68, 50 60, 60 62" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
        </svg>`
    },
    {
        letter: 'ㄴ',
        label: '니은 배우기',
        word: '나비',
        options: ['ㄹ', 'ㅁ', 'ㄴ'],
        // Colorful butterfly SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <path d="M50 35 C40 10, 15 15, 25 45 C15 75, 45 75, 50 55 C55 75, 85 75, 75 45 C85 15, 60 10, 50 35 Z" fill="#ffb74d" stroke="#f57c00" stroke-width="3"/>
            <path d="M50 35 C45 20, 25 25, 35 48 C25 70, 48 70, 50 55 C52 70, 75 70, 65 48 C75 25, 55 20, 50 35 Z" fill="#fff176" opacity="0.8"/>
            <rect x="47" y="25" width="6" height="40" rx="3" fill="#8d6e63"/>
            <circle cx="50" cy="22" r="4" fill="#8d6e63"/>
            <path d="M48 20 C42 12, 38 15, 38 15" stroke="#8d6e63" stroke-width="2" stroke-linecap="round" fill="none"/>
            <path d="M52 20 C58 12, 62 15, 62 15" stroke="#8d6e63" stroke-width="2" stroke-linecap="round" fill="none"/>
            <circle cx="35" cy="35" r="4" fill="#ff4081"/>
            <circle cx="65" cy="35" r="4" fill="#ff4081"/>
        </svg>`
    },
    {
        letter: 'ㄷ',
        label: '디귿 배우기',
        word: '당근',
        options: ['ㄷ', 'ㅂ', 'ㅅ'],
        // Cute carrot SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <path d="M50 85 C45 70, 30 40, 32 30 C34 20, 66 20, 68 30 C70 40, 55 70, 50 85 Z" fill="#ff9100" stroke="#f57c00" stroke-width="3"/>
            <!-- Leaves -->
            <path d="M42 22 C35 10, 48 5, 48 20 C48 5, 60 10, 52 22" fill="#66bb6a" stroke="#388e3c" stroke-width="2"/>
            <path d="M50 22 C50 8, 58 8, 54 22" fill="#81c784" stroke="#388e3c" stroke-width="2"/>
            <!-- Carrot details -->
            <path d="M40 40 L48 41" stroke="#e65100" stroke-width="2" stroke-linecap="round"/>
            <path d="M58 50 L50 51" stroke="#e65100" stroke-width="2" stroke-linecap="round"/>
            <path d="M42 60 L50 61" stroke="#e65100" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    {
        letter: 'ㄹ',
        label: '리을 배우기',
        word: '로봇',
        options: ['ㅇ', 'ㅈ', 'ㄹ'],
        // Cute toy robot SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <!-- Head -->
            <rect x="35" y="25" width="30" height="22" rx="4" fill="#4dd0e1" stroke="#0097a7" stroke-width="3"/>
            <circle cx="43" cy="34" r="3" fill="#fff"/>
            <circle cx="43" cy="34" r="1.5" fill="#000"/>
            <circle cx="57" cy="34" r="3" fill="#fff"/>
            <circle cx="57" cy="34" r="1.5" fill="#000"/>
            <rect x="44" y="40" width="12" height="3" rx="1.5" fill="#ff5252"/>
            <rect x="48" y="18" width="4" height="7" fill="#b0bec5"/>
            <circle cx="50" cy="16" r="3" fill="#ffb74d"/>
            <!-- Neck -->
            <rect x="46" y="47" width="8" height="5" fill="#b0bec5"/>
            <!-- Body -->
            <rect x="28" y="52" width="44" height="30" rx="5" fill="#4fc3f7" stroke="#0288d1" stroke-width="3"/>
            <rect x="36" y="58" width="28" height="12" rx="2" fill="#fff" stroke="#0288d1" stroke-width="2"/>
            <circle cx="42" cy="64" r="2" fill="#ff5252"/>
            <circle cx="50" cy="64" r="2" fill="#4caf50"/>
            <circle cx="58" cy="64" r="2" fill="#ffeb3b"/>
        </svg>`
    },
    {
        letter: 'ㅁ',
        label: '미음 배우기',
        word: '모자',
        options: ['ㅁ', 'ㅂ', 'ㅅ'],
        // Cute wizard hat SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <path d="M50 15 L25 65 L75 65 Z" fill="#7986cb" stroke="#303f9f" stroke-width="3" stroke-linejoin="round"/>
            <ellipse cx="50" cy="68" rx="38" ry="10" fill="#5c6bc0" stroke="#303f9f" stroke-width="3"/>
            <path d="M30 63 C40 60, 60 60, 70 63 L69 66 C59 63, 41 63, 31 66 Z" fill="#ff8a80"/>
            <!-- Stars on Hat -->
            <polygon points="50,28 52,33 57,33 53,36 55,41 50,38 45,41 47,36 43,33 48,33" fill="#fff176"/>
            <polygon points="38,48 40,51 44,51 41,53 42,57 38,55 34,57 35,53 32,51 36,51" fill="#fff176" transform="scale(0.8) translate(8, 10)"/>
        </svg>`
    },
    {
        letter: 'ㅂ',
        label: '비읍 배우기',
        word: '버스',
        options: ['ㅇ', 'ㅂ', 'ㅋ'],
        // Cute yellow school bus SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <rect x="15" y="25" width="70" height="42" rx="8" fill="#ffd54f" stroke="#ffb300" stroke-width="3"/>
            <rect x="70" y="45" width="17" height="22" rx="3" fill="#ffd54f" stroke="#ffb300" stroke-width="3"/>
            <!-- Windows -->
            <rect x="22" y="32" width="14" height="14" rx="2" fill="#e0f7fa" stroke="#b2ebf2" stroke-width="2"/>
            <rect x="42" y="32" width="14" height="14" rx="2" fill="#e0f7fa" stroke="#b2ebf2" stroke-width="2"/>
            <rect x="62" y="32" width="14" height="14" rx="2" fill="#e0f7fa" stroke="#b2ebf2" stroke-width="2"/>
            <!-- Wheels -->
            <circle cx="30" cy="70" r="12" fill="#455a64" stroke="#37474f" stroke-width="3"/>
            <circle cx="30" cy="70" r="4" fill="#cfd8dc"/>
            <circle cx="70" cy="70" r="12" fill="#455a64" stroke="#37474f" stroke-width="3"/>
            <circle cx="70" cy="70" r="4" fill="#cfd8dc"/>
            <!-- Light -->
            <polygon points="85,50 93,47 93,53" fill="#ffeb3b"/>
        </svg>`
    },
    {
        letter: 'ㅅ',
        label: '시옷 배우기',
        word: '사과',
        options: ['ㅂ', 'ㅅ', 'ㅈ'],
        // Red apple SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <path d="M 50 25 C 25 25, 20 65, 45 75 C 48 76, 52 76, 55 75 C 80 65, 75 25, 50 25 Z" fill="#ff4d4d" stroke="#c62828" stroke-width="3"/>
            <path d="M 50 25 Q 60 12, 63 15 Q 61 22, 50 25 Z" fill="#4caf50" stroke="#2e7d32" stroke-width="2"/>
            <path d="M 50 25 Q 48 15, 52 10" stroke="#795548" stroke-width="3" stroke-linecap="round" fill="none"/>
            <circle cx="38" cy="45" r="3" fill="#fff" opacity="0.6"/>
        </svg>`
    },
    {
        letter: 'ㅇ',
        label: '이응 배우기',
        word: '안경',
        options: ['ㅇ', 'ㅎ', 'ㅁ'],
        // Blue glasses SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <circle cx="32" cy="50" r="16" fill="#e0f7fa" stroke="#00bcd4" stroke-width="3"/>
            <circle cx="68" cy="50" r="16" fill="#e0f7fa" stroke="#00bcd4" stroke-width="3"/>
            <path d="M 48 48 Q 50 44, 52 48" stroke="#00bcd4" stroke-width="3" stroke-linecap="round" fill="none"/>
            <path d="M 16 50 Q 8 48, 8 40" stroke="#00bcd4" stroke-width="3" stroke-linecap="round" fill="none"/>
            <path d="M 84 50 Q 92 48, 92 40" stroke="#00bcd4" stroke-width="3" stroke-linecap="round" fill="none"/>
        </svg>`
    },
    {
        letter: 'ㅈ',
        label: '지읒 배우기',
        word: '자동차',
        options: ['ㅈ', 'ㅊ', 'ㅅ'],
        // Blue car SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <path d="M 15 65 L 15 52 Q 15 48, 22 48 L 32 48 Q 38 32, 50 32 L 72 32 Q 78 32, 82 45 L 85 52 Q 85 65, 80 65 Z" fill="#42a5f5" stroke="#1565c0" stroke-width="3"/>
            <path d="M 36 48 L 48 48 L 48 38 L 42 38 Z" fill="#e0f7fa"/>
            <path d="M 52 48 L 72 48 L 68 38 L 52 38 Z" fill="#e0f7fa"/>
            <circle cx="32" cy="65" r="10" fill="#37474f" stroke="#212121" stroke-width="2"/>
            <circle cx="32" cy="65" r="4" fill="#cfd8dc"/>
            <circle cx="68" cy="65" r="10" fill="#37474f" stroke="#212121" stroke-width="2"/>
            <circle cx="68" cy="65" r="4" fill="#cfd8dc"/>
        </svg>`
    },
    {
        letter: 'ㅊ',
        label: '치읓 배우기',
        word: '치즈',
        options: ['ㅈ', 'ㅊ', 'ㅋ'],
        // Cheese slice SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <polygon points="15,75 85,75 50,25" fill="#ffd54f" stroke="#ffb300" stroke-width="3" stroke-linejoin="round"/>
            <circle cx="35" cy="60" r="6" fill="#ffa000"/>
            <circle cx="60" cy="55" r="8" fill="#ffa000"/>
            <circle cx="50" cy="40" r="5" fill="#ffa000"/>
            <circle cx="30" cy="70" r="3" fill="#ffb300"/>
        </svg>`
    },
    {
        letter: 'ㅋ',
        label: '키읔 배우기',
        word: '코끼리',
        options: ['ㄱ', 'ㅋ', 'ㅌ'],
        // Elephant SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <circle cx="48" cy="52" r="22" fill="#90caf9" stroke="#1e88e5" stroke-width="3"/>
            <ellipse cx="26" cy="46" rx="10" ry="14" fill="#64b5f6" stroke="#1e88e5" stroke-width="2"/>
            <path d="M 68 50 Q 82 50, 80 62 Q 78 68, 70 65" stroke="#90caf9" stroke-width="8" stroke-linecap="round" fill="none"/>
            <path d="M 68 50 Q 82 50, 80 62 Q 78 68, 70 65" stroke="#1e88e5" stroke-width="2" stroke-linecap="round" fill="none"/>
            <circle cx="56" cy="44" r="2.5" fill="#212121"/>
            <rect x="36" y="70" width="8" height="12" rx="2" fill="#90caf9" stroke="#1e88e5" stroke-width="2"/>
            <rect x="52" y="70" width="8" height="12" rx="2" fill="#90caf9" stroke="#1e88e5" stroke-width="2"/>
        </svg>`
    },
    {
        letter: 'ㅌ',
        label: '티읕 배우기',
        word: '토끼',
        options: ['ㄷ', 'ㅌ', 'ㅍ'],
        // Bunny head SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <ellipse cx="40" cy="22" rx="6" ry="18" fill="#fff" stroke="#ff8a80" stroke-width="2"/>
            <ellipse cx="40" cy="22" rx="3" ry="12" fill="#ffcdd2"/>
            <ellipse cx="60" cy="22" rx="6" ry="18" fill="#fff" stroke="#ff8a80" stroke-width="2"/>
            <ellipse cx="60" cy="22" rx="3" ry="12" fill="#ffcdd2"/>
            <circle cx="50" cy="54" r="20" fill="#fff" stroke="#ff8a80" stroke-width="2"/>
            <circle cx="43" cy="50" r="2.5" fill="#37474f"/>
            <circle cx="57" cy="50" r="2.5" fill="#37474f"/>
            <polygon points="50,57 48,55 52,55" fill="#ff8a80"/>
            <path d="M 48 60 Q 50 62 50 60 Q 50 62 52 60" stroke="#ff8a80" stroke-width="1.5" fill="none"/>
            <ellipse cx="36" cy="56" rx="3" ry="1.5" fill="#ff8a80" opacity="0.6"/>
            <ellipse cx="64" cy="56" rx="3" ry="1.5" fill="#ff8a80" opacity="0.6"/>
        </svg>`
    },
    {
        letter: 'ㅍ',
        label: '피읍 배우기',
        word: '피자',
        options: ['ㅂ', 'ㅍ', 'ㅎ'],
        // Pizza slice SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <path d="M 50 15 L 82 72 A 38 38 0 0 1 18 72 Z" fill="#ffb74d" stroke="#f57c00" stroke-width="3" stroke-linejoin="round"/>
            <path d="M 50 22 L 76 66 A 30 30 0 0 1 24 66 Z" fill="#ffe082" stroke="#ffb300" stroke-width="2"/>
            <circle cx="50" cy="46" r="5" fill="#ff5252"/>
            <circle cx="38" cy="58" r="5" fill="#ff5252"/>
            <circle cx="60" cy="58" r="5" fill="#ff5252"/>
        </svg>`
    },
    {
        letter: 'ㅎ',
        label: '히읗 배우기',
        word: '호랑이',
        options: ['ㅇ', 'ㅎ', 'ㅊ'],
        // Tiger head SVG
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <circle cx="34" cy="38" r="10" fill="#ffa726" stroke="#fb8c00" stroke-width="2"/>
            <circle cx="34" cy="38" r="5" fill="#ffe0b2"/>
            <circle cx="66" cy="38" r="10" fill="#ffa726" stroke="#fb8c00" stroke-width="2"/>
            <circle cx="66" cy="38" r="5" fill="#ffe0b2"/>
            <circle cx="50" cy="58" r="22" fill="#ffb74d" stroke="#fb8c00" stroke-width="3"/>
            <path d="M 28 58 L 38 58 M 72 58 L 62 58 M 50 36 L 50 44" stroke="#37474f" stroke-width="3" stroke-linecap="round"/>
            <circle cx="42" cy="52" r="3" fill="#212121"/>
            <circle cx="58" cy="52" r="3" fill="#212121"/>
            <ellipse cx="50" cy="64" rx="6" ry="4" fill="#fff"/>
            <polygon points="50,62 48,60 52,60" fill="#37474f"/>
        </svg>`
    }
];

// SVG Letter Path Coordinates (Approximate font paths for guidelines)
const LETTER_PATHS = {
    // Consonants
    'ㄱ': 'M 100 110 L 200 110 L 200 240',
    'ㄴ': 'M 100 110 L 100 240 L 200 240',
    'ㄷ': 'M 200 110 L 100 110 L 100 240 L 200 240',
    'ㄹ': 'M 100 110 L 200 110 L 200 175 L 100 175 L 100 240 L 200 240',
    'ㅁ': 'M 100 110 L 200 110 L 200 240 L 100 240 Z M 100 110 L 100 240',
    'ㅂ': 'M 100 100 L 100 250 L 200 250 L 200 100 M 100 175 L 200 175',
    'ㅅ': 'M 150 110 L 100 240 M 130 160 L 200 240',
    'ㅇ': 'M 150 105 A 70 70 0 1 0 150 245 A 70 70 0 1 0 150 105 Z',
    'ㅈ': 'M 100 110 L 200 110 M 150 110 L 100 240 M 135 170 L 200 240',
    'ㅊ': 'M 150 80 L 150 105 M 100 115 L 200 115 M 150 115 L 100 240 M 135 170 L 200 240',
    'ㅋ': 'M 100 110 L 200 110 L 200 240 M 100 175 L 200 175',
    'ㅌ': 'M 200 110 L 100 110 L 100 240 L 200 240 M 100 175 L 180 175',
    'ㅍ': 'M 100 110 L 200 110 M 130 110 L 130 240 M 170 110 L 170 240 M 100 240 L 200 240',
    'ㅎ': 'M 150 75 L 150 95 M 100 110 L 200 110 M 150 130 A 50 50 0 1 0 150 230 A 50 50 0 1 0 150 130 Z',
    
    // Vowels
    'ㅏ': 'M 130 100 L 130 250 M 130 175 L 180 175',
    'ㅑ': 'M 120 100 L 120 250 M 120 150 L 170 150 M 120 200 L 170 200',
    'ㅓ': 'M 120 175 L 170 175 M 170 100 L 170 250',
    'ㅕ': 'M 120 150 L 170 150 M 120 200 L 170 200 M 170 100 L 170 250',
    'ㅗ': 'M 150 120 L 150 175 M 100 175 L 200 175',
    'ㅛ': 'M 135 120 L 135 175 M 165 120 L 165 175 M 100 175 L 200 175',
    'ㅜ': 'M 100 120 L 200 120 M 150 120 L 150 220',
    'ㅠ': 'M 100 120 L 200 120 M 135 120 L 135 220 M 165 120 L 165 220',
    'ㅡ': 'M 100 175 L 200 175',
    'ㅣ': 'M 150 100 L 150 250'
};

const VOWEL_DATA = [
    {
        letter: 'ㅏ',
        label: '아 배우기',
        word: '아기',
        options: ['ㅓ', 'ㅏ', 'ㅗ'],
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <rect x="35" y="40" width="30" height="38" rx="5" fill="#e0f7fa" stroke="#00acc1" stroke-width="3"/>
            <path d="M35 45 L65 45" stroke="#00acc1" stroke-width="2"/>
            <rect x="42" y="26" width="16" height="14" rx="2" fill="#ffb74d" stroke="#f57c00" stroke-width="2"/>
            <path d="M46 16 L54 16 L52 26 L48 26 Z" fill="#ff8a80"/>
            <line x1="40" y1="52" x2="48" y2="52" stroke="#b2ebf2" stroke-width="2"/>
            <line x1="40" y1="60" x2="48" y2="60" stroke="#b2ebf2" stroke-width="2"/>
            <line x1="40" y1="68" x2="48" y2="68" stroke="#b2ebf2" stroke-width="2"/>
        </svg>`
    },
    {
        letter: 'ㅑ',
        label: '야 배우기',
        word: '야구',
        options: ['ㅛ', 'ㅑ', 'ㅠ'],
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <path d="M22 68 C22 45, 32 30, 48 30 C58 30, 68 40, 68 55 C68 68, 55 75, 40 75 C28 75, 22 72, 22 68 Z" fill="#b08968" stroke="#7f5539" stroke-width="3"/>
            <path d="M28 50 C28 40, 36 38, 44 44" stroke="#7f5539" stroke-width="2" fill="none"/>
            <circle cx="68" cy="68" r="14" fill="#ffffff" stroke="#cfd8dc" stroke-width="3"/>
            <path d="M58 62 Q66 68 62 78" stroke="#ff5252" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            <path d="M78 62 Q70 68 74 78" stroke="#ff5252" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        </svg>`
    },
    {
        letter: 'ㅓ',
        label: '어 배우기',
        word: '어머니',
        options: ['ㅕ', 'ㅓ', 'ㅏ'],
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <path d="M50 78 C50 78, 18 52, 18 36 C18 20, 42 16, 50 32 C58 16, 82 20, 82 36 C82 52, 50 78, 50 78 Z" fill="#ff8a80" stroke="#ff5252" stroke-width="3"/>
            <path d="M38 34 Q50 24 62 34" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
            <path d="M42 46 Q50 52 58 46" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
        </svg>`
    },
    {
        letter: 'ㅕ',
        label: '여 배우기',
        word: '여우',
        options: ['ㅕ', 'ㅑ', 'ㅛ'],
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <polygon points="20,50 15,20 42,40" fill="#ff7043" stroke="#d84315" stroke-width="2"/>
            <polygon points="23,45 18,25 36,38" fill="#ffccbc"/>
            <polygon points="80,50 85,20 58,40" fill="#ff7043" stroke="#d84315" stroke-width="2"/>
            <polygon points="77,45 82,25 64,38" fill="#ffccbc"/>
            <path d="M20 50 C20 75, 80 75, 80 50 C80 38, 20 38, 20 50 Z" fill="#ff7043" stroke="#d84315" stroke-width="3"/>
            <path d="M22 55 C26 70, 45 72, 50 62 C55 72, 74 70, 78 55" fill="#ffffff" opacity="0.9"/>
            <circle cx="36" cy="48" r="3" fill="#212121"/>
            <circle cx="64" cy="48" r="3" fill="#212121"/>
            <circle cx="50" cy="58" r="4" fill="#212121"/>
        </svg>`
    },
    {
        letter: 'ㅗ',
        label: '오 배우기',
        word: '오이',
        options: ['ㅜ', 'ㅗ', 'ㅡ'],
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <path d="M25 35 C35 25, 65 55, 75 65 C85 75, 75 85, 65 75 C55 65, 15 45, 25 35 Z" fill="#81c784" stroke="#2e7d32" stroke-width="3"/>
            <polygon points="76,66 84,60 88,68 84,76 76,72" fill="#ffd54f" stroke="#f57c00" stroke-width="1.5"/>
            <circle cx="36" cy="44" r="2" fill="#2e7d32"/>
            <circle cx="46" cy="50" r="2" fill="#2e7d32"/>
            <circle cx="56" cy="58" r="2" fill="#2e7d32"/>
            <circle cx="40" cy="56" r="2" fill="#2e7d32"/>
        </svg>`
    },
    {
        letter: 'ㅛ',
        label: 'ㅛ 배우기',
        word: '요술',
        options: ['ㅠ', 'ㅛ', 'ㅑ'],
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <line x1="25" y1="75" x2="60" y2="40" stroke="#795548" stroke-width="6" stroke-linecap="round"/>
            <line x1="25" y1="75" x2="60" y2="40" stroke="#ffe082" stroke-width="2" stroke-linecap="round"/>
            <polygon points="65,15 69,27 81,27 71,34 75,46 65,39 55,46 59,34 49,27 61,27" fill="#fff176" stroke="#f57c00" stroke-width="3" stroke-linejoin="round"/>
            <circle cx="82" cy="18" r="2" fill="#fff176"/>
            <circle cx="50" cy="18" r="2" fill="#fff176"/>
            <circle cx="80" cy="42" r="2" fill="#fff176"/>
            <circle cx="48" cy="40" r="3" fill="#ff8a80"/>
        </svg>`
    },
    {
        letter: 'ㅜ',
        label: '우 배우기',
        word: '우산',
        options: ['ㅡ', 'ㅜ', 'ㅗ'],
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <path d="M50 50 L50 78 A 6 6 0 0 1 38 78" stroke="#795548" stroke-width="4" stroke-linecap="round" fill="none"/>
            <path d="M15 50 C15 25, 85 25, 85 50 C75 52, 65 44, 50 50 C35 44, 25 52, 15 50 Z" fill="#4fc3f7" stroke="#0288d1" stroke-width="3"/>
            <path d="M50 22 C42 32, 40 45, 38 50" stroke="#0288d1" stroke-width="2" fill="none"/>
            <path d="M50 22 C58 32, 60 45, 62 50" stroke="#0288d1" stroke-width="2" fill="none"/>
            <rect x="48" y="15" width="4" height="7" fill="#795548"/>
        </svg>`
    },
    {
        letter: 'ㅠ',
        label: '유 배우기',
        word: '유리컵',
        options: ['ㅛ', 'ㅠ', 'ㅕ'],
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <path d="M30 25 L36 70 C37 75, 42 78, 48 78 L52 78 C58 78, 63 75, 64 70 L70 25 Z" fill="#e0f7fa" stroke="#00acc1" stroke-width="3" opacity="0.8"/>
            <path d="M33 45 L36 70 C37 73, 40 75, 45 75 L55 75 C60 75, 63 73, 64 70 L67 45 Z" fill="#ff8a80"/>
            <line x1="48" y1="18" x2="62" y2="60" stroke="#ffd54f" stroke-width="3" stroke-linecap="round"/>
            <line x1="48" y1="18" x2="40" y2="12" stroke="#ffd54f" stroke-width="3" stroke-linecap="round"/>
        </svg>`
    },
    {
        letter: 'ㅡ',
        label: '으 배우기',
        word: '은행잎',
        options: ['ㅣ', 'ㅡ', 'ㅜ'],
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <path d="M50 78 L50 68 C35 62, 18 52, 22 35 C28 25, 48 38, 50 44 C52 38, 72 25, 78 35 C82 52, 65 62, 50 68 Z" fill="#ffeb3b" stroke="#f57c00" stroke-width="3"/>
            <path d="M50 60 C42 50, 32 44, 28 40" stroke="#f57c00" stroke-width="1.5" fill="none"/>
            <path d="M50 60 C58 50, 68 44, 72 40" stroke="#f57c00" stroke-width="1.5" fill="none"/>
            <path d="M50 52 L50 44" stroke="#f57c00" stroke-width="1.5" fill="none"/>
        </svg>`
    },
    {
        letter: 'ㅣ',
        label: '이 배우기',
        word: '이불',
        options: ['ㅡ', 'ㅣ', 'ㅏ'],
        svg: `<svg viewBox="0 0 100 100" class="quiz-target-image">
            <rect x="15" y="60" width="70" height="15" fill="#8d6e63" stroke="#5d4037" stroke-width="3"/>
            <rect x="22" y="42" width="22" height="14" rx="4" fill="#ffeb3b" stroke="#f57c00" stroke-width="2"/>
            <rect x="42" y="48" width="40" height="26" rx="4" fill="#a5d6a7" stroke="#2e7d32" stroke-width="2"/>
            <line x1="50" y1="48" x2="50" y2="74" stroke="#2e7d32" stroke-width="2"/>
            <line x1="60" y1="48" x2="60" y2="74" stroke="#2e7d32" stroke-width="2"/>
            <line x1="70" y1="48" x2="70" y2="74" stroke="#2e7d32" stroke-width="2"/>
        </svg>`
    }
];

// Cute Bunny Mascot SVG
const BUNNY_SVG = `
<svg viewBox="0 0 100 100" style="width:100%; height:100%;">
    <!-- Ears -->
    <ellipse cx="40" cy="25" rx="7" ry="22" fill="#ffffff" stroke="#ff8a80" stroke-width="2" transform="rotate(-10, 40, 25)"/>
    <ellipse cx="40" cy="25" rx="4" ry="16" fill="#ffcdd2" transform="rotate(-10, 40, 25)"/>
    <ellipse cx="60" cy="25" rx="7" ry="22" fill="#ffffff" stroke="#ff8a80" stroke-width="2" transform="rotate(10, 60, 25)"/>
    <ellipse cx="60" cy="25" rx="4" ry="16" fill="#ffcdd2" transform="rotate(10, 60, 25)"/>
    <!-- Body -->
    <ellipse cx="50" cy="75" rx="22" ry="18" fill="#ffffff" stroke="#ff8a80" stroke-width="2"/>
    <circle cx="50" cy="65" r="4" fill="#ff8a80"/> <!-- Bowtie button -->
    <!-- Head -->
    <circle cx="50" cy="48" r="20" fill="#ffffff" stroke="#ff8a80" stroke-width="2"/>
    <!-- Eyes -->
    <circle cx="43" cy="44" r="2.5" fill="#37474f"/>
    <circle cx="57" cy="44" r="2.5" fill="#37474f"/>
    <!-- Blush -->
    <ellipse cx="38" cy="49" rx="3" ry="1.5" fill="#ff8a80" opacity="0.6"/>
    <ellipse cx="62" cy="49" rx="3" ry="1.5" fill="#ff8a80" opacity="0.6"/>
    <!-- Nose/Mouth -->
    <polygon points="50,47 48,45 52,45" fill="#ff8a80"/>
    <path d="M 48 50 Q 50 52 50 50 Q 50 52 52 50" stroke="#ff8a80" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</svg>
`;

// ==========================================================================
// 2. Application State
// ==========================================================================
let state = {
    unlockedConsonantStage: 1,
    unlockedVowelStage: 1,
    currentMode: 'menu', // 'menu', 'consonants', 'vowels', 'combine'
    currentStageIdx: 0,
    jewels: 0,
    isDrawing: false,
    drawnPixelsCount: 0,
    canvasCleared: true,
    canvasThresholdReached: false,
    
    // Letter Maker State
    combineCho: null,
    combineJung: null
};

// ==========================================================================
// 3. DOM Elements Cache
// ==========================================================================
const DOM = {
    // Containers
    appContainer: document.getElementById('app-container'),
    
    // Screens
    screenMenu: document.getElementById('screen-menu'),
    screenHub: document.getElementById('screen-hub'),
    screenLearn: document.getElementById('screen-learn'),
    screenQuiz: document.getElementById('screen-quiz'),
    screenCombine: document.getElementById('screen-combine'),
    overlayReward: document.getElementById('overlay-reward'),
    overlayStickers: document.getElementById('overlay-stickers'),
    
    // Global Header Items
    jewelCountText: document.getElementById('jewel-count'),
    btnBackToHub: document.getElementById('btn-back-to-hub'),
    logoTitle: document.getElementById('logo-title'),
    
    // Menu Screen Buttons
    btnMenuConsonants: document.getElementById('btn-menu-consonants'),
    btnMenuVowels: document.getElementById('btn-menu-vowels'),
    btnMenuCombine: document.getElementById('btn-menu-combine'),
    
    // Combine Screen Elements
    combinedResultText: document.getElementById('combined-result-text'),
    slotConsonant: document.getElementById('slot-consonant'),
    slotVowel: document.getElementById('slot-vowel'),
    btnClearCombine: document.getElementById('btn-clear-combine'),
    poolConsonants: document.getElementById('pool-consonants'),
    poolVowels: document.getElementById('pool-vowels'),
    
    // Hub Elements
    stagesLayer: document.getElementById('stages-layer'),
    
    // Learn Screen Elements
    currentLetterDisplay: document.getElementById('current-letter'),
    guideLetterPath: document.getElementById('guide-letter-path'),
    guideLetterCore: document.getElementById('guide-letter-core'),
    canvas: document.getElementById('writing-canvas'),
    btnResetCanvas: document.getElementById('btn-reset'),
    btnHintCanvas: document.getElementById('btn-hint'),
    btnNextToQuiz: document.getElementById('btn-next'),
    
    // Quiz Screen Elements
    quizTargetArea: document.getElementById('quiz-target-area'),
    quizDropSlot: document.getElementById('quiz-drop-slot'),
    quizOptionsArea: document.getElementById('quiz-options-area'),
    
    // Reward Popup Elements
    rewardTitle: document.getElementById('reward-title'),
    jewelsRewardDisplay: document.getElementById('jewels-reward-display'),
    btnCollectReward: document.getElementById('btn-collect'),
    
    // Sticker Book Popup
    btnOpenStickers: document.getElementById('btn-open-stickers'),
    btnCloseStickers: document.getElementById('btn-close-stickers'),
    stickerGrid: document.getElementById('sticker-grid'),
    
    // Characters
    characterArea: document.getElementById('character-area'),
    bunnyCharacter: document.getElementById('bunny-character'),
    
    // Audio Context simulation (using synthesis or visual cues, since web audio policy requires gesture)
    audioFeedback: {
        correct: () => playSound(880, 'sine', 0.15, 0.15), // High pitch bip-bip
        incorrect: () => playSound(220, 'triangle', 0.25, 0.05), // Low buzz
        pop: () => playSound(600, 'sine', 0.08, 0.05), // Soft pop
        cheer: () => {
            playSound(523.25, 'sine', 0.1, 0.05); // C5
            setTimeout(() => playSound(659.25, 'sine', 0.1, 0.05), 100); // E5
            setTimeout(() => playSound(783.99, 'sine', 0.15, 0.1), 200); // G5
        }
    }
};

// Canvas drawing context
const ctx = DOM.canvas.getContext('2d');

// Setup Mascot Bunny
DOM.bunnyCharacter.innerHTML = BUNNY_SVG;

// Load initial state from LocalStorage if exists
function loadSavedState() {
    const saved = localStorage.getItem('hangul_hero_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.unlockedConsonantStage = parsed.unlockedConsonantStage || 1;
            state.unlockedVowelStage = parsed.unlockedVowelStage || 1;
            state.jewels = parsed.jewels || 0;
            updateJewelUI();
        } catch(e) {
            console.error('Error loading saved state', e);
        }
    }
}

function saveCurrentState() {
    localStorage.setItem('hangul_hero_state', JSON.stringify({
        unlockedConsonantStage: state.unlockedConsonantStage,
        unlockedVowelStage: state.unlockedVowelStage,
        jewels: state.jewels
    }));
}

// Simple synthesizer sound function
let audioCtx = null;
function playSound(frequency, type, duration, delay) {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
            
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        }, delay * 1000);
    } catch(e) {
        // Fallback for browsers blocking audio or headless tests
        console.log(`Audio Fallback: freq=${frequency}, dur=${duration}`);
    }
}

// ==========================================================================
// 4. Navigation & Mascot Control
// ==========================================================================
function showScreen(screenId) {
    DOM.audioFeedback.pop();
    
    // Hide all screens
    DOM.screenMenu.classList.remove('active');
    DOM.screenHub.classList.remove('active');
    DOM.screenLearn.classList.remove('active');
    DOM.screenQuiz.classList.remove('active');
    DOM.screenCombine.classList.remove('active');
    
    // Handle back button on top app bar and screen activation
    if (screenId === 'menu') {
        state.currentMode = 'menu';
        DOM.screenMenu.classList.add('active');
        DOM.btnBackToHub.style.display = 'none';
        DOM.characterArea.classList.remove('active');
    } else if (screenId === 'hub') {
        DOM.screenHub.classList.add('active');
        DOM.btnBackToHub.style.display = 'flex'; // Show to return to main menu
        DOM.characterArea.classList.remove('active');
        renderHubMap();
    } else if (screenId === 'learn') {
        DOM.screenLearn.classList.add('active');
        DOM.btnBackToHub.style.display = 'flex';
        DOM.characterArea.classList.add('active');
        triggerMascot('cheer');
        setupLearnScreen();
    } else if (screenId === 'quiz') {
        DOM.screenQuiz.classList.add('active');
        DOM.btnBackToHub.style.display = 'flex';
        DOM.characterArea.classList.add('active');
        triggerMascot('cheer');
        setupQuizScreen();
    } else if (screenId === 'combine') {
        state.currentMode = 'combine';
        DOM.screenCombine.classList.add('active');
        DOM.btnBackToHub.style.display = 'flex';
        DOM.characterArea.classList.remove('active');
        setupCombineScreen();
    }
}

function triggerMascot(action) {
    DOM.bunnyCharacter.className = 'bunny-character';
    if (action === 'dance') {
        DOM.bunnyCharacter.classList.add('dance');
    } else if (action === 'cheer') {
        DOM.bunnyCharacter.classList.add('cheer');
        setTimeout(() => {
            DOM.bunnyCharacter.classList.remove('cheer');
        }, 1200);
    }
}

function updateJewelUI() {
    DOM.jewelCountText.textContent = state.jewels;
}

// ==========================================================================
// A. Main Hub Map Rendering
// ==========================================================================
function renderHubMap() {
    DOM.stagesLayer.innerHTML = '';
    
    const dataset = state.currentMode === 'consonants' ? STAGE_DATA : VOWEL_DATA;
    const unlockedLimit = state.currentMode === 'consonants' ? state.unlockedConsonantStage : state.unlockedVowelStage;
    
    // Dynamic logo title based on mode
    DOM.logoTitle.innerHTML = state.currentMode === 'consonants' ? '자음 모험 🌟' : '모음 모험 🌈';
    
    dataset.forEach((stage, idx) => {
        const stageNum = idx + 1;
        const nodeDiv = document.createElement('div');
        nodeDiv.className = `stage-node node-${stageNum}`;
        
        let stateClass = 'locked';
        if (stageNum < unlockedLimit) {
            stateClass = 'completed';
        } else if (stageNum === unlockedLimit) {
            stateClass = 'active-now';
        }
        
        nodeDiv.classList.add(stateClass);
        
        const button = document.createElement('button');
        button.className = 'stage-btn';
        button.setAttribute('data-letter', stage.letter);
        button.id = `btn-stage-${stageNum}`;
        
        // Label for the stage
        const labelSpan = document.createElement('span');
        labelSpan.className = 'stage-label';
        labelSpan.textContent = stage.word;
        
        nodeDiv.appendChild(button);
        nodeDiv.appendChild(labelSpan);
        
        // Setup click handler
        if (stateClass !== 'locked') {
            button.addEventListener('click', () => {
                state.currentStageIdx = idx;
                showScreen('learn');
            });
        } else {
            button.addEventListener('click', () => {
                // Play locked sound/shake animation
                DOM.audioFeedback.incorrect();
                button.style.animation = 'none';
                setTimeout(() => {
                    button.style.animation = 'shake 0.4s';
                }, 10);
            });
        }
        
        DOM.stagesLayer.appendChild(nodeDiv);
    });
}

// Add CSS animation for locked stages shake dynamically
const styleElem = document.createElement('style');
styleElem.innerHTML = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px) rotate(-3deg); }
    75% { transform: translateX(6px) rotate(3deg); }
}
`;
document.head.appendChild(styleElem);

// ==========================================================================
// B. Learning Canvas Logic
// ==========================================================================
function setupLearnScreen() {
    const dataset = state.currentMode === 'consonants' ? STAGE_DATA : VOWEL_DATA;
    const stage = dataset[state.currentStageIdx];
    DOM.currentLetterDisplay.textContent = stage.letter;
    
    // Draw guide line in SVG back overlay
    const pathString = LETTER_PATHS[stage.letter] || '';
    DOM.guideLetterPath.setAttribute('d', pathString);
    DOM.guideLetterCore.setAttribute('d', pathString);
    
    // Reset Canvas
    resetCanvas();
    DOM.btnNextToQuiz.style.display = 'none';
    
    // Draw guide letters helper initially on canvas as very light gray dashed path
    drawCanvasInitialGuide();
}

function resetCanvas() {
    ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
    state.canvasCleared = true;
    state.canvasThresholdReached = false;
    DOM.btnNextToQuiz.style.display = 'none';
    DOM.btnNextToQuiz.style.animation = '';
    
    // Sparkle trail elements clean
    const sparkles = DOM.screenLearn.querySelectorAll('.sparkle');
    sparkles.forEach(s => s.remove());
}

function drawCanvasInitialGuide() {
    // Setting canvas resolution matching display size
    const rect = DOM.canvas.getBoundingClientRect();
    DOM.canvas.width = rect.width * window.devicePixelRatio;
    DOM.canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Redraw transparently on canvas if needed (we rely on SVG overlay underneath)
}

function getCanvasTouchPos(e) {
    const rect = DOM.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function startDrawing(e) {
    state.isDrawing = true;
    const pos = getCanvasTouchPos(e);
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Bright glowing pastel ink
    ctx.strokeStyle = '#4fc3f7'; 
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00e5ff';
    
    state.canvasCleared = false;
    createDrawingSparkle(e);
}

function draw(e) {
    if (!state.isDrawing) return;
    e.preventDefault(); // Prevent scrolling on touch
    
    const pos = getCanvasTouchPos(e);
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    // Draw sub-path to make the glow look intense
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.stroke();
    
    // Restore glow styles for next segment
    ctx.lineWidth = 26;
    ctx.strokeStyle = '#4fc3f7';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00e5ff';
    
    createDrawingSparkle(e);
    
    // Check coverage/writing amount
    checkWritingProgress();
}

function stopDrawing() {
    if (state.isDrawing) {
        ctx.closePath();
        state.isDrawing = false;
    }
}

function checkWritingProgress() {
    if (state.canvasThresholdReached) return;
    
    // Simple pixel-count threshold detector.
    // Get image data to count colored pixels.
    const imgData = ctx.getImageData(0, 0, DOM.canvas.width, DOM.canvas.height);
    let activePixels = 0;
    const step = 4; // Check every 4th pixel for performance
    for (let i = 3; i < imgData.data.length; i += 4 * step) {
        if (imgData.data[i] > 100) { // Alpha channel threshold
            activePixels++;
        }
    }
    
    // Relative to canvas resolution, if enough is filled
    const density = activePixels / (imgData.data.length / (4 * step));
    if (density > 0.025) { // Roughly 2.5% of canvas area is painted
        state.canvasThresholdReached = true;
        
        // Show "Next" button with bouncy anim
        DOM.btnNextToQuiz.style.display = 'flex';
        DOM.btnNextToQuiz.style.animation = 'bounceActive 1.2s infinite ease-in-out';
        DOM.audioFeedback.cheer();
        triggerMascot('cheer');
    }
}

function createDrawingSparkle(e) {
    const rect = DOM.appContainer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Create element
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = `${clientX - rect.left - 7}px`;
    sparkle.style.top = `${clientY - rect.top - 7}px`;
    
    DOM.screenLearn.appendChild(sparkle);
    
    // Auto remove
    setTimeout(() => {
        sparkle.remove();
    }, 600);
}

// Canvas Touch & Mouse Bindings
DOM.canvas.addEventListener('mousedown', startDrawing);
DOM.canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', stopDrawing);

DOM.canvas.addEventListener('touchstart', startDrawing, { passive: false });
DOM.canvas.addEventListener('touchmove', draw, { passive: false });
window.addEventListener('touchend', stopDrawing);

DOM.btnResetCanvas.addEventListener('click', resetCanvas);

DOM.btnHintCanvas.addEventListener('click', () => {
    // Highlight guidance letter by animating opacity
    DOM.audioFeedback.pop();
    DOM.guideLetterPath.style.transition = 'stroke-width 0.3s, stroke 0.3s';
    DOM.guideLetterPath.style.stroke = '#ffe082';
    DOM.guideLetterPath.style.strokeWidth = '80px';
    
    setTimeout(() => {
        DOM.guideLetterPath.style.stroke = '#eeeeee';
        DOM.guideLetterPath.style.strokeWidth = '60px';
    }, 600);
});

DOM.btnNextToQuiz.addEventListener('click', () => {
    showScreen('quiz');
});

// ==========================================================================
// C. Quiz Matching Mode (Drag & Drop)
// ==========================================================================
function setupQuizScreen() {
    const dataset = state.currentMode === 'consonants' ? STAGE_DATA : VOWEL_DATA;
    const stage = dataset[state.currentStageIdx];
    
    // 1. Setup target area (display SVG of the matching word)
    DOM.quizTargetArea.classList.remove('matched', 'drag-over');
    DOM.quizTargetArea.innerHTML = stage.svg + `<div class="quiz-drop-slot" id="quiz-drop-slot">?</div>`;
    DOM.quizDropSlot = document.getElementById('quiz-drop-slot'); // re-cache since replaced
    
    // Header label
    DOM.screenQuiz.querySelector('.quiz-title').textContent = `어떤 글자가 어울릴까요?`;
    
    // Reset drag interaction lock
    DOM.quizOptionsArea.style.pointerEvents = 'auto';
    
    // 2. Setup options
    DOM.quizOptionsArea.innerHTML = '';
    
    stage.options.forEach((optText, idx) => {
        const block = document.createElement('div');
        block.className = 'quiz-block';
        block.textContent = optText;
        block.id = `quiz-block-${idx}`;
        block.setAttribute('data-letter', optText);
        
        // Touch Drag Events (Fully custom for termux/mobile sandbox)
        setupDragEvent(block);
        
        DOM.quizOptionsArea.appendChild(block);
    });
}

function setupDragEvent(el) {
    let startX = 0, startY = 0;
    let isDragging = false;
    
    const dragMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        
        el.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.15)`;
        
        // Check if overlap target
        if (checkOverlap(el, DOM.quizTargetArea)) {
            DOM.quizTargetArea.classList.add('drag-over');
        } else {
            DOM.quizTargetArea.classList.remove('drag-over');
        }
    };
    
    const dragEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        el.classList.remove('dragging');
        DOM.quizTargetArea.classList.remove('drag-over');
        
        // Clean up window level listeners
        window.removeEventListener('mousemove', dragMove);
        window.removeEventListener('mouseup', dragEnd);
        window.removeEventListener('touchmove', dragMove);
        window.removeEventListener('touchend', dragEnd);
        
        const dataset = state.currentMode === 'consonants' ? STAGE_DATA : VOWEL_DATA;
        const stage = dataset[state.currentStageIdx];
        const selectedLetter = el.getAttribute('data-letter');
        
        if (checkOverlap(el, DOM.quizTargetArea) && selectedLetter === stage.letter) {
            // Correct Answer Match!
            DOM.audioFeedback.correct();
            DOM.quizTargetArea.classList.add('matched');
            DOM.quizDropSlot.textContent = stage.letter;
            
            // Hide options
            DOM.quizOptionsArea.style.pointerEvents = 'none';
            el.style.display = 'none';
            
            triggerMascot('dance');
            
            // Show Reward Popup after 1.5s
            setTimeout(() => {
                showRewardPopup();
            }, 1200);
        } else {
            // Wrong Answer or Dropped outside: snap back with bounce
            DOM.audioFeedback.incorrect();
            el.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            el.style.transform = 'translate(0, 0)';
            el.style.zIndex = '10';
            
            setTimeout(() => {
                el.style.transition = '';
            }, 400);
        }
    };
    
    const dragStart = (e) => {
        isDragging = true;
        el.classList.add('dragging');
        DOM.audioFeedback.pop();
        
        // Positions
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startX = clientX;
        startY = clientY;
        
        el.style.position = 'relative';
        el.style.zIndex = '1000';
        
        // Dynamic binding to window during drag
        window.addEventListener('mousemove', dragMove);
        window.addEventListener('touchmove', dragMove, { passive: false });
        window.addEventListener('mouseup', dragEnd);
        window.addEventListener('touchend', dragEnd);
    };
    
    el.addEventListener('mousedown', dragStart);
    el.addEventListener('touchstart', dragStart, { passive: false });
}

function checkOverlap(el1, el2) {
    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();
    
    return !(r1.right < r2.left || 
             r1.left > r2.right || 
             r1.bottom < r2.top || 
             r1.top > r2.bottom);
}

// ==========================================================================
// D. Reward Popup & Sticking Book
// ==========================================================================
function showRewardPopup() {
    DOM.overlayReward.classList.add('active');
    
    const dataset = state.currentMode === 'consonants' ? STAGE_DATA : VOWEL_DATA;
    const stage = dataset[state.currentStageIdx];
    DOM.rewardTitle.innerHTML = `<span style="font-family:'Jua'; color:var(--color-primary-dark); font-size: 2.5rem;">참 잘했어요!</span><br/>'${stage.word}' 쓰기 완료!`;
    
    // Spawn 3 flying jewels UI
    DOM.jewelsRewardDisplay.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const jewel = document.createElement('span');
        jewel.className = 'reward-jewel';
        jewel.textContent = '💎';
        DOM.jewelsRewardDisplay.appendChild(jewel);
    }
    
    // Trigger fireworks
    triggerFireworks();
    
    // Play celebratory jingle
    DOM.audioFeedback.cheer();
}

function triggerFireworks() {
    const colors = ['#ffd54f', '#81c784', '#ff8a80', '#4fc3f7', '#b39ddb'];
    
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.className = 'firework';
            
            // Random start position from center bottom
            const startX = DOM.appContainer.offsetWidth / 2;
            const startY = DOM.appContainer.offsetHeight / 2 + 100;
            
            firework.style.left = `${startX}px`;
            firework.style.top = `${startY}px`;
            firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            DOM.appContainer.appendChild(firework);
            
            // Random trajectories
            const destX = (Math.random() - 0.5) * 300;
            const destY = -(Math.random() * 200 + 100);
            
            firework.style.transition = 'transform 1.2s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 1.2s';
            
            // Trigger animation frame
            requestAnimationFrame(() => {
                firework.style.transform = `translate(${destX}px, ${destY}px) scale(2.5)`;
                firework.style.opacity = '0';
            });
            
            setTimeout(() => {
                firework.remove();
            }, 1200);
        }, i * 40);
    }
}

DOM.btnCollectReward.addEventListener('click', () => {
    state.jewels += 3;
    updateJewelUI();
    
    // Unlock next stage depending on mode
    const dataset = state.currentMode === 'consonants' ? STAGE_DATA : VOWEL_DATA;
    const currentStageNum = state.currentStageIdx + 1;
    
    if (state.currentMode === 'consonants') {
        if (currentStageNum === state.unlockedConsonantStage && state.unlockedConsonantStage < STAGE_DATA.length) {
            state.unlockedConsonantStage++;
        }
    } else {
        if (currentStageNum === state.unlockedVowelStage && state.unlockedVowelStage < VOWEL_DATA.length) {
            state.unlockedVowelStage++;
        }
    }
    
    saveCurrentState();
    DOM.overlayReward.classList.remove('active');
    
    // Return to main hub map
    showScreen('hub');
});

// Sticker Book Modal
DOM.btnOpenStickers.addEventListener('click', () => {
    DOM.audioFeedback.pop();
    DOM.overlayStickers.classList.add('active');
    renderStickerBook();
});

DOM.btnCloseStickers.addEventListener('click', () => {
    DOM.audioFeedback.pop();
    DOM.overlayStickers.classList.remove('active');
});

function renderStickerBook() {
    DOM.stickerGrid.innerHTML = '';
    
    // Combine both sets for full stickers display
    const allStages = [
        ...STAGE_DATA.map((s, idx) => ({ ...s, isUnlocked: (idx + 1) < state.unlockedConsonantStage })),
        ...VOWEL_DATA.map((s, idx) => ({ ...s, isUnlocked: (idx + 1) < state.unlockedVowelStage }))
    ];
    
    allStages.forEach((stage) => {
        const card = document.createElement('div');
        card.className = `glass-panel sticker-card ${stage.isUnlocked ? 'unlocked' : 'locked'}`;
        
        if (stage.isUnlocked) {
            card.innerHTML = `
                <div class="sticker-img-wrap">${stage.svg}</div>
                <div class="sticker-name">${stage.word}</div>
                <div class="sticker-badge">참 잘했어요</div>
            `;
        } else {
            card.innerHTML = `
                <div class="sticker-img-wrap">
                    <span style="font-size: 3rem; opacity: 0.3;">🔒</span>
                </div>
                <div class="sticker-name">???</div>
            `;
        }
        
        DOM.stickerGrid.appendChild(card);
    });
}

// Add CSS styling dynamically for Sticker grid layout
const stickerStyles = document.createElement('style');
stickerStyles.innerHTML = `
.sticker-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    max-height: 400px;
    overflow-y: auto;
    padding: 10px 5px;
}
.sticker-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px 10px;
    border-radius: var(--radius-md);
    background: var(--color-white);
    border-color: rgba(255, 255, 255, 0.9);
    transition: transform 0.2s;
}
.sticker-card.unlocked:hover {
    transform: translateY(-5px);
}
.sticker-card.locked {
    background: #f1f5f9;
    border-color: #e2e8f0;
}
.sticker-img-wrap {
    width: 80px;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 8px;
}
.sticker-img-wrap svg {
    width: 100%;
    height: 100%;
}
.sticker-name {
    font-family: 'Jua', sans-serif;
    font-size: 1.3rem;
    color: var(--color-text-main);
}
.sticker-badge {
    margin-top: 4px;
    font-size: 0.8rem;
    background: var(--color-accent);
    color: var(--color-white);
    padding: 2px 8px;
    border-radius: 10px;
}
`;
document.head.appendChild(stickerStyles);

// Back button on top app bar handler
DOM.btnBackToHub.addEventListener('click', () => {
    if (DOM.screenLearn.classList.contains('active') || DOM.screenQuiz.classList.contains('active')) {
        showScreen('hub');
    } else if (DOM.screenHub.classList.contains('active') || DOM.screenCombine.classList.contains('active')) {
        showScreen('menu');
    }
});

// ==========================================================================
// 5. Init Application
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
    loadSavedState();
    
    // Bind Initial Menu screen buttons
    DOM.btnMenuConsonants.addEventListener('click', () => {
        state.currentMode = 'consonants';
        showScreen('hub');
    });
    DOM.btnMenuVowels.addEventListener('click', () => {
        state.currentMode = 'vowels';
        showScreen('hub');
    });
    DOM.btnMenuCombine.addEventListener('click', () => {
        state.currentMode = 'combine';
        showScreen('combine');
    });
    
    showScreen('menu');
});

// ==========================================================================
// E. Letter Maker (Combine Board) Logic
// ==========================================================================
const CHO_MAP = { 'ㄱ':0, 'ㄴ':2, 'ㄷ':3, 'ㄹ':5, 'ㅁ':6, 'ㅂ':7, 'ㅅ':9, 'ㅇ':11, 'ㅈ':12, 'ㅊ':14, 'ㅋ':15, 'ㅌ':16, 'ㅍ':17, 'ㅎ':18 };
const JUNG_MAP = { 'ㅏ':0, 'ㅑ':2, 'ㅓ':4, 'ㅕ':6, 'ㅗ':8, 'ㅛ':12, 'ㅜ':13, 'ㅠ':17, 'ㅡ':18, 'ㅣ':20 };

function setupCombineScreen() {
    // 1. Reset Board
    clearCombineSlots();
    
    // 2. Render Consonant Pool
    DOM.poolConsonants.innerHTML = '';
    STAGE_DATA.forEach(stage => {
        const card = document.createElement('div');
        card.className = 'pool-card';
        card.textContent = stage.letter;
        card.setAttribute('data-letter', stage.letter);
        card.setAttribute('data-type', 'consonant');
        
        // Interactive Bindings (Hybrid touch/mouse drag + quick click)
        setupCombineDrag(card);
        
        DOM.poolConsonants.appendChild(card);
    });
    
    // 3. Render Vowel Pool
    DOM.poolVowels.innerHTML = '';
    VOWEL_DATA.forEach(stage => {
        const card = document.createElement('div');
        card.className = 'pool-card';
        card.textContent = stage.letter;
        card.setAttribute('data-letter', stage.letter);
        card.setAttribute('data-type', 'vowel');
        
        setupCombineDrag(card);
        
        DOM.poolVowels.appendChild(card);
    });
}

function setupCombineDrag(el) {
    let startX = 0, startY = 0;
    let isDragging = false;
    let clone = null;
    let clickTimeout = null;
    
    const dragStart = (e) => {
        // Quick click check fallback
        isDragging = false;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startX = clientX;
        startY = clientY;
        
        // Set timeout to decide if it is a drag
        clickTimeout = setTimeout(() => {
            isDragging = true;
            DOM.audioFeedback.pop();
            
            // Create drag clone element
            clone = el.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.zIndex = '9999';
            clone.style.opacity = '0.9';
            clone.style.pointerEvents = 'none'; // pass-through
            clone.style.left = `${clientX - 26}px`;
            clone.style.top = `${clientY - 26}px`;
            
            document.body.appendChild(clone);
            
            window.addEventListener('mousemove', dragMove);
            window.addEventListener('touchmove', dragMove, { passive: false });
        }, 120); // 120ms holds is drag
        
        window.addEventListener('mouseup', dragEnd);
        window.addEventListener('touchend', dragEnd);
    };
    
    const dragMove = (e) => {
        if (!isDragging || !clone) return;
        e.preventDefault();
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        clone.style.left = `${clientX - 26}px`;
        clone.style.top = `${clientY - 26}px`;
        
        // Highlight active slots on overlap
        const type = el.getAttribute('data-type');
        const targetSlot = type === 'consonant' ? DOM.slotConsonant : DOM.slotVowel;
        
        if (checkCloneOverlap(clone, targetSlot)) {
            targetSlot.classList.add('drag-over');
        } else {
            targetSlot.classList.remove('drag-over');
        }
    };
    
    const dragEnd = (e) => {
        clearTimeout(clickTimeout);
        
        // Clean event listeners
        window.removeEventListener('mousemove', dragMove);
        window.removeEventListener('touchmove', dragMove);
        window.removeEventListener('mouseup', dragEnd);
        window.removeEventListener('touchend', dragEnd);
        
        const type = el.getAttribute('data-type');
        const letter = el.getAttribute('data-letter');
        const targetSlot = type === 'consonant' ? DOM.slotConsonant : DOM.slotVowel;
        
        if (isDragging) {
            // End drag process
            isDragging = false;
            targetSlot.classList.remove('drag-over');
            
            if (clone) {
                if (checkCloneOverlap(clone, targetSlot)) {
                    // Successful Drop
                    fillCombineSlot(type, letter);
                } else {
                    DOM.audioFeedback.pop();
                }
                clone.remove();
                clone = null;
            }
        } else {
            // It was a quick Tap/Click: auto fill the slot
            fillCombineSlot(type, letter);
        }
    };
    
    el.addEventListener('mousedown', dragStart);
    el.addEventListener('touchstart', dragStart, { passive: false });
}

function checkCloneOverlap(clone, slot) {
    const r1 = clone.getBoundingClientRect();
    const r2 = slot.getBoundingClientRect();
    
    return !(r1.right < r2.left || 
             r1.left > r2.right || 
             r1.bottom < r2.top || 
             r1.top > r2.bottom);
}

function fillCombineSlot(type, letter) {
    DOM.audioFeedback.correct();
    if (type === 'consonant') {
        state.combineCho = letter;
        DOM.slotConsonant.classList.add('filled');
        DOM.slotConsonant.innerHTML = letter + `<span class="combine-slot-label">자음</span>`;
    } else {
        state.combineJung = letter;
        DOM.slotVowel.classList.add('filled');
        DOM.slotVowel.innerHTML = letter + `<span class="combine-slot-label">모음</span>`;
    }
    
    updateCombinedResult();
}

function updateCombinedResult() {
    if (state.combineCho && state.combineJung) {
        const choIdx = CHO_MAP[state.combineCho];
        const jungIdx = JUNG_MAP[state.combineJung];
        
        // Hangeul combination formula
        const charCode = 0xAC00 + (choIdx * 21 * 28) + (jungIdx * 28);
        const char = String.fromCharCode(charCode);
        
        DOM.combinedResultText.textContent = char;
        DOM.combinedResultText.className = 'combined-char-text success';
        
        // Celebrative jingle / mascot cheering feedback
        DOM.audioFeedback.cheer();
        triggerFireworks();
    } else {
        DOM.combinedResultText.textContent = (state.combineCho || '') + (state.combineJung || '');
        if (!DOM.combinedResultText.textContent) {
            DOM.combinedResultText.textContent = '?';
        }
        DOM.combinedResultText.className = 'combined-char-text';
    }
}

function clearCombineSlots() {
    state.combineCho = null;
    state.combineJung = null;
    
    DOM.slotConsonant.classList.remove('filled');
    DOM.slotConsonant.innerHTML = `<span class="combine-slot-label">자음 넣는 곳</span>`;
    
    DOM.slotVowel.classList.remove('filled');
    DOM.slotVowel.innerHTML = `<span class="combine-slot-label">모음 넣는 곳</span>`;
    
    DOM.combinedResultText.textContent = '?';
    DOM.combinedResultText.className = 'combined-char-text';
}

DOM.btnClearCombine.addEventListener('click', () => {
    DOM.audioFeedback.pop();
    clearCombineSlots();
});
