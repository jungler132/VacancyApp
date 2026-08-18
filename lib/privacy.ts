import type { AppLocale } from '@/lib/i18n/locale';
import { SUPPORT_EMAIL } from '@/lib/support';

export const PRIVACY_HREF = '/privacy';
export const PRIVACY_URL = 'https://jungler132.github.io/VacancyApp/';
export const PRIVACY_EMAIL = SUPPORT_EMAIL;
export const PRIVACY_UPDATED = '2026-08-15';

export type PrivacyBlock = {
  heading: string;
  paragraphs: string[];
  items?: string[];
};

export type PrivacyDoc = {
  title: string;
  updated: string;
  blocks: PrivacyBlock[];
};

const DOCS: Record<AppLocale, PrivacyDoc> = {
  ru: {
    title: 'Политика конфиденциальности',
    updated: 'Приложение Workly (Android, пакет com.workly.app). Дата вступления в силу: 15 августа 2026 г.',
    blocks: [
      {
        heading: '1. Кто мы и о чём эта политика',
        paragraphs: [
          'Workly — мобильный агрегатор вакансий. Приложение показывает объявления с публичных площадок, даёт сохранить интересные вакансии, вести страницу услуг и настроить локальные оповещения о новых предложениях.',
          'В приложении нет регистрации, аккаунта и собственной аналитики. Workly может показывать рекламу через Google AdMob. Этот текст описывает, какие данные обрабатываются на устройстве и какие запросы уходят на сторонние сервисы.',
          `Контакт: ${PRIVACY_EMAIL}`,
        ],
      },
      {
        heading: '2. Какие данные обрабатываются',
        paragraphs: [
          'Workly не собирает имя, телефон, электронную почту, геолокацию и платёжные данные на свой сервер.',
          'На устройстве пользователя (локально) могут храниться:',
        ],
        items: [
          'сохранённые вакансии и статусы откликов;',
          'выбранные фильтры поиска, регион, язык, тема и источники;',
          'настройки оповещений о новых вакансиях;',
          'страница услуг, фото и тексты, которые вы сами добавили;',
          'список часто открываемых сайтов и каналов.',
        ],
      },
      {
        heading: '',
        paragraphs: [
          'Эти данные остаются на телефоне и не отправляются нам на сервер: у Workly нет собственного бэкенда для хранения пользовательских данных.',
        ],
      },
      {
        heading: '3. Поиск вакансий и сторонние сервисы',
        paragraphs: [
          'Чтобы показать объявления, приложение отправляет поисковый запрос (текст, город/регион, фильтры) на публичные API площадок, которые вы включили в источниках. Это нужно, чтобы приложение работало.',
          'Среди таких площадок могут быть, в частности:',
        ],
        items: [
          'HeadHunter (hh.ru / hh.az);',
          'BirJob;',
          'Работа России (trudvsem.ru);',
          'Adzuna, Jooble, USAJobs;',
          'Arbeitnow, Remotive, Jobicy, RemoteOK, Himalayas.',
        ],
      },
      {
        heading: '',
        paragraphs: [
          'Дальнейшая обработка запроса регулируется политиками этих сервисов. Если вы открываете вакансию, ссылку на сайт или Telegram-канал, вы переходите на сторонний ресурс — его правила начинают действовать отдельно.',
          'Необязательный перевод текста вакансии выполняется через сторонний сервис перевода. Запрос содержит фрагмент объявления и выбранный язык.',
        ],
      },
      {
        heading: '4. Разрешения Android',
        paragraphs: [],
        items: [
          'Интернет — загрузка вакансий и открытие ссылок.',
          'Уведомления — только если вы включили оповещения о новых вакансиях. Их можно отключить в системе или в приложении.',
          'Фоновая проверка — периодический поиск новых объявлений по сохранённым фильтрам. Уведомления локальные, на устройство.',
          'Фото — только если вы сами добавляете аватар или снимки услуги. Файлы остаются на устройстве.',
        ],
      },
      {
        heading: '',
        paragraphs: ['Буфер обмена используется только по вашему действию: скопировать ссылку на вакансию, канал или почту.'],
      },
      {
        heading: '5. Дети',
        paragraphs: ['Приложение не предназначено для детей младше 13 лет и не собирает данные детей сознательно.'],
      },
      {
        heading: '6. Реклама',
        paragraphs: [
          'В приложении может показываться реклама Google AdMob (баннеры и другие форматы Google). Чтобы подобрать объявления, Google может использовать рекламный идентификатор устройства, данные о взаимодействии с рекламой и техническую информацию об устройстве. Это делает Google, а не сервер Workly.',
          'Политика Google: https://policies.google.com/privacy и справка AdMob: https://support.google.com/admob/answer/6128543',
        ],
      },
      {
        heading: '7. Передача и продажа данных',
        paragraphs: [
          'Мы не продаём персональные данные. Поисковые параметры уходят на выбранные площадки вакансий, чтобы получить результаты поиска. Данные, связанные с показом рекламы, обрабатывает Google AdMob в соответствии со своими правилами.',
        ],
      },
      {
        heading: '8. Хранение и удаление',
        paragraphs: [
          'Локальные данные можно удалить, очистив хранилище приложения в настройках Android или удалив само приложение. После удаления данные с устройства пропадают.',
        ],
      },
      {
        heading: '9. Изменения',
        paragraphs: [
          'Если политика изменится, мы обновим этот текст в приложении, веб-страницу и дату вступления в силу.',
        ],
      },
      {
        heading: '10. Контакты',
        paragraphs: [`Вопросы по конфиденциальности: ${PRIVACY_EMAIL}`],
      },
    ],
  },
  en: {
    title: 'Privacy policy',
    updated: 'Workly app (Android, package com.workly.app). Effective date: 15 August 2026.',
    blocks: [
      {
        heading: '1. Who we are',
        paragraphs: [
          'Workly is a mobile job aggregator. It shows listings from public boards, lets you save jobs, keep a services page, and set local alerts for new listings.',
          'There is no sign-up, account, or first-party analytics. Workly may show ads through Google AdMob. This text describes what is processed on the device and which requests go to third parties.',
          `Contact: ${PRIVACY_EMAIL}`,
        ],
      },
      {
        heading: '2. What data is processed',
        paragraphs: [
          'Workly does not collect your name, phone, email, location or payment data on our server.',
          'The following may be stored locally on your device:',
        ],
        items: [
          'saved jobs and application statuses;',
          'search filters, region, language, theme and sources;',
          'alert settings for new jobs;',
          'your services page, photos and texts you add;',
          'frequently opened sites and channels.',
        ],
      },
      {
        heading: '',
        paragraphs: [
          'This data stays on the phone and is not sent to us: Workly has no backend for storing user data.',
        ],
      },
      {
        heading: '3. Job search and third parties',
        paragraphs: [
          'To show listings, the app sends a search query (text, city/region, filters) to the public APIs of boards you enabled in Sources. That is required for the app to work.',
          'Those boards may include:',
        ],
        items: [
          'HeadHunter (hh.ru / hh.az);',
          'BirJob;',
          'Russia’s jobs portal (trudvsem.ru);',
          'Adzuna, Jooble, USAJobs;',
          'Arbeitnow, Remotive, Jobicy, RemoteOK, Himalayas.',
        ],
      },
      {
        heading: '',
        paragraphs: [
          'Further processing is governed by those services’ policies. If you open a job, a website or a Telegram channel, you leave Workly and their rules apply.',
          'Optional job-text translation uses a third-party translation service. The request contains a fragment of the listing and the target language.',
        ],
      },
      {
        heading: '4. Android permissions',
        paragraphs: [],
        items: [
          'Internet — to load jobs and open links.',
          'Notifications — only if you turn on new-job alerts. You can disable them in the system or in the app.',
          'Background fetch — periodic search by saved filters. Alerts are local, on the device.',
          'Photos — only if you add an avatar or service photos. Files stay on the device.',
        ],
      },
      {
        heading: '',
        paragraphs: ['The clipboard is used only when you copy a job link, a channel link or an email.'],
      },
      {
        heading: '5. Children',
        paragraphs: ['The app is not intended for children under 13 and does not knowingly collect children’s data.'],
      },
      {
        heading: '6. Advertising',
        paragraphs: [
          'The app may show Google AdMob ads. To serve ads, Google may use the advertising ID, ad interaction data and device information. That is done by Google, not by a Workly server.',
          'Google policy: https://policies.google.com/privacy and AdMob help: https://support.google.com/admob/answer/6128543',
        ],
      },
      {
        heading: '7. Sharing and sale',
        paragraphs: [
          'We do not sell personal data. Search parameters go to the job boards you enabled so we can fetch results. Ad-related data is processed by Google AdMob under its rules.',
        ],
      },
      {
        heading: '8. Storage and deletion',
        paragraphs: [
          'You can delete local data by clearing the app storage in Android settings or by uninstalling the app. After that, the data is gone from the device.',
        ],
      },
      {
        heading: '9. Changes',
        paragraphs: ['If this policy changes, we will update the in-app text, the web page and the effective date.'],
      },
      {
        heading: '10. Contact',
        paragraphs: [`Privacy questions: ${PRIVACY_EMAIL}`],
      },
    ],
  },
  az: {
    title: 'Məxfilik siyasəti',
    updated: 'Workly tətbiqi (Android, paket com.workly.app). Qüvvəyə minmə tarixi: 15 avqust 2026.',
    blocks: [
      {
        heading: '1. Biz kimik',
        paragraphs: [
          'Workly vakansiyaların mobil aqreqatorudur. Tətbiq açıq saytlardan elan göstərir, vakansiyanı yadda saxlamağa, xidmət səhifəsi tutmağa və yeni elanlar üçün lokal bildiriş qurmağa imkan verir.',
          'Qeydiyyat, hesab və öz analitika yoxdur. Workly Google AdMob vasitəsilə reklam göstərə bilər. Bu mətn cihazda hansı məlumatın emal olunduğunu və hansı sorğuların üçüncü tərəflərə getdiyini izah edir.',
          `Əlaqə: ${PRIVACY_EMAIL}`,
        ],
      },
      {
        heading: '2. Hansı məlumat emal olunur',
        paragraphs: [
          'Workly ad, telefon, e-poçt, geolokasiya və ödəniş məlumatını öz serverinə toplamır.',
          'Cihazınızda lokal olaraq saxlana bilər:',
        ],
        items: [
          'yadda saxlanmış vakansiyalar və müraciət statusları;',
          'axtarış filterləri, region, dil, tema və mənbələr;',
          'yeni vakansiyalar üçün bildiriş ayarları;',
          'özünüz əlavə etdiyiniz xidmət səhifəsi, foto və mətnlər;',
          'tez-tez açılan sayt və kanallar.',
        ],
      },
      {
        heading: '',
        paragraphs: [
          'Bu məlumat telefonda qalır və bizə göndərilmir: Workly-nin istifadəçi məlumatı saxlayan öz backend-i yoxdur.',
        ],
      },
      {
        heading: '3. Vakansiya axtarışı və üçüncü tərəflər',
        paragraphs: [
          'Elan göstərmək üçün tətbiq axtarış sorğusunu (mətn, şəhər/region, filterlər) Mənbələrdə açdığınız saytların açıq API-lərinə göndərir. Tətbiqin işləməsi üçün bu lazımdır.',
          'Belə saytlara daxil ola bilər:',
        ],
        items: [
          'HeadHunter (hh.ru / hh.az);',
          'BirJob;',
          'Rusiya iş portalı (trudvsem.ru);',
          'Adzuna, Jooble, USAJobs;',
          'Arbeitnow, Remotive, Jobicy, RemoteOK, Himalayas.',
        ],
      },
      {
        heading: '',
        paragraphs: [
          'Sonrakı emal həmin xidmətlərin siyasəti ilə tənzimlənir. Vakansiya, sayt və ya Telegram kanalı açanda Workly-dən çıxırsınız və onların qaydaları keçərli olur.',
          'İstəyə bağlı tərcümə üçüncü tərəf tərcümə xidməti ilə gedir. Sorğuda elanın fraqmenti və seçilmiş dil olur.',
        ],
      },
      {
        heading: '4. Android icazələri',
        paragraphs: [],
        items: [
          'İnternet — vakansiyaların yüklənməsi və keçidlərin açılması.',
          'Bildirişlər — yalnız yeni vakansiya bildirişini açsanız. Sistemdə və ya tətbiqdə söndürmək olar.',
          'Fon yoxlaması — saxlanmış filterlər üzrə dövri axtarış. Bildirişlər lokal, cihazdadır.',
          'Foto — yalnız avatar və ya xidmət şəkli əlavə etsəniz. Fayllar cihazda qalır.',
        ],
      },
      {
        heading: '',
        paragraphs: ['Bufer yalnız sizin əməlinizlə istifadə olunur: vakansiya, kanal və ya e-poçt keçidini kopyalamaq.'],
      },
      {
        heading: '5. Uşaqlar',
        paragraphs: ['Tətbiq 13 yaşdan kiçik uşaqlar üçün nəzərdə tutulmayıb və uşaq məlumatını bilərəkdən toplamır.'],
      },
      {
        heading: '6. Reklam',
        paragraphs: [
          'Tətbiqdə Google AdMob reklamı göstərilə bilər. Reklam seçmək üçün Google reklam identifikatoru, reklamla əlaqə və cihaz haqqında texniki məlumat istifadə edə bilər. Bunu Google edir, Workly serveri yox.',
          'Google siyasəti: https://policies.google.com/privacy və AdMob köməyi: https://support.google.com/admob/answer/6128543',
        ],
      },
      {
        heading: '7. Ötürmə və satış',
        paragraphs: [
          'Şəxsi məlumat satmırıq. Axtarış parametrləri nəticə almaq üçün seçdiyiniz vakansiya saytlarına gedir. Reklamla bağlı məlumatı Google AdMob öz qaydaları ilə emal edir.',
        ],
      },
      {
        heading: '8. Saxlama və silmə',
        paragraphs: [
          'Lokal məlumatı Android ayarlarında tətbiq yaddaşını təmizləməklə və ya tətbiqi silməklə silmək olar. Bundan sonra məlumat cihazdan gedir.',
        ],
      },
      {
        heading: '9. Dəyişikliklər',
        paragraphs: ['Siyasət dəyişsə, tətbiqdəki mətni, veb səhifəni və qüvvəyə minmə tarixini yeniləyəcəyik.'],
      },
      {
        heading: '10. Əlaqə',
        paragraphs: [`Məxfilik sualları: ${PRIVACY_EMAIL}`],
      },
    ],
  },
};

export function privacyDoc(locale: AppLocale): PrivacyDoc {
  return DOCS[locale] ?? DOCS.ru;
}
