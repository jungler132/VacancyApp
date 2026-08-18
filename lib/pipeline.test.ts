import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { nextApplyStatus } from './apply';
import { jobsForStatus, makeTrackedJob, pipelineStats, sourceNameFromUrl } from './pipeline';

describe('pipeline', () => {
  it('собирает вакансию вручную и читает источник из ссылки', () => {
    const job = makeTrackedJob({
      title: 'React Native Developer',
      company: 'Acme',
      url: 'linkedin.com/jobs/view/1',
    });
    assert.equal(job.sourceId, 'manual');
    assert.match(job.id, /^track:/);
    assert.equal(job.url, 'https://linkedin.com/jobs/view/1');
    assert.equal(job.sourceName, 'linkedin.com');
    assert.equal(sourceNameFromUrl(''), 'Manual');
  });

  it('считает воронку за месяц и лучший источник', () => {
    const jobs = [
      makeTrackedJob({ title: 'A', company: 'One', url: 'https://hh.ru/1' }),
      makeTrackedJob({ title: 'B', company: 'Two', url: 'https://hh.ru/2' }),
      makeTrackedJob({ title: 'C', company: 'Three', url: 'https://linkedin.com/3' }),
    ];
    const statuses = {
      [jobs[0]!.id]: 'applied',
      [jobs[1]!.id]: 'interview',
      [jobs[2]!.id]: 'rejected',
    } as const;
    const now = Date.parse('2026-08-18T12:00:00.000Z');
    const stats = pipelineStats(jobs, { ...statuses }, {
      [jobs[0]!.id]: '2026-08-01T00:00:00.000Z',
      [jobs[1]!.id]: '2026-08-10T00:00:00.000Z',
      [jobs[2]!.id]: '2026-06-01T00:00:00.000Z',
    }, now);
    assert.equal(stats.total, 2);
    assert.equal(stats.replies, 1);
    assert.equal(stats.bestSource, 'hh.ru');
    assert.equal(jobsForStatus(jobs, { ...statuses }, 'interview').length, 1);
  });

  it('двигает живые статусы вперёд и не двигает отказ', () => {
    assert.equal(nextApplyStatus('applied'), 'review');
    assert.equal(nextApplyStatus('test'), 'offer');
    assert.equal(nextApplyStatus('offer'), null);
    assert.equal(nextApplyStatus('rejected'), null);
  });
});
