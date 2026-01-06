# Task 3-3: 하이라이트 기능

> **Phase**: 3 - 부가 기능
> **상태**: ⬜ 대기
> **의존성**: Task 3-2 완료 필요
> **Backend**: ❌ 구현 필요 (신규)

---

## 목표

- 구절 하이라이트 기능 (형광펜)
- 색상 팔레트 (기본 5색 + 사용자 지정)
- 하이라이트 목록 페이지 (`/bible/highlights`)

---

## 서브태스크

### 3.3.1 Backend 구현
- [ ] `BibleHighlight` 모델 생성
- [ ] `BibleHighlightSerializer` 생성
- [ ] `BibleHighlightViewSet` 생성
- [ ] URL 라우팅 추가
- [ ] 마이그레이션 실행

### 3.3.2 useHighlight composable
- [ ] GET `/api/v1/bible/highlights/` 연동 (목록)
- [ ] GET `/api/v1/bible/highlights/by-chapter/` 연동 (장별)
- [ ] POST `/api/v1/bible/highlights/` 연동 (생성)
- [ ] PUT `/api/v1/bible/highlights/<id>/` 연동 (수정)
- [ ] DELETE `/api/v1/bible/highlights/<id>/` 연동 (삭제)

### 3.3.3 하이라이트 UI
- [ ] 절 선택 시 액션 메뉴에서 하이라이트
- [ ] `HighlightPalette.vue` - 색상 선택
- [ ] `HighlightModal.vue` - 색상 + 메모
- [ ] 하이라이트된 구절 시각적 표시

### 3.3.4 하이라이트 목록 페이지
- [ ] `/bible/highlights` 페이지 구현
- [ ] 하이라이트 목록 (색상별/책별 필터)
- [ ] 하이라이트 클릭 시 해당 위치로 이동

---

## 구현 상세

### Backend: models.py 추가

```python
# backend/todos/models.py

class BibleHighlight(models.Model):
    """구절 하이라이트 (형광펜)"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bible_highlights'
    )
    book = models.CharField(max_length=10)  # 성경책 코드
    chapter = models.IntegerField()
    start_verse = models.IntegerField()
    end_verse = models.IntegerField()
    color = models.CharField(max_length=7, default='#FEF3C7')  # 기본: 노랑
    memo = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '하이라이트'
        verbose_name_plural = '하이라이트'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}: {self.book} {self.chapter}:{self.start_verse}-{self.end_verse}"
```

### Backend: serializers.py 추가

```python
# backend/todos/serializers.py

class BibleHighlightSerializer(serializers.ModelSerializer):
    book_name = serializers.SerializerMethodField()

    class Meta:
        model = BibleHighlight
        fields = [
            'id', 'book', 'book_name', 'chapter',
            'start_verse', 'end_verse', 'color', 'memo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'book_name', 'created_at', 'updated_at']

    def get_book_name(self, obj):
        from .views import BOOK_NAMES
        return BOOK_NAMES.get(obj.book, obj.book)
```

### Backend: views.py 추가

```python
# backend/todos/views.py

class BibleHighlightViewSet(viewsets.ModelViewSet):
    """하이라이트 ViewSet"""
    serializer_class = BibleHighlightSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BibleHighlight.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def by_chapter(self, request):
        """특정 장의 하이라이트 조회"""
        book = request.query_params.get('book')
        chapter = request.query_params.get('chapter')

        if not book or not chapter:
            return Response(
                {'error': 'book과 chapter 파라미터가 필요합니다'},
                status=400
            )

        highlights = self.get_queryset().filter(
            book=book,
            chapter=int(chapter)
        )

        serializer = self.get_serializer(highlights, many=True)
        return Response(serializer.data)
```

### Frontend: useHighlight.ts

