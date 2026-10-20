const {test} = require('node:test');
const assert = require('node:assert/strict');
const { DAY, validateData, calendarWeeks, contributionLevel, isStale, readCache, loadActivity } = require('../github-activity.js');
const { collectActivity } = require('../scripts/refresh-github.cjs');
const { publishActivity } = require('../scripts/publish-activity.cjs');
// Synthetic data is restricted to tests, never the live calendar or workflow output.
const { snapshot } = require('./activity-fixture.cjs');
test('365-day validation spans leap years and year boundaries without local timezone drift',()=>{
  for(const end of ['2026-01-01','2024-12-31','2024-02-29']) { const data=snapshot(end);assert.equal(validateData(data).days.length,365);assert.equal(data.days.at(-1).date,end); }
  assert.ok(snapshot('2024-12-31').days.some(day=>day.date==='2024-02-29'));
});
test('padding is blank, preserves every date and forms complete Sunday-first weeks',()=>{
  for(let offset=0;offset<7;offset++){
    const date=new Date(Date.parse('2026-10-21T00:00:00Z')+offset*DAY).toISOString().slice(0,10);
    const data=snapshot(date),weeks=calendarWeeks(data.days),cells=weeks.flat();
    assert.equal(cells.length%7,0);assert.deepEqual(cells.filter(Boolean),data.days);
    assert.equal(cells.indexOf(data.days[0]),new Date(`${data.windowStart}T00:00:00Z`).getUTCDay());
  }
});
test('rejects missing dates, duplicates, invalid dates, totals, counts and levels',()=>{
  for(const mutate of [d=>d.days.pop(),d=>d.days[1].date=d.days[0].date,d=>d.days[0].date='2026-02-30',d=>d.totalContributions++,d=>d.days[0].count=-1,d=>d.days[0].level=8,d=>d.days[0].level=0]){const data=snapshot();mutate(data);assert.throws(()=>validateData(data));}
});
test('intensity maps only the five official GitHub levels',()=>{
  ['NONE','FIRST_QUARTILE','SECOND_QUARTILE','THIRD_QUARTILE','FOURTH_QUARTILE'].forEach((level,i)=>assert.equal(contributionLevel(level),i));
  assert.throws(()=>contributionLevel('GREEN'));
});
test('repository output drops unsafe or unrelated links and limits metadata',()=>{
  const data=snapshot();data.repositories.push({name:'bad',url:'javascript:alert(1)',updatedAt:data.generatedAt},{name:'Other',url:'https://github.com/other/Other',updatedAt:data.generatedAt});
  assert.equal(validateData(data).repositories.length,1);
});
test('cache expiry, corrupt data, future cache timestamps and stale snapshots are explicit',()=>{
  const data=snapshot(),now=Date.parse(data.generatedAt)+1000;
  assert.equal(readCache(JSON.stringify({cachedAt:now-3599999,data}),now).fresh,true);
  assert.equal(readCache(JSON.stringify({cachedAt:now-3600000,data}),now).fresh,false);
  assert.equal(readCache('{broken',now),null);assert.equal(readCache(JSON.stringify({cachedAt:now+1,data}),now),null);
  assert.equal(isStale(data,Date.parse(data.generatedAt)+48*3600000),false);
  assert.equal(isStale(data,Date.parse(data.generatedAt)+48*3600000+1),true);
});
test('fresh cache avoids requests; successful fetch validates and replaces expired cache',async()=>{
  const data=snapshot(),now=Date.parse(data.generatedAt)+1000;let calls=0;
  const fetcher=async()=>{calls++;return{ok:true,json:async()=>data};};
  const cached=await loadActivity({source:'https://example.com/data',rawCache:JSON.stringify({cachedAt:now,data}),fetcher,now});assert.equal(cached.cached,true);assert.equal(calls,0);
  const updated=await loadActivity({source:'https://example.com/data',rawCache:JSON.stringify({cachedAt:now-3600001,data}),fetcher,now});assert.equal(updated.cached,false);assert.equal(calls,1);
});
test('failed or malformed refresh retains valid cache and never generates fake zero data',async()=>{
  const data=snapshot(),now=Date.parse(data.generatedAt)+3600001,rawCache=JSON.stringify({cachedAt:now-3600001,data});
  for(const fetcher of [async()=>{throw Error('offline');},async()=>({ok:false}),async()=>({ok:true,json:async()=>({})})]){
    const result=await loadActivity({source:'https://example.com/data',rawCache,fetcher,now});assert.equal(result.offline,true);assert.equal(result.data.totalContributions,data.totalContributions);
    await assert.rejects(loadActivity({source:'https://example.com/data',fetcher,now}));
  }
});
test('timeout aborts fetch and preserves the same cache fallback',async()=>{
  const data=snapshot(),now=Date.parse(data.generatedAt)+3600001;
  const fetcher=(_url,{signal})=>new Promise((_ok,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));
  await assert.rejects(loadActivity({source:'https://example.com',fetcher,now,timeout:5}),/Aborted/);
  assert.equal((await loadActivity({source:'https://example.com',fetcher,now,timeout:5,rawCache:JSON.stringify({cachedAt:0,data})})).offline,true);
});
test('collector queries official endpoints, strips private/fork data, and refuses missing secret',async()=>{
  const data=snapshot();let calls=0;
  const fetcher=async(url,options)=>{calls++;assert.ok(options.headers.Authorization);return{ok:true,json:async()=>url.endsWith('/graphql')?{data:{user:{contributionsCollection:{contributionCalendar:{weeks:[{contributionDays:data.days.map(day=>({date:day.date,contributionCount:day.count,contributionLevel:['NONE','FIRST_QUARTILE','SECOND_QUARTILE'][day.level]}))}]}}}}}:[]};};
  const mock=async(url,options)=>url.includes('/repos?')?{ok:true,json:async()=>[{name:'Example',html_url:data.repositories[0].url,updated_at:data.generatedAt,owner:{login:'Shnnleiogrmn'},private:false,fork:false},{name:'Private',private:true,owner:{login:'shnnleiogrmn'}},{name:'Fork',fork:true,owner:{login:'shnnleiogrmn'}}]}:fetcher(url,options);
  const result=await collectActivity('test-token',mock,new Date(data.generatedAt));assert.equal(result.days.length,365);assert.equal(result.repositories.length,1);assert.equal(calls,1);
  await assert.rejects(collectActivity('',mock),/GH_ACTIVITY_TOKEN/);
});
test('publisher writes only the data branch, uses bot identity, and does not force update',async()=>{
  const data=snapshot(),requests=[];
  const fetcher=async(url,options)=>{requests.push({url,options});const body=url.endsWith('/git/ref/heads/activity-data')?{object:{sha:'old'}}:url.endsWith('/git/trees')?{sha:'tree'}:{sha:'commit'};return{ok:true,status:200,json:async()=>body};};
  await publishActivity(data,{token:'test-token',repository:'Shnnleiogrmn/Shnnleiogrmn.github.io',fetcher});
  const tree=JSON.parse(requests[1].options.body);assert.equal(tree.tree.length,1);assert.equal(tree.tree[0].path,'github-activity.json');assert.ok(!tree.tree[0].content.includes('test-token'));
  const commit=JSON.parse(requests[2].options.body);assert.equal(commit.author.name,'github-actions[bot]');assert.deepEqual(commit.parents,['old']);
  assert.equal(JSON.parse(requests[3].options.body).force,false);assert.ok(requests[3].url.endsWith('/git/refs/heads/activity-data'));
});


