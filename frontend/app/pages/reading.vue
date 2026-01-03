<script setup>
import {
  ref,
  onMounted,
  computed,
  watch,
  onUnmounted,
  nextTick,
  reactive,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "~/stores/auth";
import { useReadingSettingsStore } from "~/stores/readingSettings";
import Toast from "~/components/Toast.vue";
import BibleScheduleContent from "~/components/BibleScheduleContent.vue";
import ReadingSettingsModal from "~/components/ReadingSettingsModal.vue";

// 라우터 및 스토어 설정
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const readingSettingsStore = useReadingSettingsStore();
const api = useApi();
const { fetchKntContent, fetchStandardContent, getFallbackUrl } = useBibleFetch();

// 토스트 상태
const toast = ref(null);

// 모달 상태 관리
const showLoginModal = ref(false);
const showModal = ref(false);
const showScheduleModal = ref(false);
const showCompleteConfirmModal = ref(false);
const showVersionModal = ref(false);
const showReadingSettingsModal = ref(false);
const scheduleModalMounted = ref(false);
const modalSource = ref("");

// 읽기 설정은 스토어에서 가져옴
const viewOptions = computed(() => readingSettingsStore.settings);
const fontSize = computed(() => readingSettingsStore.settings.fontSize);

// 성경 내용 상태 관리
const bibleContent = ref("");
const chapterTitle = ref("");
const sectionTitle = ref("");
const currentBook = ref("");
const currentChapter = ref(1);
const selectedBook = ref("gen");
const currentVersion = ref("GAE");
const readingDetailResponse = ref(null);

// UI 상태 관리
const isLoading = ref(true);
const isUpdatingStatus = ref(false);
const currentAction = ref("complete");
const showTopButton = ref(false);

// 글자 크기 기본값 (스토어에서 관리)
const DEFAULT_FONT_SIZE = 16;

// 성경 역본 정보
const versionNames = Object.freeze({
  KNT: "새한글",
  GAE: "개역개정",
  HAN: "개역한글",
  SAE: "표준새번역",
  SAENEW: "새번역",
  COG: "공동번역",
  COGNEW: "공동번역 개정판",
});

// 성경 책 정보
const bibleBooks = {
  old: [
    { id: "gen", name: "창세기", chapters: 50 },
    { id: "exo", name: "출애굽기", chapters: 40 },
    { id: "lev", name: "레위기", chapters: 27 },
    { id: "num", name: "민수기", chapters: 36 },
    { id: "deu", name: "신명기", chapters: 34 },
    { id: "jos", name: "여호수아", chapters: 24 },
    { id: "jdg", name: "사사기", chapters: 21 },
    { id: "rut", name: "룻기", chapters: 4 },
    { id: "1sa", name: "사무엘상", chapters: 31 },
    { id: "2sa", name: "사무엘하", chapters: 24 },
    { id: "1ki", name: "열왕기상", chapters: 22 },
    { id: "2ki", name: "열왕기하", chapters: 25 },
    { id: "1ch", name: "역대상", chapters: 29 },
    { id: "2ch", name: "역대하", chapters: 36 },
    { id: "ezr", name: "에스라", chapters: 10 },
    { id: "neh", name: "느헤미야", chapters: 13 },
    { id: "est", name: "에스더", chapters: 10 },
    { id: "job", name: "욥기", chapters: 42 },
    { id: "psa", name: "시편", chapters: 150 },
    { id: "pro", name: "잠언", chapters: 31 },
    { id: "ecc", name: "전도서", chapters: 12 },
    { id: "sng", name: "아가", chapters: 8 },
    { id: "isa", name: "이사야", chapters: 66 },
    { id: "jer", name: "예레미야", chapters: 52 },
    { id: "lam", name: "예레미야애가", chapters: 5 },
    { id: "ezk", name: "에스겔", chapters: 48 },
    { id: "dan", name: "다니엘", chapters: 12 },
    { id: "hos", name: "호세아", chapters: 14 },
    { id: "jol", name: "요엘", chapters: 3 },
    { id: "amo", name: "아모스", chapters: 9 },
    { id: "oba", name: "오바댜", chapters: 1 },
    { id: "jnh", name: "요나", chapters: 4 },
    { id: "mic", name: "미가", chapters: 7 },
    { id: "nam", name: "나훔", chapters: 3 },
    { id: "hab", name: "하박국", chapters: 3 },
    { id: "zep", name: "스바냐", chapters: 3 },
    { id: "hag", name: "학개", chapters: 2 },
    { id: "zec", name: "스가랴", chapters: 14 },
    { id: "mal", name: "말라기", chapters: 4 },
  ],
  new: [
    { id: "mat", name: "마태복음", chapters: 28 },
    { id: "mrk", name: "마가복음", chapters: 16 },
    { id: "luk", name: "누가복음", chapters: 24 },
    { id: "jhn", name: "요한복음", chapters: 21 },
    { id: "act", name: "사도행전", chapters: 28 },
    { id: "rom", name: "로마서", chapters: 16 },
    { id: "1co", name: "고린도전서", chapters: 16 },
    { id: "2co", name: "고린도후서", chapters: 13 },
    { id: "gal", name: "갈라디아서", chapters: 6 },
    { id: "eph", name: "에베소서", chapters: 6 },
    { id: "php", name: "빌립보서", chapters: 4 },
    { id: "col", name: "골로새서", chapters: 4 },
    { id: "1th", name: "데살로니가전서", chapters: 5 },
    { id: "2th", name: "데살로니가후서", chapters: 3 },
    { id: "1ti", name: "디모데전서", chapters: 6 },
    { id: "2ti", name: "디모데후서", chapters: 4 },
    { id: "tit", name: "디도서", chapters: 3 },
    { id: "phm", name: "빌레몬서", chapters: 1 },
    { id: "heb", name: "히브리서", chapters: 13 },
    { id: "jas", name: "야고보서", chapters: 5 },
    { id: "1pe", name: "베드로전서", chapters: 5 },
    { id: "2pe", name: "베드로후서", chapters: 3 },
    { id: "1jn", name: "요한일서", chapters: 5 },
    { id: "2jn", name: "요한이서", chapters: 1 },
    { id: "3jn", name: "요한삼서", chapters: 1 },
    { id: "jud", name: "유다서", chapters: 1 },
    { id: "rev", name: "요한계시록", chapters: 22 },
  ],
};

// bookNames 객체 업데이트
const bookNames = {};
bibleBooks.old.concat(bibleBooks.new).forEach((book) => {
  bookNames[book.id] = book.name;
});

// bookChapters 객체 업데이트
const bookChapters = {};
bibleBooks.old.concat(bibleBooks.new).forEach((book) => {
  bookChapters[book.id] = book.chapters;
});

// 검색 기능 관련 상태
const searchQuery = ref("");
const searchInputRef = ref(null);

// 한글 초성 추출 함수
const CHOSUNG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 한글 문자열에서 초성만 추출
const extractChosung = (str) => {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // 한글 완성형 범위 (가 ~ 힣)
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const chosungIndex = Math.floor((code - 0xAC00) / 588);
      result += CHOSUNG_LIST[chosungIndex];
    } else if (CHOSUNG_LIST.includes(str[i])) {
      // 이미 초성인 경우 그대로 추가
      result += str[i];
    }
  }
  return result;
};

// 입력이 초성으로만 구성되어 있는지 확인
const isChosungOnly = (str) => {
  if (!str) return false;
  for (let i = 0; i < str.length; i++) {
    if (!CHOSUNG_LIST.includes(str[i])) {
      return false;
    }
  }
  return str.length > 0;
};

// 성경 책 약어 매핑 (한글 약어 → 책 id)
const bookAliases = {
  // 구약
  창: "gen", 창세: "gen", 창세기: "gen",
  출: "exo", 출애: "exo", 출애굽: "exo", 출애굽기: "exo",
  레: "lev", 레위: "lev", 레위기: "lev",
  민: "num", 민수: "num", 민수기: "num",
  신: "deu", 신명: "deu", 신명기: "deu",
  수: "jos", 여호: "jos", 여호수아: "jos",
  삿: "jdg", 사사: "jdg", 사사기: "jdg",
  룻: "rut", 룻기: "rut",
  삼상: "1sa", 사무엘상: "1sa", "사상": "1sa", "삼상": "1sa",
  삼하: "2sa", 사무엘하: "2sa", "사하": "2sa", "삼하": "2sa",
  왕상: "1ki", 열왕기상: "1ki", "열상": "1ki",
  왕하: "2ki", 열왕기하: "2ki", "열하": "2ki",
  대상: "1ch", 역대상: "1ch", "역상": "1ch",
  대하: "2ch", 역대하: "2ch", "역하": "2ch",
  스: "ezr", 에스라: "ezr",
  느: "neh", 느헤: "neh", 느헤미야: "neh",
  에: "est", 에스더: "est",
  욥: "job", 욥기: "job",
  시: "psa", 시편: "psa",
  잠: "pro", 잠언: "pro",
  전: "ecc", 전도: "ecc", 전도서: "ecc",
  아: "sng", 아가: "sng",
  사: "isa", 이사야: "isa",
  렘: "jer", 예레: "jer", 예레미야: "jer",
  애: "lam", 애가: "lam", 예레미야애가: "lam",
  겔: "ezk", 에스겔: "ezk",
  단: "dan", 다니엘: "dan",
  호: "hos", 호세아: "hos",
  욜: "jol", 요엘: "jol",
  암: "amo", 아모스: "amo",
  옵: "oba", 오바댜: "oba",
  욘: "jnh", 요나: "jnh",
  미: "mic", 미가: "mic",
  나: "nam", 나훔: "nam",
  합: "hab", 하박국: "hab",
  습: "zep", 스바냐: "zep",
  학: "hag", 학개: "hag",
  슥: "zec", 스가랴: "zec",
  말: "mal", 말라기: "mal",
  // 신약
  마: "mat", 마태: "mat", 마태복음: "mat",
  막: "mrk", 마가: "mrk", 마가복음: "mrk",
  눅: "luk", 누가: "luk", 누가복음: "luk",
  요: "jhn", 요한: "jhn", 요한복음: "jhn",
  행: "act", 사도: "act", 사도행전: "act",
  롬: "rom", 로마: "rom", 로마서: "rom",
  고전: "1co", 고린도전서: "1co", "고린전": "1co",
  고후: "2co", 고린도후서: "2co", "고린후": "2co",
  갈: "gal", 갈라디아: "gal", 갈라디아서: "gal",
  엡: "eph", 에베소: "eph", 에베소서: "eph",
  빌: "php", 빌립보: "php", 빌립보서: "php",
  골: "col", 골로새: "col", 골로새서: "col",
  살전: "1th", 데살로니가전서: "1th", "데전": "1th", "살전": "1th",
  살후: "2th", 데살로니가후서: "2th", "데후": "2th", "살후": "2th",
  딤전: "1ti", 디모데전서: "1ti", "디전": "1ti",
  딤후: "2ti", 디모데후서: "2ti", "디후": "2ti",
  딛: "tit", 디도: "tit", 디도서: "tit",
  몬: "phm", 빌레몬: "phm", 빌레몬서: "phm",
  히: "heb", 히브리: "heb", 히브리서: "heb",
  약: "jas", 야고보: "jas", 야고보서: "jas",
  벧전: "1pe", 베드로전서: "1pe", "베전": "1pe",
  벧후: "2pe", 베드로후서: "2pe", "베후": "2pe",
  요일: "1jn", 요한일서: "1jn",
  요이: "2jn", 요한이서: "2jn",
  요삼: "3jn", 요한삼서: "3jn",
  유: "jud", 유다: "jud", 유다서: "jud",
  계: "rev", 요한계시록: "rev", 계시록: "rev",
};

