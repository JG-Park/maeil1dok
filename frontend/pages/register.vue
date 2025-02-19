<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <img class="mx-auto h-12 w-auto" src="@/assets/images/로고_투명.png" alt="매일통독">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          회원가입
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">이메일</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
          </div>
          
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">이름</label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
          </div>

          <div>
            <label for="gender" class="block text-sm font-medium text-gray-700">성별</label>
            <select
              id="gender"
              v-model="formData.gender"
              required
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            >
              <option value="M">남성</option>
              <option value="F">여성</option>
              <option value="O">기타</option>
            </select>
          </div>

          <div>
            <label for="birth_date" class="block text-sm font-medium text-gray-700">생년월일</label>
            <input
              id="birth_date"
              v-model="formData.birth_date"
              type="date"
              required
              class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="submit-button"
            :disabled="loading"
          >
            {{ loading ? '가입 중...' : '가입하기' }}
          </button>
        </div>

        <div class="text-sm text-center">
          <NuxtLink to="/login" class="login-link">
            이미 계정이 있으신가요? 로그인하기
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = ref(false)

const formData = ref({
  email: '',
  username: '',
  password: '',
  gender: 'M',
  birth_date: ''
})

const handleSubmit = async () => {
  loading.value = true
  try {
    const success = await auth.register(formData.value)
    if (success) {
      alert('회원가입이 완료되었습니다.')
      navigateTo('/login')
    } else {
      alert('회원가입에 실패했습니다.')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.submit-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.submit-button:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
}

.submit-button:active {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--primary-color);
  font-weight: 500;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.login-link:hover {
  background-color: var(--primary-light);
  color: var(--primary-dark);
}
</style> 