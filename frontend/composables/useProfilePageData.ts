import { ref, reactive, computed, type Ref } from 'vue'
import { useProfileStore } from '~/stores/profile'
import { useSocialStore } from '~/stores/social'
import { useGroupsStore } from '~/stores/groups'
import { useToast } from '~/composables/useToast'

export function useProfilePageData(userId: Ref<number>) {
  const profileStore = useProfileStore()
  const socialStore = useSocialStore()
  const groupsStore = useGroupsStore()
  const toast = useToast()

  // 세분화된 로딩 상태
  const loadingStates = reactive({
    profile: false,
    calendar: false,
    achievements: false,
    groups: false,
    followers: false,
    following: false
  })

  // 로드된 탭 추적 (지연 로딩용)
  const loadedTabs = ref<Set<string>>(new Set())

  // 팔로워/팔로잉 로드 여부
  const followersLoaded = ref(false)
  const followingLoaded = ref(false)

  // 에러 목록
  const errors = ref<string[]>([])

  // 핵심 데이터 로딩 완료 여부
  const isCoreDataLoaded = computed(() =>
    !loadingStates.profile && profileStore.currentProfile !== null
  )

  // 전체 로딩 상태
  const isAnyLoading = computed(() =>
    Object.values(loadingStates).some(v => v)
  )

  // 초기 데이터 로드 (프로필 + 달력만)
  async function loadInitialData() {
    errors.value = []
    loadedTabs.value.clear()
    followersLoaded.value = false
    followingLoaded.value = false

    // 프로필 로드 (필수)
    loadingStates.profile = true
    try {
      await profileStore.fetchProfile(userId.value)
      if (profileStore.error) {
        errors.value.push(profileStore.error)
        loadingStates.profile = false
        return
      }
    } catch (e: any) {
      errors.value.push(e.message || '프로필을 불러올 수 없습니다')
      loadingStates.profile = false
      return
    }
    loadingStates.profile = false

    // 달력 로드 (기본 탭)
    loadingStates.calendar = true
    const now = new Date()
    try {
      await profileStore.fetchCalendarData(userId.value, now.getFullYear(), now.getMonth() + 1)
    } catch (e) {
      toast.warning('달력 데이터를 불러오지 못했습니다')
    } finally {
      loadingStates.calendar = false
    }

    loadedTabs.value.add('calendar')
  }

  // 탭 데이터 지연 로드
  async function loadTabData(tabId: string) {
    if (loadedTabs.value.has(tabId)) return

    switch (tabId) {
      case 'achievements':
        loadingStates.achievements = true
        try {
          await profileStore.fetchAchievements(userId.value)
        } catch (e) {
          toast.warning('업적을 불러오지 못했습니다')
        } finally {
          loadingStates.achievements = false
        }
        break
      case 'groups':
        loadingStates.groups = true
        try {
          await groupsStore.fetchGroups({ only_mine: profileStore.isOwnProfile })
        } catch (e) {
          toast.warning('그룹을 불러오지 못했습니다')
        } finally {
          loadingStates.groups = false
        }
        break
    }

    loadedTabs.value.add(tabId)
  }

  // 팔로워 로드 (모달용)
  async function loadFollowers() {
    if (followersLoaded.value || loadingStates.followers) return
    loadingStates.followers = true
    try {
      await socialStore.fetchFollowers(userId.value)
      followersLoaded.value = true
    } catch (e) {
      toast.error('팔로워를 불러오지 못했습니다')
    } finally {
      loadingStates.followers = false
    }
  }

  // 팔로잉 로드 (모달용)
  async function loadFollowing() {
    if (followingLoaded.value || loadingStates.following) return
    loadingStates.following = true
    try {
      await socialStore.fetchFollowing(userId.value)
      followingLoaded.value = true
    } catch (e) {
      toast.error('팔로잉을 불러오지 못했습니다')
    } finally {
      loadingStates.following = false
    }
  }

  // 달력 월 변경
  async function handleMonthChange(year: number, month: number) {
    loadingStates.calendar = true
    try {
      await profileStore.fetchCalendarData(userId.value, year, month)
    } catch (e) {
      toast.error('달력 데이터를 불러오지 못했습니다')
    } finally {
      loadingStates.calendar = false
    }
  }

  // 팔로우 토글 (Optimistic Update)
  async function toggleFollow() {
    const profile = profileStore.currentProfile
    if (!profile) return { success: false }

    const wasFollowing = profile.is_following
    const prevCount = profile.followers_count

    // Optimistic update
    profile.is_following = !wasFollowing
    profile.followers_count = wasFollowing ? prevCount - 1 : prevCount + 1

    try {
      const result = wasFollowing
        ? await socialStore.unfollowUser(userId.value)
        : await socialStore.followUser(userId.value)

      if (!result.success) {
        // 롤백
        profile.is_following = wasFollowing
        profile.followers_count = prevCount
        toast.error(wasFollowing ? '언팔로우에 실패했습니다' : '팔로우에 실패했습니다')
        return { success: false }
      }

      toast.success(wasFollowing ? '언팔로우했습니다' : '팔로우했습니다')
      return { success: true }
    } catch (e) {
      // 롤백
      profile.is_following = wasFollowing
      profile.followers_count = prevCount
      toast.error('작업에 실패했습니다')
      return { success: false }
    }
  }

  // 팔로워 모달에서 팔로우 토글
  async function handleToggleFollowInModal(follower: any) {
    const wasFollowing = follower.is_following
    follower.is_following = !wasFollowing // Optimistic

    try {
      const result = wasFollowing
        ? await socialStore.unfollowUser(follower.id)
        : await socialStore.followUser(follower.id)

      if (!result.success) {
        follower.is_following = wasFollowing // 롤백
        toast.error('작업에 실패했습니다')
      }
    } catch (e) {
      follower.is_following = wasFollowing // 롤백
      toast.error('작업에 실패했습니다')
    }
  }

  // 팔로잉 모달에서 언팔로우
  async function handleUnfollowInModal(user: any) {
    try {
      const result = await socialStore.unfollowUser(user.id)
      if (result.success) {
        // 팔로잉 목록 다시 로드
        followingLoaded.value = false
        await loadFollowing()
        // 프로필 카운트 업데이트
        const profile = profileStore.currentProfile
        if (profile && profile.following_count > 0) {
          profile.following_count--
        }
        toast.success('언팔로우했습니다')
      } else {
        toast.error('언팔로우에 실패했습니다')
      }
    } catch (e) {
      toast.error('언팔로우에 실패했습니다')
    }
  }

  // 정리
  function cleanup() {
    profileStore.clearProfile()
    socialStore.clearSocialData()
    loadedTabs.value.clear()
    followersLoaded.value = false
    followingLoaded.value = false
    errors.value = []
  }

  return {
    // 상태
    loadingStates,
    errors,
    isCoreDataLoaded,
    isAnyLoading,
    followersLoaded,
    followingLoaded,

    // 데이터
    profile: computed(() => profileStore.currentProfile),
    calendarData: computed(() => profileStore.calendarData),
    achievements: computed(() => profileStore.achievements),
    groups: computed(() => groupsStore.groups),
    followers: computed(() => socialStore.followers),
    following: computed(() => socialStore.following),
    isOwnProfile: computed(() => profileStore.isOwnProfile),
    completionRate: computed(() => profileStore.completionRate),

    // 액션
    loadInitialData,
    loadTabData,
    loadFollowers,
    loadFollowing,
    handleMonthChange,
    toggleFollow,
    handleToggleFollowInModal,
    handleUnfollowInModal,
    cleanup
  }
}
