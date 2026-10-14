import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildTaskSearch, SearchSyntaxError} from '../dist/services/taskSearch.js';
const data = [
 {id:'1', owner:'alice', title:'Website Update', description:'Project report', completed:false, category:'Urgent', dueDate:'2026-12-10'},
 {id:'2', owner:'alice', title:'Team meeting', description:'Website update review', completed:true, category:'Important', dueDate:'2026-12-20'},
 {id:'3', owner:'alice', title:'a.*+[x]', description:'old task', completed:false, category:'Important', dueDate:''},
 {id:'4', owner:'bob', title:'Website Update', description:'Project report', completed:false, category:'Urgent', dueDate:'2026-12-10'},
 {id:'5', owner:'alice', title:'Legacy task', description:'no due date', completed:false},
];
function matches(task, clause) {
 return Object.entries(clause).every(([field, value]) => {
  if (field === '$and') return value.every(c => matches(task,c));
  if (field === '$or') return value.some(c => matches(task,c));
  if (field === '$nor') return !value.some(c => matches(task,c));
  if (!value || typeof value !== 'object') return task[field] === value;
  if ('$regex' in value) return new RegExp(value.$regex,value.$options).test(task[field] || '');
  return Object.entries(value).every(([operator, expected]) => ({
   $exists: () => (task[field] !== undefined) === expected,
   $ne: () => task[field] !== expected,
   $lt: () => task[field] < expected,
   $gt: () => task[field] > expected,
  })[operator]());
 });
}
const find = query => data.filter(task => matches(task,{owner:'alice', $and:buildTaskSearch(query)})).map(t => t.id);
for (const [query, expected] of [
 ['', ['1','2','3','5']], ['website', ['1','2']], ['WEBSITE report', ['1']],
 ['"website update"', ['1','2']], ['title:"website update"', ['1']],
 ['description:"website update"', ['2']], ['is:pending tag:urgent website', ['1']],
 ['is:completed', ['2']], ['tag:IMPORTANT', ['2','3']], ['-meeting', ['1','3','5']],
 ['-is:completed -tag:urgent', ['3','5']], ['-"website update"', ['3','5']],
 ['after:2026-12-09 before:2026-12-20', ['1']], ['before:2026-12-10', []],
 ['after:2026-12-20', []], ['a.*+[x]', ['3']], ['.', ['3']],
 ['is:pending is:completed', []], ['https://example.com', []],
]) test('search '+JSON.stringify(query), () => assert.deepEqual(find(query), expected));
for(const query of ['is:unknown','tag:other','before:2026-02-30','after:invalid','title:','"unclosed phrase','title:"unclosed phrase']) {
 test('reject '+JSON.stringify(query), () => assert.throws(() => buildTaskSearch(query), SearchSyntaxError));
}
test('every regex metacharacter is escaped literally', () => {
 for (const value of ['\\','.','*','+','?','^','$','{','}','(',')','|','[',']']) {
  const regex = buildTaskSearch(value)[0].$or[0].title;
  assert.equal(new RegExp(regex.$regex,regex.$options).test(value),true);
  assert.equal(new RegExp(regex.$regex,regex.$options).test('unrelated text'),false);
 }
});
