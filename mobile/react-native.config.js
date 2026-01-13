module.exports = {
  // Node 실행 경로 명시적 지정 (Gradle 빌드 문제 해결)
  reactNativePath: './node_modules/react-native',
  project: {
    android: {
      sourceDir: './android',
    },
  },
  // CLI 설정
  commands: [],
  platforms: {},
};
