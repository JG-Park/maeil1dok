export const testUsers = {
  main: {
    email: 'test.user@example.com',
    nickname: '테스트유저',
    password: 'Test1234!@#$',
  },
  friend1: {
    email: 'friend1@example.com',
    nickname: '친구1',
    password: 'Friend1234!@#$',
  },
  friend2: {
    email: 'friend2@example.com',
    nickname: '친구2',
    password: 'Friend1234!@#$',
  },
  groupAdmin: {
    email: 'group.admin@example.com',
    nickname: '그룹관리자',
    password: 'Admin1234!@#$',
  },
};

export const testGroups = {
  publicGroup: {
    name: '공개 테스트 그룹',
    description: '테스트용 공개 그룹입니다',
    isPublic: true,
    maxMembers: 20,
  },
  privateGroup: {
    name: '비공개 테스트 그룹',
    description: '테스트용 비공개 그룹입니다',
    isPublic: false,
    maxMembers: 10,
  },
};