// 스마트 검색 - 여러 후보 결과 반환 (초성 및 절 지원)
const parseSearchQueryMultiple = (query) => {
  if (!query || query.trim() === "") return [];

  const trimmed = query.trim();
  const allBooks = bibleBooks.old.concat(bibleBooks.new);
  const results = [];

  // 패턴들 (절 지원 추가)
  // 패턴1: "창세기 1장 3절", "창세기 1장3절", "창세기 1:3" 형태 (책이름 + 장 + 절)
  const pattern1 = /^(.+?)\s*(\d+)\s*(?:장\s*)?[:\s절]?\s*(\d+)\s*절?$/;
  // 패턴2: "창세기 1장", "창세기 1" 형태 (책이름 + 장, 절 없음)
  const pattern2 = /^(.+?)\s+(\d+)\s*장?$/;
  // 패턴3: "창1:3", "창1장3절" 형태 (책이름+장+절, 공백없음)
  const pattern3 = /^([가-힣ㄱ-ㅎ]+)(\d+)\s*(?:장\s*)?[:\s절]\s*(\d+)\s*절?$/;
  // 패턴3b: "ㅁㅌ2223" 형태 (초성 + 4자리 숫자 = 장2자리 + 절2자리)
  const pattern3b = /^([ㄱ-ㅎ]+)(\d{4})$/;
  // 패턴3c: "ㅁㅌ123" 형태 (초성 + 3자리 숫자 = 장1자리 + 절2자리)
  const pattern3c = /^([ㄱ-ㅎ]+)(\d{3})$/;
  // 패턴4: "창1", "창세기1" 형태 (책이름 + 숫자, 공백없음, 절 없음)
  const pattern4 = /^([가-힣ㄱ-ㅎ]+)(\d{1,2})$/;
  // 패턴5: 책 이름만 (숫자 없음) - 초성 포함
  const pattern5 = /^([가-힣ㄱ-ㅎ]+)$/;
  // 패턴6: 영문 id + 숫자:숫자 (예: gen1:3)
  const pattern6 = /^([a-z0-9]+)\s*(\d+)[:\s](\d+)$/i;
  // 패턴7: 영문 id + 숫자 (예: gen1, gen 1)
  const pattern7 = /^([a-z0-9]+)\s*(\d*)$/i;

  let bookName = null;
  let chapter = null;
  let verse = null;
  let alternativeInterpretations = []; // 3자리 숫자의 다중 해석용

  // 패턴 매칭 순서: 초성+숫자 패턴을 먼저 체크 (다른 패턴에 잘못 매칭되는 것 방지)
  let match = trimmed.match(pattern3b);
  if (match) {
    // 4자리 숫자: 앞 2자리 = 장, 뒤 2자리 = 절 (예: 2223 → 22장 23절)
    bookName = match[1];
    const digits = match[2];
    chapter = parseInt(digits.slice(0, 2), 10);
    verse = parseInt(digits.slice(2), 10);
  } else {
    match = trimmed.match(pattern3c);
    if (match) {
      // 3자리 숫자: 두 가지 해석 가능 (예: 123 → 1장 23절 또는 12장 3절)
      bookName = match[1];
      const digits = match[2];
      // 기본 해석: 앞 1자리 = 장, 뒤 2자리 = 절
      chapter = parseInt(digits.slice(0, 1), 10);
      verse = parseInt(digits.slice(1), 10);
      // 대안 해석: 앞 2자리 = 장, 뒤 1자리 = 절
      alternativeInterpretations.push({
        chapter: parseInt(digits.slice(0, 2), 10),
        verse: parseInt(digits.slice(2), 10)
      });
    } else {
      match = trimmed.match(pattern3);
      if (match) {
        bookName = match[1];
        chapter = parseInt(match[2], 10);
        verse = parseInt(match[3], 10);
      } else {
        match = trimmed.match(pattern1);
        if (match) {
          bookName = match[1].trim();
          chapter = parseInt(match[2], 10);
          verse = parseInt(match[3], 10);
        } else {
          match = trimmed.match(pattern6);
          if (match) {
            bookName = match[1].toLowerCase();
            chapter = parseInt(match[2], 10);
            verse = parseInt(match[3], 10);
          } else {
            match = trimmed.match(pattern2);
            if (match) {
              bookName = match[1].trim();
              chapter = parseInt(match[2], 10);
            } else {
              match = trimmed.match(pattern4);
              if (match) {
                bookName = match[1];
                chapter = parseInt(match[2], 10);
              } else {
                match = trimmed.match(pattern5);
                if (match) {
                  bookName = match[1];
                } else {
                  match = trimmed.match(pattern7);
                  if (match) {
                    bookName = match[1].toLowerCase();
                    chapter = match[2] ? parseInt(match[2], 10) : null;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  if (!bookName) return [];

  // 모든 매칭되는 책 찾기 (여러 후보 지원)
  const matchedBookIds = new Set();
  const bookNameLower = bookName.toLowerCase();

  // 0. 초성 검색 지원
  if (isChosungOnly(bookName)) {
    // 입력이 초성만으로 구성된 경우
    allBooks.forEach(book => {
      const bookChosung = extractChosung(book.name);
      // 초성이 입력과 일치하거나 시작하면 매칭
      if (bookChosung.startsWith(bookName) || bookChosung === bookName) {
        matchedBookIds.add(book.id);
      }
    });
    // 약어의 초성도 검색
    Object.entries(bookAliases).forEach(([alias, bookId]) => {
      const aliasChosung = extractChosung(alias);
      if (aliasChosung.startsWith(bookName) || aliasChosung === bookName) {
        matchedBookIds.add(bookId);
      }
    });
  }

  // 1. 약어 매핑에서 직접 찾기 (정확한 매칭 우선)
  if (bookAliases[bookNameLower]) {
    matchedBookIds.add(bookAliases[bookNameLower]);
  }

  // 2. 영문 id로 직접 매칭
  const directMatch = allBooks.find(b => b.id === bookNameLower);
  if (directMatch) {
    matchedBookIds.add(directMatch.id);
  }

  // 3. 부분 매칭 - 모든 관련 책 찾기 (예: "요한" -> 요한복음, 요한일서, 요한이서, 요한삼서, 요한계시록)
  if (!isChosungOnly(bookName)) {
    allBooks.forEach(book => {
      const name = book.name.toLowerCase();
      // 책 이름이 검색어로 시작하거나, 검색어가 책 이름에 포함되면 매칭
      if (name.startsWith(bookNameLower) || name.includes(bookNameLower)) {
        matchedBookIds.add(book.id);
      }
    });

    // 4. 약어의 부분 매칭도 검색 (예: "요" -> 요한복음, 요한일서, 요엘 등)
    Object.entries(bookAliases).forEach(([alias, bookId]) => {
      if (alias.startsWith(bookNameLower) || bookNameLower.startsWith(alias)) {
        matchedBookIds.add(bookId);
      }
    });
  }

  // 결과 생성
  matchedBookIds.forEach(bookId => {
    const maxChapters = bookChapters[bookId];
    let validChapter = chapter;
    if (validChapter !== null) {
      if (validChapter < 1) validChapter = 1;
      if (validChapter > maxChapters) validChapter = maxChapters;
    }

    // 기본 해석 추가
    results.push({
      bookId,
      chapter: validChapter,
      verse: verse,
      bookName: bookNames[bookId],
      maxChapters,
    });

    // 3자리 숫자의 대안 해석 추가 (예: 123 → 12장 3절)
    alternativeInterpretations.forEach(alt => {
      let altChapter = alt.chapter;
      if (altChapter !== null) {
        if (altChapter < 1) altChapter = 1;
        if (altChapter > maxChapters) altChapter = maxChapters;
      }
      // 기본 해석과 다른 경우에만 추가
      if (altChapter !== validChapter || alt.verse !== verse) {
        results.push({
          bookId,
          chapter: altChapter,
          verse: alt.verse,
          bookName: bookNames[bookId],
          maxChapters,
        });
      }
    });
  });

  // 정렬: 정확한 매칭 우선, 그 다음 성경 순서대로
  const bookOrder = allBooks.map(b => b.id);
  results.sort((a, b) => {
    // 정확한 이름 매칭 우선 (초성 매칭 포함)
    const aExact = a.bookName.toLowerCase() === bookNameLower ||
                   bookAliases[bookNameLower] === a.bookId ||
                   (isChosungOnly(bookName) && extractChosung(a.bookName) === bookName);
    const bExact = b.bookName.toLowerCase() === bookNameLower ||
                   bookAliases[bookNameLower] === b.bookId ||
                   (isChosungOnly(bookName) && extractChosung(b.bookName) === bookName);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    // 성경 순서
    return bookOrder.indexOf(a.bookId) - bookOrder.indexOf(b.bookId);
  });

  return results;
};

// 선택된 검색 결과 인덱스
const selectedResultIndex = ref(0);

// 검색 결과들 computed
const searchResults = computed(() => {
  return parseSearchQueryMultiple(searchQuery.value);
});

// 현재 선택된 검색 결과
const searchResult = computed(() => {
  const results = searchResults.value;
  if (results.length === 0) return null;
  return results[Math.min(selectedResultIndex.value, results.length - 1)];
});

// 검색어 변경 시 인덱스 리셋
watch(searchQuery, () => {
  selectedResultIndex.value = 0;
});

// 검색 결과가 변경될 때 책 선택 및 스크롤 자동 연동
watch(searchResult, (result) => {
  if (result && result.bookId) {
    // 검색된 책으로 선택 변경 (장 목록도 자동 업데이트됨)
    selectedBook.value = result.bookId;
    // 해당 책으로 스크롤
    nextTick(() => {
      scrollToSelectedBook();
      // 장이 있으면 해당 장으로도 스크롤
      if (result.chapter) {
        setTimeout(() => {
          scrollToSearchedChapter(result.chapter);
        }, 50);
      }
    });
  }
});

// 다른 검색 결과 선택
const selectSearchResult = (index) => {
  selectedResultIndex.value = index;
};

// 콘텐츠 로딩 완료 후 절로 스크롤
watch(isLoading, (newValue, oldValue) => {
  // 로딩이 완료되었고 (false로 변경), 스크롤할 절이 있으면
  if (oldValue === true && newValue === false && pendingScrollVerse.value) {
    // 콘텐츠가 렌더링될 시간을 주고 스크롤
    setTimeout(() => {
      scrollToVerse(pendingScrollVerse.value);
      pendingScrollVerse.value = null;
    }, 300);
  }
});

// 검색된 장으로 스크롤 (하이라이트용)
const scrollToSearchedChapter = (chapter) => {
  const chaptersSection = document.querySelector(".chapters-section");
  if (!chaptersSection) return;

  const chapterButton = chaptersSection.querySelector(`[data-chapter="${chapter}"]`);
  if (chapterButton) {
    const containerRect = chaptersSection.getBoundingClientRect();
    const buttonRect = chapterButton.getBoundingClientRect();
    const scrollTop = chaptersSection.scrollTop + (buttonRect.top - containerRect.top) - (containerRect.height / 2) + (buttonRect.height / 2);
    chaptersSection.scrollTo({ top: scrollTop, behavior: "smooth" });
  }
};

// 이동 후 스크롤할 절 번호 저장
const pendingScrollVerse = ref(null);

// 특정 절로 스크롤하는 함수
const scrollToVerse = (verseNumber) => {
  if (!verseNumber) return;

  // 절 번호를 가진 요소 찾기 (여러 가능한 선택자 시도)
  const selectors = [
    `.verse-number:contains("${verseNumber}")`,
    `[data-verse="${verseNumber}"]`,
    `.bible-content .verse:nth-child(${verseNumber})`,
    `.verse-${verseNumber}`,
  ];

  // 성경 본문에서 해당 절 찾기
  const bibleContentEl = document.querySelector('.bible-content');
  if (!bibleContentEl) return;

  // sup 태그나 절 번호를 가진 요소 찾기 (.verse-num 포함)
  const verseElements = bibleContentEl.querySelectorAll('sup, .verse-num, .verse-number, [data-verse]');
  let targetElement = null;

  for (const el of verseElements) {
    const text = el.textContent.trim();
    if (text === String(verseNumber) || text === `${verseNumber}`) {
      targetElement = el;
      break;
    }
  }

  if (targetElement) {
    // 절 번호의 부모 요소(전체 절 라인)를 찾아서 강조
    const verseLine = targetElement.closest('p') || targetElement.parentElement;

    // 요소가 화면 중앙에 오도록 스크롤
    const elementRect = targetElement.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const middle = absoluteElementTop - (window.innerHeight / 3);
    window.scrollTo({
      top: middle,
      behavior: 'smooth'
    });

    // 전체 절 라인에 하이라이트 효과 추가
    if (verseLine) {
      verseLine.classList.add('verse-line-highlight');
      setTimeout(() => {
        verseLine.classList.remove('verse-line-highlight');
      }, 2500);
    }
  }
};

// 검색으로 빠른 이동
const goToSearchResult = () => {
  const result = searchResult.value;
  if (!result) return;

  if (result.chapter) {
    // 책과 장이 모두 있으면 바로 이동
    selectBook(result.bookId);

    // 절이 있으면 저장해두고 나중에 스크롤
    if (result.verse) {
      pendingScrollVerse.value = result.verse;
    }

    nextTick(() => {
      selectChapter(result.chapter);
    });
  } else {
    // 책만 있으면 책 선택 후 장 선택 대기 (모달 유지)
    selectBook(result.bookId);
    // 검색어 지우고 장 선택 대기
    searchQuery.value = "";
    return; // 모달 닫지 않음
  }
  searchQuery.value = "";
};

// 검색 입력 핸들러 (엔터키)
const handleSearchKeydown = (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    goToSearchResult();
  } else if (event.key === "Escape") {
    searchQuery.value = "";
    searchInputRef.value?.blur();
  }
};

// 모달 열릴 때 검색 초기화 및 포커스
const openModalWithSearch = () => {
  searchQuery.value = "";
  // 현재 보고 있는 책으로 선택 초기화
  selectedBook.value = currentBook.value;
  showModal.value = true;
  nextTick(() => {
    searchInputRef.value?.focus();
    scrollToSelectedBook();
    scrollToSelectedChapter();
  });
};

// 선택된 책의 장 수 계산
const chaptersArray = computed(() => {
  const book = bibleBooks.old
    .concat(bibleBooks.new)
    .find((b) => b.id === selectedBook.value);
  return book ? Array.from({ length: book.chapters }, (_, i) => i + 1) : [];
});

// 날짜 포맷팅 함수 수정
const formatScheduleDate = (dateString) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = getDayOfWeek(dateString);
  return `${month}/${day}(${dayOfWeek})`;
};

// 장 완료 여부 확인 함수
const isChapterCompleted = (book, chapter) => {
  if (!readingDetailResponse.value?.data?.plan_detail) return false;

  const detail = readingDetailResponse.value.data.plan_detail.find((detail) => {
    const isTargetBook = detail.book === book;
    const isInRange =
      chapter >= detail.start_chapter && chapter <= detail.end_chapter;
    return isTargetBook && isInRange;
  });

  return detail?.is_complete || false;
};

// 기본 성경 본문 로드 함수 - 라우팅 역할만 수행
const loadBibleContent = async (book, chapter) => {
  isLoading.value = true;

  try {
    // 역본에 따라 다른 로드 함수 호출
    if (currentVersion.value === "KNT") {
      // 새한글성경(KNT) 전용 로드 함수
      await loadKntBibleContent(book, chapter);
    } else {
      // 나머지 역본들을 위한 표준 로드 함수
      await loadStandardBibleContent(book, chapter);
    }

    // 본문 로드 완료 후 스크롤 위치를 최상단으로 이동
    window.scrollTo({
      top: 0,
      behavior: "instant", // 즉시 이동
    });
  } catch (error) {
    handleBibleContentError(book, chapter);
  } finally {
    isLoading.value = false;

    // 2단계 로딩이 완료된 후 1단계 정보를 로드
    loadUIInfo(book, chapter);
  }
};

// 새한글성경(KNT) 전용 로드 함수 - failback 지원
const loadKntBibleContent = async (book, chapter) => {
  try {
    // composable을 통해 프록시 -> 캐시 서버 순으로 시도
    const result = await fetchKntContent(book, chapter);

    // 현재 책과 장 정보 업데이트
    currentBook.value = book;
    currentChapter.value = chapter;

    if (result.source === 'error') {
      // 모든 소스에서 실패
      handleKntFetchError(book, chapter);
      return;
    }

    // JSON 파싱
    const jsonData = JSON.parse(result.content);

    // 응답 확인 및 파싱
    if (jsonData.found) {
      // JSON 응답의 HTML 콘텐츠를 파싱
      parseKntVersion(jsonData, book, chapter);

      // 캐시에서 가져온 경우 사용자에게 알림 (선택적)
      if (result.fromCache) {
        console.info('[BibleFetch] KNT 콘텐츠를 캐시 서버에서 로드했습니다.');
      }
    } else {
      // 데이터를 찾지 못한 경우
      handleKntContentNotFound(book, chapter);
    }
  } catch (error) {
    console.error('[BibleFetch] KNT 로드 실패:', error);
    handleKntFetchError(book, chapter);
  }
};

// KNT fetch 에러 처리
const handleKntFetchError = (book, chapter) => {
  // 에러 발생 시 북 제목 및 장 설정
  if (!chapterTitle.value) {
    const suffix = book === "psa" ? "편" : "장";
    chapterTitle.value = `${bookNames[book] || ""} ${chapter}${suffix}`;
  }

  const fallbackUrl = getFallbackUrl('KNT', book, chapter);

  // 에러 메시지
  bibleContent.value = `
    <div class="error-message">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h3>대한성서공회 웹사이트에서 성경을 불러오는 과정에서 문제가 발생했어요.</h3>
      <p>공회 서버 상태가 좋지 않거나 매일일독과의 통신이 원활하지 않아요. 대한성서공회 사이트에 직접 접속해보세요.</p>
      <a href="${fallbackUrl}" target="_blank" class="external-link">
        대한성서공회에서 보기
      </a>
    </div>
  `;
};

// 표준 역본 로드 함수 (개역개정, 새번역 등) - failback 지원
const loadStandardBibleContent = async (book, chapter) => {
  try {
    // composable을 통해 프록시 -> 캐시 서버 순으로 시도
    const result = await fetchStandardContent(currentVersion.value, book, chapter);

    // 현재 책과 장 정보 업데이트
    currentBook.value = book;
    currentChapter.value = chapter;

    if (result.source === 'error') {
      // 모든 소스에서 실패
      throw new Error('All sources failed');
    }

    // 표준 파싱 함수 호출
    parseStandardContent(result.content, book, chapter);

    // 캐시에서 가져온 경우 사용자에게 알림 (선택적)
    if (result.fromCache) {
      console.info(`[BibleFetch] ${currentVersion.value} 콘텐츠를 캐시 서버에서 로드했습니다.`);
    }
  } catch (error) {
    console.error('[BibleFetch] 표준 역본 로드 실패:', error);
    throw error; // 상위 함수에서 처리하도록 전달
  }
};

// 표준 역본 HTML 파싱 함수
const parseStandardContent = (htmlText, book, chapter) => {
  // DOMParser 전에 font 태그 전처리 (브라우저의 잘못된 HTML 수정 방지)
  const preprocessedHtml = preprocessFontTags(htmlText);
  const parser = new DOMParser();
  const doc = parser.parseFromString(preprocessedHtml, "text/html");
  const bibleElement = doc.getElementById("tdBible1");

  if (!bibleElement) {
    handleBibleContentError(book, chapter);
    return;
  }

  // 기본 DOM 정리 작업
  cleanupBibleElement(bibleElement);

  // 장 제목 설정
  setChapterTitle(bibleElement, book, chapter);

  // 표준 역본 파싱 로직 호출
  parseGaeVersion(bibleElement, book, chapter);
};

// 각주 처리 함수: 각주를 마커로 변환하거나 제거
const processFootnotes = (text) => {
  if (viewOptions.value.showFootnotes) {
    // 각주를 마커로 변환
    // 원본 구조: <span data-caller="+" class="f"><span class="fr">절번호</span><span class="ft">각주내용</span></span>
    return text.replace(
      /<span[^>]*class="f"[^>]*>[\s\S]*?<span class="ft">([^<]*)<\/span>\s*<\/span>/gs,
      (match, footnoteText) => {
        if (footnoteText && footnoteText.trim()) {
          // 특수문자 이스케이프 (HTML 속성에 안전하게 저장)
          const escapedText = footnoteText.trim()
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
          return `<sup class="footnote-marker" data-footnote="${escapedText}" title="${escapedText}">*</sup>`;
        }
        return '';
      }
    ).replace(
      // 위 패턴으로 매칭되지 않는 나머지 각주 형태도 처리 (중첩 구조)
      /<span[^>]*data-caller[^>]*>[\s\S]*?<\/span>\s*<\/span>\s*<\/span>/g,
      ''
    ).replace(
      // 단순 각주 형태
      /<span[^>]*data-caller[^>]*>[\s\S]*?<\/span>/gs,
      ''
    );
  } else {
    // 각주 완전 제거 (기존 동작)
    // 중첩된 각주 구조 처리: <span class="f">...<span class="fr">...</span><span class="ft">...</span></span>
    return text
      .replace(/<span[^>]*class="f"[^>]*>.*?<\/span>.*?<\/span>.*?<\/span>/gs, '')
      .replace(/<span[^>]*data-caller[^>]*>.*?<\/span>.*?<\/span>.*?<\/span>/gs, '')
      .replace(/<span[^>]*data-caller[^>]*>.*?<\/span>/gs, '');
  }
};

// 새한글성경(KNT) 파싱 함수 수정 - 다양한 형식 대응
const parseKntVersion = (jsonData, book, chapter) => {
  try {
    // JSON 객체인 경우 (일반적인 케이스)
    if (typeof jsonData !== "string" && jsonData.found && jsonData.content) {
      // 장 제목 설정
      const suffix = book === "psa" ? "편" : "장";
      const bookName = bookNames[book] || "";

      // reference가 있으면 사용, 없으면 기본 형식 사용
      if (jsonData.reference) {
        // reference에 "N장" 또는 "N편" 패턴이 있는지 확인 (숫자+장/편)
        if (/\d+(장|편)/.test(jsonData.reference)) {
          chapterTitle.value = jsonData.reference;
        } else {
          // 장/편 단위가 없으면 추가
          chapterTitle.value = `${jsonData.reference}${suffix}`;
        }
      } else {
        // reference가 없으면 기본 형식 사용: "창세기 1장" 또는 "시편 1편"
        chapterTitle.value = `${bookName} ${chapter}${suffix}`;
      }

      // 섹션 제목 초기화
      sectionTitle.value = "";

      // 최종 결과를 담을 배열
      const verses = [];

      // HTML 콘텐츠로부터 모든 요소 추출
      const content = jsonData.content;

      // 1. 모든 HTML 태그별로 분석

      // 장 번호 (건너뛰기)
      content.replace(/<h2[^>]*class="c"[^>]*>\d+<\/h2>/g, "");

      // 섹션 제목들 찾기
      const sectionTitles = [];
      const sectionRegex = /<p class="s">(.*?)<\/p>/g;
      let sectionMatch;
      while ((sectionMatch = sectionRegex.exec(content)) !== null) {
        sectionTitles.push({
          type: "section",
          index: sectionMatch.index,
          content: sectionMatch[1].trim(),
          fullMatch: sectionMatch[0],
        });
      }

      // 부제목 찾기
      const subTitles = [];
      const subTitleRegex = /<p class="sp">(.*?)<\/p>/g;
      let subTitleMatch;
      while ((subTitleMatch = subTitleRegex.exec(content)) !== null) {
        subTitles.push({
          type: "subtitle",
          index: subTitleMatch.index,
          content: subTitleMatch[1].trim(),
          fullMatch: subTitleMatch[0],
        });
      }

      // 설명/주석 찾기 (d 클래스: 시편 머리말, 음악 지시어 등)
      const descriptions = [];
      const descRegex = /<p class="d">(.*?)<\/p>/gs;
      let descMatch;
      while ((descMatch = descRegex.exec(content)) !== null) {
        // 각주 및 verse-span 제거 후 텍스트 추출
        // 중첩된 각주 구조 제거: <span class="f">...<span class="fr">...</span><span class="ft">...</span></span>
        const cleanText = descMatch[1]
          .replace(/<span[^>]*class="f"[^>]*>.*?<\/span>.*?<\/span>.*?<\/span>/gs, "")
          .replace(/<span[^>]*data-caller[^>]*>.*?<\/span>.*?<\/span>.*?<\/span>/gs, "")
          .replace(/<span[^>]*class="verse-span"[^>]*>.*?<\/span>/gs, "")
          .replace(/<span[^>]*class="v"[^>]*>\d+<\/span>/gs, "")
          .replace(/<\/?[^>]+(>|$)/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();

        if (cleanText) {
          descriptions.push({
            type: "description",
            index: descMatch.index,
            content: cleanText,
            fullMatch: descMatch[0],
          });
        }
      }

      // 교차 참조 찾기 (r 클래스)
      const crossRefs = [];
      const crossRefRegex = /<p class="r">(.*?)<\/p>/gs;
      let crossRefMatch;
      while ((crossRefMatch = crossRefRegex.exec(content)) !== null) {
        // 내부 span에서 참조 텍스트 추출
        const cleanText = crossRefMatch[1]
          .replace(/<span[^>]*id="[^"]*"[^>]*>([^<]*)<\/span>/g, "$1")
          .replace(/<\/?[^>]+(>|$)/g, "")
          .trim();

        if (cleanText) {
          crossRefs.push({
            type: "crossref",
            index: crossRefMatch.index,
            content: cleanText,
            fullMatch: crossRefMatch[0],
          });
        }
      }

      // 모든 타입의 구절 단락 찾기 (p.p, p.q1, p.nb 등)
      const paragraphs = [];
      const paragraphRegex =
        /<p(?:\s+[^>]*class="([^"]*)"[^>]*|\s+[^>]*data-vid="[^"]*"[^>]*|\s+[^>]*)>(.*?)<\/p>/gs;
      let paragraphMatch;
      while ((paragraphMatch = paragraphRegex.exec(content)) !== null) {
        const classType = paragraphMatch[1] || "p"; // 클래스가 없으면 'p'로 기본값 설정
        paragraphs.push({
          type: "paragraph",
          class: classType,
          index: paragraphMatch.index,
          content: paragraphMatch[2],
          fullMatch: paragraphMatch[0],
        });
      }

      // 모든 요소를 원래 순서대로 정렬
      const allElements = [
        ...sectionTitles,
        ...subTitles,
        ...descriptions,
        ...crossRefs,
        ...paragraphs,
      ].sort((a, b) => a.index - b.index);

      // 첫 번째 섹션 제목 저장 (있는 경우)
      const firstSection = allElements.find((el) => el.type === "section");
      if (firstSection) {
        sectionTitle.value = firstSection.content;
      }

      // 2. 요소들 순서대로 처리하여 HTML 생성
      const processedSubtitles = new Set();
      const verseMap = new Map(); // 구절 번호별로 텍스트와 클래스 저장
      const verseOrder = []; // 구절 순서 유지
      const nonVerseElements = []; // 섹션 제목 등 구절이 아닌 요소들 저장
      
      allElements.forEach((element, elementIndex) => {
        if (element.type === "section") {
          // 섹션 제목을 원본 인덱스와 함께 저장
          nonVerseElements.push({
            index: element.index,
            html: `<h3 class="section-title">${element.content}</h3>`,
            order: elementIndex
          });
        } else if (element.type === "subtitle") {
          // 부제목 중복 확인 후 처리
          if (!processedSubtitles.has(element.content)) {
            nonVerseElements.push({
              index: element.index,
              html: `<p class="sub-title">${element.content}</p>`,
              order: elementIndex
            });
            processedSubtitles.add(element.content);
          }
        } else if (element.type === "description") {
          // 설명/주석 (시편 머리말, 음악 지시어 등) - 보기 옵션에 따라 표시
          if (viewOptions.value.showDescription) {
            nonVerseElements.push({
              index: element.index,
              html: `<p class="description">${element.content}</p>`,
              order: elementIndex
            });
          }
        } else if (element.type === "crossref") {
          // 교차 참조 - 보기 옵션에 따라 표시
          if (viewOptions.value.showCrossRef) {
            nonVerseElements.push({
              index: element.index,
              html: `<p class="cross-ref">${element.content}</p>`,
              order: elementIndex
            });
          }
        } else if (element.type === "paragraph") {
          // data-vid로 구절 번호 확인 (연속된 시적 구조 처리)
          const vidMatch = element.fullMatch.match(/data-vid="[^:]+:(\d+)"/);
          if (vidMatch) {
            const verseNum = vidMatch[1];
            // 각주 처리 포함한 텍스트 추출
            let processedContent = processFootnotes(element.content);
            const plainText = processedContent
              .replace(/&nbsp;/g, " ")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/<(?!\/?sup[^>]*class="footnote-marker")[^>]+>/g, "")
              .trim();

            if (plainText) {
              const poeticClass = element.class || 'p';
              if (verseMap.has(verseNum)) {
                // 같은 구절 번호에 줄 추가 (시적 구조를 위해 개별 줄로 저장)
                const existing = verseMap.get(verseNum);
                existing.lines.push({
                  text: plainText,
                  class: poeticClass
                });
              } else {
                // 새로운 구절 번호면 추가 (data-vid에서 추출한 경우)
                verseMap.set(verseNum, {
                  lines: [{ text: plainText, class: poeticClass }],
                  order: elementIndex
                });
                verseOrder.push(verseNum);
              }
              return; // forEach에서 다음 요소로
            }
          }
          
          // 일반 구절 처리
          const verseSpans =
            element.content.match(
              /<span class="verse-span"[^>]*>.*?<\/span>/gs
            ) || [];

          // 현재 처리 중인 구절 번호와 텍스트
          let currentVerseNum = null;
          let verseText = "";

          // 각 구절 처리
          if (verseSpans.length > 0) {
            verseSpans.forEach((verseSpan) => {
              // 구절 번호 추출
              const numMatch = verseSpan.match(
                /<span[^>]*class="v"[^>]*>(\d+)<\/span>/
              );

              if (numMatch) {
                // 이전 구절 데이터가 있으면 Map에 저장
                if (currentVerseNum && verseText) {
                  const poeticClass = element.class || 'p';
                  if (verseMap.has(currentVerseNum)) {
                    // 같은 구절 번호가 이미 있으면 줄 추가
                    const existing = verseMap.get(currentVerseNum);
                    existing.lines.push({
                      text: verseText,
                      class: poeticClass
                    });
                  } else {
                    // 새로운 구절 번호면 추가 (줄 배열로 저장)
                    verseMap.set(currentVerseNum, {
                      lines: [{ text: verseText, class: poeticClass }],
                      order: elementIndex
                    });
                    verseOrder.push(currentVerseNum);
                  }
                }

                // 새 구절 시작
                currentVerseNum = numMatch[1];

                // 구절 텍스트 추출 (구절 번호 제거, 각주는 조건부 처리)
                let processedSpan = verseSpan
                  .replace(/<span[^>]*class="v"[^>]*>\d+<\/span>/, "") // 구절 번호 제거
                  .replace(/<span[^>]*class="verse-span"[^>]*>/, "") // 여는 태그 제거
                  .replace(/<\/span>$/, ""); // 닫는 태그 제거

                // 각주 처리 (마커 변환 또는 제거)
                processedSpan = processFootnotes(processedSpan);

                verseText = processedSpan
                  // HTML 엔티티 디코딩
                  .replace(/&nbsp;/g, " ")
                  .replace(/&amp;/g, "&")
                  .replace(/&lt;/g, "<")
                  .replace(/&gt;/g, ">")
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  // 기타 HTML 태그 제거 (footnote-marker는 보존)
                  .replace(/<(?!\/?sup[^>]*class="footnote-marker")[^>]+>/g, "")
                  .trim();
              } else {
                // 구절 번호 없는 경우 - data-verse-id에서 추출 시도 또는 이전 구절의 계속
                let additionalSpan = verseSpan
                  .replace(/<span[^>]*class="verse-span"[^>]*>/, "")
                  .replace(/<\/span>$/, "");

                // 각주 처리 (마커 변환 또는 제거)
                additionalSpan = processFootnotes(additionalSpan);

                const additionalText = additionalSpan
                  // HTML 엔티티 디코딩
                  .replace(/&nbsp;/g, " ")
                  .replace(/&amp;/g, "&")
                  .replace(/&lt;/g, "<")
                  .replace(/&gt;/g, ">")
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  // 기타 HTML 태그 제거 (footnote-marker는 보존)
                  .replace(/<(?!\/?sup[^>]*class="footnote-marker")[^>]+>/g, "")
                  .trim();

                if (additionalText) {
                  if (currentVerseNum) {
                    // 이전 구절에 추가
                    verseText += " " + additionalText;
                  } else {
                    // currentVerseNum이 없으면 data-verse-id에서 추출 시도 (형식: PSA.6.1)
                    const verseIdMatch = verseSpan.match(/data-verse-id="[^.]+\.\d+\.(\d+)"/);
                    if (verseIdMatch) {
                      currentVerseNum = verseIdMatch[1];
                      verseText = additionalText;
                    }
                  }
                }
              }
            });

            // 마지막 구절 처리
            if (currentVerseNum && verseText) {
              const poeticClass = element.class || 'p';
              if (verseMap.has(currentVerseNum)) {
                // 같은 구절 번호가 이미 있으면 줄 추가
                const existing = verseMap.get(currentVerseNum);
                existing.lines.push({
                  text: verseText,
                  class: poeticClass
                });
              } else {
                // 새로운 구절 번호면 추가 (줄 배열로 저장)
                verseMap.set(currentVerseNum, {
                  lines: [{ text: verseText, class: poeticClass }],
                  order: elementIndex
                });
                verseOrder.push(currentVerseNum);
              }
            }
          } else {
            // verseSpans이 없을 경우 - 직접 내용에서 구절 찾기 시도
            // 예: <p class="p">1 욥이 여호와께 대답했다.</p> 형식

            // 구절 번호 패턴을 찾음 (줄 시작에 숫자)
            const directVerseMatch = element.content.match(
              /^(?:<[^>]*>)*\s*(\d+)\s+(.+)$/
            );

            if (directVerseMatch) {
              const verseNum = directVerseMatch[1];
              let verseContent = directVerseMatch[2];

              // 각주 처리 (마커 변환 또는 제거)
              verseContent = processFootnotes(verseContent);

              // HTML 태그 제거 및 엔티티 디코딩
              verseContent = verseContent
                // HTML 엔티티 디코딩
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                // 기타 HTML 태그 제거 (footnote-marker는 보존)
                .replace(/<(?!\/?sup[^>]*class="footnote-marker")[^>]+>/g, "")
                .trim();

              // 시적 구조 클래스 추가
              const poeticClass = element.class || 'p';
              if (verseMap.has(verseNum)) {
                // 같은 구절 번호가 이미 있으면 줄 추가
                const existing = verseMap.get(verseNum);
                existing.lines.push({
                  text: verseContent,
                  class: poeticClass
                });
              } else {
                // 새로운 구절 번호면 추가 (줄 배열로 저장)
                verseMap.set(verseNum, {
                  lines: [{ text: verseContent, class: poeticClass }],
                  order: elementIndex
                });
                verseOrder.push(verseNum);
              }
            } else {
              // 구절 번호 패턴이 없는 경우
              // p 태그가 특수 클래스를 가진 경우에만 처리 (단순 p 태그는 무시)
              const plainText = element.content
                // HTML 엔티티 디코딩
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/<\/?[^>]+(>|$)/g, "")
                .trim();
              // 시적 구조나 특수 형식을 가진 클래스들 처리
              const poeticClasses = ['q1', 'q2', 'q3', 'q4', 'm', 'pi1', 'pi2', 'nb', 'pc', 'pm', 'pmo', 'pmc'];
              if (
                plainText &&
                poeticClasses.includes(element.class)
              ) {
                nonVerseElements.push({
                  index: element.index,
                  html: `<div class="paragraph ${element.class}">${plainText}</div>`,
                  order: elementIndex
                });
              }
              // 일반 p 태그는 렌더링하지 않음 (중복 방지)
            }
          }
        }
      });
      
      // 모든 요소를 원본 순서대로 정렬하여 verses 배열 구성
      const allContentElements = [];
      
      // 구절들을 원본 인덱스와 함께 저장 (여러 줄을 개별 요소로 렌더링)
      verseOrder.forEach(verseNum => {
        const verseData = verseMap.get(verseNum);
        if (verseData && verseData.lines) {
          // 각 줄을 별도의 verse-line 요소로 렌더링
          const linesHtml = verseData.lines.map((line, idx) => {
            if (idx === 0) {
              // 첫 줄: 구절 번호 포함
              return `<div class="verse-line ${line.class}"><span class="verse-number">${verseNum}</span><span class="verse-text">${line.text}</span></div>`;
            } else {
              // 후속 줄: 번호 없이 들여쓰기만 (continuation 클래스 추가)
              return `<div class="verse-line continuation ${line.class}"><span class="verse-text">${line.text}</span></div>`;
            }
          }).join('');

          allContentElements.push({
            order: verseData.order,
            html: `<div class="verse-group">${linesHtml}</div>`
          });
        }
      });
      
      // 구절이 아닌 요소들 추가
      allContentElements.push(...nonVerseElements);
      
      // order 기준으로 정렬
      allContentElements.sort((a, b) => a.order - b.order);
      
      // HTML 배열 생성
      allContentElements.forEach(element => {
        verses.push(element.html);
      });

      // 최종 HTML 설정
      if (verses.length > 0) {
        bibleContent.value = verses.join("");
      } else {
        handleKntContentNotFound(book, chapter);
      }
    } else {
      // HTML 문자열인 경우 (이전 방식 호환)
      const preprocessedHtml = preprocessFontTags(jsonData);
      const parser = new DOMParser();
      const doc = parser.parseFromString(preprocessedHtml, "text/html");

      // 다양한 방식으로 시도
      const bibleElement =
        doc.querySelector("#tdBible1") ||
        doc.querySelector(".bible-content") ||
        doc.querySelector("body");

      if (bibleElement) {
        extractKntVerses(bibleElement);
      } else {
        handleKntContentNotFound(book, chapter);
      }
    }
  } catch (error) {
    handleKntContentNotFound(book, chapter);
  }
};

// 새한글성경 콘텐츠를 찾을 수 없을 때 처리
const handleKntContentNotFound = (book, chapter) => {
  // 장 제목 설정
  if (!chapterTitle.value) {
    const suffix = book === "psa" ? "편" : "장";
    chapterTitle.value = `${bookNames[book] || ""} ${chapter}${suffix}`;
  }

  // 안내 메시지 표시
  bibleContent.value = `
      <div class="error-message">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3>대한성서공회 웹사이트에서 성경을 불러오는 과정에서 문제가 발생했어요.</h3>
        <p>공회 서버 상태가 좋지 않거나 매일일독과의 통신이 원활하지 않아요. 대한성서공회 사이트에 직접 접속해보세요.</p>
        <a href="https://www.bskorea.or.kr/KNT/index.php?chapter=${book.toUpperCase()}.${chapter}" target="_blank" class="external-link">
          대한성서공회에서 보기
        </a>
      </div>
    `;
};

// 새한글성경 구절 추출 함수
const extractKntVerses = (bibleElement) => {
  const verses = [];

  // 먼저 paragraph 요소 검색
  const paragraphs = bibleElement.querySelectorAll("p");

  if (paragraphs.length > 0) {
    // 구절 패턴: 숫자 다음에 텍스트
    paragraphs.forEach((p) => {
      const text = p.textContent.trim();
      const match = text.match(/^(\d+)(.+)$/);

      if (match) {
        const verseNum = match[1].trim();
        const verseText = match[2].trim();

        verses.push(
          `<div class="verse"><span class="verse-number">${verseNum}</span><span class="verse-text">${verseText}</span></div>`
        );
      } else if (text) {
        // 구절 번호가 없는 경우 - 제목일 수 있음
        verses.push(`<h3 class="section-title">${text}</h3>`);
      }
    });
  } else {
    // 다른 구조의 요소 시도 (div, span 등)
    const elements = bibleElement.querySelectorAll("div, span");

    elements.forEach((el) => {
      const text = el.textContent.trim();
      // 구절 패턴 찾기
      const match = text.match(/^(\d+)(.+)$/);

      if (match && match[1].length < 4) {
        // 구절 번호는 보통 짧음
        const verseNum = match[1].trim();
        const verseText = match[2].trim();

        verses.push(
          `<div class="verse"><span class="verse-number">${verseNum}</span><span class="verse-text">${verseText}</span></div>`
        );
      }
    });
  }

  // 추출된 구절이 있으면 표시
  if (verses.length > 0) {
    bibleContent.value = verses.join("");
  }
};

// DOM 요소 정리 함수
const cleanupBibleElement = (bibleElement) => {
  // section-title 내부의 a 태그는 href만 제거하고 유지
  const sectionTitles = bibleElement.querySelectorAll("h4.section-title");
  sectionTitles.forEach((section) => {
    const anchors = section.querySelectorAll("a");
    anchors.forEach((anchor) => {
      anchor.removeAttribute("href");
    });
  });

  // 그 외의 a 태그는 완전히 제거
  const otherAnchors = bibleElement.querySelectorAll("a:not(h4.section-title a)");
  otherAnchors.forEach((anchor) => {
    anchor.remove();
  });

  // 기타 불필요한 요소 제거
  const elementsToRemove = bibleElement.querySelectorAll(
    'input, select, form, .fontcontrol, [style*="display:none"], [style*="display: none"]'
  );
  elementsToRemove.forEach((el) => el.remove());
};

// 장 제목 설정 함수
const setChapterTitle = (bibleElement, book, chapter) => {
  // 장 제목 설정 (책 이름 + 장 번호) - 시편은 "편"으로 표시
  const chapNum = bibleElement.querySelector(".chapNum");
  if (chapNum) {
    // 원본 텍스트를 가져옴 (예: "제 1 편" 또는 "제 1 장")
    let chapterText = chapNum.textContent;

    // '제'와 책 타입(장/편)을 모두 제거하고 숫자만 추출
    let chapterNumber = chapterText
      .replace("제", "")
      .replace("장", "")
      .replace("편", "")
      .trim();

    // 시편인 경우 "편"으로 표시, 나머지는 "장"으로 표시
    const suffix = book === "psa" ? "편" : "장";
    chapterTitle.value = `${bookNames[book] || ""} ${chapterNumber}${suffix}`;
  } else {
    // .chapNum 요소가 없는 경우 (특히 1장짜리 책)
    const suffix = book === "psa" ? "편" : "장";
    chapterTitle.value = `${bookNames[book] || ""} ${chapter}${suffix}`;
  }
};

// 개역개정 파싱 함수
const parseGaeVersion = (bibleElement, book, chapter) => {
  const verses = [];
  let currentSection = "";

  // 시편 1편 특별 처리
  if (book === "psa" && chapter === 1) {
    parseGaePsalm1(bibleElement, verses);
  } else {
    // 일반적인 장 파싱
    parseGaeNormalChapter(bibleElement, verses);
  }

  // 첫 번째 섹션 제목 설정 (있는 경우에만)
  const firstTitle = bibleElement.querySelector("h4.section-title");
  if (firstTitle) {
    sectionTitle.value = firstTitle.textContent.trim();
  } else {
    sectionTitle.value = ""; // 섹션 제목이 없는 경우
  }

  bibleContent.value = verses.join("");
};

// DOMParser 전에 font 태그를 정리하는 함수
// 브라우저가 잘못된 HTML을 "수정"하는 것을 방지
const preprocessFontTags = (html) => {
  let processed = html;

  // 1단계: font class="name/area/orgin" 태그를 span으로 변환
  // 이 태그들은 내부에 다른 태그가 없으므로 [^<]* 사용 가능
  let prevLength = 0;
  let iterations = 0;
  while (processed.length !== prevLength && iterations < 10) {
    prevLength = processed.length;
    iterations++;
    processed = processed
      .replace(/<font\s+class="name">([^<]*)<\/font>/gi, '<span class="bible-name">$1</span>')
      .replace(/<font\s+class="area">([^<]*)<\/font>/gi, '<span class="bible-area">$1</span>')
      .replace(/<font\s+class="orgin">([^<]*)<\/font>/gi, '$1');
  }

  // 2단계: smallTitle은 내부에 <a> 태그가 있을 수 있으므로 별도 처리
  // [\s\S]*? 사용하되, </font>가 나오면 멈춤
  processed = processed.replace(/<font\s+class="smallTitle">([\s\S]*?)<\/font>/gi, '<h4 class="section-title">$1</h4>');

  // 3단계: chapNum 제거
  processed = processed.replace(/<font\s+class="chapNum">[^<]*<\/font>/gi, '');

  // 4단계: 나머지 font 태그 (size 등) 내용만 유지 - 내부에 태그 없는 경우
  iterations = 0;
  prevLength = 0;
  while (processed.length !== prevLength && iterations < 10) {
    prevLength = processed.length;
    iterations++;
    processed = processed.replace(/<font[^>]*>([^<]*)<\/font>/gi, '$1');
  }

  // 5단계: 고아 </font> 태그 제거 (원본 HTML의 오류)
  processed = processed.replace(/<\/font>/gi, '');

  return processed;
};

// 특수 클래스 보존 함수: font 태그를 span으로 변환
const preserveSpecialClasses = (html) => {
  return html
    // font.name -> span.bible-name (인명)
    .replace(/<font\s+class="name">([^<]*)<\/font>/gi, '<span class="bible-name">$1</span>')
    // font.area -> span.bible-area (지명)
    .replace(/<font\s+class="area">([^<]*)<\/font>/gi, '<span class="bible-area">$1</span>')
    // font.orgin (원어/음역어)는 일반 텍스트로 변환
    .replace(/<font\s+class="orgin">([^<]*)<\/font>/gi, '$1')
    // 다른 font 태그 (size 등)는 내용만 유지
    .replace(/<font[^>]*>([^<]*)<\/font>/gi, '$1')
    // 남은 고아 </font> 태그 제거
    .replace(/<\/font>/gi, '');
};

// 구절 텍스트에서 특수 클래스만 보존하고 나머지 태그 제거
const cleanVerseTextWithSpecialClasses = (html) => {
  let text = html;

  // 인명/지명 강조 옵션이 켜져 있으면 특수 클래스를 span으로 변환
  if (viewOptions.value.highlightNames) {
    text = preserveSpecialClasses(text);
    // bible-name, bible-area 클래스를 가진 span과 그 닫는 태그만 보존
    // 1. 먼저 bible-* span 태그를 플레이스홀더로 치환
    const placeholders = [];
    text = text.replace(/<span\s+class="bible-(name|area)">[^<]*<\/span>/gi, (match) => {
      placeholders.push(match);
      return `__BIBLE_PLACEHOLDER_${placeholders.length - 1}__`;
    });
    // 2. 나머지 모든 태그 제거
    text = text.replace(/<[^>]+>/g, '');
    // 3. 플레이스홀더를 원래 태그로 복원
    text = text.replace(/__BIBLE_PLACEHOLDER_(\d+)__/g, (_, idx) => placeholders[parseInt(idx)]);
  } else {
    // 옵션이 꺼져 있으면 모든 태그 제거
    text = text.replace(/<[^>]+>/g, '');
  }
  return text.trim();
};

// 개역개정 일반 장 파싱 함수
// Note: DOMParser가 잘못된 HTML(span 안의 div 등)을 수정하면서
// 일부 절이 중첩될 수 있으므로 querySelectorAll로 모든 요소를 찾음
const parseGaeNormalChapter = (bibleElement, verses) => {
  // 섹션 타이틀과 절 번호를 모두 찾아서 문서 순서대로 처리
  const sectionTitles = bibleElement.querySelectorAll("h4.section-title");
  const numberSpans = bibleElement.querySelectorAll(".number");

  // 섹션 타이틀 위치 맵 생성 (절 번호 기준으로 삽입 위치 결정)
  const titlePositions = new Map();
  sectionTitles.forEach((title) => {
    // 다음 형제 요소들 중에서 첫 번째 절 번호 찾기
    let nextEl = title.nextElementSibling;
    while (nextEl) {
      const numSpan = nextEl.querySelector?.(".number") || (nextEl.classList?.contains("number") ? nextEl : null);
      if (numSpan) {
        const verseNum = parseInt(numSpan.textContent.trim());
        if (!isNaN(verseNum)) {
          titlePositions.set(verseNum, title);
          break;
        }
      }
      nextEl = nextEl.nextElementSibling;
    }
  });

  // 섹션 타이틀이 절 앞에 없으면 문서 순서로 처리
  // TreeWalker를 사용하여 문서 순서대로 순회
  const processedVerses = new Set();
  const walker = document.createTreeWalker(
    bibleElement,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (node.tagName === "H4" && node.classList?.contains("section-title")) {
          return NodeFilter.FILTER_ACCEPT;
        }
        if (node.classList?.contains("number")) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );

  let currentNode;
  while ((currentNode = walker.nextNode())) {
    if (currentNode.tagName === "H4" && currentNode.classList?.contains("section-title")) {
      // 섹션 타이틀 처리
      let titleText = currentNode.textContent
        .trim()
        .replace(/\(\s*\)/g, "")
        .replace(/\s+/g, " ")
        .trim();

      titleText = titleText.replace(
        /(\([^)]+\))/g,
        '<span class="reference">$1</span>'
      );

      if (titleText) {
        verses.push(`<h3 class="section-title">${titleText}</h3>`);
      }
    } else if (currentNode.classList?.contains("number")) {
      // 절 번호 처리
      const number = currentNode.textContent.trim().replace(/\s+/g, "");

      // 중복 방지
      if (processedVerses.has(number)) continue;
      processedVerses.add(number);

      // 부모 span에서 본문 추출
      const parentSpan = currentNode.parentElement;
      if (parentSpan && parentSpan.tagName === "SPAN") {
        let rawHtml = parentSpan.innerHTML;
        rawHtml = rawHtml.replace(/<span[^>]*class="number"[^>]*>.*?<\/span>/gi, '');
        let text = cleanVerseTextWithSpecialClasses(rawHtml);

        verses.push(
          `<div class="verse"><span class="verse-number">${number}</span><span class="verse-text">${text}</span></div>`
        );
      }
    }
  }

  // 내용이 없으면 텍스트 상자로 직접 추출 시도 (백업 방법)
  if (verses.length === 0) {
    extractVersesFromTextNodes(bibleElement, verses);
  }
};

// 개역개정 시편 1편 특별 처리 함수
const parseGaePsalm1 = (bibleElement, verses) => {
  const fTag = bibleElement.querySelector("f"); // 시편 1편 특유의 f 태그 찾기

  if (fTag) {
    // f 태그 내의 모든 span 요소 처리
    const spans = fTag.querySelectorAll("span");
    spans.forEach((span) => {
      const numberSpan = span.querySelector(".number");
      if (numberSpan) {
        const number = numberSpan.textContent.trim().replace(/\s+/g, "");

        // innerHTML에서 번호 span 제거 후 특수 클래스 보존
        let rawHtml = span.innerHTML;
        rawHtml = rawHtml.replace(/<span[^>]*class="number"[^>]*>.*?<\/span>/gi, '');
        let text = cleanVerseTextWithSpecialClasses(rawHtml);

        verses.push(
          `<div class="verse"><span class="verse-number">${number}</span><span class="verse-text">${text}</span></div>`
        );
      }
    });
  }
};

// 백업 방법: 텍스트 노드에서 구절 추출
const extractVersesFromTextNodes = (bibleElement, verses) => {
  const textNodes = Array.from(bibleElement.querySelectorAll("span")).filter(
    (span) => span.querySelector(".number")
  );

  textNodes.forEach((node) => {
    const numberSpan = node.querySelector(".number");
    if (numberSpan) {
      const number = numberSpan.textContent.trim().replace(/\s+/g, "");

      // innerHTML에서 번호 span 제거 후 특수 클래스 보존
      let rawHtml = node.innerHTML;
      rawHtml = rawHtml.replace(/<span[^>]*class="number"[^>]*>.*?<\/span>/gi, '');
      let text = cleanVerseTextWithSpecialClasses(rawHtml);

      verses.push(
        `<div class="verse"><span class="verse-number">${number}</span><span class="verse-text">${text}</span></div>`
      );
    }
  });
};

// 오류 처리 함수
const handleBibleContentError = (book, chapter) => {
  // 에러 발생 시에도 chapterTitle 업데이트
  if (!chapterTitle.value) {
    const suffix = book === "psa" ? "편" : "장";
    chapterTitle.value = `${bookNames[book] || ""} ${chapter}${suffix}`;
  }

  // 타임아웃이나 네트워크 오류 발생 시 안내 메시지 표시
  bibleContent.value = `
      <div class="error-message">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3>대한성서공회 웹사이트에서 성경을 불러오는 과정에서 문제가 발생했어요.</h3>
        <p>공회 서버 상태가 좋지 않거나 매일일독과의 통신이 원활하지 않아요. 대한성서공회 사이트에 직접 접속해보세요.</p>
      <a href="https://www.bskorea.or.kr/bible/korbibReadpage.php?version=${currentVersion.value}&book=${book}&chap=${chapter}" target="_blank" class="external-link">
          대한성서공회에서 보기
        </a>
      </div>
    `;
};

// 상단 UI 정보 로드 함수
const loadUIInfo = async (book, chapter) => {
  try {
    // 이미 해당 book과 chapter에 대한 API 응답이 있는지 확인
    const hasSameData =
      readingDetailResponse.value?.data &&
      readingDetailResponse.value.data.book === book &&
      readingDetailResponse.value.data.chapter === chapter;

    // 이미 동일한 데이터가 있으면 API 호출 스킵
    if (hasSameData) {
      return;
    }

    // 필요한 경우에만 API 호출
    readingDetailResponse.value = await api.get("/api/v1/todos/detail/", {
      params: {
        plan_id: route.query.plan,
        book,
        chapter,
      },
    });
  } catch (error) {
  }
};

// goToNextChapter 함수 수정
const goToNextChapter = (event) => {
  if (event && event.currentTarget) {
    event.currentTarget.blur();
  }

  const maxChapter = bookChapters[currentBook.value];
  const nextChapter = Number(currentChapter.value) + 1;

  // 현재 구간 정보 확인
  const currentDetail = currentPlanDetail.value;

  // 로그인한 사용자이고, 현재 장이 구간의 마지막 장인 경우에만 완료 확인 모달 표시
  if (
    authStore.isAuthenticated &&
    currentDetail &&
    !currentDetail.is_complete && // 읽지 않은 일정일 때만
    currentBook.value === currentDetail.book &&
    currentChapter.value === currentDetail.end_chapter
  ) {
    // 완료 확인 모달 표시
    currentAction.value = "complete";
    modalSource.value = "next-button";
    showCompleteConfirmModal.value = true;
    return;
  }

  if (nextChapter <= maxChapter) {
    // 같은 책의 다음 장
    router.push({
      path: "/reading",
      query: {
        ...route.query,
        book: currentBook.value,
        chapter: nextChapter.toString(),
      },
    });
    loadBibleContent(currentBook.value, nextChapter);
  } else {
    // 다음 책의 첫 장으로
    const books = Object.keys(bookNames);
    const currentBookIndex = books.indexOf(currentBook.value);
    if (currentBookIndex < books.length - 1) {
      const nextBook = books[currentBookIndex + 1];
      router.push({
        path: "/reading",
        query: {
          ...route.query,
          book: nextBook,
          chapter: "1",
        },
      });
      loadBibleContent(nextBook, 1);
    }
  }
};

// 이전 장으로 이동 - 터치 상태 초기화 추가
const goToPrevChapter = (event) => {
  if (event && event.currentTarget) {
    event.currentTarget.blur();
  }

  // 명시적으로 숫자로 변환
  const prevChapter = Number(currentChapter.value) - 1;

  if (prevChapter >= 1) {
    // 같은 책의 이전 장
    router.push({
      path: "/reading",
      query: {
        ...route.query,
        book: currentBook.value,
        chapter: prevChapter.toString(), // 문자열로 변환하여 전달
      },
    });
    loadBibleContent(currentBook.value, prevChapter);
  } else {
    // 이전 책의 마지막 장으로
    const books = Object.keys(bookNames);
    const currentBookIndex = books.indexOf(currentBook.value);
    if (currentBookIndex > 0) {
      const prevBook = books[currentBookIndex - 1];
      const lastChapter = bookChapters[prevBook];
      router.push({
        path: "/reading",
        query: {
          ...route.query,
          book: prevBook,
          chapter: lastChapter.toString(), // 문자열로 변환하여 전달
        },
      });
      loadBibleContent(prevBook, lastChapter);
    }
  }
};

// 책 선택 시 처리
const selectBook = (bookId) => {
  selectedBook.value = bookId;

  // 책이 선택되면 장 영역도 스크롤
  nextTick(() => {
    // 약간 지연 후 장 영역 스크롤 (책 선택 후 장 목록이 렌더링될 시간 필요)
    setTimeout(() => {
      scrollToSelectedChapter();
    }, 50);
  });
};

// 장 선택 시 처리
const selectChapter = (chapter) => {
  // URL을 명시적으로 업데이트하되, 기존 쿼리 파라미터 유지
  router.push({
    path: "/reading",
    query: {
      ...route.query,
      book: selectedBook.value,
      chapter: chapter,
    },
  });
  loadBibleContent(selectedBook.value, chapter);
  showModal.value = false;
};

// 성경책 스크롤 위치 조정을 위한 ref 추가
const booksSection = ref(null);

// 선택된 책으로 스크롤 - 부드러운 스크롤 복원
const scrollToSelectedBook = () => {
  if (!booksSection.value) return;

  nextTick(() => {
    const activeBook = booksSection.value.querySelector(
      `.book-button.active, .book-button[data-id="${currentBook.value}"]`
    );

    if (activeBook) {
      const container = booksSection.value;
      const bookTop = activeBook.offsetTop;
      const containerHeight = container.clientHeight;

      // 부드러운 스크롤 복원
      container.scrollTo({
        top: bookTop - containerHeight / 2 + activeBook.clientHeight / 2,
        behavior: "smooth",
      });
    }
  });
};

// 장 영역을 위한 ref 추가
const chaptersSection = ref(null);

// 선택된 장으로 스크롤 - 부드러운 스크롤 적용
const scrollToSelectedChapter = () => {
  if (!chaptersSection.value) return;

  nextTick(() => {
    const activeChapter = chaptersSection.value.querySelector(
      `.chapter-button.active, .chapter-button[data-chapter="${currentChapter.value}"]`
    );

    if (activeChapter) {
      const container = chaptersSection.value;
      const chapterTop = activeChapter.offsetTop;
      const chapterLeft = activeChapter.offsetLeft;
      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;

      // 부드러운 스크롤 적용
      container.scrollTo({
        top: chapterTop - containerHeight / 2 + activeChapter.clientHeight / 2,
        left: chapterLeft - containerWidth / 2 + activeChapter.clientWidth / 2,
        behavior: "smooth",
      });
    }
  });
};

// 모달이 열릴 때 처리 - 시간차 스크롤 적용
watch(showModal, (newValue) => {
  if (newValue) {
    // 모달이 열릴 때 selectedBook을 현재 책으로 설정
    selectedBook.value = currentBook.value;

    // 왼쪽 먼저 스크롤 후 오른쪽 스크롤
    setTimeout(() => {
      scrollToSelectedBook();

      // 왼쪽 스크롤 후 약간 지연 후 오른쪽 스크롤
      setTimeout(() => {
        scrollToSelectedChapter();
      }, 150);
    }, 100);
  }
});

// 모달 열릴 때 body 스크롤 제어
const toggleBodyScroll = (isModalOpen) => {
  if (isModalOpen) {
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.touchAction = "none";
  } else {
    const scrollY = document.body.style.top;
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
    document.body.style.top = "";
    document.body.style.touchAction = "";
    window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
  }
};

// 모든 모달 상태를 감시하는 watch
watch(
  [showLoginModal, showModal, showScheduleModal, showVersionModal, showReadingSettingsModal],
  ([newLoginModal, newShowModal, newScheduleModal, newVersionModal, newReadingSettingsModal]) => {
    toggleBodyScroll(
      newLoginModal || newShowModal || newScheduleModal || newVersionModal || newReadingSettingsModal
    );
  }
);

// 읽기 설정 변경 시 성경 내용 다시 로드 (스토어 연동)
watch(
  () => [viewOptions.value.showDescription, viewOptions.value.showCrossRef, viewOptions.value.highlightNames, viewOptions.value.showFootnotes, viewOptions.value.verseJoining],
  () => {
    if (currentBook.value && currentChapter.value) {
      loadBibleContent(currentBook.value, currentChapter.value);
    }
  }
);

// 로그인 페이지로 이동
const goToLogin = () => {
  const queryString = route.query
    ? new URLSearchParams(Object.entries(route.query)).toString()
    : "";
  const currentPath = `${route.path}${queryString ? "?" + queryString : ""}`;
  navigateTo({
    path: "/login",
    query: {
      redirect: currentPath,
    },
  });
  showLoginModal.value = false;
};

// 터치 디바이스 감지 함수 추가
const detectTouchDevice = () => {
  if (!process.client) return false; // SSR 체크

  const hasTouchClass =
    document.documentElement.classList.contains("touch-device");
  if (hasTouchClass) return true; // 이미 검사했으면 바로 반환

  const isTouchDevice =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;

  if (isTouchDevice) {
    document.documentElement.classList.add("touch-device");
  } else {
    document.documentElement.classList.add("no-touch-device");
  }

  return isTouchDevice;
};
// 페이지 마운트 시 터치 디바이스 감지 실행
onMounted(async () => {
  detectTouchDevice();
  window.addEventListener("scroll", handleScroll, { passive: true });

  // 읽기 설정 스토어 초기화
  await readingSettingsStore.initialize();

  // URL 파라미터에서 정보 추출
  const { book = "", chapter = "", plan: planId, version = "" } = route.query;

  // URL에 역본 정보가 있으면 적용
  if (version && versionNames[version]) {
    currentVersion.value = version;
  }

  // 브라우저 환경에서만 실행되도록 조건 추가
  if (process.client) {
    document.addEventListener("click", hideCopyMenuOnOutsideClick);
  }

  try {
    // book과 chapter 파라미터가 모두 있는 경우
    if (book && chapter) {
      const params = { book, chapter };
      if (planId) params.plan_id = planId;

      readingDetailResponse.value = await api.get("/api/v1/todos/detail/", {
        params,
      });
      const { book: responseBook, chapter: responseChapter } =
        readingDetailResponse.value.data;

      currentBook.value = responseBook;
      currentChapter.value = responseChapter;
      loadBibleContent(responseBook, responseChapter);
      return;
    }

    // 파라미터가 없는 경우 기본값 설정
    const defaultBook = "gen";
    const defaultChapter = "1";

    // 필수 파라미터가 없고 plan이 있는 경우 오늘 날짜 기준 조회
    if (planId) {
      const today = new Date().toISOString().split("T")[0];
      const { data: statusData } = await api.get("/api/todos/status/", {
        params: { date: today, plan_id: planId },
      });

      // URL 업데이트 및 상세 정보 조회
      const params = {
        plan_id: statusData.plan_id,
        book: statusData.book,
        chapter: statusData.start_chapter,
      };

      router.replace({ query: { ...route.query, ...params } });
      readingDetailResponse.value = await api.get("/api/todos/detail/", {
        params,
      });

      const { book: detailBook, chapter: detailChapter } =
        readingDetailResponse.value.data;
      currentBook.value = detailBook;
      currentChapter.value = detailChapter;
      loadBibleContent(detailBook, detailChapter);
      return;
    }

    // 기본값으로 설정
    router.replace({
      query: { ...route.query, book: defaultBook, chapter: defaultChapter },
    });

    currentBook.value = defaultBook;
    currentChapter.value = Number(defaultChapter);
    await loadBibleContent(defaultBook, Number(defaultChapter));
  } catch (error) {

    // 오류 시 기본값으로 설정
    const defaultBook = "gen";
    const defaultChapter = "1";

    router.replace({
      query: { ...route.query, book: defaultBook, chapter: defaultChapter },
    });

    currentBook.value = defaultBook;
    currentChapter.value = Number(defaultChapter);
    await loadBibleContent(defaultBook, Number(defaultChapter));
  }

  // DOM 업데이트 후 장 표시 상태 업데이트
  await nextTick();
  setTimeout(updateChapterDisplay, 100);
});

// 스케줄 모달 관련 함수들
const openScheduleModal = () => {
  showScheduleModal.value = true;

  // 모달이 열린 후 scheduleModalMounted 상태 변경
  // 이를 통해 스크롤 함수 실행 시점 제어
  setTimeout(() => {
    scheduleModalMounted.value = true;
  }, 100);
};

const closeScheduleModal = () => {
  showScheduleModal.value = false;
  scheduleModalMounted.value = false;
};

// 글자 크기 조절 함수 (스토어 위임)
const adjustFontSize = (delta) => {
  readingSettingsStore.adjustFontSize(delta);
};

// 글자 크기 초기화 함수 (스토어 위임)
const resetFontSize = () => {
  readingSettingsStore.updateSetting('fontSize', DEFAULT_FONT_SIZE);
};

// 뒤로가기 처리 함수 수정
const handleBackNavigation = () => {
  const { from } = route.query;

  // from 파라미터가 있는 경우 해당 경로로 이동
  if (from) {
    // 현재 query 파라미터에서 from을 제외한 나머지를 유지
    const { from: _, ...restQuery } = route.query;
    router.push({
      path: `/${from}`,
      query: restQuery, // 나머지 query 파라미터 유지
    });
  } else {
    // from이 없는 경우 홈으로 이동 (기존 동작 유지)
    router.push("/");
  }
};

// URL 복사 함수
const copyCurrentUrl = async () => {
  try {
    const currentUrl = window.location.href;
    await navigator.clipboard.writeText(currentUrl);

    if (toast.value) {
      toast.value.show("링크가 클립보드에 복사되었습니다", "success");
    }
  } catch (error) {
    console.error("URL 복사 실패:", error);
    if (toast.value) {
      toast.value.show("링크 복사에 실패했습니다", "error");
    }
  }
};

// 오디오 링크 처리 함수 추가
const handleAudioLink = (audioLink) => {
  // 유튜브 URL에서 비디오 ID 추출
  const videoId = audioLink.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/
  )?.[1];

  if (!videoId) {
    // 유튜브 링크가 아니거나 ID를 추출할 수 없는 경우 기본 링크로 열기
    window.open(audioLink, "_blank");
    return;
  }

  // 모바일 기기 체크
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // 모바일에서는 앱 스키마 사용
    const youtubeAppUrl = `vnd.youtube://${videoId}`;
    const webUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 앱으로 열기 시도
    window.location.href = youtubeAppUrl;

    // 앱이 없는 경우를 위한 타임아웃
    const timeout = setTimeout(() => {
      window.location.href = webUrl;
    }, 2500);

    // 페이지를 떠날 때 타임아웃 제거
    window.onblur = () => {
      clearTimeout(timeout);
    };
  } else {
    // PC에서는 새 탭으로 열기
    window.open(audioLink, "_blank");
  }
};

// 모달에서 일정 클릭 시 처리
const handleScheduleClick = (schedule) => {
  const { book, start_chapter } = schedule;

  // bibleBooks에서 책 코드 찾기
  const allBooks = [...bibleBooks.old, ...bibleBooks.new];
  const bookCode = allBooks.find((b) => b.name === book)?.id;

  if (!bookCode) {
    return;
  }

  // 기존 URL 파라미터 유지하면서 book과 chapter만 변경
  const query = {
    ...route.query, // 기존 쿼리 파라미터 유지
    book: bookCode,
    chapter: start_chapter,
  };

  // 모달 닫기
  closeScheduleModal();

  // 페이지 이동 및 성경 본문 로드
  router.push({
    path: "/reading",
    query,
  });

  // 성경 본문 로드
  loadBibleContent(bookCode, start_chapter);
};

// 읽기 완료 처리 함수 수정
const handleCompleteReading = () => {
  // 로그인 체크 추가
  if (!authStore.isAuthenticated) {
    showLoginModal.value = true;
    return;
  }

  if (isUpdatingStatus.value || !readingDetailResponse.value?.data) return;

  // 완료 액션으로 설정하고 모달 표시
  currentAction.value = "complete";
  modalSource.value = "complete-button";
  showCompleteConfirmModal.value = true;
};

// 읽기 완료 취소 처리 함수 수정
const handleCancelReading = () => {
  // 로그인 체크 추가
  if (!authStore.isAuthenticated) {
    showLoginModal.value = true;
    return;
  }

  if (isUpdatingStatus.value || !readingDetailResponse.value?.data) return;

  currentAction.value = "cancel";
  showCompleteConfirmModal.value = true;
};

// 현재 장에 해당하는 plan_detail을 찾는 computed 속성
const currentPlanDetail = computed(() => {
  if (!readingDetailResponse.value?.data?.plan_detail) return null;

  return readingDetailResponse.value.data.plan_detail.find((detail) => {
    const isCurrentBook = detail.book === currentBook.value;
    const isInChapterRange =
      currentChapter.value >= detail.start_chapter &&
      currentChapter.value <= detail.end_chapter;
    return isCurrentBook && isInChapterRange;
  });
});

// 구간 정보 계산 computed 수정
const sectionInfo = computed(() => {
  const detail = currentPlanDetail.value;

  if (!detail) {
    // plan_detail이 없는 경우 기본 데이터 사용
    return {
      book: readingDetailResponse.value?.data?.book,
      book_kor: readingDetailResponse.value?.data?.book_kor,
      start_chapter: Number(currentChapter.value),
      end_chapter: Number(currentChapter.value),
    };
  }

  // 현재 구간 정보 사용
  return {
    book: detail.book,
    book_kor: detail.book_kor,
    start_chapter: detail.start_chapter,
    end_chapter: detail.end_chapter,
  };
});

// 모달에서 확인 버튼 클릭 시 실제 API 호출 수정
const confirmCompleteReading = async () => {
  try {
    isUpdatingStatus.value = true;

    const plan_id = readingDetailResponse.value?.data?.plan_id;
    const currentDetail = currentPlanDetail.value;

    if (!plan_id || !currentDetail?.schedule_id) {
      return;
    }

    // 현재 액션의 반대 값을 미리 계산 (UI 즉시 업데이트용)
    const isCompleting = currentAction.value === "complete";
    
    // 현재 detail 객체의 복사본 생성
    const updatedDetails = JSON.parse(JSON.stringify(readingDetailResponse.value.data.plan_detail || []));
    
    // 업데이트할 detail 찾기
    const detailToUpdate = updatedDetails.find(d => 
      d.schedule_id === currentDetail.schedule_id &&
      d.book === currentDetail.book
    );
    
    // 로컬 상태 미리 업데이트 (즉시 UI 반영)
    if (detailToUpdate) {
      detailToUpdate.is_complete = isCompleting;
    }
    
    // 로컬 데이터로 readingDetailResponse 업데이트
    if (readingDetailResponse.value && readingDetailResponse.value.data) {
      readingDetailResponse.value = {
        ...readingDetailResponse.value,
        data: {
          ...readingDetailResponse.value.data,
          plan_detail: updatedDetails
        }
      };
    }

    // API 호출
    const response = await api.post("/api/v1/todos/reading/update/", {
      plan_id,
      schedule_ids: [currentDetail.schedule_id],
      action: currentAction.value,
    });

    // 다음 버튼에서 왔고 완료 액션이었으면 다음 장으로 이동
    if (
      modalSource.value === "next-button" &&
      currentAction.value === "complete"
    ) {
      // 현재 책의 최대 장 수와 다음 장 번호 계산
      const maxChapter = bookChapters[currentBook.value];
      const nextChapter = Number(currentChapter.value) + 1;

      if (nextChapter <= maxChapter) {
        // 같은 책의 다음 장으로 이동
        router.push({
          path: "/reading",
          query: {
            ...route.query,
            book: currentBook.value,
            chapter: nextChapter.toString(),
          },
        });
        loadBibleContent(currentBook.value, nextChapter);
      } else {
        // 다음 책의 첫 장으로 이동
        const books = Object.keys(bookNames);
        const currentBookIndex = books.indexOf(currentBook.value);
        if (currentBookIndex < books.length - 1) {
          const nextBook = books[currentBookIndex + 1];
          router.push({
            path: "/reading",
            query: {
              ...route.query,
              book: nextBook,
              chapter: "1",
            },
          });
          loadBibleContent(nextBook, 1);
        }
      }
    }
  } catch (error) {
    // 에러 발생 시 서버에서 최신 데이터 다시 로드
    try {
      await loadUIInfo(currentBook.value, currentChapter.value);
    } catch (e) {
    }
  } finally {
    showCompleteConfirmModal.value = false;
    isUpdatingStatus.value = false;
    modalSource.value = ""; // 모달 소스 초기화
  }
};

// 요일 표시를 위한 함수 추가
const getDayOfWeek = (dateString) => {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const date = new Date(dateString);
  return days[date.getDay()]; // getDate()가 아닌 getDay()를 사용
};

// 현재 구간의 모든 장 정보를 가져오는 computed 속성 추가
const currentSectionChapters = computed(() => {
  if (!readingDetailResponse.value?.data?.plan_detail) return [];

  const sections = readingDetailResponse.value.data.plan_detail.map((detail) => ({
    book: detail.book,
    book_kor: detail.book_kor,
    chapters: Array.from(
      { length: detail.end_chapter - detail.start_chapter + 1 },
      (_, i) => detail.start_chapter + i
    ),
    is_complete: detail.is_complete,
  }));

  return sections;
});

// 오늘 날짜인지 확인하는 computed 속성
const isToday = computed(() => {
  if (!currentScheduleDate.value) return false;

  const today = new Date();
  const targetDate = new Date(currentScheduleDate.value);

  return (
    today.getFullYear() === targetDate.getFullYear() &&
    today.getMonth() === targetDate.getMonth() &&
    today.getDate() === targetDate.getDate()
  );
});

// 미래 날짜인지 확인하는 computed 속성
const isFutureDate = computed(() => {
  if (!currentScheduleDate.value) return false;

  const today = new Date();
  const targetDate = new Date(currentScheduleDate.value);
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  return targetDate > today;
});

// 날짜 관련 computed 속성 추가
const currentScheduleDate = computed(() => {
  if (readingDetailResponse.value?.data?.plan_detail?.[0]?.date) {
    return readingDetailResponse.value.data.plan_detail[0].date;
  }
  return null;
});

// 읽기 상태를 반환하는 computed 속성 추가
const readingStatus = computed(() => {
  if (!readingDetailResponse.value?.data?.plan_detail) return "not_available";

  const currentDetail = currentPlanDetail.value;
  if (!currentDetail) return "not_available";

  return currentDetail.is_complete ? "completed" : "in_progress";
});

// BibleScheduleContent가 마운트된 후 현재 위치로 스크롤
const scheduleContentRef = ref(null);

// URL 파라미터 변경 감지 및 현재 위치로 스크롤
watch(
  [() => route.params.book, () => route.params.chapter],
  async ([newBook, newChapter]) => {
    if (newBook && newChapter) {
      // 컴포넌트가 준비될 때까지 대기
      await nextTick();
      // 현재 위치로 스크롤
      if (scheduleContentRef.value?.scrollToCurrentLocation) {
        scheduleContentRef.value.scrollToCurrentLocation();
      }
    }
  },
  { immediate: true }
);

// 장 표시 상태를 업데이트하는 함수
const updateChapterDisplay = async () => {
  await nextTick();
  // URL 파라미터와 현재 상태가 일치하는지 확인
  if (route.query.book && route.query.chapter) {
    currentBook.value = route.query.book;
    currentChapter.value = Number(route.query.chapter);
  }
};

// route.query 변경 감지
watch(
  () => route.query,
  async () => {
    await updateChapterDisplay();
  },
  { deep: true }
);

// 모달 취소 처리 함수 수정
const handleModalCancel = () => {
  if (modalSource.value === "next-button") {
    // 다음 장으로 이동
    const maxChapter = bookChapters[currentBook.value];
    const nextChapter = Number(currentChapter.value) + 1;

    if (nextChapter <= maxChapter) {
      router.push({
        path: "/reading",
        query: {
          ...route.query,
          book: currentBook.value,
          chapter: nextChapter.toString(),
        },
      });
      loadBibleContent(currentBook.value, nextChapter);
    } else {
      // 다음 책의 첫 장으로
      const books = Object.keys(bookNames);
      const currentBookIndex = books.indexOf(currentBook.value);
      if (currentBookIndex < books.length - 1) {
        const nextBook = books[currentBookIndex + 1];
        router.push({
          path: "/reading",
          query: {
            ...route.query,
            book: nextBook,
            chapter: "1",
          },
        });
        loadBibleContent(nextBook, 1);
      }
    }
  }

  // 모달 닫기
  showCompleteConfirmModal.value = false;
  modalSource.value = "";
};

// 버튼 표시 여부를 결정하는 computed 속성 수정
const showReadingButtons = computed(() => {
  // 1. API 응답이 없거나 로딩 중이면 버튼 숨김
  if (!readingDetailResponse.value || isLoading.value) return false;

  // 2. 메시지가 있으면 일정이 없는 것이므로 버튼 숨김
  if (readingDetailResponse.value.data?.message) return false;

  // 3. plan_detail이 비어있으면 버튼 숨김
  if (
    !readingDetailResponse.value.data?.plan_detail ||
    readingDetailResponse.value.data.plan_detail.length === 0
  )
    return false;

  // 4. 현재 장에 해당하는 plan_detail이 있는지 확인
  return currentPlanDetail.value !== null;
});

// 역본 변경 함수 추가
const changeVersion = (version) => {
  if (currentVersion.value === version) {
    showVersionModal.value = false;
    return;
  }

  currentVersion.value = version;
  showVersionModal.value = false;

  // URL 쿼리 파라미터에 version 추가
  router.push({
    path: "/reading",
    query: {
      ...route.query,
      version: version,
    },
  });
  // 현재 페이지 다시 로드
  loadBibleContent(currentBook.value, currentChapter.value);
};

// 역본 선택 모달 열기
const openVersionModal = () => {
  showVersionModal.value = true;
};

// 스크롤 이벤트 핸들러 추가 - top 버튼 표시 여부만 결정
const handleScroll = () => {
  // 100px 이상 스크롤 되었을 때 top 버튼 표시
  showTopButton.value = window.scrollY > 100;
};

// 컴포넌트 언마운트시 이벤트 리스너 제거
onUnmounted(() => {
  if (process.client) {
    window.removeEventListener("scroll", handleScroll);
    document.removeEventListener("click", hideCopyMenuOnOutsideClick);
    
    // 혹시 존재할 수 있는 타이머 제거
    clearSelection();
  }
});

// 페이지 상단으로 스크롤하는 함수
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

// 구절 선택 상태
const selectedVerses = ref([]); // [{ number, text }]
const showCopyMenu = ref(false);
const menuPosition = reactive({ x: 0 });
const selectedStart = ref(null);
const selectedEnd = ref(null);

// verse 강조 해제
function clearVerseHighlight() {
  document
    .querySelectorAll(".verse.selected-verse")
    .forEach((el) => el.classList.remove("selected-verse"));
}
// 선택 초기화
const clearSelection = () => {
  if (!process.client) return;
  
  showCopyMenu.value = false;
  clearVerseHighlight();
  selectedVerses.value = [];
  selectedStart.value = null;
  selectedEnd.value = null;
};

// 복사 옵션별 텍스트 생성
function getCopyText(type) {
  if (!selectedVerses.value.length) return "";
  const bookName = bookNames[currentBook.value] || currentBook.value;
  const chapter = currentChapter.value;
  if (selectedVerses.value.length === 1) {
    const { number, text } = selectedVerses.value[0];
    if (type === "includeLocation") {
      return `[${bookName}${chapter}:${number}] ${text}`;
    } else if (type === "numOnly") {
      return `${number} ${text}`;
    } else if (type === "textOnly") {
      return text;
    }
  } else {
    const start = selectedVerses.value[0].number;
    const end = selectedVerses.value[selectedVerses.value.length - 1].number;
    const versesTexts = selectedVerses.value.map(
      (v) => `${v.number} ${v.text}`
    );
    if (type === "includeLocationRange") {
      return `[${bookName}${chapter}:${start}-${end}]\n${versesTexts.join(
        "\n"
      )}`;
    } else if (type === "excludeLocationRange") {
      return versesTexts.join("\n");
    }
  }
  return "";
}
// 복사 기능
const handleCopy = (type = "includeLocation") => {
  let text = "";
  if (selectedVerses.value.length === 1) {
    if (type === "includeLocation") text = getCopyText("includeLocation");
    else if (type === "numOnly") text = getCopyText("numOnly");
    else if (type === "textOnly") text = getCopyText("textOnly");
    else text = getCopyText("includeLocation");
  } else if (selectedVerses.value.length > 1) {
    if (type === "includeLocationRange")
      text = getCopyText("includeLocationRange");
    else if (type === "excludeLocationRange")
      text = getCopyText("excludeLocationRange");
    else text = getCopyText("includeLocationRange");
  }
  if (!text) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      toast.value?.show("복사 완료", "success");
      clearSelection();
    });
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast.value?.show("복사 완료", "success");
    clearSelection();
  }
};

