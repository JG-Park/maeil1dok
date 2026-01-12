import { ref, onMounted, onUnmounted, type Ref } from 'vue';

interface SwipeOptions {
  threshold?: number;
  horizontalRatio?: number;
  preventDefault?: boolean;
}

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useSwipe(
  elementRef: Ref<HTMLElement | null>,
  callbacks: SwipeCallbacks,
  options: SwipeOptions = {}
) {
  const {
    threshold = 50,
    horizontalRatio = 1.5,
    preventDefault = false,
  } = options;

  const isSwiping = ref(false);
  const startX = ref(0);
  const startY = ref(0);
  const endX = ref(0);
  const endY = ref(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    startX.value = touch.clientX;
    startY.value = touch.clientY;
    endX.value = touch.clientX;
    endY.value = touch.clientY;
    isSwiping.value = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping.value || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    endX.value = touch.clientX;
    endY.value = touch.clientY;

    const deltaX = Math.abs(endX.value - startX.value);
    const deltaY = Math.abs(endY.value - startY.value);
    
    if (preventDefault && deltaX > threshold && deltaX > deltaY * horizontalRatio) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.value) return;
    
    const deltaX = endX.value - startX.value;
    const deltaY = endY.value - startY.value;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX >= threshold && absDeltaX > absDeltaY * horizontalRatio) {
      if (deltaX > 0) {
        callbacks.onSwipeRight?.();
      } else {
        callbacks.onSwipeLeft?.();
      }
    }

    isSwiping.value = false;
  };

  const handleTouchCancel = () => {
    isSwiping.value = false;
  };

  onMounted(() => {
    const element = elementRef.value;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });
  });

  onUnmounted(() => {
    const element = elementRef.value;
    if (!element) return;

    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
    element.removeEventListener('touchcancel', handleTouchCancel);
  });

  return {
    isSwiping,
  };
}
