'use strict';
// Publish only the validated public JSON; do not touch the website source branch.
const fs = require('node:fs/promises');
const { validateData } = require('../github-activity.js');
async function publishActivity(data, { token, repository, fetcher = fetch }) {
  if (!token || repository?.toLowerCase() !== 'shnnleiogrmn/shnnleiogrmn.github.io') throw new Error('Activity publication is restricted to the configured portfolio repository.');
  const content = JSON.stringify(validateData(data),null,2)+'\n';
  const base = `https://api.github.com/repos/${repository}`;
  async function request(path,method='GET',body) {
    const result = await fetcher(`${base}${path}`,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2026-03-10'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
    if (result.status === 404 && method === 'GET') return null;
    if (!result.ok) throw new Error(`Public activity publication failed (HTTP ${result.status}).`);
    return result.json();
  }
  const ref = await request('/git/ref/heads/activity-data');
  const tree = await request('/git/trees','POST',{tree:[{path:'github-activity.json',mode:'100644',type:'blob',content}]});
  const commit = await request('/git/commits','POST',{message:'Refresh public GitHub activity',tree:tree.sha,parents:ref?[ref.object.sha]:[],author:{name:'github-actions[bot]',email:'41898282+github-actions[bot]@users.noreply.github.com'}});
  if (ref) await request('/git/refs/heads/activity-data','PATCH',{sha:commit.sha,force:false});
  else await request('/git/refs','POST',{ref:'refs/heads/activity-data',sha:commit.sha});
}
if (require.main === module) fs.readFile(process.argv[2],'utf8').then(JSON.parse).then(data=>publishActivity(data,{token:process.env.GITHUB_TOKEN,repository:process.env.GITHUB_REPOSITORY})).then(()=>process.stdout.write('Public activity-data branch updated.\n')).catch(error=>{process.stderr.write(`${error.message}\n`);process.exitCode=1;});
module.exports = { publishActivity };
