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
import Toast from "~/components/Toast.vue";
import BibleScheduleContent from "~/components/BibleScheduleContent.vue";

// 라우터 및 스토어 설정
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const api = useApi();

// 토스트 상태
const toast = ref(null);

// 모달 상태 관리
const showLoginModal = ref(false);
const showModal = ref(false);
const showScheduleModal = ref(false);
const showCompleteConfirmModal = ref(false);
const showVersionModal = ref(false);
const scheduleModalMounted = ref(false);
const modalSource = ref("");

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

// 글자 크기 상태 관리
const fontSize = ref(16);
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
    console.error("Failed to load bible content:", error);
    handleBibleContentError(book, chapter);
  } finally {
    isLoading.value = false;

    // 2단계 로딩이 완료된 후 1단계 정보를 로드
    loadUIInfo(book, chapter);
  }
};

// 새한글성경(KNT) 전용 로드 함수 수정
const loadKntBibleContent = async (book, chapter) => {
  try {
    // 새한글성경은 다른 URL 구조 사용
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 15초로 연장

    const url = `/bible-proxy/KNT/get_chapter.php?version=d7a4326402395391-01&chapter=${book.toUpperCase()}.${chapter}`;

    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // JSON 형식으로 응답 받기
    const jsonData = await response.json();

    // 현재 책과 장 정보 업데이트
    currentBook.value = book;
    currentChapter.value = chapter;

    // 응답 확인 및 파싱
    if (jsonData.found) {
      // JSON 응답의 HTML 콘텐츠를 파싱
      parseKntVersion(jsonData, book, chapter);
    } else {
      // 데이터를 찾지 못한 경우
      handleKntContentNotFound(book, chapter);
    }
  } catch (error) {
    console.error("새한글성경 로드 실패:", error);

    // 에러 발생 시 북 제목 및 장 설정
    if (!chapterTitle.value) {
      const suffix = book === "psa" ? "편" : "장";
      chapterTitle.value = `${bookNames[book] || ""} ${chapter}${suffix}`;
    }

    // 에러 메시지
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
  }
};

