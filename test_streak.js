const today = new Date();
console.log('Today:', today.toISOString().split('T')[0]);

const validDates = new Set(["2026-06-27", "2026-06-28"]);

let currentStreak = 0;
let checkDate = new Date();
let checkStr = checkDate.toISOString().split('T')[0];

if (!validDates.has(checkStr)) {
  checkDate.setDate(checkDate.getDate() - 1);
  checkStr = checkDate.toISOString().split('T')[0];
}

while (validDates.has(checkStr)) {
  currentStreak++;
  checkDate.setDate(checkDate.getDate() - 1);
  checkStr = checkDate.toISOString().split('T')[0];
}

console.log('Current streak:', currentStreak);
