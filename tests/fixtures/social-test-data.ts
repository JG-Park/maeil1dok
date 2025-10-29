// Test data for social features E2E testing

export const testUsers = [
  {
    id: 1,
    username: 'testuser1',
    nickname: '테스트유저1',
    email: 'test1@example.com',
    profile_image: '/test-avatar1.png',
    bio: '안녕하세요, 테스트 유저1입니다.',
    total_completed_days: 45,
    current_streak: 7,
    longest_streak: 15,
    followers_count: 10,
    following_count: 8,
    is_public: true
  },
  {
    id: 2,
    username: 'testuser2',
    nickname: '테스트유저2',
    email: 'test2@example.com',
    profile_image: '/test-avatar2.png',
    bio: '매일 성경 읽기 도전 중!',
    total_completed_days: 38,
    current_streak: 3,
    longest_streak: 12,
    followers_count: 5,
    following_count: 7,
    is_public: true
  },
  {
    id: 3,
    username: 'testuser3',
    nickname: '테스트유저3',
    email: 'test3@example.com',
    profile_image: null,
    bio: '함께 성장해요',
    total_completed_days: 52,
    current_streak: 10,
    longest_streak: 20,
    followers_count: 15,
    following_count: 12,
    is_public: true
  },
  {
    id: 4,
    username: 'privateuser',
    nickname: '비공개유저',
    email: 'private@example.com',
    profile_image: null,
    bio: '비공개 프로필입니다',
    total_completed_days: 30,
    current_streak: 5,
    longest_streak: 10,
    followers_count: 3,
    following_count: 2,
    is_public: false
  }
];

export const leaderboardData = {
  global: [
    {
      rank: 1,
      user: {
        id: 3,
        nickname: '테스트유저3',
        profile_image: null
      },
      completed_days: 52,
      progress_rate: 89.5,
      current_streak: 10,
      longest_streak: 20
    },
    {
      rank: 2,
      user: {
        id: 1,
        nickname: '테스트유저1',
        profile_image: '/test-avatar1.png',
        is_me: true
      },
      completed_days: 45,
      progress_rate: 77.3,
      current_streak: 7,
      longest_streak: 15
    },
    {
      rank: 3,
      user: {
        id: 2,
        nickname: '테스트유저2',
        profile_image: '/test-avatar2.png'
      },
      completed_days: 38,
      progress_rate: 65.2,
      current_streak: 3,
      longest_streak: 12
    }
  ],
  friends: [
    {
      rank: 1,
      user: {
        id: 2,
        nickname: '테스트유저2',
        profile_image: '/test-avatar2.png'
      },
      completed_days: 38,
      progress_rate: 65.2,
      current_streak: 3,
      longest_streak: 12
    },
    {
      rank: 2,
      user: {
        id: 1,
        nickname: '테스트유저1',
        profile_image: '/test-avatar1.png',
        is_me: true
      },
      completed_days: 45,
      progress_rate: 77.3,
      current_streak: 7,
      longest_streak: 15
    }
  ]
};

export const friendRelations = {
  user1: {
    followers: [2, 3],  // Users who follow user1
    following: [2],     // Users that user1 follows
    friends: [2]        // Mutual follows
  },
  user2: {
    followers: [1],
    following: [1, 3],
    friends: [1]
  }
};

export const mockApiResponses = {
  loginSuccess: {
    success: true,
    access: 'mock_access_token',
    refresh: 'mock_refresh_token',
    user: testUsers[0]
  },
  
  followSuccess: {
    success: true,
    message: '팔로우했습니다.'
  },
  
  unfollowSuccess: {
    success: true,
    message: '언팔로우했습니다.'
  },
  
  friendsList: {
    success: true,
    friends: [testUsers[1]]
  },
  
  followersList: {
    success: true,
    followers: [testUsers[1], testUsers[2]]
  },
  
  followingList: {
    success: true,
    following: [testUsers[1]]
  },
  
  searchResults: {
    success: true,
    users: [testUsers[1], testUsers[2]]
  },
  
  globalLeaderboard: {
    success: true,
    leaderboard: leaderboardData.global,
    period: 'all',
    plan_id: null
  },
  
  friendsLeaderboard: {
    success: true,
    leaderboard: leaderboardData.friends,
    period: 'all',
    total_friends: 1
  },
  
  myRanking: {
    success: true,
    ranking: {
      rank: 2,
      total_users: 100,
      completed_days: 45,
      current_streak: 7,
      longest_streak: 15,
      percentile: 98
    }
  }
};