```typescript
// composables/useHighlight.ts
import { ref, computed } from 'vue';
import { useApi } from '~/composables/useApi';
import { useAuthStore } from '~/stores/auth';

interface Highlight {
  id: number;
  book: string;
  book_name: string;
  chapter: number;
  start_verse: number;
  end_verse: number;
  color: string;
  memo: string;
  created_at: string;
  updated_at: string;
}

// 기본 색상 팔레트
export const DEFAULT_COLORS = [
  { name: '노랑', value: '#FEF3C7' },
  { name: '초록', value: '#D1FAE5' },
  { name: '파랑', value: '#DBEAFE' },
  { name: '빨강', value: '#FEE2E2' },
  { name: '보라', value: '#E9D5FF' },
];

export const useHighlight = () => {
  const api = useApi();
  const authStore = useAuthStore();

  const highlights = ref<Highlight[]>([]);
  const chapterHighlights = ref<Highlight[]>([]);
  const isLoading = ref(false);

  // 사용자 지정 색상 (localStorage)
  const customColors = ref<string[]>(
    JSON.parse(localStorage.getItem('highlightCustomColors') || '[]')
  );

  const saveCustomColors = () => {
    localStorage.setItem('highlightCustomColors', JSON.stringify(customColors.value));
  };

  const addCustomColor = (color: string) => {
    if (!customColors.value.includes(color)) {
      customColors.value.push(color);
      saveCustomColors();
    }
  };

  // 전체 하이라이트 목록
  const fetchHighlights = async () => {
    if (!authStore.isAuthenticated) return;

    isLoading.value = true;
    try {
      const response = await api.get('/api/v1/bible/highlights/');
      highlights.value = response.data;
    } catch (error) {
      console.error('하이라이트 목록 조회 실패:', error);
    } finally {
      isLoading.value = false;
    }
  };

  // 장별 하이라이트
  const fetchChapterHighlights = async (book: string, chapter: number) => {
    if (!authStore.isAuthenticated) return;

    try {
      const response = await api.get('/api/v1/bible/highlights/by-chapter/', {
        params: { book, chapter }
      });
      chapterHighlights.value = response.data;
    } catch (error) {
      console.error('장별 하이라이트 조회 실패:', error);
    }
  };

  // 특정 절이 하이라이트 되어있는지
  const getVerseHighlight = (verse: number) => {
    return chapterHighlights.value.find(
      h => verse >= h.start_verse && verse <= h.end_verse
    );
  };

  // 하이라이트 생성
  const createHighlight = async (data: {
    book: string;
    chapter: number;
    start_verse: number;
    end_verse: number;
    color: string;
    memo?: string;
  }) => {
    if (!authStore.isAuthenticated) {
      throw new Error('로그인이 필요합니다');
    }

    const response = await api.post('/api/v1/bible/highlights/', data);
    chapterHighlights.value.push(response.data);
    return response.data;
  };

  // 하이라이트 수정
  const updateHighlight = async (id: number, data: Partial<Highlight>) => {
    const response = await api.put(`/api/v1/bible/highlights/${id}/`, data);

    const index = chapterHighlights.value.findIndex(h => h.id === id);
    if (index !== -1) {
      chapterHighlights.value[index] = response.data;
    }

    return response.data;
  };

  // 하이라이트 삭제
  const deleteHighlight = async (id: number) => {
    await api.delete(`/api/v1/bible/highlights/${id}/`);

    highlights.value = highlights.value.filter(h => h.id !== id);
    chapterHighlights.value = chapterHighlights.value.filter(h => h.id !== id);
  };

  return {
    highlights,
    chapterHighlights,
    isLoading,
    customColors,
    DEFAULT_COLORS,
    addCustomColor,
    fetchHighlights,
    fetchChapterHighlights,
    getVerseHighlight,
    createHighlight,
    updateHighlight,
    deleteHighlight
  };
};
```

### HighlightPalette.vue

