const { DAY } = require('../github-activity.js');
function snapshot(end = '2026-10-21') {
  const last = Date.parse(`${end}T00:00:00Z`), first = last - 364*DAY;
  const days = Array.from({length:365},(_,i)=>({date:new Date(first+i*DAY).toISOString().slice(0,10),count:i%19===0?2:0,level:i%19===0?2:0}));
  return {schemaVersion:1,username:'shnnleiogrmn',generatedAt:`${end}T01:00:00.000Z`,windowStart:days[0].date,windowEnd:end,totalContributions:days.reduce((n,d)=>n+d.count,0),days,repositories:[{name:'Example',url:'https://github.com/shnnleiogrmn/Example',description:'Test fixture only',language:'JavaScript',updatedAt:`${end}T00:00:00Z`}]};
}


module.exports = { snapshot };