// verse 강조 함수
function highlightVerses(start, end) {
  document.querySelectorAll(".verse").forEach((el) => {
    const n = parseInt(
      el.querySelector(".verse-number").textContent.trim(),
      10
    );
    if (n >= start && n <= end) {
      el.classList.add("selected-verse");
    } else {
      el.classList.remove("selected-verse");
    }
  });
}
// 본문 클릭 핸들러 (구간 선택)
const onBibleClick = (event) => {
  const verseEl = event.target.closest(".verse");
  if (!verseEl) return;
  event.stopPropagation();
  const numEl = verseEl.querySelector(".verse-number");
  const textEl = verseEl.querySelector(".verse-text");
  if (!numEl || !textEl) return;
  const num = parseInt(numEl.textContent.trim(), 10);
  const txt = textEl.textContent.trim();

  // 단일 절 선택 상태에서 같은 절을 다시 클릭하면 해제
  if (
    selectedStart.value !== null &&
    selectedEnd.value === null &&
    selectedStart.value === num &&
    selectedVerses.value.length === 1
  ) {
    showCopyMenu.value = false;
    setTimeout(() => {
      clearSelection();
    }, 250); // transition-duration과 맞춤
    return;
  }

  if (selectedStart.value === null) {
    // 시작점 설정
    clearSelection();
    selectedStart.value = num;
    selectedVerses.value = [{ number: num, text: txt }];
    highlightVerses(num, num);
    showCopyMenu.value = true;
  } else if (selectedEnd.value === null) {
    // 끝점 설정 및 범위 선택
    selectedEnd.value = num;
    const start = Math.min(selectedStart.value, selectedEnd.value);
    const end = Math.max(selectedStart.value, selectedEnd.value);
    highlightVerses(start, end);
    // 선택 구간의 number/text만 저장
    const versesArray = [];
    document.querySelectorAll(".verse").forEach((el) => {
      const n = parseInt(
        el.querySelector(".verse-number").textContent.trim(),
        10
      );
      if (n >= start && n <= end) {
        versesArray.push({
          number: n,
          text: el.querySelector(".verse-text").textContent.trim(),
        });
      }
    });
    selectedVerses.value = versesArray;
    menuPosition.x = event.clientX;
    showCopyMenu.value = true;
  } else {
    // 재선택 UX 개선: 메뉴를 완전히 닫은 뒤 새로 열기
    clearSelection();
    showCopyMenu.value = false;
    setTimeout(() => {
      selectedStart.value = num;
      selectedVerses.value = [{ number: num, text: txt }];
      highlightVerses(num, num);
      showCopyMenu.value = true;
    }, 250); // transition-duration과 맞춤
  }
};

