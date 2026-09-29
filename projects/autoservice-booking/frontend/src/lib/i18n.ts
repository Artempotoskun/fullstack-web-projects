import { Locale } from './types';

export const locales: Locale[] = ['en', 'uk', 'ru'];

const dictionaries = {
  en: {
    nav: { services: 'Services', process: 'How it works', locations: 'Locations', account: 'My garage', admin: 'Operations', login: 'Sign in', book: 'Book a service', logout: 'Log out' },
    hero: { eyebrow: 'Built around your time', title: 'Car care, precisely scheduled.', body: 'Choose your vehicle, service and workshop. We calculate live availability across technicians and service bays—then reserve your slot instantly.', cta: 'Book a service', secondary: 'Explore services', trust: '4.9 average rating · 12 certified services · 2 Kyiv workshops' },
    home: { servicesTitle: 'Everything your car needs', servicesBody: 'Transparent pricing, qualified technicians and live appointment availability.', howTitle: 'From driveway to done', locationsTitle: 'Two workshops. One standard.', reviewsTitle: 'Trusted by drivers', faqTitle: 'Questions, answered', advantage: 'Your appointment is assigned to the right specialist and a real service bay—never an imaginary slot.' },
    booking: { eyebrow: 'Live availability', title: 'Book your workshop visit', vehicle: '1. Vehicle', service: '2. Service', location: '3. Location', date: '4. Date', time: '5. Available time', confirm: 'Confirm booking', success: 'Your booking is confirmed in the system.', noSlots: 'No available time slots for this date.', signIn: 'Sign in and add a vehicle before booking.' },
    account: { title: 'My garage', vehicles: 'Vehicles', bookings: 'Bookings', notifications: 'Notifications', addVehicle: 'Add vehicle', upcoming: 'Upcoming visits', history: 'Service history', reschedule: 'Reschedule', cancel: 'Cancel booking' },
    auth: { loginTitle: 'Welcome back', registerTitle: 'Create your driver account', email: 'Email', password: 'Password', firstName: 'First name', lastName: 'Last name', login: 'Sign in', register: 'Create account', noAccount: 'New here?', hasAccount: 'Already registered?' },
    status: { PENDING: 'Pending', CONFIRMED: 'Confirmed', IN_PROGRESS: 'In progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled', NO_SHOW: 'No show' },
  },
  uk: {
    nav: { services: 'Послуги', process: 'Як це працює', locations: 'Локації', account: 'Мій гараж', admin: 'Керування', login: 'Увійти', book: 'Записатися', logout: 'Вийти' },
    hero: { eyebrow: 'Підлаштовано під ваш час', title: 'Автосервіс за точним розкладом.', body: 'Оберіть авто, послугу та СТО. Ми розрахуємо вільний час механіків і постів та миттєво зарезервуємо слот.', cta: 'Записатися на сервіс', secondary: 'Переглянути послуги', trust: 'Рейтинг 4,9 · 12 сертифікованих послуг · 2 СТО у Києві' },
    home: { servicesTitle: 'Усе, що потрібно вашому авто', servicesBody: 'Прозора ціна, кваліфіковані механіки та актуальний розклад.', howTitle: 'Від запису до готового авто', locationsTitle: 'Два СТО. Один стандарт.', reviewsTitle: 'Нам довіряють водії', faqTitle: 'Відповіді на запитання', advantage: 'Запис отримує відповідного спеціаліста та реальний сервісний пост — жодних уявних слотів.' },
    booking: { eyebrow: 'Актуальний розклад', title: 'Запишіться на СТО', vehicle: '1. Авто', service: '2. Послуга', location: '3. Локація', date: '4. Дата', time: '5. Вільний час', confirm: 'Підтвердити запис', success: 'Запис успішно створено.', noSlots: 'На цю дату вільного часу немає.', signIn: 'Увійдіть і додайте автомобіль перед записом.' },
    account: { title: 'Мій гараж', vehicles: 'Автомобілі', bookings: 'Записи', notifications: 'Сповіщення', addVehicle: 'Додати авто', upcoming: 'Майбутні візити', history: 'Історія сервісу', reschedule: 'Перенести', cancel: 'Скасувати запис' },
    auth: { loginTitle: 'З поверненням', registerTitle: 'Створіть обліковий запис', email: 'Email', password: 'Пароль', firstName: "Ім'я", lastName: 'Прізвище', login: 'Увійти', register: 'Зареєструватися', noAccount: 'Вперше тут?', hasAccount: 'Вже зареєстровані?' },
    status: { PENDING: 'Очікує', CONFIRMED: 'Підтверджено', IN_PROGRESS: 'У роботі', COMPLETED: 'Завершено', CANCELLED: 'Скасовано', NO_SHOW: 'Не з’явився' },
  },
  ru: {
    nav: { services: 'Услуги', process: 'Как это работает', locations: 'Локации', account: 'Мой гараж', admin: 'Управление', login: 'Войти', book: 'Записаться', logout: 'Выйти' },
    hero: { eyebrow: 'Подстроено под ваше время', title: 'Автосервис по точному расписанию.', body: 'Выберите автомобиль, услугу и СТО. Мы рассчитаем свободное время механиков и постов и мгновенно зарезервируем слот.', cta: 'Записаться на сервис', secondary: 'Посмотреть услуги', trust: 'Рейтинг 4,9 · 12 сертифицированных услуг · 2 СТО в Киеве' },
    home: { servicesTitle: 'Всё, что нужно вашему автомобилю', servicesBody: 'Прозрачная цена, квалифицированные механики и актуальное расписание.', howTitle: 'От записи до готового авто', locationsTitle: 'Два СТО. Один стандарт.', reviewsTitle: 'Нам доверяют водители', faqTitle: 'Ответы на вопросы', advantage: 'Запись получает подходящего специалиста и реальный сервисный пост — никаких воображаемых слотов.' },
    booking: { eyebrow: 'Актуальное расписание', title: 'Запишитесь на СТО', vehicle: '1. Автомобиль', service: '2. Услуга', location: '3. Локация', date: '4. Дата', time: '5. Свободное время', confirm: 'Подтвердить запись', success: 'Запись успешно создана.', noSlots: 'На эту дату свободного времени нет.', signIn: 'Войдите и добавьте автомобиль перед записью.' },
    account: { title: 'Мой гараж', vehicles: 'Автомобили', bookings: 'Записи', notifications: 'Уведомления', addVehicle: 'Добавить авто', upcoming: 'Предстоящие визиты', history: 'История сервиса', reschedule: 'Перенести', cancel: 'Отменить запись' },
    auth: { loginTitle: 'С возвращением', registerTitle: 'Создайте аккаунт водителя', email: 'Email', password: 'Пароль', firstName: 'Имя', lastName: 'Фамилия', login: 'Войти', register: 'Зарегистрироваться', noAccount: 'Впервые здесь?', hasAccount: 'Уже зарегистрированы?' },
    status: { PENDING: 'Ожидает', CONFIRMED: 'Подтверждено', IN_PROGRESS: 'В работе', COMPLETED: 'Завершено', CANCELLED: 'Отменено', NO_SHOW: 'Не явился' },
  },
} as const;

export function dictionary(locale: string) { return dictionaries[(locales.includes(locale as Locale) ? locale : 'en') as Locale]; }
