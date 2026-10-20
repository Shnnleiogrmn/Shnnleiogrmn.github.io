'use strict';
const fs = require('node:fs/promises');
const { validateData, contributionLevel, DAY } = require('../github-activity.js');
const USER = 'shnnleiogrmn';
async function collectActivity(token, fetcher = fetch, now = new Date()) {
  if (!token) throw new Error('Configure the GH_ACTIVITY_TOKEN repository secret before refreshing activity.');
  const end = new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
  const start = new Date(end.getTime() - 364 * DAY);
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' };
  const query = `query($login:String!,$from:DateTime!,$to:DateTime!){ user(login:$login){ contributionsCollection(from:$from,to:$to){ contributionCalendar{ weeks{ contributionDays{ date contributionCount contributionLevel } } } } } }`;
  async function request(url, options = {}) {
    const response = await fetcher(url,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(20000)});
    if (!response.ok) throw new Error(`GitHub activity request failed (HTTP ${response.status}).`);
    return response.json();
  }
  const [calendar, repos] = await Promise.all([
    request('https://api.github.com/graphql',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,variables:{login:USER,from:start.toISOString(),to:now.toISOString()}})}),
    request(`https://api.github.com/users/${USER}/repos?type=owner&sort=updated&direction=desc&per_page=100`)
  ]);
  const weeks = calendar.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  if (calendar.errors || !Array.isArray(weeks) || !Array.isArray(repos)) throw new Error('GitHub did not return a valid public activity snapshot.');
  const windowStart = start.toISOString().slice(0,10), windowEnd = end.toISOString().slice(0,10);
  const days = weeks.flatMap(week=>week.contributionDays).filter(day=>day.date>=windowStart&&day.date<=windowEnd).sort((a,b)=>a.date.localeCompare(b.date)).map(day=>({date:day.date,count:day.contributionCount,level:contributionLevel(day.contributionLevel)}));
  const repositories = repos.filter(repo=>!repo.fork&&!repo.private&&repo.owner?.login?.toLowerCase()===USER).slice(0,4).map(repo=>({name:repo.name,url:repo.html_url,description:repo.description||'',language:repo.language||'',updatedAt:repo.updated_at}));
  return validateData({schemaVersion:1,username:USER,generatedAt:now.toISOString(),windowStart,windowEnd,totalContributions:days.reduce((sum,day)=>sum+day.count,0),days,repositories});
}
if (require.main === module) {
  const output = process.argv[2];
  if (!output) { process.stderr.write('Usage: node scripts/refresh-github.cjs <output-json>\n'); process.exitCode=1; }
  else collectActivity(process.env.GH_ACTIVITY_TOKEN).then(data=>fs.writeFile(output,JSON.stringify(data,null,2)+'\n')).then(()=>process.stdout.write('Validated public activity snapshot created.\n')).catch(error=>{process.stderr.write(`${error.message}\n`);process.exitCode=1;});
}
module.exports = { collectActivity };