// copy menu
const copyMenu = ref(null);

// copy menu position
const copyMenuPosition = reactive({ x: 0, y: 0 });

// copy menu hide
const hideCopyMenu = () => {
  showCopyMenu.value = false;
};

// copy menu show
const showCopyMenuHandler = (event) => {
  if (event.type === "touchend") {
    event.preventDefault();
  }
  const rect = event.target.getBoundingClientRect();
  copyMenuPosition.x = rect.left + rect.width / 2;
  copyMenuPosition.y = rect.top + rect.height / 2;
  showCopyMenu.value = true;
};

// copy menu hide on click outside
const hideCopyMenuOnOutsideClick = (event) => {
  if (!copyMenu.value || !event.target) return;
  
  try {
    if (copyMenu.value && !copyMenu.value.contains(event.target)) {
      hideCopyMenu();
    }
  } catch (err) {
    hideCopyMenu();
  }
};

// 브라우저 환경에서만 이벤트 리스너 등록
onMounted(() => {
  document.addEventListener("click", hideCopyMenuOnOutsideClick);
});
onUnmounted(() => {
  document.removeEventListener("click", hideCopyMenuOnOutsideClick);
});
</script>

<template>
  <div class="container">
    <div class="header fade-in">
      <button class="back-button" @click="handleBackNavigation">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>
      <h1>성경일독</h1>
      <button class="share-button" @click="copyCurrentUrl" title="링크 공유">
        <i class="fa-solid fa-share-nodes"></i>
      </button>
    </div>

    <div class="today-reading fade-in" style="animation-delay: 0.1s" v-if="readingDetailResponse?.data">
      <div class="today-info">
        <div class="reading-meta">
          <button class="reading-meta-btn schedule-button" @click="openScheduleModal">
            <i class="fa-solid fa-list-check"></i>
            <span>성경통독표</span>
          </button>

          <!-- 플랜이 선택된 경우에만 완료/취소 버튼 표시 -->
          <template v-if="route.query.plan && showReadingButtons">
            <div class="reading-meta-btn-container">
              <button v-if="readingStatus === 'completed'" key="cancel-button"
                class="reading-meta-btn complete-button complete-cancel-button" @click="handleCancelReading"
                :disabled="isLoading || isUpdatingStatus">
                <span v-if="isUpdatingStatus" class="loading-spinner small"></span>
                <i class="fa-solid fa-xmark"></i>
                <span>읽지 않음으로 기록</span>
              </button>
              <button v-else key="complete-button"
                class="reading-meta-btn complete-button" @click="handleCompleteReading"
                :disabled="isLoading || isUpdatingStatus">
                <span v-if="isUpdatingStatus" class="loading-spinner small"></span>
                <i class="fa-solid fa-check"></i>
                <span>읽음으로 기록</span>
              </button>
            </div>
          </template>
          <!-- 플랜이 선택되지 않은 경우 경고 메시지 표시 -->
          <template v-else-if="!route.query.plan">
            <div class="plan-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.83-2.83L13.83 4.44a2 2 0 00-3.66 0L3.24 16.17A2 2 0 005.07 19z"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>플랜 선택되지 않음</span>
            </div>
          </template>
          <!-- 일정이 없는 경우 메시지 표시 -->
          <template v-else-if="readingDetailResponse?.data?.message">
            <div class="plan-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.83-2.83L13.83 4.44a2 2 0 00-3.66 0L3.24 16.17A2 2 0 005.07 19z"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ readingDetailResponse.data.message }}</span>
            </div>
          </template>
        </div>
      </div>
      <div class="today-links">
        <a v-if="readingDetailResponse?.data?.audio_link" @click.prevent="
          handleAudioLink(readingDetailResponse.data.audio_link)
          " href="#" class="link-button audio" title="오디오">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2a3 3 0 0 1 3 3v14a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zm7 4a2 2 0 0 1 2 2v8a2 2 0 0 1-4 0V8a2 2 0 0 1 2-2zM5 6a2 2 0 0 1 2 2v8a2 2 0 0 1-4 0V8a2 2 0 0 1 2-2zM5 6a2 2 0 0 1 2 2v8a2 2 0 0 1-4 0V8a2 2 0 0 1 2-2zM5 6a2 2 0 0 1 2 2v8a2 2 0 0 1-4 0V8a2 2 0 0 1 2-2z"
              fill="currentColor" />
          </svg>
          <span class="link-text">오디오</span>
        </a>
        <a v-if="readingDetailResponse?.data?.guide_link" :href="readingDetailResponse.data.guide_link" target="_blank"
          class="link-button guide" title="가이드">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="link-text">해설</span>
        </a>
      </div>
      <transition name="copy-menu-fade">
        <div v-show="showCopyMenu" class="copy-menu">
          <span class="copy-menu-label">
            {{ selectedVerses.length === 1 ? "복사" : "구간 복사" }}&nbsp;
          </span>
          <div class="copy-menu-buttons">
            <template v-if="selectedVerses.length === 1">
              <button class="copy-button" @click="handleCopy('includeLocation')">
                위치 포함
              </button>
              <span data-v-b2ff4ce1="" class="action-divider">|</span>
              <button class="copy-button" @click="handleCopy('numOnly')">
                절 번호 포함
              </button>
              <span data-v-b2ff4ce1="" class="action-divider">|</span>
              <button class="copy-button" @click="handleCopy('textOnly')">
                내용만
              </button>
            </template>
            <template v-else>
              <button class="copy-button" @click="handleCopy('includeLocationRange')">
                위치 포함
              </button>
              <span data-v-b2ff4ce1="" class="action-divider">|</span>
              <button class="copy-button" @click="handleCopy('excludeLocationRange')">
                절 번호 포함
              </button>
            </template>
            <button class="copy-button cancel" @click="clearSelection">
              <svg data-v-b2ff4ce1="" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path data-v-b2ff4ce1="" d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round"></path>
              </svg>취소
            </button>
          </div>
        </div>
      </transition>
    </div>

    <div class="content-section-wrapper">
      <div class="content-section fade-in" style="animation-delay: 0.2s">
        <div class="chapter-controls">
          <div class="chapter-select-button-wrapper left">
            <!-- 역본 선택 버튼 추가 -->
            <button class="version-button" @click="openVersionModal">
              <div class="button-content">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                <h2>{{ versionNames[currentVersion] }}</h2>
              </div>
            </button>
            <button class="chapter-select-button" @click="openModalWithSearch">
              <div class="button-content">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <h2>{{ chapterTitle }}</h2>
              </div>
            </button>
            <!-- 읽기 설정 버튼 -->
            <button class="view-options-button" @click="showReadingSettingsModal = true" title="읽기 설정">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="chapter-select-button-wrapper right">
            <div class="font-size-controls">
              <button class="font-button" @click="adjustFontSize(-1)" :disabled="fontSize <= 14">
                <span class="font-icon small">가</span>
              </button>
              <button class="font-button" @click="adjustFontSize(1)" :disabled="fontSize >= 24">
                <span class="font-icon">가</span>
              </button>
              <button class="font-button reset" @click="resetFontSize" :disabled="fontSize === DEFAULT_FONT_SIZE"
                title="기본 크기로 초기화">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M2 10C2 10 4.00498 7.26822 5.63384 5.63824C7.26269 4.00827 9.5136 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.89691 21 4.43511 18.2543 3.35177 14.5M2 10V4M2 10H8"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="loading">
          <div class="loading-spinner"></div>
          <p>본문을 불러오는 중입니다...</p>
        </div>

        <div v-else class="bible-content text-adjustable"
          :class="{ 'verse-joining': viewOptions.verseJoining }"
          :style="readingSettingsStore.cssVariables"
          v-html="bibleContent"
          @click="onBibleClick"></div>
      </div>
    </div>

    <div class="navigation-controls fade-in" style="animation-delay: 0.3s">
      <button class="nav-button prev" @click="goToPrevChapter($event)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
        <span>이전</span>
      </button>

      <div class="center-content">
        <div class="current-page">
          <!-- 날짜 표시 영역 -->
          <div class="schedule-date" :class="{
            completed: readingStatus === 'completed',
            'not-completed': readingStatus === 'not-completed',
            current: isToday,
            upcoming: !authStore.isAuthenticated && isFutureDate,
          }">
            <div class="status-icon" v-if="readingStatus === 'completed'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
              </svg>
            </div>
            <div class="status-icon" v-else-if="readingStatus === 'not-completed'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
              </svg>
            </div>
            <div class="status-icon today" v-else-if="isToday">오늘</div>
            {{
              currentScheduleDate ? formatScheduleDate(currentScheduleDate) : ""
            }}
          </div>

          <!-- 구간 표시 영역 -->
          <div class="reading-sections" v-if="currentSectionChapters.length > 0">
            <template v-for="(section, index) in currentSectionChapters" :key="`section-group-${index}`">
              <!-- 구간 구분선 -->
              <span v-if="index > 0" class="section-separator">|</span>

              <!-- 구간 번호 (여러 구간일 때만 표시) -->
              <span class="section-number" v-if="currentSectionChapters.length > 1"
                :class="{ 'current-section': section.book === currentBook }">
                {{ index + 1 }}
              </span>

              <!-- 책 이름 -->
              <span class="book-name" :class="{
                'current-book': section.book === currentBook,
                'other-book': section.book !== currentBook,
              }">
                {{ section.book_kor }}
              </span>

              <!-- 장 번호들 -->
              <span class="chapter-numbers">
                <!-- 3개 이하일 때는 모든 장 표시 -->
                <template v-if="section.chapters.length <= 3">
                  <span v-for="chapter in section.chapters" :key="chapter" class="chapter-box" :class="{
                    current: section.book === currentBook && Number(chapter) === Number(currentChapter),
                    completed: isChapterCompleted(section.book, chapter),
                  }">
                    {{ chapter }}
                  </span>
                </template>

                <!-- 4개 이상일 때는 생략 부호 사용 -->
                <template v-else>
                  <!-- 시작 장 -->
                  <span class="chapter-box" :class="{
                    current:
                      section.book === currentBook && Number(section.chapters[0]) === Number(currentChapter),
                    completed: isChapterCompleted(
                      section.book,
                      section.chapters[0]
                    ),
                  }">
                    {{ section.chapters[0] }}
                  </span>

                  <!-- 중간 생략 부호와 현재 장 (모바일에서만 표시) -->
                  <template v-if="
                    section.book === currentBook &&
                    Number(currentChapter) !== Number(section.chapters[0]) &&
                    Number(currentChapter) !==
                    Number(section.chapters[section.chapters.length - 1])
                  ">
                    <!-- 현재 장이 중간에 있을 때는 점 2개 -->
                    <span class="chapter-ellipsis mobile-only">··</span>
                    <span class="chapter-box mobile-only" :class="{
                      current: true,
                      completed: isChapterCompleted(
                        section.book,
                        currentChapter
                      ),
                    }">
                      {{ currentChapter }}
                    </span>
                    <span class="chapter-ellipsis mobile-only">··</span>
                  </template>
                  <template v-else>
                    <!-- 현재 장이 시작이나 끝일 때는 점 3개 -->
                    <span class="chapter-ellipsis mobile-only">···</span>
                  </template>

                  <!-- 마지막 장 -->
                  <span class="chapter-box" :class="{
                    current:
                      section.book === currentBook &&
                      Number(
                        section.chapters[section.chapters.length - 1]
                      ) === Number(currentChapter),
                    completed: isChapterCompleted(
                      section.book,
                      section.chapters[section.chapters.length - 1]
                    ),
                  }">
                    {{ section.chapters[section.chapters.length - 1] }}
                  </span>
                </template>
              </span>
            </template>
          </div>
          <!-- 구간 정보가 없을 때 기본 표시 -->
          <div class="reading-sections" v-else>
            <span class="book-name">{{ bookNames[currentBook] }}</span>
            <div class="chapter-numbers">
              <span class="chapter-box current">{{ currentChapter }}</span>
            </div>
          </div>
        </div>
      </div>

      <button class="nav-button next" @click="goToNextChapter($event)">
        <span>다음</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click="showModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>성경 선택</h3>
            <button class="close-button" @click="showModal = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <!-- 검색 섹션 -->
          <div class="search-section">
            <div class="search-input-wrapper">
              <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
                <path d="M21 21L16.5 16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                class="search-input"
                placeholder="예: 창1:3, ㅊㅅㄱ, 요한 3:16"
                @keydown="handleSearchKeydown"
              />
              <button
                v-if="searchQuery"
                class="search-clear-button"
                @click="searchQuery = ''"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
                  <path d="M15 9L9 15M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <!-- AI 검색 결과 미리보기 -->
            <div v-if="searchResults.length > 0" class="search-result-preview">
              <div class="ai-result-label">
                <svg class="ai-sparkle" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" fill="currentColor"/>
                  <path d="M18 14L18.55 16.45L21 17L18.55 17.55L18 20L17.45 17.55L15 17L17.45 16.45L18 14Z" fill="currentColor" opacity="0.7"/>
                  <path d="M6 16L6.37 17.63L8 18L6.37 18.37L6 20L5.63 18.37L4 18L5.63 17.63L6 16Z" fill="currentColor" opacity="0.5"/>
                </svg>
                <span>{{ searchResults.length > 1 ? `${searchResults.length}개를 찾았어요` : 'AI가 찾았어요' }}</span>
              </div>
              <!-- 여러 후보가 있을 때 -->
              <div v-if="searchResults.length > 1" class="search-results-list">
                <button
                  v-for="(result, index) in searchResults"
                  :key="result.bookId"
                  :class="['search-result-item', { selected: index === selectedResultIndex }]"
                  @click="selectSearchResult(index)"
                >
                  <span class="result-book">{{ result.bookName }}</span>
                  <span v-if="result.chapter" class="result-chapter">{{ result.chapter }}장</span>
                  <span v-if="result.verse" class="result-verse">{{ result.verse }}절</span>
                </button>
              </div>
              <!-- 선택된 결과로 이동 버튼 -->
              <button class="search-result-button" @click="goToSearchResult">
                <span class="result-book">{{ searchResult.bookName }}</span>
                <span v-if="searchResult.chapter" class="result-chapter">{{ searchResult.chapter }}장</span>
                <span v-if="searchResult.verse" class="result-verse">{{ searchResult.verse }}절</span>
                <span v-else-if="!searchResult.chapter" class="result-hint">장을 선택해주세요</span>
                <span class="result-action">바로가기</span>
                <svg class="result-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="modal-body">
            <div class="books-section" ref="booksSection">
              <div class="testament">
                <h4>구약</h4>
                <div class="books-list">
                  <button v-for="book in bibleBooks.old" :key="book.id" :data-id="book.id" :class="[
                    'book-button',
                    { active: selectedBook === book.id },
                  ]" @click="selectBook(book.id)">
                    {{ book.name }}
                  </button>
                </div>
              </div>
              <div class="testament">
                <h4>신약</h4>
                <div class="books-list">
                  <button v-for="book in bibleBooks.new" :key="book.id" :data-id="book.id" :class="[
                    'book-button',
                    { active: selectedBook === book.id },
                  ]" @click="selectBook(book.id)">
                    {{ book.name }}
                  </button>
                </div>
              </div>
            </div>
            <div class="chapters-section" ref="chaptersSection">
              <h4>장</h4>
              <div class="chapters-grid">
                <button v-for="chapter in chaptersArray" :key="chapter" :data-chapter="chapter" :class="[
                  'chapter-button',
                  { active: chapter === currentChapter },
                  { searched: searchResult && searchResult.chapter === chapter },
                ]" @click="selectChapter(chapter)">
                  {{ chapter }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Toast ref="toast" />

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showScheduleModal" class="modal-overlay" @click="closeScheduleModal">
          <Transition name="modal-slide">
            <div class="modal-content schedule-modal" @click.stop>
              <div class="modal-header">
                <h3>성경통독표</h3>
                <div class="header-controls">
                  <button class="close-button" @click="closeScheduleModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <BibleScheduleContent v-if="showScheduleModal" :is-modal="true" :current-book="currentBook"
                :current-chapter="currentChapter" @schedule-select="handleScheduleClick" />
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <div v-if="showLoginModal" class="modal-overlay" @click="showLoginModal = false">
        <div class="modal-content login-modal" @click.stop>
          <div class="modal-body">
            <button class="close-button absolute-close" @click="showLoginModal = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
            <div class="modal-content-wrapper">
              <div class="modal-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15V12M12 9h.01M5.07 19H19a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h.07z"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </div>
              <div class="modal-text">
                <h3>로그인이 필요한 기능입니다</h3>
                <p>
                  회원만 사용이 가능한 기능입니다.<br />로그인/회원가입
                  하시겠어요?
                </p>
              </div>
              <div class="modal-actions">
                <button class="login-button" @click="goToLogin">
                  로그인하기
                </button>
                <button class="cancel-button" @click="showLoginModal = false">
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showCompleteConfirmModal" class="modal-overlay" @click="showCompleteConfirmModal = false">
        <div class="modal-content confirm-modal" @click.stop>
          <div class="modal-body">
            <button class="close-button absolute-close" @click="showCompleteConfirmModal = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
            <div class="modal-content-wrapper">
              <div class="modal-icon">
                <svg v-if="currentAction === 'complete'" width="48" height="48" viewBox="0 0 24 24" fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" />
                </svg>
                <svg v-else width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" />
                </svg>
              </div>
              <div class="modal-text">
                <h3>
                  {{ currentAction === "complete" ? "읽기 완료" : "완료 취소" }}
                </h3>
                <p v-if="sectionInfo">
                  {{ sectionInfo.book_kor }} {{ sectionInfo.start_chapter
                  }}{{
                    sectionInfo.start_chapter !== sectionInfo.end_chapter
                      ? `-${sectionInfo.end_chapter}`
                      : ""
                  }}장까지<br />
                  구간을
                  {{
                    currentAction === "complete"
                      ? "읽음으로 표시하겠어요?"
                      : "읽지 않음으로 변경하겠어요?"
                  }}
                </p>
              </div>
              <div class="modal-actions">
                <button class="confirm-button" @click="confirmCompleteReading">
                  네
                </button>
                <button class="cancel-button" @click="handleModalCancel">
                  아니요
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- BibleScheduleContent 컴포넌트를 숨김 처리 -->
    <div class="hidden-schedule-content">
      <BibleScheduleContent v-if="readingDetailResponse?.data" ref="scheduleContentRef"
        :current-book="route.params.book" :current-chapter="Number(route.params.chapter)" :use-default-plan="true"
        :key="route.query.plan" />
    </div>

    <!-- 역본 선택 모달 추가 -->
    <Teleport to="body">
      <div v-if="showVersionModal" class="modal-overlay" @click="showVersionModal = false">
        <div class="modal-content version-modal" @click.stop>
          <div class="modal-header">
            <h3>역본 선택</h3>
            <button class="close-button" @click="showVersionModal = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="versions-list">
              <button v-for="(name, code) in versionNames" :key="code" class="version-select-button"
                :class="{ active: currentVersion === code }" @click="changeVersion(code)">
                <div class="button-content">
                  <span>{{ name
                  }}<span class="new-badge" v-if="name === '새한글'">N</span></span>
                  <svg v-if="currentVersion === code" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 읽기 설정 모달 -->
    <ReadingSettingsModal
      :is-open="showReadingSettingsModal"
      :current-version="currentVersion"
      @close="showReadingSettingsModal = false"
    />

    <!-- Top 버튼 (트랜지션 추가) -->
    <Transition name="fade">
      <button v-show="showTopButton" @click="scrollToTop" class="top-button" aria-label="페이지 상단으로 이동">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>
    </Transition>
  </div>
</template>

<style scoped>
@font-face {
  font-family: "RIDIBatang";
  src: url("https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff") format("woff");
  font-weight: normal;
  font-style: normal;
}

.container {
  max-width: 768px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
  position: relative;
  /* top-button의 위치 기준 설정 */
}

.header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  height: 50px;
  transition: all 0.15s ease;
  margin: 0;
}