test('first publication creates an isolated root commit and a data-only branch',async()=>{
  const requests=[];
  const fetcher=async(url,options)=>{requests.push({url,options});if(url.endsWith('/git/ref/heads/activity-data'))return{ok:false,status:404};return{ok:true,status:201,json:async()=>({sha:url.endsWith('/git/trees')?'tree':'commit'})};};
  await publishActivity(snapshot(),{token:'test-token',repository:'Shnnleiogrmn/Shnnleiogrmn.github.io',fetcher});
  assert.deepEqual(JSON.parse(requests[2].options.body).parents,[]);
  assert.equal(JSON.parse(requests[3].options.body).ref,'refs/heads/activity-data');
  assert.ok(!requests.some(request=>request.url.endsWith('/git/refs/heads/main')));
});
test('publication refuses another repository and reports conflicts without forcing',async()=>{
  await assert.rejects(publishActivity(snapshot(),{token:'test-token',repository:'someone/another-repo'}),/restricted/);
  const fetcher=async(url)=>url.endsWith('/git/ref/heads/activity-data')?{ok:true,status:200,json:async()=>({object:{sha:'old'}})}:url.endsWith('/git/trees')?{ok:true,status:201,json:async()=>({sha:'tree'})}:url.endsWith('/git/commits')?{ok:true,status:201,json:async()=>({sha:'commit'})}:{ok:false,status:409};
  await assert.rejects(publishActivity(snapshot(),{token:'test-token',repository:'Shnnleiogrmn/Shnnleiogrmn.github.io',fetcher}),/409/);
});
