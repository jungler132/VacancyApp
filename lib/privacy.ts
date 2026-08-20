import type { AppLocale } from '@/lib/i18n/locale';
import { SUPPORT_EMAIL } from '@/lib/support';

export const PRIVACY_HREF = '/privacy';
export const PRIVACY_URL = 'https://jungler132.github.io/VacancyApp/';
export const PRIVACY_EMAIL = SUPPORT_EMAIL;
export const PRIVACY_UPDATED = '2026-08-20';

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
        updated: 'Приложение Workly (Android, пакет com.workly.app). Дата вступления в силу: 20 августа 2026 г.',
    blocks: [
      {
        heading: '1. Кто мы и о чём эта политика',
        paragraphs: [
          'Workly — мобильный агрегатор вакансий. Приложение показывает объявления с публичных площадок, даёт сохранить интересные вакансии, вести страницу услуг и настроить локальные оповещения о новых предложениях.',
          'Гостевой режим работает без аккаунта, офлайн, на устройстве. По желанию можно войти по почте (код или ссылка) или анонимно и затем привязать почту — тогда страница услуг, фото и свои вакансии Workly синхронизируются с сервером. Бесплатная версия показывает рекламу Google AdMob.',
          `Контакт: ${PRIVACY_EMAIL}`,
        ],
      },
      {
        heading: '2. Какие данные обрабатываются',
        paragraphs: [
          'Workly не собирает платёжные данные. Имя, почта, телефон, тексты и фото страницы услуг обрабатываются, только если вы их сами указали.',
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
          'Без входа эти данные остаются на телефоне. После входа страница услуг, фото (в сжатом виде), свои вакансии Workly, канбан, фильтры, алерты, тема, язык и размер шрифта сохраняются в облаке провайдера бэкенда (Supabase) под вашим идентификатором. Публичный профиль услуг и свои вакансии могут видеть другие пользователи приложения. Неподобающий контент можно пожаловаться из приложения — жалобы уходят в поддержку.',
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
          'Фото — только если вы сами добавляете аватар или снимки услуги. Перед отправкой на сервер файл сжимается на устройстве.',
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
          'В бесплатной версии показывается реклама Google AdMob: полноэкранная при открытии чужой вакансии или услуги (не каждый раз) и баннер в ленте вакансий и услуг. Чтобы подобрать объявления, Google может использовать рекламный идентификатор устройства, данные о взаимодействии с рекламой и техническую информацию об устройстве. Это делает Google, а не сервер Workly.',
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
          'Локальные данные можно удалить, очистив хранилище приложения в настройках Android или удалив само приложение. Данные аккаунта на сервере удаляются вместе с пользователем (выход не стирает облако; удаление аккаунта — по запросу на контактный email).',
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
        updated: 'Workly app (Android, package com.workly.app). Effective date: 20 August 2026.',
    blocks: [
      {
        heading: '1. Who we are',
        paragraphs: [
          'Workly is a mobile job aggregator. It shows listings from public boards, lets you save jobs, keep a services page, and set local alerts for new listings.',
          'Guest mode works without an account, offline, on the device. You can sign in with email (code or magic link) or anonymously and later link email — then your services page, photos and Workly jobs sync to the server. The free version shows Google AdMob ads.',
          `Contact: ${PRIVACY_EMAIL}`,
        ],
      },
      {
        heading: '2. What data is processed',
        paragraphs: [
          'Workly does not collect payment data. Name, email, phone, texts and service photos are processed only if you add them yourself.',
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
          'Without sign-in this data stays on the phone. After sign-in the services page, compressed photos, your Workly jobs, kanban, filters, alerts, theme, language and font size are stored in the backend provider (Supabase) under your user id. Your public services profile and Workly jobs may be visible to other users of the app. Inappropriate content can be reported from the app — reports go to support.',
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
          'Photos — only if you add an avatar or service photos. Files are compressed on the device before upload.',
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
          'The free version shows Google AdMob ads: a full-screen ad when you open someone else’s job or service (not every time) and a banner in the jobs and services feeds. To serve ads, Google may use the advertising ID, ad interaction data and device information. That is done by Google, not by a Workly server.',
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
          'You can delete local data by clearing the app storage in Android settings or by uninstalling the app. Account data on the server is removed with the user (sign-out does not wipe the cloud; account deletion is by email to the contact address).',
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
        updated: 'Workly tətbiqi (Android, paket com.workly.app). Qüvvəyə minmə tarixi: 20 avqust 2026.',
    blocks: [
      {
        heading: '1. Biz kimik',
        paragraphs: [
          'Workly vakansiyaların mobil aqreqatorudur. Tətbiq açıq saytlardan elan göstərir, vakansiyanı yadda saxlamağa, xidmət səhifəsi tutmağa və yeni elanlar üçün lokal bildiriş qurmağa imkan verir.',
          'Qonaq rejim hesab olmadan, oflayn, cihazda işləyir. İstəsəniz e-poçt (kod və ya keçid) və ya anonim giriş, sonra e-poçt bağlamaq olar — o zaman xidmət səhifəsi, foto və Workly vakansiyaları serverə sinxron olur. Pulsuz versiyada Google AdMob reklamı göstərilir.',
          `Əlaqə: ${PRIVACY_EMAIL}`,
        ],
      },
      {
        heading: '2. Hansı məlumat emal olunur',
        paragraphs: [
          'Workly ödəniş məlumatını toplamır. Ad, e-poçt, telefon, mətn və xidmət fotoları yalnız siz özünüz yazsanız emal olunur.',
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
          'Giriş olmadan bu məlumat telefonda qalır. Girişdən sonra xidmət səhifəsi, sıxılmış fotolar, öz Workly vakansiyaları, kanban, filterlər, bildirişlər, tema, dil və şrift ölçüsü backend provayderində (Supabase) sizin identifikatorunuzla saxlanır. İctimai xidmət profili və Workly vakansiyaları tətbiqin digər istifadəçilərinə görünə bilər. Uyğunsuz məzmunu tətbiqdən şikayət etmək olar — şikayətlər dəstəyə gedir.',
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
          'Foto — yalnız avatar və ya xidmət şəkli əlavə etsəniz. Serverə göndərməzdən əvvəl fayl cihazda sıxılır.',
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
          'Pulsuz versiyada Google AdMob reklamı göstərilir: başqasının vakansiyasını və ya xidmətini açanda tam ekran (hər dəfə yox) və vakansiya/xidmət lentində banner. Reklam seçmək üçün Google reklam identifikatoru, reklamla əlaqə və cihaz haqqında texniki məlumat istifadə edə bilər. Bunu Google edir, Workly serveri yox.',
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
          'Lokal məlumatı Android ayarlarında tətbiq yaddaşını təmizləməklə və ya tətbiqi silməklə silmək olar. Serverdəki hesab məlumatı istifadəçi ilə silinir (çıxış buludu silmir; hesabın silinməsi əlaqə e-poçtuna sorğu ilə).',
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