.back-button {
  background: none;
  border: none;
  padding: 0.375rem;
  margin: -0.375rem;
  margin-right: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
}

.share-button {
  background: none;
  border: none;
  padding: 0.375rem;
  margin: -0.375rem;
  margin-left: auto;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0.25rem;
  opacity: 0.7;
}

.share-button:hover {
  background: rgba(0, 0, 0, 0.05);
  opacity: 1;
}

.share-button:active {
  transform: scale(0.95);
  background: rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.back-button svg {
  width: 20px;
  height: 20px;
}

.share-button i {
  font-size: 18px;
}

.today-reading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  z-index: 5;
  top: 50px;
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  padding: 0.7rem 0.85rem;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
  min-height: 52px;
  -webkit-tap-highlight-color: transparent;
}

.today-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0;
  flex-wrap: nowrap;
  min-width: 0;
}

.reading-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0;
  flex-wrap: nowrap;
  min-width: 0;
}

.date-badge {
  background: var(--primary-light);
  color: var(--primary-color);
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
}

.reading-badge {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
}

.today-links {
  display: flex;
  margin-left: 0.75rem;
  flex-shrink: 0;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
}

.content-section-wrapper {
  position: relative;
}

.content-section {
  background: white;
  margin: 0.5rem;
  padding: 0.85rem;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 4rem;
}

