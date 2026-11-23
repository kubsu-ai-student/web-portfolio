const films = [
  { id:'rain', name:'Город после дождя', genre:'Драма', minutes:96, day:16, time:'18:30', alt:'Человек перед зданием ночью после дождя', summary:'Архитектор возвращается в город детства на один вечер. Случайная встреча у закрытого кинотеатра заставляет его пересмотреть планы на отъезд.' },
  { id:'red', name:'Красный столик', genre:'Камерная драма', minutes:82, day:16, time:'21:00', alt:'Красный свет в пустом ночном кафе', summary:'В ночном кафе две незнакомки по очереди рассказывают одну и ту же историю. К утру становится ясно, что каждая помнит разное.' },
  { id:'salt', name:'Соль на ветру', genre:'Роуд-муви', minutes:104, day:17, time:'16:00', alt:'Фигура с зонтом в пустынном пейзаже', summary:'Две сестры едут по высохшему побережью, чтобы найти дом с единственной семейной фотографии.' },
  { id:'light', name:'Дальний свет', genre:'Мистическая драма', minutes:91, day:17, time:'19:30', alt:'Маяк в туманном прибрежном пейзаже', summary:'Смотритель маяка начинает получать письма, адресованные его предшественнику. Чем больше он читает, тем меньше верит официальной истории острова.' },
  { id:'roof', name:'Выше крыш', genre:'Драма взросления', minutes:76, day:18, time:'15:00', alt:'Два человека на крыше на фоне ночного города', summary:'Двое друзей проводят последнюю ночь перед выпуском на крышах своего района. Они пытаются решить, что взять с собой во взрослую жизнь.' },
  { id:'hall', name:'Последний ряд', genre:'Мелодрама', minutes:88, day:18, time:'18:00', alt:'Зал кинотеатра в розовом сумеречном свете', summary:'Закрывающийся кинотеатр устраивает последний сеанс. Киномеханик и его редкие зрители выбирают, какой фильм увидят вместе в последний раз.' },
];
const storeKey = 'frame-festival-saved-v1';
function loadSaved() {
  try {
    const stored = JSON.parse(localStorage.getItem(storeKey) || '[]');
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}
const favorites = loadSaved();
const list = document.getElementById('films');
const dates = document.querySelectorAll('[data-day]');
const saved = document.getElementById('saved');
const dialog = document.getElementById('film-dialog');
const filmSave = document.getElementById('film-save');
let day = 'all';
let savedOnly = false;
let currentFilm = null;
const asset = (id) => id + '.jpg';
const showtime = (film) => film.day + ' апреля · ' + film.time;
const put = (id, text) => { document.getElementById(id).textContent = text; };

function render() {
  put('saved-count', favorites.size);
  put('program-title', savedOnly ? 'Мой список' : 'Программа');
  saved.setAttribute('aria-pressed', String(savedOnly));
  for (const button of dates) button.setAttribute('aria-pressed', String(button.dataset.day === day));
  const shown = films.filter((film) => (day === 'all' || day === String(film.day))
    && (!savedOnly || favorites.has(film.id)));
  const cards = shown.map((film) => {
    const card = document.createElement('article');
    card.className = 'film';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'film-open';
    open.setAttribute('aria-label', 'Открыть карточку фильма «' + film.name + '»');
    open.addEventListener('click', () => openFilm(film));
    const still = document.createElement('img');
    still.src = asset(film.id);
    still.alt = film.alt;
    still.loading = 'lazy';
    const title = document.createElement('span');
    title.className = 'film-name';
    title.textContent = film.name;
    const meta = document.createElement('span');
    meta.className = 'film-meta';
    meta.textContent = showtime(film) + ' · ' + film.genre;
    open.append(still, title, meta);
    const keep = document.createElement('button');
    keep.type = 'button';
    keep.className = 'keep';
    keep.dataset.keep = film.id;
    keep.textContent = favorites.has(film.id) ? '♥' : '♡';
    keep.setAttribute('aria-pressed', String(favorites.has(film.id)));
    keep.setAttribute('aria-label', 'Сохранить фильм «' + film.name + '»');
    keep.addEventListener('click', () => toggle(film, true));
    card.append(open, keep);
    return card;
  });
  list.replaceChildren(...cards);
  const empty = document.getElementById('empty');
  empty.hidden = shown.length > 0;
  empty.textContent = favorites.size ? 'В выбранный день здесь нет сохранённых фильмов.' : 'Здесь появятся фильмы, которые вы сохранили.';
  put('count-message', 'Найдено фильмов: ' + shown.length);
}

function toggle(film, restoreFocus = false) {
  if (favorites.has(film.id)) favorites.delete(film.id);
  else favorites.add(film.id);
  try {
    localStorage.setItem(storeKey, JSON.stringify([...favorites]));
  } catch {
    // The current selection remains usable when browser storage is unavailable.
  }
  render();
  if (dialog.open) updateDialogButton(film);
  if (restoreFocus) (list.querySelector('[data-keep="' + film.id + '"]') || saved).focus({preventScroll:true});
}

function updateDialogButton(film) {
  filmSave.textContent = favorites.has(film.id) ? 'Убрать из моего списка' : 'Добавить в мой список';
}

function openFilm(film) {
  currentFilm = film;
  const image = document.getElementById('film-image');
  image.src = asset(film.id);
  image.alt = film.alt;
  put('film-time', showtime(film));
  put('film-title', film.name);
  put('film-meta', film.genre + ' · ' + film.minutes + ' мин.');
  put('film-summary', film.summary);
  updateDialogButton(film);
  dialog.showModal();
}

for (const button of dates) {
  button.addEventListener('click', () => { day = button.dataset.day; render(); });
}
saved.addEventListener('click', () => {
  savedOnly = !savedOnly;
  day = 'all';
  render();
  document.getElementById('program').scrollIntoView();
});
filmSave.addEventListener('click', () => toggle(currentFilm));
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
render();
