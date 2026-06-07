/**
 * auth.js — user account management
 * Passwords are hashed (djb2) before storage. Not cryptographic,
 * but keeps plaintext out of the database.
 */

const DEFAULT_USERS = [
  {
    username: 'nicole',
    displayName: 'Nicole',
    role: 'admin',
    pwHash: '',           // set on first login
    defaultCat: '',       // show all categories
    defaultSort: 'name'
  },
  {
    username: 'coordinator',
    displayName: 'Prize Coordinator',
    role: 'coordinator',
    pwHash: '',           // set on first login
    defaultCat: 'BINGO',  // default to BINGO view
    defaultSort: 'name'
  }
];

let _currentUser = null;

function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

async function loadUsers() {
  try {
    const data = await dbGet('users');
    if (data) return Object.values(data);
    // First run — seed default users
    const usersObj = {};
    DEFAULT_USERS.forEach(u => { usersObj[u.username] = u; });
    await dbSet('users', usersObj);
    return DEFAULT_USERS;
  } catch (e) {
    console.error('loadUsers failed', e);
    return DEFAULT_USERS;
  }
}

async function saveUser(user) {
  await dbSet('users/' + user.username, user);
}

async function login(username, password) {
  const users = await loadUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
  if (!user) return { ok: false, error: 'Username not found.' };

  if (!user.pwHash) {
    // First login — need to set password
    return { ok: false, firstLogin: true, user };
  }

  if (user.pwHash !== simpleHash(password)) {
    return { ok: false, error: 'Incorrect password.' };
  }

  _currentUser = user;
  return { ok: true, user };
}

async function setPassword(user, newPassword) {
  user.pwHash = simpleHash(newPassword);
  await saveUser(user);
  _currentUser = user;
}

async function changePassword(oldPassword, newPassword) {
  if (_currentUser.pwHash && simpleHash(oldPassword) !== _currentUser.pwHash) {
    return { ok: false, error: 'Current password is incorrect.' };
  }
  _currentUser.pwHash = simpleHash(newPassword);
  await saveUser(_currentUser);
  return { ok: true };
}

async function resetUserPassword(username) {
  const users = await loadUsers();
  const user = users.find(u => u.username === username);
  if (!user) return;
  user.pwHash = '';
  await saveUser(user);
}

function currentUser() { return _currentUser; }
function isAdmin() { return _currentUser?.role === 'admin'; }
function signOut() { _currentUser = null; }

// Local prefs (not shared — per device)
function getPrefs() {
  try {
    return JSON.parse(localStorage.getItem('soiree_prefs_' + (_currentUser?.username || '')) || '{}');
  } catch (e) { return {}; }
}
function savePrefs(p) {
  try {
    localStorage.setItem('soiree_prefs_' + (_currentUser?.username || ''), JSON.stringify(p));
  } catch (e) {}
}