@supports (-webkit-touch-callout: none) {
  @media (display-mode: standalone) {
    .content-section {
      margin-bottom: 5.5rem;
    }
  }
}

.reading-info {
  margin-bottom: 1.5rem;
  cursor: pointer;
}

.reading-info h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  color: #64748b;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.bible-content {
  font-size: var(--reading-font-size, 1rem);
  line-height: var(--reading-line-height, 1.8);
  letter-spacing: -0.04em;
  color: var(--text-primary);
  font-family: var(--reading-font-family, "RIDIBatang", serif);
  font-weight: var(--reading-font-weight, normal);
  text-align: var(--reading-text-align, left);
  touch-action: pan-x pan-y;
}

.reading-info h2,
.reading-info .subtitle {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

:deep(.verse) {
  font-family: var(--reading-font-family, "RIDIBatang", serif);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: flex-start;
  font-weight: var(--reading-font-weight, normal);
  letter-spacing: -0.02em;
  transition: background-color 0.3s ease-in-out;
}

/* 시적 구조를 위한 구절 그룹 */
:deep(.verse-group) {
  margin: 0.25rem 0;
}

:deep(.verse-line) {
  font-family: var(--reading-font-family, "RIDIBatang", serif);
  display: flex;
  align-items: flex-start;
  line-height: var(--reading-line-height, 1.8);
  font-weight: var(--reading-font-weight, normal);
  letter-spacing: -0.02em;
  transition: background-color 0.3s ease-in-out;
}

/* 후속 줄: 구절 번호 자리만큼 왼쪽 여백 */
:deep(.verse-line.continuation) {
  padding-left: 1.3em;
}

/* 시적 구조 들여쓰기 (q1, q2 등) */
:deep(.verse-line.q1) {
  padding-left: 1.5em;
}

:deep(.verse-line.continuation.q1) {
  padding-left: calc(1.3em + 1.5em);
}

:deep(.verse-line.q2) {
  padding-left: 2.5em;
}

:deep(.verse-line.continuation.q2) {
  padding-left: calc(1.3em + 2.5em);
}

:deep(.verse-line.m) {
  padding-left: 0.5em;
}

:deep(.verse-line.continuation.m) {
  padding-left: calc(1.3em + 0.5em);
}

:deep(.verse-number) {
  color: var(--primary-color);
  font-weight: 500;
  margin-right: 0.3rem;
  min-width: 0.8em;
  flex-shrink: 0;
  text-align: right;
  font-size: 0.75em;
  font-family: "Pretendard", sans-serif;
  position: relative;
}

:deep(.verse-text) {
  flex: 1;
}

:deep(table),
:deep(td),
:deep(.num) {
  all: unset;
}

:deep(.verse.selected-verse) {
  background-color: #e2e1e1 !important;
  transition: background-color 0.2s ease;
  border-radius: 8px;
}

:deep(.verse:hover) {
  background-color: #f3f3f3;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 8px;
}

/* 터치 디바이스(모바일/태블릿)에서는 hover 배경색 비활성화 */
@media (hover: none) and (pointer: coarse) {
  :deep(.verse:hover):not(.selected-verse) {
    background-color: inherit !important;
  }
}

@supports (-webkit-touch-callout: none) {
  @media (hover: none) {
    :deep(.verse:hover):not(.selected-verse) {
      background-color: inherit !important;
    }
  }
}

.copy-menu {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: calc(100% + 8px);
  background: white;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  z-index: 5;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  min-width: 200px;
  width: max-content;
  max-width: 95vw;
  gap: 0.75rem;
  transition: box-shadow 0.2s;
}

.copy-menu-fade-enter-active,
.copy-menu-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.copy-menu-fade-enter-from,
.copy-menu-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-16px) scale(0.98);
}