```vue
<template>
  <div class="highlight-palette">
    <div class="color-grid">
      <!-- 기본 색상 -->
      <button
        v-for="color in DEFAULT_COLORS"
        :key="color.value"
        class="color-btn"
        :class="{ active: modelValue === color.value }"
        :style="{ background: color.value }"
        :title="color.name"
        @click="$emit('update:modelValue', color.value)"
      />

      <!-- 사용자 지정 색상 -->
      <button
        v-for="color in customColors"
        :key="color"
        class="color-btn custom"
        :class="{ active: modelValue === color }"
        :style="{ background: color }"
        @click="$emit('update:modelValue', color)"
      />

      <!-- 색상 추가 버튼 -->
      <button class="color-btn add" @click="showColorPicker = true">
        <i class="fa-solid fa-plus" />
      </button>
    </div>

    <!-- 색상 선택기 -->
    <input
      v-if="showColorPicker"
      type="color"
      ref="colorPickerRef"
      @change="handleCustomColor"
      @blur="showColorPicker = false"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import { DEFAULT_COLORS } from '~/composables/useHighlight';

defineProps<{
  modelValue: string;
  customColors: string[];
}>();

const emit = defineEmits(['update:modelValue', 'add-custom']);

const showColorPicker = ref(false);
const colorPickerRef = ref<HTMLInputElement | null>(null);

watch(showColorPicker, async (val) => {
  if (val) {
    await nextTick();
    colorPickerRef.value?.click();
  }
});

const handleCustomColor = (e: Event) => {
  const color = (e.target as HTMLInputElement).value;
  emit('add-custom', color);
  emit('update:modelValue', color);
  showColorPicker.value = false;
};
</script>

<style scoped>
.highlight-palette {
  padding: 0.5rem;
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.color-btn {
  width: 32px;
  height: 32px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-bg-primary), 0 0 0 4px var(--color-primary);
}

.color-btn.add {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

input[type="color"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
</style>
```

### 성경 본문에 하이라이트 적용

```vue
<!-- BibleContent.vue 내부 -->
<script setup>
import { computed } from 'vue';
import { useHighlight } from '~/composables/useHighlight';

const props = defineProps<{
  content: string;
  book: string;
  chapter: number;
}>();

const { chapterHighlights, fetchChapterHighlights } = useHighlight();

// 장 변경 시 하이라이트 로드
watch([() => props.book, () => props.chapter], () => {
  fetchChapterHighlights(props.book, props.chapter);
}, { immediate: true });

// 하이라이트가 적용된 본문
const highlightedContent = computed(() => {
  let content = props.content;

  // 각 하이라이트에 대해 해당 절에 배경색 적용
  for (const h of chapterHighlights.value) {
    for (let v = h.start_verse; v <= h.end_verse; v++) {
      // 절 번호 뒤의 텍스트에 하이라이트 클래스 추가
      const regex = new RegExp(
        `(<sup class="verse-num" data-verse="${v}">${v}</sup>)([^<]+)`,
        'g'
      );
      content = content.replace(
        regex,
        `$1<span class="highlighted" style="background: ${h.color}; --highlight-id: ${h.id}">$2</span>`
      );
    }
  }

  return content;
});
</script>
```

---

## 테스트 체크리스트

### 빌드 테스트
- [ ] Backend 마이그레이션 성공
- [ ] `npm run build` 성공

### 기능 테스트 (Chrome DevTools MCP)

**하이라이트 추가:**
- [ ] `/bible?book=gen&chapter=1` 접속
- [ ] 절 텍스트 선택
- [ ] 액션 메뉴에서 "하이라이트" 클릭
- [ ] 색상 팔레트 표시
- [ ] 색상 선택 후 하이라이트 적용
- [ ] 구절에 배경색 표시

**사용자 지정 색상:**
- [ ] 팔레트에서 "+" 클릭
- [ ] 색상 선택기로 커스텀 색상 추가
- [ ] 추가된 색상 팔레트에 표시

**하이라이트 목록:**
- [ ] `/bible/highlights` 접속
- [ ] 하이라이트 목록 표시
- [ ] 색상별 필터 동작
- [ ] 하이라이트 클릭 → 해당 위치로 이동
- [ ] 하이라이트 삭제

---

## 완료 기준

1. Backend API 동작
2. 하이라이트 추가/삭제 동작
3. 본문에 하이라이트 시각적 표시
4. 사용자 지정 색상 동작
5. 하이라이트 목록 페이지 동작
6. 빌드 성공

---

## 완료 정보

- **완료일**: -
- **커밋**: -
- **비고**: -
