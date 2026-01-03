/**
 * Simple confetti effect composable
 * Uses CSS animations for a lightweight confetti effect
 */
export const useConfetti = () => {
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#a855f7', '#f472b6']

  const fireConfetti = () => {
    if (typeof document === 'undefined') return

    const container = document.createElement('div')
    container.className = 'confetti-container'
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `
    document.body.appendChild(container)

    // Create confetti pieces
    for (let i = 0; i < 60; i++) {
      const confetti = document.createElement('div')
      const color = colors[Math.floor(Math.random() * colors.length)]
      const size = Math.random() * 10 + 5
      const left = Math.random() * 100
      const delay = Math.random() * 0.8
      const duration = Math.random() * 2 + 2

      confetti.style.cssText = `
        position: absolute;
        top: -20px;
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        animation: confetti-fall ${duration}s ease-in ${delay}s forwards;
        transform: rotate(${Math.random() * 360}deg);
      `
      container.appendChild(confetti)
    }

    // Add keyframes if not already present
    if (!document.getElementById('confetti-keyframes')) {
      const style = document.createElement('style')
      style.id = 'confetti-keyframes'
      style.textContent = `
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }

    // Remove container after animation completes
    setTimeout(() => {
      container.remove()
    }, 4000)
  }

  const fireBurst = (x?: number, y?: number) => {
    if (typeof document === 'undefined') return

    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `
    document.body.appendChild(container)

    const centerX = x ?? window.innerWidth / 2
    const centerY = y ?? window.innerHeight / 2

    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div')
      const color = colors[Math.floor(Math.random() * colors.length)]
      const size = Math.random() * 8 + 4
      const angle = (Math.PI * 2 * i) / 30
      const velocity = Math.random() * 200 + 100
      const endX = centerX + Math.cos(angle) * velocity
      const endY = centerY + Math.sin(angle) * velocity

      confetti.style.cssText = `
        position: absolute;
        left: ${centerX}px;
        top: ${centerY}px;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50%;
        animation: confetti-burst 0.8s ease-out forwards;
        --end-x: ${endX - centerX}px;
        --end-y: ${endY - centerY}px;
      `
      container.appendChild(confetti)
    }

    // Add burst keyframes if not present
    if (!document.getElementById('confetti-burst-keyframes')) {
      const style = document.createElement('style')
      style.id = 'confetti-burst-keyframes'
      style.textContent = `
        @keyframes confetti-burst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--end-x), var(--end-y)) scale(0);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }

    setTimeout(() => {
      container.remove()
    }, 1000)
  }

  return {
    fireConfetti,
    fireBurst
  }
}
