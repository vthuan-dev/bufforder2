const prisma = require('../lib/prisma');
const { hashPassword } = require('../lib/utils');

async function main() {
  const phone = process.argv[2] || '0901234567';
  const password = process.argv[3] || 'password123';
  const fullName = process.argv[4] || 'Nguyễn Văn A';
  const vipLevel = process.argv[5] || 'vip-1';
  const balance = parseFloat(process.argv[6] || '10000');

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { phoneNumber: phone },
    update: {
      password: hashedPassword,
      balance,
      vipLevel,
      fullName
    },
    create: {
      phoneNumber: phone,
      password: hashedPassword,
      fullName,
      vipLevel,
      balance,
      totalDeposited: balance,
      commission: 0,
      inviteCodeUsed: 'OVERSTOCK2026'
    }
  });

  console.log('✅ User seeded successfully:');
  console.log(`   Phone Number: ${user.phoneNumber}`);
  console.log(`   Password:     ${password}`);
  console.log(`   Full Name:    ${user.fullName}`);
  console.log(`   VIP Level:    ${user.vipLevel}`);
  console.log(`   Balance:      $${user.balance}`);
}

main()
  .catch((e) => {
    console.error('❌ Error creating user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
