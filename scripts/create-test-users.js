#!/usr/bin/env node

const fetch = require('node-fetch');
const { testUsers } = require('../tests/fixtures/test-users');

const API_BASE = process.env.API_BASE || 'http://localhost:8000';

async function createUser(userData) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      console.log(`✅ 사용자 생성 성공: ${userData.nickname}`);
      return await response.json();
    } else {
      const error = await response.text();
      console.log(`⚠️  사용자 생성 실패 (${userData.nickname}): ${error}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ 사용자 생성 오류 (${userData.nickname}):`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 테스트 사용자 생성 시작...\n');
  
  for (const [key, user] of Object.entries(testUsers)) {
    console.log(`생성 중: ${user.nickname} (${user.email})`);
    await createUser(user);
    // API 부하 방지를 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✨ 테스트 사용자 생성 완료!');
}

main().catch(console.error);