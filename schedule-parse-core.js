(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ScheduleParser=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
 const weekdays=['sun','mon','tue','wed','thu','fri','sat'];
 const pad=n=>String(n).padStart(2,'0');
 function validDate(y,m,d){const date=new Date(Date.UTC(y,m-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d}
 function clean(v){return v.replace(/^[\s,|:;@\-–—]+|[\s,|:;\-–—]+$/g,'').trim()}
 function token(raw){const m=raw.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?m?\.?$/i);if(!m)return null;const h=+m[1],min=+(m[2]||0),period=(m[3]||'').toLowerCase();if(min>59||h>23||(period&&(h<1||h>12)))return null;return{h,min,period,colon:!!m[2]}}
 function time(t,period){return pad(period?(t.h%12)+(period==='p'?12:0):t.h)+':'+pad(t.min)}
 function parse(text,year,month,options={}){
  year=Number(year);month=Number(month);if(!Number.isInteger(year)||year<2000||year>2100||!Number.isInteger(month)||month<1||month>12)throw Error('Choose the month and year for this post.');
  if(typeof text!=='string'||text.length>50000)throw Error('Paste up to 50,000 characters at a time.');
  const rows=[],unparsed=[],warnings=[];const names=months.map(m=>m.slice(0,3)+'(?:'+m.slice(3)+')?').join('|');
  const clock='\\d{1,2}(?::\\d{2})?\\s*(?:[ap]\\.?m\\.?)?';
  const range=new RegExp('(?:^|[\\s(@,])('+clock+')\\s*(?:[-–—]|to)\\s*('+clock+')(?![\\w:])','i');
  text.split(/\r?\n/).forEach((source,index)=>{
   let s=source.replace(/[\u00a0\u202f]/g,' ').replace(/^[^\p{L}\p{N}]+/u,'').trim();if(!s)return;
   if(new RegExp('^(?:'+names+')(?:\\s+(20\\d{2}))?(?:\\s+(?:shows|gigs|dates|schedule))?\\s*[:!]?$', 'i').test(s)){
    const header=s.match(new RegExp('^('+names+')','i'))[1],hm=months.findIndex(m=>m.startsWith(header.toLowerCase().slice(0,3)))+1,hy=s.match(/20\d{2}/)?.[0];
    if(hm!==month||(hy&&+hy!==year))warnings.push('The post heading says '+s+'. Check the selected month and year.');return;
   }
   const weekday=s.match(/^(sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\b[.,]?\s*/i);if(weekday)s=s.slice(weekday[0].length);
   let match,y=year,m=month,d;
   if((match=s.match(/^(20\d{2})-(\d{1,2})-(\d{1,2})(?!\d)/))){y=+match[1];m=+match[2];d=+match[3]}
   else if((match=s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}|\d{2}))?(?!\d)/))){m=+match[1];d=+match[2];if(match[3])y=match[3].length===2?2000+(+match[3]):+match[3]}
   else if((match=s.match(new RegExp('^('+names+')\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(20\\d{2}))?(?!\\d)','i')))){m=months.findIndex(n=>n.startsWith(match[1].toLowerCase().slice(0,3)))+1;d=+match[2];if(match[3])y=+match[3]}
   else if((match=s.match(/^(\d{1,2})(?:st|nd|rd|th)?(?!\d)\b[.)]?/i))){d=+match[1]}
   else{unparsed.push({line:index+1,text:source});return;}
   const issues=[];let date='';if(validDate(y,m,d))date=y+'-'+pad(m)+'-'+pad(d);else issues.push('Invalid date — enter the correct date.');
   if(m!==month||y!==year)issues.push('Date is outside the selected month. Check it.');
   if(weekday&&date&&weekdays[new Date(Date.UTC(y,m-1,d)).getUTCDay()]!==weekday[1].slice(0,3).toLowerCase())issues.push('Weekday does not match this date. Check the month and year.');
   let rest=clean(s.slice(match[0].length)),start='',end='';const times=rest.match(range);
   if(times){const a=token(times[1]),b=token(times[2]);if(a&&b){
     let ap=a.period,bp=b.period;
     if(ap&&!bp){bp=ap;if(b.h%12<a.h%12)bp=ap==='a'?'p':'a';issues.push('AM/PM inferred from the start time — verify both times.');}
     else if(!ap&&bp){ap=bp;if(a.h%12>b.h%12)ap=bp==='a'?'p':'a';issues.push('AM/PM inferred from the end time — verify both times.');}
     if(ap&&bp){start=time(a,ap);end=time(b,bp)}
     else if(a.colon&&b.colon&&(a.h>12||b.h>12||a.h===0||b.h===0)){start=time(a,'');end=time(b,'')}
     else if(['a','p'].includes(options.defaultPeriod)){ap=options.defaultPeriod;bp=b.h%12<a.h%12?(ap==='a'?'p':'a'):ap;start=time(a,ap);end=time(b,bp);issues.push('Using your selected '+(ap==='p'?'PM':'AM')+' start default — verify both times.');}
     else issues.push('AM/PM is unclear — enter the start and end times.');
    }else issues.push('Time could not be read — enter it.');
    rest=clean(rest.slice(0,times.index)+' '+rest.slice(times.index+times[0].length));
   }else{
    const one=rest.match(/(?:^|[\s(@,])(\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?)(?!\w)/i);if(one){const t=token(one[1]);if(t)start=time(t,t.period);rest=clean(rest.slice(0,one.index)+' '+rest.slice(one.index+one[0].length));}else issues.push('Start time missing — enter it.');
   }
   rest=rest.replace(/^(?:at\s+|@\s*)/i,'').replace(/\s*\(\s*\)\s*$/,'').trim();
   const parts=rest.split(/\s+[|–—-]\s+|,\s*/).map(clean).filter(Boolean);let venue=parts.shift()||'',location=parts.join(', ');
   // Only split unmarked towns explicitly supplied by the musician. A venue
   // can legitimately contain a town name, so never guess from a global list.
   if(!location&&Array.isArray(options.towns)){
    const towns=[...new Set(options.towns.filter(t=>typeof t==='string').map(t=>t.trim()).filter(Boolean))].sort((a,b)=>b.length-a.length);
    for(const town of towns){
     const at=venue.length-town.length;
     if(at>0&&/\s/.test(venue[at-1])&&venue.slice(at).toLocaleLowerCase()===town.toLocaleLowerCase()){
      location=venue.slice(at);venue=venue.slice(0,at).trim();issues.push('Trailing town separated using your town list — verify venue and town.');break;
     }
    }
   }
   if(!venue)issues.push('Venue missing — enter it.');if(start&&end&&start===end)issues.push('Start and end are the same — correct or clear the end time.');
   rows.push({show_date:date,start_time:start,end_time:end,venue_name:venue,location,source_text:source.slice(0,4000),issues,line:index+1});
  });
  if(rows.length>100)throw Error('Review up to 100 shows at a time. Paste a smaller section.');
  return{rows,unparsed,warnings};
 }
 return{parse,validDate};
});
