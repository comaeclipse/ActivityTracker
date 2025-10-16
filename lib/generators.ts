const adjectives = [
  'Quick', 'Brave', 'Swift', 'Bold', 'Clever', 'Mighty', 'Noble', 'Fierce',
  'Gentle', 'Wild', 'Silent', 'Bright', 'Dark', 'Golden', 'Silver', 'Azure',
  'Crimson', 'Nimble', 'Steady', 'Wise', 'Happy', 'Lucky', 'Mystic', 'Epic',
  'Super', 'Ultra', 'Mega', 'Turbo', 'Cosmic', 'Stellar'
];

const verbs = [
  'Running', 'Jumping', 'Flying', 'Swimming', 'Dancing', 'Racing', 'Climbing',
  'Sprinting', 'Gliding', 'Soaring', 'Diving', 'Leaping', 'Dashing', 'Rushing',
  'Blazing', 'Charging', 'Striding', 'Bouncing', 'Sliding', 'Rolling'
];

const animals = [
  'Tiger', 'Wolf', 'Panda', 'Eagle', 'Falcon', 'Lion', 'Bear', 'Fox',
  'Hawk', 'Raven', 'Shark', 'Panther', 'Cheetah', 'Leopard', 'Jaguar',
  'Cobra', 'Dragon', 'Phoenix', 'Griffin', 'Lynx', 'Otter', 'Badger',
  'Wolverine', 'Bison', 'Moose', 'Stag', 'Raven', 'Owl', 'Condor', 'Viper'
];

export function generateRandomUsername(): string {
  const useVerb = Math.random() > 0.5;
  const firstWord = useVerb
    ? verbs[Math.floor(Math.random() * verbs.length)]
    : adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 100);

  return `${firstWord}${animal}${number}`;
}

export function generateRandomPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
