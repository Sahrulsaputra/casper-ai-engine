// IT Mind - Main JavaScript
// User ID management dengan fallback yang lebih baik
let USER_ID = sessionStorage.getItem('user_id');

if (!USER_ID) {
  USER_ID = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  sessionStorage.setItem('user_id', USER_ID);
}

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// State management
let isProcessing = false;
let historyCache = null;

/**
 * Membuat API call ke backend
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object|null} body - Request body
 * @returns {Promise<Object>} Response data
 */
async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'X-User-ID': USER_ID,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    appendMessage(`❌ Error: ${error.message}`, 'ai');
    throw error;
  }
}

/**
 * Inisialisasi sesi saat halaman dimuat
 */
async function initializeSession() {
  try {
    await apiCall('/api/init', 'POST');
    console.log('Session initialized for user:', USER_ID);
  } catch (error) {
    console.error('Failed to initialize session:', error);
  }
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
  
  // Load history ketika sidebar dibuka
  if (sidebar.classList.contains('active')) {
    loadHistoryToSidebar();
  }
}

/**
 * Load history ke sidebar
 */
async function loadHistoryToSidebar() {
  const sidebarContent = document.getElementById('sidebar-history');
  
  try {
    sidebarContent.innerHTML = '<p class="loading-history">Memuat riwayat...</p>';
    
    const data = await apiCall('/api/history');
    historyCache = data.history;
    
    if (!data.history || data.history.length === 0) {
      sidebarContent.innerHTML = '<p class="loading-history">Belum ada riwayat chat.</p>';
      return;
    }
    
    // Render history
    sidebarContent.innerHTML = '';
    data.history.forEach(log => {
      const historyItem = document.createElement('div');
      historyItem.className = `history-item ${log.is_user ? 'user-msg' : 'ai-msg'}`;
      
      const label = document.createElement('div');
      label.className = 'msg-label';
      label.textContent = log.is_user ? '👤 Anda' : '🤖 AI';
      
      const text = document.createElement('div');
      text.className = 'msg-text';
      text.textContent = log.message.length > 150 
        ? log.message.substring(0, 150) + '...' 
        : log.message;
      
      historyItem.appendChild(label);
      historyItem.appendChild(text);
      sidebarContent.appendChild(historyItem);
    });
    
  } catch (error) {
    console.error('Error loading history:', error);
    sidebarContent.innerHTML = '<p class="loading-history">❌ Gagal memuat riwayat.</p>';
  }
}

/**
 * Mengirim pesan ke AI
 */
async function sendMessage() {
  if (isProcessing) return;

  const input = document.getElementById('user-input');
  const msg = input.value.trim();
  
  if (!msg) {
    input.focus();
    return;
  }

  // Hapus welcome message jika ada
  removeWelcomeMessage();

  // Tampilkan pesan user
  appendMessage(msg, 'user');
  input.value = '';
  input.disabled = true;
  isProcessing = true;

  // Tampilkan loading indicator
  const loadingId = showLoading();

  try {
    const res = await apiCall('/api/chat', 'POST', { query: msg });
    removeLoading(loadingId);
    appendMessage(res.response || 'Tidak ada respons dari server.', 'ai');
    
    // Clear history cache
    historyCache = null;
  } catch (error) {
    removeLoading(loadingId);
    appendMessage('Maaf, terjadi kesalahan saat memproses pesan Anda.', 'ai');
  } finally {
    input.disabled = false;
    input.focus();
    isProcessing = false;
  }
}

/**
 * Menambahkan pesan ke terminal
 * @param {string} text - Teks pesan
 * @param {string} sender - 'user' atau 'ai'
 */
function appendMessage(text, sender) {
  const terminal = document.getElementById('terminal');
  const messageDiv = document.createElement('div');
  messageDiv.className = sender;
  
  if (sender === 'user') {
    messageDiv.textContent = text;
  } else {
    // Untuk AI, format dengan lebih baik
    messageDiv.innerHTML = formatAIResponse(text);
  }
  
  terminal.appendChild(messageDiv);
  terminal.scrollTop = terminal.scrollHeight;
}

/**
 * Format respons AI dengan syntax highlighting sederhana
 * @param {string} text - Teks respons
 * @returns {string} HTML formatted text
 */