// 표준 역본 로드 함수 (개역개정, 새번역 등)
const loadStandardBibleContent = async (book, chapter) => {
  try {
    // 일반적인 역본들은 동일한 URL 구조 사용
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(
      `/bible-proxy/bible/korbibReadpage.php?version=${currentVersion.value}&book=${book}&chap=${chapter}&sec=1&cVersion=&fontSize=15px&fontWeight=normal`,
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const text = await response.text();

    // 현재 책과 장 정보 업데이트
    currentBook.value = book;
    currentChapter.value = chapter;

    // 표준 파싱 함수 호출
    parseStandardContent(text, book, chapter);
  } catch (error) {
    throw error; // 상위 함수에서 처리하도록 전달
  }
};

// 표준 역본 HTML 파싱 함수
const parseStandardContent = (htmlText, book, chapter) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");
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

// 새한글성경(KNT) 파싱 함수 수정 - 다양한 형식 대응
const parseKntVersion = (jsonData, book, chapter) => {
  try {
    // JSON 객체인 경우 (일반적인 케이스)
    if (typeof jsonData !== "string" && jsonData.reference) {
      // 장 제목 설정
      const suffix = book === "psa" ? "편" : "장";
      const reference =
        jsonData.reference || `${bookNames[book] || ""} ${chapter}`;

      // reference에 이미 장/편이 포함되어 있는지 확인
      if (reference.includes("장") || reference.includes("편")) {
        chapterTitle.value = reference;
      } else {
        // 장/편 단위가 없으면 추가
        chapterTitle.value = `${reference}${suffix}`;
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
      const allElements = [...sectionTitles, ...subTitles, ...paragraphs].sort(
        (a, b) => a.index - b.index
      );

      // 첫 번째 섹션 제목 저장 (있는 경우)
      const firstSection = allElements.find((el) => el.type === "section");
      if (firstSection) {
        sectionTitle.value = firstSection.content;
      }

      // 2. 요소들 순서대로 처리하여 HTML 생성
      const processedSubtitles = new Set();
      allElements.forEach((element) => {
        if (element.type === "section") {
          // 섹션 제목 처리
          verses.push(`<h3 class="section-title">${element.content}</h3>`);
        } else if (element.type === "subtitle") {
          // 부제목 중복 확인 후 처리
          if (!processedSubtitles.has(element.content)) {
            verses.push(`<p class="sub-title">${element.content}</p>`);
            processedSubtitles.add(element.content);
          }
        } else if (element.type === "paragraph") {
          // 일반 p 태그 내용은 특수 클래스(q1, nb 등)를 가진 경우에만 표시
          // 구절 단락 처리 - 구절 번호와 내용 추출
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
                // 이전 구절 데이터가 있으면 먼저 처리
                if (currentVerseNum && verseText) {
                  verses.push(
                    `<div class="verse"><span class="verse-number">${currentVerseNum}</span><span class="verse-text">${verseText}</span></div>`
                  );
                }

                // 새 구절 시작
                currentVerseNum = numMatch[1];

                // 구절 텍스트 추출 (구절 번호, 각주 등 제거)
                verseText = verseSpan
                  .replace(/<span[^>]*class="v"[^>]*>\d+<\/span>/, "") // 구절 번호 제거
                  .replace(/<span[^>]*class="verse-span"[^>]*>/, "") // 여는 태그 제거
                  .replace(/<\/span>$/, "") // 닫는 태그 제거
                  .replace(/<span[^>]*data-caller[^>]*>.*?<\/span>/gs, "") // 각주 제거
                  .replace(/<\/?[^>]+(>|$)/g, "")
                  .trim(); // 기타 HTML 태그 제거
              } else {
                // 구절 번호 없는 경우 - 이전 구절의 계속되는 내용일 수 있음
                const additionalText = verseSpan
                  .replace(/<span[^>]*class="verse-span"[^>]*>/, "")
                  .replace(/<\/span>$/, "")
                  .replace(/<span[^>]*data-caller[^>]*>.*?<\/span>/gs, "")
                  .replace(/<\/?[^>]+(>|$)/g, "")
                  .trim();

                if (additionalText && currentVerseNum) {
                  verseText += " " + additionalText;
                }
              }
            });

            // 마지막 구절 처리
            if (currentVerseNum && verseText) {
              verses.push(
                `<div class="verse"><span class="verse-number">${currentVerseNum}</span><span class="verse-text">${verseText}</span></div>`
              );
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

              // HTML 태그 제거
              verseContent = verseContent.replace(/<\/?[^>]+(>|$)/g, "").trim();

              // 각주 제거
              verseContent = verseContent.replace(
                /<span[^>]*data-caller[^>]*>.*?<\/span>/gs,
                ""
              );

              verses.push(
                `<div class="verse"><span class="verse-number">${verseNum}</span><span class="verse-text">${verseContent}</span></div>`
              );
            } else {
              // 구절 번호 패턴이 없는 경우
              // p 태그가 특수 클래스를 가진 경우에만 처리 (단순 p 태그는 무시)
              const plainText = element.content
                .replace(/<\/?[^>]+(>|$)/g, "")
                .trim();
              if (
                plainText &&
                (element.class === "q1" || element.class === "nb")
              ) {
                verses.push(`<div class="paragraph">${plainText}</div>`);
              }
              // 일반 p 태그는 렌더링하지 않음 (중복 방지)
            }
          }
        }
      });

      // 최종 HTML 설정
      if (verses.length > 0) {
        bibleContent.value = verses.join("");
      } else {
        console.error("추출된 내용이 없음");
        handleKntContentNotFound(book, chapter);
      }
    } else {
      // HTML 문자열인 경우 (이전 방식 호환)
      const parser = new DOMParser();
      const doc = parser.parseFromString(jsonData, "text/html");

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
    console.error("새한글성경 파싱 실패:", error, error.stack);
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
  // smallTitle 내부의 a 태그는 href만 제거하고 유지
  const sectionTitles = bibleElement.querySelectorAll(".smallTitle");
  sectionTitles.forEach((section) => {
    const anchors = section.querySelectorAll("a");
    anchors.forEach((anchor) => {
      anchor.removeAttribute("href");
    });
  });

  // 그 외의 a 태그는 완전히 제거
  const otherAnchors = bibleElement.querySelectorAll("a:not(.smallTitle a)");
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
  const firstTitle = bibleElement.querySelector(".smallTitle");
  if (firstTitle) {
    sectionTitle.value = firstTitle.textContent.trim();
  } else {
    sectionTitle.value = ""; // 섹션 제목이 없는 경우
  }

  bibleContent.value = verses.join("");
};