.copy-menu-fade-enter-to,
.copy-menu-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}

.copy-menu-label {
  font-size: 0.95rem;
  color: var(--primary-color);
  font-weight: 600;
  white-space: nowrap;
}

.copy-menu-divider {
  color: #bdbdbd;
  margin-left: 0.25rem;
  margin-right: 0.5rem;
  font-weight: normal;
}

.copy-menu-buttons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.25rem 0.5rem;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-button.cancel {
  color: #991b1b;
}

.navigation-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem;
  background: white;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.15);
  max-width: 768px;
  min-height: 50px;
  margin: 0 auto;
  z-index: 20;
  flex-wrap: nowrap;
  border-radius: 16px 16px 0 0;
}

@supports (-webkit-touch-callout: none) {
  @media not all and (display-mode: standalone) {
    .navigation-controls {
      padding: 0.5rem 0.15rem calc(0.5rem + env(safe-area-inset-bottom)) 0.15rem;
    }
  }

  @media (display-mode: standalone) {
    .navigation-controls {
      padding: 0.5rem 0.35rem calc(env(safe-area-inset-bottom) - 0.35rem) 0.35rem;
    }
  }
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border: none;
  border-radius: 8px;
  color: #4b5563;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

@media (hover: none) {
  .nav-button:hover {
    background-color: transparent;
    color: #4b5563;
  }

  .nav-button:hover svg {
    transform: none;
  }
}

.nav-button:hover {
  background-color: #e5e7eb;
  color: #1f2937;
}

.nav-button:active {
  transform: translateY(1px);
}

.nav-button.prev {
  padding-left: 0.75rem;
}

.nav-button.next {
  padding-right: 0.75rem;
}

.nav-button svg {
  transition: transform 0.2s ease;
}

.nav-button.prev:hover svg {
  transform: translateX(-2px);
}

.nav-button.next:hover svg {
  transform: translateX(2px);
}

.center-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  flex: 1;
  min-width: 0;
  padding: 0 0.1rem;
}

.chapter-indicator {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.reading-meta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  overflow: hidden;
}

.schedule-button {
  background: var(--primary-light);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.schedule-button:hover {
  background: var(--primary-hover);
  color: var(--primary-dark);
  opacity: 1;
}

.complete-button {
  border: 1px solid rgba(46, 144, 250, 1);
  background: rgba(46, 144, 250, 0.1);
  color: #2e90fa;
}

.complete-button:hover {
  background: rgba(46, 144, 250, 0.15);
  border-color: #2e90fa;
  color: #1570d1;
}

.complete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.complete-cancel-button {
  border: 1px solid rgba(220, 38, 38, 0.25);
  background: rgba(220, 38, 38, 0.05);
  color: #dc2626;
}

.complete-cancel-button:hover {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.4);
  color: #dc2626;
}

.complete-button:disabled,
.complete-cancel-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-button:hover {
  color: var(--primary-color);
}

@media (max-width: 640px) {
  .reading-meta {
    gap: 0.5rem;
  }

  .schedule-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    height: 28px;
    gap: 0.25rem;
    min-width: 80px;
  }

  .complete-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    height: 28px;
    gap: 0.25rem;
    min-width: 64px;
  }

  @supports (-webkit-touch-callout: none) {
    .reading-meta {
      gap: 0.35rem;
    }

    .schedule-button,
    .complete-button {
      padding: 0.25rem 0.35rem;
      font-size: 0.7rem;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  opacity: 0;
  animation: fadeIn 0.4s ease-out forwards;
}

:deep(.section-title) {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #4170cd;
  margin: 2rem 0 0.25rem;
  text-align: center;
}

:deep(.section-title:first-child) {
  margin-top: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  animation: fadeIn 0.2s ease-out;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.modal-content {
  width: 90%;
  height: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow: hidden;
  background: white;
  border-radius: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-button {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: var(--primary-light);
  color: var(--text-primary);
}

@media (max-width: 640px) {
  .modal-header {
    padding: 0.8rem 1rem;
  }

  .modal-header h3 {
    font-size: 1rem;
  }
}

/* 검색 섹션 스타일 */
.search-section {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  background: white;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(75, 159, 126, 0.15);
}

.search-input::placeholder {
  color: #94a3b8;
  font-size: 14px;
}

.search-clear-button {
  position: absolute;
  right: 8px;
  padding: 4px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.search-clear-button:hover {
  color: #64748b;
}

.search-result-preview {
  margin-top: 10px;
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-result-label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 6px;
  padding-left: 2px;
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.ai-sparkle {
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.search-result-button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(75, 159, 126, 0.25);
  position: relative;
  overflow: hidden;
}

.search-result-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent
  );
  transition: left 0.5s ease;
}

.search-result-button:hover::before {
  left: 100%;
}

.search-result-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(75, 159, 126, 0.4);
}

.search-result-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(75, 159, 126, 0.3);
}

.result-book {
  font-weight: 600;
  font-size: 16px;
}

.result-chapter {
  opacity: 0.95;
  font-size: 15px;
}

.result-hint {
  opacity: 0.75;
  font-size: 13px;
}

.result-action {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.8;
  font-weight: 400;
}

.result-arrow {
  opacity: 0.9;
  transition: transform 0.2s ease;
}

.search-result-button:hover .result-arrow {
  transform: translateX(3px);
}

/* 여러 후보 목록 스타일 */
.search-results-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-result-item:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.search-result-item.selected {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(75, 159, 126, 0.3);
}

.search-result-item .result-book {
  font-weight: 600;
  font-size: 13px;
}

.search-result-item .result-chapter {
  font-size: 12px;
  opacity: 0.85;
}

.search-result-item .result-verse,
.search-result-button .result-verse {
  font-size: 12px;
  font-weight: 600;
  color: white;
  background: var(--primary-color);
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 6px;
}

.search-result-item.selected .result-verse {
  background: white;
  color: var(--primary-color);
}

/* 절 라인 하이라이트 효과 - v-html 컨텐츠에도 적용되도록 :deep 사용 */
:deep(.verse-line-highlight) {
  background: linear-gradient(90deg, rgba(75, 159, 126, 0.35) 0%, rgba(75, 159, 126, 0.2) 100%) !important;
  border-left: 4px solid var(--primary-color) !important;
  margin-left: -16px !important;
  padding-left: 12px !important;
  border-radius: 0 6px 6px 0;
  animation: verseLineHighlight 2.5s ease-out forwards;
  transition: background 0.3s ease, border-left-color 0.3s ease;
}

@keyframes verseLineHighlight {
  0% {
    background: linear-gradient(90deg, rgba(75, 159, 126, 0.5) 0%, rgba(75, 159, 126, 0.3) 100%);
    border-left-color: var(--primary-color);
  }
  60% {
    background: linear-gradient(90deg, rgba(75, 159, 126, 0.35) 0%, rgba(75, 159, 126, 0.2) 100%);
    border-left-color: var(--primary-color);
  }
  100% {
    background: transparent;
    border-left-color: transparent;
  }
}

@media (max-width: 640px) {
  .search-section {
    padding: 0.6rem 0.8rem;
  }

  .search-input {
    padding: 9px 36px 9px 36px;
    font-size: 14px;
  }

  .search-icon {
    left: 10px;
    width: 16px;
    height: 16px;
  }

  .search-result-button {
    padding: 9px 12px;
    font-size: 14px;
  }
}

.modal-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 400px;
}

.modal-content-wrapper {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
}

.books-section {
  flex: 1;
  border-right: 1px solid #eee;
  padding: 0 1rem 0.85rem 1rem;
  overflow-y: auto;
  height: 100%;
  -webkit-overflow-scrolling: touch;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 45%;
}

.chapters-section {
  flex: 1.3;
  padding: 0 1rem 0.85rem 1rem;
  overflow-y: auto;
  height: 100%;
  -webkit-overflow-scrolling: touch;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 55%;
}

.testament {
  display: flex;
  flex-direction: column;
}

.testament h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  position: sticky;
  top: 0;
  background: white;
  padding: 0.5rem 0;
  z-index: 1;
}

.books-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.chapters-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  position: sticky;
  top: 0;
  background: white;
  padding: 0.5rem 0;
  z-index: 1;
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
  gap: 0.5rem;
  min-width: 0;
  align-content: start;
  width: 100%;
}

.book-button,
.chapter-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: none;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  min-width: 44px;
  height: 44px;
  font-weight: 500;
}

.book-button.active,
.chapter-button.active {
  background: var(--primary-light);
  color: var(--primary-color);
  border-color: var(--primary-color);
  font-weight: 600;
}

/* 검색된 장 하이라이트 */
.chapter-button.searched {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(75, 159, 126, 0.4);
  transform: scale(1.05);
}

