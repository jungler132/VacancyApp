import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseHhRss, parseSalaryText, parseVacancyHtml, rssSearchUrl } from '../../supabase/functions/hh/parse.ts';

const RSS = `<?xml version='1.0' encoding='utf-8'?>
<rss version="2.0"><channel>
<item>
<pubDate>2026-08-24T14:28:45.337+03:00</pubDate>
<title>Фронтенд-разработчик</title>
<link>https://hh.ru/vacancy/136554589</link>
<description><![CDATA[<p>Вакансия компании: Acme</p> <p>Регион: Москва</p> <p>Предполагаемый уровень месячного дохода: 150 000 – 200 000 ₽</p>]]></description>
</item>
</channel></rss>`;

describe('hh rss parse', () => {
  it('достаёт id, компанию, город и зарплату', () => {
    const [job] = parseHhRss(RSS);
    assert.equal(job?.id, '136554589');
    assert.equal(job?.name, 'Фронтенд-разработчик');
    assert.equal(job?.employer?.name, 'Acme');
    assert.equal(job?.area?.name, 'Москва');
    assert.equal(job?.salary?.from, 150000);
    assert.equal(job?.salary?.to, 200000);
    assert.equal(job?.salary?.currency, 'RUB');
    assert.equal(job?.alternate_url, 'https://hh.ru/vacancy/136554589');
  });

  it('собирает rss url из api-параметров', () => {
    const params = new URLSearchParams();
    params.set('text', 'react');
    params.set('per_page', '20');
    params.set('page', '1');
    params.append('area', '113');
    params.append('area', '9');
    const url = rssSearchUrl(params);
    assert.match(url, /items_on_page=20/);
    assert.match(url, /page=1/);
    assert.match(url, /area=113/);
    assert.match(url, /area=9/);
  });

  it('читает описание вакансии из html', () => {
    const html =
      '<div data-qa="vacancy-title"><h1>Dev</h1></div><div data-qa="vacancy-company-name">Nova</div><div data-qa="vacancy-description"><p>Пишите код</p></div>';
    const details = parseVacancyHtml('1', html);
    assert.equal(details.name, 'Dev');
    assert.equal((details.employer as { name: string }).name, 'Nova');
    assert.match(String(details.description), /Пишите код/);
  });

  it('parseSalaryText понимает «не указан»', () => {
    assert.equal(parseSalaryText('не указан'), null);
  });
});