// 개역개정 일반 장 파싱 함수
const parseGaeNormalChapter = (bibleElement, verses) => {
  Array.from(bibleElement.childNodes).forEach((node) => {
    // smallTitle 클래스를 가진 요소를 만나면 섹션 제목 업데이트
    if (node.classList?.contains("smallTitle")) {
      // 원본 제목 텍스트
      let titleText = node.textContent
        .trim()
        .replace(/\(\s*\)/g, "") // 빈 괄호 제거
        .replace(/\s+/g, " ") // 연속된 공백 하나로 통일
        .trim(); // 앞뒤 공백 제거

      // 괄호 내용을 작은 글자로 표시하기 위해 HTML로 변환
      // 괄호 패턴 찾기: (내용) 형태
      titleText = titleText.replace(
        /(\([^)]+\))/g,
        '<span class="reference">$1</span>'
      );

      if (titleText) {
        // 내용이 있는 경우에만 추가
        verses.push(`<h3 class="section-title">${titleText}</h3>`);
      }
    }
    // span 요소이고 number 클래스를 가진 자식이 있으면 구절로 처리
    else if (node.tagName === "SPAN" && node.querySelector(".number")) {
      const numberSpan = node.querySelector(".number");
      const number = numberSpan.textContent.trim().replace(/\s+/g, "");
      let text = node.textContent.replace(numberSpan.textContent, "").trim();

      verses.push(
        `<div class="verse"><span class="verse-number">${number}</span><span class="verse-text">${text}</span></div>`
      );
    }
  });

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
        let text = span.textContent.replace(numberSpan.textContent, "").trim();

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
      let text = node.textContent.replace(numberSpan.textContent, "").trim();

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
    console.error("UI 정보 로드 실패:", error);
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
  [showLoginModal, showModal, showScheduleModal, showVersionModal],
  ([newLoginModal, newShowModal, newScheduleModal, newVersionModal]) => {
    toggleBodyScroll(
      newLoginModal || newShowModal || newScheduleModal || newVersionModal
    );
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
    console.error("API 요청 중 오류 발생:", error);

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

// 글자 크기 조절 함수
const adjustFontSize = (delta) => {
  const newSize = fontSize.value + delta;
  if (newSize >= 14 && newSize <= 24) {
    // 최소 14px, 최대 24px
    fontSize.value = newSize;
  }
};

// 글자 크기 초기화 함수
const resetFontSize = () => {
  fontSize.value = DEFAULT_FONT_SIZE;
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
    console.error("Book not found:", book);
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
      console.warn("필요한 정보가 없습니다. 페이지를 새로고침해 주세요.");
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
    console.error(
      `성경 읽기 ${currentAction.value === "complete" ? "완료" : "취소"
      } 처리 중 오류:`,
      error
    );
    
    // 에러 발생 시 서버에서 최신 데이터 다시 로드
    try {
      await loadUIInfo(currentBook.value, currentChapter.value);
    } catch (e) {
      console.error("상태 복구 실패:", e);
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

  return readingDetailResponse.value.data.plan_detail.map((detail) => ({
    book: detail.book,
    book_kor: detail.book_kor,
    chapters: Array.from(
      { length: detail.end_chapter - detail.start_chapter + 1 },
      (_, i) => detail.start_chapter + i
    ),
    is_complete: detail.is_complete,
  }));
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
    console.error('복사 메뉴 이벤트 처리 오류:', err);
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
            <button class="chapter-select-button" @click="showModal = true">
              <div class="button-content">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <h2>{{ chapterTitle }}</h2>
              </div>
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

        <div v-else class="bible-content text-adjustable" :style="{ fontSize: `${fontSize}px` }" v-html="bibleContent"
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
            <template v-for="(section, index) in currentSectionChapters">
              <!-- 구간 구분선 -->
              <span v-if="index > 0" class="section-separator" :key="`separator-${index}`">|</span>

              <!-- 구간 번호 -->
              <span class="section-number" v-if="currentSectionChapters.length > 1"
                :class="{ 'current-section': section.book === currentBook }" :key="`section-${index}`">
                {{ index + 1 }}
              </span>

              <!-- 책 이름 -->
              <span v-for="(section, index) in currentSectionChapters" :key="`book-${index}`" class="book-name" :class="{
                'current-book': section.book === currentBook,
                'other-book': section.book !== currentBook,
              }">
                {{ section.book_kor }}
              </span>

              <!-- 장 번호들 -->
              <div class="chapter-numbers" v-if="section.book === currentBook" :key="`chapters-${index}`">
                <!-- 3개 이하일 때는 모든 장 표시 -->
                <template v-if="section.chapters.length <= 3">
                  <span v-for="chapter in section.chapters" :key="chapter" class="chapter-box" :class="{
                    current: Number(chapter) === Number(currentChapter),
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
                      Number(section.chapters[0]) === Number(currentChapter),
                    completed: isChapterCompleted(
                      section.book,
                      section.chapters[0]
                    ),
                  }">
                    {{ section.chapters[0] }}
                  </span>

                  <!-- 중간 생략 부호와 현재 장 (모바일에서만 표시) -->
                  <template v-if="
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
              </div>
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

.header h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.back-button svg {
  width: 20px;
  height: 20px;
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
  font-size: 1rem;
  line-height: 1.8;
  letter-spacing: -0.04em;
  color: var(--text-primary);
  font-family: "RIDIBatang", serif;
  font-weight: normal;
  touch-action: pan-x pan-y;
}

.reading-info h2,
.reading-info .subtitle {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

:deep(.verse) {
  font-family: "RIDIBatang", serif;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: flex-start;
  font-weight: normal;
  letter-spacing: -0.02em;
  transition: background-color 0.3s ease-in-out;
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
  font-family: var(--font-family);
  line-height: 1.8;
  word-break: keep-all;
  overflow-wrap: break-word;
  font-size: 16px;
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
  margin-right: 0.5rem;
}

.book-name.other-book {
  margin-right: 0;
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

:deep(.paragraph) {
  margin: 0.5rem 0;
  line-height: 1.8;
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
