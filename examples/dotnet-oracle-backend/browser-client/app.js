const api = 'http://localhost:5080/api/books';
const form = document.querySelector('#book-form');
const title = document.querySelector('#title');
const isRead = document.querySelector('#is-read');
const add = document.querySelector('#add');
const refresh = document.querySelector('#refresh');
const list = document.querySelector('#books');
const status = document.querySelector('#status');

async function loadBooks() {
  refresh.disabled = true;
  try {
    const response = await fetch(api);
    if (!response.ok) throw new Error(`The list could not load (HTTP ${response.status}).`);
    const books = await response.json();
    list.replaceChildren();
    for (const book of books) {
      const item = document.createElement('li');
      // A book title is text. Never turn it into HTML with innerHTML.
      item.textContent = `${book.title} — ${book.isRead ? 'Read' : 'To read'}`;
      list.append(item);
    }
    status.textContent = books.length
      ? `${books.length} books in your list.`
      : 'No books yet. Add one above.';
    return true;
  } catch (error) {
    status.textContent = `${error.message} Check that the API, Oracle and local CORS setting are ready.`;
    return false;
  } finally {
    refresh.disabled = false;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const cleanTitle = title.value.trim();
  if (!cleanTitle) {
    status.textContent = 'Type a book title first.';
    title.focus();
    return;
  }
  add.disabled = true;
  let saved = false;
  try {
    const response = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: cleanTitle, isRead: isRead.checked }),
    });
    if (!response.ok) {
      if (response.status === 400) throw new Error('Use a title with 1 to 120 characters.');
      throw new Error(`The book could not be saved (HTTP ${response.status}).`);
    }
    saved = true;
    form.reset();
    const loaded = await loadBooks();
    status.textContent = loaded
      ? 'Book saved. The list is up to date.'
      : 'Book saved, but the list did not refresh. Use Refresh list; do not add it again.';
    title.focus();
  } catch (error) {
    status.textContent = saved
      ? 'Book saved. Use Refresh list to check it.'
      : `${error.message} If the connection failed, refresh the list before trying again; the save may have reached the API.`;
  } finally {
    add.disabled = false;
  }
});

refresh.addEventListener('click', () => void loadBooks());
void loadBooks();
