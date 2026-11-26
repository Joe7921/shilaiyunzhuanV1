import assert from 'node:assert/strict';
import test from 'node:test';
import {calendarYear, upcomingEvents, CALENDAR_YEARS, localDateKey} from './calendar.mjs';

test('each supported year contains 24 distinct terms, all six lunar festivals, and one Thanksgiving', () => {
  // Independently extracted from the Observatory's annual PDF tables.
  const pdfDates = {
    2024: [["02-10","02-24","06-10","08-10","09-17","10-11"],[6,20,4,19,5,20,4,19,5,20,5,21,6,22,7,22,7,22,8,23,7,22,6,21]],
    2025: [["01-29","02-12","05-31","08-29","10-06","10-29"],[5,20,3,18,5,20,4,20,5,21,5,21,7,22,7,23,7,23,8,23,7,22,7,21]],
    2026: [["02-17","03-03","06-19","08-19","09-25","10-18"],[5,20,4,18,5,20,5,20,5,21,5,21,7,23,7,23,7,23,8,23,7,22,7,22]],
    2027: [["02-06","02-20","06-09","08-08","09-15","10-08"],[5,20,4,19,6,21,5,20,6,21,6,21,7,23,8,23,8,23,8,23,7,22,7,22]],
    2028: [["01-26","02-09","05-28","08-26","10-03","10-26"],[6,20,4,19,5,20,4,19,5,20,5,21,6,22,7,22,7,22,8,23,7,22,6,21]],
    2029: [["02-13","02-27","06-16","08-16","09-22","10-16"],[5,20,3,18,5,20,4,20,5,21,5,21,7,22,7,23,7,23,8,23,7,22,7,21]],
    2030: [["02-03","02-17","06-05","08-05","09-12","10-05"],[5,20,4,18,5,20,5,20,5,21,5,21,7,23,7,23,7,23,8,23,7,22,7,22]],
    2031: [["01-23","02-06","06-24","08-24","10-01","10-24"],[5,20,4,19,6,21,5,20,6,21,6,21,7,23,8,23,8,23,8,23,7,22,7,22]],
    2032: [["02-11","02-25","06-12","08-12","09-19","10-12"],[6,20,4,19,5,20,4,19,5,20,5,21,6,22,7,22,7,22,8,23,7,22,6,21]],
    2033: [["01-31","02-14","06-01","08-01","09-08","10-01"],[5,20,3,18,5,20,4,20,5,21,5,21,7,22,7,23,7,23,8,23,7,22,7,21]],
    2034: [["02-19","03-05","06-20","08-20","09-27","10-20"],[5,20,4,18,5,20,5,20,5,21,5,21,7,23,7,23,7,23,8,23,7,22,7,22]],
    2035: [["02-08","02-22","06-10","08-10","09-16","10-09"],[5,20,4,19,6,21,5,20,5,21,6,21,7,23,7,23,8,23,8,23,7,22,7,22]],
    2036: [["01-28","02-11","05-30","08-28","10-04","10-27"],[6,20,4,19,5,20,4,19,5,20,5,21,6,22,7,22,7,22,8,23,7,22,6,21]],
  };
  const festivals = {'spring-festival':'1-1',lantern:'1-15','dragon-boat':'5-5',qixi:'7-7','mid-autumn':'8-15','double-ninth':'9-9'};
  for(const year of CALENDAR_YEARS) {
    const yearEvents = calendarYear(year);
    assert.equal(yearEvents.length,36);
    assert.equal(new Set(yearEvents.map(e=>e.id)).size,36);
    assert.equal(yearEvents.filter(e=>e.kind === 'term').length,24);
    assert.equal(yearEvents.filter(e=>e.isFestival).length,14);
    assert.deepEqual(yearEvents.map(e=>e.date),yearEvents.map(e=>e.date).sort());
    assert(yearEvents.every(e=>e.menu.length && e.date.startsWith(String(year))));
    const actualLunar = Object.keys(festivals).map(id => yearEvents.find(e=>e.id === id).date.slice(5));
    const actualTerms = yearEvents.filter(e=>e.kind === 'term').map(e=>Number(e.date.slice(8)));
    assert.deepEqual([actualLunar, actualTerms],pdfDates[year],String(year));
    const thanksgiving = new Date(yearEvents.find(e=>e.id === 'thanksgiving').date+'T12:00:00Z');
    assert.equal(thanksgiving.getUTCDay(),4);
    assert(thanksgiving.getUTCDate() >= 22 && thanksgiving.getUTCDate() <= 28);
  }
});

test('2026 calendar matches official table, differing term dates are read per year', () => {
  const y=calendarYear(2026);
  const expect=(name,date)=>assert.equal(y.find(e=>e.name === name).date,'2026-'+date);
  expect('春节','02-17');expect('元宵节','03-03');expect('清明','04-05');expect('端午节','06-19');
  expect('七夕节','08-19');expect('中秋节','09-25');expect('重阳节','10-18');expect('冬至','12-22');
  assert.equal(calendarYear(2025).find(e=>e.name==='冬至').date,'2025-12-21');
  assert.deepEqual(calendarYear(2099),[]);
});

test('nearest events include today, roll into next year, remove duplicates and retain birthday on ties', () => {
  assert.equal(upcomingEvents('2026-11-26')[0].name,'感恩节');
  assert.equal(upcomingEvents('2026-11-26')[0].daysUntil,0);
  assert.deepEqual(upcomingEvents('2026-12-31','2001-12-31',3).map(e=>[e.name,e.daysUntil]),[['生日',0],['跨年夜',0],['元旦',1]]);
  assert.deepEqual(upcomingEvents('2026-04-05').filter(e=>e.date==='2026-04-05').map(e=>e.name),['清明']);
  assert.deepEqual(upcomingEvents('2026-02-30'),[]);
  assert.deepEqual(upcomingEvents('2099-01-01'),[]);
  assert.deepEqual(upcomingEvents('2026-03-03','',0),[]);
  assert.deepEqual(upcomingEvents('2036-12-31').map(e=>e.name),['跨年夜']);
});

test('birthday is optional and valid across leap-year boundaries', () => {
  const birthday=(year,input)=>calendarYear(year,input).find(e=>e.kind === 'birthday')?.date;
  assert.equal(birthday(2026,'2004-02-29'),undefined);
  assert.equal(birthday(2028,'2004-02-29'),'2028-02-29');
  assert.equal(birthday(2028,'2029-02-28'),undefined);
  assert.equal(birthday(2028,'2004-02-30'),undefined);
  assert.equal(birthday(2028),undefined);
  assert.equal(localDateKey(new Date(2026,10,26,0,1)), '2026-11-26');
});