.chapter-button:hover,
.book-button:hover {
  background: var(--primary-light);
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.schedule-modal {
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow: hidden;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

@media (max-width: 480px) {
  .modal-content {
    width: 100%;
    max-width: 95vw;
    max-height: 85vh;
    border-radius: 16px;
    margin: 0;
  }

  .books-section {
    flex: 0.7;
    padding-right: 0.75rem;
  }

  .chapters-section {
    flex: 1.3;
  }

  .chapters-grid {
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 0.4rem;
  }

  .chapter-button {
    padding: 0;
    font-size: 0.9rem;
    height: 40px;
    min-width: 40px;
  }

  .book-button {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .schedule-modal {
    max-width: 95vw;
  }
}

@supports (-webkit-touch-callout: none) {
  .modal-content {
    height: 85vh;
  }

  .modal-body {
    height: calc(100% - 60px);
  }

  .books-section,
  .chapters-section {
    -webkit-overflow-scrolling: touch;
    overflow-y: auto;
  }

  .schedule-modal {
    height: 85vh;
  }
}

.modal-content * {
  -webkit-tap-highlight-color: transparent;
}

.login-modal {
  max-width: 320px;
  max-height: 320px;
  width: 90%;
  text-align: center;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  margin: 1rem;
  padding: 1rem;
  animation: slideUp 0.3s ease-out;
}

.modal-icon {
  width: 48px;
  height: 48px;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-text {
  margin-bottom: 1rem;
  width: 100%;
}

.modal-text h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  word-break: keep-all;
}

.modal-text p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 0.9375rem;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.login-button,
.modal-actions .cancel-button {
  width: 100%;
  padding: 0.45rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.login-button {
  background: var(--primary-color);
  color: white;
  border: none;
}

.login-button:hover {
  background: var(--primary-dark);
}

.modal-actions .cancel-button {
  background: #f1f3f5;
  color: var(--text-secondary);
  border: none;
}

.modal-actions .cancel-button:hover {
  background: #e9ecef;
  color: var(--text-primary);
}

.absolute-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  padding: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 1;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.absolute-close:hover {
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.05);
}

.chapter-select-button {
  width: 75%;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 36px;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.chapter-select-button:hover {
  background: #f1f3f5;
  border-color: #dee2e6;
}

.chapter-select-button:active {
  transform: translateY(1px);
}

.button-content {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.button-content h2 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.button-content svg {
  color: var(--text-secondary);
}

.text-adjustable {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

.header,
.nav-button,
.modal-header,
.modal-content button {
  -webkit-text-size-adjust: none;
  text-size-adjust: none;
  font-size: 14px !important;
}

:deep(.bible-content) {
  line-height: 1.8;
  word-break: keep-all;
  overflow-wrap: break-word;
  font-size: 16px;
  min-height: 0vw;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:deep(.bible-content p) {
  margin: 1em 0;
}

:deep(.bible-content .chapter-num) {
  font-weight: bold;
  color: #4170cd;
  font-size: 1rem !important;
}

:deep(.bible-content .verse-num) {
  font-size: 0.85em;
  color: #666;
  vertical-align: top;
  margin-right: 0.2em;
}

@media (max-width: 640px) {
  :deep(.bible-content) {
    font-size: 18px;
  }
}

.current-page {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
}

@media (max-width: 640px) {
  .current-page {
    font-size: 0.875rem;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chapter-indicator {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.link-text {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.link-button {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
  flex-shrink: 0;
  text-decoration: none;
  white-space: nowrap;
}

.link-button[href*="audio"] {
  background: var(--red-light);
  color: var(--red-primary);
}

.link-button[href*="audio"]:hover {
  background: var(--red-hover);
}

.link-button[href*="guide"] {
  background: var(--blue-light);
  color: var(--blue-primary);
}

.link-button[href*="guide"]:hover {
  background: var(--blue-hover);
}

@media (max-width: 640px) {
  .link-button {
    padding: 0.375rem;
  }

  .link-text {
    font-size: 0.6875rem;
  }
}

.chapter-controls {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
}

.chapter-select-button-wrapper.left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  /* 오버플로우 방지를 위해 필요 */
}

.chapter-select-button-wrapper.right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 0 0 auto;
  /* 크기 고정 */
  max-width: 120px;
}

.chapter-select-button {
  flex: 1;
  min-width: 0;
  /* 오버플로우 방지 */
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 36px;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.font-size-controls {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.version-button {
  flex: 0 0 auto;
  min-width: 85px;
  /* "공동번역 개정판" 텍스트 고려 */
  max-width: 130px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 36px;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.version-button .button-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.version-button .button-content svg,
.chapter-select-button .button-content svg {
  flex-shrink: 0;
}

.chapter-select-button .button-content svg {
  margin: 0 -0.05rem 0 -0.2rem;
}

.version-button .button-content h2 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.875rem;
}

.chapter-select-button .button-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.chapter-select-button .button-content h2 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .chapter-controls {
    gap: 0.35rem;
  }

  .chapter-select-button-wrapper.left {
    gap: 0.35rem;
  }

  .version-button {
    min-width: 100px;
    max-width: 110px;
    padding: 0.35rem 0.5rem;
  }

  .version-button .button-content h2,
  .chapter-select-button .button-content h2 {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .version-button {
    min-width: 85px;
    max-width: 95px;
    padding: 0.35rem 0.4rem;
  }

  .font-size-controls {
    gap: 0.25rem;
  }
}

@media (max-width: 400px) {
  .chapter-controls {
    gap: 0.25rem;
  }

  .chapter-select-button-wrapper.left {
    gap: 0.25rem;
  }

  .version-button {
    min-width: 80px;
    max-width: 85px;
  }

  .version-button .button-content h2 {
    font-size: 0.75rem;
  }

  .font-button {
    width: 32px;
    height: 32px;
  }
}

.font-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

@supports (-webkit-touch-callout: none) {
  .font-button {
    padding: 0;
    margin: 0;
  }
}

.font-button:hover:not(:disabled) {
  background: #f1f3f5;
  border-color: #dee2e6;
}

.font-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.font-icon {
  color: var(--text-primary);
  font-weight: 600;
}

.font-icon.small {
  font-size: 0.7rem;
}

@media (max-width: 640px) {
  .font-button {
    width: 32px;
    height: 32px;
  }
}

.font-button.reset {
  color: var(--text-secondary);
}

.font-button.reset:hover:not(:disabled) {
  color: var(--text-primary);
}

@supports (-webkit-touch-callout: none) {
  .font-button {
    padding: 0;
    margin: 0;
  }
}

.chapter-range {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  justify-content: center;
  flex-wrap: wrap;
}

.chapter-dot {
  color: #cbd5e1;
  margin: 0 0.1rem;
  font-size: 0.75em;
}

@media (max-width: 640px) {
  .chapter-range {
    font-size: 0.8125rem;
    gap: 0.1rem;
  }

  .chapter-dot {
    margin: 0 0.05rem;
    font-size: 0.7em;
  }
}

.schedule-date {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  text-align: center;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  margin-bottom: 0.25rem;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.schedule-date.completed {
  color: var(--primary-color);
}

.schedule-date.not-completed {
  color: #e54444;
}

.schedule-date.current {
  color: #4170cd;
}

.schedule-date.upcoming {
  color: #94a3b8;
}

@media (max-width: 640px) {
  .schedule-date {
    font-size: 0.8rem;
    gap: 0.25rem;
  }

  .status-icon {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 640px) {
  .schedule-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    height: 28px;
    gap: 0.25rem;
  }
}

.confirm-modal {
  max-width: 320px;
  max-height: 320px;
  width: 90%;
  text-align: center;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  margin: 1rem;
  padding: 1rem;
  animation: slideUp 0.3s ease-out;
}

.confirm-button {
  width: 100%;
  padding: 0.45rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary-color);
  color: white;
  border: none;
}

.confirm-button:hover {
  background: var(--primary-dark);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chapter-ellipsis {
  color: #cbd5e1;
  letter-spacing: 1px;
  margin: 0 -0.1rem;
  font-size: 0.75em;
}

.chapter-separator {
  color: #cbd5e1;
  margin: 0 0.25rem;
}

.chapter-number {
  font-weight: 400;
}

.chapter-number.current {
  font-weight: 700;
  color: var(--primary-color);
}

.chapter-number.completed {
  color: var(--primary-color);
}

@media (max-width: 640px) {
  .chapter-separator {
    margin: 0 0.15rem;
  }
}

.status-icon.today {
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.05rem 0.25rem;
  border-radius: 4px;
  width: auto;
  height: auto;
  border: 1px solid currentColor;
}

:deep(.error-message) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1rem;
  color: #64748b;
  gap: 1rem;
}

:deep(.error-message svg) {
  color: #dc2626;
}

:deep(.error-message h3) {
  font-size: 1.125rem;
  font-weight: 600;
  color: #334155;
  margin: 0;
  line-height: 1.5;
}

:deep(.error-message p) {
  font-size: 0.9375rem;
  margin: 0;
  line-height: 1.5;
}

:deep(.external-link) {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.85rem;
  font-size: 0.85rem;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  margin-top: 1rem;
  transition: all 0.2s ease;
}

:deep(.external-link:hover) {
  background: #dbeafe;
}

:root {
  --font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, sans-serif;
}

.page-container {
  font-family: var(--font-family);
}

:deep(.bible-content) {
  font-family: var(--reading-font-family, "RIDIBatang", serif);
  line-height: var(--reading-line-height, 1.8);
  word-break: keep-all;
  overflow-wrap: break-word;
  font-size: var(--reading-font-size, 16px);
  font-weight: var(--reading-font-weight, normal);
  text-align: var(--reading-text-align, left);
  min-height: 0vw;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html.touch-device .nav-button:hover svg {
  transform: none !important;
}

html.touch-device .nav-button.prev:hover svg,
html.touch-device .nav-button.next:hover svg {
  transform: none !important;
}

@media (hover: hover) {
  html.no-touch-device .nav-button:hover {
    background-color: #e5e7eb;
    color: #1f2937;
  }

  html.no-touch-device .nav-button.prev:hover svg {
    transform: translateX(-2px);
  }

  html.no-touch-device .nav-button.next:hover svg {
    transform: translateX(2px);
  }
}

.nav-button:active {
  transform: translateY(1px);
  background-color: #e5e7eb;
  color: #1f2937;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

.loading-spinner.small {
  width: 14px;
  height: 14px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
}

.complete-button:disabled span:not(.loading-spinner),
.complete-button:disabled svg,
.complete-cancel-button:disabled span:not(.loading-spinner),
.complete-cancel-button:disabled svg {
  opacity: 0;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.reading-sections {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  font-size: 0.875rem;
}

.section-separator {
  color: #cbd5e1;
  margin: 0 0.75rem;
}

.section-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin-right: 0.25rem;
  transition: all 0.2s ease;
}

.section-number.current-section {
  background: #f0fdf4;
  border-color: #c3e0cd;
  color: var(--primary-color);
}

.book-name {
  color: #64748b;
  font-weight: 500;
  margin-right: 0.5rem;
}

.book-name.current-book {
  color: var(--primary-color);
  font-weight: 600;
}

.book-name.other-book {
  color: #64748b;
  font-weight: 500;
}

.chapter-numbers {
  display: inline-flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.chapter-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0.75rem;
  padding: 0 0.35rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.chapter-box.current {
  background: var(--primary-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
  font-weight: 600;
}

.chapter-box.not-completed {
  background: #fef2f2;
  border-color: var(--error);
  color: var(--error);
}

@media (max-width: 640px) {
  .reading-sections {
    font-size: 0.85rem;
  }

  .chapter-box {
    min-width: 1rem;
    height: 1.25rem;
    font-size: 0.75rem;
  }

  .section-number {
    width: 1.25rem;
    height: 1.25rem;
    font-size: 0.75rem;
  }
}

.plan-warning {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #e39611;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.plan-warning svg {
  color: #e39611;
}

@media (max-width: 640px) {
  .plan-warning {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    gap: 0.25rem;
  }
}

.hidden-schedule-content {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

:deep(.section-title .reference) {
  font-size: 0.75em;
  font-weight: 500;
  color: #6b7280;
  letter-spacing: -0.1em;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active {
  animation: modalSlideUp 0.3s ease-out forwards;
}

.modal-slide-leave-active {
  animation: modalSlideDown 0.3s ease-in forwards;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalSlideDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }

  to {
    opacity: 0;
    transform: translateY(30px);
  }
}

.schedule-modal {
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow: hidden;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.version-modal {
  max-width: 300px;
  max-height: 420px;
  display: flex;
  flex-direction: column;
}

.versions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  overflow-y: auto;
  max-height: 350px;
  /* 모달 내에서 스크롤 가능한 영역 크기 지정 */
}

.version-select-button {
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  min-width: 44px;
  height: 44px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  overflow: hidden;
}

.version-select-button.active {
  background: var(--primary-light);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  font-weight: 600;
}

.version-select-button:hover {
  background: var(--primary-light);
}

.version-select-button .button-content {
  display: flex;
  align-items: center;
}

/* 보기 옵션 버튼 */
.view-options-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
  flex-shrink: 0;
}

.view-options-button:hover {
  background: #e9ecef;
  color: #374151;
}

.view-options-button:active {
  transform: scale(0.95);
}

/* 보기 옵션 모달 */
.view-options-modal {
  width: 90%;
  max-width: 360px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-item {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-item:hover {
  background: #f9fafb;
}

.option-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: var(--primary-color);
}

.option-label {
  flex: 1;
  font-weight: 500;
  font-size: 0.9375rem;
  color: #1f2937;
}

.option-description {
  width: 100%;
  font-size: 0.8125rem;
  color: #6b7280;
  padding-left: calc(18px + 0.75rem);
  margin-top: -0.25rem;
}

.options-note {
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
  padding: 1rem 0;
}

@media (max-width: 640px) {
  .view-options-button {
    width: 32px;
    height: 32px;
  }

  .view-options-button svg {
    width: 16px;
    height: 16px;
  }
}

.chapter-select-button {
  flex: 1;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 36px;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.version-button {
  flex: 0 0 auto;
  max-width: 140px;
  /* 역본 버튼 너비 살짝 늘림 */
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 36px;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.version-button .button-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.version-button .button-content h2 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@media (max-width: 640px) {
  .chapter-select-button {
    height: 32px;
  }

  .version-button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    min-width: 60px;
  }

  .version-button .button-content svg {
    margin: 0 -0.05rem 0 -0.05rem;
  }
}

:deep(.sub-title) {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
}

/* 설명/주석 (시편 머리말, 음악 지시어 등) */
:deep(.description) {
  font-style: italic;
  font-size: 0.9em;
  color: #6b7280;
  margin: 0.5rem 0 1rem;
  padding-left: 0.75rem;
  border-left: 2px solid #e5e7eb;
  line-height: 1.6;
}

/* 교차 참조 */
:deep(.cross-ref) {
  font-size: 0.85em;
  color: #4b5563;
  margin: 0.25rem 0 0.75rem;
  padding-left: 0.5rem;
}

/* 인명 강조 (표준 번역본) */
:deep(.bible-name) {
  color: #1e40af;
  font-weight: 500;
}

/* 지명 강조 (표준 번역본) */
:deep(.bible-area) {
  color: #047857;
}


/* 각주 마커 */
:deep(.footnote-marker) {
  color: #3b82f6;
  cursor: help;
  font-size: 0.75em;
  vertical-align: super;
  margin: 0 1px;
  font-weight: 500;
  position: relative;
}

/* 터치 디바이스에서 탭 시 툴팁 표시 */
:deep(.footnote-marker:hover)::after,
:deep(.footnote-marker:focus)::after {
  content: attr(data-footnote);
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: normal;
  max-width: 280px;
  width: max-content;
  z-index: 20;
  white-space: normal;
  line-height: 1.5;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-bottom: 4px;
}

/* 툴팁 화살표 */
:deep(.footnote-marker:hover)::before,
:deep(.footnote-marker:focus)::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #1f2937;
  margin-bottom: -8px;
  z-index: 21;
}

:deep(.paragraph) {
  margin: 0.5rem 0;
  line-height: 1.8;
}

/* 시적 구조 들여쓰기 스타일 - 대한성서공회 스타일 적용 */
:deep(.verse.q1),
:deep(.paragraph.q1) {
  padding-left: 40px !important;
  text-indent: 0 !important;
  white-space: pre-wrap !important; /* 줄바꿈 보존 */
}

:deep(.verse.q2),
:deep(.paragraph.q2) {
  padding-left: 60px !important;
  text-indent: 0 !important;
  white-space: pre-wrap !important;
}

:deep(.verse.q3),
:deep(.paragraph.q3) {
  padding-left: 80px !important;
  text-indent: 0 !important;
  white-space: pre-wrap !important;
}

:deep(.verse.q4),
:deep(.paragraph.q4) {
  padding-left: 100px !important;
  text-indent: 0 !important;
  white-space: pre-wrap !important;
}

/* 계속되는 행 (margin continuation) */
:deep(.verse.m),
:deep(.paragraph.m) {
  padding-left: 1.5rem !important;
  margin-top: 0;
}

/* 들여쓰기가 있는 단락 */
:deep(.verse.pi1),
:deep(.paragraph.pi1) {
  padding-left: 2rem !important;
}

:deep(.verse.pi2),
:deep(.paragraph.pi2) {
  padding-left: 4rem !important;
}

/* 가운데 정렬 (시편 제목 등) */
:deep(.verse.pc),
:deep(.paragraph.pc) {
  text-align: center;
}

/* 오른쪽 정렬 */
:deep(.verse.pm),
:deep(.paragraph.pm),
:deep(.verse.pmo),
:deep(.paragraph.pmo),
:deep(.verse.pmc),
:deep(.paragraph.pmc) {
  text-align: right;
  margin-right: 1rem;
}

/* nb - no break (줄바꿈 없음) */
:deep(.verse.nb),
:deep(.paragraph.nb) {
  display: inline;
  margin: 0;
}

.new-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #e53e3e;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  margin-left: 0.375rem;
  line-height: 1;
}

.version-button .button-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}

.today-reading-header {
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 10;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: none;
  /* 애니메이션 효과 제거 */
}

/* Top 버튼 스타일 */
.top-button {
  position: fixed;
  bottom: 4.75rem;
  /* 위치 조정 */
  right: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 30;
  color: #64748b;
  transition: all 0.2s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  opacity: 1;
}

.top-button:hover {
  background: #f8fafc;
  color: #475569;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

/* 모바일 기기에서 크기 조정 */
@media (max-width: 640px) {
  .top-button {
    width: 40px;
    height: 40px;
    right: 1rem;
    bottom: 5.5rem;
  }
}

/* 페이드 트랜지션 효과 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  /* 사라질 때 투명도 */
}

.reading-meta-btn-container {
  display: flex;
  align-items: center;
  min-width: 0;
  position: relative;
}

.reading-meta-btn-container button {
  transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
  position: relative;
  animation: btnFadeIn 0.3s ease-in-out;
}

@keyframes btnFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