function formatAIResponse(text) {
  // Escape HTML
  let formatted = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Format code blocks dengan ```
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Format inline code dengan `
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Format bold **text**
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Format newlines
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

/**
 * Menampilkan loading indicator
 * @returns {string} Loading element ID
 */
function showLoading() {
  const terminal = document.getElementById('terminal');
  const loadingDiv = document.createElement('div');
  const loadingId = 'loading_' + Date.now();
  loadingDiv.id = loadingId;
  loadingDiv.className = 'ai';
  loadingDiv.innerHTML = '<span class="typing-indicator">⚡ Memproses</span>';
  terminal.appendChild(loadingDiv);
  terminal.scrollTop = terminal.scrollHeight;
  return loadingId;
}

/**
 * Menghapus loading indicator
 * @param {string} loadingId - ID elemen loading
 */
function removeLoading(loadingId) {
  const loadingElement = document.getElementById(loadingId);
  if (loadingElement) {
    loadingElement.remove();
  }
}

/**
 * Menghapus welcome message
 */
function removeWelcomeMessage() {
  const welcomeMsg = document.querySelector('.welcome-message');
  if (welcomeMsg) {
    welcomeMsg.remove();
  }
}

/**
 * Menghapus semua data user
 */
async function deleteMyData() {
  const confirmed = confirm(
    '⚠️ PERINGATAN!\n\n' +
    'Ini akan menghapus SEMUA data Anda termasuk:\n' +
    '- Riwayat chat\n' +
    '- File yang diupload\n' +
    '- Preferensi\n\n' +
    'Tindakan ini TIDAK DAPAT DIBATALKAN!\n\n' +
    'Lanjutkan?'
  );
  
  if (!confirmed) return;
  
  try {
    await apiCall('/api/data', 'DELETE');
    
    // Clear terminal
    const terminal = document.getElementById('terminal');
    terminal.innerHTML = '';
    
    // Tampilkan konfirmasi
    appendMessage('✅ Semua data Anda telah dihapus.', 'ai');
    appendMessage('Sesi baru telah dimulai.', 'ai');
    
    // Clear history cache
    historyCache = null;
    
    // Close sidebar if open
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    
    // Reset session
    await initializeSession();
  } catch (error) {
    console.error('Error deleting data:', error);
    appendMessage('❌ Gagal menghapus data. Silakan coba lagi.', 'ai');
  }
}

/**
 * Trigger file upload
 */
function uploadFile() {
  document.getElementById('file-upload').click();
}

/**
 * Handle file upload
 */
document.getElementById('file-upload').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validasi tipe file
  const allowedExtensions = ['py', 'js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'txt', 'cpp', 'c', 'java', 'php', 'rb', 'go', 'rs', 'swift', 'kt'];
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    appendMessage(
      `❌ Tipe file tidak didukung. Hanya file: ${allowedExtensions.join(', ')}`,
      'ai'
    );
    event.target.value = '';
    return;
  }
  
  // Validasi ukuran file (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    appendMessage('❌ File terlalu besar. Maksimal 5MB.', 'ai');
    event.target.value = '';
    return;
  }
  
  removeWelcomeMessage();
  appendMessage(`📤 Mengupload: ${file.name}...`, 'user');
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'X-User-ID': USER_ID
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const result = await response.json();
    appendMessage(
      `✅ File berhasil disimpan: ${file.name}\n` +
      `Ukuran: ${(file.size / 1024).toFixed(2)} KB\n` +
      `Tipe: ${file.type || fileExtension}`,
      'ai'
    );
    
    // Clear history cache
    historyCache = null;
  } catch (error) {
    console.error('Upload error:', error);
    appendMessage(`❌ Gagal mengupload file: ${error.message}`, 'ai');
  } finally {
    // Reset file input
    event.target.value = '';
  }
});

/**
 * Handle Enter key press
 */
document.getElementById('user-input').addEventListener('keypress', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

/**
 * Close sidebar dengan ESC key
 */
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar.classList.contains('active')) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  }
});

/**
 * Initialize app saat DOM ready
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('IT Mind initialized');
  console.log('User ID:', USER_ID);
  
  // Initialize session
  initializeSession();
  
  // Focus pada input
  document.getElementById('user-input').focus();
});

// Export functions untuk debugging (optional)
if (typeof window !== 'undefined') {
  window.ITMind = {
    sendMessage,
    deleteMyData,
    uploadFile,
    toggleSidebar,
    USER_ID
  };
}